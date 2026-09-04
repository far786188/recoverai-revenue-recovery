import type { TransactionStatus, ActionStatus, RecommendedAction } from '@/types';

export function StatusBadge({ status }: { status: TransactionStatus }) {
  const styles: Record<TransactionStatus, string> = {
    FAILED: 'bg-red-500/15 text-red-400 border-red-500/30',
    PENDING: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    RECOVERED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    CONTACTED: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    PAYMENT_METHOD_UPDATE_REQUIRED: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    ESCALATED: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    STOPPED: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

export function ActionBadge({ action }: { action: RecommendedAction }) {
  const labels: Record<RecommendedAction, string> = {
    RETRY_PAYMENT: 'Retry Payment',
    SEND_REMINDER: 'Send Reminder',
    REQUEST_PAYMENT_METHOD_UPDATE: 'Request PM Update',
    ESCALATE: 'Escalate',
    STOP: 'Stop',
  };

  const styles: Record<RecommendedAction, string> = {
    RETRY_PAYMENT: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    SEND_REMINDER: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    REQUEST_PAYMENT_METHOD_UPDATE: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    ESCALATE: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    STOP: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[action]}`}>
      {labels[action]}
    </span>
  );
}

export function ActionStatusBadge({ status }: { status: ActionStatus }) {
  const styles: Record<ActionStatus, string> = {
    PENDING: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
    SUCCESS: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    FAILED: 'bg-red-500/15 text-red-400 border-red-500/30',
    SENT: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    ESCALATED: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    STOPPED: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
    REQUESTED: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>
      {status}
    </span>
  );
}

export function RiskBadge({ score }: { score: number }) {
  const level = score >= 75 ? 'HIGH' : score >= 50 ? 'MEDIUM' : 'LOW';
  const style = score >= 75
    ? 'bg-red-500/15 text-red-400 border-red-500/30'
    : score >= 50
      ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
      : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style}`}>
      {level} ({score})
    </span>
  );
}

export function ProbabilityBadge({ probability }: { probability: number }) {
  const style = probability >= 70
    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
    : probability >= 40
      ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
      : 'bg-red-500/15 text-red-400 border-red-500/30';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style}`}>
      {probability}%
    </span>
  );
}
