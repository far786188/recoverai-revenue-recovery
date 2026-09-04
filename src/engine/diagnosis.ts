import type { Transaction, RecommendedAction, FailureReason } from '@/types';

export function generateDiagnosis(txn: Transaction): {
  rootCause: string;
  confidence: number;
  reasoning: string;
} {
  const rootCauseMap: Record<FailureReason, string> = {
    'Temporary bank decline': 'Temporary issuer-side bank failure',
    'Network timeout': 'Network connectivity timeout during payment authorization',
    'UPI timeout': 'UPI payment rails timeout — NPCI gateway unresponsive',
    'Insufficient funds': 'Customer account has insufficient balance',
    'Card expired': 'Card has passed its expiration date',
    'Gateway error': 'Payment gateway returned an internal processing error',
    'Mandate failure': 'Auto-debit mandate execution failed at bank end',
    'Subscription failure': 'Recurring subscription charge could not be processed',
    'Invoice overdue': 'Invoice payment is past due date',
    'Checkout abandonment': 'Customer abandoned checkout before completing payment',
  };

  const rootCause = rootCauseMap[txn.failure_reason];

  let confidence = 70;
  if (txn.previous_successful_payments > 5) confidence += 10;
  if (txn.previous_successful_payments > 10) confidence += 8;
  if (txn.retry_count > 0) confidence -= 5;
  confidence = Math.max(50, Math.min(98, confidence));

  const historyNote =
    txn.previous_successful_payments > 10
      ? 'a very strong successful payment history'
      : txn.previous_successful_payments > 5
        ? 'a good successful payment history'
        : txn.previous_successful_payments > 0
          ? 'some prior successful payments'
          : 'no prior successful payment history';

  const retryNote =
    txn.retry_count === 0
      ? 'the automatic retry limit has not been reached'
      : txn.retry_count === 1
        ? 'one retry has been attempted but the limit has not been reached'
        : 'the maximum retry limit has been reached';

  let reasoning = '';
  switch (txn.failure_reason) {
    case 'Temporary bank decline':
      reasoning = `The failure appears temporary, the customer has ${historyNote}, and ${retryNote}.`;
      break;
    case 'Network timeout':
    case 'UPI timeout':
      reasoning = `The timeout is likely transient (network/gateway level), the customer has ${historyNote}, and ${retryNote}.`;
      break;
    case 'Insufficient funds':
      reasoning = `The customer account lacks sufficient balance. Repeated retries are not recommended; a reminder is more appropriate.`;
      break;
    case 'Card expired':
      reasoning = `The card has expired and cannot process payments. A payment method update is required from the customer.`;
      break;
    case 'Gateway error':
      reasoning = `The gateway error is likely transient. The customer has ${historyNote}, and ${retryNote}.`;
      break;
    case 'Mandate failure':
      reasoning = `The mandate execution failed at the bank. ${retryNote}. If retries are exhausted, a payment method update should be requested.`;
      break;
    case 'Subscription failure':
      reasoning = `The recurring charge failed. ${historyNote}. ${retryNote}.`;
      break;
    case 'Invoice overdue':
      reasoning = `The invoice is ${txn.overdue_days} days overdue. ${txn.overdue_days > 30 ? 'Escalation is recommended due to the overdue threshold being exceeded.' : 'A reminder is recommended at this stage.'}`;
      break;
    case 'Checkout abandonment':
      reasoning = `The customer abandoned checkout. A gentle reminder may recover this revenue without a retry.`;
      break;
  }

  if (txn.opted_out) {
    reasoning = 'Customer has opted out of automated recovery. All recovery actions are stopped.';
  }
  if (txn.amount >= 25000) {
    reasoning = `High-value transaction (₹${txn.amount.toLocaleString('en-IN')}). Human review required — automated retries are not permitted for transactions at or above ₹25,000.`;
  }

  return { rootCause, confidence: Math.round(confidence), reasoning };
}

export function getPolicyCheck(txn: Transaction): string {
  if (txn.opted_out) return 'Customer opt-out — recovery stopped';
  if (txn.amount >= 25000) return 'High-value threshold — human escalation required';
  if (txn.retry_count >= 2) return 'Maximum retry limit reached — escalation required';

  switch (txn.failure_reason) {
    case 'Card expired':
      return 'Card expired — payment method update required';
    case 'Insufficient funds':
      return 'Insufficient funds — reminder only, no retry';
    case 'Invoice overdue':
      return txn.overdue_days > 30
        ? 'Overdue threshold exceeded — escalation required'
        : 'Invoice overdue — reminder allowed';
    case 'Checkout abandonment':
      return 'Checkout abandonment — reminder only';
    case 'Mandate failure':
    case 'Subscription failure':
      return txn.retry_count >= 1
        ? 'Retry limit for this failure type — payment method update'
        : 'Automatic retry allowed';
    default:
      return `Automatic retry allowed (retry ${txn.retry_count} < 2)`;
  }
}

export function getActionLabel(action: RecommendedAction): string {
  switch (action) {
    case 'RETRY_PAYMENT': return 'Retry Payment';
    case 'SEND_REMINDER': return 'Send Reminder';
    case 'REQUEST_PAYMENT_METHOD_UPDATE': return 'Request Payment Method Update';
    case 'ESCALATE': return 'Escalate';
    case 'STOP': return 'Stop';
  }
}

export function isActionable(txn: Transaction): boolean {
  return (
    txn.status === 'FAILED' &&
    !txn.opted_out &&
    txn.recommended_action !== 'STOP'
  );
}
