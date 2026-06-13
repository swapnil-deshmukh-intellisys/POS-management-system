import React from 'react';
import { BusinessPageLayout, money, PageConfig } from './BusinessPageLayout';

const salesConfig: PageConfig = {
  title: 'Sales',
  primaryAction: 'New Sale',
  tabs: ['All Sales', 'Completed Sales', 'Returned Sales', 'Draft Sales'],
  metrics: [
    { label: 'Total Sales', value: money(142500.5), note: 'This month', color: 'blue' },
    { label: 'Total Orders', value: '1,256', note: 'This month', color: 'violet' },
    { label: 'Average Bill', value: money(113.46), note: 'Per invoice', color: 'emerald' },
    { label: 'Returns', value: money(2430.2), note: 'This month', color: 'rose' },
    { label: 'Pending Bills', value: '18', note: 'Need review', color: 'amber' },
  ],
  columns: [
    { key: 'invoice', label: 'Invoice No.' },
    { key: 'customer', label: 'Customer' },
    { key: 'date', label: 'Sale Date' },
    { key: 'items', label: 'Items', align: 'center' },
    { key: 'amount', label: 'Amount', align: 'right' },
    { key: 'status', label: 'Status', align: 'center' },
  ],
  rows: [
    ['INV-2025-00124', 'Walk-in Customer', 'May 20, 2025', '5', money(125.5), 'Completed'],
    ['INV-2025-00123', 'Sarah Johnson', 'May 20, 2025', '3', money(89), 'Completed'],
    ['INV-2025-00122', 'Michael Brown', 'May 19, 2025', '8', money(210.75), 'Completed'],
    ['INV-2025-00121', 'Walk-in Customer', 'May 19, 2025', '2', money(45), 'Pending'],
    ['INV-2025-00110', 'James Anderson', 'May 18, 2025', '1', money(15), 'Refunded'],
  ].map(([invoice, customer, date, items, amount, status]) => ({ invoice, customer, date, items, amount, status })),
  rightTitle: 'Sales Summary',
  rightItems: [
    { label: 'Completed Sales', value: money(118420), color: 'emerald' },
    { label: 'Pending Sales', value: money(10580), color: 'amber' },
    { label: 'Refunded Sales', value: money(2430), color: 'rose' },
  ],
  bottomTitle: 'Sales Trend',
};

export const Sales: React.FC = () => <BusinessPageLayout config={salesConfig} />;

export default Sales;
