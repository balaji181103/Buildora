import type { Drone, Order, Product } from '@/lib/types';

const USD_TO_INR = 83.33;

export const drones: Drone[] = [
  { id: 'SB-001', status: 'Idle', battery: 98, location: 'Warehouse A', flightHours: 120, lastMaintenance: '2024-06-15' },
  { id: 'SB-002', status: 'Delivering', battery: 65, location: 'Site B (En Route)', flightHours: 85, lastMaintenance: '2024-07-01' },
  { id: 'SB-003', status: 'Returning', battery: 45, location: 'Site C (Returning)', flightHours: 210, lastMaintenance: '2024-05-20' },
  { id: 'SB-004', status: 'Maintenance', battery: 100, location: 'Hangar 1', flightHours: 350, lastMaintenance: '2024-07-20' },
  { id: 'SB-005', status: 'Idle', battery: 92, location: 'Warehouse B', flightHours: 45, lastMaintenance: '2024-07-10' },
];

export const recentOrders: Order[] = [
  { id: 'ORD-1772', customer: 'Construct Inc.', status: 'Delivered', date: '2024-07-23', total: 1250.00 * USD_TO_INR, droneId: 'SB-002' },
  { id: 'ORD-1771', customer: 'BuildRight', status: 'Processing', date: '2024-07-23', total: 850.50 * USD_TO_INR, droneId: 'SB-001' },
  { id: 'ORD-1770', customer: 'MegaBuilders', status: 'Delivered', date: '2024-07-22', total: 3200.75 * USD_TO_INR, droneId: 'SB-003' },
  { id: 'ORD-1769', customer: 'Construct Inc.', status: 'Cancelled', date: '2024-07-22', total: 450.00 * USD_TO_INR, droneId: 'N/A' },
  { id: 'ORD-1768', customer: 'SiteWorks', status: 'Delivered', date: '2024-07-21', total: 150.25 * USD_TO_INR, droneId: 'SB-005' },
];

export const allOrders: Order[] = [
  ...recentOrders,
  { id: 'ORD-1767', customer: 'BuildRight', status: 'Delivered', date: '2024-07-20', total: 990.00 * USD_TO_INR, droneId: 'SB-001' },
  { id: 'ORD-1766', customer: 'MegaBuilders', status: 'Delivered', date: '2024-07-19', total: 2100.00 * USD_TO_INR, droneId: 'SB-004' },
];


export const products: Product[] = [
    { id: 'PROD-001', name: 'Power Drill Kit', category: 'Tools', stock: 15, price: 199.99 * USD_TO_INR, supplier: 'ToolMaster' },
    { id: 'PROD-002', name: 'Concrete Mix (50lb)', category: 'Materials', stock: 200, price: 25.50 * USD_TO_INR, supplier: 'Cemex' },
    { id: 'PROD-003', name: 'Safety Goggles (12-pack)', category: 'Safety Gear', stock: 80, price: 60.00 * USD_TO_INR, supplier: 'SafeCo' },
    { id: 'PROD-004', name: 'I-Beam Steel 10ft', category: 'Structural', stock: 8, price: 450.00 * USD_TO_INR, supplier: 'SteelWorks' },
    { id: 'PROD-005', name: 'Hard Hat - Orange', category: 'Safety Gear', stock: 150, price: 15.00 * USD_TO_INR, supplier: 'SafeCo' },
];
