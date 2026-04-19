export function setCookie(name: string, value: string, maxAgeSeconds?: number) {
  const attributes = ["Path=/", "SameSite=Lax"];

  if (typeof maxAgeSeconds === "number") {
    attributes.push(`Max-Age=${maxAgeSeconds}`);
  }

  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; ${attributes.join("; ")}`;
}

export function getCookie(name: string) {
  const target = `${encodeURIComponent(name)}=`;

  return document.cookie
    .split("; ")
    .find((segment) => segment.startsWith(target))
    ?.slice(target.length);
}

export function removeCookie(name: string) {
  document.cookie = `${encodeURIComponent(name)}=; Path=/; Max-Age=0; SameSite=Lax`;
}
