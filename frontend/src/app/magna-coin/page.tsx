"use client";

import React, { useState, useEffect } from 'react';
import LeftPanel from '@/components/LeftPanel';
import TopNavigation from '@/components/TopNavigation';
import MobileDrawer from '@/components/MobileDrawer';
import MagnaCoinBalanceCard from '@/components/MagnaCoinBalanceCard';
import CoinPackageList from '@/components/CoinPackageList';
import PaymentMethodList from '@/components/PaymentMethodList';
import MagnaCoinBenefits from '@/components/MagnaCoinBenefits';
import TransactionHistory from '@/components/TransactionHistory';
import PurchaseButton from '@/components/PurchaseButton';
import Checkout from '@/components/Checkout';
import SendCoinsModal from '@/components/SendCoinsModal';
import CreateWalletModal from '@/components/CreateWalletModal';
import { coinPackages, paymentMethods, transactions } from './constants';
import { ArrowLeftRight, Plus, Send } from 'lucide-react';

interface Wallet {
  id: string;
  name: string;
  balance: number;
}

export default function MagnaCoinPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Magna Coin');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Wallet State
  const [wallets, setWallets] = useState<Wallet[]>([
    { id: 'main', name: 'Main Wallet', balance: 2500 }
  ]);
  const [selectedWalletId, setSelectedWalletId] = useState<string>('main');
  const maxCoins = 10000; // Example max for progress bar
  
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isCreateWalletModalOpen, setIsCreateWalletModalOpen] = useState(false);

  const handleSendCoins = async (amount: number, recipientId: string, note: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE;
      if (!apiUrl || !token) return;

      const payload = {
        amount,
        recipientId,
        note
      };

      const response = await fetch('https://magna-coders-backend-1.onrender.com/api/integrations/payments/wallet-transfer', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Transfer failed');
      }

      alert(`Successfully sent ${amount} MC to ${recipientId}`);
      
      // Update local wallet balance
      setWallets(prev => prev.map(w => {
        if (w.id === selectedWalletId) {
          return { ...w, balance: w.balance - amount };
        }
        return w;
      }));

    } catch (error: any) {
      console.error('Transfer error:', error);
      alert(error.message || 'Transfer failed');
    }
  };

  const handleCreateWallet = () => {
    setIsCreateWalletModalOpen(true);
  };

  const handleNewWallet = (name: string) => {
    const newWallet: Wallet = {
      id: `wallet-${Date.now()}`,
      name,
      balance: 0
    };
    setWallets([...wallets, newWallet]);
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
    window.dispatchEvent(new Event('themeChanged'));
  };

  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [exchangeMode, setExchangeMode] = useState<'coins' | 'ksh'>('coins');
  const [customAmount, setCustomAmount] = useState('');
  const [customSelection, setCustomSelection] = useState<{ coins: number; ksh: number } | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState(paymentMethods);
  const [transactionHistory, setTransactionHistory] = useState(transactions);
  const coinsPerKsh = 3;
  const minCoins = 150;
  const minKsh = 50;
  const parsedCustomAmount = Number(customAmount);
  const customCoins = Number.isFinite(parsedCustomAmount)
    ? (exchangeMode === 'coins' ? parsedCustomAmount : parsedCustomAmount * coinsPerKsh)
    : 0;
  const customKsh = Number.isFinite(parsedCustomAmount)
    ? (exchangeMode === 'ksh' ? parsedCustomAmount : parsedCustomAmount / coinsPerKsh)
    : 0;
  const meetsMinimum = customCoins >= minCoins && customKsh >= minKsh;

  const fetchWalletBalance = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE;
      if (!apiUrl || !token) return;

      const response = await fetch(`${apiUrl}/integrations/wallet/balance`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Assuming response structure: { balance: number } or { data: { balance: number } }
        const balance = typeof data.balance === 'number' ? data.balance : (data.data?.balance || 0);
        
        setWallets(prev => prev.map(w => {
          if (w.id === 'main') {
            return { ...w, balance };
          }
          return w;
        }));
      }
    } catch (error) {
      console.error('Failed to fetch wallet balance', error);
    }
  };

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE;
      if (!apiUrl || !token) return;

      const response = await fetch(`${apiUrl}/integrations/payments/history`, {
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const historyData = Array.isArray(data) ? data : (data.data || []);
        
        if (historyData.length > 0) {
          const mappedTransactions = historyData.map((item: any, index: number) => ({
            id: item.id || `txn-${index}`,
            type: item.type || (item.amount > 0 ? 'Recharge' : 'Spent'),
            amount: Math.abs(item.amount),
            date: item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Just now',
            status: item.status || 'Completed'
          }));
          setTransactionHistory(mappedTransactions);
        }
      }
    } catch (error) {
      console.error('Failed to fetch transaction history', error);
    }
  };

  useEffect(() => {
    fetchWalletBalance();
    fetchHistory();
  }, []);

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const apiUrl = process.env.NEXT_PUBLIC_API_BASE;
        if (!apiUrl || !token) return;

        const response = await fetch(`${apiUrl}/integrations/payments/methods`, {
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          const methods = Array.isArray(data) ? data : (data.data || []);
          if (methods.length > 0) {
             // Map backend payment methods to frontend format
             // Assuming backend returns { id, brand, last4, type }
             const mappedMethods = methods.map((m: any) => ({
               id: m.id,
               type: m.brand || m.type || 'Card',
               last4: m.last4 || '****',
               expiry: m.exp_month ? `${m.exp_month}/${m.exp_year}` : 'N/A',
               isDefault: m.is_default || false
             }));
             // Merge or replace mock data based on your requirement
             // For now, we'll just log it as the UI expects specific mock structure
             console.log('Fetched payment methods:', mappedMethods);
          }
        }
      } catch (error) {
        console.error('Failed to fetch payment methods', error);
      }
    };

    fetchPaymentMethods();
  }, []);

  return (
    <div className={`h-screen font-sans flex overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-black text-[#F9E4AD]' : 'bg-[#FDF8F5] text-[#444444]'}`}>
      
      <SendCoinsModal
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        onSend={handleSendCoins}
        isDarkMode={isDarkMode}
        balance={wallets.find(w => w.id === selectedWalletId)?.balance || 0}
        walletName={wallets.find(w => w.id === selectedWalletId)?.name || ''}
        wallets={wallets.filter(w => w.id !== selectedWalletId)}
      />

      <CreateWalletModal
        isOpen={isCreateWalletModalOpen}
        onClose={() => setIsCreateWalletModalOpen(false)}
        onCreate={handleNewWallet}
        isDarkMode={isDarkMode}
      />

      {isCheckoutOpen && (selectedPackage !== null || customSelection) && (
        <Checkout 
          amount={selectedPackage !== null ? (coinPackages.find(p => p.id === selectedPackage)?.price || 0) : (customSelection?.ksh || 0)}
          itemTitle={selectedPackage !== null ? `${coinPackages.find(p => p.id === selectedPackage)?.coins} Coins` : `${customSelection?.coins || 0} Coins`}
          itemDescription={selectedPackage !== null ? "Magna Coin Purchase" : "Custom Magna Coin Purchase"}
          onClose={() => setIsCheckoutOpen(false)}
          onSuccess={() => {
            setIsCheckoutOpen(false);
            fetchWalletBalance();
            fetchHistory();
          }}
          isDarkMode={isDarkMode}
        />
      )}

      {/* LEFT SIDEBAR */}
      <LeftPanel 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSidebarExpanded={isSidebarExpanded}
        setIsSidebarExpanded={setIsSidebarExpanded}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
      />

      {/* MAIN CONTENT */}
      <div className={`flex-1 flex flex-col h-full overflow-hidden relative md:ml-[88px] ${isSidebarExpanded ? 'lg:ml-[260px]' : 'lg:ml-[88px]'} transition-all duration-300`}>
        
        {/* TOP NAVIGATION BAR (Mobile Only) */}
        <div className="md:hidden">
          <TopNavigation 
            title="Magna Coin" 
            onMobileMenuOpen={() => setIsMobileMenuOpen(true)}
            isDarkMode={isDarkMode}
          />
        </div>

        {/* MOBILE DRAWER */}
        <MobileDrawer 
          isOpen={isMobileMenuOpen} 
          onClose={() => setIsMobileMenuOpen(false)} 
          isDarkMode={isDarkMode}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          toggleTheme={toggleTheme}
        />

        {/* SCROLLABLE CONTENT AREA */}
        <div className="flex-1 overflow-y-auto pt-[65px] md:pt-0">
          <div className="max-w-5xl mx-auto p-4 md:p-8">
            
            {/* HEADER */}
            <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className={`text-2xl md:text-3xl font-bold mb-2 ${isDarkMode ? 'text-[#F9E4AD]' : 'text-black'}`}>Magna Coin Wallet</h1>
                <p className={`text-sm md:text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Manage your coins and recharge your balance</p>
              </div>
              <button 
                onClick={handleCreateWallet}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                  isDarkMode 
                    ? 'bg-[#333] hover:bg-[#444] text-white' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                }`}
              >
                <Plus size={18} />
                Create Wallet
              </button>
            </div>

            {/* BALANCE CARDS */}
            <div className="space-y-6 mb-8">
              {wallets.map(wallet => (
                <MagnaCoinBalanceCard 
                  key={wallet.id}
                  balance={wallet.balance} 
                  maxCoins={maxCoins} 
                  isDarkMode={isDarkMode} 
                  walletName={wallet.name}
                  walletId={wallet.id}
                  onSendClick={() => {
                    setSelectedWalletId(wallet.id);
                    setIsSendModalOpen(true);
                  }}
                />
              ))}
            </div>

            {/* PURCHASE SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 pb-24 md:pb-0">
              
              {/* Packages */}
              <div className="lg:col-span-2">
                <CoinPackageList 
                  packages={coinPackages} 
                  selectedPackageId={selectedPackage} 
                  onSelect={(id) => {
                    setSelectedPackage(id);
                    setCustomSelection(null);
                  }} 
                  isDarkMode={isDarkMode} 
                />

                <div className={`mb-6 md:mb-8 rounded-2xl p-6 border ${isDarkMode ? 'bg-[#111] border-[#333]' : 'bg-white border-gray-100'}`}>
                  <div className={`text-lg md:text-xl font-bold mb-2 ${isDarkMode ? 'text-[#F9E4AD]' : 'text-black'}`}>Custom Calculator</div>
                  <div className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Minimum purchase is 150 Magna Coins (50 KES)
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-end">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {exchangeMode === 'coins' ? 'Magna Coins' : 'Amount (KES)'}
                      </label>
                      <input 
                        type="number"
                        min="1"
                        value={customAmount}
                        onChange={(e) => {
                          setCustomAmount(e.target.value);
                          setSelectedPackage(null);
                          setCustomSelection(null);
                        }}
                        placeholder={exchangeMode === 'coins' ? 'Enter coins' : 'Enter KES'}
                        className={`w-full p-3 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[#E50914] ${
                          isDarkMode 
                            ? 'bg-[#222] text-white placeholder-gray-600' 
                            : 'bg-gray-50 text-gray-900 placeholder-gray-400'
                        }`}
                      />
                    </div>
                    <div className="flex items-center justify-center">
                      <button
                        onClick={() => {
                          setExchangeMode((prev) => {
                            const nextMode = prev === 'coins' ? 'ksh' : 'coins';
                            if (customAmount) {
                              const currentValue = Number(customAmount);
                              if (Number.isFinite(currentValue)) {
                                const nextValue = prev === 'coins'
                                  ? currentValue / coinsPerKsh
                                  : currentValue * coinsPerKsh;
                                setCustomAmount(nextValue.toFixed(2));
                              }
                            }
                            return nextMode;
                          });
                          setCustomSelection(null);
                          setSelectedPackage(null);
                        }}
                        className={`h-10 w-10 rounded-full border transition-all ${
                          isDarkMode
                            ? 'border-[#333] bg-[#111] text-gray-400 hover:text-white hover:border-[#444]'
                            : 'border-gray-200 bg-white text-gray-500 hover:text-black'
                        }`}
                        title="Switch exchange direction"
                      >
                        <ArrowLeftRight size={16} className="mx-auto" />
                      </button>
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {exchangeMode === 'coins' ? 'Price (KES)' : 'Magna Coins'}
                      </label>
                      <div className={`w-full p-3 rounded-xl text-base font-bold ${
                        isDarkMode 
                          ? 'bg-[#222] text-[#F9E4AD]' 
                          : 'bg-gray-50 text-gray-900'
                      }`}>
                        {exchangeMode === 'coins' ? (customAmount ? customKsh.toFixed(2) : '0.00') : Math.floor(customCoins).toString()}
                      </div>
                    </div>
                  </div>
                  <div className={`mt-3 text-xs ${meetsMinimum ? (isDarkMode ? 'text-green-400' : 'text-green-600') : (isDarkMode ? 'text-gray-500' : 'text-gray-500')}`}>
                    {meetsMinimum ? 'Meets minimum purchase policy.' : 'Minimum is 150 coins (50 KES).'}
                  </div>
                  <button
                    onClick={() => {
                      if (!meetsMinimum) return;
                      setCustomSelection({ coins: Math.floor(customCoins), ksh: Number(customKsh.toFixed(2)) });
                      setSelectedPackage(null);
                    }}
                    disabled={!meetsMinimum}
                    className={`mt-4 w-full py-3 rounded-xl font-bold transition-all ${
                      meetsMinimum
                        ? 'bg-[#E50914] hover:bg-[#cc0812] text-white shadow-lg shadow-red-500/20'
                        : isDarkMode 
                          ? 'bg-[#222] text-gray-500' 
                          : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    Complete Purchase
                  </button>
                </div>

                {/* Payment Methods */}
                <PaymentMethodList 
                  methods={paymentMethods} 
                  selectedMethodId={selectedPayment} 
                  onSelect={setSelectedPayment} 
                  isDarkMode={isDarkMode} 
                />

                <div className="mt-8">
                  <PurchaseButton 
                    disabled={!selectedPayment || (!selectedPackage && !customSelection)}
                    isDarkMode={isDarkMode}
                    onClick={() => setIsCheckoutOpen(true)}
                  />
                </div>
              </div>

              {/* Info / History Sidebar */}
              <div className="space-y-6">
                {/* Benefits */}
                <MagnaCoinBenefits isDarkMode={isDarkMode} />

                {/* History */}
                <TransactionHistory transactions={transactionHistory} isDarkMode={isDarkMode} />
              </div>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
