const WALKING_PACE_KMH = 5;

export function walkingMinutes(distanceM: number): number {
  return ((distanceM / 1000) / WALKING_PACE_KMH) * 60;
}

export function formatWalkingTime(distanceM: number): string {
  const minutes = Math.round(walkingMinutes(distanceM));
  if (minutes < 1)  return "<1 min";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
