import type { Transaction, AuditEntry, RecommendedAction, ActionHistoryEntry } from '@/types';
import { generateDiagnosis, getPolicyCheck, getActionLabel } from './diagnosis';

function nowTimestamp(): string {
  return new Date().toISOString();
}

function simulateRetrySuccess(recoveryProbability: number): boolean {
  // Deterministic-ish: use probability with some randomness
  return Math.random() * 100 < recoveryProbability;
}

export interface RecoveryOutcome {
  updatedTxn: Transaction;
  auditEntries: AuditEntry[];
  recovered: boolean;
  escalated: boolean;
  stopped: boolean;
  failed: boolean;
}

export function executeRecovery(
  txn: Transaction,
  auditIdCounter: { id: number }
): RecoveryOutcome {
  const auditEntries: AuditEntry[] = [];
  const diagnosis = generateDiagnosis(txn);
  const policyCheck = getPolicyCheck(txn);
  let updatedTxn = { ...txn, action_history: [...txn.action_history] };

  const makeAuditEntry = (
    executedAction: string,
    result: string,
    status: string
  ): AuditEntry => {
    auditIdCounter.id += 1;
    return {
      id: `AUDIT-${String(auditIdCounter.id).padStart(5, '0')}`,
      timestamp: nowTimestamp(),
      transaction_id: txn.transaction_id,
      customer_name: txn.customer_name,
      amount: txn.amount,
      ai_diagnosis: diagnosis.rootCause,
      ai_confidence: diagnosis.confidence,
      policy_applied: policyCheck,
      recommended_action: getActionLabel(txn.recommended_action),
      executed_action: executedAction,
      result,
      status,
    };
  };

  // Customer opt-out
  if (txn.opted_out) {
    updatedTxn = {
      ...updatedTxn,
      status: 'STOPPED',
      action_status: 'STOPPED',
      recovery_result: 'STOPPED_BY_OPT_OUT',
    };
    const entry = makeAuditEntry('Stop', 'Stopped — customer opt-out', 'STOPPED');
    auditEntries.push(entry);
    addHistoryEntry(updatedTxn, 'STOP', 'Stopped — customer opt-out');
    return { updatedTxn, auditEntries, recovered: false, escalated: false, stopped: true, failed: false };
  }

  // High-value escalation
  if (txn.amount >= 25000) {
    updatedTxn = {
      ...updatedTxn,
      status: 'ESCALATED',
      action_status: 'ESCALATED',
      recovery_result: 'ESCALATED_HIGH_VALUE',
      recommended_action: 'ESCALATE',
    };
    const entry = makeAuditEntry('Escalate', 'Escalated — high-value transaction', 'ESCALATED');
    auditEntries.push(entry);
    addHistoryEntry(updatedTxn, 'ESCALATE', 'Escalated — high-value transaction (₹25,000+)');
    return { updatedTxn, auditEntries, recovered: false, escalated: true, stopped: false, failed: false };
  }

  // Retry limit reached
  if (txn.retry_count >= 2) {
    updatedTxn = {
      ...updatedTxn,
      status: 'ESCALATED',
      action_status: 'ESCALATED',
      recovery_result: 'ESCALATED_RETRY_LIMIT',
      recommended_action: 'ESCALATE',
    };
    const entry = makeAuditEntry('Escalate', 'Escalated — maximum retry limit reached', 'ESCALATED');
    auditEntries.push(entry);
    addHistoryEntry(updatedTxn, 'ESCALATE', 'Escalated — maximum retry limit reached');
    return { updatedTxn, auditEntries, recovered: false, escalated: true, stopped: false, failed: false };
  }

  const action = txn.recommended_action;

  switch (action) {
    case 'RETRY_PAYMENT': {
      const success = simulateRetrySuccess(txn.recovery_probability);
      const newRetryCount = txn.retry_count + 1;

      if (success) {
        updatedTxn = {
          ...updatedTxn,
          status: 'RECOVERED',
          action_status: 'SUCCESS',
          recovery_result: 'RECOVERED',
          recovered: true,
          recovered_amount: txn.amount,
          retry_count: newRetryCount,
        };
        const entry = makeAuditEntry('Retry Payment', 'Recovered', 'RECOVERED');
        auditEntries.push(entry);
        addHistoryEntry(updatedTxn, 'RETRY_PAYMENT', `Recovery simulation successful — ₹${txn.amount.toLocaleString('en-IN')} recovered (Retry #${newRetryCount})`);
        return { updatedTxn, auditEntries, recovered: true, escalated: false, stopped: false, failed: false };
      } else {
        // Failed retry — check if limit reached
        if (newRetryCount >= 2) {
          updatedTxn = {
            ...updatedTxn,
            status: 'STOPPED',
            action_status: 'STOPPED',
            recovery_result: 'STOPPED_RETRY_LIMIT',
            retry_count: newRetryCount,
            recommended_action: 'ESCALATE',
          };
          const entry = makeAuditEntry('Retry Payment', 'Failed — maximum retry limit reached', 'STOPPED');
          auditEntries.push(entry);
          addHistoryEntry(updatedTxn, 'RETRY_PAYMENT', `Retry #${newRetryCount} failed — automatic recovery stopped by policy`);
          return { updatedTxn, auditEntries, recovered: false, escalated: false, stopped: true, failed: true };
        } else {
          updatedTxn = {
            ...updatedTxn,
            status: 'FAILED',
            action_status: 'FAILED',
            recovery_result: 'RETRY_FAILED',
            retry_count: newRetryCount,
          };
          const entry = makeAuditEntry('Retry Payment', 'Failed — retry eligible', 'FAILED');
          auditEntries.push(entry);
          addHistoryEntry(updatedTxn, 'RETRY_PAYMENT', `Retry #${newRetryCount} failed — retry limit not yet reached`);
          return { updatedTxn, auditEntries, recovered: false, escalated: false, stopped: false, failed: true };
        }
      }
    }

    case 'SEND_REMINDER': {
      updatedTxn = {
        ...updatedTxn,
        status: 'CONTACTED',
        action_status: 'SENT',
        recovery_result: 'REMINDER_SENT',
      };
      const entry = makeAuditEntry('Send Reminder', 'Reminder sent', 'CONTACTED');
      auditEntries.push(entry);
      addHistoryEntry(updatedTxn, 'SEND_REMINDER', 'Payment reminder sent to customer');
      return { updatedTxn, auditEntries, recovered: false, escalated: false, stopped: false, failed: false };
    }

    case 'REQUEST_PAYMENT_METHOD_UPDATE': {
      updatedTxn = {
        ...updatedTxn,
        status: 'PAYMENT_METHOD_UPDATE_REQUIRED',
        action_status: 'REQUESTED',
        recovery_result: 'UPDATE_REQUESTED',
      };
      const entry = makeAuditEntry('Request Payment Method Update', 'Update requested', 'PAYMENT_METHOD_UPDATE_REQUIRED');
      auditEntries.push(entry);
      addHistoryEntry(updatedTxn, 'REQUEST_PAYMENT_METHOD_UPDATE', 'Payment method update requested from customer');
      return { updatedTxn, auditEntries, recovered: false, escalated: false, stopped: false, failed: false };
    }

    case 'ESCALATE': {
      updatedTxn = {
        ...updatedTxn,
        status: 'ESCALATED',
        action_status: 'ESCALATED',
        recovery_result: 'ESCALATED',
      };
      const entry = makeAuditEntry('Escalate', 'Escalated to human review', 'ESCALATED');
      auditEntries.push(entry);
      addHistoryEntry(updatedTxn, 'ESCALATE', 'Escalated to human review team');
      return { updatedTxn, auditEntries, recovered: false, escalated: true, stopped: false, failed: false };
    }

    case 'STOP': {
      updatedTxn = {
        ...updatedTxn,
        status: 'STOPPED',
        action_status: 'STOPPED',
        recovery_result: 'STOPPED',
      };
      const entry = makeAuditEntry('Stop', 'Stopped by policy', 'STOPPED');
      auditEntries.push(entry);
      addHistoryEntry(updatedTxn, 'STOP', 'Recovery stopped by policy');
      return { updatedTxn, auditEntries, recovered: false, escalated: false, stopped: true, failed: false };
    }

    default:
      return { updatedTxn, auditEntries, recovered: false, escalated: false, stopped: false, failed: false };
  }
}

function addHistoryEntry(
  txn: Transaction,
  action: RecommendedAction,
  detail: string
): void {
  const entry: ActionHistoryEntry = {
    step: txn.action_history.length + 1,
    action,
    result: detail,
    timestamp: nowTimestamp(),
    detail,
  };
  txn.action_history.push(entry);
}
