import type { Metadata } from "next";

import { EvolutionViewerTool } from "@/components/tools/EvolutionViewerTool";

export const metadata: Metadata = {
  title: "Evolution Viewer | TPPC Tools",
  description: "Look up TPPC evolution requirements and minimum obtainable levels by variant."
};

export default function EvolutionViewerPage() {
  return <EvolutionViewerTool />;
}
