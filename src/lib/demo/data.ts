// Demo seed data only. Nothing here is real or persisted on a server.
export type Product = { id: string; name: string; category: string; manufacturer: string; part: string; price: number; stock: number; compat: string };
export const PRODUCTS: Product[] = [
  { id: "p1", name: "زيت محرك 5W-30 (4 لتر)", category: "زيوت", manufacturer: "Mobil", part: "M1-5W30-4L", price: 145, stock: 12, compat: "تويوتا كامري، هوندا أكورد، مازدا 6" },
  { id: "p2", name: "فرامل أمامية (طقم)", category: "الفرامل", manufacturer: "Bosch", part: "BP-2231", price: 45, stock: 20, compat: "كيا سيراتو، هيونداي إلنترا" },
  { id: "p3", name: "بطارية 70 أمبير", category: "الكهرباء", manufacturer: "Varta", part: "VR-70AH", price: 145, stock: 8, compat: "أغلب السيارات المتوسطة" },
  { id: "p4", name: "فلتر زيت", category: "الفلاتر", manufacturer: "Mann", part: "W-712", price: 18, stock: 40, compat: "فولكس فاجن، أودي" },
  { id: "p5", name: "فلتر هواء", category: "الفلاتر", manufacturer: "Mann", part: "C-2433", price: 22, stock: 0, compat: "مرسيدس C-Class" },
  { id: "p6", name: "شمعات إشعال (4 قطع)", category: "المحركات", manufacturer: "NGK", part: "NGK-ILKAR7B", price: 60, stock: 15, compat: "تويوتا كورولا" },
];
export const CATEGORIES = ["الكل", ...Array.from(new Set(PRODUCTS.map(p => p.category)))];
export const REFERRALS = [
  { name: "ورشة الأمل", status: "نشطة", sales: 1200 }, { name: "عميل جديد", status: "مسجّل", sales: 0 }, { name: "مركز النخبة", status: "نشطة", sales: 650 },
];
export const SEED_TX = [
  { id: "t1", date: "2026-10-01", label: "عمولة شراء ورشة الأمل", amount: 12.5, kind: "commission" as const },
  { id: "t2", date: "2026-10-08", label: "عمولة شراء مركز النخبة", amount: 13, kind: "commission" as const },
];
