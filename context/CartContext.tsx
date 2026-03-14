"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";

export interface CartItem {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  description?: string;
  quantity: number;
  maxStock?: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (
    product: {
      id: string;
      slug: string;
      name: string;
      price: number;
      image: string;
      description?: string;
    },
    maxStock?: number
  ) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number, maxStock?: number) => void;
  clearCart: () => void;
  itemCount: number;
  totalPrice: number;
  isHydrated: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("walker_sutton_cart");
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error("Failed to parse cart from localStorage", error);
      }
    }
    setIsInitialized(true);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem("walker_sutton_cart", JSON.stringify(items));
    }
  }, [items, isInitialized]);

  const addItem = useCallback(
    (
      product: {
        id: string;
        slug: string;
        name: string;
        price: number;
        image: string;
        description?: string;
      },
      maxStock?: number
    ) => {
      setItems((prevItems) => {
        const existingItem = prevItems.find((item) => item.id === product.id);
        if (existingItem) {
          const currentLimit = maxStock ?? existingItem.maxStock;
          if (currentLimit !== undefined && existingItem.quantity >= currentLimit) {
            return prevItems;
          }

          return prevItems.map((item) =>
            item.id === product.id
              ? {
                  ...item,
                  ...product,
                  quantity: item.quantity + 1,
                  maxStock: maxStock ?? item.maxStock,
                }
              : item
          );
        }
        return [...prevItems, { ...product, quantity: 1, maxStock }];
      });
    },
    []
  );

  const removeItem = useCallback((productId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== productId));
  }, []);

  const updateQuantity = useCallback(
    (productId: string, quantity: number, maxStock?: number) => {
      if (quantity <= 0) {
        removeItem(productId);
        return;
      }

      setItems((prevItems) => {
        const item = prevItems.find((i) => i.id === productId);
        if (!item) return prevItems;

        const currentLimit = maxStock ?? item.maxStock;
        const finalQuantity =
          currentLimit !== undefined && quantity > currentLimit ? currentLimit : quantity;

        return prevItems.map((item) =>
          item.id === productId
            ? { ...item, quantity: finalQuantity, maxStock: maxStock ?? item.maxStock }
            : item
        );
      });
    },
    [removeItem]
  );

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalPrice,
        itemCount,
        isHydrated: isInitialized,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
