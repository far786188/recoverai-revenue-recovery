export type PaymentMethod = 'UPI' | 'Card' | 'Netbanking' | 'Wallet' | 'Mandate';

export type FailureReason =
  | 'Temporary bank decline'
  | 'Network timeout'
  | 'UPI timeout'
  | 'Insufficient funds'
  | 'Card expired'
  | 'Gateway error'
  | 'Mandate failure'
  | 'Subscription failure'
  | 'Invoice overdue'
  | 'Checkout abandonment';

export type TransactionStatus =
  | 'FAILED'
  | 'PENDING'
  | 'RECOVERED'
  | 'CONTACTED'
  | 'PAYMENT_METHOD_UPDATE_REQUIRED'
  | 'ESCALATED'
  | 'STOPPED';

export type ActionStatus =
  | 'PENDING'
  | 'SUCCESS'
  | 'FAILED'
  | 'SENT'
  | 'ESCALATED'
  | 'STOPPED'
  | 'REQUESTED';

export type RecommendedAction =
  | 'RETRY_PAYMENT'
  | 'SEND_REMINDER'
  | 'REQUEST_PAYMENT_METHOD_UPDATE'
  | 'ESCALATE'
  | 'STOP';

export type CustomerSegment = 'Enterprise' | 'SMB' | 'Individual' | 'Startup';

export interface ActionHistoryEntry {
  step: number;
  action: RecommendedAction;
  result: string;
  timestamp: string;
  detail: string;
}

export interface Transaction {
  transaction_id: string;
  customer_id: string;
  customer_name: string;
  amount: number;
  currency: string;
  payment_method: PaymentMethod;
  timestamp: string;
  status: TransactionStatus;
  failure_reason: FailureReason;
  retry_count: number;
  previous_successful_payments: number;
  customer_segment: CustomerSegment;
  risk_score: number;
  recovery_probability: number;
  recommended_action: RecommendedAction;
  action_status: ActionStatus;
  recovery_result: string;
  action_history: ActionHistoryEntry[];
  opted_out: boolean;
  overdue_days: number;
  recovered: boolean;
  recovered_amount: number;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  transaction_id: string;
  customer_name: string;
  amount: number;
  ai_diagnosis: string;
  ai_confidence: number;
  policy_applied: string;
  recommended_action: string;
  executed_action: string;
  result: string;
  status: string;
}

export interface AgentRunResult {
  transactions_analyzed: number;
  revenue_at_risk: number;
  revenue_recovered: number;
  recovery_rate: number;
  actions_executed: number;
  escalated_cases: number;
  stopped_cases: number;
  recovered_cases: number;
  failed_cases: number;
}

export interface CustomerProfile {
  customer_id: string;
  customer_name: string;
  segment: CustomerSegment;
  total_payments: number;
  successful_payments: number;
  failed_payments: number;
  total_value: number;
  recovery_opportunities: number;
  last_payment: string;
  recovery_probability: number;
}
