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
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  EOL Tracker
                </h2>
                <p className="text-gray-600">
                  Track End of Life dates for all components across your products
                </p>
              </div>
              <a
                href="/dashboard/manual-components"
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center text-sm"
              >
                <i className="fa-solid fa-list mr-2"></i>
                Manage Manual Components
              </a>
            </div>
            <EOLTrackerTable />
          </div>
        </main>
      </div>
    </div>
  )
}

