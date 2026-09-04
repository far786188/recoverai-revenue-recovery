import { RotateCcw, Menu, Bot } from 'lucide-react';

interface HeaderProps {
  onReset: () => void;
  onToggleSidebar: () => void;
}

export function Header({ onReset, onToggleSidebar }: HeaderProps) {
  return (
    <header className="h-16 sticky top-0 z-30 bg-[#0a0e1a]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
          </span>
          <span className="text-xs font-medium text-emerald-400">AI Agent Online</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
          <span className="text-xs font-semibold text-amber-400 tracking-wide">DEMO MODE — SYNTHETIC TRANSACTIONS</span>
        </div>
      </div>

      <button
        onClick={onReset}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-sm font-medium transition-all duration-200 active:scale-95"
      >
        <RotateCcw className="w-4 h-4" />
        <span className="hidden sm:inline">Reset Demo</span>
      </button>
    </header>
  );
}
