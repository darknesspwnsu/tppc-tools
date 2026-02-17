import type { Metadata } from "next";

import { BoxOrganizerTool } from "@/components/tools/BoxOrganizerTool";

export const metadata: Metadata = {
  title: "Box Organizer | TPPC Tools",
  description: "Organize pasted box text into Golden, Shiny, Dark, and Normal BBCode sections."
};

export default function BoxOrganizerPage() {
  return <BoxOrganizerTool />;
}
