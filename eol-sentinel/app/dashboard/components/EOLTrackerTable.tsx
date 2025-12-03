'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
  fetchEOLData,
  findEOLForVersion,
  calculateDaysRemaining,
  getRiskStatus,
  getStatusColor,
} from '@/utils/endoflife'

interface Product {
  id: string
  name: string
}

interface Component {
  id: string
  product_id: string
  name: string
  slug: string
  version: string
  manual_eol_date: string | null
}

interface ComponentWithEOL extends Component {
  productName: string
  eolDate: string | null
  daysRemaining: number | null
  status: 'safe' | 'warning' | 'expired'
}

export default function EOLTrackerTable() {
  const [components, setComponents] = useState<ComponentWithEOL[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Fetch all products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name')

      if (productsError) throw productsError

      // Fetch all components
      const { data: componentsData, error: componentsError } = await supabase
        .from('components')
        .select('id, product_id, name, slug, version, manual_eol_date')

      if (componentsError) throw componentsError

      // Create a map of product IDs to names
      const productMap = new Map<string, string>()
      products?.forEach((p) => productMap.set(p.id, p.name))

      // Fetch EOL data for each component
      const componentsWithEOL = await Promise.all(
        (componentsData || []).map(async (component) => {
          const productName = productMap.get(component.product_id) || 'Unknown'

          // If manual EOL date exists, use it
          if (component.manual_eol_date) {
            const eolDate = component.manual_eol_date
            const daysRemaining = calculateDaysRemaining(eolDate)
            const status = getRiskStatus(daysRemaining)

            return {
              ...component,
              productName,
              eolDate,
              daysRemaining,
              status,
            }
          }

          // Otherwise, fetch from API
          try {
            // Skip API fetch for manual entries
            if (component.slug === 'manual') {
              return {
                ...component,
                productName,
                eolDate: component.manual_eol_date,
                daysRemaining: component.manual_eol_date
                  ? calculateDaysRemaining(component.manual_eol_date)
                  : null,
                status: component.manual_eol_date
                  ? getRiskStatus(calculateDaysRemaining(component.manual_eol_date))
                  : ('expired' as const),
              }
            }

            const cycles = await fetchEOLData(component.slug)
            const cycle = findEOLForVersion(cycles, component.version)
            const eolDate = cycle?.eol || null
            const daysRemaining = calculateDaysRemaining(eolDate)
            const status = getRiskStatus(daysRemaining)

            return {
              ...component,
              productName,
              eolDate,
              daysRemaining,
              status,
            }
          } catch (err) {
            return {
              ...component,
              productName,
              eolDate: null,
              daysRemaining: null,
              status: 'expired' as const,
            }
          }
        })
      )

      // Sort by days remaining (expired first, then by days remaining ascending)
      componentsWithEOL.sort((a, b) => {
        if (a.daysRemaining === null && b.daysRemaining === null) return 0
        if (a.daysRemaining === null) return 1
        if (b.daysRemaining === null) return -1
        return a.daysRemaining - b.daysRemaining
      })

      setComponents(componentsWithEOL)
    } catch (error) {
      console.error('Error loading EOL data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTimeRemaining = (daysRemaining: number | null): string => {
    if (daysRemaining === null) return 'N/A'
    if (daysRemaining < 0) {
      return `${Math.abs(daysRemaining)} days overdue`
    }
    if (daysRemaining < 30) {
      return `${daysRemaining} days`
    }
    if (daysRemaining < 365) {
      const months = Math.floor(daysRemaining / 30)
      return `${months} month${months !== 1 ? 's' : ''}`
    }
    const years = Math.floor(daysRemaining / 365)
    const remainingDays = daysRemaining % 365
    if (remainingDays === 0) {
      return `${years} year${years !== 1 ? 's' : ''}`
    }
    return `${years} year${years !== 1 ? 's' : ''}, ${remainingDays} days`
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">Loading EOL data...</div>
      </div>
    )
  }

  if (components.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No components found. Add components to products to see EOL tracking.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Product
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Component
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Version
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              EOL Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Time Remaining
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {components.map((component) => (
            <tr
              key={component.id}
              className={`hover:bg-gray-50 ${
                component.status === 'expired'
                  ? 'bg-red-50'
                  : component.status === 'warning'
                    ? 'bg-yellow-50'
                    : ''
              }`}
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {component.productName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {component.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {component.version}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {component.eolDate
                  ? new Date(component.eolDate).toLocaleDateString()
                  : 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    component.status === 'expired'
                      ? 'bg-red-100 text-red-800'
                      : component.status === 'warning'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                  }`}
                >
                  {formatTimeRemaining(component.daysRemaining)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

