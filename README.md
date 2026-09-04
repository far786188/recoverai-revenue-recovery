# RecoverAI — AI Revenue Recovery Agent

RecoverAI is an AI-powered revenue recovery agent that identifies revenue at risk, diagnoses payment failures, and recommends the most appropriate recovery action.

## What RecoverAI Does

RecoverAI helps businesses recover revenue that may be lost because of failed or at-risk payments.

The system:

- Detects revenue at risk
- Diagnoses payment failure reasons
- Estimates recovery probability
- Recommends the best recovery action
- Applies retry limits and stopping rules
- Escalates high-value cases for human review
- Tracks recovered revenue
- Maintains an audit trail of AI decisions

## Recovery Workflow

**Detect → Diagnose → Estimate → Decide → Recover → Stop/Escalate → Measure → Audit**

## Key Features

### Revenue Dashboard
Shows:
- Total Revenue at Risk
- Recovered Revenue
- Recovery Rate
- Transactions Processed

### AI Recovery Queue
Each transaction includes:
- Customer
- Amount
- Failure reason
- Risk level
- Recovery probability
- Recommended action

### Recovery Actions
RecoverAI can recommend:
- Retry Payment
- Send Reminder
- Request Payment Method Update
- Escalate to Human Review
- Stop Further Automated Attempts

### Guardrails
The system includes:
- Maximum automatic retries: 2
- High-value transaction threshold: ₹25,000
- Human escalation
- Customer opt-out handling
- Stopping rules
- Complete audit logging

## Demo Results

The prototype processes **100 synthetic transactions**.

- Revenue at Risk: **₹25.25 lakh**
- Simulated Recovered Revenue: **₹1.32 lakh**
- Simulated Recovery Rate: **5.2%**

> These are synthetic/demo transactions. No real customer payments are processed.

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Lucide Icons

## Hackathon Track

**Track 03 — AI Revenue Recovery**

RecoverAI demonstrates an end-to-end workflow for finding revenue at risk, deciding the appropriate intervention, executing bounded recovery actions, and measuring the outcome.

## Disclaimer

RecoverAI is a hackathon prototype. The payment recovery actions and results shown in the application are simulated using synthetic data. No real payments are processed.
