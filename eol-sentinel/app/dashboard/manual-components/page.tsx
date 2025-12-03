import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import ManualComponentsManager from '../components/ManualComponentsManager'

export default async function ManualComponentsPage() {
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
              Manual Components
            </h2>
            <p className="text-gray-600 mb-6">
              Add and manage components that are not available in the endoflife.date API.
              These components will appear in the EOL Tracker.
            </p>
            <ManualComponentsManager />
          </div>
        </main>
      </div>
    </div>
  )
}

