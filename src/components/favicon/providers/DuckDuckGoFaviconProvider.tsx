import { useMemo } from "react";

import { toURL } from "@/utils/url";

export interface DuckDuckGoFaviconProviderProps {
  urlOrLink: URL | string;
  onError?: React.ReactEventHandler<HTMLImageElement>;
}

export default function DuckDuckGoFaviconProvider({
  urlOrLink,
  onError,
}: DuckDuckGoFaviconProviderProps) {
  const url = useMemo(() => toURL(urlOrLink), [urlOrLink]);

  const faviconURL = useMemo(
    () => `https://icons.duckduckgo.com/ip3/${encodeURIComponent(url.hostname)}.ico`,
    [url.hostname],
  );

  return (
    <img
      src={faviconURL}
      alt={`${url.hostname} favicon`}
      onError={onError}
      data-provider="duckduckgo"
    />
  );
}
