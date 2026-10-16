import Link from "next/link";
import { Home, Package, Users, Wallet, User } from "lucide-react";
const tabs = [[Home,"الرئيسية","/home#home"],[Package,"المنتجات","/home#products"],[Users,"الدعوات","/home#referrals"],[Wallet,"محفظتي","/home#wallet"],[User,"حسابي","/home#profile"]] as const;
export default function Nav({ active }: { active: string }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 mx-auto flex max-w-md justify-around border-t border-silver bg-white py-2">
      {tabs.map(([I, l, h]) => (
        <Link key={h} href={h} className={"flex flex-col items-center gap-0.5 text-xs " + (active === h ? "text-royal" : "text-slate-500")}>
          <I size={20} />{l}
        </Link>
      ))}
    </nav>
  );
}