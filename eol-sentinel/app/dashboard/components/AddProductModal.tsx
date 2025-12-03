'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

interface AddProductModalProps {
  onClose: () => void
  onSuccess: () => void
}

export default function AddProductModal({
  onClose,
  onSuccess,
}: AddProductModalProps) {
  const [name, setName] = useState('')
  const [arr, setArr] = useState('')
  const [cost, setCost] = useState('')
  const [customerCount, setCustomerCount] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Product name is required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      let logoUrl: string | null = null

      // Upload logo if provided
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `logos/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('logos')
          .upload(filePath, logoFile, {
            cacheControl: '3600',
            upsert: false,
          })

        if (uploadError) {
          throw new Error('Failed to upload logo: ' + uploadError.message)
        }

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from('logos').getPublicUrl(filePath)
        logoUrl = publicUrl
      }

      // Create product
      const productData: any = {
        name: name.trim(),
        logo_url: logoUrl,
      }

      if (arr.trim()) {
        productData.arr = parseFloat(arr)
      }

      if (cost.trim()) {
        productData.cost = parseFloat(cost)
      }

      if (customerCount.trim()) {
        productData.customer_count = parseInt(customerCount)
      }

      const { error: insertError } = await supabase
        .from('products')
        .insert(productData)

      if (insertError) {
        throw new Error('Failed to create product: ' + insertError.message)
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
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-black mb-4">Add Product</h2>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="product-name"
              className="block text-sm font-medium text-black mb-1"
            >
              Product Name
            </label>
            <input
              id="product-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
              placeholder="e.g., Aurea Monitor"
            />
          </div>

          <div>
            <label
              htmlFor="arr"
              className="block text-sm font-medium text-black mb-1"
            >
              ARR (Annual Recurring Revenue)
            </label>
            <input
              id="arr"
              type="number"
              step="0.01"
              value={arr}
              onChange={(e) => setArr(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
              placeholder="e.g., 50000"
            />
          </div>

          <div>
            <label
              htmlFor="cost"
              className="block text-sm font-medium text-black mb-1"
            >
              Cost
            </label>
            <input
              id="cost"
              type="number"
              step="0.01"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
              placeholder="e.g., 25000"
            />
          </div>

          <div>
            <label
              htmlFor="customer-count"
              className="block text-sm font-medium text-black mb-1"
            >
              Customer Count
            </label>
            <input
              id="customer-count"
              type="number"
              value={customerCount}
              onChange={(e) => setCustomerCount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
              placeholder="e.g., 150"
            />
          </div>

          <div>
            <label
              htmlFor="logo-upload"
              className="block text-sm font-medium text-black mb-1"
            >
              Logo (Optional)
            </label>
            <input
              id="logo-upload"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {logoPreview && (
              <div className="mt-2">
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="w-24 h-24 object-contain border border-gray-300 rounded"
                />
              </div>
            )}
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
              {loading ? 'Creating...' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
