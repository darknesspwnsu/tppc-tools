import type { Metadata } from "next";

import { UngenderedDiffTool } from "@/components/tools/UngenderedDiffTool";

export const metadata: Metadata = {
  title: "Ungendered Diff | TPPC Tools",
  description: "Compare two ungendered TPPC lists and isolate non-overlapping entries quickly."
};

export default function UngenderedDiffPage() {
  return <UngenderedDiffTool />;
}
