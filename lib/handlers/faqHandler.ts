const faqs = [
  {
    keywords: ["cod", "bayar ditempat"],
    answer: "Kami menyediakan COD di Jakarta, Surabaya, dan Bandung.",
  },
  {
    keywords: ["pengiriman", "berapa lama", "delivery", "dikirim"],
    answer: "Pengiriman biasanya memakan waktu 2–5 hari kerja.",
  },
  {
    keywords: ["jam buka", "jam operasional", "buka jam berapa"],
    answer: "Kami buka setiap hari pukul 08.00 – 17.00.",
  },
  {
    keywords: ["ongkir", "biaya kirim", "ongkos kirim"],
    answer: "Biaya ongkir tergantung lokasi. Kamu bisa cek saat checkout ya.",
  },
  {
    keywords: ["stok", "masih ada", "available", "tersedia"],
    answer:
      "Untuk ketersediaan produk, kamu bisa tanya nama produknya ya, nanti kami cekkan 😊",
  },
  {
    keywords: ["refund", "pengembalian dana"],
    answer:
      "Kami menerima refund sesuai syarat & ketentuan. Silakan hubungi admin untuk proses lebih lanjut.",
  },
  {
    keywords: ["retur", "tukar barang"],
    answer:
      "Bisa retur jika ada kesalahan atau cacat produk. Silakan hubungi admin ya.",
  },
  {
    keywords: ["garansi"],
    answer:
      "Beberapa produk memiliki garansi. Silakan tanya produk yang dimaksud ya.",
  },
  {
    keywords: ["cara beli", "cara order", "pesan gimana"],
    answer:
      "Kamu bisa langsung pilih produk dan checkout melalui website kami ya 😊",
  },
  {
    keywords: ["metode pembayaran", "bayar pakai apa"],
    answer:
      "Kami menerima transfer bank, e-wallet, dan COD untuk area tertentu.",
  },
  {
    keywords: ["alamat toko", "lokasi toko"],
    answer:
      "Kami adalah toko online. Untuk informasi lebih lanjut bisa hubungi admin ya.",
  },
  {
    keywords: ["diskon", "promo"],
    answer: "Kami sering ada promo menarik. Pantau terus ya 😊",
  },
  {
    keywords: ["bisa nego", "nego harga"],
    answer: "Mohon maaf, harga yang tertera sudah harga terbaik kami 😊",
  },
  {
    keywords: ["ready hari ini", "bisa kirim hari ini"],
    answer:
      "Pengiriman dilakukan sesuai antrian, biasanya diproses di hari yang sama atau berikutnya.",
  },
  {
    keywords: ["packing", "dikemas"],
    answer:
      "Produk kami dikemas dengan aman agar sampai dengan baik di tujuan.",
  },
];

export function findFAQ(message: string) {
  const lower = message.toLowerCase();
  return faqs.find((f) => f.keywords.some((k) => lower.includes(k)));
}
