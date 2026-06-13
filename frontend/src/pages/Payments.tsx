import React from 'react';
import { BusinessPageLayout, money, PageConfig } from './BusinessPageLayout';

const paymentsConfig: PageConfig = {
  title: 'Payments',
  primaryAction: 'Record Payment',
  tabs: ['All Payments', 'Received', 'Refunds', 'Pending'],
  metrics: [
    { label: 'Total Collections', value: money(85430.5), note: '+18.6% vs last month', color: 'violet' },
    { label: 'Cash Received', value: money(32450.2), note: '38.0% of total', color: 'emerald' },
    { label: 'UPI Received', value: money(24150.3), note: '28.3% of total', color: 'violet' },
    { label: 'Card Received', value: money(20340), note: '23.9% of total', color: 'blue' },
    { label: 'Refunds', value: money(2430.2), note: 'This month', color: 'rose' },
  ],
  columns: [
    { key: 'transaction', label: 'Transaction ID' },
    { key: 'invoice', label: 'Invoice No.' },
    { key: 'customer', label: 'Customer' },
    { key: 'amount', label: 'Amount', align: 'right' },
    { key: 'method', label: 'Method', align: 'center' },
    { key: 'status', label: 'Status', align: 'center' },
  ],
  rows: [
    ['PAY-2025-00124', 'INV-2025-00124', 'Walk-in Customer', money(125.5), 'Cash', 'Completed'],
    ['PAY-2025-00123', 'INV-2025-00123', 'Sarah Johnson', money(89), 'UPI', 'Completed'],
    ['PAY-2025-00122', 'INV-2025-00122', 'Michael Brown', money(210.75), 'Card', 'Completed'],
    ['REF-2025-00015', 'INV-2025-00110', 'James Anderson', money(15), 'Refund', 'Refunded'],
    ['PAY-2025-00117', 'INV-2025-00116', 'Walk-in Customer', money(299.9), 'Card', 'Pending'],
  ].map(([transaction, invoice, customer, amount, method, status]) => ({ transaction, invoice, customer, amount, method, status })),
  rightTitle: 'Payment Details',
  rightItems: [
    { label: 'Transaction ID', value: 'PAY-2025-00124', color: 'blue' },
    { label: 'Payment Method', value: 'Cash', color: 'emerald' },
    { label: 'Received By', value: 'John Doe', color: 'violet' },
    { label: 'Total Amount', value: money(125.5), color: 'amber' },
  ],
  bottomTitle: 'Daily Collections',
};

export const Payments: React.FC = () => <BusinessPageLayout config={paymentsConfig} />;

export default Payments;
