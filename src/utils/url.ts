export function toURL(urlOrLink: URL | string): URL {
  if (urlOrLink instanceof URL) {
    return urlOrLink;
  }

  return new URL(urlOrLink);
}
