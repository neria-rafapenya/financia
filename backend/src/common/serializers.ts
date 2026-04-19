export function toIsoDate(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  return new Date(value).toISOString().slice(0, 10);
}

export function toIsoDateTime(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  return new Date(value).toISOString();
}

export function toNullableNumber(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }

  return Number(value);
}

export function toBooleanFlag(value: unknown) {
  return Boolean(value);
}

export function parseStoredJson<T>(value: unknown): T | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'string') {
    return JSON.parse(value) as T;
  }

  return value as T;
}
