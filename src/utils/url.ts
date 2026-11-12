export function toURL(urlOrLink: URL | string): URL {
  if (urlOrLink instanceof URL) {
    return urlOrLink;
  }

  return new URL(urlOrLink);
}

export function urlToString(urlOrLink: URL | string): string {
  if (urlOrLink instanceof URL) {
    return urlOrLink.href;
  }

  return urlOrLink;
}
