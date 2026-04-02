export function calculateAccountabilityScore(totalAssigned: number, completedOnTime: number): number {
  if (totalAssigned === 0) return 0
  return Math.round((completedOnTime / totalAssigned) * 100)
}
