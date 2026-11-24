export function useAssetPath() {
  const base = useRuntimeConfig().app.baseURL.replace(/\/$/, "");
  return (src: string) => (src.startsWith("/img/") ? base + src : src);
}
