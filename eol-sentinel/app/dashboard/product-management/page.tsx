import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import ProductManagementList from '../components/ProductManagementList'

export default async function ProductManagementPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="bg-gray-50 font-inter min-h-screen">
      <Sidebar />
      <div className="ml-64">
        <Header />
        <main className="p-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Product Management
            </h2>
            <p className="text-gray-600 mb-6">
              Manage product details, credentials, documents, and support information
            </p>
            <ProductManagementList />
          </div>
        </main>
      </div>
    </div>
  )
}

