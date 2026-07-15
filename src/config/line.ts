const LINE_HOSTS = new Set(["line.me", "lin.ee"]);

export function getSafeLineAddFriendUrl(value: string | undefined) {
  const candidate = value?.trim();
  if (!candidate) return "";

  try {
    const url = new URL(candidate);
    if (url.protocol !== "https:" || !LINE_HOSTS.has(url.hostname.toLowerCase())) return "";
    return url.toString();
  } catch {
    return "";
  }
}
