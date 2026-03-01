export type Tool = {
  slug: string;
  name: string;
  desc: string;
  tags: string[];
  route: `/tools/${string}/`;
  status: "active" | "beta" | "deprecated";
  // Route aliases retained for redirect stubs.
  routeAliases: string[];
};

export const TOOLS: readonly Tool[] = [
  {
    slug: "box-organizer",
    name: "Box Organizer",
    desc: "Organize Pokemon quickly and effectively into logically sensible groups with several options for customization.",
    tags: ["organizer", "box"],
    route: "/tools/box-organizer/",
    status: "active",
    routeAliases: ["/box_organizer.html"]
  },
  {
    slug: "perfect-exp",
    name: "Perfect Exp Calculator",
    desc: "Calculate the number of battles needed to perfect EXP a Pokemon at any level.",
    tags: ["calculator", "exp"],
    route: "/tools/perfect-exp/",
    status: "active",
    routeAliases: ["/perfect_exp.html"]
  },
  {
    slug: "sell-guide",
    name: "Sell Page Guide",
    desc: "Convert RPG money (buyer pays or seller receives) into the exact Pokemon level needed to sell.",
    tags: ["calculator", "money"],
    route: "/tools/sell-guide/",
    status: "active",
    routeAliases: ["/sell_guide.html"]
  },
  {
    slug: "exp-utilities",
    name: "Exp Utilities",
    desc: "Useful powertools for trainers.",
    tags: ["utilities", "exp", "calculator"],
    route: "/tools/exp-utilities/",
    status: "active",
    routeAliases: ["/exp_utils.html"]
  },
  {
    slug: "pokesprite-generator",
    name: "PokeSprite Generator",
    desc: "Generate PokeSprites in BBCode to post in your threads!",
    tags: ["generator", "bbcode", "utilities"],
    route: "/tools/pokesprite-generator/",
    status: "active",
    routeAliases: ["/pokesprite_generator.html"]
  },
  {
    slug: "evolution-viewer",
    name: "Evolution Viewer",
    desc: "Look up evolution requirements and lowest obtainable levels by variant.",
    tags: ["utilities", "evolution"],
    route: "/tools/evolution-viewer/",
    status: "active",
    routeAliases: ["/evolution_viewer.html"]
  },
  {
    slug: "ungendered-sorter",
    name: "Ungendered (?) Collection Sorter",
    desc: "Sorts ungendered Pokemon collections by families and lists missing Pokemon.",
    tags: ["organizer", "ungendered", "collection"],
    route: "/tools/ungendered-sorter/",
    status: "active",
    routeAliases: ["/sort_ungendered.html"]
  },
  {
    slug: "ungendered-families",
    name: "Ungendered (?) Families Sorter",
    desc: "Sorts ungendered Pokemon collections by family grouping.",
    tags: ["organizer", "ungendered", "collection"],
    route: "/tools/ungendered-families/",
    status: "active",
    routeAliases: ["/sort_ungendered_families/index.html"]
  },
  {
    slug: "ungendered-diff",
    name: "Ungendered (?) Collection Diffchecker",
    desc: "Diffs two (?) collections and helps collectors quickly figure out swap trades.",
    tags: ["diff", "ungendered", "collection"],
    route: "/tools/ungendered-diff/",
    status: "active",
    routeAliases: ["/diff_ungendered.html"]
  },
  {
    slug: "rainbow-dex",
    name: "Rainbow Dex Organizer",
    desc: "Helps organize rainbow dex collections easily. This is really only for kobk :p",
    tags: ["organizer", "dex", "rainbow"],
    route: "/tools/rainbow-dex/",
    status: "active",
    routeAliases: ["/rainbow_dex_sorter.html"]
  },
  {
    slug: "gold-organizer",
    name: "Gold Organizer",
    desc: "Extract and organize Golden Pokemon from TPPC box text in chronological release order (with missing list and dupe rules).",
    tags: ["organizer", "gold", "collection"],
    route: "/tools/gold-organizer/",
    status: "active",
    routeAliases: []
  }
] as const;

export function getToolBySlug(slug: string): Tool | undefined {
  return (TOOLS as readonly Tool[]).find((t) => t.slug === slug);
}
