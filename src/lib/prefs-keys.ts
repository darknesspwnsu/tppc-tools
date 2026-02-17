export const PREFS_PREFIX = "tppc_tools:prefs:v2";

function scoped(key: string) {
  return `${PREFS_PREFIX}:${key}`;
}

export const PREFS_KEYS = {
  toolsIndex: scoped("tools-index"),
  goldOrganizer: scoped("gold-organizer"),
  boxOrganizer: scoped("box-organizer"),
  rainbowDex: scoped("rainbow-dex"),
  perfectExp: scoped("perfect-exp"),
  pokespriteGenerator: scoped("pokesprite-generator"),
  sellGuide: scoped("sell-guide"),
  ungenderedSorter: scoped("ungendered-sorter"),
  ungenderedFamilies: scoped("ungendered-families"),
  evolutionViewer: scoped("evolution-viewer")
} as const;
