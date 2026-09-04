import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { Transaction, AuditEntry, AgentRunResult, CustomerProfile } from '@/types';
import { generateTransactions } from '@/data/generator';
import { executeRecovery } from '@/engine/recovery';
import { generateDiagnosis } from '@/engine/diagnosis';

interface AppState {
  transactions: Transaction[];
  auditLog: AuditEntry[];
  agentRunning: boolean;
  agentRunResult: AgentRunResult | null;
  agentStep: number;
  agentStepsComplete: number;
  resetDemo: () => void;
  runAgent: (onProgress?: (step: number) => void) => Promise<AgentRunResult>;
  executeSingleRecovery: (txnId: string) => void;
  getTransaction: (txnId: string) => Transaction | undefined;
  getCustomers: () => CustomerProfile[];
}

const AppContext = createContext<AppState | null>(null);

const AGENT_STEPS = [
  'Detecting revenue at risk',
  'Grouping payment failures',
  'Diagnosing root causes',
  'Estimating recovery probability',
  'Selecting recovery strategies',
  'Applying recovery policies',
  'Executing recovery simulations',
  'Applying stopping rules',
  'Updating revenue metrics',
  'Writing audit logs',
];

export { AGENT_STEPS };

export function AppProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>(() => generateTransactions());
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [agentRunning, setAgentRunning] = useState(false);
  const [agentRunResult, setAgentRunResult] = useState<AgentRunResult | null>(null);
  const [agentStep, setAgentStep] = useState(0);
  const [agentStepsComplete, setAgentStepsComplete] = useState(0);
  const [auditIdCounter, setAuditIdCounter] = useState(0);

  const resetDemo = useCallback(() => {
    setTransactions(generateTransactions());
    setAuditLog([]);
    setAgentRunning(false);
    setAgentRunResult(null);
    setAgentStep(0);
    setAgentStepsComplete(0);
    setAuditIdCounter(0);
  }, []);

  const runAgent = useCallback(async (onProgress?: (step: number) => void) => {
    setAgentRunning(true);
    setAgentStep(0);
    setAgentStepsComplete(0);

    const currentTxns = transactions;
    let workingTxns = currentTxns.map((t) => ({ ...t }));
    let workingAudit: AuditEntry[] = [];
    let counter = auditIdCounter;

    // Process each step with animation
    for (let step = 0; step < AGENT_STEPS.length; step++) {
      setAgentStep(step);
      onProgress?.(step);

      // Wait for animation
      await new Promise((resolve) => setTimeout(resolve, 450));

      if (step === 6) {
        // Execute recovery simulations
        const newAuditEntries: AuditEntry[] = [];
        for (let i = 0; i < workingTxns.length; i++) {
          const txn = workingTxns[i];
          if (txn.status !== 'FAILED') continue;
          if (txn.opted_out) continue;

          const outcome = executeRecovery(txn, { id: counter });
          workingTxns[i] = outcome.updatedTxn;
          newAuditEntries.push(...outcome.auditEntries);
          counter += outcome.auditEntries.length;
        }
        workingAudit = newAuditEntries;
      }

      setAgentStepsComplete(step + 1);
    }

    // Calculate results
    const atRiskTxns = workingTxns.filter((t) => t.status === 'FAILED' || t.status === 'RECOVERED' || t.status === 'ESCALATED' || t.status === 'STOPPED' || t.status === 'CONTACTED' || t.status === 'PAYMENT_METHOD_UPDATE_REQUIRED');
    const revenueAtRisk = atRiskTxns.reduce((sum, t) => sum + t.amount, 0);
    const recoveredTxns = workingTxns.filter((t) => t.recovered);
    const revenueRecovered = recoveredTxns.reduce((sum, t) => sum + t.recovered_amount, 0);
    const escalated = workingTxns.filter((t) => t.status === 'ESCALATED').length;
    const stopped = workingTxns.filter((t) => t.status === 'STOPPED').length;
    const actionsExecuted = workingAudit.length;
    const failedCases = workingTxns.filter((t) => t.action_status === 'FAILED').length;

    const result: AgentRunResult = {
      transactions_analyzed: workingTxns.length,
      revenue_at_risk: revenueAtRisk,
      revenue_recovered: revenueRecovered,
      recovery_rate: revenueAtRisk > 0 ? (revenueRecovered / revenueAtRisk) * 100 : 0,
      actions_executed: actionsExecuted,
      escalated_cases: escalated,
      stopped_cases: stopped,
      recovered_cases: recoveredTxns.length,
      failed_cases: failedCases,
    };

    setTransactions(workingTxns);
    setAuditLog(workingAudit);
    setAuditIdCounter(counter);
    setAgentRunResult(result);
    setAgentRunning(false);
    setAgentStep(AGENT_STEPS.length);

    return result;
  }, [transactions, auditIdCounter]);

  const executeSingleRecovery = useCallback((txnId: string) => {
    setTransactions((prev) => {
      let counter = auditIdCounter;
      const newAudit: AuditEntry[] = [];
      const updated = prev.map((txn) => {
        if (txn.transaction_id !== txnId) return txn;
        if (txn.status !== 'FAILED') return txn;
        if (txn.opted_out) return txn;

        const outcome = executeRecovery(txn, { id: counter });
        counter += outcome.auditEntries.length;
        newAudit.push(...outcome.auditEntries);
        return outcome.updatedTxn;
      });

      if (newAudit.length > 0) {
        setAuditLog((prevAudit) => [...newAudit, ...prevAudit]);
        setAuditIdCounter(counter);
      }
      return updated;
    });
  }, [auditIdCounter]);

  const getTransaction = useCallback(
    (txnId: string) => transactions.find((t) => t.transaction_id === txnId),
    [transactions]
  );

  const getCustomers = useCallback((): CustomerProfile[] => {
    const customerMap = new Map<string, CustomerProfile>();

    for (const txn of transactions) {
      if (!customerMap.has(txn.customer_id)) {
        customerMap.set(txn.customer_id, {
          customer_id: txn.customer_id,
          customer_name: txn.customer_name,
          segment: txn.customer_segment,
          total_payments: 0,
          successful_payments: 0,
          failed_payments: 0,
          total_value: 0,
          recovery_opportunities: 0,
          last_payment: txn.timestamp,
          recovery_probability: 0,
        });
      }
      const profile = customerMap.get(txn.customer_id)!;
      profile.total_payments += 1;
      profile.total_value += txn.amount;

      if (txn.status === 'FAILED' || txn.status === 'CONTACTED' || txn.status === 'PAYMENT_METHOD_UPDATE_REQUIRED') {
        profile.recovery_opportunities += 1;
        profile.recovery_probability = Math.max(profile.recovery_probability, txn.recovery_probability);
      }
      if (txn.recovered) {
        profile.successful_payments += 1;
      } else if (txn.status === 'FAILED') {
        profile.failed_payments += 1;
      } else {
        profile.successful_payments += 1;
      }

      if (new Date(txn.timestamp) > new Date(profile.last_payment)) {
        profile.last_payment = txn.timestamp;
      }
    }

    return Array.from(customerMap.values()).sort((a, b) => b.total_value - a.total_value);
  }, [transactions]);

  return (
    <AppContext.Provider
      value={{
        transactions,
        auditLog,
        agentRunning,
        agentRunResult,
        agentStep,
        agentStepsComplete,
        resetDemo,
        runAgent,
        executeSingleRecovery,
        getTransaction,
        getCustomers,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export { generateDiagnosis };
