"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import type { Tool } from "@/tools/registry";

type ThemeMode = "light" | "dark";

function normalizePath(p: string) {
  const clean = (p || "").split("?")[0].split("#")[0];
  return clean.replace(/\/+$/, "") || "/";
}

function applyTheme(mode: ThemeMode, persist = true) {
  const root = document.documentElement;
  root.setAttribute("data-theme", mode);
  root.style.colorScheme = mode;
  if (persist) localStorage.setItem("tppc_tools_theme", mode);
  document.cookie = `tppc_tools_theme=${mode}; path=/; max-age=31536000; samesite=lax`;
}

export function SiteNav({
  tools
}: {
  tools: readonly Tool[];
}) {
  const pathname = usePathname() || "/";
  const current = normalizePath(pathname);
  const userscriptsPath = "/userscripts/";

  const navItems = useMemo(
    () =>
      [
        { name: "Userscripts", href: userscriptsPath },
        ...tools.map((t) => ({
          name: t.name,
          href: t.route
        }))
      ],
    [tools]
  );

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeMode | null>(null);

  useEffect(() => {
    // Close drawer on route change
    setDrawerOpen(false);
  }, [current]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    try {
      const rootTheme = document.documentElement.getAttribute("data-theme");
      if (rootTheme === "dark" || rootTheme === "light") {
        applyTheme(rootTheme, true);
        setTheme(rootTheme as ThemeMode);
        return;
      }

      const saved = localStorage.getItem("tppc_tools_theme");
      const prefersDark =
        window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      const initial: ThemeMode =
        saved === "dark" || saved === "light" ? (saved as ThemeMode) : prefersDark ? "dark" : "light";
      applyTheme(initial, true);
      setTheme(initial);
    } catch (_) {
      // ignore
    }
  }, []);

  const toggleTheme = () => {
    const current: ThemeMode =
      theme ||
      (document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light");
    const next: ThemeMode = current === "dark" ? "light" : "dark";
    applyTheme(next, true);
    setTheme(next);
  };

  const themeToggleIcon = theme ? (theme === "dark" ? "☀" : "☾") : "◐";
  const themeToggleLabel = theme ? (theme === "dark" ? "Light" : "Dark") : "Theme";

  return (
    <>
      <nav className="main-nav">
        <div className="main-nav-inner">
          <button
            className="nav-icon-btn"
            id="siteMenuBtn"
            type="button"
            aria-controls="site-drawer"
            aria-expanded={drawerOpen ? "true" : "false"}
            aria-label="Open menu"
            onClick={() => setDrawerOpen(true)}
          >
            <span aria-hidden>≡</span>
          </button>

          <Link className="nav-brand" href="/">
            <span className="nav-brand-mark" />
            <span className="nav-brand-text">TPPC Tools by Darkness</span>
          </Link>

          <div className="nav-actions">
            <a
              className="chip"
              href="https://github.com/darknesspwnsu/tppc-tools"
              target="_blank"
              rel="noopener"
            >
              ↗ GitHub
            </a>

            <button
              className="chip"
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              <span>{themeToggleIcon}</span>
              <span>{themeToggleLabel}</span>
            </button>
          </div>
        </div>
      </nav>

      <aside
        className={`tool-drawer${drawerOpen ? " open" : ""}`}
        id="site-drawer"
        aria-hidden={drawerOpen ? "false" : "true"}
      >
        <div className="tool-drawer-head">
          <div className="kicker">Tools & Scripts</div>
          <button
            className="nav-icon-btn"
            type="button"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
          >
            ×
          </button>
        </div>

        <div className="tool-drawer-links">
          {navItems.map((it) => {
            const target = normalizePath(it.href);
            const active = current === target || current.startsWith(target.replace(/\/$/, "") + "/");
            return (
              <Link
                key={it.href}
                className={`chip${active ? " chip-active" : ""}`}
                href={it.href}
                aria-current={active ? "page" : undefined}
              >
                {it.name}
              </Link>
            );
          })}
        </div>
      </aside>

      <div
        className={`tool-drawer-backdrop${drawerOpen ? " open" : ""}`}
        id="site-drawer-backdrop"
        onClick={() => setDrawerOpen(false)}
      />
    </>
  );
}
