import type { MarkName } from "@/components/primitives/Marks";

export interface BriefPoint {
  mark: MarkName;
  title: string;
  body: string;
}

/** What a walker needs to have thought about before setting off on an Irish
 *  boreen. Written to be read, not to be scrolled past: eight points, one line
 *  of reason each, no legal throat-clearing.
 *
 *  Every question below is answerable from these eight and nowhere else. If a
 *  point is removed, its question goes with it. */
export const BRIEF: BriefPoint[] = [
  {
    mark: "star",
    title: "Be seen",
    body: "Most of these walks use boreens with no footpath and no lighting. Wear something bright or high visibility, walk facing oncoming traffic, and carry a light once the sun is low.",
  },
  {
    mark: "flag",
    title: "Footwear",
    body: "Ground here is soft after rain and limestone is slick when wet. Boots with ankle support, not trainers.",
  },
  {
    mark: "compass",
    title: "Weather and light",
    body: "Check the forecast and know what time it goes dark. Carry a layer: an Irish afternoon can turn in twenty minutes.",
  },
  {
    mark: "friends",
    title: "Tell someone",
    body: "Say where you are going and when you will be back. Signal is patchy across most of the country and you should not rely on it.",
  },
  {
    mark: "info",
    title: "Battery",
    body: "Your map and your phone are the same device. Set off charged, and do not let the walk depend on the screen.",
  },
  {
    mark: "green",
    title: "Animals and land",
    body: "Give cattle a wide berth, especially with calves, and never get between a cow and her calf. Leave every gate as you found it. There is no right to roam in Ireland: access to land is a courtesy, not an entitlement.",
  },
  {
    mark: "water",
    title: "Water",
    body: "Rivers rise fast after rain. Do not cross moving water above your knees, and check tides before any shore walk.",
  },
  {
    mark: "quest",
    title: "Turning back is finishing",
    body: "Nothing on any of these walks is worth an injury. Every tile you uncovered stays uncovered if you turn around.",
  },
];

export interface BriefQuestion {
  id: string;
  prompt: string;
  options: { id: string; label: string; correct: boolean }[];
  /** Shown after a wrong answer, pointing at the part worth rereading. */
  hint: string;
}

/** One is drawn at random. Multi select, and the whole set has to be right:
 *  a question you can pass by ticking everything is not a question. */
export const QUESTIONS: BriefQuestion[] = [
  {
    id: "seen",
    prompt: "You are walking a boreen with no footpath. Which of these help?",
    hint: "See “Be seen”.",
    options: [
      { id: "a", label: "Something bright or high visibility", correct: true },
      { id: "b", label: "Walking facing oncoming traffic", correct: true },
      { id: "c", label: "Carrying a light when the sun is low", correct: true },
      { id: "d", label: "Walking in the middle of the road so you are obvious", correct: false },
      { id: "e", label: "Dark clothing, so you do not distract drivers", correct: false },
    ],
  },
  {
    id: "before",
    prompt: "Before you set off, which of these are worth doing?",
    hint: "See “Tell someone”, “Weather and light” and “Battery”.",
    options: [
      { id: "a", label: "Tell someone your route and when you will be back", correct: true },
      { id: "b", label: "Check the forecast and when it gets dark", correct: true },
      { id: "c", label: "Set off with the phone charged", correct: true },
      { id: "d", label: "Nothing, a short walk needs no preparation", correct: false },
    ],
  },
  {
    id: "cattle",
    prompt: "There are cattle with calves in a field on your route. What do you do?",
    hint: "See “Animals and land”.",
    options: [
      { id: "a", label: "Give them a wide berth", correct: true },
      { id: "b", label: "Never get between a cow and her calf", correct: true },
      { id: "c", label: "Turn back and find another way if you cannot pass safely", correct: true },
      { id: "d", label: "Walk straight through, they will move", correct: false },
    ],
  },
  {
    id: "gates",
    prompt: "You come to a gate on a right of way. What is correct?",
    hint: "See “Animals and land”.",
    options: [
      { id: "a", label: "Leave it exactly as you found it", correct: true },
      { id: "b", label: "Access to land here is a courtesy, not an entitlement", correct: true },
      { id: "c", label: "Always close it, whatever state it was in", correct: false },
      { id: "d", label: "Always leave it open so livestock can move", correct: false },
    ],
  },
  {
    id: "water",
    prompt: "Your route crosses a stream and it has rained hard. What is right?",
    hint: "See “Water” and “Turning back is finishing”.",
    options: [
      { id: "a", label: "Do not cross moving water above your knees", correct: true },
      { id: "b", label: "Turning back costs you nothing you have already walked for", correct: true },
      { id: "c", label: "Cross quickly before it rises further", correct: false },
    ],
  },
];
