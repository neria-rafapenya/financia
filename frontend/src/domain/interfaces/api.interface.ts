export interface ApiErrorPayload {
  message?: string;
  error?: string;
  statusCode?: number;
}

export interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  body?: BodyInit | FormData | object | null;
}
