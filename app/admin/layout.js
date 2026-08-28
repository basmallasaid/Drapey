// app/admin/layout.js
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, ShoppingBag, List, ShoppingCart, 
  Users, BarChart3, Star, Settings, LogOut, Search, Bell, User 
} from "lucide-react";

export default function AdminLayout({ children }) {
  const pathname = usePathname();

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
    { href: "/admin/products", label: "Products", icon: <ShoppingBag size={20} /> },
    { href: "/admin/categories", label: "Categories", icon: <List size={20} /> },
    { href: "/admin/orders", label: "Orders", icon: <ShoppingCart size={20} /> },
    { href: "/admin/users", label: "Customers", icon: <Users size={20} /> },
    { href: "/admin/analytics", label: "Analytics", icon: <BarChart3 size={20} /> },
    { href: "/admin/reviews", label: "Reviews", icon: <Star size={20} /> },
    { href: "/admin/settings", label: "Settings", icon: <Settings size={20} /> },
  ];

  return (
    <div className="flex min-h-screen bg-[#FAF8F5] text-[#3E3A36]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-[#EBE2DA] flex flex-col fixed h-full">
        <div className="p-8"> <img src="/logo.jpeg" alt="DRAPEY" className="w-25 h-auto object-contain"/>
          <p className="text-[10px] text-[#8E8A84] tracking-[0.1em] italic mt-1 uppercase">Grace in Every Fold</p>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-[15px] text-sm font-medium transition-all ${
                  active ? "bg-[#F3EFEA] text-[#3E3A36]" : "text-[#8E8A84] hover:bg-[#F7F3EE]"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#EBE2DA]">
          <button className="flex items-center gap-3 w-full px-4 py-3 text-[#8E8A84] hover:text-red-600 text-sm font-medium">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 pl-64">
        <header className="h-20 bg-white border-b border-[#EBE2DA] flex items-center justify-between px-8 sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-semibold">Dashboard</h2>
            <p className="text-xs text-[#8E8A84]">Welcome back, Admin</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8A84]" size={16} />
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-[#FAF8F5] border-none rounded-full py-2 pl-10 pr-4 text-sm w-64 focus:ring-1 focus:ring-[#EBE2DA] outline-none" 
              />
            </div>
            <Bell className="text-[#8E8A84] cursor-pointer" size={20} />
            <div className="flex items-center gap-3 pl-6 border-l border-[#EBE2DA]">
              <div className="text-right">
                <p className="text-sm font-medium">Admin</p>
                <p className="text-[10px] text-[#8E8A84]">Administrator</p>
              </div>
              <div className="w-10 h-10 bg-[#F3EFEA] rounded-full flex items-center justify-center font-bold text-[#3E3A36]">A</div>
            </div>
          </div>
        </header>

        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}