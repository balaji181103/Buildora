export type Drone = {
  id: string;
  status: 'Idle' | 'Delivering' | 'Returning' | 'Maintenance';
  battery: number;
  location: string;
  flightHours: number;
  lastMaintenance: string;
};

export type Order = {
  id: string;
  customer: string;
  status: 'Pending' | 'Processing' | 'Delivered' | 'Cancelled';
  date: string;
  total: number;
  droneId: string;
};

export type Product = {
  id: string;
  name: string;
  category: string;
  stock: number;
  price: number;
  supplier: string;
};
