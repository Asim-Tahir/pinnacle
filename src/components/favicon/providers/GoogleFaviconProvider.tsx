import { useMemo } from "react";

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
  const url = useMemo(() => toURL(urlOrLink), [urlOrLink]);

  const faviconURL = useMemo(() => {
    const fURL = new URL("https://www.google.com/s2/favicons");
    fURL.searchParams.set("domain", url.origin);
    fURL.searchParams.set("sz", String(size));

    return fURL;
  }, [url.origin, size]);

  return (
    <img
      src={faviconURL.toString()}
      alt={`${url.hostname} favicon`}
      onError={onError}
      data-provider="google"
    />
  );
}
