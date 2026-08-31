'use client';

import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { showToast, showError } from '@/lib/sweetalert';

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

    const activeItems = [];
    const staleIds = [];
    for (const item of items || []) {
      if (item.product_variant?.product?.is_active) {
        activeItems.push(item);
      } else {
        staleIds.push(item.id);
      }
    }
    if (staleIds.length > 0) {
      await supabase.from('cart_items').delete().in('id', staleIds);
    }

    setCartItems(activeItems);
    setLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addItem = async (variantId, quantity = 1) => {
    if (!user) {
      showToast('error', 'Please login to add items to your cart.');
      router.push('/login');
      return { error: 'Please login to add items to cart' };
    }

    let { data: cart } = await supabase
      .from('cart')
      .select('id')
      .eq('user_id', user.id)
      .single();

    let creationError = null;
    if (!cart) {
      const { data: newCart, error } = await supabase
        .from('cart')
        .insert({ user_id: user.id })
        .select('id')
        .single();
      if (error) {
        creationError = error.message;
      } else {
        cart = newCart;
      }
    }

    const existing = cartItems.find(item => item.product_variant_id === variantId);

    if (existing && !creationError) {
      const newQty = existing.quantity + quantity;
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: newQty })
        .eq('id', existing.id);
      if (error) {
        showError('Could not update cart', error.message);
        return { error: error.message };
      }
    } else if (!creationError) {
      const { error } = await supabase
        .from('cart_items')
        .insert({ cart_id: cart.id, product_variant_id: variantId, quantity });
      if (error) {
        showError('Could not add to cart', error.message);
        return { error: error.message };
      }
    } else {
      showError('Could not add to cart', creationError);
      return { error: creationError };
    }

    await fetchCart();
    showToast('success', 'Added to cart!');
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
    if (error) {
      showError('Could not update quantity', error.message);
      return { error: error.message };
    }
    await fetchCart();
    showToast('success', 'Cart updated.');
    return { success: true };
  };

  const removeItem = async (cartItemId) => {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', cartItemId);
    if (error) {
      showError('Could not remove item', error.message);
      return { error: error.message };
    }
    await fetchCart();
    showToast('success', 'Removed from cart.');
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

    const activeFavorites = [];
    const staleIds = [];
    for (const fav of data || []) {
      if (fav.product?.is_active) {
        activeFavorites.push(fav);
      } else {
        staleIds.push(fav.id);
      }
    }
    if (staleIds.length > 0) {
      await supabase.from('favorites').delete().in('id', staleIds);
    }

    setFavorites(activeFavorites);
    setLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const toggleFavorite = async (productId) => {
    if (!user) {
      showToast('error', 'Please login to save favorites.');
      router.push('/login');
      return;
    }

    const existing = favorites.find(f => f.product_id === productId);

    if (existing) {
      const { error } = await supabase.from('favorites').delete().eq('id', existing.id);
      if (error) {
        showError('Could not update favorites', error.message);
        return;
      }
      await fetchFavorites();
      showToast('success', 'Removed from favorites.');
    } else {
      const { error } = await supabase.from('favorites').insert({ user_id: user.id, product_id: productId });
      if (error) {
        showError('Could not update favorites', error.message);
        return;
      }
      await fetchFavorites();
      showToast('success', 'Added to favorites!');
    }
  };

  const isFavorite = (productId) => favorites.some(f => f.product_id === productId);

  return (
    <FavContext.Provider value={{ favorites, loading, toggleFavorite, isFavorite, count: favorites.length, refreshFavorites: fetchFavorites }}>
      {children}
    </FavContext.Provider>
  );
};

export const useFav = () => useContext(FavContext);
