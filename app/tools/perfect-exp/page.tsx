import type { Metadata } from "next";

import { PerfectExpTool } from "@/components/tools/PerfectExpTool";

export const metadata: Metadata = {
  title: "Perfect Exp Calculator | TPPC Tools",
  description: "Calculate optimal TPPC trainer battle plans to hit your exact target EXP."
};

export default function PerfectExpPage() {
  return <PerfectExpTool />;
}
