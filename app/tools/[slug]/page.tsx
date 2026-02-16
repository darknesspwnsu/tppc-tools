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
        <div className="text-muted small">
          Legacy tool embedded for compatibility.
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
