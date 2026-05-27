import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Search, Wallet, PieChart, TrendingDown, 
  Trash2, Filter, Smartphone, Scan, Bell, MoreVertical,
  Coffee, ShoppingBag, GraduationCap, Utensils, Bus, Gamepad2,
  LogIn, LogOut, Users, Edit3
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart as RePieChart, Pie, Cell, Legend
} from 'recharts';
import { formatRupiah, cn } from '../lib/utils';
import { useAuth, handleFirestoreError, OperationType, triggerQuotaExceeded } from '../lib/auth';
import { db } from '../lib/firebase';
import { 
  collection, query, where, onSnapshot, addDoc, 
  deleteDoc, doc, setDoc, getDoc, serverTimestamp, orderBy, updateDoc 
} from 'firebase/firestore';

const CATEGORIES = [
  { name: 'Makan', icon: Utensils, color: '#10B981' },
  { name: 'Transport', icon: Bus, color: '#3B82F6' },
  { name: 'Hiburan', icon: Gamepad2, color: '#F59E0B' },
  { name: 'Belanja', icon: ShoppingBag, color: '#EC4899' },
  { name: 'Pendidikan', icon: GraduationCap, color: '#6366F1' },
  { name: 'Lainnya', icon: MoreVertical, color: '#94A3B8' },
];

export default function FinancialTracker() {
  const { user, login, loginAsGuest, logout, loading: authLoading } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [budget, setBudget] = useState(500000);
  const [mode, setMode] = useState<'standard' | 'budget'>('budget');
  const [isAdding, setIsAdding] = useState(false);
  const [isSettingBudget, setIsSettingBudget] = useState(false);
  const [formData, setFormData] = useState({ 
    amount: '', 
    category: 'Makan', 
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [editFormData, setEditFormData] = useState({
    amount: '',
    category: 'Makan',
    description: '',
    date: ''
  });
  const [search, setSearch] = useState('');
  const [confirmAction, setConfirmAction] = useState<{ 
    type: 'delete' | 'budget' | 'transaction' | 'edit_transaction', 
    id?: string, 
    data?: any,
    title: string,
    message: string,
    icon: any,
    confirmText: string,
    color: string
  } | null>(null);

  useEffect(() => {
    if (!user) return;

    // Local Storage keys
    const localTxKey = `ganci_txs_${user.uid}`;
    const localBudgetKey = `ganci_budget_${user.uid}`;

    // Pre-load from Local Storage for instant render and offline capability
    const initialLocalTxs = localStorage.getItem(localTxKey);
    if (initialLocalTxs) {
      try {
        setRecords(JSON.parse(initialLocalTxs));
      } catch (e) {
        console.warn(e);
      }
    }

    const initialLocalBudget = localStorage.getItem(localBudgetKey);
    if (initialLocalBudget) {
      try {
        setBudget(Number(initialLocalBudget));
      } catch (e) {
        console.warn(e);
      }
    }

    // Fetch Records
    const q = query(
      collection(db, 'transactions'), 
      where('userId', '==', user.uid),
      orderBy('date', 'desc')
    );
    
    const unsubscribeRecords = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecords(data);
      try {
        localStorage.setItem(localTxKey, JSON.stringify(data));
      } catch (e) {}
    }, (error) => {
      const errMessage = error instanceof Error ? error.message : String(error);
      const isQuotaError = errMessage.includes('Quota exceeded') || errMessage.includes('Quota limit exceeded') || errMessage.includes('quota');
      if (isQuotaError) {
        triggerQuotaExceeded();
        // Since we already pre-loaded from local storage, we just keep using it.
      } else {
        handleFirestoreError(error, OperationType.LIST, 'transactions');
      }
    });

    // Fetch Budget
    const unsubscribeBudget = onSnapshot(doc(db, 'userConfigs', user.uid), (doc) => {
      if (doc.exists()) {
        const amt = doc.data().budget;
        setBudget(amt);
        try {
          localStorage.setItem(localBudgetKey, String(amt));
        } catch (e) {}
      }
    }, (error) => {
      const errMessage = error instanceof Error ? error.message : String(error);
      const isQuotaError = errMessage.includes('Quota exceeded') || errMessage.includes('Quota limit exceeded') || errMessage.includes('quota');
      if (isQuotaError) {
        triggerQuotaExceeded();
      } else {
        handleFirestoreError(error, OperationType.GET, `userConfigs/${user.uid}`);
      }
    });

    return () => {
      unsubscribeRecords();
      unsubscribeBudget();
    };
  }, [user]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount) return;

    setConfirmAction({
      type: 'transaction',
      data: { ...formData },
      title: 'Simpan Transaksi',
      message: `Simpan pengeluaran sebesar ${formatRupiah(Number(formData.amount))} untuk kategori ${formData.category}?`,
      icon: ShoppingBag,
      confirmText: 'Simpan',
      color: 'bg-primary'
    });
  };

  const executeAdd = async () => {
    const data = confirmAction?.data;
    if (!data || !user) return;

    const localTxKey = `ganci_txs_${user.uid}`;
    
    const saveLocally = () => {
      const localData = localStorage.getItem(localTxKey);
      let list = [];
      if (localData) {
        try { list = JSON.parse(localData); } catch (e) {}
      }
      const newRecord = {
        id: 'local_tx_' + Date.now(),
        amount: Number(data.amount),
        category: data.category,
        description: data.description,
        date: new Date(data.date).toISOString(),
        userId: user.uid,
        createdAt: new Date().toISOString(),
        isLocal: true
      };
      const updated = [newRecord, ...list];
      localStorage.setItem(localTxKey, JSON.stringify(updated));
      setRecords(updated);
    };

    if (window.__firestoreQuotaExceeded) {
      saveLocally();
      setFormData({ 
        amount: '', 
        category: 'Makan', 
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
      setIsAdding(false);
      setConfirmAction(null);
      return;
    }

    try {
      await addDoc(collection(db, 'transactions'), {
        amount: Number(data.amount),
        category: data.category,
        description: data.description,
        date: new Date(data.date).toISOString(),
        userId: user.uid,
        createdAt: serverTimestamp()
      });
      
      setFormData({ 
        amount: '', 
        category: 'Makan', 
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
      setIsAdding(false);
      setConfirmAction(null);
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : String(error);
      const isQuotaError = errMessage.includes('Quota exceeded') || errMessage.includes('Quota limit exceeded') || errMessage.includes('quota');
      if (isQuotaError) {
        triggerQuotaExceeded();
        saveLocally();
        setFormData({ 
          amount: '', 
          category: 'Makan', 
          description: '',
          date: new Date().toISOString().split('T')[0]
        });
        setIsAdding(false);
        setConfirmAction(null);
      } else {
        handleFirestoreError(error, OperationType.CREATE, 'transactions');
      }
    }
  };

  const handleUpdateBudget = async (newAmount: number) => {
    setConfirmAction({
      type: 'budget',
      data: newAmount,
      title: 'Update Budget',
      message: `Ubah budget bulanan menjadi ${formatRupiah(newAmount)}?`,
      icon: Wallet,
      confirmText: 'Update',
      color: 'bg-secondary'
    });
  };

  const executeUpdateBudget = async () => {
    const newAmount = confirmAction?.data;
    if (newAmount === undefined || !user) return;

    const localBudgetKey = `ganci_budget_${user.uid}`;
    const saveLocally = () => {
      localStorage.setItem(localBudgetKey, String(newAmount));
      setBudget(newAmount);
    };

    if (window.__firestoreQuotaExceeded) {
      saveLocally();
      setConfirmAction(null);
      setIsSettingBudget(false);
      return;
    }

    try {
      await setDoc(doc(db, 'userConfigs', user.uid), {
        budget: newAmount,
        userId: user.uid
      });
      try { localStorage.setItem(localBudgetKey, String(newAmount)); } catch (e) {}
      setConfirmAction(null);
      setIsSettingBudget(false);
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : String(error);
      const isQuotaError = errMessage.includes('Quota exceeded') || errMessage.includes('Quota limit exceeded') || errMessage.includes('quota');
      if (isQuotaError) {
        triggerQuotaExceeded();
        saveLocally();
        setConfirmAction(null);
        setIsSettingBudget(false);
      } else {
        handleFirestoreError(error, OperationType.WRITE, `userConfigs/${user.uid}`);
      }
    }
  };

  const handleDelete = async (id: string) => {
    const record = records.find(r => r.id === id);
    setConfirmAction({
      type: 'delete',
      id,
      title: 'Hapus Transaksi',
      message: `Hapus catatan "${record?.description || record?.category}" senilai ${formatRupiah(record?.amount || 0)}?`,
      icon: Trash2,
      confirmText: 'Hapus',
      color: 'bg-rose-500'
    });
  };

  const handleStartEdit = (record: any) => {
    setEditingRecord(record);
    let formattedDate = '';
    try {
      formattedDate = new Date(record.date).toISOString().split('T')[0];
    } catch (e) {
      formattedDate = new Date().toISOString().split('T')[0];
    }
    setEditFormData({
      amount: record.amount.toString(),
      category: record.category,
      description: record.description || '',
      date: formattedDate
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData.amount || !editingRecord) return;

    setConfirmAction({
      type: 'edit_transaction',
      data: { ...editFormData },
      title: 'Simpan Perubahan',
      message: `Ubah catatan pengeluaran menjadi ${formatRupiah(Number(editFormData.amount))} untuk kategori ${editFormData.category}?`,
      icon: Edit3,
      confirmText: 'Simpan',
      color: 'bg-primary'
    });
  };

  const executeEdit = async () => {
    const data = confirmAction?.data;
    if (!data || !editingRecord || !user) return;

    const localTxKey = `ganci_txs_${user.uid}`;
    const saveLocally = () => {
      const localData = localStorage.getItem(localTxKey);
      let list = [];
      if (localData) {
        try { list = JSON.parse(localData); } catch (e) {}
      }
      const updated = list.map((r: any) => {
        if (r.id === editingRecord.id) {
          return {
            ...r,
            amount: Number(data.amount),
            category: data.category,
            description: data.description,
            date: new Date(data.date).toISOString()
          };
        }
        return r;
      });
      localStorage.setItem(localTxKey, JSON.stringify(updated));
      setRecords(updated);
    };

    if (window.__firestoreQuotaExceeded) {
      saveLocally();
      setEditingRecord(null);
      setConfirmAction(null);
      return;
    }

    try {
      await updateDoc(doc(db, 'transactions', editingRecord.id), {
        amount: Number(data.amount),
        category: data.category,
        description: data.description,
        date: new Date(data.date).toISOString()
      });
      
      setEditingRecord(null);
      setConfirmAction(null);
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : String(error);
      const isQuotaError = errMessage.includes('Quota exceeded') || errMessage.includes('Quota limit exceeded') || errMessage.includes('quota');
      if (isQuotaError) {
        triggerQuotaExceeded();
        saveLocally();
        setEditingRecord(null);
        setConfirmAction(null);
      } else {
        handleFirestoreError(error, OperationType.WRITE, `transactions/${editingRecord.id}`);
      }
    }
  };

  const executeDelete = async () => {
    if (!confirmAction?.id || !user) return;

    const localTxKey = `ganci_txs_${user.uid}`;
    const saveLocally = () => {
      const localData = localStorage.getItem(localTxKey);
      let list = [];
      if (localData) {
        try { list = JSON.parse(localData); } catch (e) {}
      }
      const updated = list.filter((r: any) => r.id !== confirmAction.id);
      localStorage.setItem(localTxKey, JSON.stringify(updated));
      setRecords(updated);
    };

    if (window.__firestoreQuotaExceeded) {
      saveLocally();
      setConfirmAction(null);
      return;
    }

    try {
      await deleteDoc(doc(db, 'transactions', confirmAction.id));
      setConfirmAction(null);
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : String(error);
      const isQuotaError = errMessage.includes('Quota exceeded') || errMessage.includes('Quota limit exceeded') || errMessage.includes('quota');
      if (isQuotaError) {
        triggerQuotaExceeded();
        saveLocally();
        setConfirmAction(null);
      } else {
        handleFirestoreError(error, OperationType.DELETE, `transactions/${confirmAction.id}`);
      }
    }
  };

  const handleConfirm = () => {
    if (confirmAction?.type === 'delete') executeDelete();
    else if (confirmAction?.type === 'budget') executeUpdateBudget();
    else if (confirmAction?.type === 'transaction') executeAdd();
    else if (confirmAction?.type === 'edit_transaction') executeEdit();
  };

  if (authLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-8">
        <div className="w-24 h-24 bg-primary/10 rounded-[40px] flex items-center justify-center border border-primary/20">
          <Smartphone className="w-10 h-10 text-primary" />
        </div>
        <div className="space-y-3 max-w-lg">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-slate-900 dark:text-white tracking-tight">AKSES FINANCIAL TRACKER</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto">Silakan pilih metode login untuk mulai mencatat dan mengelola keuangan Anda di platform FinTag.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center max-w-md">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={login}
            className="flex-1 px-8 py-5 bg-slate-900 dark:bg-primary text-white rounded-3xl font-bold flex items-center justify-center gap-3 shadow-xl hover:shadow-primary/25 cursor-pointer transition-all"
          >
            <LogIn className="w-5 h-5 flex-shrink-0" />
            Login Google
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={loginAsGuest}
            className="flex-1 px-8 py-5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 rounded-3xl font-bold flex items-center justify-center gap-3 shadow-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-all"
          >
            <Users className="w-5 h-5 flex-shrink-0" />
            Lanjutkan sebagai Tamu
          </motion.button>
        </div>

        {/* Informative Explanation Panel */}
        <div className="max-w-2xl w-full grid grid-cols-1 sm:grid-cols-2 gap-5 text-left pt-6 border-t border-slate-200/50 dark:border-white/5">
          <div className="p-5 rounded-3xl border border-slate-200/60 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
              <div className="w-2.5 h-2.5 rounded-full bg-primary" />
              Akun Google (Rekomendasi)
            </div>
            <ul className="text-[11px] text-slate-500 dark:text-slate-400 space-y-2 list-disc list-inside leading-relaxed">
              <li>Data disimpan <strong>selamanya di cloud</strong>.</li>
              <li>Akses catatan transaksi kapan saja, dari HP atau laptop mana saja.</li>
              <li>Sesi aman & tidak terpengaruh jika cache browser dibersihkan.</li>
            </ul>
          </div>

          <div className="p-5 rounded-3xl border border-slate-200/60 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wider">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              Mode Akun Tamu (Guest)
            </div>
            <ul className="text-[11px] text-slate-500 dark:text-slate-400 space-y-2 list-disc list-inside leading-relaxed">
              <li>Akses cepat instan <strong>tanpa registrasi</strong> akun.</li>
              <li>Data disimpan sementara pada sesi anonim perangkat.</li>
              <li><span className="text-rose-500 font-medium">⚠️ Berisiko terhapus</span> jika tab ditutup permanen atau cache browser dibersihkan.</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  const totalSpent = records.reduce((sum, r) => sum + r.amount, 0);
  
  const pieData = CATEGORIES.map(cat => ({
    name: cat.name,
    value: records.filter(r => r.category === cat.name).reduce((sum, r) => sum + r.amount, 0)
  })).filter(d => d.value > 0);

  const filteredRecords = records
    .filter(r => (r.description || '').toLowerCase().includes(search.toLowerCase()) || r.category.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Group by date
  const groupedRecords = filteredRecords.reduce((groups: any, record) => {
    const date = new Date(record.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
    if (!groups[date]) groups[date] = [];
    groups[date].push(record);
    return groups;
  }, {});

  return (
    <div className="space-y-8 pb-12">
      {/* Alert Banner for Guest mode with Switch Options */}
      {user.isAnonymous && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Mode Tamu Aktif (Guest Mode)</p>
              <p className="text-xs text-amber-700/80 dark:text-amber-400/80">Catatan transaksi disimpan sementara. Hubungkan akun Google agar data Anda abadi di cloud!</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full md:w-auto px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-2xl uppercase tracking-widest flex items-center justify-center gap-2 shadow-md transition-all shrink-0 cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            Keluar & Gunakan Google
          </button>
        </motion.div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-4">
          <div>
            <h1 className="text-4xl font-heading font-bold text-slate-900 dark:text-white tracking-tight uppercase">FinTag</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">FINTAG // {mode === 'budget' ? 'BUDGET CONTROL' : 'MANUAL TRACKING'} // PRECISION</p>
          </div>
          
          {/* Mode Selector */}
          <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-white/5 transition-colors">
            <button 
              onClick={() => setMode('standard')}
              className={cn(
                "px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                mode === 'standard' ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
              )}
            >
              Standard
            </button>
            <button 
              onClick={() => setMode('budget')}
              className={cn(
                "px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                mode === 'budget' ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
              )}
            >
              Budget
            </button>
          </div>
        </div>
        
        <div className="flex flex-wrap md:flex-nowrap gap-3 w-full md:w-auto items-center">
          {/* Verified Google User Profile Badge at Top Right */}
          {!user.isAnonymous && (
            <div className="hidden md:flex items-center gap-2.5 px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-3xl">
              <div className="w-6 h-6 rounded-full bg-primary/25 text-primary flex items-center justify-center font-bold text-[10px] uppercase shrink-0">
                {user.email ? user.email.substring(0, 2) : 'A'}
              </div>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 max-w-[130px] truncate" title={user.email || ''}>
                {user.email}
              </span>
              <button 
                onClick={logout} 
                className="p-1 hover:text-rose-500 text-slate-400 dark:text-slate-500 transition-colors cursor-pointer"
                title="Keluar"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* LogOut button for Google user on mobile */}
          {!user.isAnonymous && (
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={logout}
              className="md:hidden flex-1 px-4 py-4 rounded-3xl font-bold flex items-center justify-center gap-2 border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs uppercase tracking-widest transition-all"
            >
              <LogOut className="w-4 h-4 text-rose-500" />
              Keluar
            </motion.button>
          )}

          {mode === 'budget' && (
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsSettingBudget(true)}
              className="flex-1 md:flex-none px-6 py-4 rounded-3xl font-bold flex items-center justify-center gap-3 border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
            >
              <Wallet className="w-5 h-5" />
              <span className="text-xs uppercase tracking-widest text-nowrap">Set Budget</span>
            </motion.button>
          )}
          
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsAdding(true)}
            className="flex-1 md:flex-none px-8 py-4 rounded-3xl font-bold flex items-center justify-center gap-3 shadow-xl transition-all overflow-hidden border border-white dark:border-white/10 bg-primary text-white"
          >
            <Plus className="w-5 h-5" />
            <span className="text-xs uppercase tracking-widest text-nowrap">Catat</span>
          </motion.button>
        </div>
      </div>


      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard 
          label="Total Pengeluaran" 
          value={formatRupiah(totalSpent)} 
          icon={TrendingDown} 
          trend="Bulan ini"
          variant="default"
        />
        
        {mode === 'budget' ? (
          <>
            <StatCard 
              label="Sisa Budget" 
              value={formatRupiah(budget - totalSpent)} 
              icon={Wallet} 
              trend={((budget - totalSpent) / budget) * 100 < 20 ? "Hampir habis!" : "Masih Aman"}
              variant={(budget - totalSpent) / budget * 100 < 20 ? "warning" : "primary"}
            />
            <StatCard 
              label="Total Transaksi" 
              value={records.length.toString()} 
              icon={PieChart} 
              trend={`${records.filter(r => new Date(r.date).toDateString() === new Date().toDateString()).length} hari ini`}
              variant="default"
            />
            <div className="bento-card flex flex-col justify-center items-center text-center bg-slate-900 dark:bg-slate-800 text-white border-transparent shadow-lg shadow-slate-900/10">
              <GraduationCap className="w-6 h-6 text-primary mb-2" />
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">Target Nabung</p>
              <p className="text-base font-bold text-white">{formatRupiah(budget * 0.2)}</p>
              <div className="mt-2 text-[8px] font-bold uppercase tracking-widest text-primary">Target 20% Budget</div>
            </div>
          </>
        ) : (
          <>
            <StatCard 
              label="Hari Ini" 
              value={formatRupiah(records.filter(r => new Date(r.date).toDateString() === new Date().toDateString()).reduce((sum, r) => sum + r.amount, 0))} 
              icon={Bell} 
              trend="Fokus hari ini"
              variant="primary"
            />
            <StatCard 
              label="Total Transaksi" 
              value={records.length.toString()} 
              icon={PieChart} 
              trend="Semua catatan"
              variant="default"
            />
            <StatCard 
              label="Rata-rata" 
              value={formatRupiah(records.length > 0 ? totalSpent / records.length : 0)} 
              icon={TrendingDown} 
              trend="Per transaksi"
              variant="default"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Charts Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-12 xl:col-span-7 bento-card space-y-8"
        >
          <div className="flex justify-between items-center">
             <div className="space-y-1">
               <h3 className="font-heading font-bold text-xl dark:text-white">Analisa Kategori</h3>
               <p className="text-xs text-slate-500 dark:text-slate-400">Distribusi pengeluaran berdasarkan kategori</p>
             </div>
            <PieChart className="w-5 h-5 text-slate-400 dark:text-slate-500" />
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={pieData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORIES.find(c => c.name === entry.name)?.color || '#94A3B8'} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '24px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', 
                    padding: '16px',
                    backgroundColor: 'var(--color-background-val)',
                    color: 'white'
                  }}
                  itemStyle={{ color: 'white' }}
                  formatter={(val: number) => [formatRupiah(val), 'Jumlah']}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', color: 'currentColor' }} />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Transactions Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-12 xl:col-span-5 bento-card flex flex-col h-[600px]"
        >
          <div className="flex justify-between items-center mb-6">
            <div className="space-y-1">
              <h3 className="font-heading font-bold text-xl dark:text-white">Riwayat Transaksi</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{filteredRecords.length} Transaksi terdeteksi</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cari..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 w-32 md:w-40 transition-all dark:text-white"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
            {Object.keys(groupedRecords).length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 gap-4 opacity-40">
                <Bell className="w-12 h-12" />
                <p className="text-xs font-bold uppercase tracking-widest">Belum ada transaksi</p>
              </div>
            ) : (
              Object.entries(groupedRecords).map(([date, items]: [string, any]) => (
                <div key={date} className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-50 dark:bg-slate-800/50 py-1 px-3 rounded-full inline-block">{date}</h4>
                  <div className="space-y-3">
                    {items.map((record: any) => {
                      const cat = CATEGORIES.find(c => c.name === record.category);
                      const Icon = cat?.icon || MoreVertical;
                      return (
                        <motion.div 
                          layout
                          key={record.id}
                          className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-white/5 hover:shadow-sm transition-all group"
                        >
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-slate-100 dark:border-white/10 shadow-sm" style={{ backgroundColor: `${cat?.color}15` }}>
                            <Icon className="w-5 h-5" style={{ color: cat?.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate tracking-tight">{record.description || record.category}</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-bold">
                              {record.category}
                            </p>
                          </div>
                          <div className="text-right flex flex-col items-end shrink-0">
                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{formatRupiah(record.amount)}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartEdit(record);
                                }}
                                className="opacity-100 md:opacity-0 md:group-hover:opacity-100 p-1 text-slate-400 hover:text-purple-500 dark:hover:text-purple-400 transition-all translate-y-0 md:translate-y-1 md:group-hover:translate-y-0 cursor-pointer flex items-center justify-center"
                                title="Edit Transaksi"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(record.id);
                                }}
                                className="opacity-100 md:opacity-0 md:group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-all translate-y-0 md:translate-y-1 md:group-hover:translate-y-0 cursor-pointer flex items-center justify-center"
                                title="Hapus Transaksi"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}

          </div>
        </motion.div>
      </div>

      {/* Modal Add Transaksi */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md glass p-8 rounded-3xl border border-white dark:border-white/10 shadow-2xl bg-white dark:bg-slate-900"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white">Catat Pengeluaran</h2>
                <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                  <Plus className="w-6 h-6 rotate-45 dark:text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleAdd} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Nominal (Rp)</label>
                  <input 
                    type="number" 
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="Contoh: 15000"
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 text-2xl font-bold focus:ring-2 focus:ring-primary/20 transition-all dark:text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Tanggal</label>
                  <input 
                    type="date" 
                    required
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all dark:text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Kategori</label>
                  <div className="grid grid-cols-3 gap-2">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.name}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, category: cat.name }))}
                        className={cn(
                          "flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all text-[10px] font-bold uppercase",
                          formData.category === cat.name 
                            ? "bg-slate-900 dark:bg-primary text-white border-slate-900 dark:border-primary shadow-lg shadow-slate-900/20" 
                            : "bg-white dark:bg-slate-800 border-slate-100 dark:border-white/5 text-slate-500 dark:text-slate-400 hover:border-primary/40"
                        )}
                      >
                        <cat.icon className="w-5 h-5" />
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Deskripsi</label>
                  <input 
                    type="text" 
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Keterangan pengeluaran..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all dark:text-white"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Simpan Transaksi
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Edit Transaksi */}
      <AnimatePresence>
        {editingRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/10 dark:bg-transparent backdrop-blur-subtle">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingRecord(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md glass p-8 rounded-3xl border border-white dark:border-white/10 shadow-2xl bg-white dark:bg-slate-900 z-10"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white">Edit Catatan Pengeluaran</h2>
                <button onClick={() => setEditingRecord(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                  <Plus className="w-6 h-6 rotate-45 dark:text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-left block">Nominal (Rp)</label>
                  <input 
                    type="number" 
                    required
                    value={editFormData.amount}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="Contoh: 15000"
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 text-2xl font-bold focus:ring-2 focus:ring-primary/20 transition-all dark:text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-left block">Tanggal</label>
                  <input 
                    type="date" 
                    required
                    value={editFormData.date}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all dark:text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-left block">Kategori</label>
                  <div className="grid grid-cols-3 gap-2">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.name}
                        type="button"
                        onClick={() => setEditFormData(prev => ({ ...prev, category: cat.name }))}
                        className={cn(
                          "flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all text-[10px] font-bold uppercase cursor-pointer",
                          editFormData.category === cat.name 
                            ? "bg-slate-900 dark:bg-primary text-white border-slate-900 dark:border-primary shadow-lg shadow-slate-900/20" 
                            : "bg-white dark:bg-slate-800 border-slate-100 dark:border-white/5 text-slate-500 dark:text-slate-400 hover:border-primary/40"
                        )}
                      >
                        <cat.icon className="w-5 h-5" />
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-left block">Deskripsi</label>
                  <input 
                    type="text" 
                    value={editFormData.description}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Keterangan pengeluaran..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all dark:text-white"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Set Budget */}
      <AnimatePresence>
        {isSettingBudget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingBudget(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm glass p-8 rounded-3xl border border-white dark:border-white/10 shadow-2xl bg-white dark:bg-slate-900"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white">Set Budget Bulanan</h2>
                <button onClick={() => setIsSettingBudget(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                  <Plus className="w-6 h-6 rotate-45 dark:text-slate-400" />
                </button>
              </div>

              <div className="space-y-6">
                 <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-2">Nominal Budget (Rp)</label>
                    <input 
                      id="budget-input"
                      type="number" 
                      autoFocus
                      defaultValue={budget}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 text-2xl font-bold focus:ring-2 focus:ring-primary/20 transition-all dark:text-white"
                    />
                  </div>
                  <button 
                    onClick={() => {
                      const input = document.getElementById('budget-input') as HTMLInputElement;
                      if (input) handleUpdateBudget(Number(input.value));
                    }}
                    className="w-full bg-secondary dark:bg-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-secondary/20 dark:shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    Simpan Budget
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reusable Confirmation Modal */}
      <AnimatePresence>
        {confirmAction && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 text-center">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setConfirmAction(null)} 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }} 
              className="relative w-full max-w-sm glass p-8 rounded-[40px] border border-white dark:border-white/10 shadow-2xl bg-white dark:bg-slate-900 space-y-6"
            >
              <div className={cn(
                "w-20 h-20 rounded-3xl flex items-center justify-center mx-auto border transition-all",
                confirmAction.type === 'delete' ? "bg-rose-50 dark:bg-rose-900/30 border-rose-100 dark:border-rose-900/20 text-rose-500" : 
                confirmAction.type === 'budget' ? "bg-secondary/10 dark:bg-primary/20 border-secondary/20 dark:border-primary/20 text-secondary dark:text-primary" :
                "bg-primary/10 dark:bg-primary/20 border-primary/20 dark:border-primary/20 text-primary"
              )}>
                <confirmAction.icon className="w-10 h-10" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-heading font-bold text-slate-900 dark:text-white">{confirmAction.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">{confirmAction.message}</p>
              </div>

              <div className="flex gap-4 pt-2">
                <button 
                  onClick={() => setConfirmAction(null)} 
                  className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={handleConfirm} 
                  className={cn(
                    "flex-1 py-4 rounded-2xl font-bold shadow-xl transition-all",
                    confirmAction.color === 'bg-secondary' ? "text-white dark:text-slate-950" : "text-white",
                    confirmAction.color,
                    "hover:scale-[1.02] active:scale-[0.98]"
                  )}
                >
                  {confirmAction.confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, trend, variant }: any) {
  const isPrimary = variant === 'primary';
  const isWarning = variant === 'warning';

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className={cn(
        "bento-card flex flex-col justify-between h-40 transition-colors",
        isPrimary 
          ? "bg-primary text-white border-primary/20 shadow-lg shadow-primary/10" 
          : isWarning 
            ? "bg-rose-50 dark:bg-rose-900/30 border-rose-100 dark:border-rose-900/20 text-rose-600 dark:text-rose-400" 
            : "text-slate-900 dark:text-white"
      )}
    >
      <div className="flex justify-between items-start">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", isPrimary ? "bg-white/10 border-white/10" : "bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-white/10 shadow-sm")}>
          <Icon className={cn("w-5 h-5", isPrimary ? "text-white" : "text-slate-400 dark:text-slate-300")} />
        </div>
        <span className={cn("text-[10px] font-bold uppercase tracking-[0.1em]", isPrimary ? "text-white/80" : isWarning ? "text-rose-600 dark:text-rose-400" : "text-slate-400 dark:text-slate-300")}>{trend}</span>
      </div>
      <div>
        <p className={cn("text-[10px] font-bold uppercase tracking-widest mb-1", isPrimary ? "text-white/70" : "text-slate-400 dark:text-slate-500")}>{label}</p>
        <p className="text-2xl font-heading font-bold truncate tracking-tight">{value}</p>
      </div>
    </motion.div>
  );
}

