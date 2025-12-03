'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Sidebar() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const navItems = [
    {
      href: '/dashboard',
      icon: 'fa-chart-line',
      label: 'Dashboard',
      active: pathname === '/dashboard',
    },
    {
      href: '/dashboard/product-management',
      icon: 'fa-box',
      label: 'Manage Product',
      active: pathname === '/dashboard/product-management',
    },
    {
      href: '/dashboard/eol-tracker',
      icon: 'fa-clock',
      label: 'EOL Tracker',
      active: pathname === '/dashboard/eol-tracker',
    },
    {
      href: '#',
      icon: 'fa-dollar-sign',
      label: 'Cost Tracker',
      active: false,
    },
    {
      href: '#',
      icon: 'fa-chart-bar',
      label: 'Revenue Tracker',
      active: false,
    },
    {
      href: '#',
      icon: 'fa-users',
      label: 'Customer Tracker',
      active: false,
    },
    {
      href: '#',
      icon: 'fa-headset',
      label: 'Support Ticket Tracker',
      active: false,
    },
    {
      href: '#',
      icon: 'fa-cog',
      label: 'Settings',
      active: false,
    },
  ]

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg border-r border-gray-200 z-10">
      <div className="p-6 border-b border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900">TrilogyHQ</h1>
        <p className="text-sm text-gray-500 mt-1">Product Management</p>
      </div>

      <nav className="mt-6">
        <ul className="space-y-2 px-4">
          {navItems.map((item) => {
            return (
              <li key={item.label}>
                {item.href === '#' ? (
                  <a
                    href="#"
                    className={`flex items-center px-4 py-3 transition-colors ${
                      item.active
                        ? 'text-gray-700 bg-blue-50 border-r-4 border-blue-500 rounded-l-lg'
                        : 'text-gray-600 hover:bg-gray-50 rounded-lg'
                    }`}
                  >
                    {mounted && (
                      <i className={`fa-solid ${item.icon} w-5 h-5 mr-3 ${item.active ? 'text-blue-500' : ''}`}></i>
                    )}
                    {!mounted && (
                      <span className="w-5 h-5 mr-3"></span>
                    )}
                    <span className={item.active ? 'font-medium text-blue-700' : ''}>
                      {item.label}
                    </span>
                  </a>
                ) : (
                  <Link
                    href={item.href}
                    className={`flex items-center px-4 py-3 transition-colors ${
                      item.active
                        ? 'text-gray-700 bg-blue-50 border-r-4 border-blue-500 rounded-l-lg'
                        : 'text-gray-600 hover:bg-gray-50 rounded-lg'
                    }`}
                  >
                    {mounted && (
                      <i className={`fa-solid ${item.icon} w-5 h-5 mr-3 ${item.active ? 'text-blue-500' : ''}`}></i>
                    )}
                    {!mounted && (
                      <span className="w-5 h-5 mr-3"></span>
                    )}
                    <span className={item.active ? 'font-medium text-blue-700' : ''}>
                      {item.label}
                    </span>
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}

