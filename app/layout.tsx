import type { Metadata } from "next";
import Script from "next/script";
import type { ReactNode } from "react";

import "./globals.css";

import { TOOLS } from "@/tools/registry";
import { SiteNav } from "@/components/SiteNav";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";
const withBase = (p: string) => `${BASE_PATH}${p}`;

export const metadata: Metadata = {
  title: "TPPC Tools by Darkness",
  description: "An index of useful TPPC tools and utilities by Darkness."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap"
          rel="stylesheet"
        />

        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css"
        />

        <link rel="stylesheet" href={withBase("/assets/site.css")} />

        <Script id="theme-init" strategy="beforeInteractive">
          {`
            (function () {
              try {
                var saved = localStorage.getItem("tppc_tools_theme");
                var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
                var mode = saved || (prefersDark ? "dark" : "light");
                document.documentElement.setAttribute("data-theme", mode);
                document.documentElement.setAttribute("data-bs-theme", mode);
              } catch (e) {}
            })();
          `}
        </Script>
      </head>
      <body className="site-standard">
        <SiteNav tools={TOOLS} />
        <main className="page-wrap">{children}</main>
        <footer className="site-footer">
          <div className="site-footer-inner">
            © {new Date().getFullYear()} Darkness AKA Shiva — TPPC Tools
          </div>
        </footer>
      </body>
    </html>
  );
}
