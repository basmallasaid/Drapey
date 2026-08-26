'use client';

import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchProfile = useCallback(async (userId) => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    setProfile(data);
  }, [supabase]);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) await fetchProfile(user.id);
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase, fetchProfile]);

  const signup = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw error;
    return data;
  };

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const googleSignIn = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, profile, signup, login, googleSignIn, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const fetchCart = useCallback(async () => {
    if (!user) {
      setCartItems([]);
      setLoading(false);
      return;
    }

    const { data: cart } = await supabase
      .from('cart')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!cart) {
      setCartItems([]);
      setLoading(false);
      return;
    }

    const { data: items } = await supabase
      .from('cart_items')
      .select(`
        id,
        quantity,
        product_variant_id,
        product_variant:product_variants(
          id, size, color, sku, stock_quantity, product_id,
          product:products(
            id, name, slug, price, is_active,
            product_images(id, image_url, is_primary, sort_order)
          )
        )
      `)
      .eq('cart_id', cart.id);

    setCartItems(items || []);
    setLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addItem = async (variantId, quantity = 1) => {
    if (!user) {
      router.push('/login');
      return { error: 'Please login to add items to cart' };
    }

    let { data: cart } = await supabase
      .from('cart')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!cart) {
      const { data: newCart } = await supabase
        .from('cart')
        .insert({ user_id: user.id })
        .select('id')
        .single();
      cart = newCart;
    }

    const existing = cartItems.find(item => item.product_variant_id === variantId);

    if (existing) {
      const newQty = existing.quantity + quantity;
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: newQty })
        .eq('id', existing.id);
      if (error) return { error: error.message };
    } else {
      const { error } = await supabase
        .from('cart_items')
        .insert({ cart_id: cart.id, product_variant_id: variantId, quantity });
      if (error) return { error: error.message };
    }

    await fetchCart();
    return { success: true };
  };

  const updateQuantity = async (cartItemId, quantity) => {
    if (quantity < 1) {
      return removeItem(cartItemId);
    }
    const { error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', cartItemId);
    if (error) return { error: error.message };
    await fetchCart();
    return { success: true };
  };

  const removeItem = async (cartItemId) => {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', cartItemId);
    if (error) return { error: error.message };
    await fetchCart();
    return { success: true };
  };

  const clearCart = async () => {
    if (!user) return;
    const { data: cart } = await supabase
      .from('cart')
      .select('id')
      .eq('user_id', user.id)
      .single();
    if (cart) {
      await supabase.from('cart_items').delete().eq('cart_id', cart.id);
    }
    setCartItems([]);
  };

  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce((sum, item) => {
    const price = item.product_variant?.product?.price || 0;
    return sum + price * item.quantity;
  }, 0);

  return (
    <CartContext.Provider value={{ cartItems, loading, addItem, updateQuantity, removeItem, clearCart, itemCount, subtotal, refreshCart: fetchCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);

const FavContext = createContext();

export const FavProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('favorites')
      .select(`
        id, product_id, created_at,
        product:products(
          id, name, slug, price, is_active,
          product_images(id, image_url, is_primary, sort_order),
          product_variants(id, size, color, stock_quantity)
        )
      `)
      .eq('user_id', user.id);

    setFavorites(data || []);
    setLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const toggleFavorite = async (productId) => {
    if (!user) {
      router.push('/login');
      return;
    }

    const existing = favorites.find(f => f.product_id === productId);

    if (existing) {
      await supabase.from('favorites').delete().eq('id', existing.id);
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, product_id: productId });
    }

    await fetchFavorites();
  };

  const isFavorite = (productId) => favorites.some(f => f.product_id === productId);

  return (
    <FavContext.Provider value={{ favorites, loading, toggleFavorite, isFavorite, count: favorites.length, refreshFavorites: fetchFavorites }}>
      {children}
    </FavContext.Provider>
  );
};

export const useFav = () => useContext(FavContext);
