import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to EOL Sentinel
            </h1>
            <p className="text-gray-600 mb-4">
              Logged in as: <span className="font-semibold">{user.email}</span>
            </p>
            <p className="text-gray-500">
              Dashboard coming soon. This is where you'll manage products and track EOL status.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

