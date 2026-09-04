import { useMemo } from 'react';
import {
  TrendingDown, TrendingUp, Percent, AlertTriangle,
  Target, ArrowUpCircle, Bot, Shield, Play, Activity,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { formatINR, formatINRShort } from '@/utils/format';
import { BarChart, DonutChart, LineChart, ProgressBar } from '@/components/Charts';

interface OverviewProps {
  onNavigate: (page: 'overview' | 'queue' | 'agent' | 'customers' | 'audit') => void;
}

export function Overview({ onNavigate }: OverviewProps) {
  const { transactions, agentRunResult, agentRunning } = useApp();

  const metrics = useMemo(() => {
    const atRisk = transactions.filter((t) =>
      t.status === 'FAILED' || t.status === 'CONTACTED' || t.status === 'PAYMENT_METHOD_UPDATE_REQUIRED'
    );
    const recovered = transactions.filter((t) => t.recovered);
    const escalated = transactions.filter((t) => t.status === 'ESCALATED');
    const stopped = transactions.filter((t) => t.status === 'STOPPED');
    const failed = transactions.filter((t) => t.status === 'FAILED');

    const totalAtRisk = transactions.reduce((sum, t) => sum + t.amount, 0);
    const recoveredRevenue = recovered.reduce((sum, t) => sum + t.recovered_amount, 0);
    const recoveryRate = totalAtRisk > 0 ? (recoveredRevenue / totalAtRisk) * 100 : 0;
    const opportunities = atRisk.length + recovered.length + escalated.length + stopped.length;

    return {
      totalAtRisk,
      recoveredRevenue,
      recoveryRate,
      failedCount: failed.length,
      opportunities: atRisk.length,
      escalatedCount: escalated.length,
      stoppedCount: stopped.length,
      recoveredCount: recovered.length,
    };
  }, [transactions]);

  const failureReasonData = useMemo(() => {
    const map = new Map<string, number>();
    transactions.forEach((t) => {
      map.set(t.failure_reason, (map.get(t.failure_reason) || 0) + 1);
    });
    const colors = ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#10b981', '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#6366f1'];
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([label, value], i) => ({ label, value, color: colors[i % colors.length] }));
  }, [transactions]);

  const recoveryActionData = useMemo(() => {
    const map = new Map<string, number>();
    transactions.forEach((t) => {
      const label = t.recommended_action.replace(/_/g, ' ');
      map.set(label, (map.get(label) || 0) + 1);
    });
    return Array.from(map.entries()).map(([label, value]) => ({ label, value }));
  }, [transactions]);

  const paymentMethodData = useMemo(() => {
    const map = new Map<string, { total: number; recovered: number }>();
    transactions.forEach((t) => {
      const entry = map.get(t.payment_method) || { total: 0, recovered: 0 };
      entry.total += t.amount;
      if (t.recovered) entry.recovered += t.recovered_amount;
      map.set(t.payment_method, entry);
    });
    const colors: Record<string, string> = {
      UPI: '#10b981', Card: '#3b82f6', Netbanking: '#8b5cf6', Wallet: '#f59e0b', Mandate: '#ec4899',
    };
    return Array.from(map.entries()).map(([label, val]) => ({
      label, value: val.total, color: colors[label] || '#6366f1',
    }));
  }, [transactions]);

  const recoveryRateData = useMemo(() => {
    const buckets = ['0-20%', '20-40%', '40-60%', '60-80%', '80-100%'];
    const counts = [0, 0, 0, 0, 0];
    transactions.forEach((t) => {
      if (t.recovery_probability <= 20) counts[0]++;
      else if (t.recovery_probability <= 40) counts[1]++;
      else if (t.recovery_probability <= 60) counts[2]++;
      else if (t.recovery_probability <= 80) counts[3]++;
      else counts[4]++;
    });
    return buckets.map((label, i) => ({ label, value: counts[i] }));
  }, [transactions]);

  const kpis = [
    { label: 'Total Revenue At Risk', value: formatINRShort(metrics.totalAtRisk), icon: TrendingDown, color: 'text-red-400', bg: 'from-red-500/10 to-red-500/5', border: 'border-red-500/20' },
    { label: 'Recovered Revenue', value: formatINRShort(metrics.recoveredRevenue), icon: TrendingUp, color: 'text-emerald-400', bg: 'from-emerald-500/10 to-emerald-500/5', border: 'border-emerald-500/20' },
    { label: 'Recovery Rate', value: `${metrics.recoveryRate.toFixed(1)}%`, icon: Percent, color: 'text-blue-400', bg: 'from-blue-500/10 to-blue-500/5', border: 'border-blue-500/20' },
    { label: 'Failed Payments', value: metrics.failedCount.toString(), icon: AlertTriangle, color: 'text-amber-400', bg: 'from-amber-500/10 to-amber-500/5', border: 'border-amber-500/20' },
    { label: 'Recovery Opportunities', value: metrics.opportunities.toString(), icon: Target, color: 'text-purple-400', bg: 'from-purple-500/10 to-purple-500/5', border: 'border-purple-500/20' },
    { label: 'Escalated Cases', value: metrics.escalatedCount.toString(), icon: ArrowUpCircle, color: 'text-orange-400', bg: 'from-orange-500/10 to-orange-500/5', border: 'border-orange-500/20' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Revenue Recovery Command Center</h2>
          <p className="text-sm text-gray-500 mt-1">Real-time view of revenue at risk and recovery performance</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="text-xs text-gray-400">Live Dashboard</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div
              key={i}
              className={`rounded-2xl bg-gradient-to-br ${kpi.bg} border ${kpi.border} p-4 backdrop-blur-sm hover:scale-[1.02] transition-transform duration-200`}
            >
              <div className="flex items-center justify-between mb-3">
                <Icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
              <p className="text-xs text-gray-500 mt-1">{kpi.label}</p>
            </div>
          );
        })}
      </div>

      {/* AI Agent Card + Guardrails */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-transparent border border-blue-500/20 p-6 backdrop-blur-sm">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
              <Bot className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="text-lg font-bold text-white">RECOVERAI AGENT</h3>
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-400">ONLINE</span>
                </div>
              </div>
              <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                Analyzes revenue leakage and executes bounded recovery workflows.
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {agentRunResult
                  ? `Last run: ${agentRunResult.transactions_analyzed} analyzed, ${formatINRShort(agentRunResult.revenue_recovered)} recovered, ${agentRunResult.recovery_rate.toFixed(1)}% recovery rate`
                  : 'Ready to process recovery batch. No runs executed yet.'}
              </p>
              <button
                onClick={() => onNavigate('agent')}
                disabled={agentRunning}
                className="mt-4 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-emerald-500/20 transition-all duration-200 active:scale-95 disabled:opacity-50"
              >
                <Play className="w-4 h-4" fill="white" />
                RUN RECOVERY AGENT
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white/[0.02] border border-white/10 p-5 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Agent Guardrails</h3>
          </div>
          <ul className="space-y-2.5">
            {[
              'Maximum automatic retries: 2',
              'High-value threshold: ₹25,000',
              'Human escalation enabled',
              'Customer opt-out respected',
              'Every action logged',
              'No unlimited retries',
              'Demo mode — no real payments',
            ].map((rule, i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-gray-400">
                <span className="text-emerald-400 font-bold">✓</span>
                {rule}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-white/[0.02] border border-white/10 p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Revenue At Risk vs Recovered Revenue</h3>
          <BarChart
            data={[
              { label: 'At Risk', value: metrics.totalAtRisk, color: 'linear-gradient(to top, #ef4444, #f87171)' },
              { label: 'Recovered', value: metrics.recoveredRevenue, color: 'linear-gradient(to top, #10b981, #34d399)' },
              { label: 'Escalated', value: transactions.filter((t) => t.status === 'ESCALATED').reduce((s, t) => s + t.amount, 0), color: 'linear-gradient(to top, #f59e0b, #fbbf24)' },
              { label: 'Stopped', value: transactions.filter((t) => t.status === 'STOPPED').reduce((s, t) => s + t.amount, 0), color: 'linear-gradient(to top, #6b7280, #9ca3af)' },
            ]}
            formatValue={formatINRShort}
          />
        </div>

        <div className="rounded-2xl bg-white/[0.02] border border-white/10 p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Recovery Rate Distribution</h3>
          <LineChart data={recoveryRateData} color="#3b82f6" />
        </div>

        <div className="rounded-2xl bg-white/[0.02] border border-white/10 p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Failure Reasons</h3>
          <DonutChart
            data={failureReasonData.slice(0, 8)}
            centerValue={transactions.length.toString()}
            centerLabel="Total"
          />
        </div>

        <div className="rounded-2xl bg-white/[0.02] border border-white/10 p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Recovery Actions</h3>
          <BarChart
            data={recoveryActionData.map((d, i) => ({
              ...d,
              color: ['linear-gradient(to top, #10b981, #34d399)', 'linear-gradient(to top, #3b82f6, #60a5fa)', 'linear-gradient(to top, #8b5cf6, #a78bfa)', 'linear-gradient(to top, #f59e0b, #fbbf24)', 'linear-gradient(to top, #6b7280, #9ca3af)'][i % 5],
            }))}
          />
        </div>

        <div className="rounded-2xl bg-white/[0.02] border border-white/10 p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-white mb-4">Recovery by Payment Method</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {paymentMethodData.map((pm, i) => {
              const recovered = transactions
                .filter((t) => t.payment_method === pm.label && t.recovered)
                .reduce((s, t) => s + t.recovered_amount, 0);
              return (
                <div key={i} className="rounded-xl bg-white/[0.03] border border-white/5 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-sm" style={{ background: pm.color }} />
                    <span className="text-xs font-medium text-gray-300">{pm.label}</span>
                  </div>
                  <p className="text-lg font-bold text-white">{formatINRShort(pm.value)}</p>
                  <p className="text-[10px] text-gray-500 mt-1">At Risk</p>
                  <div className="mt-3">
                    <ProgressBar
                      value={recovered}
                      max={pm.value}
                      color={pm.color}
                      formatValue={formatINRShort}
                    />
                    <p className="text-[10px] text-emerald-400 mt-1">{formatINRShort(recovered)} recovered</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
