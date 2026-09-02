import type {
  ActivityEvent, Badge, CategoryProgress, Challenge, Collectible, CommunityPoint,
  CommunityQuest, Friend, FriendQuest, HomeCard, Note, Point, Quest, Tale,
  Territory, WalkRecord,
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
    plate: "poi-cahercalla", id: "p-cahercalla", blurb: "An earthen ring on the rise, banks still standing.", visited: true, tags: ["Upstanding remains", "From a boreen", "Free", "Ringfort"], name: "Cahercalla", nameGa: "Cathair Cala",
    category: "Ringfort", group: "fort", townland: "Cahercalla Beg",
    lat: 52.93404, lng: -9.22566,
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
    plate: "poi-dysert", id: "p-dysert", blurb: "A hermitage, a round tower stump and a carved high cross.", visited: false, tags: ["High cross", "Monastic", "Car park", "12th century"], name: "Dysert O'Dea", nameGa: "Díseart Uí Dheá",
    category: "Monastic site", group: "sacred", townland: "Dysert",
    lat: 52.891196, lng: -9.069451,
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
    plate: "poi-inchiquin", id: "p-inchiquin", blurb: "A west facing lough shore that fills and empties through the rock.", visited: true, tags: ["Lough shore", "West facing", "Good at dusk", "Level ground"], name: "Inchiquin Lough", nameGa: "Loch Inse Uí Chuinn",
    category: "Lough shore", group: "water", townland: "Inchiquin",
    lat: 52.937668, lng: -9.052817,
    lore: [
      { kind: "placename", title: "Loch Inse Uí Chuinn",
        body: "The lake of O'Quin's island. Inis is an island or a river meadow, and the Uí Chuinn held this ground into the seventeenth century.",
        sourceName: "Logainm", sourceUrl: "https://www.logainm.ie", licence: "CC BY 4.0", linkOnly: false },
    ],
  },
  {
    plate: "poi-ballykeel", id: "p-ballykeel", blurb: "A flat stone in a field where mass was said in secret.", visited: false, tags: ["Mass rock", "Penal era", "Field path", "Hard to spot"], name: "Ballykeel mass rock", nameGa: "An Baile Caol",
    category: "Mass rock", group: "sacred", townland: "Ballykeel",
    lat: 52.918, lng: -9.14,
    lore: [
      { kind: "placename", title: "An Baile Caol",
        body: "The narrow townland. Caol describes a narrow strip of ground, often between two watercourses.",
        sourceName: "Logainm", sourceUrl: "https://www.logainm.ie", licence: "CC BY 4.0", linkOnly: false },
    ],
  },
  {
    plate: "poi-toonagh", id: "p-toonagh", blurb: "A ruined corn mill with its wheel pit and race intact.", visited: true, tags: ["Mill race", "c. 1840", "Roadside", "Limestone"], name: "Toonagh mill", category: "Mill", group: "built",
    nameGa: "Tuathanach", townland: "Toonagh", lat: 52.87973, lng: -9.006513,
    lore: [
      { kind: "architecture", title: "Corn mill, c. 1840",
        body: "Detached three-bay two-storey former corn mill, rubble limestone with dressed quoins. Wheel pit survives to the north elevation.",
        sourceName: "NIAH", sourceUrl: "https://www.buildingsofireland.ie", licence: "CC BY 4.0", linkOnly: false },
    ],
  },
];

/** Quest starts carry approximate townland centres in Co. Clare. They are
 *  fixture coordinates, good enough to exercise the proximity gate and no more:
 *  the surveyed positions arrive with the dataset. docs/data-pipeline.md. */
/** Quest starts and routes carry approximate positions in Co. Clare. They are
 *  fixture geography, generated so that a route's drawn length matches the
 *  distance printed beside it and every waypoint sits on the route that visits
 *  it. The surveyed positions arrive with the dataset. docs/data-pipeline.md. */
export const QUESTS: Quest[] = [
  {
    plate: "quest-cloonanaha", start: { lat: 52.9410, lng: -9.2260 }, startName: "Cloonanaha", id: "q-cloonanaha",
    encounters: [
      { kind: "point", label: "A ringfort", detail: "Banks still standing, on the rise" },
      { kind: "terrain", label: "A stream crossing", detail: "Stepping stones, dry in summer" },
      { kind: "food", label: "Maybe a coffee", detail: "A hatch at the crossroads, hours unverified" },
      { kind: "view", label: "Back over the valley" },
    ], tier: "stroll", shape: "loop", surface: "unpaved", ascentM: 34,
    title: "Cloonanaha Loop",
    flavour: "Out along the old mass path to a ringfort on the rise, back down by the stream.",
    distanceM: 2840, durationMin: 47, startsAwayM: 0, townland: "Cloonanaha",
    honesty: ["Two stiles", "Unpaved for 400m after the second gate"],
    objectives: [
      { id: "o-1", pointId: "p-cahercalla", label: "Cahercalla ringfort", required: true, reached: true, atM: 1450, lat: 52.93404, lng: -9.22566 },
      { id: "o-2", pointId: null, label: "Cross the stream", required: false, reached: false, atM: 2200, lat: 52.937654, lng: -9.232889 },
    ],
    path: [
      [-9.226, 52.941], [-9.224061, 52.941591], [-9.22263, 52.940746],
      [-9.221726, 52.939804], [-9.221019, 52.938962], [-9.220631, 52.938096],
      [-9.220604, 52.937229], [-9.220457, 52.936334], [-9.220142, 52.935191],
      [-9.220563, 52.933952], [-9.222251, 52.933315], [-9.224385, 52.933596],
      [-9.226, 52.934159], [-9.2273, 52.934306], [-9.228888, 52.934215],
      [-9.230576, 52.934471], [-9.231858, 52.935191], [-9.23272, 52.936144],
      [-9.233119, 52.937229], [-9.232546, 52.938286], [-9.230981, 52.938962],
      [-9.229412, 52.939285], [-9.228508, 52.939847], [-9.227624, 52.940882],
      [-9.226, 52.941],
    ],
  },
  {
    plate: "quest-dysert", start: { lat: 52.8990, lng: -9.0700 }, startName: "Dysert", id: "q-dysert",
    encounters: [
      { kind: "point", label: "A hermitage and a high cross" },
      { kind: "terrain", label: "A stretch of boreen", detail: "No pavement for 300m" },
      { kind: "food", label: "Maybe lunch", detail: "Pub in the village, kitchen closes at three" },
    ], tier: "stroll", shape: "loop", surface: "unpaved", ascentM: 22,
    title: "Dysert Round",
    flavour: "A field path to a hermitage and a high cross, returning by the boreen.",
    distanceM: 3160, durationMin: 52, startsAwayM: 220, townland: "Dysert",
    honesty: ["Road without a pavement for 300m", "Likely mud after rain"],
    objectives: [
      { id: "o-3", pointId: "p-dysert", label: "Dysert O'Dea", required: true, reached: false, atM: 1600, lat: 52.891196, lng: -9.069451 },
    ],
    path: [
      [-9.07, 52.899], [-9.067844, 52.899657], [-9.066254, 52.898718],
      [-9.065249, 52.89767], [-9.064464, 52.896732], [-9.064032, 52.895769],
      [-9.064002, 52.894804], [-9.063839, 52.893808], [-9.063488, 52.892536],
      [-9.063956, 52.891158], [-9.065832, 52.89045], [-9.068205, 52.890762],
      [-9.07, 52.891388], [-9.071445, 52.891551], [-9.07321, 52.89145],
      [-9.075087, 52.891736], [-9.076512, 52.892536], [-9.07747, 52.893597],
      [-9.077914, 52.894804], [-9.077276, 52.89598], [-9.075536, 52.896732],
      [-9.073793, 52.897092], [-9.072788, 52.897717], [-9.071805, 52.898868],
      [-9.07, 52.899],
    ],
  },
  {
    plate: "quest-toonagh", start: { lat: 52.8760, lng: -9.0110 }, startName: "Toonagh", id: "q-toonagh",
    encounters: [
      { kind: "point", label: "A ruined corn mill" },
      { kind: "terrain", label: "The mill race", detail: "Straight cut channel, easy to spot" },
    ], tier: "trot", shape: "line", surface: "made", ascentM: 6,
    title: "Toonagh Mill",
    flavour: "Ten minutes to a ruined corn mill and back along the race.",
    distanceM: 1080, durationMin: 16, startsAwayM: 0, townland: "Toonagh",
    honesty: ["Made paths throughout"],
    objectives: [
      { id: "o-4", pointId: "p-toonagh", label: "Toonagh mill", required: true, reached: false, atM: 540, lat: 52.87973, lng: -9.006513 },
    ],
    path: [
      [-9.011, 52.876], [-9.010331, 52.876311], [-9.00977, 52.876622],
      [-9.00939, 52.876933], [-9.009204, 52.877243], [-9.009161, 52.877554],
      [-9.009161, 52.877865], [-9.009092, 52.878176], [-9.008864, 52.878487],
      [-9.00844, 52.878798], [-9.007846, 52.879109], [-9.007166, 52.87942],
      [-9.006513, 52.87973], [-9.007166, 52.87942], [-9.007846, 52.879109],
      [-9.00844, 52.878798], [-9.008864, 52.878487], [-9.009092, 52.878176],
      [-9.009161, 52.877865], [-9.009161, 52.877554], [-9.009204, 52.877243],
      [-9.00939, 52.876933], [-9.00977, 52.876622], [-9.010331, 52.876311],
      [-9.011, 52.876],
    ],
  },
  {
    plate: "quest-inchiquin", start: { lat: 52.9430, lng: -9.0640 }, startName: "Inchiquin", id: "q-inchiquin",
    encounters: [
      { kind: "point", label: "A lough shore" },
      { kind: "point", label: "A ringfort on the way back" },
      { kind: "view", label: "The high point", detail: "Best of it an hour before sunset" },
      { kind: "terrain", label: "Steep for 600m", detail: "On the return leg" },
      { kind: "food", label: "Maybe a pint", detail: "Halfway, if the bar is open" },
    ], tier: "sidequest", shape: "loop", surface: "rough", ascentM: 180,
    title: "Inchiquin Shore",
    flavour: "Lough shore, a tower house on the point, and the hill road back.",
    distanceM: 6140, durationMin: 94, startsAwayM: 410, townland: "Inchiquin",
    honesty: ["Steep for 600m on the return", "Finishes after sunset if you start now"],
    objectives: [
      { id: "o-5", pointId: "p-inchiquin", label: "Inchiquin Lough", required: true, reached: true, atM: 1200, lat: 52.937668, lng: -9.052817 },
      { id: "o-6", pointId: null, label: "The old field wall", required: true, reached: false, atM: 3800, lat: 52.928739, lng: -9.072927 },
      { id: "o-7", pointId: null, label: "The high point", required: false, reached: false, atM: 4900, lat: 52.936995, lng: -9.078227 },
    ],
    path: [
      [-9.064, 52.943], [-9.059807, 52.944277], [-9.056714, 52.942452],
      [-9.05476, 52.940415], [-9.053232, 52.938594], [-9.052392, 52.936722],
      [-9.052334, 52.934847], [-9.052016, 52.932912], [-9.051335, 52.930441],
      [-9.052245, 52.927763], [-9.055894, 52.926387], [-9.060508, 52.926994],
      [-9.064, 52.928211], [-9.06681, 52.928528], [-9.070243, 52.928331],
      [-9.073893, 52.928886], [-9.076665, 52.930441], [-9.078528, 52.932502],
      [-9.079391, 52.934847], [-9.078152, 52.937133], [-9.074768, 52.938594],
      [-9.071377, 52.939293], [-9.069423, 52.940508], [-9.067511, 52.942744],
      [-9.064, 52.943],
    ],
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
  { plate: "collectible-ringfort-bank", id: "c-1", name: "Ringfort bank", category: "Ringfort", group: "fort",
    foundAt: "2026-08-28", townland: "Cahercalla Beg", count: 3 },
  { plate: "collectible-holy-well-cup", id: "c-2", name: "Holy well cup", category: "Holy well", group: "sacred",
    foundAt: "2026-08-26", townland: "Toonagh", count: 1 },
  { plate: "collectible-mill-race-stone", id: "c-3", name: "Mill race stone", category: "Mill", group: "built",
    foundAt: "2026-08-26", townland: "Toonagh", count: 2 },
  { plate: "collectible-lough-shore-reed", id: "c-4", name: "Lough shore reed", category: "Lough shore", group: "water",
    foundAt: "2026-08-21", townland: "Inchiquin", count: 4 },
];

export const BADGES: Badge[] = [
  { plate: "badge-first-light", id: "b-1", label: "First light", description: "Finish your first walk",
    group: "green", earnedAt: "2026-08-26", progress: 1, target: 1 },
  { plate: "badge-rath-finder", id: "b-2", label: "Rath finder", description: "Reach five ringforts",
    group: "fort", earnedAt: null, progress: 3, target: 5 },
  { plate: "badge-well-read", id: "b-3", label: "Well read", description: "Read twenty tales",
    group: "sacred", earnedAt: null, progress: 7, target: 20 },
  { plate: "badge-parish-bounds", id: "b-4", label: "Parish bounds", description: "Explore twenty five townlands",
    group: "height", earnedAt: null, progress: 14, target: 25 },
  { plate: "badge-long-way-round", id: "b-5", label: "Long way round", description: "Walk one hundred kilometres",
    group: "built", earnedAt: null, progress: 34, target: 100 },
  { plate: "badge-turf-cutter", id: "b-6", label: "Turf cutter", description: "Cross three bogs",
    group: "green", earnedAt: null, progress: 0, target: 3 },
];

export const TALES: Tale[] = [
  {
    plate: "tale-cahercalla", id: "t-1", pointId: "p-cahercalla", pointName: "Cahercalla",
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
    plate: "tale-toonagh-mill", id: "t-2", pointId: "p-toonagh", pointName: "Toonagh mill",
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
    plate: "tale-inchiquin", id: "t-3", pointId: "p-inchiquin", pointName: "Inchiquin Lough",
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
    plate: "tale-dysert", id: "t-4", pointId: "p-dysert", pointName: "Dysert O'Dea",
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
  { plate: "community-castle-ruins-by-rivers", id: "cq-1", title: "Castle ruins by rivers", author: "Niamh", townland: "Corofin",
    tier: "sidequest", shape: "loop", distanceM: 6200, walkers: 148 },
  { plate: "community-three-holy-wells", id: "cq-2", title: "Three holy wells", author: "Padraig", townland: "Kilnaboy",
    tier: "stroll", shape: "loop", distanceM: 3100, walkers: 92 },
  { plate: "community-the-mill-races", id: "cq-3", title: "The mill races", author: "Aoife", townland: "Toonagh",
    tier: "trot", shape: "line", distanceM: 1200, walkers: 64 },
  { plate: "community-burren-limestone-walk", id: "cq-4", title: "Burren limestone walk", author: "Sean", townland: "Carran",
    tier: "adventure", shape: "loop", distanceM: 11800, walkers: 211 },
  { plate: "community-ringforts-of-the-parish", id: "cq-5", title: "Ringforts of the parish", author: "Maire", townland: "Dysert",
    tier: "sidequest", shape: "loop", distanceM: 5900, walkers: 37 },
  { plate: "community-lough-shore-at-dusk", id: "cq-6", title: "Lough shore at dusk", author: "Cillian", townland: "Inchiquin",
    tier: "stroll", shape: "line", distanceM: 2900, walkers: 118 },
];

export const HOME_CARDS: HomeCard[] = [
  { plate: "home-ready", id: "hc-1", kind: "quest", ratio: "portrait", eyebrow: "Ready to walk",
    title: "Cloonanaha Loop", body: "A ringfort on the rise, back down by the stream.",
    href: "/quests/q-cloonanaha" },
  { plate: "home-tale", id: "hc-2", kind: "update", ratio: "square", eyebrow: "New tale",
    title: "Why forty thousand ringforts survived",
    body: "Breaking one was desperately unlucky, so farmers ploughed around them.",
    href: "/tales/t-1" },
  { plate: "home-county", id: "hc-3", kind: "banner", ratio: "landscape", eyebrow: "Co. Clare",
    title: "2,318 townlands. You have 14.", href: "/collection" },
  { plate: "home-community", id: "hc-4", kind: "community", ratio: "portrait", eyebrow: "From the community",
    title: "Castle ruins by rivers", body: "Eight quests, put together by Niamh.",
    href: "/quests?tab=community" },
  { plate: "home-close", id: "hc-5", kind: "update", ratio: "square", eyebrow: "Close",
    title: "Two ringforts from a badge", body: "Rath finder unlocks at five.",
    href: "/collection" },
];



export const NOTES: Note[] = [
  { id: "n-1", walkId: "w-1", questTitle: "Cloonanaha Loop",
    text: "Heron on the stream, stood dead still for a full minute before it went.",
    atM: 1980, lat: 52.935775, lng: -9.232387, createdAt: "2026-08-28" },
  { id: "n-2", walkId: "w-1", questTitle: "Cloonanaha Loop",
    text: "The bank is higher on the west side than the survey makes it sound.",
    atM: 1450, lat: 52.93404, lng: -9.22566, createdAt: "2026-08-28" },
  { id: "n-3", walkId: "w-2", questTitle: "Toonagh Mill",
    text: "Race is completely dry. Whole channel walkable if you fancy it.",
    atM: 540, lat: 52.87973, lng: -9.006513, createdAt: "2026-08-26" },
];


export const ACTIVITY: ActivityEvent[] = [
  { id: "a-1", name: "Niamh", kind: "badge", text: "Niamh earned Rath finder", at: "4m" },
  { id: "a-2", name: "Padraig", kind: "quest", text: "Padraig walked a Stroll near Kilnaboy", at: "12m" },
  { id: "a-3", name: "Aoife", kind: "tale", text: "Aoife unlocked the tale of Dysert O'Dea", at: "26m" },
  { id: "a-4", name: "Cillian", kind: "poi", text: "Cillian found Toonagh mill", at: "41m" },
  { id: "a-5", name: "Sean", kind: "friend", text: "Sean invited a friend", at: "1h" },
  { id: "a-6", name: "Maire", kind: "joined", text: "Maire made an account", at: "1h" },
  { id: "a-7", name: "Eoin", kind: "collection", text: "Eoin published Castle ruins by rivers", at: "2h" },
  { id: "a-8", name: "Roisin", kind: "quest", text: "Roisin finished an Adventure in the Burren", at: "3h" },
  { id: "a-9", name: "Fionn", kind: "poi", text: "Fionn found Cahercalla ringfort", at: "4h" },
  { id: "a-10", name: "Sinead", kind: "badge", text: "Sinead earned First light", at: "5h" },
  { id: "a-11", name: "Darragh", kind: "tale", text: "Darragh unlocked the tale of Inchiquin Lough", at: "6h" },
  { id: "a-12", name: "Orla", kind: "quest", text: "Orla walked a Trot near Corofin", at: "8h" },
];

export const FRIENDS: Friend[] = [
  { id: "f-1", name: "Niamh", initials: "NB", townland: "Corofin", rank: 12, walksTogether: 6, lastSeen: "Today" },
  { id: "f-2", name: "Padraig", initials: "PC", townland: "Kilnaboy", rank: 9, walksTogether: 3, lastSeen: "Yesterday" },
  { id: "f-3", name: "Aoife", initials: "AD", townland: "Toonagh", rank: 7, walksTogether: 11, lastSeen: "2 days" },
  { id: "f-4", name: "Sean", initials: "SO", townland: "Carran", rank: 15, walksTogether: 1, lastSeen: "A week" },
];

export const REQUESTS: Friend[] = [
  { id: "r-1", name: "Roisin", initials: "RM", townland: "Ennistymon", rank: 4, walksTogether: 0, lastSeen: "New" },
  { id: "r-2", name: "Fionn", initials: "FK", townland: "Lahinch", rank: 6, walksTogether: 0, lastSeen: "New" },
];

export const FRIEND_QUESTS: FriendQuest[] = [
  { id: "fq-1", friend: "Niamh", title: "Castle ruins by rivers", townland: "Corofin",
    tier: "sidequest", shape: "loop", distanceM: 6200 },
  { id: "fq-2", friend: "Aoife", title: "The mill races", townland: "Toonagh",
    tier: "trot", shape: "line", distanceM: 1200 },
  { id: "fq-3", friend: "Sean", title: "Burren limestone walk", townland: "Carran",
    tier: "adventure", shape: "loop", distanceM: 11800 },
];

export const CHALLENGES: Challenge[] = [
  { id: "c-1", title: "Beat Niamh to five ringforts", line: "She is on three. So are you.", friend: "Niamh" },
  { id: "c-2", title: "A townland neither of you has", line: "Pick one on the map and both walk it this week." },
  { id: "c-3", title: "Same walk, different day", line: "Walk Aoife's mill races and compare notes.", friend: "Aoife" },
  { id: "c-4", title: "Furthest from home", line: "Whoever reaches the furthest new tile by Sunday." },
];


export const COMMUNITY_POINTS: CommunityPoint[] = [
  { id: "cp-1", title: "The clapper bridge", author: "Niamh",
    description: "Flat slabs across the stream below the ford. Older than the road beside it.",
    lat: 52.9365, lng: -9.221, status: "approved", createdAt: "2026-08-19" },
  { id: "cp-2", title: "Bench with the view", author: "Aoife",
    description: "Someone put a bench at the top of the boreen. Best seat in the parish.",
    lat: 52.9095, lng: -9.0755, status: "approved", createdAt: "2026-08-11" },
  { id: "cp-3", title: "Old forge door", author: "Josh",
    description: "Green door, horseshoe still nailed above it.",
    lat: 52.882, lng: -9.024, status: "pending", createdAt: "2026-08-30" },
];
