"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { usePersistentOptions } from "@/hooks/usePersistentOptions";
import { PREFS_KEYS } from "@/lib/prefs-keys";
import type { Tool } from "@/tools/registry";

type IndexEntry = {
  slug: string;
  name: string;
  desc: string;
  tags: string[];
  route: string;
};

const USERSCRIPTS_INDEX_ENTRY: IndexEntry = {
  slug: "userscripts",
  name: "Userscripts",
  desc: "Copy-paste scripts and one-off console helpers for TPPC workflows.",
  tags: ["userscripts", "scripts", "repository"],
  route: "/userscripts/"
};

function normTag(s: string) {
  return String(s || "").trim().toLowerCase();
}

function toolHaystack(t: IndexEntry) {
  return (
    `${t.name} ` +
    `${t.desc} ` +
    `${t.slug} ` +
    `${(t.tags || []).join(" ")}`
  ).toLowerCase();
}

export function ToolsIndex({ tools }: { tools: readonly Tool[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const indexEntries = useMemo<readonly IndexEntry[]>(
    () => [USERSCRIPTS_INDEX_ENTRY, ...tools],
    [tools]
  );
  const [prefs, setPrefs, prefsLoaded] = usePersistentOptions<{ activeTags: string[] }>(
    PREFS_KEYS.toolsIndex,
    { activeTags: [] },
    {
      version: 1,
      migrate: (raw) => {
        if (!raw || typeof raw !== "object") return { activeTags: [] };
        const candidate = (raw as { activeTags?: unknown }).activeTags;
        if (!Array.isArray(candidate)) return { activeTags: [] };
        return {
          activeTags: candidate.filter((tag): tag is string => typeof tag === "string").map(normTag)
        };
      }
    }
  );
  const activeTags = prefs.activeTags;

  const activeTagSet = useMemo(() => new Set(activeTags.map(normTag)), [activeTags]);
  const hasActiveTags = activeTagSet.size > 0;

  const allTags = useMemo(() => {
    const s = new Set<string>();
    indexEntries.forEach((t) => (t.tags || []).forEach((tg) => s.add(normTag(tg))));
    return Array.from(s).filter(Boolean).sort();
  }, [indexEntries]);

  useEffect(() => {
    if (!prefsLoaded || activeTags.length === 0) return;
    const valid = activeTags.filter((tag) => allTags.includes(tag));
    if (valid.length !== activeTags.length) {
      setPrefs({ activeTags: valid });
    }
  }, [activeTags, allTags, prefsLoaded, setPrefs]);

  const tagMatchCount = (t: IndexEntry) => {
    if (!activeTagSet.size) return 0;
    let n = 0;
    for (const tg of (t.tags || []).map(normTag)) if (activeTagSet.has(tg)) n++;
    return n;
  };

  const filteredSorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = !q
      ? [...indexEntries]
      : indexEntries.filter((t) => toolHaystack(t).includes(q));

    // Tags do not filter; they sort stronger matches to the top.
    const out = filtered.slice().sort((a, b) => {
      const da = tagMatchCount(a);
      const db = tagMatchCount(b);
      if (db !== da) return db - da;
      return a.name.localeCompare(b.name);
    });
    return out;
  }, [indexEntries, query, activeTagSet]);

  const setSingleTag = (tag: string) => {
    setQuery("");
    setPrefs({ activeTags: [normTag(tag)] });
  };

  const toggleTag = (tag: string) => {
    const t = normTag(tag);
    setQuery("");
    const next = (() => {
      const s = new Set(activeTags.map(normTag));
      if (s.has(t)) s.delete(t);
      else s.add(t);
      return Array.from(s).sort();
    })();
    setPrefs({ activeTags: next });
  };

  return (
    <div className="tool-template">
      <section className="hero tool-template-header tools-header">
        <div className="kicker">Toolkit</div>
        <h1 className="page-title">TPPC Tools by Darkness</h1>
        <p className="page-subtitle">
          Community utilities for collectors, traders, and organizers. Tool routes live under{" "}
          <code>/tools/&lt;slug&gt;/</code>, with scripts at <code>/userscripts/</code>.
        </p>
      </section>

      <section className="tool-pane">
        <div className="tools-toolbar">
          <div className="tools-toolbar-left">
            <span className="pill-label">Tools</span>
            <span className="text-muted mono" style={{ fontSize: "0.78rem" }}>
              {filteredSorted.length} / {indexEntries.length} shown
            </span>
          </div>

          <label style={{ minWidth: "min(340px, 100%)", display: "grid", gap: "0.35rem" }}>
            <span className="text-muted mono" style={{ fontSize: "0.72rem" }}>
              Search
            </span>
            <input
              className="field"
              placeholder="Search tools or scripts..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPrefs({ activeTags: [] });
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
                onClick={() => setPrefs({ activeTags: activeTags.filter((x) => x !== t) })}
                title="Remove tag"
              >
                #{t} ×
              </button>
            ))}
            <button
              type="button"
              className="tag-btn"
              onClick={() => setPrefs({ activeTags: [] })}
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
              <article
                className={cardClasses}
                key={t.slug}
                role="link"
                tabIndex={0}
                aria-label={`Open ${t.name}`}
                onClick={() => router.push(t.route)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter" && event.key !== " ") return;
                  event.preventDefault();
                  router.push(t.route);
                }}
              >
                <div className="tool-card-head">
                  <div>
                    <div className="tool-card-title">{t.name}</div>
                    <div className="tool-card-desc">{t.desc}</div>
                    <div className="tool-card-path">
                      <code>{t.route}</code>
                    </div>
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
                          e.stopPropagation();
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
