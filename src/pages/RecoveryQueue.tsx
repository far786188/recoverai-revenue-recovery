import { useState, useMemo } from 'react';
import { Search, X, Play, Ban, AlertTriangle, CheckCircle2, Clock, FileText } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { formatINR, formatDateTime } from '@/utils/format';
import { StatusBadge, ActionBadge, RiskBadge, ProbabilityBadge, ActionStatusBadge } from '@/components/Badges';
import { generateDiagnosis, getPolicyCheck } from '@/engine/diagnosis';
import { isActionable } from '@/engine/diagnosis';
import type { Transaction } from '@/types';

export function RecoveryQueue() {
  const { transactions, executeSingleRecovery } = useApp();
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const matchesSearch =
        t.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        t.transaction_id.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [transactions, search, statusFilter]);

  const selected = selectedTxn ? transactions.find((t) => t.transaction_id === selectedTxn.transaction_id) || selectedTxn : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Recovery Queue</h2>
        <p className="text-sm text-gray-500 mt-1">At-risk transactions awaiting recovery action</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search customer or transaction ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {['ALL', 'FAILED', 'RECOVERED', 'CONTACTED', 'ESCALATED', 'STOPPED', 'PAYMENT_METHOD_UPDATE_REQUIRED'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === s
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-white/5 text-gray-400 border border-white/10 hover:text-white'
              }`}
            >
              {s === 'ALL' ? 'All' : s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white/[0.02] border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Customer</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Amount</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Failure Reason</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Risk</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Recovery Prob.</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Recommended Action</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-500 text-sm">
                    No recoverable revenue currently detected.
                  </td>
                </tr>
              ) : (
                filtered.map((txn) => (
                  <tr
                    key={txn.transaction_id}
                    onClick={() => setSelectedTxn(txn)}
                    className="border-b border-white/5 hover:bg-white/[0.03] cursor-pointer transition-colors group"
                  >
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-white group-hover:text-emerald-400 transition-colors">{txn.customer_name}</div>
                      <div className="text-[10px] text-gray-500">{txn.transaction_id}</div>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-white">{formatINR(txn.amount)}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-gray-400">{txn.failure_reason}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell"><RiskBadge score={txn.risk_score} /></td>
                    <td className="px-4 py-3 hidden lg:table-cell"><ProbabilityBadge probability={txn.recovery_probability} /></td>
                    <td className="px-4 py-3 hidden md:table-cell"><ActionBadge action={txn.recommended_action} /></td>
                    <td className="px-4 py-3"><StatusBadge status={txn.status} /></td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTxn(txn);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-emerald-500/20 text-gray-300 hover:text-emerald-400 text-xs font-medium border border-white/10 hover:border-emerald-500/30 transition-all"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <TransactionDetail
          txn={selected}
          onClose={() => setSelectedTxn(null)}
          onExecute={() => executeSingleRecovery(selected.transaction_id)}
        />
      )}
    </div>
  );
}

function TransactionDetail({
  txn,
  onClose,
  onExecute,
}: {
  txn: Transaction;
  onClose: () => void;
  onExecute: () => void;
}) {
  const diagnosis = useMemo(() => generateDiagnosis(txn), [txn]);
  const policyCheck = useMemo(() => getPolicyCheck(txn), [txn]);
  const actionable = isActionable(txn);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0d1117] border border-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#0d1117]/95 backdrop-blur-sm border-b border-white/5 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/20 to-amber-500/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{txn.transaction_id}</h3>
              <p className="text-xs text-gray-500">{txn.customer_name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Basic Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <InfoCard label="Amount" value={formatINR(txn.amount)} />
            <InfoCard label="Payment Method" value={txn.payment_method} />
            <InfoCard label="Failure Reason" value={txn.failure_reason} />
            <InfoCard label="Timestamp" value={formatDateTime(txn.timestamp)} />
            <InfoCard label="Previous Successful Payments" value={txn.previous_successful_payments.toString()} />
            <InfoCard label="Retry Count" value={txn.retry_count.toString()} />
            <InfoCard label="Risk Score" value={`${txn.risk_score}/100`} />
            <InfoCard label="Recovery Probability" value={`${txn.recovery_probability}%`} />
          </div>

          {/* Status */}
          <div className="flex items-center gap-3 flex-wrap">
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Current Status</p>
              <StatusBadge status={txn.status} />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Action Status</p>
              <ActionStatusBadge status={txn.action_status} />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Recommended Action</p>
              <ActionBadge action={txn.recommended_action} />
            </div>
          </div>

          {/* AI Diagnosis */}
          <div className="rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/5 border border-blue-500/20 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold">AI</span>
              </div>
              <h4 className="text-sm font-bold text-white">AI-Assisted Diagnosis</h4>
              <span className="text-[10px] text-gray-500 ml-auto">Deterministic — no external AI API</span>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Root Cause</p>
                <p className="text-sm text-white">{diagnosis.rootCause}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">AI Confidence</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500" style={{ width: `${diagnosis.confidence}%` }} />
                  </div>
                  <span className="text-sm font-semibold text-white">{diagnosis.confidence}%</span>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Reasoning</p>
              <p className="text-sm text-gray-300 leading-relaxed italic">"{diagnosis.reasoning}"</p>
            </div>

            <div className="mt-4 pt-4 border-t border-white/5">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Policy Check</p>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <p className="text-sm text-gray-300">{policyCheck}</p>
              </div>
            </div>
          </div>

          {/* Action History */}
          {txn.action_history.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-white mb-3">Action History</h4>
              <div className="space-y-2">
                {txn.action_history.map((entry, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg bg-white/[0.03] border border-white/5 p-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400 shrink-0">
                      {entry.step}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-white">{entry.detail}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{formatDateTime(entry.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stopping Rule Display */}
          {txn.status === 'STOPPED' && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Ban className="w-5 h-5 text-red-400" />
                <h4 className="text-sm font-bold text-red-400">AUTOMATIC RECOVERY STOPPED</h4>
              </div>
              <p className="text-sm text-gray-300">Maximum retry limit reached. Next action: Human escalation.</p>
            </div>
          )}

          {/* Recovery Result */}
          {txn.recovered && (
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-400">Simulated Recovery Result</h4>
                  <p className="text-sm text-gray-300 mt-0.5">{formatINR(txn.recovered_amount)} recovered</p>
                </div>
              </div>
            </div>
          )}

          {/* Execute Button */}
          {actionable ? (
            <button
              onClick={onExecute}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-emerald-500/20 transition-all duration-200 active:scale-[0.98]"
            >
              <Play className="w-4 h-4" fill="white" />
              EXECUTE RECOVERY
            </button>
          ) : txn.status === 'STOPPED' ? (
            <div className="w-full text-center py-3 text-sm text-gray-500 rounded-xl bg-white/5 border border-white/10">
              Automatic recovery stopped by policy.
            </div>
          ) : txn.opted_out ? (
            <div className="w-full text-center py-3 text-sm text-gray-500 rounded-xl bg-white/5 border border-white/10">
              Customer has opted out of recovery actions.
            </div>
          ) : (
            <div className="w-full text-center py-3 text-sm text-gray-500 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center gap-2">
              <Clock className="w-4 h-4" />
              Recovery action already executed for this transaction.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/5 p-3">
      <p className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-medium text-white mt-1">{value}</p>
    </div>
  );
}
