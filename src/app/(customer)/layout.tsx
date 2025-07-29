
'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuPortal, DropdownMenuSubContent } from "@/components/ui/dropdown-menu";
import { Calculator, Home, LogOut, Menu, Moon, Package, Rocket, Search, Settings, ShoppingCart, Sun, Award, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useCart } from "@/hooks/use-cart.tsx";
import { db } from '@/lib/firebase-client';
import { collection, doc, getDocs, limit, onSnapshot, query, where, orderBy, startAt, endAt } from 'firebase/firestore';
import { Customer, Product } from '@/lib/types';

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { setTheme } = useTheme();
  const { cart } = useCart();
  const [customer, setCustomer] = React.useState<Customer | null>(null);

  const [searchQuery, setSearchQuery] = React.useState('');
  const [suggestions, setSuggestions] = React.useState<Product[]>([]);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = React.useState(false);

  React.useEffect(() => {
    const customerId = localStorage.getItem('loggedInCustomerId');
    if (customerId) {
        const docRef = doc(db, 'customers', customerId);
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                setCustomer({ id: docSnap.id, ...docSnap.data() } as Customer);
            }
        });
        return () => unsubscribe();
    }
  }, []);

  React.useEffect(() => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      setIsSuggestionsOpen(false);
      return;
    }

    const fetchSuggestions = async () => {
      const lowerCaseQuery = searchQuery.toLowerCase();
      const q = query(
        collection(db, 'products'),
        orderBy('name'),
        startAt(lowerCaseQuery),
        endAt(lowerCaseQuery + '\uf8ff'),
        limit(5)
      );
      
      const querySnapshot = await getDocs(q);
      const productSuggestions = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Product))
        .filter(product => product.name.toLowerCase().includes(lowerCaseQuery));

      setSuggestions(productSuggestions);
      setIsSuggestionsOpen(productSuggestions.length > 0);
    };

    const debounceTimer = setTimeout(() => {
      fetchSuggestions();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleLogout = () => {
    localStorage.removeItem('loggedInCustomerId');
    setCustomer(null);
    router.push('/');
  };
  
  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`;
    }
    return names[0]?.[0] || '';
  };


  const totalCartItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  const showFloatingCart = pathname !== '/cart' && pathname !== '/checkout';

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="sm:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="sm:max-w-xs">
              <nav className="grid gap-6 text-lg font-medium">
                <Link
                  href="/home"
                  className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
                >
                  <Rocket className="h-5 w-5 transition-all group-hover:scale-110" />
                  <span className="sr-only">Buildora</span>
                </Link>
                <Link
                  href="/home"
                  className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                >
                  <Home className="h-5 w-5" />
                  Shop
                </Link>
                <Link
                  href="/my-orders"
                  className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                >
                  <Package className="h-5 w-5" />
                  My Orders
                </Link>
                <Link
                  href="/loyalty"
                  className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                >
                  <Award className="h-5 w-5" />
                  Loyalty
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
          
          <Button variant="ghost" size="icon" className="hidden sm:inline-flex" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back</span>
          </Button>

          <div className="relative ml-auto flex-1 md:grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products..."
              className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => { if (suggestions.length > 0) setIsSuggestionsOpen(true); }}
              onBlur={() => setTimeout(() => setIsSuggestionsOpen(false), 150)}
            />
            {isSuggestionsOpen && (
              <div className="absolute z-50 mt-1 w-full rounded-lg border bg-background shadow-lg">
                <ul className="py-1">
                  {suggestions.map((product) => (
                    <li key={product.id}>
                      <Link 
                        href={`/products/${product.id}`} 
                        className="flex items-center gap-4 px-4 py-2 hover:bg-accent"
                        onClick={() => {
                          setSearchQuery('');
                          setIsSuggestionsOpen(false);
                        }}
                      >
                         <Image 
                           src={product.imageUrl || 'https://placehold.co/40x40.png'}
                           alt={product.name}
                           width={40}
                           height={40}
                           className="rounded-md object-cover"
                         />
                         <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">{product.category}</p>
                         </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <Button variant="ghost" size="icon" className="relative" asChild>
            <Link href="/cart">
              <ShoppingCart className="h-5 w-5"/>
              <span className="sr-only">Shopping Cart</span>
              {totalCartItems > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">{totalCartItems}</span>
              )}
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="overflow-hidden rounded-full"
              >
                <Avatar>
                  <AvatarImage src={customer?.profilePictureUrl} alt={customer?.name} />
                  <AvatarFallback>{customer ? getInitials(customer.name) : '...'}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{customer?.name || 'My Account'}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/account-settings')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/my-orders')}>
                <Package className="mr-2 h-4 w-4" />
                <span>My Orders</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/loyalty')}>
                <Award className="mr-2 h-4 w-4" />
                <span>Loyalty</span>
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  Theme
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => setTheme("light")}>
                      <Sun className="mr-2 h-4 w-4" />
                      <span>Light</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("dark")}>
                      <Moon className="mr-2 h-4 w-4" />
                      <span>Dark</span>
                    </DropdownMenuItem>
                     <DropdownMenuItem onClick={() => setTheme("system")}>
                      System
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
               <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        {children}
      </main>

      {/* Floating Cart Button */}
      {showFloatingCart && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button asChild size="icon" className="relative h-14 w-14 rounded-full shadow-lg">
            <Link href="/cart">
                <ShoppingCart className="h-6 w-6"/>
                <span className="sr-only">Shopping Cart</span>
                {totalCartItems > 0 && (
                  <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">{totalCartItems}</span>
                )}
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
