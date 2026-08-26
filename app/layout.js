import './globals.css';
import { AuthProvider, CartProvider, FavProvider } from '../providers';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: {
    default: 'Drapey - Clean Clothing for Everyday Wear',
    template: '%s | Drapey',
  },
  description: 'Clean silhouettes and calm tones. Essential clothing for everyday wear. Shop our curated collection of t-shirts, hoodies, pants, and more.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
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
