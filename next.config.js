/** @type {import('next').NextConfig} */
const nextConfig = (() => {
  // GitHub Pages project sites are served from "/<repo>".
  // In CI we set NEXT_PUBLIC_BASE_PATH=/tppc-tools, while local dev keeps it empty.
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

  return {
    output: "export",
    trailingSlash: true,
    images: { unoptimized: true },
    devIndicators: false,
    basePath,
    assetPrefix: basePath ? `${basePath}/` : ""
  };
})();

module.exports = nextConfig;
