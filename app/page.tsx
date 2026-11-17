"use client";
import { useState, useEffect } from "react";
import {
  ShoppingBag,
  Search,
  CheckCircle2,
  Clock,
  Download,
  MapPin,
  X,
  Plus,
  Minus,
  Copy,
  Check,
  Sparkles,
  Utensils,
  FileText,
  MessageCircle,
  Store,
  ShieldCheck,
  ArrowRight,
  Flame,
  CreditCard,
  Send,
} from "lucide-react";

interface Product {
  id: string;
  nama: string;
  harga: number;
  stok: number;
  tipe: "makanan" | "digital" | string;
  jadwal_ambil?: string;
  gambar?: string;
}

interface CartItem extends Product {
  qty: number;
}

interface UnlockedFile {
  nama: string;
  url: string;
}

interface OrderItem {
  id_pesanan: string;
  waktu: string;
  nama_pembeli: string;
  nrp?: string;
  item_pesanan: string;
  total_bayar: number;
  status: string;
  unlocked_links?: UnlockedFile[];
}

export default function OrmawaStore() {
  const [activeTab, setActiveTab] = useState<"katalog" | "cek-pesanan">("katalog");
  const [products, setProducts] = useState<Product[]>([]);
  const [infoBayar, setInfoBayar] = useState("");
  const [waAdmin, setWaAdmin] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [loading, setLoading] = useState(true);

  // Toast Notification
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Filter & Search
  const [categoryFilter, setCategoryFilter] = useState("semua");
  const [searchQuery, setSearchQuery] = useState("");

  // Cart & Checkout
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [form, setForm] = useState({ nama: "", nrp: "", wa: "", catatan: "", buktiUrl: "" });
  const [submitting, setSubmitting] = useState(false);
  const [lastOrderSummary, setLastOrderSummary] = useState<{
    id: string;
    nama: string;
    nrp: string;
    total: number;
    items: string;
  } | null>(null);

  // Cek Pesanan
  const [searchWa, setSearchWa] = useState("");
  const [myOrders, setMyOrders] = useState<OrderItem[]>([]);
  const [searchingOrder, setSearchingOrder] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL || "";

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2600);
  };

  useEffect(() => {
    if (!API_URL) {
      setLoading(false);
      return;
    }
    fetch(`${API_URL}?action=getProducts`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProducts(data);
        } else {
          setProducts(data.products || []);
          setInfoBayar(data.info_pembayaran || "");
          setWaAdmin(data.wa_admin || "");
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [API_URL]);

  const copyRekening = () => {
    navigator.clipboard.writeText(infoBayar);
    setCopied(true);
    showToast("Nomor rekening berhasil disalin!");
    setTimeout(() => setCopied(false), 2000);
  };

  const copyOrderId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    showToast("ID Pesanan disalin!");
    setTimeout(() => setCopiedId(false), 2000);
  };

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        if (existing.qty >= product.stok) {
          showToast("Jumlah sudah mencapai batas stok!");
          return prev;
        }
        showToast(`Jumlah ${product.nama} ditambah`);
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      showToast(`${product.nama} masuk keranjang`);
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id !== id) return item;
          const nextQty = item.qty + delta;
          if (nextQty > item.stok) {
            showToast("Stok maksimal tercapai");
            return item;
          }
          return { ...item, qty: nextQty };
        })
        .filter((item) => item.qty > 0)
    );
  };

  const filteredProducts = products.filter((item) => {
    const matchCategory = categoryFilter === "semua" || item.tipe === categoryFilter;
    const matchSearch = item.nama.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const totalHarga = cart.reduce((sum, item) => sum + Number(item.harga) * item.qty, 0);
  const totalQty = cart.reduce((a, b) => a + b.qty, 0);
  const hasMakanan = cart.some((item) => item.tipe === "makanan");
  const jadwalMakanan = cart.find((item) => item.tipe === "makanan")?.jadwal_ambil;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama || !form.nrp || !form.wa || !form.buktiUrl) {
      showToast("Mohon lengkapi semua kolom wajib (*)");
      return;
    }

    setSubmitting(true);
    const itemRingkasan = cart.map((i) => `${i.nama} (${i.qty}x)`).join(", ");

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({
          nama_pembeli: form.nama,
          nrp: form.nrp,
          no_wa: form.wa,
          catatan: form.catatan,
          item_pesanan: itemRingkasan,
          total_bayar: totalHarga,
          bukti_transfer: form.buktiUrl,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setLastOrderSummary({
          id: result.id_pesanan,
          nama: form.nama,
          nrp: form.nrp,
          total: totalHarga,
          items: itemRingkasan,
        });
        setCart([]);
        setForm({ nama: "", nrp: "", wa: "", catatan: "", buktiUrl: "" });
      }
    } catch {
      showToast("Gagal mengirim pesanan. Periksa koneksi internet.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchWa) return;
    setSearchingOrder(true);
    setHasSearched(true);
    try {
      const res = await fetch(`${API_URL}?action=checkOrder&wa=${encodeURIComponent(searchWa)}`);
      const data = await res.json();
      setMyOrders(data);
    } finally {
      setSearchingOrder(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col relative selection:bg-indigo-600 selection:text-white">
      {/* Subtle Ambient Top Background */}
      <div className="fixed inset-x-0 top-0 h-80 bg-gradient-to-b from-indigo-50/90 via-violet-50/40 to-transparent pointer-events-none -z-10" />

      {/* Floating Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-slate-900/95 backdrop-blur-md text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-xl border border-white/10 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{toastMsg}</span>
          </div>
        </div>
      )}

      {/* Glassmorphic Top Navbar */}
      <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/70">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div
            onClick={() => setActiveTab("katalog")}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-fuchsia-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-black text-base sm:text-lg text-slate-900 tracking-tight leading-none">
                  Ormawa Store
                </h1>
                <span className="hidden sm:inline-block text-[10px] font-extrabold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                  OFFICIAL
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-500">
                Pre-Order Makanan & Bank Soal
              </span>
            </div>
          </div>

          {/* Center Nav Switcher (Desktop) */}
          <div className="hidden md:flex items-center bg-slate-100/90 p-1 rounded-2xl border border-slate-200/70">
            <button
              onClick={() => setActiveTab("katalog")}
              className={`px-5 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === "katalog"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Etalase Produk
            </button>
            <button
              onClick={() => setActiveTab("cek-pesanan")}
              className={`px-5 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === "cek-pesanan"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Cek Pesanan & File
            </button>
          </div>

          {/* Cart Action */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative flex items-center gap-2.5 px-4 py-2.5 bg-slate-900 text-white rounded-2xl hover:bg-indigo-600 active:scale-95 transition-all text-xs font-bold shadow-md shadow-slate-900/10"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Keranjang</span>
            {totalQty > 0 && (
              <span className="bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white text-[11px] font-black px-2 py-0.5 rounded-full shadow-xs">
                {totalQty}
              </span>
            )}
          </button>
        </div>

        {/* Mobile Nav Switcher */}
        <div className="md:hidden px-4 pb-3">
          <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("katalog")}
              className={`py-2 text-xs font-bold rounded-lg transition ${
                activeTab === "katalog" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"
              }`}
            >
              Etalase Produk
            </button>
            <button
              onClick={() => setActiveTab("cek-pesanan")}
              className={`py-2 text-xs font-bold rounded-lg transition ${
                activeTab === "cek-pesanan" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600"
              }`}
            >
              Cek Pesanan & File
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === "katalog" ? (
          <div className="space-y-6">
            {/* Clean 3-Step Tutorial Banner */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 text-white p-6 sm:p-8 shadow-xl shadow-indigo-950/15 border border-white/10">
              <div className="relative z-10 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-2 text-amber-300 text-xs font-extrabold uppercase tracking-wider">
                    <Sparkles className="w-4 h-4" />
                    <span>Cara Pemesanan Cepat</span>
                  </div>
                  <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/15 text-indigo-200 px-3 py-1 rounded-full text-[11px] font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Sesi Pre-Order Aktif</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 flex items-start gap-3">
                    <span className="w-7 h-7 rounded-xl bg-indigo-500 text-white font-black flex items-center justify-center text-xs shrink-0 shadow-sm">
                      1
                    </span>
                    <div className="space-y-0.5">
                      <p className="text-xs font-extrabold text-white">Pilih Produk</p>
                      <p className="text-[11px] text-indigo-100/80 leading-relaxed">
                        Pilih menu makanan atau paket bank soal yang diinginkan.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 flex items-start gap-3">
                    <span className="w-7 h-7 rounded-xl bg-violet-500 text-white font-black flex items-center justify-center text-xs shrink-0 shadow-sm">
                      2
                    </span>
                    <div className="space-y-0.5">
                      <p className="text-xs font-extrabold text-white">Transfer & Checkout</p>
                      <p className="text-[11px] text-indigo-100/80 leading-relaxed">
                        Transfer sesuai total, lalu isi NRP & link bukti bayar.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 flex items-start gap-3">
                    <span className="w-7 h-7 rounded-xl bg-emerald-500 text-white font-black flex items-center justify-center text-xs shrink-0 shadow-sm">
                      3
                    </span>
                    <div className="space-y-0.5">
                      <p className="text-xs font-extrabold text-white">Ambil / Download File</p>
                      <p className="text-[11px] text-indigo-100/80 leading-relaxed">
                        Ambil di tempat sesuai jadwal atau unduh file otomatis di tab{" "}
                        <b className="text-white">Cek Pesanan</b>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ambient Orbs */}
              <div className="absolute -right-20 -top-20 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute left-1/3 -bottom-24 w-72 h-72 bg-fuchsia-500/20 rounded-full blur-3xl pointer-events-none" />
            </section>

            {/* Filter & Search Bar */}
            <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                {[
                  { id: "semua", label: "Semua Katalog" },
                  { id: "makanan", label: "🍔 Makanan PO" },
                  { id: "digital", label: "📚 Bank Soal & Modul" },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryFilter(cat.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      categoryFilter === cat.id
                        ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="relative sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari menu atau mata kuliah..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                />
              </div>
            </section>

            {/* Product Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div
                    key={n}
                    className="h-72 bg-white animate-pulse rounded-3xl border border-slate-200/80"
                  />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-white rounded-3xl p-16 text-center border border-slate-200/80 space-y-2 shadow-xs">
                <p className="text-base font-extrabold text-slate-800">Belum Ada Produk Tersedia</p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Sesi PO untuk kategori ini sedang ditutup atau kata kunci pencarian tidak cocok.
                </p>
              </div>
            ) : (
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredProducts.map((item) => {
                  const inCart = cart.find((c) => c.id === item.id);
                  const lowStock = item.stok > 0 && item.stok <= 5;
                  return (
                    <div
                      key={item.id}
                      className="group bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 hover:border-indigo-300 transition-all duration-300 flex flex-col overflow-hidden"
                    >
                      {/* Product Visual */}
                      <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                        {item.gambar ? (
                          <img
                            src={item.gambar}
                            alt={item.nama}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          />
                        ) : (
                          <div
                            className={`w-full h-full flex flex-col items-center justify-center gap-2 ${
                              item.tipe === "makanan"
                                ? "bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100/90 text-amber-600"
                                : "bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100/90 text-emerald-600"
                            }`}
                          >
                            <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition duration-300">
                              {item.tipe === "makanan" ? (
                                <Utensils className="w-7 h-7" />
                              ) : (
                                <FileText className="w-7 h-7" />
                              )}
                            </div>
                            <span className="text-[10px] font-extrabold tracking-widest uppercase opacity-75">
                              {item.tipe === "makanan" ? "Menu Pre-Order" : "Dokumen Digital"}
                            </span>
                          </div>
                        )}

                        {/* Category Pill */}
                        <span
                          className={`absolute top-3.5 left-3.5 text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-xl shadow-sm backdrop-blur-md ${
                            item.tipe === "makanan"
                              ? "bg-amber-500/95 text-white"
                              : "bg-emerald-600/95 text-white"
                          }`}
                        >
                          {item.tipe === "makanan" ? "Ambil Sekre" : "Bank Soal"}
                        </span>

                        {/* Stock Pill */}
                        {lowStock ? (
                          <span className="absolute top-3.5 right-3.5 bg-rose-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-xl shadow-sm flex items-center gap-1 animate-pulse">
                            <Flame className="w-3 h-3" />
                            Sisa {item.stok}!
                          </span>
                        ) : (
                          <span className="absolute top-3.5 right-3.5 bg-white/95 backdrop-blur-xs text-slate-700 text-[11px] font-bold px-2.5 py-1 rounded-xl shadow-xs">
                            Stok: {item.stok}
                          </span>
                        )}
                      </div>

                      {/* Card Details */}
                      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                        <div className="space-y-1.5">
                          <h3 className="font-extrabold text-base text-slate-900 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">
                            {item.nama}
                          </h3>
                          {item.tipe === "makanan" ? (
                            <p className="text-xs text-slate-500 flex items-start gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                              <span>{item.jadwal_ambil || "Ambil di Sekretariat"}</span>
                            </p>
                          ) : (
                            <p className="text-xs text-slate-500">
                              Akses download langsung terbuka setelah pembayaran diverifikasi.
                            </p>
                          )}
                        </div>

                        {/* Price & Add Button */}
                        <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                          <div>
                            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                              Harga
                            </p>
                            <p className="font-black text-lg text-slate-900">
                              Rp {Number(item.harga).toLocaleString("id-ID")}
                            </p>
                          </div>

                          {inCart ? (
                            <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-2 py-1.5 rounded-2xl">
                              <button
                                onClick={() => updateQty(item.id, -1)}
                                className="w-7 h-7 flex items-center justify-center bg-white rounded-xl text-indigo-600 shadow-2xs hover:bg-indigo-600 hover:text-white transition"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-xs font-black text-indigo-950 w-5 text-center">
                                {inCart.qty}
                              </span>
                              <button
                                onClick={() => updateQty(item.id, 1)}
                                className="w-7 h-7 flex items-center justify-center bg-white rounded-xl text-indigo-600 shadow-2xs hover:bg-indigo-600 hover:text-white transition"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(item)}
                              disabled={item.stok <= 0}
                              className="px-4 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-2xl hover:bg-indigo-600 active:scale-95 transition-all shadow-sm disabled:bg-slate-200 disabled:text-slate-400"
                            >
                              {item.stok > 0 ? "+ Tambah" : "Habis"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </section>
            )}
          </div>
        ) : (
          /* Tab Cek Pesanan & Visual Tracker */
          <div className="max-w-xl mx-auto space-y-5">
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Pelacakan Real-Time</span>
              </div>
              <h2 className="font-black text-xl text-slate-900">
                Lacak Pesanan & Unduh Bank Soal
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Masukkan <b>NRP</b> atau <b>Nomor WhatsApp</b> saat memesan. Begitu admin memverifikasi pembayaran menjadi{" "}
                <span className="font-bold text-emerald-600">Lunas</span>, tombol download file otomatis muncul.
              </p>
              <form onSubmit={handleCheckOrder} className="flex gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Ketik NRP atau No. WhatsApp..."
                  value={searchWa}
                  onChange={(e) => setSearchWa(e.target.value)}
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
                <button
                  type="submit"
                  disabled={searchingOrder}
                  className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl text-xs font-bold hover:opacity-95 transition flex items-center gap-2 shadow-md shadow-indigo-500/20"
                >
                  <Search className="w-4 h-4" />
                  {searchingOrder ? "Mencari..." : "Lacak"}
                </button>
              </form>
            </div>

            {hasSearched && myOrders.length === 0 && !searchingOrder && (
              <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center text-xs text-slate-500">
                Tidak ditemukan pesanan dengan NRP atau nomor WhatsApp tersebut. Pastikan penulisan sesuai saat memesan.
              </div>
            )}

            <div className="space-y-4">
              {myOrders.map((ord) => {
                const isDone = ord.status === "Lunas" || ord.status === "Sudah Diambil";
                return (
                  <div
                    key={ord.id_pesanan}
                    className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4"
                  >
                    <div className="flex flex-wrap justify-between items-center gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-extrabold bg-slate-100 text-slate-700 px-3 py-1 rounded-xl">
                          {ord.id_pesanan}
                        </span>
                        {ord.nrp && (
                          <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-xl">
                            {ord.nrp}
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-xs font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5 ${
                          isDone
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <Clock className="w-3.5 h-3.5" />
                        )}
                        {ord.status}
                      </span>
                    </div>

                    {/* Visual Progress Tracker */}
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-2">
                      <div className="flex justify-between text-[10px] font-bold text-slate-500">
                        <span className="text-indigo-600">1. Pesanan Masuk</span>
                        <span className={isDone ? "text-indigo-600" : "text-amber-600"}>
                          2. Verifikasi Bayar
                        </span>
                        <span className={isDone ? "text-emerald-600" : ""}>
                          3. Siap / Selesai
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isDone
                              ? "w-full bg-gradient-to-r from-indigo-500 to-emerald-500"
                              : "w-1/2 bg-amber-400"
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-extrabold text-slate-900">{ord.item_pesanan}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Pemesan: <b className="text-slate-700">{ord.nama_pembeli}</b> • Total:{" "}
                        <b className="text-slate-900">
                          Rp {Number(ord.total_bayar).toLocaleString("id-ID")}
                        </b>
                      </p>
                    </div>

                    {ord.unlocked_links && ord.unlocked_links.length > 0 && (
                      <div className="pt-3 border-t border-slate-100 space-y-2">
                        <p className="text-xs font-extrabold text-emerald-700">
                          File Digital Siap Diunduh:
                        </p>
                        {ord.unlocked_links.map((file, idx) => (
                          <a
                            key={idx}
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-extrabold rounded-2xl hover:opacity-95 transition shadow-md shadow-emerald-500/20"
                          >
                            <Download className="w-4 h-4" />
                            Download {file.nama}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 mt-14 py-7 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <p className="font-extrabold text-sm text-slate-900">Ormawa Store</p>
            <p className="text-xs text-slate-500">
              Platform Resmi Pre-Order & Bank Soal
            </p>
          </div>
          {waAdmin && (
            <a
              href={`https://wa.me/${waAdmin}?text=${encodeURIComponent(
                "Halo Admin Ormawa Store, saya ingin bertanya terkait pesanan..."
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-2xl text-xs font-bold hover:bg-emerald-600 hover:text-white transition"
            >
              <MessageCircle className="w-4 h-4" />
              Hubungi Admin via WhatsApp
            </a>
          )}
        </div>
      </footer>

      {/* Floating Cart Bar */}
      {cart.length > 0 && !isCartOpen && (
        <div className="fixed bottom-5 inset-x-0 z-40 px-4">
          <button
            onClick={() => setIsCartOpen(true)}
            className="max-w-lg mx-auto w-full bg-slate-950/95 backdrop-blur-md text-white px-5 py-4 rounded-2xl shadow-2xl shadow-indigo-950/30 border border-white/10 flex justify-between items-center hover:bg-indigo-600 transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="bg-indigo-500 text-white text-xs font-black px-2.5 py-1 rounded-xl">
                {totalQty} Item
              </span>
              <span className="text-xs font-bold text-slate-200">Lanjut Pembayaran</span>
            </div>
            <span className="font-black text-sm flex items-center gap-1.5">
              Rp {totalHarga.toLocaleString("id-ID")}
              <ArrowRight className="w-4 h-4" />
            </span>
          </button>
        </div>
      )}

      {/* Checkout Slide-Over Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-md bg-white h-full overflow-y-auto p-6 flex flex-col justify-between shadow-2xl">
            <div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-indigo-600" />
                  <h2 className="font-black text-lg text-slate-900">Checkout Pesanan</h2>
                </div>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    setLastOrderSummary(null);
                  }}
                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {lastOrderSummary ? (
                <div className="py-10 text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-black text-xl text-slate-900">Pesanan Terkirim!</h3>
                    <p className="text-xs text-slate-500">
                      Data kamu otomatis tercatat di sistem admin.
                    </p>
                  </div>

                  {/* Order Receipt Box */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-2 text-xs">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                      <span className="text-slate-500">Kode Pesanan</span>
                      <button
                        onClick={() => copyOrderId(lastOrderSummary.id)}
                        className="font-mono font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg flex items-center gap-1.5"
                      >
                        {lastOrderSummary.id}
                        {copiedId ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Pemesan</span>
                      <span className="font-bold text-slate-800">
                        {lastOrderSummary.nama} ({lastOrderSummary.nrp})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total Bayar</span>
                      <span className="font-extrabold text-slate-900">
                        Rp {lastOrderSummary.total.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>

                  {/* 1-Click WA Confirmation Button */}
                  {waAdmin && (
                    <a
                      href={`https://wa.me/${waAdmin}?text=${encodeURIComponent(
                        `Halo Admin Ormawa Store! Saya ingin konfirmasi pesanan:\n• ID: ${lastOrderSummary.id}\n• Nama: ${lastOrderSummary.nama}\n• NRP: ${lastOrderSummary.nrp}\n• Pesanan: ${lastOrderSummary.items}\n• Total: Rp ${lastOrderSummary.total.toLocaleString("id-ID")}\n\nMohon dicek ya, terima kasih!`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-3.5 bg-emerald-600 text-white text-xs font-extrabold rounded-2xl hover:bg-emerald-700 transition shadow-md shadow-emerald-500/20"
                    >
                      <Send className="w-4 h-4" />
                      Konfirmasi Cepat ke WA Admin
                    </a>
                  )}

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Kamu juga bisa memantau status & mengunduh file kapan saja di tab{" "}
                    <b className="text-slate-600">Cek Pesanan & File</b> menggunakan NRP atau No. WA.
                  </p>
                </div>
              ) : cart.length === 0 ? (
                <div className="py-24 text-center space-y-2">
                  <ShoppingBag className="w-12 h-12 text-slate-200 mx-auto" />
                  <p className="text-sm font-bold text-slate-500">Keranjang masih kosong</p>
                  <p className="text-xs text-slate-400">Pilih item di etalase terlebih dahulu.</p>
                </div>
              ) : (
                <form onSubmit={handleCheckout} className="mt-5 space-y-4">
                  <div className="space-y-2.5">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70"
                      >
                        <div>
                          <p className="text-sm font-bold text-slate-900">{item.nama}</p>
                          <p className="text-xs font-bold text-indigo-600">
                            Rp {(Number(item.harga) * item.qty).toLocaleString("id-ID")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateQty(item.id, -1)}
                            className="p-1.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-100"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-sm font-black w-5 text-center">{item.qty}</span>
                          <button
                            type="button"
                            onClick={() => updateQty(item.id, 1)}
                            className="p-1.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-100"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {hasMakanan && (
                    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1">
                      <p className="font-extrabold">Info Pengambilan Makanan:</p>
                      <p>{jadwalMakanan || "Diambil di Ruang Sekretariat sesuai jadwal PO."}</p>
                    </div>
                  )}

                  {/* Payment Card */}
                  <div className="p-4 bg-gradient-to-br from-indigo-50 to-violet-50/70 rounded-2xl border border-indigo-100 space-y-2.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-600">Total Pembayaran</span>
                      <span className="text-xl font-black text-indigo-600">
                        Rp {totalHarga.toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-indigo-200/60">
                      <p className="text-[11px] font-bold text-slate-700 mb-1.5">
                        Transfer ke Rekening / E-Wallet:
                      </p>
                      <div className="flex items-center justify-between gap-2 bg-white p-3 rounded-xl border border-indigo-200/80 shadow-2xs">
                        <span className="text-xs font-mono font-bold text-slate-800 break-all">
                          {infoBayar || "Hubungi Admin untuk nomor rekening"}
                        </span>
                        {infoBayar && (
                          <button
                            type="button"
                            onClick={copyRekening}
                            className="shrink-0 p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl transition"
                            title="Salin Rekening"
                          >
                            {copied ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nama Lengkap *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Budi Santoso"
                        value={form.nama}
                        onChange={(e) => setForm({ ...form, nama: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          NRP *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="5025231001"
                          value={form.nrp}
                          onChange={(e) => setForm({ ...form, nrp: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          No. WhatsApp *
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="08123456789"
                          value={form.wa}
                          onChange={(e) => setForm({ ...form, wa: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Link Bukti Transfer (Google Drive / Foto) *
                      </label>
                      <input
                        type="url"
                        required
                        placeholder="https://drive.google.com/..."
                        value={form.buktiUrl}
                        onChange={(e) => setForm({ ...form, buktiUrl: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Catatan Tambahan (Opsional)
                      </label>
                      <input
                        type="text"
                        placeholder="Misal: Ambil jam 12 siang di sekre"
                        value={form.catatan}
                        onChange={(e) => setForm({ ...form, catatan: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-extrabold rounded-2xl hover:opacity-95 transition shadow-lg shadow-indigo-500/25 disabled:opacity-50"
                  >
                    {submitting ? "Mengirim Pesanan..." : "Kirim Pesanan Sekarang"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}