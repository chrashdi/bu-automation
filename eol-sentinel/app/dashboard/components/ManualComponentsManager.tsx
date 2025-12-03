'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import AddManualComponentModal from './AddManualComponentModal'
import EditManualComponentModal from './EditManualComponentModal'
import {
  calculateDaysRemaining,
  getRiskStatus,
  getStatusColor,
} from '@/utils/endoflife'

interface ManualComponent {
  id: string
  name: string
  version: string
  eol_date: string
  created_at: string
}

interface ComponentWithStatus extends ManualComponent {
  daysRemaining: number | null
  status: 'safe' | 'warning' | 'expired'
}

export default function ManualComponentsManager() {
  const [components, setComponents] = useState<ComponentWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingComponentId, setEditingComponentId] = useState<string | null>(
    null
  )
  const supabase = createClient()

  useEffect(() => {
    loadComponents()
  }, [])

  const loadComponents = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('manual_components')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        // Table might not exist yet, that's okay
        console.error('Error loading manual components:', error)
        setComponents([])
        return
      }

      // Calculate status for each component
      const componentsWithStatus = (data || []).map((component) => {
        const daysRemaining = calculateDaysRemaining(component.eol_date)
        const status = getRiskStatus(daysRemaining)

        return {
          ...component,
          daysRemaining,
          status,
        }
      })

      // Sort by days remaining (expired first)
      componentsWithStatus.sort((a, b) => {
        if (a.daysRemaining === null && b.daysRemaining === null) return 0
        if (a.daysRemaining === null) return 1
        if (b.daysRemaining === null) return -1
        return a.daysRemaining - b.daysRemaining
      })

      setComponents(componentsWithStatus)
    } catch (error) {
      console.error('Error loading manual components:', error)
      setComponents([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (componentId: string) => {
    if (!confirm('Are you sure you want to delete this component?')) return

    const { error } = await supabase
      .from('manual_components')
      .delete()
      .eq('id', componentId)

    if (error) {
      alert('Error deleting component: ' + error.message)
    } else {
      loadComponents()
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
        <div className="text-gray-500">Loading manual components...</div>
      </div>
    )
  }

  return (
    <>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Manual Components
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Components not available in endoflife.date API
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center"
        >
          <i className="fa-solid fa-plus mr-2"></i>
          Add Manual Component
        </button>
      </div>

      {components.length === 0 ? (
        <div className="border-4 border-dashed border-gray-200 rounded-lg p-12 text-center">
          <i className="fa-solid fa-list text-6xl text-gray-400 mb-4"></i>
          <h3 className="text-lg font-medium text-gray-900 mt-2">
            No manual components yet
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Add components that are missing from the endoflife.date API
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <i className="fa-solid fa-plus mr-2"></i>
              Add Manual Component
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Component Name
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
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
                    {component.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {component.version}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(component.eol_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(component.status)}`}
                    >
                      {formatTimeRemaining(component.daysRemaining)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && (
        <AddManualComponentModal
          onClose={() => {
            setShowAddModal(false)
            loadComponents()
          }}
          onSuccess={() => {
            setShowAddModal(false)
            loadComponents()
          }}
        />
      )}

      {editingComponentId && (
        <EditManualComponentModal
          component={components.find((c) => c.id === editingComponentId)!}
          onClose={() => {
            setEditingComponentId(null)
            loadComponents()
          }}
          onSuccess={() => {
            setEditingComponentId(null)
            loadComponents()
          }}
        />
      )}
    </>
  )
}

