import type { Metadata } from "next";

import { ExpUtilitiesTool } from "@/components/tools/ExpUtilitiesTool";

export const metadata: Metadata = {
  title: "Exp Utilities | TPPC Tools",
  description: "Convert between TPPC levels and EXP, and calculate level differences instantly."
};

export default function ExpUtilitiesPage() {
  return <ExpUtilitiesTool />;
}
