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
        href: `/tools/${t.slug}/`
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
      <nav className="site-nav">
        <div className="site-nav-inner">
          <button
            className="site-hamburger"
            id="siteMenuBtn"
            type="button"
            aria-controls="site-drawer"
            aria-expanded={drawerOpen ? "true" : "false"}
            aria-label="Open menu"
            onClick={() => setDrawerOpen(true)}
          >
            ≡
          </button>

          <Link className="site-brand" href="/">
            <span className="site-logo" />
            <span className="site-title">TPPC Tools by Darkness</span>
          </Link>

          <div className="site-actions">
            <a
              className="site-action"
              href="https://github.com/darknesspwnsu/tppc-tools"
              target="_blank"
              rel="noopener"
            >
              ↗ GitHub
            </a>

            <button
              className="site-action site-theme-btn"
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              <span>{theme === "dark" ? "☀" : "☾"}</span>
              <span style={{ marginLeft: 6 }}>{theme === "dark" ? "Light" : "Dark"}</span>
            </button>
          </div>
        </div>
      </nav>

      <aside
        className={`site-drawer${drawerOpen ? " open" : ""}`}
        id="site-drawer"
        aria-hidden={drawerOpen ? "false" : "true"}
      >
        <div className="site-drawer-head">
          <div className="site-drawer-title">Tools</div>
          <button
            className="site-drawer-close"
            type="button"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
          >
            ×
          </button>
        </div>

        <div className="site-drawer-links">
          {navItems.map((it) => {
            const target = normalizePath(it.href);
            const active = current === target || current.startsWith(target.replace(/\/$/, "") + "/");
            return (
              <Link
                key={it.href}
                className={`site-link${active ? " active" : ""}`}
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
        className={`site-drawer-backdrop${drawerOpen ? " show" : ""}`}
        id="site-drawer-backdrop"
        onClick={() => setDrawerOpen(false)}
      />
    </>
  );
}

