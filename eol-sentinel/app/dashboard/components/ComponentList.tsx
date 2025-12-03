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
import EditComponentModal from './EditComponentModal'

interface Component {
  id: string
  product_id: string
  name: string
  slug: string
  version: string
  manual_eol_date: string | null
  created_at: string
}

interface ComponentWithEOL extends Component {
  eolDate: string | null
  daysRemaining: number | null
  status: 'safe' | 'warning' | 'expired'
}

interface ComponentListProps {
  productId: string
  onUpdate?: () => void
}

export default function ComponentList({
  productId,
  onUpdate,
}: ComponentListProps) {
  const [components, setComponents] = useState<ComponentWithEOL[]>([])
  const [loading, setLoading] = useState(true)
  const [editingComponentId, setEditingComponentId] = useState<string | null>(
    null
  )
  const supabase = createClient()

  useEffect(() => {
    loadComponents()
  }, [productId])

  const loadComponents = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('components')
        .select('id, product_id, name, slug, version, manual_eol_date, created_at')
        .eq('product_id', productId)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Fetch EOL data for each component
      const componentsWithEOL = await Promise.all(
        (data || []).map(async (component) => {
          // If manual EOL date exists, use it
          if (component.manual_eol_date) {
            const eolDate = component.manual_eol_date
            const daysRemaining = calculateDaysRemaining(eolDate)
            const status = getRiskStatus(daysRemaining)

            return {
              ...component,
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
              eolDate,
              daysRemaining,
              status,
            }
          } catch (err) {
            return {
              ...component,
              eolDate: null,
              daysRemaining: null,
              status: 'expired' as const,
            }
          }
        })
      )

      setComponents(componentsWithEOL)
    } catch (error) {
      console.error('Error loading components:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (componentId: string) => {
    if (!confirm('Are you sure you want to delete this component?')) return

    const { error } = await supabase
      .from('components')
      .delete()
      .eq('id', componentId)

    if (error) {
      alert('Error deleting component: ' + error.message)
    } else {
      loadComponents()
    }
  }

  if (loading) {
    return (
      <div className="mt-4 text-sm text-gray-500">Loading components...</div>
    )
  }

  if (components.length === 0) {
    return (
      <div className="mt-4 text-sm text-gray-500 italic">
        No components added yet
      </div>
    )
  }

  return (
    <div className="mt-4 space-y-2">
      <h4 className="text-sm font-semibold text-gray-700 mb-2">Components:</h4>
      {components.map((component) => (
        <div
          key={component.id}
          className={`p-3 rounded-md border ${getStatusColor(component.status)}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="font-medium">{component.name}</div>
              <div className="text-xs mt-1">
                {component.slug === 'manual' ? (
                  <>Manual Entry - v{component.version}</>
                ) : (
                  <>
                    {component.slug} v{component.version}
                  </>
                )}
              </div>
              {component.eolDate && (
                <div className="text-xs mt-1">
                  EOL: {new Date(component.eolDate).toLocaleDateString()}
                  {component.daysRemaining !== null && (
                    <span className="ml-2">
                      ({component.daysRemaining > 0
                        ? `${component.daysRemaining} days remaining`
                        : `${Math.abs(component.daysRemaining)} days overdue`}
                      )
                    </span>
                  )}
                </div>
              )}
              {!component.eolDate && (
                <div className="text-xs mt-1 text-gray-600">
                  EOL date not found
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditingComponentId(component.id)}
                className="text-blue-500 hover:text-blue-700 transition-colors"
                title="Edit component"
              >
                <i className="fa-solid fa-pencil text-sm"></i>
              </button>
              <button
                onClick={() => handleDelete(component.id)}
                className="text-red-500 hover:text-red-700 transition-colors"
                title="Delete component"
              >
                <i className="fa-solid fa-trash text-sm"></i>
              </button>
            </div>
          </div>
        </div>
      ))}

      {editingComponentId && (
        <EditComponentModal
          component={
            components.find((c) => c.id === editingComponentId) as Component
          }
          onClose={() => {
            setEditingComponentId(null)
            loadComponents()
            if (onUpdate) onUpdate()
          }}
          onSuccess={() => {
            setEditingComponentId(null)
            loadComponents()
            if (onUpdate) onUpdate()
          }}
        />
      )}
    </div>
  )
}

