import type { Metadata } from "next";

import { SwapStatusTool } from "@/components/tools/SwapStatusTool";

export const metadata: Metadata = {
  title: "Check Swap Status | TPPC Tools",
  description: "Check whether a Pokemon or form is currently obtainable via Secret Swap, with map and former swap notes."
};

export default function SwapStatusPage() {
  return <SwapStatusTool />;
}
