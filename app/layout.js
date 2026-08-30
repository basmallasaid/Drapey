// app/layout.js
import './globals.css';
import { Inter, Playfair_Display } from 'next/font/google';
import { AuthProvider, CartProvider, FavProvider } from '../providers';
import PublicLayout from '../src/components/PublicLayout';
import Navbar from '../src/components/Navbar';
import Footer from '../src/components/Footer';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter', // هذا يجب أن يطابق الموجود في globals.css
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair', // هذا يجب أن يطابق الموجود في globals.css
  display: 'swap',
});

export default function RootLayout({ children }) {
  return (
    // نضع الـ variables هنا لكي يراها ملف الـ CSS
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased"> 
        <AuthProvider>
          <CartProvider>
            <FavProvider>
              <PublicLayout navbar={<Navbar />} footer={<Footer />}>
                {children}
              </PublicLayout>
            </FavProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}