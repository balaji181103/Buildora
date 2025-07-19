
export type Drone = {
  id: string;
  status: 'Idle' | 'Delivering' | 'Returning' | 'Maintenance';
  battery: number;
  location: string;
  flightHours: number;
  lastMaintenance: string;
};

export type Truck = {
  id: string;
  status: 'Idle' | 'Delivering' | 'Returning' | 'Maintenance';
  location: string;
  mileage: number;
  lastMaintenance: string;
};

export type Order = {
  id: string;
  customer: string;
  status: 'Pending' | 'Processing' | 'Delivered' | 'Cancelled';
  date: string;
  total: number;
  deliveryMethod: 'Drone' | 'Truck';
  deliveryVehicleId: string;
};

export type Product = {
  id: string;
  name: string;
  category: string;
  stock: number;
  price: number;
  supplier: string;
  weight: number; // in kg
  dimensions: { // in cm
    length: number;
    width: number;
    height: number;
  };
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  status: 'Active' | 'Inactive';
  loyaltyPoints: number;
  orderCount: number;
};
