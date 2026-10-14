'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import type { CartItem, CartItemSnapshot } from '@/types';

const STORAGE_KEY = 'golden-tiger-cart-v1';

type CartAction =
  | { type: 'ADD_ITEM'; snapshot: CartItemSnapshot; quantity: number; openCart: boolean }
  | { type: 'REMOVE_ITEM'; id: string }
  | { type: 'SET_QUANTITY'; id: string; quantity: number }
  | { type: 'INCREMENT'; id: string }
  | { type: 'DECREMENT'; id: string }
  | { type: 'CLEAR_CART' }
  | { type: 'HYDRATE'; items: CartItem[] };

interface CartState {
  items: CartItem[];
  hydrated: boolean;
}

const initialState: CartState = {
  items: [],
  hydrated: false,
};

function enforceLimit(quantity: number, stock: number): number {
  const max = Math.min(stock, 10);
  return Math.max(1, Math.min(quantity, max));
}

function reducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'HYDRATE':
      return { ...state, items: action.items, hydrated: true };

    case 'ADD_ITEM': {
      const existing = state.items.find((i) => i.id === action.snapshot.id);
      if (existing) {
        const newQty = enforceLimit(
          existing.quantity + action.quantity,
          existing.stock
        );
        return {
          ...state,
          items: state.items.map((i) =>
            i.id === action.snapshot.id ? { ...i, quantity: newQty } : i
          ),
        };
      }
      const qty = enforceLimit(action.quantity, action.snapshot.stock);
      return {
        ...state,
        items: [...state.items, { ...action.snapshot, quantity: qty }],
      };
    }

    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter((i) => i.id !== action.id),
      };

    case 'SET_QUANTITY':
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === action.id
            ? { ...i, quantity: enforceLimit(action.quantity, i.stock) }
            : i
        ),
      };

    case 'INCREMENT':
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === action.id
            ? { ...i, quantity: enforceLimit(i.quantity + 1, i.stock) }
            : i
        ),
      };

    case 'DECREMENT':
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === action.id
            ? { ...i, quantity: enforceLimit(i.quantity - 1, i.stock) }
            : i
        ),
      };

    case 'CLEAR_CART':
      return { ...state, items: [] };

    default:
      return state;
  }
}

interface CartContextValue {
  items: CartItem[];
  hydrated: boolean;
  itemCount: number;
  addItem: (snapshot: CartItemSnapshot, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  incrementItem: (id: string) => void;
  decrementItem: (id: string) => void;
  clearCart: () => void;
  openMiniCart: () => void;
  closeMiniCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const hasHydrated = useRef(false);

  useEffect(() => {
    if (hasHydrated.current) return;
    hasHydrated.current = true;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[];
        if (Array.isArray(parsed)) {
          dispatch({ type: 'HYDRATE', items: parsed });
          return;
        }
      }
    } catch {
      // ignore parse errors
    }
    dispatch({ type: 'HYDRATE', items: [] });
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    } catch {
      // ignore quota errors
    }
  }, [state.items, state.hydrated]);

  const addItem = useCallback(
    (snapshot: CartItemSnapshot, quantity = 1) => {
      dispatch({ type: 'ADD_ITEM', snapshot, quantity, openCart: true });
      window.dispatchEvent(new CustomEvent('golden-tiger-open-minicart'));
    },
    []
  );

  const removeItem = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_ITEM', id });
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    dispatch({ type: 'SET_QUANTITY', id, quantity });
  }, []);

  const incrementItem = useCallback((id: string) => {
    dispatch({ type: 'INCREMENT', id });
  }, []);

  const decrementItem = useCallback((id: string) => {
    dispatch({ type: 'DECREMENT', id });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' });
  }, []);

  const openMiniCart = useCallback(() => {
    window.dispatchEvent(new CustomEvent('golden-tiger-open-minicart'));
  }, []);

  const closeMiniCart = useCallback(() => {
    window.dispatchEvent(new CustomEvent('golden-tiger-close-minicart'));
  }, []);

  const itemCount = useMemo(
    () => state.items.reduce((sum, i) => sum + i.quantity, 0),
    [state.items]
  );

  const value: CartContextValue = {
    items: state.items,
    hydrated: state.hydrated,
    itemCount,
    addItem,
    removeItem,
    updateQuantity,
    incrementItem,
    decrementItem,
    clearCart,
    openMiniCart,
    closeMiniCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return ctx;
}
