function normalizeSpanishTaxId(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replaceAll(/[^A-Z0-9]/g, '');
}

function computeDniLetter(numberValue: number) {
  const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
  return letters[numberValue % 23];
}

export function isValidSpanishTaxId(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  const normalizedValue = normalizeSpanishTaxId(value);

  if (/^\d{8}[A-Z]$/.test(normalizedValue)) {
    const numberValue = Number(normalizedValue.slice(0, 8));
    return computeDniLetter(numberValue) === normalizedValue.slice(-1);
  }

  if (/^[XYZ]\d{7}[A-Z]$/.test(normalizedValue)) {
    const prefixMap: Record<string, string> = {
      X: '0',
      Y: '1',
      Z: '2',
    };
    const numericValue = Number(
      `${prefixMap[normalizedValue[0]]}${normalizedValue.slice(1, 8)}`,
    );

    return computeDniLetter(numericValue) === normalizedValue.slice(-1);
  }

  return /^[ABCDEFGHJNPQRSUVW]\d{7}[0-9A-J]$/.test(normalizedValue);
}

export function normalizeValidSpanishTaxId(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const normalizedValue = normalizeSpanishTaxId(value);
  return isValidSpanishTaxId(normalizedValue) ? normalizedValue : null;
}
