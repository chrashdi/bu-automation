'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

interface Product {
  id: string
  name: string
  logo_url: string | null
  arr: number | null
  cost: number | null
  customer_count: number | null
}

interface EditProductModalProps {
  product: Product
  onClose: () => void
  onSuccess: () => void
}

export default function EditProductModal({
  product,
  onClose,
  onSuccess,
}: EditProductModalProps) {
  const [name, setName] = useState(product.name)
  const [arr, setArr] = useState(product.arr?.toString() || '')
  const [cost, setCost] = useState(product.cost?.toString() || '')
  const [customerCount, setCustomerCount] = useState(
    product.customer_count?.toString() || ''
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    setName(product.name)
    setArr(product.arr?.toString() || '')
    setCost(product.cost?.toString() || '')
    setCustomerCount(product.customer_count?.toString() || '')
  }, [product])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Product name is required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const updateData: any = {
        name: name.trim(),
      }

      if (arr.trim()) {
        updateData.arr = parseFloat(arr)
      } else {
        updateData.arr = null
      }

      if (cost.trim()) {
        updateData.cost = parseFloat(cost)
      } else {
        updateData.cost = null
      }

      if (customerCount.trim()) {
        updateData.customer_count = parseInt(customerCount)
      } else {
        updateData.customer_count = null
      }

      const { error: updateError } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', product.id)

      if (updateError) {
        throw new Error('Failed to update product: ' + updateError.message)
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
        <h2 className="text-2xl font-bold text-black mb-4">Edit Product</h2>

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

