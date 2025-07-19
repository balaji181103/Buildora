
import type { Drone, Order, Product, Truck, Customer, LoyaltyData } from '@/lib/types';

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

export const recentOrders: Order[] = [];

export const allOrders: Order[] = [];


export const products: Product[] = [
    { id: 'PROD-001', name: 'Power Drill Kit', category: 'Tools', stock: 0, price: 0, supplier: 'ToolMaster', weight: 5, dimensions: { length: 40, width: 30, height: 15 } }, // Lightweight, can be delivered by drone
    { id: 'PROD-002', name: 'Concrete Mix (50lb)', category: 'Materials', stock: 0, price: 0, supplier: 'Cemex', weight: 22.7, dimensions: { length: 60, width: 40, height: 15 } }, // Heavy, requires a truck
    { id: 'PROD-003', name: 'Safety Goggles (12-pack)', category: 'Safety Gear', stock: 0, price: 0, supplier: 'SafeCo', weight: 1, dimensions: { length: 25, width: 20, height: 10 } }, // Lightweight, can be delivered by drone
    { id: 'PROD-004', name: 'I-Beam Steel 10ft', category: 'Structural', stock: 0, price: 0, supplier: 'SteelWorks', weight: 90, dimensions: { length: 305, width: 10, height: 10 } }, // Heavy, requires a truck
    { id: 'PROD-005', name: 'Hard Hat - Orange', category: 'Safety Gear', stock: 0, price: 0, supplier: 'SafeCo', weight: 0.5, dimensions: { length: 30, width: 25, height: 20 } }, // Lightweight, can be delivered by drone
];

export const customers: Customer[] = [
    { id: 'CUST-001', name: 'Priya Sharma', email: 'priya.sharma@example.com', status: 'Active', loyaltyPoints: 0, orderCount: 0 },
    { id: 'CUST-002', name: 'Rohan Gupta', email: 'rohan.gupta@example.com', status: 'Active', loyaltyPoints: 0, orderCount: 0 },
    { id: 'CUST-003', name: 'Anjali Verma', email: 'anjali.verma@example.com', status: 'Active', loyaltyPoints: 0, orderCount: 0 },
    { id: 'CUST-004', name: 'Vikram Singh', email: 'vikram.singh@example.com', status: 'Inactive', loyaltyPoints: 0, orderCount: 0 },
];

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
