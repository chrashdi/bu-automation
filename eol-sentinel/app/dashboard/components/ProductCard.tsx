'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/client'
import AddComponentModal from './AddComponentModal'
import EditProductModal from './EditProductModal'
import ComponentList from './ComponentList'

interface Product {
  id: string
  name: string
  logo_url: string | null
  arr: number | null
  cost: number | null
  customer_count: number | null
  created_at: string
}

interface ProductCardProps {
  product: Product
  onUpdate: () => void
}

export default function ProductCard({ product, onUpdate }: ProductCardProps) {
  const [showAddComponent, setShowAddComponent] = useState(false)
  const [showEditProduct, setShowEditProduct] = useState(false)
  const supabase = createClient()

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) return

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', product.id)

    if (error) {
      alert('Error deleting product: ' + error.message)
    } else {
      onUpdate()
    }
  }

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4 flex-1">
            {product.logo_url ? (
              <div className="w-16 h-16 relative flex-shrink-0">
                <Image
                  src={product.logo_url}
                  alt={product.name}
                  fill
                  className="object-contain rounded-lg"
                />
              </div>
            ) : (
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <i className="fa-solid fa-box text-2xl text-gray-400"></i>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {product.name}
                </h3>
                <button
                  onClick={() => setShowEditProduct(true)}
                  className="text-blue-600 hover:text-blue-700 transition-colors"
                  title="Edit product"
                >
                  <i className="fa-solid fa-pencil text-sm"></i>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Created {new Date(product.created_at).toLocaleDateString()}
              </p>
              {(product.arr !== null || product.cost !== null || product.customer_count !== null) && (
                <div className="mt-2 flex flex-wrap gap-3 text-xs">
                  {product.arr !== null && (
                    <span className="text-gray-600">
                      <strong>ARR:</strong> {formatCurrency(product.arr)}
                    </span>
                  )}
                  {product.cost !== null && (
                    <span className="text-gray-600">
                      <strong>Cost:</strong> {formatCurrency(product.cost)}
                    </span>
                  )}
                  {product.customer_count !== null && (
                    <span className="text-gray-600">
                      <strong>Customers:</strong> {product.customer_count.toLocaleString()}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={handleDelete}
            className="text-red-500 hover:text-red-700 ml-2 transition-colors"
            title="Delete product"
          >
            <i className="fa-solid fa-trash text-lg"></i>
          </button>
        </div>

        <ComponentList productId={product.id} onUpdate={onUpdate} />

        <button
          onClick={() => setShowAddComponent(true)}
          className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center"
        >
          <i className="fa-solid fa-plus mr-2"></i>
          Add Component
        </button>
      </div>

      {showAddComponent && (
        <AddComponentModal
          productId={product.id}
          productName={product.name}
          onClose={() => {
            setShowAddComponent(false)
            onUpdate()
          }}
        />
      )}

      {showEditProduct && (
        <EditProductModal
          product={product}
          onClose={() => setShowEditProduct(false)}
          onSuccess={() => {
            setShowEditProduct(false)
            onUpdate()
          }}
        />
      )}
    </>
  )
}
