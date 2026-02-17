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
  root.setAttribute("data-bs-theme", mode);
  document.body.classList.toggle("dark-mode", mode === "dark");
  if (persist) localStorage.setItem("tppc_tools_theme", mode);
}

export function SiteNav({ tools }: { tools: readonly Tool[] }) {
  const pathname = usePathname() || "/";
  const current = normalizePath(pathname);

  const navItems = useMemo(
    () =>
      tools.map((t) => ({
        name: t.name,
        href: t.route
      })),
    [tools]
  );

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>("light");

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
      const saved = localStorage.getItem("tppc_tools_theme");
      const prefersDark =
        window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      const initial: ThemeMode =
        saved === "dark" || saved === "light" ? (saved as ThemeMode) : prefersDark ? "dark" : "light";
      applyTheme(initial, false);
      setTheme(initial);
    } catch (_) {
      // ignore
    }
  }, []);

  const toggleTheme = () => {
    const next: ThemeMode = theme === "dark" ? "light" : "dark";
    applyTheme(next, true);
    setTheme(next);
  };

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
              <span>{theme === "dark" ? "☀" : "☾"}</span>
              <span>{theme === "dark" ? "Light" : "Dark"}</span>
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
          <div className="kicker">Tools</div>
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
