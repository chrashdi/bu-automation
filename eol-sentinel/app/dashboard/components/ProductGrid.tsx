'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import ProductCard from './ProductCard'
import AddProductModal from './AddProductModal'

interface Product {
  id: string
  name: string
  logo_url: string | null
  created_at: string
}

export default function ProductGrid() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error loading products:', error)
      alert('Error loading products')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">Loading products...</div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Products</h3>
            <p className="text-sm text-gray-600 mt-1">
              Manage your products and track their EOL status
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center"
          >
            <i className="fa-solid fa-plus mr-2"></i>
            Add Product
          </button>
        </div>

        {products.length === 0 ? (
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-12 text-center">
            <i className="fa-solid fa-box-open text-6xl text-gray-400 mb-4"></i>
            <h3 className="text-lg font-medium text-gray-900 mt-2">
              No products yet
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by adding your first product
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <i className="fa-solid fa-plus mr-2"></i>
                Add Product
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onUpdate={loadProducts}
              />
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <AddProductModal
          onClose={() => setShowAddModal(false)}
          onSuccess={loadProducts}
        />
      )}
    </>
  )
}
