"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
export default function Login() {
  const r = useRouter();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  function go(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr("أدخل بريدًا إلكترونيًا صحيحًا للتجربة");
    if (pw.length < 4) return setErr("أدخل كلمة مرور تجريبية من 4 أحرف على الأقل");
    r.push("/home");
  }
  return (
    <main className="mx-auto max-w-md px-6 pt-16">
      <p className="mb-3 inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-800">وضع تجريبي</p>
      <h1 className="text-2xl font-bold">تسجيل الدخول</h1>
      <p className="mt-2 text-sm text-slate-500">استخدم أي بريد إلكتروني صحيح وأي كلمة مرور من 4 أحرف. لن يتم إنشاء حساب أو حفظ بيانات.</p>
      <form onSubmit={go} noValidate>
        <label className="lbl">البريد الإلكتروني</label>
        <input className="inp" type="email" dir="ltr" value={email} onChange={e => setEmail(e.target.value)} />
        <label className="lbl">كلمة المرور</label>
        <input className="inp" type="password" dir="ltr" value={pw} onChange={e => setPw(e.target.value)} />
        {err && <p role="alert" className="mt-3 text-sm text-red-700">{err}</p>}
        <button className="btn mt-6">دخول تجريبي</button>
      </form>
      <p className="mt-6 text-sm">ما عندك حساب؟ <Link href="/register" className="text-royal">إنشاء حساب تجريبي</Link></p>
      <p className="mt-5"><Link href="/" className="text-sm text-royal">العودة للرئيسية</Link></p>
    </main>
  );
}