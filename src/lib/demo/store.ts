import { PRODUCTS, SEED_TX } from "./data";
export type Tx = { id: string; date: string; label: string; amount: number; kind: "commission" | "withdrawal" };
export type Order = { id: string; date: string; status: "pending_review" | "processing" | "shipped" | "completed"; items: { id: string; name: string; price: number; qty: number }[]; total: number };
export type State = { cart: { id: string; qty: number }[]; orders: Order[]; tx: Tx[]; stock: Record<string, number>;
  profile: { name: string; phone: string; type: "workshop" | "customer" | "marketer" } };
const K = "euro_demo_v1";
const fresh = (): State => ({ cart: [], orders: [], tx: [...SEED_TX], stock: Object.fromEntries(PRODUCTS.map(p => [p.id, p.stock])), profile: { name: "أحمد", phone: "0500000000", type: "customer" } });
export function load(): State {
  try { const s = typeof localStorage !== "undefined" && localStorage.getItem(K); return s ? { ...fresh(), ...JSON.parse(s) } : fresh(); } catch { return fresh(); }
}
function save(s: State) { try { localStorage.setItem(K, JSON.stringify(s)); } catch { /* private mode: state lives for this tab only */ } return s; }
export const resetDemo = () => save(fresh());
export function addToCart(id: string, qty = 1) {
  const s = load(), max = s.stock[id] ?? 0, e = s.cart.find(c => c.id === id);
  if (max < 1) return { ok: false as const, error: "المنتج غير متوفر" };
  if (e) e.qty = Math.min(e.qty + qty, max); else s.cart.push({ id, qty: Math.min(qty, max) });
  save(s); return { ok: true as const };
}
export function setQty(id: string, qty: number) { const s = load(); s.cart = s.cart.map(c => c.id === id ? { ...c, qty: Math.min(qty, s.stock[id] ?? 0) } : c).filter(c => c.qty > 0); return save(s); }
export function removeFromCart(id: string) { const s = load(); s.cart = s.cart.filter(c => c.id !== id); return save(s); }
export function cartLines(s = load()) { return s.cart.flatMap(c => { const p = PRODUCTS.find(x => x.id === c.id); return p ? [{ ...p, qty: c.qty }] : []; }); }
export const cartTotal = (s = load()) => cartLines(s).reduce((t, l) => t + l.price * l.qty, 0);
export function placeOrder() {
  const s = load(), lines = cartLines(s);
  if (!lines.length) return { ok: false as const, error: "السلة فارغة" };
  if (lines.some(l => l.qty > (s.stock[l.id] ?? 0))) return { ok: false as const, error: "الكمية المطلوبة أكبر من المتوفر" };
  const o: Order = { id: "D" + Date.now().toString().slice(-6), date: new Date().toISOString().slice(0, 10), status: "pending_review", total: cartTotal(s), items: lines.map(l => ({ id: l.id, name: l.name, price: l.price, qty: l.qty })) };
  lines.forEach(l => (s.stock[l.id] -= l.qty)); s.orders.unshift(o); s.cart = []; save(s); return { ok: true as const, order: o };
}
const NEXT = { pending_review: "processing", processing: "shipped", shipped: "completed", completed: "completed" } as const;
export function advanceOrder(id: string) { const s = load(), o = s.orders.find(x => x.id === id); if (o) o.status = NEXT[o.status]; return save(s); }
export const balance = (s = load()) => Math.round(s.tx.reduce((t, x) => t + x.amount, 0) * 100) / 100;
export function requestWithdrawal(amount: number, iban: string) {
  const s = load();
  if (!Number.isFinite(amount) || amount < 10) return { ok: false as const, error: "الحد الأدنى للسحب 10" };
  if (amount > balance(s)) return { ok: false as const, error: "المبلغ أكبر من الرصيد المتاح" };
  if (!/^[A-Za-z]{2}\d{2}[A-Za-z0-9]{10,30}$/.test(iban.replace(/\s/g, ""))) return { ok: false as const, error: "رقم الآيبان غير صحيح" };
  s.tx.unshift({ id: "w" + Date.now(), date: new Date().toISOString().slice(0, 10), label: "طلب سحب (تجريبي)", amount: -amount, kind: "withdrawal" }); save(s); return { ok: true as const };
}
export function updateProfile(name: string, phone: string) {
  if (name.trim().length < 2) return { ok: false as const, error: "الاسم قصير جدًا" };
  if (!/^\+?\d{8,15}$/.test(phone.replace(/\s/g, ""))) return { ok: false as const, error: "رقم الهاتف غير صحيح" };
  const s = load(); s.profile.name = name.trim(); s.profile.phone = phone.trim(); save(s); return { ok: true as const };
}
