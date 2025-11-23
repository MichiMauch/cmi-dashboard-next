/**
 * Dashboard Navigation Component
 * Tab navigation between Heating and Solar dashboards
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function DashboardNav() {
  const pathname = usePathname();

  const tabs = [
    { name: 'Heating', href: '/', icon: '🔥' },
    { name: 'Solar', href: '/solar', icon: '☀️' },
  ];

  return (
    <nav className="bg-white dark:bg-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex space-x-1">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`
                  px-6 py-4 text-sm font-medium transition-colors
                  border-b-2
                  ${
                    isActive
                      ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300'
                  }
                `}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
