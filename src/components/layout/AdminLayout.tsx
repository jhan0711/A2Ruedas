import React, { useState, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { SkipToContent, PageLoadingFallback } from '../ui';

export const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <SkipToContent targetId="main-content" label="Saltar al panel principal" />
      <Header onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <main id="main-content" tabIndex={-1} className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 outline-none focus:outline-none">
          <div className="max-w-7xl mx-auto space-y-6">
            <Suspense fallback={<PageLoadingFallback message="Cargando módulo administrativo..." />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
};
