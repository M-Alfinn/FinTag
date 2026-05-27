import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, Star, Camera, Check, ArrowRight, Zap, 
  Image as ImageIcon, Sparkles, Heart, FileText, 
  Music, Calendar, Plus, Minus, PhoneCall, Layers, Eye
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatRupiah, cn } from '../lib/utils';
import { useAuth, handleFirestoreError, OperationType } from '../lib/auth';
import { db } from '../lib/firebase';
import { 
  collection, query, onSnapshot, addDoc, 
  serverTimestamp 
} from 'firebase/firestore';

// Fallback catalog products in case the database is empty initially.
// These are loaded dynamically from Admin Dashboard 'products' collection.
export const DEFAULT_PRODUCTS = [
  {
    id: 'fintag-standard',
    name: 'Gantungan NFC FinTag',
    price: 15000,
    image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&q=90&w=1200',
    description: 'Gantungan kunci NFC premium berbahan akrilik transparan tebal dengan desain minimalis. Tahan benturan, tahan air, dan dilengkapi chip NFC original NTAG213 untuk pencatatan transaksi super instan.'
  },
  {
    id: 'fintag-card',
    name: 'FinTag Card Pro',
    price: 35000,
    image: 'https://images.unsplash.com/photo-1625591338076-905a0980907e?auto=format&fit=crop&q=90&w=1200',
    description: 'Kartu NFC eksklusif dengan sentuhan finish doff premium hitam legam yang elegan. Cocok untuk ID card mahasiswa serbaguna, kartu nama digital, atau dompet pintar terintegrasi.'
  }
];

// EXACTLY 3 Custom Formal Example presets for demonstration
export const FORMAL_EXAMPLES = [
  {
    id: 'formal-mhs',
    name: 'Pas Foto Almamater / Akademik',
    desc: 'Latar belakang merah atau biru solid formal. Sangat cocok untuk kartu tanda mahasiswa (KTM) serbaguna.',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=90&w=1000'
  },
  {
    id: 'formal-portrait',
    name: 'Foto Portrait Kasual Studio',
    desc: 'Gaya foto portrait close-up semi-formal dengan pencahayaan lembut. Sangat personal dan tampak eksklusif.',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=90&w=1000'
  },
  {
    id: 'formal-idcard',
    name: 'Kartu ID Profesional Karir',
    desc: 'Bentuk pas foto identitas korporat modern. Menampilkan visual profesional yang rapi, bersih, dan impresif.',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=90&w=1000'
  }
];

// EXACTLY 10 Custom Template Example presets for demonstration
export const TEMPLATE_EXAMPLES = [
  {
    id: 'tpl-spotify',
    name: 'Spotify Music Player',
    desc: 'Tampilan frame pemutar lagu lengkap dengan nama lagu favorit, artis, progress bar, dan scan barcode album.',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=90&w=1000'
  },
  {
    id: 'tpl-polaroid',
    name: 'Retro Polaroid Snap',
    desc: 'Desain frame foto polaroid putih klasik dengan tulisan tangan estetik, tanggal kenangan, dan filter vintage.',
    image: 'https://images.unsplash.com/photo-1500485035595-cbe6f645feb1?auto=format&fit=crop&q=90&w=1000'
  },
  {
    id: 'tpl-calendar',
    name: 'Anniversary Calendar',
    desc: 'Kalender minimalis menyorot tanggal jadian, ulang tahun, dll dengan penanda spidol tinta bentuk hati merah.',
    image: 'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?auto=format&fit=crop&q=90&w=1000'
  },
  {
    id: 'tpl-cyberpunk',
    name: 'Neon Cyberpunk Hexa Grid',
    desc: 'Gaya visual futuristik modern bertema sci-fi cyberpunk lengkap dengan aksen garis hologram neon bersinar.',
    image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=90&w=1000'
  },
  {
    id: 'tpl-ticket',
    name: 'Concert Ticket Stub',
    desc: 'Desain ganci mirip potongan tiket bioskop/konser retro antik lengkap dengan barcode dan info acara.',
    image: 'https://images.unsplash.com/photo-1481134654431-4361516e5db4?auto=format&fit=crop&q=90&w=1000'
  },
  {
    id: 'tpl-chibi',
    name: 'Cute Chibi Mascot',
    desc: 'Kolase bingkai menggemaskan berisikan karakter hewan lucu bernuansa warna pastel cerah berbalut cinta.',
    image: 'https://images.unsplash.com/photo-1520315342629-6ea920342047?auto=format&fit=crop&q=90&w=1000'
  },
  {
    id: 'tpl-comic',
    name: 'Manga Comic Strip',
    desc: 'Grid panel komik hitam putih ala manga jepang dengan bubble text percakapan kustom pilihan Anda.',
    image: 'https://images.unsplash.com/photo-1560942485-b2a11cc13456?auto=format&fit=crop&q=90&w=1000'
  },
  {
    id: 'tpl-instagram',
    name: 'Instagram Feed Grid',
    desc: 'Kloning postingan medsos Instagram lengkap dengan tanda suka merah, username, and baris teks komentar.',
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=90&w=1000'
  },
  {
    id: 'tpl-zodiac',
    name: 'Cosmic Zodiac Chart',
    desc: 'Peta rasi bintang zodiak romantis sesuai tanggal kelahiran bersanding dengan desain langit malam yang cerah.',
    image: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&q=90&w=1000'
  },
  {
    id: 'tpl-memphis',
    name: 'Neo-Memphis Geometric Art',
    desc: 'Gaya seni modern tahun 90-an yang enerjik, sarat ornamen zig-zag, melingkar, and paduan warna ceria.',
    image: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=90&w=1000'
  }
];

export default function Shop() {
  const { user, loginAsGuest } = useAuth();
  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
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

  // Synchronize product list in real-time from the admin's products collection!
  useEffect(() => {
    const q = query(collection(db, 'products'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDbProducts(data);
      setLoading(false);
    }, (error) => {
      console.warn("Firestore error, loading default catalog:", error);
      setLoading(false);
    });

    return unsubscribe;
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
    ? (customType === 'formal' ? Number(activeFormalProduct?.price || 15000) : Number(activeTemplateProduct?.price || 15000)) 
    : Number(activeProduct.price || 0);
  const customCost = selectedMode === 'custom' ? 2000 : 0;
  const unitPrice = basePrice + customCost;
  const totalPrice = unitPrice * form.quantity;

  // Determine which image to show inside the Live Acrylic Mockup
  const getMockupDisplayImage = () => {
    if (selectedMode === 'standard') {
      return activeProduct.image;
    } else {
      if (customType === 'formal') {
        return activeFormalProduct?.image || '';
      } else {
        return activeTemplateProduct?.image || '';
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

      await addDoc(collection(db, 'orders'), {
        productId: selectedMode === 'standard' ? (activeProduct.id || 'fintag-standard') : 'fintag-custom',
        productName: selectedMode === 'standard' ? activeProduct.name : 'Ganci Custom',
        totalPrice: totalPrice,
        userId: user?.uid || 'guest-session',
        status: 'pending',
        date: new Date().toISOString(),
        createdAt: serverTimestamp(),
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
      });

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
      handleFirestoreError(error, OperationType.CREATE, 'orders');
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
              Ganci Standar
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
          <div className="flex flex-col items-center justify-center p-4 bg-gradient-to-b from-slate-50 to-slate-100/30 dark:from-slate-950/15 dark:to-slate-900/10 rounded-3xl border border-slate-150 dark:border-white/5 relative shadow-inner overflow-hidden min-h-[290px]">
            {/* Top key ring metal hanger */}
            <div className="w-5 h-5 border-[4px] border-slate-300 dark:border-slate-700 rounded-full shadow-md z-10 bg-slate-50 dark:bg-slate-900 -mt-2 animate-bounce duration-1000" />
            <div className="w-1.5 h-4 bg-gradient-to-b from-slate-300 to-slate-400 dark:from-slate-700 dark:to-slate-800 rounded z-10 -mt-1 mb-1 shadow-sm" />

            {/* Acrylic Keychain Body */}
            {(() => {
              const isOctagonal = selectedShape === 'oktagonal';
              const isSquare = selectedShape === 'persegi';
              const isRectangle = selectedShape === 'panjang';
              const octagonalClip = 'polygon(15% 0%, 85% 0%, 100% 12%, 100% 88%, 85% 100%, 15% 100%, 0% 88%, 0% 12%)';

              return (
                <motion.div 
                  key={`${selectedMode}-${customType}-${selectedFormalIdx}-${selectedTemplateIdx}-${activeProductIdx}-${selectedShape}`}
                  initial={{ scale: 0.95, rotate: -1, y: 3 }}
                  animate={{ scale: 1, rotate: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  className={cn(
                    "inline-block relative select-none transition-all duration-300",
                    isOctagonal 
                      ? "p-[1.5px] bg-gradient-to-b from-slate-350 via-slate-200/90 to-slate-100/40 dark:from-white/40 dark:via-white/20 dark:to-white/5 shadow-inner animate-pulse border-transparent" 
                      : "bg-white/10 dark:bg-slate-900/10 p-2 border-2 border-slate-300/80 dark:border-white/15",
                    isSquare ? "rounded-[32px]" : isRectangle ? "rounded-[20px]" : "rounded-none"
                  )}
                  style={{
                    ...getMockupDimensions(imgAspect),
                    boxShadow: isOctagonal ? 'none' : '0 15px 35px -10px rgba(0,0,0,0.15), inset 0 0 10px rgba(255,255,255,0.3)',
                    clipPath: isOctagonal ? octagonalClip : 'none',
                    filter: isOctagonal ? 'drop-shadow(0 15px 25px rgba(0,0,0,0.15))' : 'none'
                  }}
                >
                  {/* Top tiny punch hole inner hole */}
                  <div className="absolute top-0.5 right-1/2 translate-x-1/2 w-3 h-3 rounded-full border border-black/10 dark:border-white/10 bg-slate-50 dark:bg-slate-950 z-30" />
                  
                  {/* Bevel frame layer */}
                  <div
                    className={cn(
                      "w-full h-full flex items-center justify-center relative transition-all duration-300",
                      isOctagonal ? "p-2 bg-white/20 dark:bg-slate-900/30" : ""
                    )}
                    style={{
                      clipPath: isOctagonal ? octagonalClip : 'none'
                    }}
                  >
                    {/* Acrylic Print Center Sheet */}
                    <div 
                      className={cn(
                        "w-full h-full overflow-hidden bg-white dark:bg-slate-950 border border-slate-100 dark:border-white/5 flex flex-col justify-center items-center relative transition-all duration-300 transform-gpu isolate",
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
                        src={getMockupDisplayImage()} 
                        className="absolute inset-0 w-full h-full object-cover blur-md opacity-35 scale-110 pointer-events-none transition-all duration-300" 
                        alt=""
                        referrerPolicy="no-referrer"
                      />

                      {/* Precise crisp unblurred master image */}
                      <img 
                        src={getMockupDisplayImage()} 
                        className="relative z-10 max-w-full max-h-full object-contain transition-all duration-300 pointer-events-none select-none" 
                        style={{ imageRendering: 'high-quality' }}
                        alt="Acrylic Ganci Mockup"
                        referrerPolicy="no-referrer"
                      />

                      {/* Bottom elegant info overlay tag inside keyholder - matches border corners */}
                      <div 
                        className={cn(
                          "absolute bg-slate-950/85 backdrop-blur-md px-2 py-1.5 text-center border-t border-white/15 z-20 flex flex-col justify-center overflow-hidden",
                          isOctagonal
                            ? "bottom-0 inset-x-0 rounded-none"
                            : isSquare
                              ? "-bottom-[0.5px] -inset-x-[0.5px] rounded-b-[23.5px]"
                              : "-bottom-[0.5px] -inset-x-[0.5px] rounded-b-[13.5px]"
                        )}
                      >
                        <p className="text-[9px] font-black text-white leading-tight truncate">
                          {selectedMode === 'standard' ? activeProduct.name : `Custom: ${customType === 'formal' ? 'Formal' : 'Template'}`}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
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
                  {selectedMode === 'custom' ? `+ ${formatRupiah(2000)}` : formatRupiah(0)}
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
                    🛍️ PILIH KATALOG GANCI STANDAR
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
                            src={p.image} 
                            className="absolute inset-0 w-full h-full object-cover blur-sm opacity-25 scale-110 pointer-events-none" 
                            referrerPolicy="no-referrer" 
                            alt="" 
                          />
                          <img 
                            src={p.image} 
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
                            "text-xs font-black block leading-tight truncate",
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
                      ⚙️ PILIH MODEL KUSTOMISASI
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
                        <span className="text-xs uppercase tracking-wide">Formal</span>
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
                        <span className="text-xs uppercase tracking-wide">Template</span>
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
                              <img src={item.image} className="absolute inset-0 w-full h-full object-cover blur-sm opacity-25 scale-110 pointer-events-none" referrerPolicy="no-referrer" alt="" />
                              <img src={item.image} className="relative z-10 max-w-full max-h-full object-contain pointer-events-none select-none transition-all duration-300" style={{ imageRendering: 'high-quality' }} referrerPolicy="no-referrer" alt={item.name} />
                              {selectedFormalIdx === idx && (
                                <div className="absolute top-2 right-2 w-5 h-5 bg-purple-500 text-white rounded-full flex items-center justify-center shadow-md z-20">
                                  <Check className="w-3 h-3" />
                                </div>
                              )}
                            </div>
                            <div className="p-2.5 flex-1 flex flex-col justify-between bg-white dark:bg-slate-900/50 border-t border-slate-100 dark:border-white/5">
                              <span className={cn(
                                "text-xs font-black block leading-tight truncate",
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
                              <img src={item.image} className="absolute inset-0 w-full h-full object-cover blur-sm opacity-25 scale-110 pointer-events-none" referrerPolicy="no-referrer" alt="" />
                              <img src={item.image} className="relative z-10 max-w-full max-h-full object-contain pointer-events-none select-none transition-all duration-300" style={{ imageRendering: 'high-quality' }} referrerPolicy="no-referrer" alt={item.name} />
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
                                "text-xs font-black block leading-tight truncate",
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
                <span className="text-xs uppercase tracking-wider font-extrabold">PESAN (WA)</span>
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

              <div className="space-y-1">
                <h3 className="text-xl font-heading font-black text-slate-900 dark:text-white uppercase tracking-tight">KIRIM PESANAN KE WHATSAPP?</h3>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed px-1">
                  Kami akan mengalihkan Anda secara otomatis dan menyalin teks pesanan instan ke Admin WhatsApp FinTag store. Selamat berbelanja!
                </p>
              </div>

              {/* Order Specs Grid list box */}
              <div className="bg-slate-50 dark:bg-slate-950 px-5 py-4 rounded-3xl border border-slate-100 dark:border-white/5 space-y-3 text-left font-sans text-xs">
                <div className="flex justify-between items-baseline">
                  <span className="text-slate-400">Item Produk:</span>
                  <span className="text-slate-900 dark:text-white font-bold text-right truncate max-w-[200px]">
                    {selectedMode === 'standard' ? activeProduct.name : 'Ganti Custom'}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-400">Model Desain:</span>
                  <span className="text-slate-900 dark:text-white font-bold">
                    {selectedMode === 'standard' ? 'Opsi 1: Standar' : 'Opsi 2: Ganci Custom'}
                  </span>
                </div>

                {selectedMode === 'custom' && (
                  <div className="flex justify-between items-baseline">
                    <span className="text-slate-400">Pilihan Custom:</span>
                    <span className="text-slate-900 dark:text-white font-bold text-right truncate max-w-[200px]">
                      {customType === 'formal' ? `Pas Foto ke-${selectedFormalIdx + 1}` : `Template ke-${selectedTemplateIdx + 1}`}
                    </span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-slate-400">Bentuk Akrilik:</span>
                  <span className="text-slate-900 dark:text-white font-bold uppercase text-[10px]">
                    {selectedShape === 'persegi' ? 'Persegi' : selectedShape === 'panjang' ? 'Persegi Panjang' : 'Oktagonal'}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-400">Kuantitas Beli:</span>
                  <span className="text-slate-900 dark:text-white font-bold">{form.quantity} Unit / Pcs</span>
                </div>

                <div className="flex justify-between border-t border-dashed border-slate-200 dark:border-white/10 pt-2 text-sm font-black">
                  <span className="text-slate-800 dark:text-slate-300">Total Harga:</span>
                  <span className="text-emerald-500">{formatRupiah(totalPrice)}</span>
                </div>
              </div>

              {/* Confirm Decisions Button Row */}
              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setIsConfirming(false)}
                  className="flex-1 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-black text-[10px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 uppercase tracking-widest border border-slate-100 dark:border-white/5 transition-colors cursor-pointer"
                >
                  BATAL
                </button>
                <button
                  type="button"
                  onClick={executeOrderCheckOut}
                  className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-black text-[10px] hover:bg-emerald-400 shadow-md transition-all uppercase tracking-widest cursor-pointer"
                >
                  KIRIM (CHAT WA)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
