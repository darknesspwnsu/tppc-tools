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
    <div>
      <section className="panel page-header">
        <h1 className="page-title">TPPC Tools by Darkness</h1>
        <div className="page-subtitle">
          An index of useful TPPC tools and utilities. New canonical routes live under{" "}
          <code>/tools/&lt;slug&gt;/</code>.
        </div>
      </section>

      <section className="panel">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
          <div className="d-flex flex-wrap align-items-center gap-2">
            <div className="fw-semibold">Tools</div>
            <div className="text-muted small">
              {filteredSorted.length} / {tools.length} shown
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <span className="text-muted small">⌕</span>
            <input
              className="form-control form-control-sm"
              style={{ width: 240 }}
              placeholder="Search tools…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveTags([]);
              }}
            />
          </div>
        </div>

        {activeTags.length ? (
          <div className="mt-2 d-flex flex-wrap gap-2">
            {activeTags.map((t) => (
              <button
                key={t}
                type="button"
                className="site-link"
                onClick={() => setActiveTags((prev) => prev.filter((x) => x !== t))}
                title="Remove tag"
              >
                #{t} <span style={{ marginLeft: 6 }}>×</span>
              </button>
            ))}
            <button
              type="button"
              className="site-link"
              onClick={() => setActiveTags([])}
              title="Clear tags"
            >
              Clear <span style={{ marginLeft: 6 }}>×</span>
            </button>
          </div>
        ) : null}

        <div className="mt-3 d-flex flex-wrap gap-2">
          {allTags.map((tg) => {
            const on = activeTagSet.has(tg);
            return (
              <button
                key={tg}
                type="button"
                className="site-link"
                style={{
                  borderColor: on ? "color-mix(in oklab, var(--nav-line), var(--nav-accent2) 55%)" : undefined
                }}
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

        <div className="row g-3 mt-2">
          {filteredSorted.map((t) => {
            const matches = tagMatchCount(t);
            return (
              <div className="col-12 col-lg-6" key={t.slug}>
                <div className="panel panel-muted h-100">
                  <div className="d-flex align-items-start justify-content-between gap-3">
                    <div>
                      <div className="fw-semibold">{t.name}</div>
                      <div className="text-muted small mt-1">{t.desc}</div>
                      <div className="text-muted small mt-2">
                        <code>/tools/{t.slug}/</code>
                      </div>
                    </div>
                    <div className="d-flex flex-column gap-2" style={{ minWidth: 140 }}>
                      <Link className="btn btn-primary btn-sm" href={`/tools/${t.slug}/`}>
                        Open
                      </Link>
                    </div>
                  </div>

                  <div className="mt-3 d-flex flex-wrap gap-2">
                    {(t.tags || []).map((tag) => {
                      const nt = normTag(tag);
                      const on = activeTagSet.has(nt);
                      return (
                        <button
                          key={nt}
                          type="button"
                          className="site-link"
                          style={{
                            opacity: matches > 0 && !on ? 0.85 : 1
                          }}
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
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
