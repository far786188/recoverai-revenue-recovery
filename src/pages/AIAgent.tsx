import { useState, useMemo, useRef } from 'react';
import {
  Bot, Play, CheckCircle2, Loader2, Zap, TrendingUp,
  AlertTriangle, Ban, ArrowUpCircle, Activity, Sparkles,
} from 'lucide-react';
import { useApp, AGENT_STEPS } from '@/context/AppContext';
import { formatINR, formatINRShort } from '@/utils/format';
import type { AgentRunResult } from '@/types';

export function AIAgent() {
  const { transactions, agentRunning, agentRunResult, agentStep, agentStepsComplete, runAgent, resetDemo } = useApp();
  const [localResult, setLocalResult] = useState<AgentRunResult | null>(null);
  const [runStats, setRunStats] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const displayResult = agentRunResult || localResult;

  const eligibleTxns = useMemo(() => {
    return transactions.filter((t) => t.status === 'FAILED' && !t.opted_out);
  }, [transactions]);

  const handleRun = async () => {
    setLocalResult(null);
    setRunStats([]);
    const stats: string[] = [];

    // Pre-compute stats for display
    const retryEligible = transactions.filter((t) =>
      t.status === 'FAILED' && !t.opted_out && t.recommended_action === 'RETRY_PAYMENT'
    ).length;
    const pmUpdates = transactions.filter((t) =>
      t.status === 'FAILED' && !t.opted_out && t.recommended_action === 'REQUEST_PAYMENT_METHOD_UPDATE'
    ).length;
    const escalations = transactions.filter((t) =>
      t.status === 'FAILED' && !t.opted_out && t.recommended_action === 'ESCALATE'
    ).length;
    const reminders = transactions.filter((t) =>
      t.status === 'FAILED' && !t.opted_out && t.recommended_action === 'SEND_REMINDER'
    ).length;
    const stopped = transactions.filter((t) =>
      t.status === 'FAILED' && (t.opted_out || t.retry_count >= 2)
    ).length;

    const result = await runAgent(async (step) => {
      if (step === 1) {
        stats.push(`${transactions.length} transactions analyzed`);
        setRunStats([...stats]);
      } else if (step === 2) {
        stats.push(`${eligibleTxns.length} recovery opportunities identified`);
        setRunStats([...stats]);
      } else if (step === 4) {
        stats.push(`${retryEligible} retries eligible`);
        stats.push(`${pmUpdates} payment-method updates required`);
        stats.push(`${escalations} escalations required`);
        stats.push(`${reminders} reminders to send`);
        stats.push(`${stopped} cases stopped by policy`);
        setRunStats([...stats]);
      }
      // Auto-scroll
      setTimeout(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }, 50);
    });

    setLocalResult(result);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">AI Recovery Agent</h2>
        <p className="text-sm text-gray-500 mt-1">Autonomous revenue recovery with bounded policy enforcement</p>
      </div>

      {/* Agent Panel */}
      <div className="rounded-2xl bg-gradient-to-br from-[#0d1117] via-blue-500/[0.03] to-purple-500/[0.03] border border-white/10 overflow-hidden">
        {/* Agent Header */}
        <div className="relative px-6 py-8 border-b border-white/5 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5" />
          <div className="relative flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 ${
              agentRunning
                ? 'bg-gradient-to-br from-blue-500 to-purple-600 animate-pulse'
                : displayResult
                  ? 'bg-gradient-to-br from-emerald-500 to-blue-500'
                  : 'bg-gradient-to-br from-blue-500/80 to-purple-600/80'
            }`}>
              {agentRunning ? (
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              ) : displayResult ? (
                <CheckCircle2 className="w-8 h-8 text-white" />
              ) : (
                <Bot className="w-8 h-8 text-white" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="text-xl font-bold text-white">
                  {agentRunning ? 'AGENT RUNNING' : displayResult ? 'RECOVERY RUN COMPLETE' : 'Agent Ready'}
                </h3>
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30">
                  <span className="relative flex h-1.5 w-1.5">
                    {!agentRunning && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-400">{agentRunning ? 'PROCESSING' : 'ONLINE'}</span>
                </div>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                {agentRunning
                  ? `Step ${agentStepsComplete + 1}/${AGENT_STEPS.length}: ${AGENT_STEPS[Math.min(agentStep, AGENT_STEPS.length - 1)]}`
                  : displayResult
                    ? `${displayResult.transactions_analyzed} transactions processed — ${formatINRShort(displayResult.revenue_recovered)} recovered`
                    : 'Click below to process the recovery batch'}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          {agentRunning && (
            <div className="relative mt-5">
              <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 transition-all duration-500 ease-out"
                  style={{ width: `${(agentStepsComplete / AGENT_STEPS.length) * 100}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-500 mt-1.5">{Math.round((agentStepsComplete / AGENT_STEPS.length) * 100)}% complete</p>
            </div>
          )}
        </div>

        {/* Steps */}
        <div ref={scrollRef} className="p-6 max-h-[400px] overflow-y-auto">
          {agentRunning || runStats.length > 0 || displayResult ? (
            <div className="space-y-2">
              {AGENT_STEPS.map((step, i) => {
                const done = agentStepsComplete > i || (displayResult && !agentRunning);
                const current = agentRunning && agentStep === i;
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3 rounded-xl p-3 transition-all duration-300 ${
                      current ? 'bg-blue-500/10 border border-blue-500/20' : done ? 'bg-white/[0.02]' : 'opacity-30'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all ${
                      done ? 'bg-emerald-500/20' : current ? 'bg-blue-500/20' : 'bg-white/5'
                    }`}>
                      {done ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : current ? (
                        <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                      ) : (
                        <span className="text-xs text-gray-500">{i + 1}</span>
                      )}
                    </div>
                    <span className={`text-sm ${done ? 'text-white' : current ? 'text-blue-400' : 'text-gray-500'}`}>
                      {step}
                    </span>
                  </div>
                );
              })}

              {/* Run Stats */}
              {runStats.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/5 space-y-1.5">
                  {runStats.map((stat, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-gray-300 animate-fadeIn">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      {stat}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center mb-4">
                <Sparkles className="w-10 h-10 text-blue-400/50" />
              </div>
              <p className="text-sm text-gray-400 max-w-md">
                The agent will analyze all {transactions.length} transactions, diagnose failures, apply bounded recovery policies, execute simulated recovery actions, and log every decision to the audit trail.
              </p>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="px-6 py-4 border-t border-white/5 flex items-center gap-3">
          {!agentRunning && !displayResult && (
            <button
              onClick={handleRun}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-emerald-500/20 transition-all duration-200 active:scale-[0.98]"
            >
              <Play className="w-4 h-4" fill="white" />
              RUN RECOVERY AGENT
            </button>
          )}
          {agentRunning && (
            <button
              disabled
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white/5 text-gray-500 font-semibold text-sm cursor-not-allowed"
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              PROCESSING...
            </button>
          )}
          {displayResult && !agentRunning && (
            <button
              onClick={() => {
                resetDemo();
                setLocalResult(null);
                setRunStats([]);
              }}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-200 active:scale-[0.98]"
            >
              <Zap className="w-4 h-4" />
              RUN AGAIN
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {displayResult && !agentRunning && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-white">Recovery Run Complete</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <ResultCard label="Transactions Analyzed" value={displayResult.transactions_analyzed.toString()} icon={Activity} color="text-blue-400" />
            <ResultCard label="Revenue At Risk" value={formatINRShort(displayResult.revenue_at_risk)} icon={AlertTriangle} color="text-amber-400" />
            <ResultCard label="Revenue Recovered" value={formatINRShort(displayResult.revenue_recovered)} icon={TrendingUp} color="text-emerald-400" />
            <ResultCard label="Recovery Rate" value={`${displayResult.recovery_rate.toFixed(1)}%`} icon={Zap} color="text-blue-400" />
            <ResultCard label="Actions Executed" value={displayResult.actions_executed.toString()} icon={Activity} color="text-purple-400" />
            <ResultCard label="Escalated Cases" value={displayResult.escalated_cases.toString()} icon={ArrowUpCircle} color="text-orange-400" />
            <ResultCard label="Stopped Cases" value={displayResult.stopped_cases.toString()} icon={Ban} color="text-gray-400" />
          </div>

          {/* Simulated Recovery Result banner */}
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-400">Simulated Recovery Result</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {displayResult.recovered_cases} transactions recovered · {formatINR(displayResult.revenue_recovered)} simulated revenue recovered · {displayResult.escalated_cases} escalated · {displayResult.stopped_cases} stopped by policy
              </p>
            </div>
          </div>

          {/* Stopping Rule Highlight */}
          {displayResult.stopped_cases > 0 && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Ban className="w-5 h-5 text-red-400" />
                <h4 className="text-sm font-bold text-red-400">Stopping Rule Applied</h4>
              </div>
              <p className="text-sm text-gray-300">
                {displayResult.stopped_cases} case(s) were stopped by the maximum retry limit policy. Automatic recovery was halted and these cases are marked for human escalation.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ResultCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: typeof Activity; color: string }) {
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4">
      <Icon className={`w-5 h-5 ${color} mb-2`} />
      <p className="text-lg font-bold text-white">{value}</p>
      <p className="text-[10px] text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}
