import type { CategoryProgress, Point, Quest, Territory, WalkRecord } from "../types";

/** Real Clare townlands, real category mix, distances that actually fall
 *  inside their tier tolerance. No lorem and no invented placenames: fake
 *  content hides exactly the layout problems real content causes. */

export const TERRITORY: Territory = {
  county: "Co. Clare",
  tiles: 1284,
  townlands: 14,
  townlandsTotal: 2318,
  areaKm2: 2.76,
  countryPct: 0.04,
};

export const POINTS: Point[] = [
  {
    id: "p-cahercalla", name: "Cahercalla", nameGa: "Cathair Cala",
    category: "Ringfort", group: "fort", townland: "Cahercalla Beg",
    x: 0.68, y: 0.34,
    lore: [
      { kind: "placename", title: "Cathair Cala",
        body: "The stone fort of the landing place. Cathair marks a fort built of stone rather than earth, and cala is a riverside landing or marshy meadow.",
        sourceName: "Logainm", sourceUrl: "https://www.logainm.ie", licence: "CC BY 4.0", linkOnly: false },
      { kind: "archaeology", title: "Upstanding banks",
        body: "Circular enclosure with an earthen bank and external fosse, roughly 30m across. Banks survive to about 1.5m on the western side.",
        sourceName: "Archaeological Survey of Ireland", sourceUrl: "https://www.archaeology.ie", licence: "CC BY 4.0", linkOnly: false },
    ],
  },
  {
    id: "p-dysert", name: "Dysert O'Dea", nameGa: "Díseart Uí Dheá",
    category: "Monastic site", group: "sacred", townland: "Dysert",
    x: 0.31, y: 0.62,
    lore: [
      { kind: "placename", title: "Díseart Uí Dheá",
        body: "The hermitage of O'Dea. Díseart, from the Latin desertum, names a place a hermit withdrew to.",
        sourceName: "Logainm", sourceUrl: "https://www.logainm.ie", licence: "CC BY 4.0", linkOnly: false },
      { kind: "reference", title: "Battle of Dysert O'Dea, 1318",
        body: "", sourceName: "Wikipedia", sourceUrl: "https://en.wikipedia.org/wiki/Battle_of_Dysert_O%27Dea",
        licence: "CC BY-SA 4.0", linkOnly: true },
    ],
  },
  {
    id: "p-inchiquin", name: "Inchiquin Lough", nameGa: "Loch Inse Uí Chuinn",
    category: "Lough shore", group: "water", townland: "Inchiquin",
    x: 0.52, y: 0.78,
    lore: [
      { kind: "placename", title: "Loch Inse Uí Chuinn",
        body: "The lake of O'Quin's island. Inis is an island or a river meadow, and the Uí Chuinn held this ground into the seventeenth century.",
        sourceName: "Logainm", sourceUrl: "https://www.logainm.ie", licence: "CC BY 4.0", linkOnly: false },
    ],
  },
  {
    id: "p-ballykeel", name: "Ballykeel mass rock", nameGa: "An Baile Caol",
    category: "Mass rock", group: "sacred", townland: "Ballykeel",
    x: 0.19, y: 0.24,
    lore: [
      { kind: "placename", title: "An Baile Caol",
        body: "The narrow townland. Caol describes a narrow strip of ground, often between two watercourses.",
        sourceName: "Logainm", sourceUrl: "https://www.logainm.ie", licence: "CC BY 4.0", linkOnly: false },
    ],
  },
  {
    id: "p-toonagh", name: "Toonagh mill", category: "Mill", group: "built",
    nameGa: "Tuathanach", townland: "Toonagh", x: 0.79, y: 0.68,
    lore: [
      { kind: "architecture", title: "Corn mill, c. 1840",
        body: "Detached three-bay two-storey former corn mill, rubble limestone with dressed quoins. Wheel pit survives to the north elevation.",
        sourceName: "NIAH", sourceUrl: "https://www.buildingsofireland.ie", licence: "CC BY 4.0", linkOnly: false },
    ],
  },
];

export const QUESTS: Quest[] = [
  {
    id: "q-cloonanaha", tier: "stroll", title: "Cloonanaha Loop",
    flavour: "Out along the old mass path to a ringfort on the rise, back down by the stream.",
    distanceM: 2840, durationMin: 47, startsAwayM: 0, townland: "Cloonanaha",
    honesty: ["Two stiles", "Unpaved for 400m after the second gate"],
    objectives: [
      { id: "o-1", pointId: "p-cahercalla", label: "Cahercalla ringfort", required: true, x: 0.68, y: 0.34 },
      { id: "o-2", pointId: null, label: "Cross the stream", required: false, x: 0.44, y: 0.55 },
    ],
    path: [[0.16, 0.72], [0.3, 0.6], [0.44, 0.55], [0.6, 0.42], [0.68, 0.34], [0.62, 0.5], [0.4, 0.66], [0.16, 0.72]],
  },
  {
    id: "q-dysert", tier: "stroll", title: "Dysert Round",
    flavour: "A field path to a hermitage and a high cross, returning by the boreen.",
    distanceM: 3160, durationMin: 52, startsAwayM: 220, townland: "Dysert",
    honesty: ["Road without a pavement for 300m", "Likely mud after rain"],
    objectives: [
      { id: "o-3", pointId: "p-dysert", label: "Dysert O'Dea", required: true, x: 0.31, y: 0.62 },
    ],
    path: [[0.2, 0.8], [0.24, 0.72], [0.31, 0.62], [0.42, 0.6], [0.38, 0.74], [0.2, 0.8]],
  },
  {
    id: "q-toonagh", tier: "trot", title: "Toonagh Mill",
    flavour: "Ten minutes to a ruined corn mill and back along the race.",
    distanceM: 1080, durationMin: 16, startsAwayM: 0, townland: "Toonagh",
    honesty: ["Made paths throughout"],
    objectives: [
      { id: "o-4", pointId: "p-toonagh", label: "Toonagh mill", required: true, x: 0.79, y: 0.68 },
    ],
    path: [[0.64, 0.78], [0.72, 0.72], [0.79, 0.68], [0.7, 0.82], [0.64, 0.78]],
  },
  {
    id: "q-inchiquin", tier: "sidequest", title: "Inchiquin Shore",
    flavour: "Lough shore, a tower house on the point, and the hill road back.",
    distanceM: 6140, durationMin: 94, startsAwayM: 410, townland: "Inchiquin",
    honesty: ["Steep for 600m on the return", "Finishes after sunset if you start now"],
    objectives: [
      { id: "o-5", pointId: "p-inchiquin", label: "Inchiquin Lough", required: true, x: 0.52, y: 0.78 },
      { id: "o-6", pointId: "p-cahercalla", label: "Cahercalla ringfort", required: true, x: 0.68, y: 0.34 },
      { id: "o-7", pointId: null, label: "The high point", required: false, x: 0.86, y: 0.5 },
    ],
    path: [[0.3, 0.88], [0.44, 0.82], [0.52, 0.78], [0.68, 0.62], [0.78, 0.44], [0.68, 0.34], [0.5, 0.5], [0.3, 0.88]],
  },
];

export const WALKS: WalkRecord[] = [
  { id: "w-1", questTitle: "Cloonanaha Loop", tier: "stroll", dateISO: "2026-08-28",
    distanceM: 2840, durationMin: 51, tilesGained: 186, townland: "Cloonanaha", status: "completed" },
  { id: "w-2", questTitle: "Toonagh Mill", tier: "trot", dateISO: "2026-08-26",
    distanceM: 1080, durationMin: 18, tilesGained: 64, townland: "Toonagh", status: "completed" },
  { id: "w-3", questTitle: "Dysert Round", tier: "stroll", dateISO: "2026-08-21",
    distanceM: 1960, durationMin: 34, tilesGained: 92, townland: "Dysert", status: "abandoned" },
];

export const CATEGORIES: CategoryProgress[] = [
  { group: "fort",    label: "Fortified", reached: 3,  total: 47 },
  { group: "sacred",  label: "Sacred",    reached: 5,  total: 112 },
  { group: "ancient", label: "Ancient",   reached: 1,  total: 38 },
  { group: "water",   label: "Water",     reached: 4,  total: 61 },
  { group: "green",   label: "Green",     reached: 2,  total: 29 },
  { group: "height",  label: "Elevation", reached: 0,  total: 18 },
  { group: "built",   label: "Built",     reached: 6,  total: 94 },
  { group: "table",   label: "Table",     reached: 2,  total: null },
];
