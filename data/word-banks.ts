import type { QuestMode } from "./types";

export const ACTIONS = {
  // Passive verbs only. No sketch / draw / map / trace because those
  // pull you off the walk.
  common: ["photograph", "find", "count", "observe", "describe", "name", "spot", "discuss"],
  city: ["research", "ask about", "compare"],
  countryside: ["identify", "listen for", "smell", "follow", "watch"],
} as const;

export const ITEMS = {
  common: [
    "tree", "bird", "dog", "cloud", "shadow", "sign", "vehicle", "person", "child",
    "door", "window", "light", "puddle", "stone", "leaf",
  ],
  city: [
    "streetlight", "manhole cover", "sticker", "mural", "bench", "bike", "bus",
    "scaffold", "awning", "shop sign", "balcony", "statue", "fountain", "post box",
    "bin", "bus stop", "cyclist", "pigeon", "alleyway", "staircase", "chimney",
    "antenna", "coffee shop", "graffiti tag", "construction worker",
  ],
  countryside: [
    "stream", "bridge", "gate", "path", "fence", "wildflower", "mushroom",
    "mossy stone", "animal track", "log", "bird call", "hedgerow", "cow",
    "sheep", "horse", "wooden post", "berry", "nest", "spider web",
    "old barn", "haybale", "weathervane", "pond", "boulder", "pine cone",
    "acorn",
  ],
} as const;

export const DESCRIPTORS = {
  common: [
    "red", "blue", "yellow", "green", "orange", "white", "black", "purple",
    "old", "new", "weathered", "unusual", "large", "small", "tall", "short",
    "round", "crooked", "broken", "shiny", "interesting", "forgotten",
  ],
  city: ["graffitied", "painted", "faded", "polished", "neon", "abandoned-looking", "freshly painted"],
  countryside: ["gnarled", "twisted", "mossy", "rusted", "overgrown", "fragrant", "still"],
} as const;

type Bank = {
  common: readonly string[];
  city: readonly string[];
  countryside: readonly string[];
};

export function pool(category: Bank, mode: QuestMode): readonly string[] {
  if (mode === "city")        return [...category.common, ...category.city];
  if (mode === "countryside") return [...category.common, ...category.countryside];
  return [...category.common, ...category.city, ...category.countryside];
}
