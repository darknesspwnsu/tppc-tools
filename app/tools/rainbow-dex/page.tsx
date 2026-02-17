import type { Metadata } from "next";

import { RainbowDexTool } from "@/components/tools/RainbowDexTool";

export const metadata: Metadata = {
  title: "Rainbow Dex Organizer | TPPC Tools",
  description: "Organize rainbow dex collections by generation with rarity-aware missing checklists."
};

export default function RainbowDexPage() {
  return <RainbowDexTool />;
}
