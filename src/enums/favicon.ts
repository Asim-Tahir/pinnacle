export const FaviconProvider = {
  Google: "provider::google",
  DuckDuckGo: "provider::duckduckgo",
  Yandex: "provider::yandex",
} as const;

export type FaviconProvider = (typeof FaviconProvider)[keyof typeof FaviconProvider];
