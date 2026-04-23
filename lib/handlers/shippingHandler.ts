type ShippingData = {
  city: string;
  cost: number;
  eta: string;
};

const SHIPPING_LIST: ShippingData[] = [
  { city: "jakarta", cost: 10000, eta: "1–2 hari" },
  { city: "bandung", cost: 12000, eta: "2–3 hari" },
  { city: "surabaya", cost: 12000, eta: "2–3 hari" },
  { city: "yogyakarta", cost: 15000, eta: "2–4 hari" },
  { city: "semarang", cost: 13000, eta: "2–3 hari" },
  { city: "solo", cost: 14000, eta: "2–4 hari" },
  { city: "malang", cost: 16000, eta: "3–4 hari" },
  { city: "cirebon", cost: 11000, eta: "2–3 hari" },
  { city: "tasikmalaya", cost: 14000, eta: "2–4 hari" },
  { city: "kediri", cost: 16000, eta: "3–4 hari" },
];

function detectCity(message: string): string | null {
  const text = message.toLowerCase();

  for (const item of SHIPPING_LIST) {
    if (text.includes(item.city)) {
      return item.city;
    }
  }

  return null;
}

export async function handleShipping(message: string) {
  const city = detectCity(message);

  // 🔥 jika kota ditemukan
  if (city) {
    const data = SHIPPING_LIST.find((c) => c.city === city);

    return `Ongkir ke ${capitalize(city)} Rp${data?.cost.toLocaleString()} dengan estimasi ${data?.eta}.`;
  }

  // 🔥 jika tidak spesifik kota
  return `Untuk pengecekan ongkir, saat ini kami melayani pengiriman di Pulau Jawa.

Berikut estimasi ongkir:
${SHIPPING_LIST.map(
  (c) => `- ${capitalize(c.city)}: Rp${c.cost.toLocaleString()} (${c.eta})`,
).join("\n")}

Silakan sebutkan kota tujuan kamu ya 😊`;
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
