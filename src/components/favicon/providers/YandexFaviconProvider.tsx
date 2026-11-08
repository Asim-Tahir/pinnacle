import { toURL } from "@/utils/url";

export interface YandexFaviconProviderProps {
  urlOrLink: URL | string;
  onError?: React.ReactEventHandler<HTMLImageElement>;
}

export default function YandexFaviconProvider({ urlOrLink, onError }: YandexFaviconProviderProps) {
  const url = toURL(urlOrLink);

  return (
    <img
      src={`https://favicon.yandex.net/favicon/${url.hostname}`}
      alt={`${url.hostname} favicon`}
      onError={onError}
      data-provider="yandex"
    />
  );
}
