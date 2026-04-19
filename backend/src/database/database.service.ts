import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createPool,
  type Pool,
  type ResultSetHeader,
  type RowDataPacket,
} from 'mysql2/promise';

type QueryParam = string | number | boolean | Date | null;
type QueryParams = QueryParam[];

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool: Pool;

  constructor(private readonly configService: ConfigService) {
    const databaseConfig = this.resolveDatabaseConfig();

    this.pool = createPool({
      host: databaseConfig.host,
      port: databaseConfig.port,
      database: databaseConfig.database,
      user: this.configService.getOrThrow<string>('DB_USER'),
      password: this.configService.get<string>('DB_PASSWORD', ''),
      waitForConnections: true,
      connectionLimit: 10,
      enableKeepAlive: true,
    });
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  async query<T extends RowDataPacket[]>(
    sql: string,
    params: QueryParams = [],
  ): Promise<T> {
    const [rows] = await this.pool.query<T>(sql, params as never[]);
    return rows;
  }

  async execute(
    sql: string,
    params: QueryParams = [],
  ): Promise<ResultSetHeader> {
    const [result] = await this.pool.execute<ResultSetHeader>(
      sql,
      params as never[],
    );
    return result;
  }

  private resolveDatabaseConfig() {
    const rawHost = this.configService.getOrThrow<string>('DB_HOST');
    const fallbackPort = this.configService.getOrThrow<number>('DB_PORT');
    const fallbackDatabase = this.configService.getOrThrow<string>('DB_NAME');

    if (
      !rawHost.startsWith('jdbc:mysql://') &&
      !rawHost.startsWith('mysql://')
    ) {
      return {
        host: rawHost,
        port: fallbackPort,
        database: fallbackDatabase,
      };
    }

    const normalizedUrl = rawHost.replace(/^jdbc:/, '');
    const parsedUrl = new URL(normalizedUrl);
    const databaseFromUrl = parsedUrl.pathname.replace(/^\//, '');

    return {
      host: parsedUrl.hostname || 'localhost',
      port: parsedUrl.port ? Number(parsedUrl.port) : fallbackPort,
      database: databaseFromUrl || fallbackDatabase,
    };
  }
}
