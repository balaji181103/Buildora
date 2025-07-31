
import type { Order, Product, Customer, LoyaltyData, Address, Supplier } from '@/lib/types';

// Mock data for components that are not yet connected to Firestore
// This data will be replaced as the application is developed.

export let products: Product[] = [];
export let suppliers: Supplier[] = [];
export let customers: Customer[] = [];
export let allOrders: Order[] = [];

export const loyaltyData: LoyaltyData = {
    currentPoints: 0,
    history: [],
    availableOffers: [
        { title: '₹500 Off Your Next Order', points: 5000 },
        { title: 'Free Drone Delivery', points: 2500 },
        { title: '15% Off on Tools', points: 7500 },
    ]
};
