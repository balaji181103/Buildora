
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

export const useCart = () => {
  const context = React.useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
