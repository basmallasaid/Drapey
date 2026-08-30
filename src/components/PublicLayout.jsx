'use client';

import { usePathname } from 'next/navigation';

const CHROME_ROUTES = new Set([
  '/',
  '/products',
  '/orders',
  '/addresses',
  '/profile',
  '/cart',
  '/favorites',
  '/checkout',
  '/order-confirmation',
]);

export default function PublicLayout({ children, navbar, footer }) {
  const pathname = usePathname() ?? '';

  const showChrome =
    CHROME_ROUTES.has(pathname) ||
    pathname.startsWith('/products/') ||
    pathname.startsWith('/product/') ||
    pathname.startsWith('/order-confirmation');

  return (
    <>
      {showChrome ? navbar : null}
      {children}
      {showChrome ? footer : null}
    </>
  );
}