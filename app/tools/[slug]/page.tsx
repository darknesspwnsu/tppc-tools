import Link from "next/link";
import { notFound } from "next/navigation";

import { getToolBySlug, TOOLS } from "@/tools/registry";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function generateStaticParams() {
  return TOOLS.filter((t) => t.kind === "legacy").map((t) => ({ slug: t.slug }));
}

export default function ToolWrapperPage({ params }: { params: { slug: string } }) {
  const tool = getToolBySlug(params.slug);
  if (!tool || tool.kind !== "legacy" || !tool.legacyPath) return notFound();

  const standaloneHref = `${BASE_PATH}${tool.legacyPath}`;
  const iframeSrc = `${standaloneHref}?embed=1`;

  return (
    <div>
      <section className="panel page-header">
        <h1 className="page-title">{tool.name}</h1>
        <div className="page-subtitle">{tool.desc}</div>
        <div className="mt-2 d-flex flex-wrap gap-2">
          {tool.tags.map((t) => (
            <span key={t} className="site-link" style={{ pointerEvents: "none" }}>
              #{t}
            </span>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="d-flex flex-wrap gap-2 align-items-center justify-content-between">
          <div className="text-muted small">
            Embedded legacy page: <code>{tool.legacyPath}</code>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <Link className="btn btn-outline-secondary btn-sm" href={tool.legacyPath} target="_blank">
              Open standalone
            </Link>
            <a className="btn btn-primary btn-sm" href={standaloneHref} target="_blank" rel="noopener">
              Open in new tab
            </a>
          </div>
        </div>

        <div className="mt-3" style={{ borderRadius: 16, overflow: "hidden", border: "1px solid rgba(0,0,0,.08)" }}>
          <iframe
            title={tool.name}
            src={iframeSrc}
            style={{ width: "100%", height: "80vh", border: 0, background: "transparent" }}
            allow="clipboard-write"
          />
        </div>
      </section>
    </div>
  );
}

