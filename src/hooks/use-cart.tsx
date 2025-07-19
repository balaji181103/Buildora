
"use client"

import * as React from "react"
import type { Product, CartItem } from "@/lib/types"

type CartContextType = {
  cart: CartItem[]
  addItem: (product: Product, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
}

export const CartContext = React.createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = React.useState<CartItem[]>([])

  const addItem = React.useCallback((product: Product, quantity: number = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id)
      if (existingItem) {
        return prevCart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      }
      return [...prevCart, { product, quantity }]
    })
  }, [])

  const removeItem = React.useCallback((productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId))
  }, [])

  const updateQuantity = React.useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId)
    } else {
      setCart(prevCart =>
        prevCart.map(item =>
          item.product.id === productId ? { ...item, quantity } : item
        )
      )
    }
  }, [removeItem])

  const clearCart = React.useCallback(() => {
    setCart([])
  }, [])

  const value = React.useMemo(() => ({
    cart,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
  }), [cart, addItem, removeItem, updateQuantity, clearCart]);


  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}


export const useCart = () => {
  const context = React.useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
