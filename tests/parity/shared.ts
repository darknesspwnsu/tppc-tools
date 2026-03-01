function normalizeBasePath(p: string) {
  const trimmed = String(p || "").trim();
  if (!trimmed) return "";
  const withLeading = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeading.replace(/\/+$/, "");
}

export function withParityBasePath(pathname: string) {
  const basePath = normalizeBasePath(process.env.PARITY_BASE_PATH || process.env.NEXT_PUBLIC_BASE_PATH || "");
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (!basePath) return path;
  if (path === basePath || path.startsWith(`${basePath}/`)) return path;
  return `${basePath}${path}`;
}
