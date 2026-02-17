import type { Metadata } from "next";

import { SellGuideTool } from "@/components/tools/SellGuideTool";

export const metadata: Metadata = {
  title: "Sell Guide | TPPC Tools",
  description: "Convert TPPC money targets to exact sell levels with buyer/seller and PP-aware options."
};

export default function SellGuidePage() {
  return <SellGuideTool />;
}
