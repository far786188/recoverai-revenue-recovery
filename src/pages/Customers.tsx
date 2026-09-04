import { useState, useMemo } from 'react';
import { Search, X, TrendingUp, TrendingDown, Users } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { formatINR, formatDateTime } from '@/utils/format';
import { StatusBadge, ActionBadge } from '@/components/Badges';
import { ProbabilityBadge } from '@/components/Badges';
import type { CustomerProfile, Transaction } from '@/types';

export function Customers() {
  const { transactions, getCustomers } = useApp();
  const customers = useMemo(() => getCustomers(), [getCustomers]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<CustomerProfile | null>(null);

  const filtered = useMemo(() => {
    return customers.filter((c) =>
      c.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      c.customer_id.toLowerCase().includes(search.toLowerCase())
    );
  }, [customers, search]);

  const selectedTxns = useMemo(() => {
    if (!selected) return [];
    return transactions.filter((t) => t.customer_id === selected.customer_id);
  }, [selected, transactions]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Customers</h2>
        <p className="text-sm text-gray-500 mt-1">Synthetic customer profiles with payment and recovery history</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Search customers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c) => (
          <button
            key={c.customer_id}
            onClick={() => setSelected(c)}
            className="text-left rounded-2xl bg-white/[0.02] border border-white/10 p-5 hover:border-emerald-500/20 hover:bg-white/[0.03] transition-all duration-200 group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">{c.customer_name}</p>
                  <p className="text-[10px] text-gray-500">{c.customer_id} · {c.segment}</p>
                </div>
              </div>
              {c.recovery_opportunities > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-[10px] font-medium border border-amber-500/20">
                  {c.recovery_opportunities} at risk
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4">
              <div>
                <p className="text-[10px] text-gray-500">Total Value</p>
                <p className="text-sm font-bold text-white">{formatINR(c.total_value)}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500">Successful</p>
                <p className="text-sm font-bold text-emerald-400">{c.successful_payments}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500">Failed</p>
                <p className="text-sm font-bold text-red-400">{c.failed_payments}</p>
              </div>
            </div>

            {c.recovery_opportunities > 0 && (
              <div className="mt-3 pt-3 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-500">Recovery Probability</span>
                  <ProbabilityBadge probability={c.recovery_probability} />
                </div>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Customer Detail Modal */}
      {selected && (
        <CustomerDetail
          customer={selected}
          transactions={selectedTxns}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function CustomerDetail({
  customer,
  transactions,
  onClose,
}: {
  customer: CustomerProfile;
  transactions: Transaction[];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0d1117] border border-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-[#0d1117]/95 backdrop-blur-sm border-b border-white/5 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{customer.customer_name}</h3>
              <p className="text-xs text-gray-500">{customer.customer_id} · {customer.segment}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-xl bg-white/[0.03] border border-white/5 p-3">
              <p className="text-[10px] text-gray-500 uppercase">Total Payments</p>
              <p className="text-lg font-bold text-white">{customer.total_payments}</p>
            </div>
            <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/10 p-3">
              <div className="flex items-center gap-1 mb-1">
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                <p className="text-[10px] text-gray-500 uppercase">Successful</p>
              </div>
              <p className="text-lg font-bold text-emerald-400">{customer.successful_payments}</p>
            </div>
            <div className="rounded-xl bg-red-500/5 border border-red-500/10 p-3">
              <div className="flex items-center gap-1 mb-1">
                <TrendingDown className="w-3 h-3 text-red-400" />
                <p className="text-[10px] text-gray-500 uppercase">Failed</p>
              </div>
              <p className="text-lg font-bold text-red-400">{customer.failed_payments}</p>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/5 p-3">
              <p className="text-[10px] text-gray-500 uppercase">Total Value</p>
              <p className="text-lg font-bold text-white">{formatINR(customer.total_value)}</p>
            </div>
          </div>

          {/* Transaction History */}
          <div>
            <h4 className="text-sm font-bold text-white mb-3">Transaction History</h4>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {transactions.map((txn) => (
                <div key={txn.transaction_id} className="flex items-center gap-3 rounded-lg bg-white/[0.02] border border-white/5 p-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{txn.transaction_id}</span>
                      <StatusBadge status={txn.status} />
                    </div>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {txn.payment_method} · {txn.failure_reason} · {formatDateTime(txn.timestamp)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-white">{formatINR(txn.amount)}</p>
                    {txn.recommended_action !== 'STOP' && (
                      <div className="mt-1"><ActionBadge action={txn.recommended_action} /></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
