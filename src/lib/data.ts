import type { Drone, Order, Product } from '@/lib/types';

export const drones: Drone[] = [
  { id: 'SB-001', status: 'Idle', battery: 100, location: 'Warehouse A', flightHours: 0, lastMaintenance: new Date().toISOString().split('T')[0] },
  { id: 'SB-002', status: 'Idle', battery: 100, location: 'Warehouse A', flightHours: 0, lastMaintenance: new Date().toISOString().split('T')[0] },
  { id: 'SB-003', status: 'Idle', battery: 100, location: 'Warehouse A', flightHours: 0, lastMaintenance: new Date().toISOString().split('T')[0] },
  { id: 'SB-004', status: 'Idle', battery: 100, location: 'Hangar 1', flightHours: 0, lastMaintenance: new Date().toISOString().split('T')[0] },
  { id: 'SB-005', status: 'Idle', battery: 100, location: 'Warehouse B', flightHours: 0, lastMaintenance: new Date().toISOString().split('T')[0] },
];

export const recentOrders: Order[] = [];

export const allOrders: Order[] = [];


export const products: Product[] = [
    { id: 'PROD-001', name: 'Power Drill Kit', category: 'Tools', stock: 0, price: 0, supplier: 'ToolMaster' },
    { id: 'PROD-002', name: 'Concrete Mix (50lb)', category: 'Materials', stock: 0, price: 0, supplier: 'Cemex' },
    { id: 'PROD-003', name: 'Safety Goggles (12-pack)', category: 'Safety Gear', stock: 0, price: 0, supplier: 'SafeCo' },
    { id: 'PROD-004', name: 'I-Beam Steel 10ft', category: 'Structural', stock: 0, price: 0, supplier: 'SteelWorks' },
    { id: 'PROD-005', name: 'Hard Hat - Orange', category: 'Safety Gear', stock: 0, price: 0, supplier: 'SafeCo' },
];
