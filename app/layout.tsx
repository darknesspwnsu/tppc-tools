import type { Metadata } from "next";
import Script from "next/script";
import type { CSSProperties, ReactNode } from "react";

import "./globals.css";

import { TOOLS } from "@/tools/registry";
import { SiteNav } from "@/components/SiteNav";

export const metadata: Metadata = {
  title: "TPPC Tools by Darkness",
  description: "An index of useful TPPC tools and utilities by Darkness."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const basePath = String(process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/+$/, "");
  const lightBg = `${basePath}/assets/theme/bg-light-wooloo.jpg`;
  const darkBg = `${basePath}/assets/theme/bg-dark-yveltal.jpg`;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap"
          rel="stylesheet"
        />

        <Script id="theme-init" strategy="beforeInteractive">
          {`
            (function () {
              try {
                var saved = localStorage.getItem("tppc_tools_theme");
                var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
                var mode = saved || (prefersDark ? "dark" : "light");
                document.documentElement.setAttribute("data-theme", mode);
              } catch (e) {}
            })();
          `}
        </Script>
      </head>
      <body
        className="app-shell"
        style={
          {
            ["--theme-light-bg-image" as string]: `url("${lightBg}")`,
            ["--theme-dark-bg-image" as string]: `url("${darkBg}")`
          } as CSSProperties
        }
      >
        <SiteNav tools={TOOLS} />
        <main className="app-main">{children}</main>
        <footer className="app-footer">
          <div>
            © {new Date().getFullYear()} Darkness AKA Shiva — TPPC Tools
          </div>
        </footer>
      </body>
    </html>
  );
}
