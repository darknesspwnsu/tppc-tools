import type { Metadata } from "next";

import { UngenderedFamiliesTool } from "@/components/tools/UngenderedFamiliesTool";

export const metadata: Metadata = {
  title: "Ungendered Families Sorter | TPPC Tools",
  description: "Group ungendered collections by family with advanced missing, rarity, and partition controls."
};

export default function UngenderedFamiliesPage() {
  return <UngenderedFamiliesTool />;
}
