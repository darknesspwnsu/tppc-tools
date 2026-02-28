import type { Metadata } from "next";

import { UserscriptsRepository } from "@/components/userscripts/UserscriptsRepository";

export const metadata: Metadata = {
  title: "Userscripts | TPPC Tools",
  description: "A growing repository of practical TPPC userscripts and one-off console helpers."
};

export default function UserscriptsPage() {
  return <UserscriptsRepository />;
}
