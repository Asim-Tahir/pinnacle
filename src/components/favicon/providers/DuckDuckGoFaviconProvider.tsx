import { toURL } from "@/utils/url";

export interface DuckDuckGoFaviconProviderProps {
  urlOrLink: URL | string;
  onError?: React.ReactEventHandler<HTMLImageElement>;
}

export default function DuckDuckGoFaviconProvider({
  urlOrLink,
  onError,
}: DuckDuckGoFaviconProviderProps) {
  const url = toURL(urlOrLink);

  return (
    <img
      src={`https://icons.duckduckgo.com/ip3/${url.hostname}.ico`}
      alt={`${url.hostname} favicon`}
      onError={onError}
      data-provider="duckduckgo"
    />
  );
}
