// app/admin/layout.js
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/providers";
import { 
  LayoutDashboard, ShoppingBag, List, ShoppingCart, 
  Users, BarChart3, Star, Settings, LogOut, Search, Bell, User, Menu, X 
} from "lucide-react";

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const { profile, user } = useAuth();
  const adminName = profile?.full_name || "Admin";
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex min-h-screen bg-[var(--color-cream)] text-[var(--color-dark-brown)]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-[var(--color-light-beige)] transform transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-8 pb-4 flex items-center justify-between">
          <div>
            <img src="/logo.jpeg" alt="DRAPEY" className="w-25 h-auto object-contain"/>
            {/* <p className="text-[10px] text-[var(--color-medium-brown)] tracking-[0.1em] italic mt-1 uppercase">Grace in Every Fold</p> */}
          </div>
          <button
            onClick={closeSidebar}
            className="lg:hidden p-2 text-[var(--color-medium-brown)] hover:text-[var(--color-dark-brown)] rounded-lg ml-2"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto pb-4">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeSidebar}
                className={`flex items-center gap-3 px-4 py-3 rounded-[15px] text-sm font-medium transition-all ${
                  active ? "bg-[var(--color-light-beige)] text-[var(--color-dark-brown)]" : "text-[var(--color-medium-brown)] hover:bg-[var(--color-cream)]"
                }`}
              >
                {item.icon}
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[var(--color-light-beige)]">
          <button className="flex items-center gap-3 w-full px-4 py-3 text-[var(--color-medium-brown)] hover:text-red-600 text-sm font-medium">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:pl-64 min-w-0">
        <header className="h-20 bg-white border-b border-[var(--color-light-beige)] flex items-center justify-between px-4 sm:px-8 gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-[var(--color-medium-brown)] hover:text-[var(--color-dark-brown)] rounded-lg -ml-1"
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-semibold truncate">Dashboard</h2>
              <p className="text-[10px] sm:text-xs text-[var(--color-medium-brown)] truncate">Welcome back, {adminName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-6">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-medium-brown)]" size={16} />
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-[var(--color-cream)] border-none rounded-full py-2 pl-10 pr-4 text-sm w-40 lg:w-64 focus:ring-1 focus:ring-[var(--color-light-beige)] outline-none" 
              />
            </div>
            <button className="p-2 text-[var(--color-medium-brown)] hover:text-[var(--color-dark-brown)] -mr-2 md:mr-0" aria-label="Notifications">
              <Bell size={20} />
            </button>
            <div className="flex items-center gap-3 pl-2 sm:pl-6 border-l border-[var(--color-light-beige)] min-w-0">
              <div className="text-right hidden sm:block min-w-0">
                <p className="text-sm font-medium truncate max-w-[120px] lg:max-w-[180px]">{adminName}</p>
                <p className="text-[10px] text-[var(--color-medium-brown)]">Administrator</p>
              </div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[var(--color-light-beige)] rounded-full flex items-center justify-center font-bold text-[var(--color-dark-brown)] shrink-0">{adminName.charAt(0).toUpperCase()}</div>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
