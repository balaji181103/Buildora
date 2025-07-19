
"use client"

import { CartProvider as BaseCartProvider } from "@/hooks/use-cart"

export function CartProvider({ children }: { children: React.ReactNode }) {
  return <BaseCartProvider>{children}</BaseCartProvider>
}
