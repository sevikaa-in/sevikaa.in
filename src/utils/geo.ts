/**
 * Formats a raw distance in kilometers into a friendly, localized approximate distance statement
 * to ensure that the exact GPS coordinates and specific location anchors are never exposed publicly.
 * 
 * @param distKm Distance in kilometers computed server-side
 * @param isSameSociety Whether the worker preferred society matches the job society ID
 * @returns User-friendly proximity string
 */
export function formatDistance(distKm: number | null | undefined, isSameSociety?: boolean): string {
  if (isSameSociety || distKm === 0 || (distKm !== null && distKm !== undefined && distKm < 0.05)) {
    return "Same Society";
  }
  
  if (distKm === null || distKm === undefined) {
    return "Nearby Location";
  }

  if (distKm < 0.5) {
    return "Within 500 meters";
  }

  if (distKm < 1.0) {
    return "Within 1 km";
  }

  return `${distKm.toFixed(1)} km away`;
}

/**
 * Returns a human-friendly Service Area label based on radius
 * @param radiusKm Radius in kilometers
 */
export function formatServiceRadius(radiusKm: number): string {
  return `Willing to travel up to ${radiusKm} km`;
}
