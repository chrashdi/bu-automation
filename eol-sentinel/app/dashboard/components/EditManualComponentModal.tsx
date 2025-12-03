'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

interface ManualComponent {
  id: string
  name: string
  version: string
  eol_date: string
}

interface EditManualComponentModalProps {
  component: ManualComponent
  onClose: () => void
  onSuccess: () => void
}

export default function EditManualComponentModal({
  component,
  onClose,
  onSuccess,
}: EditManualComponentModalProps) {
  const [name, setName] = useState(component.name)
  const [version, setVersion] = useState(component.version)
  const [eolDate, setEolDate] = useState(
    component.eol_date.split('T')[0] // Extract date part from ISO string
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    setName(component.name)
    setVersion(component.version)
    setEolDate(component.eol_date.split('T')[0])
  }, [component])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !version.trim() || !eolDate.trim()) {
      setError('All fields are required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('manual_components')
        .update({
          name: name.trim(),
          version: version.trim(),
          eol_date: eolDate.trim(),
        })
        .eq('id', component.id)

      if (updateError) {
        throw new Error('Failed to update component: ' + updateError.message)
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
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-black mb-4">
          Edit Manual Component
        </h2>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

