import supabase from './supabaseClient';

export interface CartDatabaseItem {
  id?: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at?: string;
  updated_at?: string;
}

export async function fetchUserCart(userId: string): Promise<CartDatabaseItem[]> {
  try {
    const { data, error } = await supabase
      .from('carts')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching cart:', error);
      throw error;
    }
    return data || [];
  } catch (err) {
    console.error('Failed to fetch user cart:', err);
    return [];
  }
}

export async function addToCart(userId: string, productId: string, quantity: number): Promise<CartDatabaseItem | null> {
  try {
    const { data, error } = await supabase
      .from('carts')
      .upsert({ user_id: userId, product_id: productId, quantity })
      .select()
      .single();

    if (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
    return data;
  } catch (err) {
    console.error('Failed to add to cart:', err);
    return null;
  }
}

export async function updateCartQuantity(userId: string, productId: string, quantity: number): Promise<CartDatabaseItem | null> {
  try {
    if (quantity < 1) {
      // Remove item if quantity is 0 or less
      await removeFromCart(userId, productId);
      return null;
    }

    const { data, error } = await supabase
      .from('carts')
      .update({ quantity })
      .eq('user_id', userId)
      .eq('product_id', productId)
      .select()
      .single();

    if (error) {
      console.error('Error updating cart quantity:', error);
      throw error;
    }
    return data;
  } catch (err) {
    console.error('Failed to update cart quantity:', err);
    return null;
  }
}

export async function removeFromCart(userId: string, productId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('carts')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId);

    if (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  } catch (err) {
    console.error('Failed to remove from cart:', err);
  }
}

export async function clearUserCart(userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('carts')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  } catch (err) {
    console.error('Failed to clear cart:', err);
  }
}
