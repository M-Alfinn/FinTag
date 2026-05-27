import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShoppingBag,
  Plus,
  CheckCircle2,
  Trash2,
  Edit3,
  Package,
  TrendingUp,
  ShieldCheck,
  LogIn,
  ArrowRight,
  LogOut,
  ChevronDown,
  ChevronUp,
  Info,
  ExternalLink,
  Layers,
  MessageCircle,
  Music,
} from "lucide-react";
import { formatRupiah, cn } from "../lib/utils";
import { useAuth, handleFirestoreError, OperationType } from "../lib/auth";
import { db, auth, storage } from "../lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
  orderBy,
  setDoc,
} from "firebase/firestore";
import { sendPasswordResetEmail } from "firebase/auth";
import { DEFAULT_PRODUCTS, FORMAL_EXAMPLES, TEMPLATE_EXAMPLES } from "./Shop";

// Utility for safe client-side image validation and high-efficiency Base64 conversion/compression
const compressAndConvertToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    // 1. Double check extension matching
    const allowedExtensions = [".png", ".jpg", ".jpeg", ".gif", ".webp"];
    const fileExtension = file.name
      .substring(file.name.lastIndexOf("."))
      .toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
      reject(
        new Error(
          "Format file tidak didukung! Hanya file PNG, JPG, JPEG, GIF, dan WEBP yang diperbolehkan.",
        ),
      );
      return;
    }

    // 2. MIME type matching
    if (!file.type.startsWith("image/")) {
      reject(new Error("File yang diupload harus berupa gambar!"));
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.9); // Compress to 90% quality to keep Base64 very clear and HD
          resolve(dataUrl);
        } else {
          resolve(event.target?.result as string);
        }
      };
      img.onerror = () => {
        reject(new Error("File gambar rusak atau tidak valid."));
      };
    };
    reader.onerror = () => reject(new Error("Gagal membaca file."));
  });
};

const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Gagal membaca file audio."));
  });
};

export default function AdminDashboard() {
  const {
    user,
    login,
    loginWithPassword,
    logout,
    loading: authLoading,
  } = useAuth();
  const [activeTab, setActiveTab] = useState<"orders" | "products" | "admins" | "music" | "feedback">(
    "orders",
  );
  const [productSubTab, setProductSubTab] = useState<
    "standard" | "custom-formal" | "custom-template"
  >("standard");
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    description: "",
    image: "",
    type: "standard",
    subtype: "formal",
  });
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>(
    {},
  );
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [loginMethod, setLoginMethod] = useState<"password" | "google">(
    "password",
  );
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(
    null,
  );

  // States for multiple admin system
  const [adminEmailsList, setAdminEmailsList] = useState<any[]>([]);
  const [isSubAdmin, setIsSubAdmin] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [adminError, setAdminError] = useState<string | null>(null);

  // States for dynamic image source selections
  const [imageSource, setImageSource] = useState<"url" | "file">("url");
  const [imageSourceEdit, setImageSourceEdit] = useState<"url" | "file">("url");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadErrorEdit, setUploadErrorEdit] = useState<string | null>(null);

  // States for music management
  const [songs, setSongs] = useState<any[]>([]);
  const [isAddingSong, setIsAddingSong] = useState(false);
  const [newSong, setNewSong] = useState({
    title: "",
    artist: "",
    url: "",
    cover: "",
  });
  const [editingSong, setEditingSong] = useState<any>(null);
  const [songCoverSource, setSongCoverSource] = useState<"url" | "file">("url");
  const [songCoverSourceEdit, setSongCoverSourceEdit] = useState<"url" | "file">("url");
  const [songAudioSource, setSongAudioSource] = useState<"url" | "file">("url");
  const [songAudioSourceEdit, setSongAudioSourceEdit] = useState<"url" | "file">("url");
  const [musicUploadError, setMusicUploadError] = useState<string | null>(null);
  const [musicUploadErrorEdit, setMusicUploadErrorEdit] = useState<string | null>(null);

  // Storage upload progress states
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [coverProgress, setCoverProgress] = useState<number | null>(null);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState<number | null>(null);
  const [isUploadingCoverEdit, setIsUploadingCoverEdit] = useState(false);
  const [coverProgressEdit, setCoverProgressEdit] = useState<number | null>(null);
  const [isUploadingAudioEdit, setIsUploadingAudioEdit] = useState(false);
  const [audioProgressEdit, setAudioProgressEdit] = useState<number | null>(null);

  // Cloudinary Configuration States
  const [cloudinaryCloudName, setCloudinaryCloudNameState] = useState(() => {
    return localStorage.getItem("cloudinary_cloud_name") || "";
  });
  const [cloudinaryUploadPreset, setCloudinaryUploadPresetState] = useState(() => {
    return localStorage.getItem("cloudinary_upload_preset") || "";
  });
  const [cloudNameInput, setCloudNameInput] = useState(cloudinaryCloudName);
  const [uploadPresetInput, setUploadPresetInput] = useState(cloudinaryUploadPreset);
  const [showCloudinaryPanel, setShowCloudinaryPanel] = useState(() => {
    const name = localStorage.getItem("cloudinary_cloud_name") || "";
    const preset = localStorage.getItem("cloudinary_upload_preset") || "";
    return !name || !preset;
  });
  const [showCloudinaryHelp, setShowCloudinaryHelp] = useState(false);
  const [cloudinarySuccessMsg, setCloudinarySuccessMsg] = useState<string | null>(null);

  const handleSaveCloudinary = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("cloudinary_cloud_name", cloudNameInput.trim());
    localStorage.setItem("cloudinary_upload_preset", uploadPresetInput.trim());
    setCloudinaryCloudNameState(cloudNameInput.trim());
    setCloudinaryUploadPresetState(uploadPresetInput.trim());
    setCloudinarySuccessMsg("Konfigurasi Cloudinary berhasil disimpan! Upload musik sekarang sudah aktif.");
    setTimeout(() => {
      setCloudinarySuccessMsg(null);
    }, 5000);
  };

  const [confirmAction, setConfirmAction] = useState<{
    type: "delete" | "save" | "add" | "logout";
    id?: string;
    data?: any;
    name?: string;
    subType?: "order" | "product" | "song" | "logout";
    title: string;
    message: string;
    icon: any;
    confirmText: string;
    color: string;
  } | null>(null);

  const existingTemplateNames = products
    .filter((p: any) => p.type === "custom" && p.subtype === "template")
    .map((p: any) => p.name);

  const availableTemplateNames = Array.from(
    { length: 50 },
    (_, i) => `Template ${i + 1}`,
  ).filter((name) => !existingTemplateNames.includes(name));

  const existingTemplateNamesEditing = products
    .filter(
      (p: any) =>
        p.id !== editingProduct?.id &&
        p.type === "custom" &&
        p.subtype === "template",
    )
    .map((p: any) => p.name);

  const availableTemplateNamesEditing = Array.from(
    { length: 50 },
    (_, i) => `Template ${i + 1}`,
  ).filter((name) => !existingTemplateNamesEditing.includes(name));

  // feedbacks live admin manage section
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [deletePendingId, setDeletePendingId] = useState<string | null>(null);

  const fetchFeedbacks = () => {
    fetch("/api/feedbacks")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setFeedbacks(data); // we'll sort them on render or keep order
        }
      })
      .catch((err) => console.error("Error fetching feedbacks:", err));
  };

  const handleDeleteFeedback = (id: string) => {
    fetch(`/api/feedbacks/${id}`, {
      method: "DELETE",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          fetchFeedbacks();
          setDeletePendingId(null);
        }
      })
      .catch((err) => console.error("Error deleting feedback:", err));
  };

  useEffect(() => {
    if (activeTab === "feedback") {
      fetchFeedbacks();
    }
  }, [activeTab]);

  // Read admins collection to check if signed in user email is in authorization list
  useEffect(() => {
    if (!user) {
      setIsSubAdmin(false);
      return;
    }

    const qAdmins = query(collection(db, "admins"));
    const unsubscribeAdmins = onSnapshot(
      qAdmins,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAdminEmailsList(list);

        if (user.email) {
          const isUserInList = list.some(
            (item: any) => item.id.toLowerCase() === user.email?.toLowerCase(),
          );
          setIsSubAdmin(isUserInList);
        } else {
          setIsSubAdmin(false);
        }
      },
      (error) => {
        console.error("Gagal mendapatkan daftar admin:", error);
      },
    );

    return () => unsubscribeAdmins();
  }, [user]);

  // Admin access check - Based on primary email OR existing in /admins collection
  const isSuperAdmin =
    user?.email?.toLowerCase() === "mhdalfinaja@mhs.unimed.ac.id" ||
    user?.email?.toLowerCase() === "mhdalfin7658@gmail.com";
  const isAdmin = isSuperAdmin || isSubAdmin;

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      await login();
    } catch (error: any) {
      console.error("Admin Login Error:", error);
      if (
        error &&
        (error.code === "auth/unauthorized-domain" ||
          (error.message && error.message.includes("auth/unauthorized-domain")))
      ) {
        setLoginError("unauthorized-domain");
      } else {
        setLoginError(error?.message || String(error));
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail || !adminPassword) return;
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      await loginWithPassword(adminEmail.trim(), adminPassword, isSignUpMode);
    } catch (error: any) {
      console.error("Admin Password Login Error:", error);
      if (error && error.code === "auth/weak-password") {
        setLoginError("Password minimal harus 6 karakter.");
      } else if (error && error.code === "auth/email-already-in-use") {
        setLoginError(
          "Email admin sudah terdaftar. Silakan login langsung menggunakan tab 'Masuk' (nonaktifkan mode Setup Baru).",
        );
      } else if (
        error &&
        (error.code === "auth/invalid-credential" ||
          error.code === "auth/wrong-password" ||
          error.code === "auth/invalid-login-credentials")
      ) {
        setLoginError(
          "Password salah atau akun belum terdaftar. Jika ini setup pertama kali, aktifkan opsi 'Daftar Akun Admin Baru' di bawah.",
        );
      } else if (error && error.code === "auth/operation-not-allowed") {
        setLoginError(
          "Metode masuk Email/Password belum diaktifkan di Firebase Console Anda. Silakan aktifkan di menu Authentication -> Sign-in method.",
        );
      } else {
        setLoginError(error?.message || String(error));
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleForgotPassword = async () => {
    const targetEmail = adminEmail.trim();
    if (!targetEmail) {
      setLoginError(
        "Silakan masukkan email Anda di kolom 'Email Admin' terlebih dahulu untuk mengirim link reset kata sandi.",
      );
      return;
    }
    setIsResettingPassword(true);
    setLoginError(null);
    setResetSuccessMessage(null);
    try {
      await sendPasswordResetEmail(auth, targetEmail);
      setResetSuccessMessage(
        `Link reset kata sandi telah dikirim ke email ${targetEmail}. Silakan periksa inbox atau folder spam Anda.`,
      );
    } catch (error: any) {
      console.error("Forgot Password Error:", error);
      setLoginError(
        "Gagal mengirim link reset: " + (error?.message || String(error)),
      );
    } finally {
      setIsResettingPassword(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;

    // Fetch Orders
    const qOrders = query(
      collection(db, "orders"),
      orderBy("createdAt", "desc"),
    );
    const unsubscribeOrders = onSnapshot(
      qOrders,
      (snapshot) => {
        setOrders(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, "orders");
      },
    );

    // Fetch Products
    const qProducts = query(collection(db, "products"));
    const unsubscribeProducts = onSnapshot(
      qProducts,
      async (snapshot) => {
        const dataList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(dataList);
        setLoading(false);

        // Auto-seed if database is completely empty
        if (dataList.length === 0) {
          console.log(
            "Database produk kosong, melakukan auto-seeding preset...",
          );
          try {
            for (const p of DEFAULT_PRODUCTS) {
              await addDoc(collection(db, "products"), {
                name: p.name,
                price: p.price,
                description: p.description,
                image: p.image,
                type: "standard",
                subtype: "",
                createdAt: serverTimestamp(),
              });
            }
            for (const p of FORMAL_EXAMPLES) {
              await addDoc(collection(db, "products"), {
                name: p.name,
                price: 15000,
                description: p.desc,
                image: p.image,
                type: "custom",
                subtype: "formal",
                createdAt: serverTimestamp(),
              });
            }
            for (const p of TEMPLATE_EXAMPLES) {
              await addDoc(collection(db, "products"), {
                name: p.name,
                price: 15000,
                description: p.desc,
                image: p.image,
                type: "custom",
                subtype: "template",
                createdAt: serverTimestamp(),
              });
            }
            console.log("Auto-seeding preset sukses!");
          } catch (err) {
            console.error("Gagal auto-seeding preset:", err);
          }
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, "products");
        setLoading(false);
      },
    );

    // Fetch Songs
    const qSongs = query(collection(db, "songs"), orderBy("createdAt", "desc"));
    const unsubscribeSongs = onSnapshot(
      qSongs,
      (snapshot) => {
        setSongs(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, "songs");
      },
    );

    return () => {
      unsubscribeOrders();
      unsubscribeProducts();
      unsubscribeSongs();
    };
  }, [isAdmin]);

  const tabs = [
    { id: "orders", label: "Pesanan", icon: ShoppingBag },
    { id: "products", label: "Produk Shop", icon: Package },
    { id: "music", label: "Manajemen Musik", icon: Music },
    { id: "feedback", label: "Masukan Pengguna", icon: MessageCircle },
    { id: "admins", label: "Daftar Admin", icon: ShieldCheck },
  ];

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

  if (!user || !isAdmin) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950/20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-lg bento-card p-10 space-y-6 dark:bg-slate-900/40 text-center shadow-xl border border-slate-100 dark:border-slate-800"
        >
          <div className="space-y-3">
            <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-[32px] flex items-center justify-center mx-auto border border-rose-100 dark:border-rose-900/10">
              <ShieldCheck className="w-8 h-8 text-rose-500" />
            </div>
            <h1 className="text-3xl font-heading font-bold dark:text-white transition-colors">
              Admin Only
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm transition-colors">
              Hanya akun administrator yang terdaftar yang dapat mengakses panel
              kontrol ini.
            </p>
          </div>

          {/* Login Method Option Selector */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl gap-1">
            <button
              onClick={() => {
                setLoginMethod("password");
                setLoginError(null);
              }}
              type="button"
              className={cn(
                "flex-1 py-3 text-xs md:text-sm font-bold rounded-xl transition-all cursor-pointer select-none",
                loginMethod === "password"
                  ? "bg-white dark:bg-slate-700 shadow text-slate-950 dark:text-white"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300",
              )}
            >
              Masuk dengan Password
            </button>
            <button
              onClick={() => {
                setLoginMethod("google");
                setLoginError(null);
              }}
              type="button"
              className={cn(
                "flex-1 py-3 text-xs md:text-sm font-bold rounded-xl transition-all cursor-pointer select-none",
                loginMethod === "google"
                  ? "bg-white dark:bg-slate-700 shadow text-slate-950 dark:text-white"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300",
              )}
            >
              Masuk dengan Google
            </button>
          </div>

          {loginError === "unauthorized-domain" ? (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-3xl p-6 text-left space-y-3">
              <h2 className="text-amber-800 dark:text-amber-400 font-bold text-sm flex items-center gap-2">
                ⚠️ Domain Belum Diizinkan di Firebase!
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                Firebase mendeteksi login dari domain / localhost yang belum
                masuk daftar putih (Authorized Domains). Silakan ikuti
                langkah-langkah mudah berikut di Firebase Console untuk
                mendaftarkannya:
              </p>
              <ol className="text-xs text-slate-500 dark:text-slate-400 list-decimal pl-5 space-y-1.5">
                <li>
                  Buka <strong>Firebase Console</strong> Anda di{" "}
                  <a
                    href="https://console.firebase.google.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline font-bold"
                  >
                    console.firebase.google.com
                  </a>
                </li>
                <li>
                  Pilih proyek Firebase Anda, lalu buka menu{" "}
                  <strong>Authentication</strong> di panel samping kiri
                </li>
                <li>
                  Pilih tab <strong>Settings</strong> di bagian atas
                </li>
                <li>
                  Klik sub-menu <strong>Authorized domains</strong> di panel
                  kiri setelan tersebut
                </li>
                <li>
                  Klik tombol <strong>Add domain</strong> (Tambahkan domain)
                </li>
                <li>
                  Masukkan <code>localhost</code> lalu simpan
                </li>
                <li>
                  Tambahkan juga domain preview Anda seperti: <br />
                  <code className="bg-slate-100 dark:bg-slate-800 p-0.5 rounded text-[10px]">
                    ais-dev-nedyxbi267jijeoteorkfi-487129983459.asia-east1.run.app
                  </code>
                </li>
              </ol>
              <button
                onClick={() => setLoginError(null)}
                className="w-full mt-2 py-3 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-400 text-xs font-bold rounded-2xl transition-all"
              >
                Kembali & Coba Lagi
              </button>
            </div>
          ) : loginError ? (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-3xl p-5 text-left space-y-2">
              <h3 className="text-red-700 dark:text-red-400 font-bold text-xs">
                Gagal Login:
              </h3>
              <p className="text-xs text-red-600 dark:text-red-400 font-mono break-all leading-relaxed">
                {loginError}
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setLoginError(null)}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  Coba Lagi
                </button>
                <button
                  onClick={handleForgotPassword}
                  className="text-xs font-bold text-amber-500 hover:underline"
                >
                  Kirim Reset Password Email
                </button>
              </div>
            </div>
          ) : user && !isAdmin ? (
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30 rounded-3xl p-5 text-left">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Anda login sebagai{" "}
                <strong className="text-slate-800 dark:text-slate-200">
                  {user.email}
                </strong>
                , namun akun tersebut bukan Email Administrator yang ditentukan.
              </p>
            </div>
          ) : null}

          {resetSuccessMessage && (
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-3xl p-5 text-left space-y-2 animate-fadeIn">
              <h3 className="text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                Reset Password Dikirim:
              </h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 leading-relaxed font-sans">
                {resetSuccessMessage}
              </p>
              <button
                onClick={() => setResetSuccessMessage(null)}
                className="text-xs font-bold text-emerald-500 hover:underline"
              >
                Tutup Sembunyikan
              </button>
            </div>
          )}

          {loginMethod === "password" ? (
            <form
              onSubmit={handlePasswordLogin}
              className="space-y-4 text-left"
            >
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                  Email Admin
                </label>
                <input
                  type="email"
                  placeholder="Masukkan email admin..."
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl outline-none dark:text-white text-sm border border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5 flex-wrap gap-1">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Password
                  </label>
                  <button
                    type="button"
                    disabled={isResettingPassword}
                    onClick={handleForgotPassword}
                    className="text-xs text-primary font-bold hover:underline select-none cursor-pointer disabled:opacity-50"
                  >
                    {isResettingPassword
                      ? "Mengirim link..."
                      : "Lupa Password?"}
                  </button>
                </div>
                <input
                  type="password"
                  placeholder="Masukkan password admin..."
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl outline-none dark:text-white text-sm border border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono"
                />
              </div>

              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  id="signup-mode"
                  checked={isSignUpMode}
                  onChange={(e) => setIsSignUpMode(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-primary bg-slate-100 rounded focus:ring-primary dark:focus:ring-primary dark:ring-offset-slate-900 focus:ring-2 dark:bg-slate-800 dark:border-slate-700"
                />
                <label
                  htmlFor="signup-mode"
                  className="text-xs text-slate-500 dark:text-slate-400 cursor-pointer select-none leading-relaxed"
                >
                  <strong>Daftar Akun Admin Baru</strong> (Aktifkan opsi ini
                  jika pertama kali membuat password admin agar langsung
                  terdaftar di Firebase)
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full mt-4 bg-primary text-white py-5 rounded-3xl font-bold flex items-center justify-center gap-3 shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                {isLoggingIn ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <LogIn className="w-5 h-5" />
                )}
                {isLoggingIn
                  ? "Sedang Masuk..."
                  : isSignUpMode
                    ? "Daftar & Masuk"
                    : "Masuk Dashboard"}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <button
                disabled={isLoggingIn}
                onClick={handleLogin}
                className="w-full bg-slate-900 dark:bg-primary text-white py-5 rounded-3xl font-bold flex items-center justify-center gap-3 shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                {isLoggingIn ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <LogIn className="w-5 h-5" />
                )}
                {isLoggingIn ? "Memproses Login..." : "Login dengan Google"}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  const totalRevenue = orders.reduce(
    (sum, o) => sum + (Number(o.totalPrice) || 0),
    0,
  );

  const toggleStatus = async (id: string, currentStatus: string) => {
    try {
      const nextStatus = currentStatus === "pending" ? "selesai" : "pending";
      await updateDoc(doc(db, "orders", id), { status: nextStatus });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${id}`);
    }
  };

  const deleteOrder = async (id: string) => {
    try {
      await deleteDoc(doc(db, "orders", id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `orders/${id}`);
    } finally {
      setConfirmAction(null);
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await deleteDoc(doc(db, "products", id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
    } finally {
      setConfirmAction(null);
    }
  };

  const handleConfirmAction = () => {
    if (!confirmAction) return;
    const { type, subType, id } = confirmAction;

    if (type === "delete") {
      if (subType === "order") deleteOrder(id!);
      else if (subType === "product") deleteProduct(id!);
      else if (subType === "song") deleteSong(id!);
    } else if (type === "save") {
      if (subType === "order") executeEditOrder();
      else if (subType === "product") executeEditProduct();
      else if (subType === "song") executeEditSong();
    } else if (type === "add") {
      if (subType === "product") executeAddProduct();
      else if (subType === "song") executeAddSong();
    } else if (type === "logout") {
      logout();
      setConfirmAction(null);
    }
  };

  const handleEditOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    setConfirmAction({
      type: "save",
      subType: "order",
      title: "Simpan Perubahan",
      message: `Konfirmasi perubahan data pesanan untuk ${editingOrder.name}?`,
      icon: Edit3,
      confirmText: "Simpan",
      color: "bg-secondary",
    });
  };

  const executeEditOrder = async () => {
    try {
      await updateDoc(doc(db, "orders", editingOrder.id), {
        ...editingOrder,
        totalPrice: Number(editingOrder.totalPrice),
      });
      setEditingOrder(null);
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.UPDATE,
        `orders/${editingOrder.id}`,
      );
    } finally {
      setConfirmAction(null);
    }
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setConfirmAction({
      type: "save",
      subType: "product",
      title: "Simpan Produk",
      message: `Update data produk "${editingProduct.name}"?`,
      icon: Edit3,
      confirmText: "Simpan",
      color: "bg-secondary",
    });
  };

  const executeEditProduct = async () => {
    try {
      await updateDoc(doc(db, "products", editingProduct.id), {
        ...editingProduct,
        price: Number(editingProduct.price),
      });
      setEditingProduct(null);
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.UPDATE,
        `products/${editingProduct.id}`,
      );
    } finally {
      setConfirmAction(null);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail) return;
    setAdminError(null);
    if (!isSuperAdmin) {
      setAdminError(
        "Gagal: Hanya Super Admin Utama yang memiliki izin untuk menambahkan akun admin lain.",
      );
      return;
    }
    try {
      const emailPath = newAdminEmail.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailPath)) {
        setAdminError("Format email tidak valid.");
        return;
      }

      await setDoc(doc(db, "admins", emailPath), {
        email: emailPath,
        addedBy: user?.email || "System",
        addedAt: serverTimestamp(),
      });
      setNewAdminEmail("");
    } catch (error: any) {
      console.error("Gagal menambah admin:", error);
      if (error && error.code === "permission-denied") {
        setAdminError(
          "Gagal: Anda tidak memiliki izin untuk mengedit daftar admin.",
        );
      } else {
        setAdminError(
          "Gagal menambahkan admin: " + (error?.message || String(error)),
        );
      }
    }
  };

  const handleRemoveAdmin = async (email: string) => {
    if (!isSuperAdmin) {
      setAdminError(
        "Gagal: Hanya Super Admin Utama yang memiliki izin untuk menghapus akun admin lain.",
      );
      return;
    }
    if (
      email.toLowerCase() === "mhdalfinaja@mhs.unimed.ac.id" ||
      email.toLowerCase() === "mhdalfin7658@gmail.com"
    ) {
      setAdminError("Tidak dapat menghapus super admin utama.");
      return;
    }
    setAdminError(null);
    try {
      await deleteDoc(doc(db, "admins", email.toLowerCase()));
    } catch (error: any) {
      console.error("Gagal menghapus admin:", error);
      if (error && error.code === "permission-denied") {
        setAdminError(
          "Gagal: Anda tidak memiliki izin untuk mengedit daftar admin.",
        );
      } else {
        setAdminError(
          "Gagal menghapus admin: " + (error?.message || String(error)),
        );
      }
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfirmAction({
      type: "add",
      subType: "product",
      title: "Tambah Produk",
      message: `Tambahkan "${newProduct.name}" ke katalog shop?`,
      icon: Plus,
      confirmText: "Tambah",
      color: "bg-primary",
    });
  };

  const executeAddProduct = async () => {
    try {
      await addDoc(collection(db, "products"), {
        ...newProduct,
        price: Number(newProduct.price),
        createdAt: serverTimestamp(),
      });
      setIsAddingProduct(false);
      setNewProduct({
        name: "",
        price: "",
        description: "",
        image: "",
        type: "standard",
        subtype: "formal",
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "products");
    } finally {
      setConfirmAction(null);
    }
  };

  const handleOpenAddProduct = () => {
    setIsAddingProduct(true);
    setImageSource("url");
    setUploadError(null);
  };

  const handleOpenEditProduct = (p: any) => {
    setEditingProduct(p);
    setImageSourceEdit(p.image && p.image.startsWith("data:") ? "file" : "url");
    setUploadErrorEdit(null);
  };

  const uploadFileToStorage = (
    file: File,
    pathName: string,
    onProgress: (progress: number) => void,
    onComplete: (downloadURL: string) => void,
    onError: (errorMessage: string) => void
  ) => {
    const cloudName = localStorage.getItem("cloudinary_cloud_name") || "";
    const uploadPreset = localStorage.getItem("cloudinary_upload_preset") || "";

    if (cloudName && uploadPreset) {
      // Prioritize Cloudinary Upload (Free, Resumable progress, no card needed!)
      try {
        const url = `https://api.cloudinary.com/v1_1/${cloudName.trim()}/upload`;
        const xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            onProgress(progress);
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200) {
            try {
              const response = JSON.parse(xhr.responseText);
              if (response.secure_url) {
                onComplete(response.secure_url);
              } else {
                onError("Gagal mendapatkan link download dari Cloudinary.");
              }
            } catch (e) {
              onError("Format respon Cloudinary tidak valid.");
            }
          } else {
            try {
              const errResponse = JSON.parse(xhr.responseText);
              onError(errResponse.error?.message || "Gagal mengunggah ke Cloudinary.");
            } catch (e) {
              onError(`Terjadi kesalahan server Cloudinary (${xhr.status}). Pastikan Cloud Name & Upload Preset sudah benar.`);
            }
          }
        };

        xhr.onerror = () => {
          onError("Koneksi ke server Cloudinary terputus atau gagal.");
        };

        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", uploadPreset.trim());
        formData.append("resource_type", "auto");

        xhr.send(formData);
      } catch (err: any) {
        onError(err?.message || "Terjadi kesalahan upload Cloudinary.");
      }
    } else {
      // Fallback to Firebase Storage (Will fail with Spark limitations, but warns user)
      try {
        const uniqueName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
        const fileRef = ref(storage, `${pathName}/${uniqueName}`);
        const uploadTask = uploadBytesResumable(fileRef, file);

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress = Math.round(
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            );
            onProgress(progress);
          },
          (error) => {
            console.error("Storage upload error: ", error);
            const extraMsg = " (Catatan: Ini disebabkan limit Spark plan dari Firebase Storage Anda. Solusi: isi pengaturan Cloudinary pada panel atas di tab Manajemen Musik untuk solusi upload musik gratis 100% tanpa kartu kredit).";
            onError((error.message || "Gagal mengunggah file.") + extraMsg);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              onComplete(downloadURL);
            } catch (err: any) {
              onError(err?.message || "Gagal mendapatkan URL download.");
            }
          }
        );
      } catch (err: any) {
        onError(err?.message || "Terjadi kesalahan upload.");
      }
    }
  };

  const deleteSong = async (id: string) => {
    try {
      await deleteDoc(doc(db, "songs", id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `songs/${id}`);
    } finally {
      setConfirmAction(null);
    }
  };

  const handleAddSong = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfirmAction({
      type: "add",
      subType: "song",
      title: "Tambah Lagu",
      message: `Tambahkan "${newSong.title}" ke playlist?`,
      icon: Plus,
      confirmText: "Tambah",
      color: "bg-primary",
    });
  };

  const executeAddSong = async () => {
    try {
      await addDoc(collection(db, "songs"), {
        title: newSong.title,
        artist: newSong.artist,
        url: newSong.url,
        cover: newSong.cover || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=400",
        createdAt: serverTimestamp(),
      });
      setIsAddingSong(false);
      setNewSong({
        title: "",
        artist: "",
        url: "",
        cover: "",
      });
      setMusicUploadError(null);
    } catch (error: any) {
      console.error("Gagal menambah lagu: ", error);
      setMusicUploadError(`Gagal menambah lagu ke database: ${error?.message || String(error)}`);
    } finally {
      setConfirmAction(null);
    }
  };

  const executeEditSong = async () => {
    if (!editingSong) return;
    try {
      await setDoc(doc(db, "songs", editingSong.id), {
        title: editingSong.title,
        artist: editingSong.artist,
        url: editingSong.url,
        cover: editingSong.cover || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=400",
      }, { merge: true });
      setEditingSong(null);
      setMusicUploadErrorEdit(null);
    } catch (error: any) {
      console.error("Gagal update lagu: ", error);
      setMusicUploadErrorEdit(`Gagal memperbarui lagu di database: ${error?.message || String(error)}`);
    } finally {
      setConfirmAction(null);
    }
  };

  const handleEditSongSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSong) return;
    setConfirmAction({
      type: "save",
      subType: "song",
      id: editingSong.id,
      title: "Simpan Perubahan Lagu",
      message: `Simpan perubahan untuk lagu "${editingSong.title}"?`,
      icon: Edit3,
      confirmText: "Simpan",
      color: "bg-primary",
    });
  };

  return (
    <div className="relative min-h-screen">
      <div className="space-y-12 pb-20">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <h1 className="text-4xl font-heading font-bold text-slate-900 dark:text-white tracking-tight">
              Admin Control
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Kelola operasional FinTag dalam satu dashboard terpadu.
            </p>
          </div>
          <div className="flex gap-2">
            {activeTab === "products" && (
              <button
                onClick={handleOpenAddProduct}
                className="px-6 py-3 bg-primary text-white rounded-2xl text-sm font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Produk</span>
              </button>
            )}
            {activeTab === "music" && (
              <button
                onClick={() => {
                  setIsAddingSong(true);
                  setNewSong({ title: "", artist: "", url: "", cover: "" });
                  setSongCoverSource("url");
                  setSongAudioSource("url");
                  setMusicUploadError(null);
                }}
                className="px-6 py-3 bg-primary text-white rounded-2xl text-sm font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Musik</span>
              </button>
            )}
          </div>
        </div>

        {/* Analytics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatItem
            label="Revenue"
            value={formatRupiah(totalRevenue)}
            icon={TrendingUp}
            trend="+12% bulan ini"
          />
          <StatItem
            label="Total Pesanan"
            value={orders.length.toString()}
            icon={ShoppingBag}
            trend="+5 hari ini"
          />
          <StatItem
            label="Total Produk"
            value={products.length.toString()}
            icon={Package}
            trend="Active"
          />
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Nav */}
          <div className="lg:col-span-1 space-y-4">
            {/* Admin User Info Card */}
            {user && (
              <div className="bg-white/80 dark:bg-slate-900/60 p-5 rounded-[30px] border border-slate-100 dark:border-white/5 shadow-sm space-y-2.5 select-none text-left">
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block font-sans text-left">
                  Sedang Masuk Sebagai
                </span>
                <div className="truncate text-left">
                  <p
                    className="text-xs sm:text-sm font-bold text-slate-850 dark:text-slate-200 truncate font-sans text-left"
                    title={user.email || ""}
                  >
                    {user.email || "Admin FinTag"}
                  </p>
                  <span
                    className={cn(
                      "inline-block mt-1 text-[8px] font-black uppercase px-2 py-0.5 rounded tracking-wide font-mono",
                      isSuperAdmin
                        ? "bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
                        : "bg-emerald-100 text-emerald-600 dark:bg-emerald-955/40 dark:text-emerald-400",
                    )}
                  >
                    {isSuperAdmin ? "Super Admin Utama" : "Sub Admin"}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "w-full flex items-center gap-4 px-6 py-4 rounded-3xl transition-all font-bold cursor-pointer",
                    activeTab === tab.id
                      ? "bg-secondary dark:bg-primary text-white shadow-xl shadow-secondary/10 dark:shadow-primary/20"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50",
                  )}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="border-t border-slate-100 dark:border-white/5 pt-4">
              <button
                type="button"
                onClick={() => {
                  setConfirmAction({
                    type: "logout",
                    subType: "logout",
                    title: "Konfirmasi Keluar",
                    message: "Apakah Anda yakin ingin keluar dari panel admin?",
                    icon: LogOut,
                    confirmText: "Keluar",
                    color: "bg-rose-500 shadow-rose-500/15",
                  });
                }}
                className="w-full flex items-center gap-4 px-6 py-4 rounded-3xl transition-all font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer select-none"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3 space-y-8 min-w-0">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-[40px] border border-white dark:border-white/5 p-4 sm:p-8 shadow-xl min-h-[500px] overflow-hidden bg-white/40 dark:bg-slate-900/40"
            >
              {activeTab === "orders" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center px-2 sm:px-0">
                    <h3 className="text-lg sm:text-xl font-heading font-bold dark:text-white">
                      Daftar Pesanan
                    </h3>
                  </div>

                  <div className="overflow-x-auto -mx-4 sm:-mx-8 px-4 sm:px-8">
                    <table className="w-full text-left min-w-[750px] hidden sm:table border-collapse">
                      <thead className="border-b border-slate-100 dark:border-white/5">
                        <tr className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                          <th className="pb-4 px-4 font-bold w-[30px]"></th>
                          <th className="pb-4 px-4 font-bold">
                            Penerima & Kontak
                          </th>
                          <th className="pb-4 px-4 font-bold">
                            Produk & Detail Bentuk
                          </th>
                          <th className="pb-4 px-4 font-bold text-center">
                            Qty
                          </th>
                          <th className="pb-4 px-4 font-bold">Status</th>
                          <th className="pb-4 px-4 font-bold font-sans">
                            Total Harga
                          </th>
                          <th className="pb-4 px-1 font-bold text-right">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-white/5 transition-colors font-sans">
                        {orders.length === 0 ? (
                          <tr>
                            <td
                              colSpan={7}
                              className="py-20 text-center text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest opacity-40"
                            >
                              Belum ada log pesanan
                            </td>
                          </tr>
                        ) : (
                          orders.map((order) => {
                            const isExpanded = !!expandedOrders[order.id];
                            const qty = order.quantity || 1;
                            const prodName = order.productName || "Ganci Custom";
                            const shape = (() => {
                              if (order.bentukGanci) return order.bentukGanci;
                              if (order.notes && order.notes.includes("Bentuk Akrilik:")) {
                                const match = order.notes.match(/Bentuk Akrilik:\s*([^.,\n]+)/);
                                if (match) return match[1].trim();
                              }
                              return "Persegi (Square)";
                            })();
                            const prodType = order.productType || ((order.productId?.includes("custom") || order.productName?.toLowerCase().includes("custom")) ? "Custom" : "Standard");
                            const cType = (() => {
                              if (order.customType && order.customType !== "-") return order.customType;
                              if (order.notes && order.notes.includes("Jenis Custom:")) {
                                const match = order.notes.match(/Jenis Custom:\s*([^.\n]+)/);
                                if (match) return match[1].trim();
                              }
                              return null;
                            })();
                            const cleanPhone = (() => {
                              const cleaned = (order.whatsapp || "").replace(/\D/g, "");
                              if (cleaned.startsWith("0")) {
                                return "62" + cleaned.slice(1);
                              }
                              return cleaned;
                            })();
                            const formattedDate = (() => {
                              try {
                                if (!order.date) return "-";
                                const d = new Date(order.date);
                                return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) + " WIB";
                              } catch (e) {
                                return order.date || "-";
                              }
                            })();

                            const toggleExpandOrder = (id: string, e?: React.MouseEvent) => {
                              e?.stopPropagation();
                              setExpandedOrders((prev) => ({ ...prev, [id]: !prev[id] }));
                            };

                            return (
                              <React.Fragment key={order.id}>
                                <tr
                                  onClick={() => toggleExpandOrder(order.id)}
                                  className={cn(
                                    "group transition-colors text-sm cursor-pointer select-none",
                                    isExpanded
                                      ? "bg-slate-50 dark:bg-slate-800/60"
                                      : "hover:bg-slate-100/70 dark:hover:bg-slate-800/40"
                                  )}
                                >
                                  <td className="py-4 px-4 text-center">
                                    <button
                                      type="button"
                                      onClick={(e) => toggleExpandOrder(order.id, e)}
                                      className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 focus:outline-none transition-all cursor-pointer"
                                    >
                                      {isExpanded ? (
                                        <ChevronUp className="w-4 h-4 text-purple-500" />
                                      ) : (
                                        <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-white" />
                                      )}
                                    </button>
                                  </td>
                                  <td className="py-4 px-4">
                                    <p className="font-extrabold text-slate-900 dark:text-white">{order.name}</p>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <a
                                        href={cleanPhone ? `https://wa.me/${cleanPhone}` : "#"}
                                        target="_blank"
                                        rel="noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="flex items-center gap-1 text-[11px] font-black text-emerald-600 dark:text-emerald-400 hover:underline bg-emerald-500/10 px-2 py-0.5 rounded-md text-left"
                                      >
                                        <MessageCircle className="w-3 h-3 text-emerald-500 stroke-[3]" />
                                        <span>{order.whatsapp}</span>
                                        <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                                      </a>
                                    </div>
                                    <p className="text-[10px] text-slate-400 dark:text-slate-505 mt-1">{formattedDate}</p>
                                  </td>
                                  <td className="py-4 px-4">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-slate-900 dark:text-white">{prodName}</span>
                                      <span className={cn(
                                        "px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider",
                                        prodType === "Custom"
                                          ? "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200/30"
                                          : "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200/30"
                                      )}>
                                        {prodType}
                                      </span>
                                    </div>
                                    {cType && (
                                      <span className="block text-[11px] text-purple-600 dark:text-purple-400 font-semibold mt-0.5">
                                        ({cType})
                                      </span>
                                    )}
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                                      <Layers className="w-3 h-3" />
                                      <span>Bentuk: <strong>{shape}</strong></span>
                                    </p>
                                  </td>
                                  <td className="py-4 px-4 text-center">
                                    <span className="inline-block bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2.5 py-1 rounded-xl text-xs font-black">
                                      {qty} pcs
                                    </span>
                                  </td>
                                  <td className="py-4 px-4">
                                    <div
                                      className={cn(
                                        "inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all",
                                        order.status === "selesai" ? "bg-green-100 text-green-600 dark:bg-green-950/30 dark:text-green-400" :
                                        order.status === "dibatalkan" ? "bg-rose-100 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400" :
                                        "bg-amber-100 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400"
                                      )}
                                    >
                                      {order.status || "pending"}
                                    </div>
                                  </td>
                                  <td className="py-4 px-4 font-extrabold text-slate-900 dark:text-white">
                                    {formatRupiah(order.totalPrice)}
                                    {qty > 1 && order.unitPrice && (
                                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-normal font-sans">
                                        {formatRupiah(order.unitPrice)}/pcs
                                      </p>
                                    )}
                                  </td>
                                  <td className="py-4 px-4 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                                    {order.status !== "selesai" && (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); toggleStatus(order.id, order.status); }}
                                        className="p-2 text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 hover:scale-115 active:scale-95 transition-all cursor-pointer inline-flex items-center"
                                        title="Tandai Selesai"
                                      >
                                        <CheckCircle2 className="w-4 h-4" />
                                      </button>
                                    )}
                                    <button onClick={(e) => { e.stopPropagation(); setEditingOrder(order); }} className="p-2 text-slate-400 hover:text-purple-500 cursor-pointer hover:scale-115 active:scale-90 transition-all duration-200">
                                      <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); setConfirmAction({ id: order.id, type: "delete", subType: "order", name: order.name, title: "Hapus Pesanan", message: `Hapus log pesanan ${order.name}?`, icon: Trash2, confirmText: "Hapus", color: "bg-rose-500" }); }} className="p-2 text-slate-400 hover:text-rose-500 cursor-pointer hover:scale-115 active:scale-90 transition-all duration-200">
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                                {isExpanded && (
                                  <tr className="bg-slate-50/50 dark:bg-slate-950/20">
                                    <td></td>
                                    <td colSpan={6} className="py-4 px-6 text-left border-t border-slate-100 dark:border-white/5">
                                      <div className="bg-white dark:bg-slate-900 border border-slate-150/50 dark:border-white/10 rounded-2xl p-4 shadow-sm space-y-4">
                                        <div className="flex flex-wrap gap-4 justify-between items-start">
                                          <div className="space-y-1">
                                            <span className="text-[9px] font-black uppercase text-purple-500 tracking-wider flex items-center gap-1">
                                              <Info className="w-3 h-3 text-purple-500" />
                                              Detail Desain & Custom
                                            </span>
                                            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium whitespace-pre-wrap leading-relaxed">
                                              {order.designDetails || order.notes || "Tidak ada detail desain khusus."}
                                            </p>
                                          </div>
                                        </div>
                                        {order.userNotes && (
                                          <div className="pt-2 border-t border-slate-100 dark:border-white/5 space-y-1">
                                            <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-505 tracking-wider">
                                              Catatan dari Pembeli
                                            </span>
                                            <p className="text-xs text-slate-600 dark:text-slate-440 italic font-mono bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-100 dark:border-white/5">
                                              "{order.userNotes}"
                                            </p>
                                          </div>
                                        )}
                                        <div className="flex gap-2 pt-2">
                                          <a
                                            href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Halo ${order.name}, saya admin FinTag terkait pesanan gantungan kunci Anda...`)}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-2 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
                                          >
                                            <MessageCircle className="w-4 h-4" />
                                            Hubungi via WhatsApp
                                          </a>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })
                        )}
                      </tbody>
                    </table>

                    <div className="flex flex-col gap-4 sm:hidden pb-10 font-sans">
                      {orders.length === 0 ? (
                        <div className="py-20 text-center text-slate-400 dark:text-slate-505 font-bold uppercase tracking-widest opacity-40">
                          Belum ada log pesanan
                        </div>
                      ) : (
                        orders.map((order) => {
                          const qty = order.quantity || 1;
                          const prodName = order.productName || "Ganci Custom";
                          const shape = (() => {
                            if (order.bentukGanci) return order.bentukGanci;
                            if (order.notes && order.notes.includes("Bentuk Akrilik:")) {
                              const match = order.notes.match(/Bentuk Akrilik:\s*([^.,\n]+)/);
                              if (match) return match[1].trim();
                            }
                            return "Persegi (Square)";
                          })();
                          const prodType = order.productType || ((order.productId?.includes("custom") || order.productName?.toLowerCase().includes("custom")) ? "Custom" : "Standard");
                          const cType = (() => {
                            if (order.customType && order.customType !== "-") return order.customType;
                            if (order.notes && order.notes.includes("Jenis Custom:")) {
                              const match = order.notes.match(/Jenis Custom:\s*([^.\n]+)/);
                              if (match) return match[1].trim();
                            }
                            return null;
                          })();
                          const cleanPhone = (() => {
                            const cleaned = (order.whatsapp || "").replace(/\D/g, "");
                            if (cleaned.startsWith("0")) {
                              return "62" + cleaned.slice(1);
                            }
                            return cleaned;
                          })();
                          const formattedDate = (() => {
                            try {
                              if (!order.date) return "-";
                              const d = new Date(order.date);
                              return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) + " WIB";
                            } catch (e) {
                              return order.date || "-";
                            }
                          })();
                          const isExpanded = !!expandedOrders[order.id];

                          const toggleExpandOrder = (id: string) => {
                            setExpandedOrders((prev) => ({ ...prev, [id]: !prev[id] }));
                          };

                          return (
                            <div
                              key={order.id}
                              className="p-5 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-white/5 space-y-4 text-left"
                            >
                              <div className="flex justify-between items-start gap-2">
                                <div className="space-y-0.5 text-left">
                                  <p className="font-extrabold text-slate-900 dark:text-white leading-tight">
                                    {order.name}
                                  </p>
                                  <p className="text-[10px] text-slate-405 dark:text-slate-500">
                                    {formattedDate}
                                  </p>
                                </div>
                                <div
                                  className={cn(
                                    "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase shrink-0 tracking-wider",
                                    order.status === "selesai"
                                      ? "bg-green-150/80 text-green-600 dark:bg-green-950/30 dark:text-green-400"
                                      : order.status === "dibatalkan"
                                        ? "bg-rose-150/80 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400"
                                        : "bg-amber-150/80 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400",
                                  )}
                                >
                                  {order.status || "pending"}
                                </div>
                              </div>

                              <div className="bg-white dark:bg-slate-950/50 p-3 rounded-2xl border border-slate-150/40 dark:border-white/5 text-xs space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="font-extrabold text-slate-900 dark:text-white text-xs">
                                    {prodName}
                                  </span>
                                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2.5 py-0.5 rounded-lg text-[10px] font-black shrink-0 font-mono">
                                    {qty} pcs
                                  </span>
                                </div>

                                <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                                  <p className="flex justify-between">
                                    <span>Tipe Ganci:</span>
                                    <span className="font-extrabold text-purple-600 dark:text-purple-400">
                                      {prodType} {cType ? `(${cType})` : ""}
                                    </span>
                                  </p>
                                  <p className="flex justify-between">
                                    <span>Bentuk:</span>
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                                      {shape}
                                    </span>
                                  </p>
                                </div>

                                {isExpanded && (
                                  <div className="pt-2 border-t border-slate-100 dark:border-white/5 space-y-2 text-[11px]">
                                    <p className="text-slate-400 uppercase font-black tracking-wider text-[8px]">
                                      Detail Desain & Custom:
                                    </p>
                                    <p className="text-slate-700 dark:text-slate-300 font-medium whitespace-pre-wrap leading-relaxed">
                                      {order.designDetails || order.notes || "Tidak ada detail desain khusus."}
                                    </p>

                                    {order.userNotes && (
                                      <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-150/40 dark:border-whites/5 space-y-1 text-left">
                                        <p className="text-slate-400 uppercase font-black tracking-wider text-[8px]">
                                          Catatan Pembeli:
                                        </p>
                                        <p className="text-slate-600 dark:text-slate-400 italic">
                                          "{order.userNotes}"
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}

                                <button
                                  type="button"
                                  onClick={() => toggleExpandOrder(order.id)}
                                  className="w-full text-center py-1 mt-1 text-[10px] uppercase font-black text-purple-600 dark:text-purple-400 flex items-center justify-center gap-1 cursor-pointer select-none"
                                >
                                  <span>
                                    {isExpanded ? "Tutup Rincian" : "Lihat Rincian Selengkapnya"}
                                  </span>
                                  {isExpanded ? (
                                    <ChevronUp className="w-3 h-3 text-purple-500" />
                                  ) : (
                                    <ChevronDown className="w-3 h-3 text-slate-400" />
                                  )}
                                </button>
                              </div>

                              <div className="flex flex-col gap-2 pt-1 border-t border-slate-100 dark:border-white/5">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-slate-400">Total Harga:</span>
                                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                                    {formatRupiah(order.totalPrice)}
                                  </span>
                                </div>

                                <div className="flex gap-2 w-full pt-1">
                                  <a
                                    href={cleanPhone ? `https://wa.me/${cleanPhone}` : "#"}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex-1 py-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer hover:bg-emerald-500/20 active:scale-95 transition-all text-left"
                                  >
                                    <MessageCircle className="w-4 h-4 text-emerald-500 stroke-[2.5]" />
                                    <span>WhatsApp</span>
                                  </a>

                                  <button
                                    onClick={() => toggleStatus(order.id, order.status)}
                                    className="p-2.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-xl hover:bg-emerald-500 hover:text-white active:scale-95 transition-all shrink-0 cursor-pointer"
                                    title="Selesai"
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => setEditingOrder(order)}
                                    className="p-2.5 bg-primary/10 text-primary dark:text-purple-400 rounded-xl hover:bg-primary hover:text-white active:scale-95 transition-all shrink-0 cursor-pointer"
                                    title="Edit"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      setConfirmAction({
                                        id: order.id,
                                        type: "delete",
                                        subType: "order",
                                        name: order.name,
                                        title: "Hapus Pesanan",
                                        message: `Hapus log pesanan ${order.name}?`,
                                        icon: Trash2,
                                        confirmText: "Hapus",
                                        color: "bg-rose-500",
                                      })
                                    }
                                    className="p-2.5 bg-rose-500/10 text-rose-550 rounded-xl hover:bg-rose-500 hover:text-white active:scale-95 transition-all shrink-0 cursor-pointer"
                                    title="Hapus"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "products" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 dark:border-white/5 pb-4 w-full">
                      <div className="text-left">
                        <h3 className="text-xl font-heading font-bold dark:text-white font-sans text-left">
                          Katalog Produk Shop
                        </h3>
                        <p className="text-xs text-slate-400 text-left mt-0.5 font-sans">
                          Pilih kategori untuk melihat dan mengelola katalog
                          produk.
                        </p>
                      </div>

                      <div className="flex flex-wrap bg-slate-105 dark:bg-slate-800/80 p-1 rounded-2xl self-start gap-1 font-sans text-xs shrink-0 select-none border border-slate-200/50 dark:border-white/5">
                        <button
                          onClick={() => setProductSubTab("standard")}
                          type="button"
                          className={cn(
                            "px-4 py-2 text-xs font-bold rounded-xl cursor-pointer select-none transition-all",
                            productSubTab === "standard"
                              ? "bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white font-extrabold"
                              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300",
                          )}
                        >
                          Ganci Standar (
                          {
                            products.filter(
                              (p) => !p.type || p.type === "standard",
                            ).length
                          }
                          )
                        </button>
                        <button
                          onClick={() => setProductSubTab("custom-formal")}
                          type="button"
                          className={cn(
                            "px-4 py-2 text-xs font-bold rounded-xl cursor-pointer select-none transition-all",
                            productSubTab === "custom-formal"
                              ? "bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white font-extrabold"
                              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300",
                          )}
                        >
                          Custom Formal (
                          {
                            products.filter(
                              (p) =>
                                p.type === "custom" && p.subtype === "formal",
                            ).length
                          }
                          )
                        </button>
                        <button
                          onClick={() => setProductSubTab("custom-template")}
                          type="button"
                          className={cn(
                            "px-4 py-2 text-xs font-bold rounded-xl cursor-pointer select-none transition-all",
                            productSubTab === "custom-template"
                              ? "bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white font-extrabold"
                              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300",
                          )}
                        >
                          Custom Template (
                          {
                            products.filter(
                              (p) =>
                                p.type === "custom" && p.subtype === "template",
                            ).length
                          }
                          )
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    {(productSubTab === "standard"
                      ? products.filter(
                          (p: any) => !p.type || p.type === "standard",
                        )
                      : productSubTab === "custom-formal"
                        ? products.filter(
                            (p: any) =>
                              p.type === "custom" && p.subtype === "formal",
                          )
                        : products.filter(
                            (p: any) =>
                              p.type === "custom" && p.subtype === "template",
                          )
                    ).map((p) => (
                      <div
                        key={p.id}
                        className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-white/5"
                      >
                        <img
                          src={p.image}
                          className="w-16 h-16 rounded-xl object-cover bg-slate-200 dark:bg-slate-800"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-bold truncate dark:text-white">
                              {p.name}
                            </p>
                            <span
                              className={cn(
                                "text-[8px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wide shrink-0",
                                p.type === "custom"
                                  ? "bg-purple-100 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400"
                                  : "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
                              )}
                            >
                              {p.type === "custom"
                                ? p.subtype === "template"
                                  ? "Custom Template"
                                  : "Custom Formal"
                                : "Standar"}
                            </span>
                          </div>
                          <p className="text-primary font-bold text-xs">
                            {formatRupiah(p.price)}
                          </p>
                        </div>
                        <div className="flex gap-1 self-start">
                          <button
                            onClick={() => setEditingProduct(p)}
                            className="p-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:text-primary border border-slate-100 dark:border-white/10 cursor-pointer hover:scale-115 active:scale-90 transition-all duration-200"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              setConfirmAction({
                                id: p.id,
                                type: "delete",
                                subType: "product",
                                name: p.name,
                                title: "Hapus Produk",
                                message: `Hapus "${p.name}" dari katalog?`,
                                icon: Trash2,
                                confirmText: "Hapus",
                                color: "bg-rose-500",
                              })
                            }
                            className="p-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:text-rose-500 border border-slate-100 dark:border-white/10 cursor-pointer hover:scale-115 active:scale-90 transition-all duration-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "music" && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="border-b border-slate-100 dark:border-white/5 pb-4 text-left">
                    <h3 className="text-xl font-heading font-bold dark:text-white font-sans text-left">
                      Daftar Playlist Musik Mahasiswa
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 font-sans text-left">
                      Tambahkan, sunting, atau hapus lagu yang dapat didengarkan oleh pengguna di Music Player.
                    </p>
                  </div>

                  {/* Cloudinary Integration settings card */}
                  <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-white/5 rounded-3xl p-5 md:p-6 text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-2xl shrink-0 mt-0.5">
                          <Music className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                            Solusi Upload Gratis (Cloudinary Direct Integration)
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed max-w-2xl">
                            Karena Firebase Storage membutuhkan upgrade berbayar (Blaze Plan), gunakan Cloudinary gratis untuk upload MP3 dan Cover kustom secara direct dari browser Anda dengan aman dan lancar.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowCloudinaryPanel(!showCloudinaryPanel)}
                        className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer select-none transition-all mr-auto sm:mr-0 shrink-0"
                      >
                        {showCloudinaryPanel ? "Sembunyikan" : "Buka Pengaturan"}
                      </button>
                    </div>

                    {showCloudinaryPanel && (
                      <div className="mt-5 pt-5 border-t border-slate-200/60 dark:border-white/5 space-y-4">
                        <form onSubmit={handleSaveCloudinary} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block pl-1">
                              Cloud Name
                            </label>
                            <input
                              type="text"
                              value={cloudNameInput}
                              onChange={(e) => setCloudNameInput(e.target.value)}
                              placeholder="Contoh: dxyz9876"
                              required
                              className="w-full bg-white dark:bg-slate-800 p-3.5 rounded-xl text-xs outline-none dark:text-white border border-slate-200 dark:border-white/10 focus:border-purple-500 font-sans"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block pl-1">
                              Upload Preset (Unsigned)
                            </label>
                            <input
                              type="text"
                              value={uploadPresetInput}
                              onChange={(e) => setUploadPresetInput(e.target.value)}
                              placeholder="Contoh: ml_default"
                              required
                              className="w-full bg-white dark:bg-slate-800 p-3.5 rounded-xl text-xs outline-none dark:text-white border border-slate-200 dark:border-white/10 focus:border-purple-500 font-sans"
                            />
                          </div>

                          <div className="md:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                            <button
                              type="button"
                              onClick={() => setShowCloudinaryHelp(!showCloudinaryHelp)}
                              className="text-xs text-purple-600 dark:text-purple-400 font-bold hover:underline inline-flex items-center gap-1.5 cursor-pointer text-left"
                            >
                              <Info className="w-3.5 h-3.5" />
                              <span>{showCloudinaryHelp ? "Sembunyikan Panduan" : "Cara Dapatkan Cloud Name & Preset (Ikuti Panduan Ini!)"}</span>
                            </button>

                            <button
                              type="submit"
                              className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all select-none w-full sm:w-auto text-center"
                            >
                              Simpan Pengaturan
                            </button>
                          </div>
                        </form>

                        {cloudinarySuccessMsg && (
                          <div className="p-3.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-medium">
                            {cloudinarySuccessMsg}
                          </div>
                        )}

                        {showCloudinaryHelp && (
                          <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-white/5 space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed text-left">
                            <h5 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 text-sm">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                              Langkah Langkah Konfigurasi Cloudinary (100% Gratis & Unlimited):
                            </h5>
                            <ol className="list-decimal pl-5 space-y-2">
                              <li>
                                Silakan daftar atau masuk ke akun Anda di <a href="https://cloudinary.com" target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 font-bold hover:underline inline-flex items-center gap-0.5">cloudinary.com <ExternalLink className="w-3 h-3" /></a> (Pilih akun gratis, tidak perlu kartu kredit).
                              </li>
                              <li>
                                Pada tampilan halaman utama (Dashboard), salin kode <strong>Cloud Name</strong> Anda yang tertera di sana.
                              </li>
                              <li>
                                Klik ikon <strong>Settings (ikon roda gigi / gear di pojok kiri paling bawah)</strong>.
                              </li>
                              <li>
                                Pilih menu <strong>Upload</strong> pada kolom bagian kiri.
                              </li>
                              <li>
                                Scroll layar Anda ke paling bawah hingga bagian <strong>"Upload presets"</strong>, lalu klik tulisan link biru <strong>"Add upload preset"</strong>.
                              </li>
                              <li>
                                Ganti nilai kolom <strong>Signing Mode</strong> yang awalnya "Signed" menjadi <strong>"Unsigned"</strong> (Sangat penting!).
                              </li>
                              <li>
                                Salin string nama <strong>Upload preset name</strong> (misal: `qwert1234` atau bisa Anda ubah menjadi gampang seperti `ml_default`).
                              </li>
                              <li>
                                Klik tombol <strong>"Save"</strong> di pojok kanan atas Cloudinary Anda untuk menyimpan preset tersebut.
                              </li>
                              <li>
                                Masukkan <strong>Cloud Name</strong> dan <strong>Upload Preset</strong> tersebut pada kolom di dashboard ini, lalu klik <strong>"Simpan Pengaturan"</strong>.
                              </li>
                            </ol>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 italic mt-1 font-sans">
                              *Sekarang Anda akan dapat mengunduh dan memilih file dari lokal storage laptop/hp Anda dan langsung terupload instan ke Cloudinary tanpa lemot atau stuck 0%!
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {songs.length === 0 ? (
                    <div className="text-center py-12 bg-white/50 dark:bg-slate-900/40 rounded-3xl border border-dashed border-slate-200 dark:border-white/10 p-6">
                      <Music className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Belum Ada Lagu Kustom</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        Semua lagu yang sedang diputar berasal dari preset lokal (The Script, Bruno Mars). Tambahkan lagu kustom pertama Anda!
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {songs.map((song) => (
                        <div 
                          key={song.id}
                          className="flex items-center gap-4 p-4 bg-white/80 dark:bg-slate-900/60 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm text-left"
                        >
                          <img 
                            src={song.cover} 
                            referrerPolicy="no-referrer"
                            className="w-16 h-16 rounded-2xl object-cover border border-slate-100 dark:border-white/5 bg-slate-100 shrink-0"
                            onError={(e) => (e.currentTarget.src = 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=200')}
                          />
                          <div className="flex-1 min-w-0 text-left">
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{song.title}</h4>
                            <p className="text-xs text-slate-450 dark:text-slate-400 font-bold uppercase tracking-wider truncate mt-0.5">{song.artist}</p>
                            <span className="inline-block mt-1.5 text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary dark:bg-primary/20">
                              Kustom Database
                            </span>
                          </div>
                          <div className="flex gap-1.5 shrink-0">
                            <button
                              onClick={() => {
                                setEditingSong(song);
                                setSongCoverSourceEdit(song.cover && song.cover.startsWith("data:") ? "file" : "url");
                                setSongAudioSourceEdit(song.url && song.url.startsWith("data:") ? "file" : "url");
                              }}
                              className="p-2.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:text-primary hover:border-primary/50 border border-slate-100 dark:border-white/10 cursor-pointer hover:scale-105 active:scale-95 transition-all"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                setConfirmAction({
                                  id: song.id,
                                  type: "delete",
                                  subType: "song",
                                  name: song.title,
                                  title: "Hapus Lagu",
                                  message: `Hapus "${song.title}" dari playlist?`,
                                  icon: Trash2,
                                  confirmText: "Hapus",
                                  color: "bg-rose-500",
                                })
                              }
                              className="p-2.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:text-rose-500 border border-slate-100 dark:border-white/10 cursor-pointer hover:scale-105 active:scale-95 transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "admins" && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="border-b border-slate-100 dark:border-white/5 pb-4 text-left">
                    <h3 className="text-xl font-heading font-bold dark:text-white font-sans text-left">
                      Kelola Administrator Tambahan
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 font-sans text-left">
                      Daftarkan alamat email rekan Anda agar mereka juga dapat
                      masuk dan mengakses panel admin ini secara mandiri.
                    </p>
                  </div>

                  {adminError && (
                    <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-2xl p-4 text-left text-xs font-bold text-rose-500 font-sans">
                      {adminError}
                    </div>
                  )}

                  {/* Add Admin Form */}
                  {!isSuperAdmin ? (
                    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-2xl p-4 text-left text-xs text-amber-700 dark:text-amber-400 font-medium font-sans flex items-start gap-3 mb-4">
                      <span className="text-base select-none mt-0.5">⚠️</span>
                      <span>
                        <strong>Mode Lihat-Saja:</strong> Hanya Super Admin
                        Utama (<strong>mhdalfinaja@mhs.unimed.ac.id</strong>)
                        yang memiliki wewenang untuk menambah atau menghapus
                        administrator tambahan.
                      </span>
                    </div>
                  ) : (
                    <form
                      onSubmit={handleAddAdmin}
                      className="flex flex-col sm:flex-row gap-3"
                    >
                      <input
                        type="email"
                        placeholder="Masukkan email rekan admin (contoh: rekan@gmail.com)..."
                        required
                        value={newAdminEmail}
                        onChange={(e) => setNewAdminEmail(e.target.value)}
                        className="flex-1 bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl outline-none dark:text-white text-sm border border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-1 focus:ring-primary transition-all font-sans"
                      />
                      <button
                        type="submit"
                        className="px-6 py-4 bg-primary text-white rounded-2xl text-sm font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
                      >
                        Tambah Admin
                      </button>
                    </form>
                  )}

                  {/* Admin List */}
                  <div className="space-y-3 pt-4 text-left">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider block text-left">
                      Hak Akses Terdaftar
                    </h4>
                    <div className="divide-y divide-slate-100 dark:divide-white/5 space-y-2">
                      {/* Super Admin / Primary Admin Row (always displayed) */}
                      <div className="py-4 flex justify-between items-center bg-slate-100/50 dark:bg-slate-800/40 p-4 rounded-xl">
                        <div className="text-left">
                          <p className="text-sm font-bold text-slate-900 dark:text-white font-sans text-left">
                            mhdalfinaja@mhs.unimed.ac.id
                          </p>
                          <span className="inline-block mt-1 text-[8px] bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400 font-black uppercase px-2 py-0.5 rounded tracking-wider font-mono">
                            Super Admin Utama
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-bold px-3">
                          Sistem
                        </span>
                      </div>

                      {/* Dynamic Sub Admins */}
                      {adminEmailsList.length === 0 ? (
                        <p className="text-xs text-slate-400 py-6 text-center font-bold font-sans">
                          Belum ada administrator tambahan yang didaftarkan.
                        </p>
                      ) : (
                        adminEmailsList.map((adm: any) => (
                          <div
                            key={adm.id}
                            className="py-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/20 px-4 rounded-xl transition-colors"
                          >
                            <div className="text-left">
                              <p className="text-sm font-bold text-slate-900 dark:text-white font-sans text-left">
                                {adm.id}
                              </p>
                              <span className="inline-block mt-1 text-[8px] bg-primary/10 text-primary dark:bg-primary/20 dark:text-slate-200 font-black uppercase px-2 py-0.5 rounded tracking-wider">
                                Sub Admin
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                isSuperAdmin
                                  ? handleRemoveAdmin(adm.id)
                                  : setAdminError(
                                      "Gagal: Hanya Super Admin Utama yang memiliki izin untuk menghapus akun admin lain.",
                                    )
                              }
                              className={cn(
                                "p-2 text-slate-400 dark:text-slate-500 transition-colors",
                                isSuperAdmin
                                  ? "hover:text-rose-500 cursor-pointer hover:scale-115 active:scale-95"
                                  : "opacity-30 cursor-not-allowed",
                              )}
                              title={
                                isSuperAdmin
                                  ? "Cabut Akses Admin"
                                  : "Dilindungi (Hanya Super Admin Utama)"
                              }
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "feedback" && (
                <div className="space-y-6 animate-fadeIn text-left">
                  <div className="border-b border-slate-100 dark:border-white/5 pb-4">
                    <h3 className="text-xl font-heading font-bold dark:text-white font-sans text-left">
                      Masukan & Feedback Pengguna
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 font-sans text-left">
                      Berikut adalah kritik, saran, pesan, dan laporan bug yang dikirimkan oleh pengguna secara real-time langsung melalui halaman Hubungi Dev.
                    </p>
                  </div>

                  {feedbacks.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50/50 dark:bg-slate-800/20 border border-dashed border-slate-200 dark:border-white/5 rounded-3xl p-6">
                      <MessageCircle className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                      <p className="text-sm text-slate-450 dark:text-slate-500 font-bold font-sans">
                        Belum ada masukan yang terkirim dari pengguna ke database.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                      {[...feedbacks].reverse().map((item) => (
                        <div
                          key={item.id}
                          className="bg-slate-50 dark:bg-slate-800/20 border border-slate-200/50 dark:border-white/5 rounded-3xl p-6 text-left relative transition-all hover:border-slate-350 dark:hover:border-white/10"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-150 dark:border-white/5 pb-3 mb-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={cn(
                                "px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider",
                                item.category === "Appreciation" 
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                                  : item.category === "Bug" 
                                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400" 
                                    : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                              )}>
                                {item.category === "Appreciation" ? "🌸 Kesan Pesan" : item.category === "Bug" ? "🐛 Bug" : item.category === "Feedback" ? "⚠️ Saran" : "💡 Lainnya"}
                              </span>
                              <span className="text-xs font-bold text-slate-400 font-mono">
                                {item.timestamp}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {/* Rating stars if available */}
                              {item.rating && (
                                <div className="flex">
                                  {[...Array(Number(item.rating) || 5)].map((_, idx) => (
                                    <svg key={idx} className="w-4 h-4 text-amber-500 fill-amber-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                    </svg>
                                  ))}
                                </div>
                              )}
                              
                              {deletePendingId === item.id ? (
                                <div className="flex items-center gap-1.5 animate-pulse bg-rose-50 dark:bg-rose-950/20 p-1 px-2 rounded-xl border border-rose-200 dark:border-rose-905/30">
                                  <span className="text-[10px] text-rose-500 dark:text-rose-400 font-bold font-sans">Yakin hapus?</span>
                                  <button
                                    onClick={() => handleDeleteFeedback(item.id)}
                                    className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[9px] font-black cursor-pointer font-sans"
                                  >
                                    Ya
                                  </button>
                                  <button
                                    onClick={() => setDeletePendingId(null)}
                                    className="px-2 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-300 rounded-lg text-[9px] font-bold cursor-pointer font-sans"
                                  >
                                    Batal
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setDeletePendingId(item.id)}
                                  className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                                  title="Hapus Masukan"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h4 className="font-extrabold text-slate-800 dark:text-white text-base">
                              {item.subject}
                            </h4>
                            <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed bg-white/50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                              {item.message}
                            </p>
                            <div className="text-xs font-bold text-slate-505 dark:text-slate-400 pt-1 flex items-center gap-1.5">
                              <span className="font-sans">Dikirim oleh:</span>
                              <span className="text-indigo-600 dark:text-indigo-400 font-black font-sans">{item.name || "Anonim"}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

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
              className="relative w-full max-w-sm glass p-8 rounded-[40px] border border-white dark:border-white/10 bg-white dark:bg-slate-900 shadow-2xl space-y-6 text-center"
            >
              <div
                className={cn(
                  "w-20 h-20 rounded-3xl flex items-center justify-center mx-auto border transition-all",
                  confirmAction.type === "delete" ||
                    confirmAction.type === "logout"
                    ? "bg-rose-50 dark:bg-rose-900/30 border-rose-100 dark:border-rose-900/20 text-rose-500"
                    : "bg-primary/10 dark:bg-primary/20 border-primary/20 dark:border-primary/20 text-primary",
                )}
              >
                <confirmAction.icon className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-heading font-bold text-slate-900 dark:text-white">
                  {confirmAction.title}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  {confirmAction.message}
                </p>
              </div>
              <div className="flex gap-4 pt-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setConfirmAction(null)}
                  className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl font-bold text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-750 transition-colors"
                >
                  Batal
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleConfirmAction}
                  className={cn(
                    "flex-1 py-4 text-white rounded-2xl font-bold shadow-xl cursor-pointer hover:brightness-110 active:brightness-95 transition-all select-none",
                    confirmAction.color,
                  )}
                >
                  {confirmAction.confirmText}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modals for Add/Edit */}
      <AnimatePresence>
        {editingOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingOrder(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md glass p-8 rounded-[40px] border border-white dark:border-white/10 bg-white dark:bg-slate-900 shadow-2xl"
            >
              <h3 className="text-2xl font-heading font-bold mb-6 dark:text-white">
                Edit Pesanan
              </h3>
              <form onSubmit={handleEditOrder} className="space-y-4">
                <input
                  placeholder="Nama"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl outline-none dark:text-white"
                  value={editingOrder.name}
                  onChange={(e) =>
                    setEditingOrder({ ...editingOrder, name: e.target.value })
                  }
                />
                <input
                  placeholder="WhatsApp"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl outline-none dark:text-white"
                  value={editingOrder.whatsapp}
                  onChange={(e) =>
                    setEditingOrder({
                      ...editingOrder,
                      whatsapp: e.target.value,
                    })
                  }
                />
                <input
                  placeholder="Total Harga"
                  type="number"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl outline-none dark:text-white"
                  value={editingOrder.totalPrice}
                  onChange={(e) =>
                    setEditingOrder({
                      ...editingOrder,
                      totalPrice: e.target.value,
                    })
                  }
                />
                <select
                  className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl outline-none dark:text-white"
                  value={editingOrder.status}
                  onChange={(e) =>
                    setEditingOrder({ ...editingOrder, status: e.target.value })
                  }
                >
                  <option value="pending">Pending</option>
                  <option value="selesai">Selesai</option>
                  <option value="dibatalkan">Dibatalkan</option>
                </select>
                <div className="flex gap-3 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setEditingOrder(null)}
                    className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl font-bold dark:text-white cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    Batal
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="flex-1 py-4 bg-secondary dark:bg-primary text-white rounded-2xl font-bold cursor-pointer hover:brightness-110 active:brightness-95 transition-all"
                  >
                    Simpan
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingProduct(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md glass p-8 rounded-[40px] border border-white dark:border-white/10 bg-white dark:bg-slate-900 shadow-2xl"
            >
              <h3 className="text-2xl font-heading font-bold mb-6 dark:text-white">
                Edit Produk
              </h3>
              <form onSubmit={handleEditProduct} className="space-y-4">
                {editingProduct.type === "custom" &&
                editingProduct.subtype === "template" ? (
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-black text-purple-500 uppercase tracking-widest pl-1 block text-left">
                      Nama Template
                    </label>
                    <select
                      required
                      className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl outline-none dark:text-white border border-slate-100 dark:border-white/10"
                      value={editingProduct.name}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          name: e.target.value,
                        })
                      }
                    >
                      <option value="">-- Pilih Nama Template --</option>
                      {availableTemplateNamesEditing.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                      {editingProduct.name &&
                        !availableTemplateNamesEditing.includes(
                          editingProduct.name,
                        ) && (
                          <option value={editingProduct.name}>
                            {editingProduct.name}
                          </option>
                        )}
                    </select>
                  </div>
                ) : (
                  <input
                    placeholder="Nama Produk"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl outline-none dark:text-white"
                    value={editingProduct.name}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        name: e.target.value,
                      })
                    }
                  />
                )}
                <div className="grid grid-cols-2 gap-3">
                  <input
                    placeholder="Harga"
                    type="number"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl outline-none dark:text-white"
                    value={editingProduct.price}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        price: e.target.value,
                      })
                    }
                  />
                  <select
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl outline-none dark:text-white border border-slate-100 dark:border-white/10"
                    value={
                      editingProduct.type === "custom"
                        ? `custom-${editingProduct.subtype || "formal"}`
                        : "standard"
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "standard") {
                        setEditingProduct({
                          ...editingProduct,
                          type: "standard",
                          subtype: "",
                          name: "",
                        });
                      } else {
                        const sub = val.split("-")[1];
                        const firstAvailable =
                          sub === "template"
                            ? Array.from(
                                { length: 50 },
                                (_, i) => `Template ${i + 1}`,
                              ).filter(
                                (n) =>
                                  !products.some(
                                    (p) =>
                                      p.id !== editingProduct.id &&
                                      p.type === "custom" &&
                                      p.subtype === "template" &&
                                      p.name === n,
                                  ),
                              )[0] || ""
                            : "";
                        setEditingProduct({
                          ...editingProduct,
                          type: "custom",
                          subtype: sub,
                          name:
                            editingProduct.subtype === sub
                              ? editingProduct.name
                              : firstAvailable,
                        });
                      }
                    }}
                  >
                    <option value="standard">Ganci Standar</option>
                    <option value="custom-formal">Ganci Custom Formal</option>
                    <option value="custom-template">
                      Ganci Custom Template
                    </option>
                  </select>
                </div>
                <textarea
                  placeholder="Deskripsi"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl outline-none min-h-[100px] dark:text-white"
                  value={editingProduct.description}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      description: e.target.value,
                    })
                  }
                />

                <div className="space-y-3 text-left">
                  <label className="text-[10px] font-black text-purple-500 uppercase tracking-widest pl-1 block text-left">
                    Gambar Produk
                  </label>
                  <div className="flex bg-slate-100 dark:bg-slate-800/40 p-1 rounded-xl gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setImageSourceEdit("url");
                        setUploadErrorEdit(null);
                      }}
                      className={cn(
                        "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer select-none",
                        imageSourceEdit === "url"
                          ? "bg-white dark:bg-slate-700 shadow text-slate-950 dark:text-white"
                          : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300",
                      )}
                    >
                      URL Gambar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setImageSourceEdit("file");
                        setUploadErrorEdit(null);
                      }}
                      className={cn(
                        "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer select-none",
                        imageSourceEdit === "file"
                          ? "bg-white dark:bg-slate-700 shadow text-slate-950 dark:text-white"
                          : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300",
                      )}
                    >
                      Upload File
                    </button>
                  </div>

                  {imageSourceEdit === "url" ? (
                    <input
                      placeholder="Image URL (https://...)"
                      required
                      className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl outline-none dark:text-white border border-transparent focus:border-purple-500 transition-all font-sans"
                      value={editingProduct.image}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          image: e.target.value,
                        })
                      }
                    />
                  ) : (
                    <div className="space-y-2">
                      <div className="relative border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl p-5 text-center hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-all cursor-pointer">
                        <input
                          type="file"
                          accept="image/.png, image/.jpg, image/.jpeg, image/.webp, image/.gif"
                          className="absolute inset-x-0 inset-y-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setUploadErrorEdit(null);
                            try {
                              const base64 =
                                await compressAndConvertToBase64(file);
                              setEditingProduct({
                                ...editingProduct,
                                image: base64,
                              });
                            } catch (err: any) {
                              setUploadErrorEdit(
                                err?.message || "Gagal mengunggah file gambar.",
                              );
                            }
                          }}
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                          Kirim file gambar Anda
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Mendukung PNG, JPG, JPEG, WEBP, GIF
                        </p>
                      </div>
                      {uploadErrorEdit && (
                        <p className="text-xs text-rose-500 font-bold pl-1 font-sans">
                          {uploadErrorEdit}
                        </p>
                      )}
                    </div>
                  )}

                  {editingProduct.image && (
                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-100 dark:border-white/5">
                      <img
                        src={editingProduct.image}
                        className="w-12 h-12 object-cover rounded-xl border border-slate-200 dark:border-white/10"
                        referrerPolicy="no-referrer"
                        alt="Pratinjau"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-black uppercase text-purple-500 tracking-wider">
                          Pratinjau Gambar Aktif
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {editingProduct.image.startsWith("data:")
                            ? "File Gambar Diunggah (Base64)"
                            : editingProduct.image}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl font-bold dark:text-white cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    Batal
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold cursor-pointer hover:brightness-110 active:brightness-95 transition-all"
                  >
                    Simpan
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAddingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingProduct(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md glass p-8 rounded-[40px] border border-white dark:border-white/10 bg-white dark:bg-slate-900 shadow-2xl"
            >
              <h3 className="text-2xl font-heading font-bold mb-6 dark:text-white">
                Tambah Produk Shop
              </h3>
              <form onSubmit={handleAddProduct} className="space-y-4">
                {newProduct.type === "custom" &&
                newProduct.subtype === "template" ? (
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-black text-purple-500 uppercase tracking-widest pl-1 block text-left">
                      Nama Template
                    </label>
                    <select
                      required
                      className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl outline-none dark:text-white border border-slate-100 dark:border-white/10"
                      value={newProduct.name}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, name: e.target.value })
                      }
                    >
                      <option value="">-- Pilih Nama Template --</option>
                      {availableTemplateNames.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <input
                    placeholder="Nama Produk"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl outline-none dark:text-white"
                    value={newProduct.name}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, name: e.target.value })
                    }
                  />
                )}
                <div className="grid grid-cols-2 gap-3">
                  <input
                    placeholder="Harga"
                    type="number"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl outline-none dark:text-white"
                    value={newProduct.price}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, price: e.target.value })
                    }
                  />
                  <select
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl outline-none dark:text-white border border-slate-100 dark:border-white/10"
                    value={
                      newProduct.type === "custom"
                        ? `custom-${newProduct.subtype || "formal"}`
                        : "standard"
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "standard") {
                        setNewProduct({
                          ...newProduct,
                          type: "standard",
                          subtype: "",
                          name: "",
                        });
                      } else {
                        const sub = val.split("-")[1];
                        const firstAvailable =
                          sub === "template"
                            ? Array.from(
                                { length: 50 },
                                (_, i) => `Template ${i + 1}`,
                              ).filter(
                                (n) =>
                                  !products.some(
                                    (p) =>
                                      p.type === "custom" &&
                                      p.subtype === "template" &&
                                      p.name === n,
                                  ),
                              )[0] || ""
                            : "";
                        setNewProduct({
                          ...newProduct,
                          type: "custom",
                          subtype: sub,
                          name: firstAvailable,
                        });
                      }
                    }}
                  >
                    <option value="standard">Ganci Standar</option>
                    <option value="custom-formal">Ganci Custom Formal</option>
                    <option value="custom-template">
                      Ganci Custom Template
                    </option>
                  </select>
                </div>
                <textarea
                  placeholder="Deskripsi"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl outline-none min-h-[100px] dark:text-white"
                  value={newProduct.description}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      description: e.target.value,
                    })
                  }
                />
                <div className="space-y-3 text-left">
                  <label className="text-[10px] font-black text-purple-500 uppercase tracking-widest pl-1 block text-left">
                    Gambar Produk
                  </label>
                  <div className="flex bg-slate-100 dark:bg-slate-800/40 p-1 rounded-xl gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setImageSource("url");
                        setUploadError(null);
                      }}
                      className={cn(
                        "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer select-none",
                        imageSource === "url"
                          ? "bg-white dark:bg-slate-700 shadow text-slate-950 dark:text-white"
                          : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300",
                      )}
                    >
                      URL Gambar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setImageSource("file");
                        setUploadError(null);
                      }}
                      className={cn(
                        "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer select-none",
                        imageSource === "file"
                          ? "bg-white dark:bg-slate-700 shadow text-slate-950 dark:text-white"
                          : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300",
                      )}
                    >
                      Upload File
                    </button>
                  </div>

                  {imageSource === "url" ? (
                    <input
                      placeholder="Image URL (https://...)"
                      required
                      className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl outline-none dark:text-white border border-transparent focus:border-purple-500 transition-all font-sans"
                      value={newProduct.image}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, image: e.target.value })
                      }
                    />
                  ) : (
                    <div className="space-y-2">
                      <div className="relative border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl p-5 text-center hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-all cursor-pointer">
                        <input
                          type="file"
                          accept="image/.png, image/.jpg, image/.jpeg, image/.webp, image/.gif"
                          className="absolute inset-x-0 inset-y-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setUploadError(null);
                            try {
                              const base64 =
                                await compressAndConvertToBase64(file);
                              setNewProduct({ ...newProduct, image: base64 });
                            } catch (err: any) {
                              setUploadError(
                                err?.message || "Gagal mengunggah file gambar.",
                              );
                            }
                          }}
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                          Kirim file gambar Anda
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Mendukung PNG, JPG, JPEG, WEBP, GIF
                        </p>
                      </div>
                      {uploadError && (
                        <p className="text-xs text-rose-500 font-bold pl-1 font-sans">
                          {uploadError}
                        </p>
                      )}
                    </div>
                  )}

                  {newProduct.image && (
                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-100 dark:border-white/5">
                      <img
                        src={newProduct.image}
                        className="w-12 h-12 object-cover rounded-xl border border-slate-200 dark:border-white/10"
                        referrerPolicy="no-referrer"
                        alt="Pratinjau"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-black uppercase text-purple-500 tracking-wider">
                          Pratinjau Gambar Aktif
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {newProduct.image.startsWith("data:")
                            ? "File Gambar Diunggah (Base64)"
                            : newProduct.image}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-3 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setIsAddingProduct(false)}
                    className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl font-bold dark:text-white cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    Batal
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold cursor-pointer hover:brightness-110 active:brightness-95 transition-all"
                  >
                    Tambah
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAddingSong && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/20 dark:bg-slate-950/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingSong(false)}
              className="absolute inset-0 cursor-pointer"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md glass p-8 rounded-[40px] border border-white dark:border-white/10 bg-white dark:bg-slate-900 shadow-2xl text-left overflow-y-auto max-h-[90vh]"
            >
              <h3 className="text-2xl font-heading font-bold mb-6 dark:text-white">
                Tambah Musik Baru
              </h3>
              <form onSubmit={handleAddSong} className="space-y-4 text-left">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-primary uppercase tracking-widest pl-1 block">
                    Judul Lagu
                  </label>
                  <input
                    placeholder="Judul Lagu"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl outline-none dark:text-white border border-slate-100 dark:border-white/10"
                    value={newSong.title}
                    onChange={(e) =>
                      setNewSong({ ...newSong, title: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-primary uppercase tracking-widest pl-1 block">
                    Artis / Penyanyi
                  </label>
                  <input
                    placeholder="Artis / Penyanyi"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl outline-none dark:text-white border border-slate-100 dark:border-white/10"
                    value={newSong.artist}
                    onChange={(e) =>
                      setNewSong({ ...newSong, artist: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-3 text-left">
                  <label className="text-[10px] font-black text-primary uppercase tracking-widest pl-1 block">
                    Cover Lagu (Image)
                  </label>
                  <div className="flex bg-slate-100 dark:bg-slate-800/40 p-1 rounded-xl gap-1">
                    <button
                      type="button"
                      onClick={() => setSongCoverSource("url")}
                      className={cn(
                        "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer select-none",
                        songCoverSource === "url"
                          ? "bg-white dark:bg-slate-700 shadow text-slate-950 dark:text-white"
                          : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300",
                      )}
                    >
                      URL Gambar
                    </button>
                    <button
                      type="button"
                      onClick={() => setSongCoverSource("file")}
                      className={cn(
                        "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer select-none",
                        songCoverSource === "file"
                          ? "bg-white dark:bg-slate-700 shadow text-slate-950 dark:text-white"
                          : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300",
                      )}
                    >
                      Upload File
                    </button>
                  </div>

                  {songCoverSource === "url" ? (
                    <input
                      placeholder="Cover Image URL (https://...)"
                      required
                      className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl outline-none dark:text-white border border-transparent focus:border-primary transition-all font-sans text-xs"
                      value={newSong.cover}
                      onChange={(e) =>
                        setNewSong({ ...newSong, cover: e.target.value })
                      }
                    />
                  ) : (
                    <div className="space-y-2 text-left">
                      <div className="relative border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl p-4 text-center hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-all cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="absolute inset-x-0 inset-y-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setMusicUploadError(null);
                            setIsUploadingCover(true);
                            setCoverProgress(0);
                            uploadFileToStorage(
                              file,
                              "covers",
                              (progress) => setCoverProgress(progress),
                              (downloadURL) => {
                                setNewSong((prev) => ({ ...prev, cover: downloadURL }));
                                setIsUploadingCover(false);
                                setCoverProgress(null);
                              },
                              (errStr) => {
                                setMusicUploadError(errStr);
                                setIsUploadingCover(false);
                                setCoverProgress(null);
                              }
                            );
                          }}
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">Kirim file cover</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Mendukung PNG, JPG, JPEG, WEBP</p>
                      </div>

                      {isUploadingCover && (
                        <div className="mt-2 text-xs text-slate-500 font-bold flex items-center gap-2">
                          <div className="w-full bg-slate-100 rounded-full h-2 dark:bg-slate-800 overflow-hidden">
                            <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${coverProgress}%` }}></div>
                          </div>
                          <span className="shrink-0">{coverProgress}%</span>
                        </div>
                      )}
                    </div>
                  )}

                  {newSong.cover && (
                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-white/5 mt-2 text-left">
                      <img
                        src={newSong.cover}
                        className="w-12 h-12 object-cover rounded-lg border border-slate-200 dark:border-white/10 shrink-0"
                        referrerPolicy="no-referrer"
                        alt="Pratinjau"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[8px] font-black uppercase text-primary tracking-wider">Pratinjau Cover</p>
                        <p className="text-[10px] text-slate-500 truncate">{newSong.cover}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3 text-left">
                  <label className="text-[10px] font-black text-primary uppercase tracking-widest pl-1 block">
                    File Lagu (Audio MP3)
                  </label>
                  <div className="flex bg-slate-100 dark:bg-slate-800/40 p-1 rounded-xl gap-1">
                    <button
                      type="button"
                      onClick={() => setSongAudioSource("url")}
                      className={cn(
                        "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer select-none",
                        songAudioSource === "url"
                          ? "bg-white dark:bg-slate-700 shadow text-slate-950 dark:text-white"
                          : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300",
                      )}
                    >
                      URL Streaming
                    </button>
                    <button
                      type="button"
                      onClick={() => setSongAudioSource("file")}
                      className={cn(
                        "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer select-none",
                        songAudioSource === "file"
                          ? "bg-white dark:bg-slate-700 shadow text-slate-950 dark:text-white"
                          : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300",
                      )}
                    >
                      Upload MP3
                    </button>
                  </div>

                  {songAudioSource === "url" ? (
                    <input
                      placeholder="Direct Audio URL (https://...mp3)"
                      required
                      className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl outline-none dark:text-white border border-transparent focus:border-primary transition-all font-mono text-xs"
                      value={newSong.url}
                      onChange={(e) =>
                        setNewSong({ ...newSong, url: e.target.value })
                      }
                    />
                  ) : (
                    <div className="space-y-2 text-left">
                      <div className="relative border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl p-4 text-center hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-all cursor-pointer">
                        <input
                          type="file"
                          accept="audio/*"
                          className="absolute inset-x-0 inset-y-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setMusicUploadError(null);
                            if (file.size > 20 * 1024 * 1024) {
                              setMusicUploadError("File terlalu besar (maksimal 20MB). Silakan pilih file audio berukuran di bawah 20MB.");
                              return;
                            }
                            setIsUploadingAudio(true);
                            setAudioProgress(0);
                            uploadFileToStorage(
                              file,
                              "songs",
                              (progress) => setAudioProgress(progress),
                              (downloadURL) => {
                                setNewSong((prev) => ({ ...prev, url: downloadURL }));
                                setIsUploadingAudio(false);
                                setAudioProgress(null);
                              },
                              (errStr) => {
                                setMusicUploadError(errStr);
                                setIsUploadingAudio(false);
                                setAudioProgress(null);
                              }
                            );
                          }}
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">Pilih file audio kustom</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-sans">MP3 / WAV / M4A (Maks 20MB - Diunggah langsung ke Cloud Storage)</p>
                      </div>

                      {isUploadingAudio && (
                        <div className="mt-2 text-xs text-slate-500 font-bold flex items-center gap-2">
                          <div className="w-full bg-slate-100 rounded-full h-2 dark:bg-slate-800 overflow-hidden">
                            <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${audioProgress}%` }}></div>
                          </div>
                          <span className="shrink-0">{audioProgress}%</span>
                        </div>
                      )}
                    </div>
                  )}

                  {newSong.url && (
                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-white/5 mt-2 font-mono text-[9px] text-slate-500 text-left">
                      <span className="p-1 px-2 bg-primary/10 text-primary rounded font-bold uppercase shrink-0">AUDIO URL</span>
                      <p className="truncate block flex-1">{newSong.url}</p>
                    </div>
                  )}

                  {musicUploadError && (
                    <p className="text-xs text-rose-500 font-bold pl-1 mt-1 font-sans text-left">
                      {musicUploadError}
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setIsAddingSong(false)}
                    className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl font-bold dark:text-white cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  >
                    Batal
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isUploadingCover || isUploadingAudio}
                    className={cn(
                      "flex-1 py-4 text-white rounded-2xl font-bold cursor-pointer hover:brightness-110 transition/all",
                      isUploadingCover || isUploadingAudio
                        ? "bg-slate-300 dark:bg-slate-700 cursor-not-allowed opacity-50"
                        : "bg-primary"
                    )}
                  >
                    {isUploadingCover || isUploadingAudio ? "Mengunggah..." : "Tambah"}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingSong && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/20 dark:bg-slate-950/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingSong(null)}
              className="absolute inset-0 cursor-pointer"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md glass p-8 rounded-[40px] border border-white dark:border-white/10 bg-white dark:bg-slate-900 shadow-2xl text-left overflow-y-auto max-h-[90vh]"
            >
              <h3 className="text-2xl font-heading font-bold mb-6 dark:text-white">
                Edit Detail Lagu
              </h3>
              <form onSubmit={handleEditSongSubmit} className="space-y-4 text-left">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-primary uppercase tracking-widest pl-1 block">
                    Judul Lagu
                  </label>
                  <input
                    placeholder="Judul Lagu"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl outline-none dark:text-white border border-slate-100 dark:border-white/10"
                    value={editingSong.title || ""}
                    onChange={(e) =>
                      setEditingSong({ ...editingSong, title: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-primary uppercase tracking-widest pl-1 block">
                    Artis / Penyanyi
                  </label>
                  <input
                    placeholder="Artis / Penyanyi"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl outline-none dark:text-white border border-slate-100 dark:border-white/10"
                    value={editingSong.artist || ""}
                    onChange={(e) =>
                      setEditingSong({ ...editingSong, artist: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-3 text-left">
                  <label className="text-[10px] font-black text-primary uppercase tracking-widest pl-1 block">
                    Cover Lagu (Image)
                  </label>
                  <div className="flex bg-slate-100 dark:bg-slate-800/40 p-1 rounded-xl gap-1">
                    <button
                      type="button"
                      onClick={() => setSongCoverSourceEdit("url")}
                      className={cn(
                        "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer select-none",
                        songCoverSourceEdit === "url"
                          ? "bg-white dark:bg-slate-700 shadow text-slate-950 dark:text-white"
                          : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300",
                      )}
                    >
                      URL Gambar
                    </button>
                    <button
                      type="button"
                      onClick={() => setSongCoverSourceEdit("file")}
                      className={cn(
                        "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer select-none",
                        songCoverSourceEdit === "file"
                          ? "bg-white dark:bg-slate-700 shadow text-slate-950 dark:text-white"
                          : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300",
                      )}
                    >
                      Upload File
                    </button>
                  </div>

                  {songCoverSourceEdit === "url" ? (
                    <input
                      placeholder="Cover Image URL (https://...)"
                      required
                      className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl outline-none dark:text-white border border-transparent focus:border-primary transition-all font-sans text-xs"
                      value={editingSong.cover || ""}
                      onChange={(e) =>
                        setEditingSong({ ...editingSong, cover: e.target.value })
                      }
                    />
                  ) : (
                    <div className="space-y-2 text-left">
                      <div className="relative border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl p-4 text-center hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-all cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="absolute inset-x-0 inset-y-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setMusicUploadErrorEdit(null);
                            setIsUploadingCoverEdit(true);
                            setCoverProgressEdit(0);
                            uploadFileToStorage(
                              file,
                              "covers",
                              (progress) => setCoverProgressEdit(progress),
                              (downloadURL) => {
                                setEditingSong((prev: any) => ({ ...prev, cover: downloadURL }));
                                setIsUploadingCoverEdit(false);
                                setCoverProgressEdit(null);
                              },
                              (errStr) => {
                                setMusicUploadErrorEdit(errStr);
                                setIsUploadingCoverEdit(false);
                                setCoverProgressEdit(null);
                              }
                            );
                          }}
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">Kirim file cover baru</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Mendukung PNG, JPG, JPEG, WEBP</p>
                      </div>

                      {isUploadingCoverEdit && (
                        <div className="mt-2 text-xs text-slate-500 font-bold flex items-center gap-2">
                          <div className="w-full bg-slate-100 rounded-full h-2 dark:bg-slate-800 overflow-hidden">
                            <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${coverProgressEdit}%` }}></div>
                          </div>
                          <span className="shrink-0">{coverProgressEdit}%</span>
                        </div>
                      )}
                    </div>
                  )}

                  {editingSong.cover && (
                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-white/5 mt-2 text-left">
                      <img
                        src={editingSong.cover}
                        className="w-12 h-12 object-cover rounded-lg border border-slate-200 dark:border-white/10 shrink-0"
                        referrerPolicy="no-referrer"
                        alt="Revi"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[8px] font-black uppercase text-primary tracking-wider">Pratinjau Cover</p>
                        <p className="text-[10px] text-slate-500 truncate">{editingSong.cover}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3 text-left">
                  <label className="text-[10px] font-black text-primary uppercase tracking-widest pl-1 block">
                    File Lagu (Audio MP3)
                  </label>
                  <div className="flex bg-slate-100 dark:bg-slate-800/40 p-1 rounded-xl gap-1">
                    <button
                      type="button"
                      onClick={() => setSongAudioSourceEdit("url")}
                      className={cn(
                        "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer select-none",
                        songAudioSourceEdit === "url"
                          ? "bg-white dark:bg-slate-700 shadow text-slate-950 dark:text-white"
                          : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300",
                      )}
                    >
                      URL Streaming
                    </button>
                    <button
                      type="button"
                      onClick={() => setSongAudioSourceEdit("file")}
                      className={cn(
                        "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer select-none",
                        songAudioSourceEdit === "file"
                          ? "bg-white dark:bg-slate-700 shadow text-slate-950 dark:text-white"
                          : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300",
                      )}
                    >
                      Upload MP3
                    </button>
                  </div>

                  {songAudioSourceEdit === "url" ? (
                    <input
                      placeholder="Direct Audio URL (https://...mp3)"
                      required
                      className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl outline-none dark:text-white border border-transparent focus:border-primary transition-all font-mono text-xs"
                      value={editingSong.url || ""}
                      onChange={(e) =>
                        setEditingSong({ ...editingSong, url: e.target.value })
                      }
                    />
                  ) : (
                    <div className="space-y-2 text-left">
                      <div className="relative border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl p-4 text-center hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-all cursor-pointer">
                        <input
                          type="file"
                          accept="audio/*"
                          className="absolute inset-x-0 inset-y-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setMusicUploadErrorEdit(null);
                            if (file.size > 20 * 1024 * 1024) {
                              setMusicUploadErrorEdit("File terlalu besar (maksimal 20MB). Silakan pilih file audio berukuran di bawah 20MB.");
                              return;
                            }
                            setIsUploadingAudioEdit(true);
                            setAudioProgressEdit(0);
                            uploadFileToStorage(
                              file,
                              "songs",
                              (progress) => setAudioProgressEdit(progress),
                              (downloadURL) => {
                                setEditingSong((prev: any) => ({ ...prev, url: downloadURL }));
                                setIsUploadingAudioEdit(false);
                                setAudioProgressEdit(null);
                              },
                              (errStr) => {
                                setMusicUploadErrorEdit(errStr);
                                setIsUploadingAudioEdit(false);
                                setAudioProgressEdit(null);
                              }
                            );
                          }}
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">Pilih file audio kustom baru</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-sans">MP3 / WAV / M4A (Maks 20MB - Diunggah langsung ke Cloud Storage)</p>
                      </div>

                      {isUploadingAudioEdit && (
                        <div className="mt-2 text-xs text-slate-500 font-bold flex items-center gap-2">
                          <div className="w-full bg-slate-100 rounded-full h-2 dark:bg-slate-800 overflow-hidden">
                            <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${audioProgressEdit}%` }}></div>
                          </div>
                          <span className="shrink-0">{audioProgressEdit}%</span>
                        </div>
                      )}
                    </div>
                  )}

                  {editingSong.url && (
                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-white/5 mt-2 font-mono text-[9px] text-slate-500 text-left">
                      <span className="p-1 px-2 bg-primary/10 text-primary rounded font-bold uppercase shrink-0">AUDIO URL</span>
                      <p className="truncate block flex-1">{editingSong.url}</p>
                    </div>
                  )}

                  {musicUploadErrorEdit && (
                    <p className="text-xs text-rose-500 font-bold pl-1 mt-1 font-sans text-left">
                      {musicUploadErrorEdit}
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setEditingSong(null)}
                    className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl font-bold dark:text-white cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  >
                    Batal
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isUploadingCoverEdit || isUploadingAudioEdit}
                    className={cn(
                      "flex-1 py-4 text-white rounded-2xl font-bold cursor-pointer hover:brightness-110 transition/all",
                      isUploadingCoverEdit || isUploadingAudioEdit
                        ? "bg-slate-300 dark:bg-slate-700 cursor-not-allowed opacity-50"
                        : "bg-primary"
                    )}
                  >
                    {isUploadingCoverEdit || isUploadingAudioEdit ? "Mengunggah..." : "Simpan"}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatItem({ label, value, icon: Icon, trend }: any) {
  return (
    <div className="p-6 glass rounded-[32px] border border-white dark:border-white/10 space-y-4 shadow-sm bg-white dark:bg-slate-900/40">
      <div className="flex justify-between items-start">
        <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center">
          <Icon className="w-5 h-5 text-slate-400 dark:text-slate-500" />
        </div>
        <span className="text-[8px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-2 py-1 rounded-full">
          {trend}
        </span>
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          {label}
        </p>
        <p className="text-2xl font-heading font-bold truncate dark:text-white transition-colors">
          {value}
        </p>
      </div>
    </div>
  );
}
