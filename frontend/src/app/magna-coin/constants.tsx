import React from 'react';
import { CreditCard } from 'lucide-react';
import { CoinPackage } from '@/components/CoinPackageList';
import { PaymentMethod } from '@/components/PaymentMethodList';
import { Transaction } from '@/components/TransactionHistory';

export const coinPackages: CoinPackage[] = [
  {
    id: 1,
    coins: 150,
    price: 50,
    bonus: 0,
    popular: false
  },
  {
    id: 2,
    coins: 450,
    price: 135,
    bonus: 45,
    popular: true
  }
];

export const paymentMethods: PaymentMethod[] = [
  { id: 'mpesa', name: 'M-Pesa', icon: 'M' }, // Placeholder for M-Pesa icon
  { id: 'paypal', name: 'PayPal', icon: 'P' }, // Placeholder for PayPal icon
  { id: 'card', name: 'Credit/Debit Card', icon: <CreditCard size={24} /> }
];

export const transactions: Transaction[] = [
  { type: 'Purchase', amount: '+500', date: 'Today, 10:30 AM', color: 'text-green-500' },
  { type: 'Job Apply', amount: '-50', date: 'Yesterday, 2:15 PM', color: 'text-red-500' },
  { type: 'AI Usage', amount: '-10', date: '2 days ago', color: 'text-red-500' }
];
