import React, { useMemo, useState } from "react";

import { FaviconProvider } from "@/enums/favicon";
import { toURL } from "@/utils/url";
import {
  DuckDuckGoFaviconProvider,
  GoogleFaviconProvider,
  YandexFaviconProvider,
} from "./providers";

export interface FaviconProps {
  urlOrLink: URL | string;
}

export interface FaviconProviderProps {
  urlOrLink: URL | string;
  size?: number;
  onError?: React.ReactEventHandler<HTMLImageElement>;
}

const providers = [FaviconProvider.Google, FaviconProvider.DuckDuckGo, FaviconProvider.Yandex];

export default function Favicon({ urlOrLink }: FaviconProps) {
  const url = toURL(urlOrLink);

  const [provider, setProvider] = useState<FaviconProvider | null>(FaviconProvider.Google);

  const onError: React.ReactEventHandler<HTMLImageElement> = () => {
    setProvider((current) => {
      if (current === null) return null;

      const nextIndex = providers.indexOf(current) + 1;
      return providers[nextIndex] ?? null;
    });
  };

  const Provider = useMemo(() => {
    switch (provider) {
      case FaviconProvider.Google:
        return GoogleFaviconProvider;

      case FaviconProvider.DuckDuckGo:
        return DuckDuckGoFaviconProvider;

      case FaviconProvider.Yandex:
        return YandexFaviconProvider;
    }
  }, [provider]);

  return (
    <span className="favicon" aria-hidden="true">
      {Provider ? (
        <Provider urlOrLink={urlOrLink} onError={onError} />
      ) : (
        <span className="favicon-fallback">{url.hostname.slice(0, 1).toUpperCase()}</span>
      )}
    </span>
  );
}
