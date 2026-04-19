import type { User } from "@/domain/interfaces/user.interface";

const AUTH_USER_KEY = "financia.auth.user";
const LAST_SELECTED_DOCUMENT_ID_KEY = "financia.documents.lastSelectedId";

function safeGetItem(key: string) {
  try {
    return globalThis.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string) {
  try {
    globalThis.localStorage.setItem(key, value);
  } catch {
    // noop
  }
}

function safeRemoveItem(key: string) {
  try {
    globalThis.localStorage.removeItem(key);
  } catch {
    // noop
  }
}

export function getStoredUser() {
  const value = safeGetItem(AUTH_USER_KEY);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as User;
  } catch {
    safeRemoveItem(AUTH_USER_KEY);
    return null;
  }
}

export function setStoredUser(user: User) {
  safeSetItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function clearStoredUser() {
  safeRemoveItem(AUTH_USER_KEY);
}

export function getLastSelectedDocumentId() {
  const value = safeGetItem(LAST_SELECTED_DOCUMENT_ID_KEY);

  if (!value) {
    return null;
  }

  const parsedValue = Number(value);

  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

export function setLastSelectedDocumentId(documentId: number) {
  safeSetItem(LAST_SELECTED_DOCUMENT_ID_KEY, String(documentId));
}

export function clearLastSelectedDocumentId() {
  safeRemoveItem(LAST_SELECTED_DOCUMENT_ID_KEY);
}
