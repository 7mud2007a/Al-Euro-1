import Link from "next/link";
export default function Welcome() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-between bg-navy2 px-6 py-10 text-white">
      <div className="flex items-center gap-3 pt-6">
        <span className="text-4xl font-bold leading-none">اليورو</span>
        <span className="h-10 w-px bg-silver/50" />
        <span className="text-2xl font-medium tracking-widest text-silver">EURO</span>
      </div>
      <h1 className="text-4xl font-bold leading-snug">كل قطع سيارتك<br />بمكان واحد</h1>
      <nav className="flex flex-col gap-3">
        <Link href="/login?role=workshop" className="rounded-xl bg-royal py-3 text-center font-medium">دخول الورش</Link>
        <Link href="/login?role=customer" className="rounded-xl border border-silver/60 py-3 text-center font-medium">دخول العملاء والمسوقين</Link>
        <Link href="/register" className="py-2 text-center text-silver">إنشاء حساب جديد</Link>
      </nav>
    </main>
  );
}
