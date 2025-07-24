

import type { Drone, Order, Product, Truck, Customer, LoyaltyData, Address, Supplier } from '@/lib/types';

// Mock data for components that are not yet connected to Firestore
// This data will be replaced as the application is developed.

export const drones: Drone[] = [
  { id: 'SB-001', status: 'Idle', battery: 100, location: 'Warehouse A', flightHours: 0, lastMaintenance: new Date().toISOString().split('T')[0] },
  { id: 'SB-002', status: 'Idle', battery: 100, location: 'Warehouse A', flightHours: 0, lastMaintenance: new Date().toISOString().split('T')[0] },
  { id: 'SB-003', status: 'Idle', battery: 100, location: 'Warehouse A', flightHours: 0, lastMaintenance: new Date().toISOString().split('T')[0] },
  { id: 'SB-004', status: 'Idle', battery: 100, location: 'Hangar 1', flightHours: 0, lastMaintenance: new Date().toISOString().split('T')[0] },
  { id: 'SB-005', status: 'Idle', battery: 100, location: 'Warehouse B', flightHours: 0, lastMaintenance: new Date().toISOString().split('T')[0] },
];

export const trucks: Truck[] = [
    { id: 'TR-01', status: 'Idle', location: 'Main Depot', mileage: 0, lastMaintenance: '2024-05-01' },
    { id: 'TR-02', status: 'Idle', location: 'Main Depot', mileage: 0, lastMaintenance: '2024-06-15' },
];

export let products: Product[] = [];
export let suppliers: Supplier[] = [];
export let customers: Customer[] = [];
export let allOrders: Order[] = [];

export const loyaltyData: LoyaltyData = {
    currentPoints: 1250,
    history: [
        { date: '2024-07-20', description: 'Order #ORD-123', type: 'earned', points: 500 },
        { date: '2024-07-18', description: 'Redeemed: 10% Off Coupon', type: 'redeemed', points: 1000 },
        { date: '2024-07-15', description: 'Order #ORD-119', type: 'earned', points: 750 },
        { date: '2024-07-10', description: 'Sign-up Bonus', type: 'earned', points: 1000 },
    ],
    availableOffers: [
        { title: '₹500 Off Your Next Order', points: 5000 },
        { title: 'Free Drone Delivery', points: 2500 },
        { title: '15% Off on Tools', points: 7500 },
    ]
};
