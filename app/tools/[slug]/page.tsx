import { notFound } from "next/navigation";

import { getToolBySlug, TOOLS } from "@/tools/registry";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function generateStaticParams() {
  return TOOLS.filter((t) => t.kind === "legacy").map((t) => ({ slug: t.slug }));
}

export default async function ToolWrapperPage({
  params
}: {
  // Next.js 16+ passes params as a Promise for server components.
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  if (!tool || tool.kind !== "legacy" || !tool.legacyPath) return notFound();

  const iframeSrc = `${BASE_PATH}${tool.legacyPath}?embed=1`;

  return (
    <div>
      <section className="panel page-header site-hero">
        <h1 className="page-title">{tool.name}</h1>
        <div className="page-subtitle">{tool.desc}</div>
        <div className="mt-2 d-flex flex-wrap gap-2">
          {tool.tags.map((t) => (
            <span key={t} className="site-link tag-chip" style={{ pointerEvents: "none" }}>
              #{t}
            </span>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="embed-shell">
          <div className="embed-shell-head">
            <div>
              <h2 className="embed-shell-title">Tool Workspace</h2>
              <p className="embed-shell-subtitle">Running the original {tool.name} interface in an updated shell.</p>
            </div>
            <span className="embed-shell-meta">Legacy Runtime</span>
          </div>
          <p className="embed-shell-note">
            All tool behavior is preserved; this wrapper provides consistent navigation, theming, and presentation.
          </p>

          <div className="embed-shell-frame">
            <iframe
              title={tool.name}
              src={iframeSrc}
              className="embed-shell-iframe"
              allow="clipboard-write"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
