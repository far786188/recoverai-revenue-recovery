import { LayoutDashboard, ListChecks, Bot, Users, ScrollText, Zap } from 'lucide-react';

export type PageId = 'overview' | 'queue' | 'agent' | 'customers' | 'audit';

interface SidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  collapsed: boolean;
}

const NAV_ITEMS: { id: PageId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'queue', label: 'Recovery Queue', icon: ListChecks },
  { id: 'agent', label: 'AI Recovery Agent', icon: Bot },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'audit', label: 'Audit Trail', icon: ScrollText },
];

export function Sidebar({ currentPage, onNavigate, collapsed }: SidebarProps) {
  return (
    <aside
      className={`${
        collapsed ? 'w-20' : 'w-64'
      } shrink-0 bg-[#0a0e1a] border-r border-white/5 flex flex-col transition-all duration-300 h-screen sticky top-0`}
    >
      <div className="h-16 flex items-center gap-3 px-5 border-b border-white/5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center shrink-0">
          <Zap className="w-5 h-5 text-white" fill="white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-white font-bold text-lg leading-none tracking-tight">RecoverAI</h1>
            <p className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-wider">Revenue Recovery</p>
          </div>
        )}
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                active
                  ? 'bg-gradient-to-r from-emerald-500/20 to-blue-500/10 text-white border border-emerald-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-emerald-400' : ''}`} />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {active && !collapsed && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-400 rounded-r-full" />
              )}
            </button>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="p-4 border-t border-white/5">
          <div className="rounded-xl bg-gradient-to-br from-emerald-500/10 to-blue-500/5 border border-white/5 p-3">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">Buildathon Track</p>
            <p className="text-xs text-gray-300 leading-relaxed">AI Revenue Recovery</p>
          </div>
        </div>
      )}
    </aside>
  );
}
