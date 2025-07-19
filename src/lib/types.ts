

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

export type Address = {
    id: string;
    label: string; // e.g., "Home", "Work Site"
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  status: 'Active' | 'Inactive';
  loyaltyPoints: number;
  orderCount: number;
  addresses: Address[];
};

export type LoyaltyHistoryItem = {
    date: string;
    description: string;
    type: 'earned' | 'redeemed';
    points: number;
};

export type LoyaltyOffer = {
    title: string;
    points: number;
};

export type LoyaltyData = {
    currentPoints: number;
    history: LoyaltyHistoryItem[];
    availableOffers: LoyaltyOffer[];
};

export type CartItem = {
  product: Product;
  quantity: number;
};
