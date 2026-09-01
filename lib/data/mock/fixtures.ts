import type {
  Badge, CategoryProgress, Collectible, CommunityQuest, HomeCard, Point, Quest,
  Tale, Territory, WalkRecord,
} from "../types";

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
    id: "p-cahercalla", tags: ["Upstanding remains", "From a boreen", "Free", "Ringfort"], name: "Cahercalla", nameGa: "Cathair Cala",
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
    id: "p-dysert", tags: ["High cross", "Monastic", "Car park", "12th century"], name: "Dysert O'Dea", nameGa: "Díseart Uí Dheá",
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
    id: "p-inchiquin", tags: ["Lough shore", "West facing", "Good at dusk", "Level ground"], name: "Inchiquin Lough", nameGa: "Loch Inse Uí Chuinn",
    category: "Lough shore", group: "water", townland: "Inchiquin",
    x: 0.52, y: 0.78,
    lore: [
      { kind: "placename", title: "Loch Inse Uí Chuinn",
        body: "The lake of O'Quin's island. Inis is an island or a river meadow, and the Uí Chuinn held this ground into the seventeenth century.",
        sourceName: "Logainm", sourceUrl: "https://www.logainm.ie", licence: "CC BY 4.0", linkOnly: false },
    ],
  },
  {
    id: "p-ballykeel", tags: ["Mass rock", "Penal era", "Field path", "Hard to spot"], name: "Ballykeel mass rock", nameGa: "An Baile Caol",
    category: "Mass rock", group: "sacred", townland: "Ballykeel",
    x: 0.19, y: 0.24,
    lore: [
      { kind: "placename", title: "An Baile Caol",
        body: "The narrow townland. Caol describes a narrow strip of ground, often between two watercourses.",
        sourceName: "Logainm", sourceUrl: "https://www.logainm.ie", licence: "CC BY 4.0", linkOnly: false },
    ],
  },
  {
    id: "p-toonagh", tags: ["Mill race", "c. 1840", "Roadside", "Limestone"], name: "Toonagh mill", category: "Mill", group: "built",
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
    id: "q-cloonanaha", tier: "stroll", shape: "loop", surface: "unpaved", ascentM: 34,
    title: "Cloonanaha Loop",
    flavour: "Out along the old mass path to a ringfort on the rise, back down by the stream.",
    distanceM: 2840, durationMin: 47, startsAwayM: 0, townland: "Cloonanaha",
    honesty: ["Two stiles", "Unpaved for 400m after the second gate"],
    objectives: [
      { id: "o-1", pointId: "p-cahercalla", label: "Cahercalla ringfort", required: true, reached: true, atM: 1450, x: 0.68, y: 0.34 },
      { id: "o-2", pointId: null, label: "Cross the stream", required: false, reached: false, atM: 2200, x: 0.44, y: 0.55 },
    ],
    path: [[0.16, 0.72], [0.3, 0.6], [0.44, 0.55], [0.6, 0.42], [0.68, 0.34], [0.62, 0.5], [0.4, 0.66], [0.16, 0.72]],
  },
  {
    id: "q-dysert", tier: "stroll", shape: "loop", surface: "unpaved", ascentM: 22,
    title: "Dysert Round",
    flavour: "A field path to a hermitage and a high cross, returning by the boreen.",
    distanceM: 3160, durationMin: 52, startsAwayM: 220, townland: "Dysert",
    honesty: ["Road without a pavement for 300m", "Likely mud after rain"],
    objectives: [
      { id: "o-3", pointId: "p-dysert", label: "Dysert O'Dea", required: true, reached: false, atM: 1600, x: 0.31, y: 0.62 },
    ],
    path: [[0.2, 0.8], [0.24, 0.72], [0.31, 0.62], [0.42, 0.6], [0.38, 0.74], [0.2, 0.8]],
  },
  {
    id: "q-toonagh", tier: "trot", shape: "line", surface: "made", ascentM: 6,
    title: "Toonagh Mill",
    flavour: "Ten minutes to a ruined corn mill and back along the race.",
    distanceM: 1080, durationMin: 16, startsAwayM: 0, townland: "Toonagh",
    honesty: ["Made paths throughout"],
    objectives: [
      { id: "o-4", pointId: "p-toonagh", label: "Toonagh mill", required: true, reached: false, atM: 540, x: 0.79, y: 0.68 },
    ],
    path: [[0.64, 0.78], [0.72, 0.72], [0.79, 0.68], [0.7, 0.82], [0.64, 0.78]],
  },
  {
    id: "q-inchiquin", tier: "sidequest", shape: "loop", surface: "rough", ascentM: 180,
    title: "Inchiquin Shore",
    flavour: "Lough shore, a tower house on the point, and the hill road back.",
    distanceM: 6140, durationMin: 94, startsAwayM: 410, townland: "Inchiquin",
    honesty: ["Steep for 600m on the return", "Finishes after sunset if you start now"],
    objectives: [
      { id: "o-5", pointId: "p-inchiquin", label: "Inchiquin Lough", required: true, reached: true, atM: 1200, x: 0.52, y: 0.78 },
      { id: "o-6", pointId: "p-cahercalla", label: "Cahercalla ringfort", required: true, reached: false, atM: 3800, x: 0.68, y: 0.34 },
      { id: "o-7", pointId: null, label: "The high point", required: false, reached: false, atM: 4900, x: 0.86, y: 0.5 },
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


export const COLLECTIBLES: Collectible[] = [
  { id: "c-1", name: "Ringfort bank", category: "Ringfort", group: "fort",
    foundAt: "2026-08-28", townland: "Cahercalla Beg", count: 3 },
  { id: "c-2", name: "Holy well cup", category: "Holy well", group: "sacred",
    foundAt: "2026-08-26", townland: "Toonagh", count: 1 },
  { id: "c-3", name: "Mill race stone", category: "Mill", group: "built",
    foundAt: "2026-08-26", townland: "Toonagh", count: 2 },
  { id: "c-4", name: "Lough shore reed", category: "Lough shore", group: "water",
    foundAt: "2026-08-21", townland: "Inchiquin", count: 4 },
];

export const BADGES: Badge[] = [
  { id: "b-1", label: "First light", description: "Finish your first walk",
    group: "green", earnedAt: "2026-08-26", progress: 1, target: 1 },
  { id: "b-2", label: "Rath finder", description: "Reach five ringforts",
    group: "fort", earnedAt: null, progress: 3, target: 5 },
  { id: "b-3", label: "Well read", description: "Read twenty tales",
    group: "sacred", earnedAt: null, progress: 7, target: 20 },
  { id: "b-4", label: "Parish bounds", description: "Explore twenty five townlands",
    group: "height", earnedAt: null, progress: 14, target: 25 },
  { id: "b-5", label: "Long way round", description: "Walk one hundred kilometres",
    group: "built", earnedAt: null, progress: 34, target: 100 },
  { id: "b-6", label: "Turf cutter", description: "Cross three bogs",
    group: "green", earnedAt: null, progress: 0, target: 3 },
];

export const TALES: Tale[] = [
  {
    id: "t-1", pointId: "p-cahercalla", pointName: "Cahercalla",
    townland: "Cahercalla Beg", kind: "placename",
    title: "The stone fort of the landing place", readAt: "2026-08-28",
    cards: [
      { kind: "placename", title: "Cathair Cala",
        body: "Cathair marks a fort built of stone rather than earth. Cala is a riverside landing, or the soft meadow ground beside one. Put together the name tells you what this place was and where it stood, which is more than most maps manage.",
        sourceName: "Logainm", sourceUrl: "https://www.logainm.ie", licence: "CC BY 4.0", linkOnly: false },
      { kind: "archaeology", title: "What is still here",
        body: "A circular enclosure roughly thirty metres across, with an earthen bank and an outer ditch. The bank stands about a metre and a half on the western side and drops away to almost nothing on the east, where cattle have worked at it for a long time.",
        sourceName: "Archaeological Survey of Ireland", sourceUrl: "https://www.archaeology.ie", licence: "CC BY 4.0", linkOnly: false },
      { kind: "fact", title: "Who lived in one",
        body: "Ringforts were farmsteads, not castles. A family, their animals and their stores sat inside the bank, which kept the cattle in and the wolves out rather than holding off an army. Most were built between the seventh and tenth centuries.",
        sourceName: "Wikidata", sourceUrl: "https://www.wikidata.org", licence: "CC0", linkOnly: false },
      { kind: "fact", title: "Why so many survived",
        body: "There are more than forty thousand recorded in Ireland. They lasted because breaking one was thought to be desperately unlucky, so farmers ploughed around them for a thousand years. Superstition turned out to be a decent conservation policy.",
        sourceName: "Wikidata", sourceUrl: "https://www.wikidata.org", licence: "CC0", linkOnly: false },
    ],
  },
  {
    id: "t-2", pointId: "p-toonagh", pointName: "Toonagh mill",
    townland: "Toonagh", kind: "architecture",
    title: "A corn mill and its water", readAt: "2026-08-26",
    cards: [
      { kind: "architecture", title: "Built about 1840",
        body: "Detached, three bays wide and two storeys tall, in rubble limestone with dressed quoins at the corners. The wheel pit survives on the north elevation, which is the part most worth walking round to see.",
        sourceName: "NIAH", sourceUrl: "https://www.buildingsofireland.ie", licence: "CC BY 4.0", linkOnly: false },
      { kind: "fact", title: "The race is the giveaway",
        body: "The straight channel running to the mill is a head race, cut to bring water in above the wheel. The one leaving is the tail race. Once you can spot the pair you will find mills all over the county that have otherwise vanished.",
        sourceName: "Wikidata", sourceUrl: "https://www.wikidata.org", licence: "CC0", linkOnly: false },
      { kind: "placename", title: "Tuathanach",
        body: "The townland name comes from a word for a farmer or a holding of farmland. A mill here was not industry arriving, it was the neighbours no longer having to carry grain over the hill.",
        sourceName: "Logainm", sourceUrl: "https://www.logainm.ie", licence: "CC BY 4.0", linkOnly: false },
    ],
  },
  {
    id: "t-3", pointId: "p-inchiquin", pointName: "Inchiquin Lough",
    townland: "Inchiquin", kind: "placename",
    title: "The lake of O'Quin's island", readAt: "2026-08-21",
    cards: [
      { kind: "placename", title: "Loch Inse Ui Chuinn",
        body: "Inis is an island, though in placenames it just as often means a river meadow, dry ground in wet country. The Ui Chuinn held this land into the seventeenth century and left their name on the water.",
        sourceName: "Logainm", sourceUrl: "https://www.logainm.ie", licence: "CC BY 4.0", linkOnly: false },
      { kind: "fact", title: "A turlough in all but name",
        body: "Water levels here move a great deal between summer and winter. Much of Clare sits on limestone that drains from below, so lakes fill and empty through the rock rather than over it.",
        sourceName: "Wikidata", sourceUrl: "https://www.wikidata.org", licence: "CC0", linkOnly: false },
      { kind: "fact", title: "Worth the light",
        body: "The shore faces roughly west. An hour before sunset is the best of it, and the walk back is short enough that you can afford to wait.",
        sourceName: "Side Quest", sourceUrl: "https://sidequest.ie", licence: "Ours", linkOnly: false },
    ],
  },
  {
    id: "t-4", pointId: "p-dysert", pointName: "Dysert O'Dea",
    townland: "Dysert", kind: "placename",
    title: "The hermitage of O'Dea", readAt: null,
    cards: [
      { kind: "placename", title: "Diseart Ui Dhea",
        body: "Diseart comes from the Latin desertum, a deserted place. It names ground someone withdrew to on purpose. There are dozens across Ireland and each one marks a decision to go somewhere quieter.",
        sourceName: "Logainm", sourceUrl: "https://www.logainm.ie", licence: "CC BY 4.0", linkOnly: false },
      { kind: "archaeology", title: "The high cross",
        body: "A twelfth century cross stands in the field to the east, carved with a bishop and a figure of Christ. It fell, was buried, and was raised again in the nineteenth century, which is why it is in the condition it is.",
        sourceName: "Archaeological Survey of Ireland", sourceUrl: "https://www.archaeology.ie", licence: "CC BY 4.0", linkOnly: false },
      { kind: "reference", title: "The battle of 1318",
        body: "", sourceName: "Wikipedia",
        sourceUrl: "https://en.wikipedia.org/wiki/Battle_of_Dysert_O%27Dea",
        licence: "CC BY-SA 4.0", linkOnly: true },
    ],
  },
];


export const COMMUNITY: CommunityQuest[] = [
  { id: "cq-1", title: "Castle ruins by rivers", author: "Niamh", townland: "Corofin",
    tier: "sidequest", shape: "loop", distanceM: 6200, walkers: 148 },
  { id: "cq-2", title: "Three holy wells", author: "Padraig", townland: "Kilnaboy",
    tier: "stroll", shape: "loop", distanceM: 3100, walkers: 92 },
  { id: "cq-3", title: "The mill races", author: "Aoife", townland: "Toonagh",
    tier: "trot", shape: "line", distanceM: 1200, walkers: 64 },
  { id: "cq-4", title: "Burren limestone walk", author: "Sean", townland: "Carran",
    tier: "adventure", shape: "loop", distanceM: 11800, walkers: 211 },
  { id: "cq-5", title: "Ringforts of the parish", author: "Maire", townland: "Dysert",
    tier: "sidequest", shape: "loop", distanceM: 5900, walkers: 37 },
  { id: "cq-6", title: "Lough shore at dusk", author: "Cillian", townland: "Inchiquin",
    tier: "stroll", shape: "line", distanceM: 2900, walkers: 118 },
];

export const HOME_CARDS: HomeCard[] = [
  { id: "hc-1", kind: "quest", ratio: "portrait", eyebrow: "Ready to walk",
    title: "Cloonanaha Loop", body: "A ringfort on the rise, back down by the stream.",
    href: "/quests/q-cloonanaha" },
  { id: "hc-2", kind: "update", ratio: "square", eyebrow: "New tale",
    title: "Why forty thousand ringforts survived",
    body: "Breaking one was desperately unlucky, so farmers ploughed around them.",
    href: "/tales/t-1" },
  { id: "hc-3", kind: "banner", ratio: "landscape", eyebrow: "Co. Clare",
    title: "2,318 townlands. You have 14.", href: "/badges" },
  { id: "hc-4", kind: "community", ratio: "portrait", eyebrow: "From the community",
    title: "Castle ruins by rivers", body: "Eight quests, put together by Niamh.",
    href: "/quests?tab=community" },
  { id: "hc-5", kind: "update", ratio: "square", eyebrow: "Close",
    title: "Two ringforts from a badge", body: "Rath finder unlocks at five.",
    href: "/badges" },
];

export const UPDATES: string[] = [
  "New: 46 points added around Corofin",
  "Rath finder is 2 ringforts away",
  "Niamh published Castle ruins by rivers",
  "Tales now read as cards you can share",
  "Co. Clare is 0.04% explored",
];
