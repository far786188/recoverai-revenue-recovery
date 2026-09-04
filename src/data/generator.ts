import type {
  Transaction,
  PaymentMethod,
  FailureReason,
  CustomerSegment,
  RecommendedAction,
} from '@/types';

const FIRST_NAMES = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Krishna',
  'Ishaan', 'Rohan', 'Aryan', 'Kabir', 'Dhruv', 'Ayaan', 'Cyrus', 'Nikhil',
  'Aanya', 'Diya', 'Saanvi', 'Aadhya', 'Kiara', 'Ananya', 'Pari', 'Myra',
  'Riya', 'Sara', 'Ira', 'Anika', 'Navya', 'Tara', 'Aaradhya', 'Ishita',
  'Rahul', 'Amit', 'Sanjay', 'Priya', 'Neha', 'Kavya', 'Meera', 'Rohan',
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Gupta', 'Reddy', 'Nair', 'Iyer', 'Mehta', 'Patel',
  'Singh', 'Kumar', 'Rao', 'Joshi', 'Malhotra', 'Chopra', 'Kapoor', 'Bose',
  'Banerjee', 'Das', 'Pillai', 'Menon', 'Kaur', 'Bhat', 'Agarwal', 'Shah',
  'Saxena', 'Mishra', 'Nanda', 'Bhatia', 'Chauhan', 'Desai', 'Ghosh', 'Nair',
];

const COMPANIES = [
  'TechNova Solutions', 'Bharat Retail Pvt Ltd', 'CloudKart Commerce',
  'UrbanBasket', 'MediCare Plus', 'EduReach Technologies', 'GreenLeaf Organics',
  'Speedy Logistics', 'FinEdge Advisory', 'DataWeave Analytics',
  'Zaffron Foods', 'Pinnacle Realty', 'Skyline Travels', 'BrightPath EdTech',
  'Orbit Mobility', 'Zenith Health', 'Apex Manufacturing', 'Nexus Systems',
  'Verve Media', 'Quantum Retail', 'Stellar Foods', 'Pioneer Apparel',
];

const PAYMENT_METHODS: PaymentMethod[] = ['UPI', 'Card', 'Netbanking', 'Wallet', 'Mandate'];

const FAILURE_REASONS: FailureReason[] = [
  'Temporary bank decline', 'Network timeout', 'UPI timeout',
  'Insufficient funds', 'Card expired', 'Gateway error',
  'Mandate failure', 'Subscription failure', 'Invoice overdue',
  'Checkout abandonment',
];

const SEGMENTS: CustomerSegment[] = ['Enterprise', 'SMB', 'Individual', 'Startup'];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function pick<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}

function roundTo(n: number, step: number): number {
  return Math.round(n / step) * step;
}

export function generateTransactions(): Transaction[] {
  const rand = seededRandom(42);
  const transactions: Transaction[] = [];

  for (let i = 0; i < 100; i++) {
    const firstName = pick(FIRST_NAMES, rand);
    const lastName = pick(LAST_NAMES, rand);
    const customerName = rand() > 0.6 ? pick(COMPANIES, rand) : `${firstName} ${lastName}`;
    const customerId = `CUST-${String(1000 + i).padStart(4, '0')}`;
    const txnId = `TXN-${String(1042 + i).padStart(4, '0')}`;

    const paymentMethod = pick(PAYMENT_METHODS, rand);
    const failureReason = pick(FAILURE_REASONS, rand);
    const segment = pick(SEGMENTS, rand);

    const amount = roundTo(
      segment === 'Enterprise' ? 10000 + rand() * 90000
        : segment === 'SMB' ? 2000 + rand() * 20000
          : segment === 'Startup' ? 5000 + rand() * 30000
            : 100 + rand() * 5000,
      10
    );

    const previousSuccessfulPayments = Math.floor(rand() * 20);
    const retryCount = Math.floor(rand() * 3);
    const overdueDays = failureReason === 'Invoice overdue' ? Math.floor(rand() * 60) + 5 : 0;
    const optedOut = rand() < 0.05;

    const riskScore = Math.round(
      (failureReason === 'Card expired' ? 90 : failureReason === 'Insufficient funds' ? 75 : 40) +
      rand() * 20
    );

    const recoveryProbability = computeRecoveryProbability(
      failureReason, previousSuccessfulPayments, retryCount, amount, optedOut
    );

    const recommendedAction = computeRecommendedAction(
      failureReason, retryCount, amount, optedOut, overdueDays
    );

    const daysAgo = Math.floor(rand() * 14);
    const timestamp = new Date(Date.now() - daysAgo * 86400000 - Math.floor(rand() * 86400000)).toISOString();

    transactions.push({
      transaction_id: txnId,
      customer_id: customerId,
      customer_name: customerName,
      amount,
      currency: 'INR',
      payment_method: paymentMethod,
      timestamp,
      status: 'FAILED',
      failure_reason: failureReason,
      retry_count: retryCount,
      previous_successful_payments: previousSuccessfulPayments,
      customer_segment: segment,
      risk_score: Math.min(100, riskScore),
      recovery_probability: recoveryProbability,
      recommended_action: recommendedAction,
      action_status: 'PENDING',
      recovery_result: 'NOT_ATTEMPTED',
      action_history: [],
      opted_out: optedOut,
      overdue_days: overdueDays,
      recovered: false,
      recovered_amount: 0,
    });
  }

  // Ensure at least one stopping-rule demo: set retry_count to 2 on a specific txn
  if (transactions.length > 5) {
    transactions[5].retry_count = 2;
    transactions[5].failure_reason = 'Temporary bank decline';
    transactions[5].recommended_action = 'ESCALATE';
    transactions[5].amount = 4999;
  }

  // Ensure at least one high-value escalation
  if (transactions.length > 10) {
    transactions[10].amount = 35000;
    transactions[10].failure_reason = 'Temporary bank decline';
    transactions[10].customer_segment = 'Enterprise';
    transactions[10].recommended_action = 'ESCALATE';
  }

  return transactions;
}

export function computeRecoveryProbability(
  failureReason: FailureReason,
  previousSuccessfulPayments: number,
  retryCount: number,
  amount: number,
  optedOut: boolean
): number {
  if (optedOut) return 0;
  if (failureReason === 'Card expired') return 15;
  if (failureReason === 'Insufficient funds') return 25;

  let base = 60;
  switch (failureReason) {
    case 'Temporary bank decline': base = 90; break;
    case 'Network timeout': base = 85; break;
    case 'UPI timeout': base = 88; break;
    case 'Gateway error': base = 82; break;
    case 'Mandate failure': base = 45; break;
    case 'Subscription failure': base = 55; break;
    case 'Invoice overdue': base = 50; break;
    case 'Checkout abandonment': base = 35; break;
  }

  if (previousSuccessfulPayments > 5) base += 5;
  if (previousSuccessfulPayments > 10) base += 3;
  base -= retryCount * 15;
  if (amount >= 25000) base -= 20;
  if (amount >= 50000) base -= 10;

  return Math.max(5, Math.min(95, Math.round(base)));
}

export function computeRecommendedAction(
  failureReason: FailureReason,
  retryCount: number,
  amount: number,
  optedOut: boolean,
  overdueDays: number
): RecommendedAction {
  if (optedOut) return 'STOP';
  if (amount >= 25000) return 'ESCALATE';
  if (retryCount >= 2) return 'ESCALATE';

  switch (failureReason) {
    case 'Card expired':
      return 'REQUEST_PAYMENT_METHOD_UPDATE';
    case 'Insufficient funds':
      return 'SEND_REMINDER';
    case 'Invoice overdue':
      return overdueDays > 30 ? 'ESCALATE' : 'SEND_REMINDER';
    case 'Checkout abandonment':
      return 'SEND_REMINDER';
    case 'Mandate failure':
      return retryCount >= 1 ? 'REQUEST_PAYMENT_METHOD_UPDATE' : 'RETRY_PAYMENT';
    case 'Subscription failure':
      return retryCount >= 1 ? 'REQUEST_PAYMENT_METHOD_UPDATE' : 'RETRY_PAYMENT';
    case 'Temporary bank decline':
    case 'Network timeout':
    case 'UPI timeout':
    case 'Gateway error':
    default:
      return 'RETRY_PAYMENT';
  }
}
