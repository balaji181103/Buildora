
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Database, Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase-client';
import { collection, writeBatch, serverTimestamp, getDocs, query } from 'firebase/firestore';
import { Customer, Supplier, Product, Order, Address } from '@/lib/types';

// Mock Data
const sampleCustomers: Omit<Customer, 'id' | 'createdAt'>[] = [
    { name: 'Rohan Sharma', email: 'rohan.sharma@example.com', phone: '9876543210', password: 'password123', status: 'Active', loyaltyPoints: 1250, orderCount: 3, addresses: [{ id: 'addr1', label: 'Main Site', line1: 'Sector 5, DLF Phase 3', city: 'Gurgaon', state: 'Haryana', pincode: '122002' }] },
    { name: 'Priya Singh', email: 'priya.singh@example.com', phone: '9876543211', password: 'password123', status: 'Active', loyaltyPoints: 800, orderCount: 2, addresses: [{ id: 'addr2', label: 'Project Alpha', line1: 'Hiranandani Gardens', city: 'Mumbai', state: 'Maharashtra', pincode: '400076' }] },
    { name: 'Amit Patel', email: 'amit.patel@example.com', phone: '9876543212', password: 'password123', status: 'Inactive', loyaltyPoints: 200, orderCount: 1, addresses: [{ id: 'addr3', label: 'Warehouse', line1: 'Peenya Industrial Area', city: 'Bengaluru', state: 'Karnataka', pincode: '560058' }] },
];

const sampleSuppliers: Omit<Supplier, 'id' | 'createdAt'>[] = [
    { name: 'UltraTech Cement', contactPerson: 'Mr. Verma', email: 'contact@ultratech.com', phone: '9988776655', productCount: 0 },
    { name: 'JSW Steel', contactPerson: 'Ms. Reddy', email: 'sales@jsw.in', phone: '9988776654', productCount: 0 },
    { name: 'Kamdhenu Paints', contactPerson: 'Mr. Gupta', email: 'info@kamdhenupaints.com', phone: '9988776653', productCount: 0 },
];

export default function SeederPage() {
    const { toast } = useToast();
    const [loading, setLoading] = React.useState<'customers' | 'suppliers' | 'orders' | null>(null);

    const seedCollection = async (collectionName: string, data: any[], type: 'customers' | 'suppliers' | 'orders') => {
        setLoading(type);
        try {
            const q = query(collection(db, collectionName));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                toast({
                    variant: 'destructive',
                    title: `${type.charAt(0).toUpperCase() + type.slice(1)} already exist`,
                    description: `Please clear the collection in Firestore if you want to re-seed.`,
                });
                return;
            }

            const batch = writeBatch(db);
            data.forEach(item => {
                const docRef = collection(db, collectionName).doc();
                batch.set(docRef, { ...item, createdAt: serverTimestamp() });
            });
            await batch.commit();

            toast({
                title: 'Seeding successful!',
                description: `${data.length} ${type} have been added to the database.`,
            });
        } catch (error) {
            console.error(`Error seeding ${type}:`, error);
            toast({
                variant: 'destructive',
                title: 'Seeding failed',
                description: `Could not add ${type} to the database.`,
            });
        } finally {
            setLoading(null);
        }
    };

    const generateOrders = async () => {
        setLoading('orders');
        try {
            const customersQuery = query(collection(db, "customers"));
            const productsQuery = query(collection(db, "products"));

            const [customersSnapshot, productsSnapshot] = await Promise.all([
                getDocs(customersQuery),
                getDocs(productsQuery)
            ]);

            if (customersSnapshot.empty || productsSnapshot.empty) {
                toast({
                    variant: 'destructive',
                    title: "Cannot generate orders",
                    description: "Please seed customers and products first.",
                });
                return;
            }

            const customers = customersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
            const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));

            const sampleOrders: Omit<Order, 'id' | 'date'>[] = [
                {
                    customerId: customers[0].id, customerName: customers[0].name, status: 'Delivered', total: 4500,
                    shippingAddress: customers[0].addresses[0], items: [{ productId: products[0].id, name: products[0].name, quantity: 2, price: products[0].price }, { productId: products[1].id, name: products[1].name, quantity: 1, price: products[1].price }]
                },
                {
                    customerId: customers[1].id, customerName: customers[1].name, status: 'Out for Delivery', total: 8200,
                    shippingAddress: customers[1].addresses[0], items: [{ productId: products[2].id, name: products[2].name, quantity: 5, price: products[2].price }]
                },
                {
                    customerId: customers[0].id, customerName: customers[0].name, status: 'Processing', total: 1250,
                    shippingAddress: customers[0].addresses[0], items: [{ productId: products[3].id, name: products[3].name, quantity: 1, price: products[3].price }]
                },
                 {
                    customerId: customers[2].id, customerName: customers[2].name, status: 'Cancelled', total: 3000,
                    shippingAddress: customers[2].addresses[0], items: [{ productId: products[4].id, name: products[4].name, quantity: 3, price: products[4].price }]
                },
            ];

            const batch = writeBatch(db);
            let orderIdCounter = 1001; // Start order IDs from 1001
            
            sampleOrders.forEach(order => {
                const docRef = collection(db, "orders").doc(String(orderIdCounter++));
                batch.set(docRef, { ...order, date: serverTimestamp() });
            });
            await batch.commit();
            
            toast({
                title: 'Seeding successful!',
                description: `${sampleOrders.length} orders have been added.`,
            });

        } catch (error) {
            console.error('Error generating orders:', error);
            toast({
                variant: 'destructive',
                title: 'Order generation failed',
                description: `Could not add orders to the database.`,
            });
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="mx-auto grid w-full max-w-4xl gap-6">
            <div className="flex items-center gap-4">
                <Database className="h-8 w-8 text-primary" />
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Data Seeder</h1>
                    <p className="text-muted-foreground">
                        Populate your Firestore database with sample data for testing.
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Seed Collections</CardTitle>
                    <CardDescription>
                        Click the buttons below to add sample documents to your Firestore collections. 
                        This will only work if the collections are empty.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button onClick={() => seedCollection('customers', sampleCustomers, 'customers')} disabled={!!loading}>
                        {loading === 'customers' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Seed Customers
                    </Button>
                    <Button onClick={() => seedCollection('suppliers', sampleSuppliers, 'suppliers')} disabled={!!loading}>
                        {loading === 'suppliers' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Seed Suppliers
                    </Button>
                    <Button onClick={generateOrders} disabled={!!loading}>
                        {loading === 'orders' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Generate Sample Orders
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
