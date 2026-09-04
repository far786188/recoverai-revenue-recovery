import { useState } from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import { Sidebar, type PageId } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { Overview } from '@/pages/Overview';
import { RecoveryQueue } from '@/pages/RecoveryQueue';
import { AIAgent } from '@/pages/AIAgent';
import { Customers } from '@/pages/Customers';
import { AuditTrail } from '@/pages/AuditTrail';

function AppContent() {
  const [page, setPage] = useState<PageId>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { resetDemo, agentRunning } = useApp();

  const handleReset = () => {
    resetDemo();
    setPage('overview');
  };

  return (
    <div className="min-h-screen bg-[#060912] text-white flex">
      <Sidebar
        currentPage={page}
        onNavigate={setPage}
        collapsed={sidebarCollapsed}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onReset={handleReset}
          onToggleSidebar={() => setSidebarCollapsed((c) => !c)}
        />

        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {page === 'overview' && <Overview onNavigate={setPage} />}
          {page === 'queue' && <RecoveryQueue />}
          {page === 'agent' && <AIAgent />}
          {page === 'customers' && <Customers />}
          {page === 'audit' && <AuditTrail />}
        </main>

        <footer className="px-6 py-4 border-t border-white/5 text-center">
          <p className="text-[10px] text-gray-600 tracking-wide">
            DEMO MODE — SYNTHETIC TRANSACTIONS · No real payments processed · RecoverAI Revenue Recovery Agent
            {agentRunning ? ' · Agent Running' : ''}
          </p>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
