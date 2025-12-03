import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import StatsCards from './components/StatsCards'
import ProductGrid from './components/ProductGrid'

export default async function DashboardPage() {
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
          <StatsCards />
          <ProductGrid />
        </main>
      </div>
    </div>
  )
}
