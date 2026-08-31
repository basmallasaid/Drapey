// app/admin/AdminSearch.js
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Search, ShoppingBag, ShoppingCart, Users } from "lucide-react";

const MAX_PER = 5;

function Section({ icon, title, results, hrefPrefix, emptyLabel }) {
  if (results.length === 0) return null;
  return (
    <div className="px-3 pt-3 pb-2">
      <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-medium-brown)] px-1 mb-1.5">
        {icon}
        {title}
      </p>
      <ul className="space-y-0.5">
        {results.map((r) => (
          <li key={r.id}>
            <Link
              href={hrefPrefix}
              onClick={() => {
                /* navigation handled by router; parent clears dropdown */
              }}
              className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm text-[var(--color-dark-brown)] hover:bg-[var(--color-cream)] transition-colors"
            >
              <span className="truncate">{r.title}</span>
              <span className="text-[10px] text-[var(--color-medium-brown)] shrink-0 whitespace-nowrap">
                {r.meta}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AdminSearch() {
  const supabase = createClient();
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = value.trim();
    if (q.length < 2) {
      setProducts([]);
      setOrders([]);
      setCustomers([]);
      setOpen(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    setOpen(true);
    const query = `%${q.toLowerCase()}%`;
    debounceRef.current = setTimeout(async () => {
      try {
        const [pRes, oRes, uRes] = await Promise.all([
          supabase
            .from("products")
            .select("id, name")
            .ilike("name", query)
            .limit(MAX_PER),
          supabase
            .from("orders")
            .select("id, customer_name, customer_email, total_amount")
            .or(`customer_name.ilike.${query},customer_email.ilike.${query}`)
            .limit(MAX_PER),
          supabase
            .from("users")
            .select("id, full_name, email")
            .or(`full_name.ilike.${query},email.ilike.${query}`)
            .limit(MAX_PER),
        ]);
        setProducts((pRes?.data || []).map((p) => ({ id: p.id, title: p.name, meta: "Product" })));
        setOrders(
          (oRes?.data || []).map((o) => ({
            id: o.id,
            title: o.customer_name || o.customer_email,
            meta: `EGP ${Number(o.total_amount || 0).toLocaleString()}`,
          }))
        );
        setCustomers(
          (uRes?.data || []).map((u) => ({
            id: u.id,
            title: u.full_name || u.email,
            meta: u.email,
          }))
        );
      } catch {
        setProducts([]);
        setOrders([]);
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, supabase]);

  const hasResults =
    products.length > 0 || orders.length > 0 || customers.length > 0;

  return (
    <div className="relative hidden md:block" ref={wrapperRef}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-medium-brown)]" size={16} />
      <input
        type="text"
        placeholder="Search..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => value.trim().length >= 2 && setOpen(true)}
        className="bg-[var(--color-cream)] border-none rounded-full py-2 pl-10 pr-4 text-sm w-40 lg:w-64 focus:ring-1 focus:ring-[var(--color-light-beige)] outline-none"
      />

      {open && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-white border border-[var(--color-light-beige)] rounded-2xl shadow-xl overflow-hidden max-h-[70vh] overflow-y-auto">
          {loading && (
            <p className="px-5 py-4 text-xs text-[var(--color-medium-brown)]">Searching...</p>
          )}
          {!loading && !hasResults && (
            <p className="px-5 py-4 text-xs text-[var(--color-medium-brown)]">
              No results for “{value.trim()}”.
            </p>
          )}
          {!loading && hasResults && (
            <>
              <Section
                icon={<ShoppingBag size={13} />}
                title="Products"
                results={products}
                hrefPrefix="/admin/products"
                emptyLabel=""
              />
              <Section
                icon={<ShoppingCart size={13} />}
                title="Orders"
                results={orders}
                hrefPrefix="/admin/orders"
                emptyLabel=""
              />
              <Section
                icon={<Users size={13} />}
                title="Customers"
                results={customers}
                hrefPrefix="/admin/users"
                emptyLabel=""
              />
              <div className="px-4 py-2 border-t border-[var(--color-light-beige)]">
                <Link
                  href="/admin/products"
                  className="inline-block text-[10px] font-bold text-[var(--color-medium-brown)] hover:text-[var(--color-dark-brown)]"
                >
                  See all in Admin →
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
