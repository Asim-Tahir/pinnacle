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

  const faviconURL = new URL("https://www.google.com/s2/favicons");
  faviconURL.searchParams.set("domain", url.origin);
  faviconURL.searchParams.set("sz", String(size));

  return (
    <img
      src={faviconURL.toString()}
      alt={`${url.hostname} favicon`}
      onError={onError}
      data-provider="google"
    />
  );
}
