import type { Metadata } from "next";

import { UngenderedSorterTool } from "@/components/tools/UngenderedSorterTool";

export const metadata: Metadata = {
  title: "Ungendered Sorter | TPPC Tools",
  description: "Sort ungendered TPPC lists, generate BBCode output, and track missing variants."
};

export default function UngenderedSorterPage() {
  return <UngenderedSorterTool />;
}
