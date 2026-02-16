import { notFound } from "next/navigation";

import { getToolBySlug, TOOLS } from "@/tools/registry";
import { loadLegacyToolPage } from "@/lib/legacy-tools";
import { LegacyToolContent } from "@/components/tools/LegacyToolContent";

export function generateStaticParams() {
  return TOOLS.filter((t) => (t.legacyPaths?.length || 0) > 0).map((t) => ({ slug: t.slug }));
}

export default async function ToolWrapperPage({
  params
}: {
  // Next.js 16+ passes params as a Promise for server components.
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  const legacyPath = tool?.legacyPaths?.[0];
  if (!tool || !legacyPath) return notFound();
  const page = loadLegacyToolPage(legacyPath);

  return (
    <div className="native-tool-stage">
      <LegacyToolContent page={page} className="native-tool-content" />
    </div>
  );
}
