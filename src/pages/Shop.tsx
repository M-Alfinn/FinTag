import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, Star, Camera, Check, ArrowRight, Zap, 
  Image as ImageIcon, Sparkles, Heart, FileText, 
  Music, Calendar, Plus, Minus, PhoneCall, Layers, Eye
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatRupiah, cn } from '../lib/utils';
import { useAuth, handleFirestoreError, OperationType, triggerQuotaExceeded } from '../lib/auth';
import { db } from '../lib/firebase';
import { 
  collection, query, onSnapshot, addDoc, 
  serverTimestamp 
} from 'firebase/firestore';

// Fallback catalog products in case the database is empty initially.
// These are loaded dynamically from Admin Dashboard 'products' collection.
// CARA MENGGUNAKAN GAMBAR ANDA SENDIRI:
// 1. Buat folder bernama 'products' di dalam folder 'public' (maka jalurnya menjadi '/public/products/')
// 2. Unggah gambar Anda ke folder tersebut (misal: 'ganci1.jpg')
// 3. Ubah nilai properti 'image' di bawah menjadi '/products/ganci1.jpg'
export const DEFAULT_PRODUCTS = [
  {
    id: 'fintag-standard-1',
    name: 'Luffy',
    price: 15000,
    image: '/public/products/Biasa/6.jpeg',
    description: 'Gantungan kunci NFC premium berbahan akrilik transparan tebal dengan desain minimalis. Tahan benturan, tahan air, dan dilengkapi chip NFC original NTAG213 untuk pencatatan transaksi super instan.'
  },
  {
    id: 'fintag-standard-2',
    name: 'Chainsaw Man (Don`t Want No)',
    price: 15000,
    image: '/public/products/Biasa/5.png',
    description: 'Kemewahan minimalis bertekstur doff anti sidik jari dengan warna hitam solid premium yang sangat maskulin dan elegan.'
  },
  {
    id: 'fintag-standard-3',
    name: 'Siluet Pasangan',
    price: 15000,
    image: '/public/products/Biasa/8.jpeg',
    description: 'Memadukan keindahan tekstur serat kayu alami di bagian dalam akrilik hybrid tebal, menampilkan kesan vintage tangguh.'
  },
  {
    id: 'fintag-standard-4',
    name: 'Well don`t you sit on front of me',
    price: 15000,
    image: '/public/products/Biasa/9.jpeg',
    description: 'Edisi terbatas bertema laut dalam yang menenangkan. Menggunakan gradien semi-transparan biru laut artistik.'
  },
  {
    id: 'fintag-standard-5',
    name: 'But You Here',
    price: 15000,
    image: '/public/products/Biasa/3.jpeg',
    description: 'Gaya modern dengan pinggiran fluorosens neon cerah yang menyala redup saat ditempat gelap.'
  },
  {
    id: 'fintag-standard-6',
    name: 'But i could never ask you for help',
    price: 15000,
    image: '/public/products/Biasa/4.jpeg',
    description: 'Tampilan indah terinspirasi dari bunga sakura segar bergaya pastel lembut berestetika tinggi.'
  },
  {
    id: 'fintag-standard-7',
    name: 'Chainsaw Man (Komik)',
    price: 15000,
    image: '/public/products/Biasa/1.jpeg',
    description: 'Sentuhan kulit sintetis berkualitas premium dijahit rapi melingkari akrilik tebal yang berisi chip NFC original.'
  },
  {
    id: 'fintag-standard-8',
    name: 'If we do our...',
    price: 15000,
    image: '/public/products/Biasa/7.jpeg',
    description: 'Warna gradien langit malam aurora indah yang berkilau lembut saat tertimpa cahaya matahari.'
  },
  {
    id: 'fintag-standard-9',
    name: 'Wait for me',
    price: 15000,
    image: '/public/products/Biasa/10.jpg',
    description: 'Warna merah menyala berani dengan kontras aksen hitam solid yang tangguh untuk aktivitas outdoor.'
  },
  {
    id: 'fintag-standard-10',
    name: 'Ku aman ada bersama mu',
    price: 15000,
    image: '/public/products/Biasa/2.jpeg',
    description: 'Sentuhan mewah bertabur serpihan foil emas sintetis berkilau di dalam bingkai akrilik berkepadatan tinggi.'
  }
];

// EXACTLY 3 Custom Formal Example presets for demonstration
// Cara mengganti gambar pas foto Anda: unggah gambar ke '/public/products/' lalu ubah jalurnya di sini.
export const FORMAL_EXAMPLES = [
  {
    id: 'formal-mhs',
    name: 'Contoh 1',
    desc: 'Contoh custom formal',
    image: '/public/products/Custom Biasa/1.jpg'
  },
  {
    id: 'formal-portrait',
    name: 'Contoh 2',
    desc: 'Contoh custom formal.',
    image: '/public/products/Custom Biasa/2.jpg'
  },
  {
    id: 'formal-idcard',
    name: 'Contoh 3',
    desc: 'Contoh custom formal.',
    image: '/public/products/Custom Biasa/3.jpg'
  },
  {
    id: 'formal-tia',
    name: 'Contoh 4',
    desc: 'Contoh custom formal.',
    image: '/public/products/Custom Biasa/4.jpg'
  }
];

// EXACTLY 10 Custom Template Example presets for demonstration
// Tambahkan, kurangi, atau edit item di sini untuk menyesuaikan dengan katalog template Anda.
export const TEMPLATE_EXAMPLES = [
  {
    id: 'tpl-spotify',
    name: 'Template 1',
    desc: 'Contoh custom template',
    image: '/public/products/Custom Template/template1.jpg'
  },
  {
    id: 'tpl-polaroid',
    name: 'Template 2',
    desc: 'Contoh custom template.',
    image: '/public/products/Custom Template/template2.jpg'
  },
  {
    id: 'tpl-calendar',
    name: 'Template 3',
    desc: 'Contoh custom template.',
    image: '/public/products/Custom Template/template3.jpg'
  },
  {
    id: 'tpl-cyberpunk',
    name: 'Template 4',
    desc: 'Contoh custom template.',
    image: '/public/products/Custom Template/template4.jpg'
  },
  {
    id: 'tpl-ticket',
    name: 'Template 5',
    desc: 'Contoh custom template.',
    image: '/public/products/Custom Template/template5.jpg'
  },
  {
    id: 'tpl-chibi',
    name: 'Template 6',
    desc: 'Contoh custom template.',
    image: '/public/products/Custom Template/template6.jpg'
  },
  {
    id: 'tpl-comic',
    name: 'Template 7',
    desc: 'Contoh custom template.',
    image: '/public/products/Custom Template/template7.jpg'
  },
  {
    id: 'tpl-instagram',
    name: 'Template 8',
    desc: 'Contoh custom template.',
    image: '/public/products/Custom Template/template8.jpg'
  },
  {
    id: 'tpl-zodiac',
    name: 'Template 9',
    desc: 'Contoh custom template.',
    image: '/public/products/Custom Template/template9.jpg'
  },
  {
    id: 'tpl-memphis',
    name: 'Template 10',
    desc: 'Contoh custom template.',
    image: '/public/products/Custom Template/template10.jpg'
  },
  {
    id: 'tpl-memii',
    name: 'Template 11',
    desc: 'Contoh custom template.',
    image: '/public/products/Custom Template/template11.jpg'
  }
];

// Normalisasi path gambar untuk Vite/Vercel (misal jika db berisi "/public/products/ganci1.jpg" atau "public/products/ganci1.jpg")
export function normalizeImagePath(path: string | undefined): string {
  if (!path) return '';
  if (path.startsWith('data:')) return path; // Base64
  if (path.startsWith('http://') || path.startsWith('https://')) return path; // Web URL
  
  let clean = path;
  if (clean.startsWith('/public/')) {
    clean = clean.substring(7);
  } else if (clean.startsWith('public/')) {
    clean = '/' + clean.substring(7);
  }
  
  if (!clean.startsWith('/')) {
    clean = '/' + clean;
  }
  return clean;
}

export default function Shop() {
  const { user, loginAsGuest } = useAuth();
  const [dbProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Interactive Shop Selection States
  const [activeProductIdx, setActiveProductIdx] = useState(0);
  const [selectedMode, setSelectedMode] = useState<'standard' | 'custom'>('standard');
  const [customType, setCustomType] = useState<'formal' | 'template'>('formal');
  const [selectedFormalIdx, setSelectedFormalIdx] = useState(0);
  const [selectedTemplateIdx, setSelectedTemplateIdx] = useState(0);
  
  // Form checkout fields
  const [form, setForm] = useState({
    name: '',
    whatsapp: '',
    notes: '',
    quantity: 1
  });

  const [isConfirming, setIsConfirming] = useState(false);

  // No real-time listener for products from Firestore to avoid rapid quota exhaustion.
  // Catalog can be populated manually in VS Code as requested.
  useEffect(() => {
    // Instant catalog loading
    setLoading(false);
  }, []);

  // Compute products - bound to fetched products or fallback elements
  const products = dbProducts.length > 0 
    ? dbProducts.filter(p => !p.type || p.type === 'standard') 
    : DEFAULT_PRODUCTS;
  
  const customProducts = dbProducts.length > 0
    ? dbProducts.filter(p => p.type === 'custom')
    : [];

  const activeFormals = customProducts.filter(p => p.subtype === 'formal').length > 0
    ? [...customProducts.filter(p => p.subtype === 'formal')].sort((a, b) => a.name.localeCompare(b.name))
    : FORMAL_EXAMPLES;

  const activeTemplates = customProducts.filter(p => p.subtype === 'template').length > 0
    ? [...customProducts.filter(p => p.subtype === 'template')].sort((a, b) => {
        const numA = parseInt(a.name.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.name.replace(/\D/g, '')) || 0;
        return numA - numB;
      })
    : TEMPLATE_EXAMPLES;

  const activeProduct = products[activeProductIdx] || DEFAULT_PRODUCTS[0];
  
  const activeFormalProduct = activeFormals[selectedFormalIdx] || activeFormals[0];
  const activeTemplateProduct = activeTemplates[selectedTemplateIdx] || activeTemplates[0];

  // Customization cost: Rp 2.000 customized fee is added when Custom Mode is chosen.
  const basePrice = selectedMode === 'custom' 
    ? (customType === 'formal' ? Number(activeFormalProduct?.price || 15000) : Number(activeTemplateProduct?.price || 15500)) 
    : Number(activeProduct.price || 0);
  const customCost = selectedMode === 'custom' ? 0 : 0;
  const unitPrice = basePrice + customCost;
  const totalPrice = unitPrice * form.quantity;

  // Determine which image to show inside the Live Acrylic Mockup
  const getMockupDisplayImage = () => {
    if (selectedMode === 'standard') {
      return normalizeImagePath(activeProduct?.image);
    } else {
      if (customType === 'formal') {
        return normalizeImagePath(activeFormalProduct?.image || '');
      } else {
        return normalizeImagePath(activeTemplateProduct?.image || '');
      }
    }
  };

  const [imgAspect, setImgAspect] = useState<number>(0.8);
  const [selectedShape, setSelectedShape] = useState<'persegi' | 'panjang' | 'oktagonal'>('panjang');
  const displayImage = getMockupDisplayImage();

  useEffect(() => {
    if (!displayImage) return;
    const img = new Image();
    img.src = displayImage;
    img.onload = () => {
      if (img.width && img.height) {
        const aspect = img.width / img.height;
        setImgAspect(aspect);
        if (aspect >= 0.9 && aspect <= 1.1) {
          setSelectedShape('persegi');
        } else {
          setSelectedShape(prev => prev === 'persegi' ? 'panjang' : prev);
        }
      }
    };
  }, [displayImage]);

  const getMockupDimensions = (aspect: number) => {
    const maxW = 210;
    const maxH = 250;
    
    let width = maxW;
    let height = width / aspect;
    
    if (height > maxH) {
      height = maxH;
      width = height * aspect;
    }
    
    return {
      width: `${Math.round(width)}px`,
      height: `${Math.round(height)}px`
    };
  };

  const getCustomNotesText = () => {
    if (selectedMode === 'standard') {
      return 'Tipe: Ganci Standar (Sesuai Gambar Utama)';
    }
    if (customType === 'formal') {
      return `Tipe: Ganci Custom Formal (Pas Foto Pilihan ke-${selectedFormalIdx + 1})`;
    }
    return `Tipe: Ganci Custom Template (Template Pilihan ke-${selectedTemplateIdx + 1})`;
  };

  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsConfirming(true);
  };

  const executeOrderCheckOut = async () => {
    let currentUserId = user?.uid;
    try {
      if (!currentUserId) {
        await loginAsGuest();
      }
    } catch (err) {
      console.warn("Guest auth failed, attempting to write directly:", err);
    }

    try {
      const customNotesDescription = getCustomNotesText();
      const productPriceInfo = `Harga Satuan: ${formatRupiah(unitPrice)} (Harga Produk: ${formatRupiah(basePrice)} + Tambahan Custom: ${formatRupiah(customCost)})`;

      let bentukGanciText = '';
      if (selectedShape === 'persegi') {
        bentukGanciText = 'Persegi (Square)';
      } else if (selectedShape === 'panjang') {
        bentukGanciText = 'Persegi Panjang (Rectangle)';
      } else if (selectedShape === 'oktagonal') {
        bentukGanciText = 'Persegi Delapan Panjang (Oktagonal)';
      }

      const orderPayload = {
        productId: selectedMode === 'standard' ? (activeProduct.id || 'fintag-standard') : 'fintag-custom',
        productName: selectedMode === 'standard' ? activeProduct.name : 'Ganci Custom',
        totalPrice: totalPrice,
        userId: user?.uid || 'guest-session',
        status: 'pending',
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        name: form.name || 'Pelanggan Anonim',
        whatsapp: form.whatsapp || 'Tidak Diisi',
        notes: `Rincian Desain -> ${customNotesDescription}. Bentuk Akrilik: ${bentukGanciText}. ${productPriceInfo}. Catatan Pemesan: ${form.notes || 'Tidak ada catatan tambahan'}`,
        quantity: form.quantity || 1,
        unitPrice: unitPrice,
        selectedShape: selectedShape,
        bentukGanci: bentukGanciText,
        productType: selectedMode === 'standard' ? 'Standard' : 'Custom',
        customType: selectedMode === 'standard' ? '-' : (customType === 'formal' ? `Pas Foto Formal (Contoh ${selectedFormalIdx + 1})` : `Template (Template ${selectedTemplateIdx + 1})`),
        designDetails: customNotesDescription,
        userNotes: form.notes || 'Tidak ada catatan tambahan'
      };

      // Save order to local storage history as well for instant access/fallback
      try {
        const localOrdersKey = `ganci_orders_${user?.uid || 'guest'}`;
        const localOrders = localStorage.getItem(localOrdersKey);
        let orderList = [];
        if (localOrders) {
          orderList = JSON.parse(localOrders);
        }
        orderList.unshift({ id: 'local_' + Date.now(), ...orderPayload });
        localStorage.setItem(localOrdersKey, JSON.stringify(orderList));
      } catch (e) {
        console.warn("Could not save order history locally:", e);
      }

      if (!window.__firestoreQuotaExceeded) {
        try {
          await addDoc(collection(db, 'orders'), {
            ...orderPayload,
            createdAt: serverTimestamp() // Use Firestore serverTimestamp
          });
        } catch (dbErr) {
          const errMessage = dbErr instanceof Error ? dbErr.message : String(dbErr);
          const isQuota = errMessage.includes('Quota exceeded') || errMessage.includes('Quota limit exceeded') || errMessage.includes('quota');
          if (isQuota) {
            triggerQuotaExceeded();
          } else {
            console.error("Non-quota DB order insert failed:", dbErr);
          }
        }
      }

      const helpClean = (str: string) => {
        return str
          .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '')
          .replace(/[\u2600-\u27BF]/g, '')
          .replace(/[^\x00-\x7F]/g, (char) => char.charCodeAt(0) > 255 ? '' : char)
          .trim();
      };

      const orderTitle = `*ORDER GANCI ${selectedMode === 'standard' ? 'STANDAR' : 'CUSTOM'} FINTAG*`;

      let message = `Halo Admin FinTag!\n\n` +
                    `${orderTitle}\n\n` +
                    `RINCIAN PRODUK:\n`;

      if (selectedMode === 'standard') {
        message += `- Nama Ganci: ${helpClean(activeProduct.name)}\n` +
                   `- Tipe Desain: Ganci Standar (Gambar Utama)\n`;
      } else {
        message += `- Tipe Desain: Ganci Custom\n`;
        if (customType === 'formal') {
          message += `- Jenis Custom: Custom Pas Foto Formal (Biasa)\n` +
                     `- Pilihan Contoh: Contoh ke-${selectedFormalIdx + 1}\n`;
        } else {
          message += `- Jenis Custom: Custom Template\n` +
                     `- Pilihan Template: Template ke-${selectedTemplateIdx + 1}\n`;
        }
      }

      message += `- Bentuk Akrilik: ${bentukGanciText}\n` +
                 `- Jumlah Pesanan: ${form.quantity} pcs\n` +
                 `- Harga Satuan: ${formatRupiah(unitPrice)}\n` +
                 `- Total Pembayaran: ${formatRupiah(totalPrice)}\n\n` +
                 `DATA PENERIMA:\n` +
                 `- Nama Pembeli: ${form.name}\n` +
                 `- WhatsApp: ${form.whatsapp}\n` +
                 `- Catatan Kustom: ${form.notes || '-'}\n\n` +
                 `Saya sudah siap mengirimkan berkas foto saya langsung lewat chat WA ini. Silakan diproses ya Admin! Terima kasih.`;

      const targetAdminNumber = "6289693727197";
      const waLink = `https://wa.me/${targetAdminNumber}?text=${encodeURIComponent(message)}`;
      
      setIsConfirming(false);
      confetti();
      window.open(waLink, '_blank');
    } catch (error) {
      console.error(error);
      const errMessage = error instanceof Error ? error.message : String(error);
      const isQuotaError = errMessage.includes('Quota exceeded') || errMessage.includes('Quota limit exceeded') || errMessage.includes('quota');
      if (isQuotaError) {
        triggerQuotaExceeded();
        // Since it's quota, still give the customer their WaLink!
        const targetAdminNumber = "6289693727197";
        // Re-construct basic message if failed early
        const waLink = `https://wa.me/${targetAdminNumber}?text=${encodeURIComponent(`Halo Admin! Saya ingin memesan gantungan kunci custom/standar dari website FinTag.`)}`;
        setIsConfirming(false);
        confetti();
        window.open(waLink, '_blank');
      } else {
        handleFirestoreError(error, OperationType.CREATE, 'orders');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-widest">Sinkronisasi Katalog Admin...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-1">
      {/* 2 Opsi Utama: Ganci Standar & Ganci Custom (Compact Side-by-Side Toggle) */}
      <div className="max-w-xl mx-auto text-center px-1">
        <div className="grid grid-cols-2 gap-2">
          {/* Mode A: Ganci Standar */}
          <button
            type="button"
            onClick={() => setSelectedMode('standard')}
            className={cn(
              "p-3.5 rounded-xl text-center border cursor-pointer outline-none transition-all flex flex-col items-center justify-center gap-1 hover:scale-[1.01] active:scale-[0.99] w-full",
              selectedMode === 'standard'
                ? "bg-slate-950 text-white border-slate-950 dark:bg-slate-900 dark:border-emerald-500 ring-2 ring-emerald-500/10 shadow-sm"
                : "bg-white dark:bg-slate-900/50 border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-400"
            )}
          >
            <ImageIcon className={cn("w-4.5 h-4.5", selectedMode === 'standard' ? "text-emerald-400" : "text-slate-400")} />
            <span className={cn("text-xs font-black uppercase tracking-wide", selectedMode === 'standard' ? "text-white" : "text-slate-900 dark:text-slate-100")}>
              Ganci Random
            </span>
          </button>

          {/* Mode B: Ganci Custom */}
          <button
            type="button"
            onClick={() => setSelectedMode('custom')}
            className={cn(
              "p-3.5 rounded-xl text-center border cursor-pointer outline-none transition-all flex flex-col items-center justify-center gap-1 hover:scale-[1.01] active:scale-[0.99] w-full",
              selectedMode === 'custom'
                ? "bg-slate-950 text-white border-slate-950 dark:bg-slate-900 dark:border-purple-500 ring-2 ring-purple-500/10 shadow-sm"
                : "bg-white dark:bg-slate-900/50 border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-400"
            )}
          >
            <Camera className={cn("w-4.5 h-4.5", selectedMode === 'custom' ? "text-purple-400" : "text-slate-400")} />
            <span className={cn("text-xs font-black uppercase tracking-wide", selectedMode === 'custom' ? "text-white" : "text-slate-900 dark:text-slate-100")}>
              Ganci Custom
            </span>
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: Compact Mockup & Pricing */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
          {/* Keychain Mockup Body Wrapper */}
          <div className="flex flex-col items-center justify-center pt-8 pb-5 px-4 bg-gradient-to-b from-slate-50 to-slate-100/30 dark:from-slate-950/15 dark:to-slate-900/10 rounded-3xl border border-slate-150 dark:border-white/5 relative shadow-inner overflow-visible min-h-[290px]">
            {/* Top key ring metal hanger */}
            <div className="w-5 h-5 border-[4px] border-slate-300 dark:border-slate-700 rounded-full shadow-md z-10 bg-slate-50 dark:bg-slate-900 -mt-2 animate-bounce duration-1000" />
            <div className="w-1.5 h-4 bg-gradient-to-b from-slate-300 to-slate-400 dark:from-slate-700 dark:to-slate-800 rounded z-10 -mt-1 mb-1 shadow-sm" />

            {/* Acrylic Keychain Body */}
            {(() => {
              const isOctagonal = selectedShape === 'oktagonal';
              const isSquare = selectedShape === 'persegi';
              const isRectangle = selectedShape === 'panjang';
              const octagonalClip = 'polygon(15% 0%, 85% 0%, 100% 12%, 100% 88%, 85% 100%, 15% 100%, 0% 88%, 0% 12%)';

              const cardContent = (
                <motion.div 
                  key={`${selectedMode}-${customType}-${selectedFormalIdx}-${selectedTemplateIdx}-${activeProductIdx}-${selectedShape}`}
                  initial={{ scale: 0.95, rotate: -1, y: 3 }}
                  animate={{ scale: 1, rotate: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  className={cn(
                    "inline-block relative select-none transition-all duration-300",
                    isOctagonal 
                      ? "bg-white/90 dark:bg-slate-900/95 p-2" 
                      : "bg-white/90 dark:bg-slate-900/95 p-2 border-2 border-slate-300/80 dark:border-white/15",
                    isSquare ? "rounded-[32px]" : isRectangle ? "rounded-[20px]" : "rounded-none"
                  )}
                  style={{
                    ...getMockupDimensions(imgAspect),
                    boxShadow: isOctagonal ? 'none' : '0 15px 35px -10px rgba(0,0,0,0.15), inset 0 0 10px rgba(255,255,255,0.3)',
                    clipPath: isOctagonal ? octagonalClip : 'none',
                  }}
                >
                  {/* Top tiny punch hole inner hole */}
                  <div className="absolute top-1.5 right-1/2 translate-x-1/2 w-3 h-3 rounded-full border border-black/15 dark:border-white/10 bg-slate-50 dark:bg-slate-950 z-30 shadow-inner" />
                  
                  {isOctagonal && (
                    <svg 
                      className="absolute inset-[0.5px] w-[calc(100%-1px)] h-[calc(100%-1px)] pointer-events-none z-30 text-slate-300/80 dark:text-white/15 transition-colors duration-300" 
                      viewBox="0 0 1000 1000" 
                      preserveAspectRatio="none"
                    >
                      <polygon 
                        points="152,4 848,4 996,122 996,878 848,996 152,996 4,878 4,122" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2"
                        vectorEffect="non-scaling-stroke"
                        className="transition-colors duration-300"
                      />
                    </svg>
                  )}
                  
                  {/* Bevel/Print Wrapper */}
                  <div
                    className={cn(
                      "w-full h-full relative transition-all duration-300 overflow-hidden bg-white dark:bg-slate-950 flex flex-col justify-center items-center transform-gpu isolate",
                      "border border-slate-100 dark:border-white/5",
                      isSquare ? "rounded-[24px]" : isRectangle ? "rounded-[14px]" : "rounded-none"
                    )}
                    style={{
                      clipPath: isOctagonal ? octagonalClip : 'none'
                    }}
                  >
                    {/* 3D Glass shine reflections */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none z-20" />

                    {/* Backup scaled image to fill nicely */}
                    <img 
                      src={displayImage} 
                      className="absolute inset-0 w-full h-full object-cover blur-md opacity-35 scale-110 pointer-events-none transition-all duration-300" 
                      alt=""
                      referrerPolicy="no-referrer"
                    />

                    {/* Precise crisp unblurred master image */}
                    <img 
                      src={displayImage} 
                      className="relative z-10 max-w-full max-h-full object-contain transition-all duration-300 pointer-events-none select-none" 
                      style={{ imageRendering: 'high-quality' }}
                      alt="Acrylic Ganci Mockup"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </motion.div>
              );

              if (isOctagonal) {
                return (
                  <div 
                    style={{
                      filter: 'drop-shadow(0 15px 32px rgba(0,0,0,0.12))'
                    }}
                    className="inline-block relative"
                  >
                    {cardContent}
                  </div>
                );
              }

              return cardContent;
            })()}

            {/* Drop shadow of the ganci */}
            <div className="w-20 h-2 bg-slate-300 dark:bg-slate-950/70 rounded-full blur-md opacity-35 mt-4 transition-all shadow-sm" />

            {/* Shape selection pills overlay inside the keyholder box */}
            {selectedShape !== 'persegi' && (
              <div className="mt-4 flex items-center gap-4 bg-white/75 dark:bg-slate-950/60 px-4 py-1.5 rounded-full border border-slate-200/40 dark:border-white/5 shadow-sm backdrop-blur-md z-10 select-none">
                <button
                  type="button"
                  onClick={() => setSelectedShape('panjang')}
                  className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 transition-all select-none hover:text-purple-600 focus:outline-none cursor-pointer"
                >
                  <span className={cn(
                    "w-3 h-3 rounded-full border flex items-center justify-center transition-all",
                    selectedShape === 'panjang' 
                      ? "border-purple-500 bg-purple-500" 
                      : "border-slate-300 dark:border-slate-700 bg-transparent"
                  )}>
                    {selectedShape === 'panjang' && <span className="w-1 h-1 rounded-full bg-white" />}
                  </span>
                  <span>Persegi Panjang</span>
                </button>
                <div className="w-px h-3.5 bg-slate-200 dark:bg-slate-800" />
                <button
                  type="button"
                  onClick={() => setSelectedShape('oktagonal')}
                  className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 transition-all select-none hover:text-purple-600 focus:outline-none cursor-pointer"
                >
                  <span className={cn(
                    "w-3 h-3 rounded-full border flex items-center justify-center transition-all",
                    selectedShape === 'oktagonal' 
                      ? "border-purple-500 bg-purple-500" 
                      : "border-slate-300 dark:border-slate-700 bg-transparent"
                  )}>
                    {selectedShape === 'oktagonal' && <span className="w-1 h-1 rounded-full bg-white" />}
                  </span>
                  <span>Oktagonal</span>
                </button>
              </div>
            )}
          </div>

          {/* Pricing Summary */}
          <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-white/5 p-4 rounded-2xl space-y-2 text-xs">
            <h4 className="font-bold dark:text-white uppercase tracking-wider flex items-center gap-1.5 pl-1">
              <Zap className="w-3.5 h-3.5 text-emerald-500" />
              TOTAL BIAYA GANCI
            </h4>
            <div className="space-y-1 pl-1">
              <div className="flex justify-between font-medium">
                <span>Harga Ganci {selectedMode === 'custom' ? '(Custom)' : `(${activeProduct.name})`}:</span>
                <span className="font-bold text-slate-900 dark:text-white">{formatRupiah(basePrice)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Instan Layanan {selectedMode === 'standard' ? '(Bebas Biaya)' : '(Custom Jasa)'}:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {selectedMode === 'custom' ? `+ ${formatRupiah(0)}` : formatRupiah(0)}
                </span>
              </div>
              <div className="flex justify-between border-t border-dashed border-slate-200 dark:border-white/10 pt-1 text-xs font-black">
                <span className="text-slate-800 dark:text-slate-300">Biaya per pcs:</span>
                <span className="text-emerald-500">{formatRupiah(unitPrice)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Selection & Input form */}
        <div className="lg:col-span-7 space-y-4">
          <form onSubmit={handleOrderSubmit} className="space-y-4">
            
            {/* OPSI DINAMIS SECTIONS */}
            <AnimatePresence mode="wait">
              {selectedMode === 'standard' ? (
                <motion.div
                  key="standard-catalog"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3 text-left"
                >
                  <label className="text-xs font-extrabold text-emerald-500 uppercase tracking-wider block">
                     PILIH KATALOG GANCI RANDOM
                  </label>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {products.map((p, i) => (
                      <button
                        key={p.id || i}
                        type="button"
                        onClick={() => setActiveProductIdx(i)}
                        className={cn(
                          "group rounded-2xl border cursor-pointer outline-none transition-all flex flex-col hover:scale-[1.02] active:scale-[0.98] w-full text-left overflow-hidden shadow-sm",
                          activeProductIdx === i
                            ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-slate-50/50 dark:bg-emerald-500/5"
                            : "bg-white dark:bg-slate-900/30 border-slate-150 dark:border-white/5"
                        )}
                      >
                        <div className="aspect-[3/4] w-full bg-slate-100 dark:bg-slate-950 flex items-center justify-center relative overflow-hidden transition-colors shrink-0">
                          <img 
                            src={normalizeImagePath(p.image)} 
                            className="absolute inset-0 w-full h-full object-cover blur-sm opacity-25 scale-110 pointer-events-none" 
                            referrerPolicy="no-referrer" 
                            alt="" 
                          />
                          <img 
                            src={normalizeImagePath(p.image)} 
                            className="relative z-10 max-w-full max-h-full object-contain pointer-events-none select-none transition-all duration-300" 
                            style={{ imageRendering: 'high-quality' }} 
                            referrerPolicy="no-referrer" 
                            alt={p.name} 
                          />
                          {activeProductIdx === i && (
                            <div className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-md z-20">
                              <Check className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                        <div className="p-2.5 flex-1 flex flex-col justify-between bg-white dark:bg-slate-900/50 border-t border-slate-100 dark:border-white/5">
                          <span className={cn(
                            "text-xs font-black block leading-tight break-words line-clamp-2 min-h-[2rem]",
                            activeProductIdx === i ? "text-emerald-500" : "text-slate-950 dark:text-slate-200"
                          )}>
                            {p.name}
                          </span>
                          <span className="text-[10px] tracking-wide block font-extrabold text-slate-500 dark:text-slate-400 leading-none mt-1.5">
                            {formatRupiah(p.price || 15000)}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="custom-catalog"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4 text-left"
                >
                  <div className="space-y-2">
                    <label className="text-xs font-black text-purple-500 uppercase tracking-wider block text-center">
                       PILIH MODEL KUSTOMISASI
                    </label>

                    <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto">
                      <button
                        type="button"
                        onClick={() => setCustomType('formal')}
                        className={cn(
                          "p-2 rounded-xl border text-center cursor-pointer outline-none transition-all flex items-center justify-center gap-1.5 hover:scale-[1.01] active:scale-[0.99] w-full",
                          customType === 'formal'
                            ? "bg-purple-50 dark:bg-purple-950/25 border-purple-500 ring-2 ring-purple-500/10 shadow-sm text-slate-900 dark:text-white font-extrabold"
                            : "bg-white dark:bg-slate-900/50 border-slate-100 dark:border-white/5 text-slate-600 dark:text-slate-400"
                        )}
                      >
                        <FileText className={cn("w-3.5 h-3.5", customType === 'formal' ? "text-purple-500" : "text-slate-400")} />
                        <span className="text-xs uppercase tracking-wide px-1">Formal</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCustomType('template')}
                        className={cn(
                          "p-2 rounded-xl border text-center cursor-pointer outline-none transition-all flex items-center justify-center gap-1.5 hover:scale-[1.01] active:scale-[0.99] w-full",
                          customType === 'template'
                            ? "bg-purple-50 dark:bg-purple-950/25 border-purple-500 ring-2 ring-purple-500/10 shadow-sm text-slate-900 dark:text-white font-extrabold"
                            : "bg-white dark:bg-slate-900/50 border-slate-100 dark:border-white/5 text-slate-600 dark:text-slate-400"
                        )}
                      >
                        <Layers className={cn("w-3.5 h-3.5", customType === 'template' ? "text-purple-500" : "text-slate-400")} />
                        <span className="text-xs uppercase tracking-wide px-1">Template</span>
                      </button>
                    </div>
                  </div>

                  {customType === 'formal' ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {activeFormals.map((item, idx) => (
                          <button
                            key={item.id || idx}
                            type="button"
                            onClick={() => setSelectedFormalIdx(idx)}
                            className={cn(
                              "group rounded-2xl border cursor-pointer outline-none transition-all flex flex-col hover:scale-[1.02] active:scale-[0.98] w-full text-left overflow-hidden shadow-sm",
                              selectedFormalIdx === idx
                                ? "border-purple-500 ring-2 ring-purple-500/20 bg-slate-50/50 dark:bg-purple-500/5"
                                : "bg-white dark:bg-slate-900/30 border-slate-150 dark:border-white/5"
                            )}
                          >
                            <div className="aspect-[3/4] w-full bg-slate-100 dark:bg-slate-950 flex items-center justify-center relative overflow-hidden transition-colors shrink-0">
                              <img src={normalizeImagePath(item.image)} className="absolute inset-0 w-full h-full object-cover blur-sm opacity-25 scale-110 pointer-events-none" referrerPolicy="no-referrer" alt="" />
                              <img src={normalizeImagePath(item.image)} className="relative z-10 max-w-full max-h-full object-contain pointer-events-none select-none transition-all duration-300" style={{ imageRendering: 'high-quality' }} referrerPolicy="no-referrer" alt={item.name} />
                              {selectedFormalIdx === idx && (
                                <div className="absolute top-2 right-2 w-5 h-5 bg-purple-500 text-white rounded-full flex items-center justify-center shadow-md z-20">
                                  <Check className="w-3 h-3" />
                                </div>
                              )}
                            </div>
                            <div className="p-2.5 flex-1 flex flex-col justify-between bg-white dark:bg-slate-900/50 border-t border-slate-100 dark:border-white/5">
                              <span className={cn(
                                "text-xs font-black block leading-tight break-words line-clamp-2 min-h-[2rem]",
                                selectedFormalIdx === idx ? "text-purple-500" : "text-slate-950 dark:text-slate-200"
                              )}>
                                {item.name || `Desain Formal ${idx + 1}`}
                              </span>
                              <span className="text-[10px] tracking-wide block font-extrabold text-slate-500 dark:text-slate-400 leading-none mt-1.5">
                                {formatRupiah(item.price || 15000)}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                        {activeTemplates.map((item, idx) => (
                          <button
                            key={item.id || idx}
                            type="button"
                            onClick={() => setSelectedTemplateIdx(idx)}
                            className={cn(
                              "group rounded-2xl border cursor-pointer outline-none transition-all flex flex-col hover:scale-[1.02] active:scale-[0.98] w-full text-left overflow-hidden shadow-sm",
                              selectedTemplateIdx === idx
                                ? "border-purple-500 ring-2 ring-purple-500/20 bg-slate-50/50 dark:bg-purple-500/5"
                                : "bg-white dark:bg-slate-900/30 border-slate-150 dark:border-white/5"
                            )}
                          >
                            <div className="aspect-[3/4] w-full bg-slate-100 dark:bg-slate-950 flex items-center justify-center relative overflow-hidden transition-colors shrink-0">
                              <img src={normalizeImagePath(item.image)} className="absolute inset-0 w-full h-full object-cover blur-sm opacity-25 scale-110 pointer-events-none" referrerPolicy="no-referrer" alt="" />
                              <img src={normalizeImagePath(item.image)} className="relative z-10 max-w-full max-h-full object-contain pointer-events-none select-none transition-all duration-300" style={{ imageRendering: 'high-quality' }} referrerPolicy="no-referrer" alt={item.name} />
                              <div className="absolute top-2 left-2 bg-emerald-500/95 text-[9px] font-black text-white px-1.5 py-0.5 rounded-full shadow-sm z-20">
                                #{idx + 1}
                              </div>
                              {selectedTemplateIdx === idx && (
                                <div className="absolute top-2 right-2 w-5 h-5 bg-purple-500 text-white rounded-full flex items-center justify-center shadow-md z-20">
                                  <Check className="w-3 h-3" />
                                </div>
                              )}
                            </div>
                            <div className="p-2.5 flex-1 flex flex-col justify-between bg-white dark:bg-slate-900/50 border-t border-slate-100 dark:border-white/5">
                              <span className={cn(
                                "text-xs font-black block leading-tight break-words line-clamp-2 min-h-[2rem]",
                                selectedTemplateIdx === idx ? "text-purple-500" : "text-slate-950 dark:text-slate-200"
                              )}>
                                {item.name || `Template ${idx + 1}`}
                              </span>
                              <span className="text-[10px] tracking-wide block font-extrabold text-slate-500 dark:text-slate-400 leading-none mt-1.5">
                                {formatRupiah(item.price || 15000)}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form Fields Section */}
            <div className="bg-white dark:bg-slate-900/30 rounded-2xl border border-slate-150/50 dark:border-white/5 p-4 space-y-3 text-left">
              <div className="border-b border-slate-150/60 dark:border-white/5 pb-2">
                <h3 className="font-heading font-black text-xs uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                  <PhoneCall className="w-3.5 h-3.5 text-emerald-500" />
                  FORMULIR PEMESANAN WHATSAPP
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-0.5">
                  <label className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">Nama Penerima</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="Nama Penerima..."
                    value={form.name} 
                    onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} 
                    className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-150/60 dark:border-white/5 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 outline-none transition-all dark:text-white font-semibold" 
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">Nomor WA</label>
                  <input 
                    required 
                    type="tel" 
                    placeholder="Contoh: 0812xxxxx"
                    value={form.whatsapp} 
                    onChange={e => setForm(prev => ({ ...prev, whatsapp: e.target.value }))} 
                    className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-150/60 dark:border-white/5 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-500 outline-none transition-all dark:text-white font-mono font-bold" 
                  />
                </div>
              </div>

              <div className="space-y-0.5">
                <label className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">Catatan Tambahan (Opsional)</label>
                <textarea 
                  value={form.notes} 
                  onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))} 
                  placeholder="Contoh: Request nama kustom..." 
                  className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-150/60 dark:border-white/5 rounded-xl px-3 py-2 text-xs min-h-[50px] outline-none focus:ring-1 focus:ring-emerald-500 transition-all resize-none dark:text-white" 
                />
              </div>

              {/* Quantity Changer */}
              <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950/30 px-3 py-2 rounded-xl border border-slate-100 dark:border-white/5">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Jumlah Pesanan</p>

                <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-white/5 shadow-sm">
                  <button 
                    type="button" 
                    onClick={() => setForm(prev => ({ ...prev, quantity: Math.max(1, prev.quantity - 1) }))} 
                    className="w-6 h-6 flex items-center justify-center bg-slate-50 dark:bg-slate-700/60 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-200 cursor-pointer outline-none transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-black text-xs w-5 text-center dark:text-white leading-none">{form.quantity}</span>
                  <button 
                    type="button" 
                    onClick={() => setForm(prev => ({ ...prev, quantity: prev.quantity + 1 }))} 
                    className="w-6 h-6 flex items-center justify-center bg-slate-50 dark:bg-slate-700/60 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-200 cursor-pointer outline-none transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Action Block */}
            <div className="flex items-center justify-between p-2 pl-4 bg-slate-900 dark:bg-slate-950 text-white rounded-2xl border border-white/5 shadow-lg relative">
              <div className="text-left font-sans">
                <div className="flex items-baseline gap-1 leading-none">
                  <p className="text-lg font-heading font-black text-emerald-400">{formatRupiah(totalPrice)}</p>
                  <span className="text-[9px] text-slate-400">({form.quantity} pcs)</span>
                </div>
              </div>
              
              <button 
                type="submit" 
                className="bg-emerald-500 hover:bg-emerald-400 px-4 py-2.5 rounded-xl shadow-md transition-all active:scale-[0.98] group flex items-center gap-1.5 cursor-pointer font-bold shrink-0 text-white"
              >
                <span className="text-xs uppercase tracking-wider font-extrabold font-sans">PESAN GANCI</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* CONFIRMATION IN-APP IFRAME OVERLAY MODAL */}
      <AnimatePresence>
        {isConfirming && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 text-center">
            {/* Backdrop Blur Background */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsConfirming(false)} 
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" 
            />
            
            <motion.div 
              initial={{ scale: 0.94, opacity: 0, y: 15 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.94, opacity: 0, y: 15 }} 
              className="relative w-full max-w-md bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-white/10 shadow-2xl space-y-6 text-center"
            >
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto shadow-md">
                <ShoppingBag className="w-7 h-7" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-heading font-black text-slate-900 dark:text-white uppercase tracking-tight">KONFIRMASI PESANAN</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Pesanan ganci Anda siap dikirimkan ke Admin wa.me kami. Harap pastikan nomor WA Anda sudah aktif.
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-3xl border border-slate-150 dark:border-white/5 space-y-2.5 text-xs text-left">
                <div className="flex justify-between leading-none">
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Nama:</span>
                  <span className="font-extrabold text-slate-900 dark:text-white truncate max-w-[200px]">{form.name}</span>
                </div>
                <div className="flex justify-between leading-none">
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Nomor WA:</span>
                  <span className="font-mono font-extrabold text-slate-900 dark:text-white">{form.whatsapp}</span>
                </div>
                <div className="flex justify-between leading-none">
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Desain:</span>
                  <span className="font-extrabold text-slate-950 dark:text-slate-200 truncate max-w-[200px]">
                    {selectedMode === 'standard' ? activeProduct.name : `Kustomisasi ${customType === 'formal' ? 'Formal' : 'Template'}`}
                  </span>
                </div>
                <div className="flex justify-between leading-none">
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Bentuk:</span>
                  <span className="font-extrabold text-slate-950 dark:text-slate-200 justify-end flex">
                    {selectedShape === 'persegi' ? 'Persegi' : selectedShape === 'panjang' ? 'Persegi Panjang' : 'Oktagonal'}
                  </span>
                </div>
                <div className="flex justify-between leading-none">
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Jumlah:</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">{form.quantity} pcs</span>
                </div>
                <div className="border-t border-slate-200 dark:border-white/10 pt-2.5 flex justify-between items-center">
                  <span className="text-slate-900 dark:text-slate-300 font-extrabold uppercase tracking-widest text-[10px]">Total Pembayaran:</span>
                  <span className="text-emerald-500 font-heading font-black text-sm">{formatRupiah(totalPrice)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsConfirming(false)}
                  className="bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                >
                  Kembali
                </button>
                <button
                  type="button"
                  onClick={executeOrderCheckOut}
                  className="bg-emerald-500 hover:bg-emerald-400 text-white px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider shadow-md transition-all active:scale-[0.98] cursor-pointer"
                >
                  Kirim Pesan (WA)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
