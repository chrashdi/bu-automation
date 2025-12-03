import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import EOLTrackerTable from '../components/EOLTrackerTable'

export default async function EOLTrackerPage() {
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
              EOL Tracker
            </h2>
            <p className="text-gray-600 mb-6">
              Track End of Life dates for all components across your products
            </p>
            <EOLTrackerTable />
          </div>
        </main>
      </div>
    </div>
  )
}

