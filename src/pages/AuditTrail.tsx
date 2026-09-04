import { useState, useMemo } from 'react';
import { ScrollText, Filter, CheckCircle2, AlertTriangle, Ban, Clock, XCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { formatINR, formatTime, formatDate } from '@/utils/format';

type AuditFilter = 'ALL' | 'RECOVERED' | 'ESCALATED' | 'STOPPED' | 'FAILED' | 'PENDING';

export function AuditTrail() {
  const { auditLog } = useApp();
  const [filter, setFilter] = useState<AuditFilter>('ALL');

  const filtered = useMemo(() => {
    if (filter === 'ALL') return auditLog;
    return auditLog.filter((entry) => {
      switch (filter) {
        case 'RECOVERED': return entry.status === 'RECOVERED';
        case 'ESCALATED': return entry.status === 'ESCALATED';
        case 'STOPPED': return entry.status === 'STOPPED';
        case 'FAILED': return entry.status === 'FAILED';
        case 'PENDING': return entry.status === 'CONTACTED' || entry.status === 'PAYMENT_METHOD_UPDATE_REQUIRED';
        default: return true;
      }
    });
  }, [auditLog, filter]);

  const filters: { id: AuditFilter; label: string; icon: typeof Filter; color: string }[] = [
    { id: 'ALL', label: 'All', icon: Filter, color: 'text-gray-400' },
    { id: 'RECOVERED', label: 'Recovered', icon: CheckCircle2, color: 'text-emerald-400' },
    { id: 'ESCALATED', label: 'Escalated', icon: AlertTriangle, color: 'text-orange-400' },
    { id: 'STOPPED', label: 'Stopped', icon: Ban, color: 'text-gray-400' },
    { id: 'FAILED', label: 'Failed', icon: XCircle, color: 'text-red-400' },
    { id: 'PENDING', label: 'Pending', icon: Clock, color: 'text-blue-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Audit Trail</h2>
          <p className="text-sm text-gray-500 mt-1">Complete log of every AI decision and recovery action</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
          <ScrollText className="w-4 h-4 text-emerald-400" />
          <span className="text-xs text-gray-400">{auditLog.length} entries</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {filters.map((f) => {
          const Icon = f.icon;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === f.id
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-white/5 text-gray-400 border border-white/10 hover:text-white'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${filter === f.id ? f.color : ''}`} />
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Timeline */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-white/[0.02] border border-white/10 p-12 text-center">
          <ScrollText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500">
            {auditLog.length === 0
              ? 'No audit entries yet. Run the recovery agent to generate audit logs.'
              : 'No entries match this filter.'}
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[19px] top-0 bottom-0 w-px bg-white/5" />

          <div className="space-y-3">
            {filtered.map((entry, i) => {
              const resultIcon = getResultIcon(entry.status);
              const resultColor = getResultColor(entry.status);
              return (
                <div key={entry.id} className="relative flex gap-4 group">
                  {/* Timeline dot */}
                  <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${resultColor.bg}`}>
                    {resultIcon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 rounded-xl bg-white/[0.02] border border-white/10 p-4 group-hover:border-white/20 transition-colors">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs font-mono text-gray-500">{formatTime(entry.timestamp)}</span>
                        <span className="text-sm font-semibold text-white">{entry.transaction_id}</span>
                        <span className="text-xs text-gray-400">{entry.customer_name}</span>
                      </div>
                      <span className="text-sm font-bold text-white">{formatINR(entry.amount)}</span>
                    </div>

                    <div className="mt-3 grid md:grid-cols-2 gap-x-6 gap-y-2">
                      <div className="space-y-1.5">
                        <div>
                          <span className="text-[10px] text-gray-500 uppercase tracking-wider">AI Diagnosis</span>
                          <p className="text-xs text-gray-300">{entry.ai_diagnosis}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-500 uppercase tracking-wider">AI Confidence</span>
                          <span className="text-xs text-white ml-1">{entry.ai_confidence}%</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div>
                          <span className="text-[10px] text-gray-500 uppercase tracking-wider">Policy Applied</span>
                          <p className="text-xs text-gray-300">{entry.policy_applied}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <div>
                            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Action:</span>
                            <span className="text-xs text-white ml-1">{entry.executed_action}</span>
                          </div>
                          <div>
                            <span className={`text-xs font-medium ml-1 ${resultColor.text}`}>{entry.result}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-white/5">
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider">Status:</span>
                      <span className={`text-xs font-medium ml-1 ${resultColor.text}`}>{entry.status.replace(/_/g, ' ')}</span>
                      <span className="text-[10px] text-gray-600 ml-3">{formatDate(entry.timestamp)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function getResultIcon(status: string) {
  switch (status) {
    case 'RECOVERED': return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
    case 'ESCALATED': return <AlertTriangle className="w-5 h-5 text-orange-400" />;
    case 'STOPPED': return <Ban className="w-5 h-5 text-gray-400" />;
    case 'FAILED': return <XCircle className="w-5 h-5 text-red-400" />;
    default: return <Clock className="w-5 h-5 text-blue-400" />;
  }
}

function getResultColor(status: string): { bg: string; text: string } {
  switch (status) {
    case 'RECOVERED': return { bg: 'bg-emerald-500/15', text: 'text-emerald-400' };
    case 'ESCALATED': return { bg: 'bg-orange-500/15', text: 'text-orange-400' };
    case 'STOPPED': return { bg: 'bg-gray-500/15', text: 'text-gray-400' };
    case 'FAILED': return { bg: 'bg-red-500/15', text: 'text-red-400' };
    default: return { bg: 'bg-blue-500/15', text: 'text-blue-400' };
  }
}
