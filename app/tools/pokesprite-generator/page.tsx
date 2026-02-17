import type { Metadata } from "next";

import { PokespriteGeneratorTool } from "@/components/tools/PokespriteGeneratorTool";

export const metadata: Metadata = {
  title: "PokeSprite Generator | TPPC Tools",
  description: "Generate TPPC BBCode sprite art from Pokémon names with live preview and export actions."
};

export default function PokespriteGeneratorPage() {
  return <PokespriteGeneratorTool />;
}
