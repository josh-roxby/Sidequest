import type { MarkName } from "@/components/primitives/Marks";
import type { ActivityKind } from "@/lib/data";

/** The glyph each kind of update carries.
 *
 *  Shared rather than declared twice: the drawer ticker and the activity page
 *  show the same feed, and an update that changes glyph between the two reads
 *  as two different things happening. */
export const ACTIVITY_MARK: Record<ActivityKind, MarkName> = {
  badge: "badge",
  quest: "quest",
  poi: "map",
  tale: "tale",
  friend: "friends",
  joined: "leaf",
  collection: "flag",
};
