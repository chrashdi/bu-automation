'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

interface AddManualComponentModalProps {
  onClose: () => void
  onSuccess: () => void
}

// Predefined missing components
const PREDEFINED_COMPONENTS = [
  { name: 'Oracle Database', versions: ['11.2.0', '12c', '19c', '21c'] },
  {
    name: 'Internet Information Services (IIS)',
    versions: ['7.5', '8.0', '10.0'],
  },
]

export default function AddManualComponentModal({
  onClose,
  onSuccess,
}: AddManualComponentModalProps) {
  const [name, setName] = useState('')
  const [version, setVersion] = useState('')
  const [eolDate, setEolDate] = useState('')
  const [usePredefined, setUsePredefined] = useState(false)
  const [selectedPredefined, setSelectedPredefined] = useState<{
    name: string
    version: string
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handlePredefinedSelect = (
    componentName: string,
    componentVersion: string
  ) => {
    setSelectedPredefined({ name: componentName, version: componentVersion })
    setName(componentName)
    setVersion(componentVersion)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !version.trim() || !eolDate.trim()) {
      setError('All fields are required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { error: insertError } = await supabase
        .from('manual_components')
        .insert({
          name: name.trim(),
          version: version.trim(),
          eol_date: eolDate.trim(),
        })

      if (insertError) {
        throw new Error('Failed to create component: ' + insertError.message)
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-black mb-4">
          Add Manual Component
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Add components that are not available in the endoflife.date API
        </p>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Predefined Components Section */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-black">
                Quick Add (Predefined Missing Components)
              </label>
              <button
                type="button"
                onClick={() => setUsePredefined(!usePredefined)}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                {usePredefined ? 'Hide' : 'Show'}
              </button>
            </div>

            {usePredefined && (
              <div className="space-y-3">
                {PREDEFINED_COMPONENTS.map((component) => (
                  <div key={component.name} className="border-b border-gray-100 pb-3 last:border-0">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      {component.name}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {component.versions.map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => handlePredefinedSelect(component.name, v)}
                          className={`px-3 py-1 text-xs rounded-md border transition-colors ${
                            selectedPredefined?.name === component.name &&
                            selectedPredefined?.version === v
                              ? 'bg-blue-100 border-blue-500 text-blue-700'
                              : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="component-name"
              className="block text-sm font-medium text-black mb-1"
            >
              Component Name
            </label>
            <input
              id="component-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
              placeholder="e.g., Oracle Database"
            />
          </div>

          <div>
            <label
              htmlFor="version"
              className="block text-sm font-medium text-black mb-1"
            >
              Version
            </label>
            <input
              id="version"
              type="text"
              required
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
              placeholder="e.g., 11.2.0"
            />
          </div>

          <div>
            <label
              htmlFor="eol-date"
              className="block text-sm font-medium text-black mb-1"
            >
              EOL Date
            </label>
            <input
              id="eol-date"
              type="date"
              required
              value={eolDate}
              onChange={(e) => setEolDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the End of Life date for this component version
            </p>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-black hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Add Component'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

