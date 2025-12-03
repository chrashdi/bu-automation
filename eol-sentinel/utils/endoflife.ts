export interface EndOfLifeCycle {
  cycle: string
  releaseDate: string
  eol: string | null
  latest: string
  lts?: string
}

export interface ComponentEOLStatus {
  componentId: string
  componentName: string
  slug: string
  version: string
  eolDate: string | null
  daysRemaining: number | null
  status: 'safe' | 'warning' | 'expired'
}

/**
 * Fetches EOL data for a given slug from endoflife.date API
 */
export async function fetchEOLData(slug: string): Promise<EndOfLifeCycle[]> {
  try {
    const response = await fetch(`https://endoflife.date/api/${slug}.json`)
    if (!response.ok) {
      throw new Error(`Failed to fetch EOL data for ${slug}`)
    }
    return await response.json()
  } catch (error) {
    console.error(`Error fetching EOL data for ${slug}:`, error)
    return []
  }
}

/**
 * Finds the EOL date for a specific version
 */
export function findEOLForVersion(
  cycles: EndOfLifeCycle[],
  version: string
): EndOfLifeCycle | null {
  return cycles.find((cycle) => cycle.cycle === version) || null
}

/**
 * Calculates days remaining until EOL
 */
export function calculateDaysRemaining(eolDate: string | null): number | null {
  if (!eolDate) return null
  
  const eol = new Date(eolDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  eol.setHours(0, 0, 0, 0)
  
  const diffTime = eol.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays
}

/**
 * Determines risk status based on days remaining
 */
export function getRiskStatus(daysRemaining: number | null): 'safe' | 'warning' | 'expired' {
  if (daysRemaining === null) return 'expired'
  if (daysRemaining < 0) return 'expired'
  if (daysRemaining < 365) return 'warning' // Less than 1 year
  return 'safe' // More than 1 year
}

/**
 * Gets status color for UI
 */
export function getStatusColor(status: 'safe' | 'warning' | 'expired'): string {
  switch (status) {
    case 'safe':
      return 'bg-green-100 text-green-800 border-green-300'
    case 'warning':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    case 'expired':
      return 'bg-red-100 text-red-800 border-red-300'
  }
}

