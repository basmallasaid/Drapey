import './globals.css';
import { Inter, Playfair_Display } from 'next/font/google';
import { AuthProvider, CartProvider, FavProvider } from '../providers';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: {
    default: 'Drapey - Clean Clothing for Everyday Wear',
    template: '%s | Drapey',
  },
  description: 'Clean silhouettes and calm tones. Essential clothing for everyday wear. Shop our curated collection of t-shirts, hoodies, pants, and more.',
};

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} antialiased`}>
        <AuthProvider>
          <CartProvider>
            <FavProvider>
              {children}
            </FavProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
