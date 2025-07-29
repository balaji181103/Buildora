

export type OrderStatus = 'Pending' | 'Processing' | 'Out for Delivery' | 'Delivered' | 'Cancelled';

export type OrderItem = {
  productId: string;
  name: string;
  quantity: number;
  price: number;
};

export type Order = {
  id: string;
  customerName: string;
  customerId: string;
  status: OrderStatus;
  date: any; // Using 'any' for Firestore ServerTimestamp
  total: number;
  items: OrderItem[];
  shippingAddress: Address;
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
  imageUrl?: string;
  description?: string;
  createdAt?: any;
};

export type Supplier = {
    id: string;
    name: string;
    contactPerson: string;
    email: string;
    phone: string;
    productCount: number;
    createdAt?: any;
};

export type Address = {
    id: string;
    label: string; // e.g., "Home", "Work Site"
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
    latitude?: number;
    longitude?: number;
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  password?: string; // Should be handled by Auth in a real app
  status: 'Active' | 'Inactive';
  loyaltyPoints: number;
  orderCount: number;
  addresses: Address[];
  createdAt?: any;
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
