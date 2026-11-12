import { useMemo } from "react";

import { toURL } from "@/utils/url";

export interface YandexFaviconProviderProps {
  urlOrLink: URL | string;
  onError?: React.ReactEventHandler<HTMLImageElement>;
}

export default function YandexFaviconProvider({ urlOrLink, onError }: YandexFaviconProviderProps) {
  const url = useMemo(() => toURL(urlOrLink), [urlOrLink]);

  const faviconURL = useMemo(
    () => `https://favicon.yandex.net/favicon/${url.hostname}`,
    [url.hostname],
  );

  return (
    <img
      src={faviconURL}
      alt={`${url.hostname} favicon`}
      onError={onError}
      data-provider="yandex"
    />
  );
}
