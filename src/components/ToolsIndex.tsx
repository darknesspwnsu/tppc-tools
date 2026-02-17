"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { Tool } from "@/tools/registry";

function normTag(s: string) {
  return String(s || "").trim().toLowerCase();
}

function toolHaystack(t: Tool) {
  return (
    `${t.name} ` +
    `${t.desc} ` +
    `${t.slug} ` +
    `${(t.tags || []).join(" ")}`
  ).toLowerCase();
}

export function ToolsIndex({ tools }: { tools: readonly Tool[] }) {
  const [query, setQuery] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);

  const activeTagSet = useMemo(() => new Set(activeTags.map(normTag)), [activeTags]);
  const hasActiveTags = activeTagSet.size > 0;

  const allTags = useMemo(() => {
    const s = new Set<string>();
    tools.forEach((t) => (t.tags || []).forEach((tg) => s.add(normTag(tg))));
    return Array.from(s).filter(Boolean).sort();
  }, [tools]);

  const tagMatchCount = (t: Tool) => {
    if (!activeTagSet.size) return 0;
    let n = 0;
    for (const tg of (t.tags || []).map(normTag)) if (activeTagSet.has(tg)) n++;
    return n;
  };

  const filteredSorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = !q ? [...tools] : tools.filter((t) => toolHaystack(t).includes(q));

    // Like the legacy index: tags do not filter, they sort "matches" to the top.
    const out = filtered.slice().sort((a, b) => {
      const da = tagMatchCount(a);
      const db = tagMatchCount(b);
      if (db !== da) return db - da;
      return a.name.localeCompare(b.name);
    });
    return out;
  }, [tools, query, activeTagSet]);

  const setSingleTag = (tag: string) => {
    setQuery("");
    setActiveTags([normTag(tag)]);
  };

  const toggleTag = (tag: string) => {
    const t = normTag(tag);
    setQuery("");
    setActiveTags((prev) => {
      const s = new Set(prev.map(normTag));
      if (s.has(t)) s.delete(t);
      else s.add(t);
      return Array.from(s).sort();
    });
  };

  return (
    <div className="stack">
      <section className="surface hero tools-header">
        <div className="kicker">Toolkit</div>
        <h1 className="page-title">TPPC Tools by Darkness</h1>
        <p className="page-subtitle">
          Community utilities for collectors, traders, and organizers. Canonical routes live under{" "}
          <code>/tools/&lt;slug&gt;/</code>.
        </p>
      </section>

      <section className="surface surface-strong">
        <div className="tools-toolbar">
          <div className="tools-toolbar-left">
            <span className="pill-label">Tools</span>
            <span className="text-muted mono" style={{ fontSize: "0.78rem" }}>
              {filteredSorted.length} / {tools.length} shown
            </span>
          </div>

          <label style={{ minWidth: "min(340px, 100%)", display: "grid", gap: "0.35rem" }}>
            <span className="text-muted mono" style={{ fontSize: "0.72rem" }}>
              Search
            </span>
            <input
              className="field"
              placeholder="Search tools..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveTags([]);
              }}
            />
          </label>
        </div>

        {activeTags.length ? (
          <div className="tags-row" style={{ padding: "0 1.1rem 0.2rem" }}>
            {activeTags.map((t) => (
              <button
                key={t}
                type="button"
                className="tag-btn active"
                onClick={() => setActiveTags((prev) => prev.filter((x) => x !== t))}
                title="Remove tag"
              >
                #{t} ×
              </button>
            ))}
            <button
              type="button"
              className="tag-btn"
              onClick={() => setActiveTags([])}
              title="Clear tags"
            >
              clear ×
            </button>
          </div>
        ) : null}

        <div className="tags-row" style={{ padding: "0 1.1rem 0.3rem" }}>
          {allTags.map((tg) => {
            const on = activeTagSet.has(tg);
            return (
              <button
                key={tg}
                type="button"
                className={`tag-btn${on ? " active" : ""}`}
                onClick={(e) => {
                  const multi = e.ctrlKey || e.metaKey;
                  if (multi) toggleTag(tg);
                  else setSingleTag(tg);
                }}
                title={on ? "Tag selected (Ctrl/Cmd for multi-select)" : "Ctrl/Cmd for multi-select"}
              >
                #{tg}
              </button>
            );
          })}
        </div>

        <div className="tools-grid" style={{ padding: "0 1.1rem 1.1rem" }}>
          {filteredSorted.map((t) => {
            const matches = tagMatchCount(t);
            const cardClasses = [
              "tool-card",
              hasActiveTags && matches > 0 ? "match" : "",
              hasActiveTags && matches === 0 ? "dim" : ""
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <article className={cardClasses} key={t.slug}>
                <div className="tool-card-head">
                  <div>
                    <div className="tool-card-title">{t.name}</div>
                    <div className="tool-card-desc">{t.desc}</div>
                    <div className="tool-card-path">
                      <code>{t.route}</code>
                    </div>
                  </div>
                  <div>
                    <Link className="btn-primary-soft" href={t.route}>
                      Open
                    </Link>
                  </div>
                </div>

                <div className="tags-row">
                  {(t.tags || []).map((tag) => {
                    const nt = normTag(tag);
                    const on = activeTagSet.has(nt);
                    return (
                      <button
                        key={nt}
                        type="button"
                        className={`tag-btn${on ? " active" : ""}`}
                        onClick={(e) => {
                          const multi = e.ctrlKey || e.metaKey;
                          if (multi) toggleTag(nt);
                          else setSingleTag(nt);
                        }}
                      >
                        #{nt}
                      </button>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
