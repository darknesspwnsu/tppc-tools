import type { GoldenRarity, GoldenTimelineItemRaw } from "@/lib/gold-organizer";
import { GoldOrganizer } from "@/components/GoldOrganizer";

import timelineJson from "@/data/gold/golden_timeline.json";
import rarityJson from "@/data/gold/golden_rarity.json";

export default function GoldOrganizerPage() {
  const timelineRaw = timelineJson as unknown as GoldenTimelineItemRaw[];
  const rarity = rarityJson as unknown as GoldenRarity;
  return <GoldOrganizer timelineRaw={timelineRaw} rarity={rarity} />;
}

