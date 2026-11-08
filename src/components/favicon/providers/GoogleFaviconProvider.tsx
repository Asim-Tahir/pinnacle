import { toURL } from "@/utils/url";

export interface GoogleFaviconProviderProps {
  urlOrLink: URL | string;
  size?: number;
  onError?: React.ReactEventHandler<HTMLImageElement>;
}

export default function GoogleFaviconProvider({
  urlOrLink,
  onError,
  size = 32,
}: GoogleFaviconProviderProps) {
  const url = toURL(urlOrLink);

  const faviconURL = new URL("https://t2.gstatic.com/faviconV2");

  faviconURL.searchParams.set("client", "SOCIAL");
  faviconURL.searchParams.set("type", "FAVICON");
  faviconURL.searchParams.set("fallback_opts", ["TYPE", "SIZE", "URL"].join(","));
  faviconURL.searchParams.set("url", url.origin);
  faviconURL.searchParams.set("size", String(size));

  return (
    <img
      src={faviconURL.toString()}
      alt={`${url.hostname} favicon`}
      onError={onError}
      data-provider="google"
    />
  );
}
