import { ToolsIndex } from "@/components/ToolsIndex";
import { TOOLS } from "@/tools/registry";

export default function HomePage() {
  return <ToolsIndex tools={TOOLS} />;
}

