import type {
  CommunityPoint, DataSource, Note, Quest, Tale, Tier, WalkDetail,
} from "../types";
import {
  ACTIVITY, BADGES, CATEGORIES, CHALLENGES, COLLECTIBLES, COMMUNITY,
  COMMUNITY_POINTS, FRIEND_QUESTS, FRIENDS, HOME_CARDS, NOTES, POINTS, QUESTS,
  REQUESTS, TALES, TERRITORY, WALKS,
} from "./fixtures";

/** Written this session. Mock only: real ones land in Postgres. */
const written: Note[] = [];
const proposed: CommunityPoint[] = [];

/** Artificial latency, so loading and skeleton states are visible during
 *  development rather than theoretical. Raise it to inspect a skeleton, set
 *  it to 0 for fast iteration. */
const LATENCY_MS = Number(process.env.NEXT_PUBLIC_MOCK_LATENCY_MS ?? 180);

/** Set NEXT_PUBLIC_MOCK_FAIL to a method name to exercise its error state
 *  without breaking anything else. e.g. NEXT_PUBLIC_MOCK_FAIL=getQuests */
const FAIL = process.env.NEXT_PUBLIC_MOCK_FAIL ?? "";

async function settle<T>(name: string, value: T): Promise<T> {
  await new Promise((r) => setTimeout(r, LATENCY_MS));
  if (FAIL === name) throw new Error(`Mock failure: ${name}`);
  return value;
}

export const mockSource: DataSource = {
  getTerritory: () => settle("getTerritory", TERRITORY),
  getQuests: (tier: Tier) =>
    settle<Quest[]>("getQuests", QUESTS.filter((q) => q.tier === tier)),
  getQuest: (id: string) =>
    settle<Quest | null>("getQuest", QUESTS.find((q) => q.id === id) ?? null),
  getPointsNearby: () => settle("getPointsNearby", POINTS),
  getWalks: () => settle("getWalks", WALKS),
  getCategories: () => settle("getCategories", CATEGORIES),
  getCollectibles: () => settle("getCollectibles", COLLECTIBLES),
  getBadges: () => settle("getBadges", BADGES),
  getTales: () => settle("getTales", TALES),
  getTale: (id: string) => settle<Tale | null>("getTale", TALES.find((t) => t.id === id) ?? null),
  getCommunityQuests: () => settle("getCommunityQuests", COMMUNITY),
  getHomeCards: () => settle("getHomeCards", HOME_CARDS),
  getActivity: () => settle("getActivity", ACTIVITY),
  getFriends: () => settle("getFriends", FRIENDS),
  getFriendRequests: () => settle("getFriendRequests", REQUESTS),
  getFriendQuests: () => settle("getFriendQuests", FRIEND_QUESTS),
  getChallenges: () => settle("getChallenges", CHALLENGES),

  getCommunityPoints: () =>
    settle("getCommunityPoints", [...COMMUNITY_POINTS, ...proposed]),
  addCommunityPoint: (p) => {
    const created: CommunityPoint = {
      ...p,
      id: `cp-${Date.now()}`,
      // Never approved on submission. See the note on CommunityPoint.status.
      status: "pending",
      createdAt: new Date().toISOString().slice(0, 10),
    };
    proposed.push(created);
    return settle("addCommunityPoint", created);
  },

  getWalkDetail: (id: string) => {
    const walk = WALKS.find((w) => w.id === id) ?? null;
    if (!walk) return settle<WalkDetail | null>("getWalkDetail", null);
    const quest = QUESTS.find((q) => q.title === walk.questTitle) ?? null;
    const notes = [...NOTES, ...written].filter((n) => n.walkId === id);
    return settle<WalkDetail | null>("getWalkDetail", {
      walk,
      quest,
      badges: BADGES.filter((b) => b.earnedAt === walk.dateISO),
      tales: TALES.filter((t) => t.readAt === walk.dateISO),
      notes,
    });
  },
  getNotes: () => settle("getNotes", [...NOTES, ...written]),
  addNote: (note) => {
    const created: Note = {
      ...note,
      id: `n-${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    written.push(created);
    return settle("addNote", created);
  },
};
