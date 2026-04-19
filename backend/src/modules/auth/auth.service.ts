import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { compare, hash } from 'bcryptjs';
import { sign, verify } from 'jsonwebtoken';
import type { RowDataPacket } from 'mysql2/promise';
import { DatabaseService } from '../../database/database.service';
import { UsersService, type UserRecord } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import type { AuthTokens, TokenPayload } from './auth.types';

interface UserSessionRow extends RowDataPacket {
  id: number;
  refreshTokenHash: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly databaseService: DatabaseService,
    private readonly usersService: UsersService,
  ) {}

  async register(registerDto: RegisterDto) {
    const normalizedEmail = registerDto.email.trim().toLowerCase();
    const existingUser = await this.usersService.findByEmail(normalizedEmail);

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const passwordHash = await hash(registerDto.password, 12);
    const user = await this.usersService.createUser({
      email: normalizedEmail,
      fullName: registerDto.fullName.trim(),
      passwordHash,
    });

    return this.buildAuthResponse(user);
  }

  async login(loginDto: LoginDto) {
    const normalizedEmail = loginDto.email.trim().toLowerCase();
    const user = await this.usersService.findByEmail(normalizedEmail);

    if (!user?.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await compare(loginDto.password, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.buildAuthResponse(user);
  }

  async refresh(refreshToken: string) {
    const payload = this.verifyRefreshToken(refreshToken);
    const user = await this.usersService.getUserById(Number(payload.sub));

    if (!user.isActive) {
      throw new UnauthorizedException('User is inactive');
    }

    const session = await this.findMatchingSession(user.id, refreshToken);

    if (!session) {
      throw new UnauthorizedException('Refresh session not found');
    }

    await this.revokeSession(session.id);

    return this.buildAuthResponse(user);
  }

  async logout(userId: number, refreshToken: string) {
    const payload = this.verifyRefreshToken(refreshToken);

    if (Number(payload.sub) !== userId) {
      throw new UnauthorizedException(
        'Refresh token does not belong to the user',
      );
    }

    const session = await this.findMatchingSession(userId, refreshToken);

    if (session) {
      await this.revokeSession(session.id);
    }

    return {
      success: true,
    };
  }

  private async buildAuthResponse(user: UserRecord) {
    const tokens = await this.issueTokens(user);

    return {
      user: this.usersService.toPublicUser(user),
      tokens,
    };
  }

  private async issueTokens(user: UserRecord): Promise<AuthTokens> {
    const accessTokenExpiresIn =
      this.configService.getOrThrow<number>('JWT_ACCESS_TTL');
    const refreshTokenExpiresIn =
      this.configService.getOrThrow<number>('JWT_REFRESH_TTL');

    const accessToken = sign(
      {
        sub: user.id,
        email: user.email,
        type: 'access',
      },
      this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      {
        expiresIn: accessTokenExpiresIn,
      },
    );

    const refreshToken = sign(
      {
        sub: user.id,
        email: user.email,
        type: 'refresh',
      },
      this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      {
        expiresIn: refreshTokenExpiresIn,
      },
    );

    const refreshTokenHash = await hash(refreshToken, 12);
    await this.databaseService.execute(
      `
        INSERT INTO finan_user_sessions (
          user_id,
          refresh_token_hash,
          device_info,
          ip_address,
          expires_at,
          revoked_at
        )
        VALUES (?, ?, NULL, NULL, ?, NULL)
      `,
      [
        user.id,
        refreshTokenHash,
        new Date(Date.now() + refreshTokenExpiresIn * 1000),
      ],
    );

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresIn,
      refreshTokenExpiresIn,
      tokenType: 'Bearer',
    };
  }

  private verifyRefreshToken(refreshToken: string): TokenPayload {
    try {
      const decoded = verify(
        refreshToken,
        this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      );

      if (typeof decoded === 'string' || decoded.type !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return decoded as unknown as TokenPayload;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async findMatchingSession(userId: number, refreshToken: string) {
    const sessions = await this.databaseService.query<UserSessionRow[]>(
      `
        SELECT id, refresh_token_hash AS refreshTokenHash
        FROM finan_user_sessions
        WHERE user_id = ?
          AND revoked_at IS NULL
          AND expires_at > CURRENT_TIMESTAMP
        ORDER BY created_at DESC
      `,
      [userId],
    );

    for (const session of sessions) {
      const matches = await compare(refreshToken, session.refreshTokenHash);

      if (matches) {
        return session;
      }
    }

    return null;
  }

  private async revokeSession(sessionId: number) {
    await this.databaseService.execute(
      `
        UPDATE finan_user_sessions
        SET revoked_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [sessionId],
    );
  }
}
