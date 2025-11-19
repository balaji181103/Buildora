
'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound, useRouter, useParams } from 'next/navigation';
import { OrderStatusTracker } from '@/components/ui/order-status-tracker';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, HelpCircle, Loader2, FileText } from 'lucide-react';
import { db } from '@/lib/firebase-client';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import type { Order, Customer } from '@/lib/types';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

declare module 'jspdf' {
    interface jsPDF {
      autoTable: (options: any) => jsPDF;
    }
}

export default function CustomerOrderTrackingPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [order, setOrder] = React.useState<Order | null>(null);
  const [customer, setCustomer] = React.useState<Customer | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!id) return;
    const unsubscribe = onSnapshot(doc(db, "orders", id), async (docSnap) => {
      if (docSnap.exists()) {
        const orderData = { 
            id: docSnap.id, 
            ...docSnap.data(),
            date: docSnap.data().date.toDate() 
        } as Order;
        setOrder(orderData);
        
        if (orderData.customerId) {
            const custRef = doc(db, "customers", orderData.customerId);
            const custSnap = await getDoc(custRef);
            if (custSnap.exists()) {
                setCustomer({ id: custSnap.id, ...custSnap.data() } as Customer);
            }
        }
        setLoading(false);
      } else {
        notFound();
      }
    });

    return () => unsubscribe();
  }, [id]);

  const handleDownloadInvoice = () => {
    if (!order || !customer) return;
    
    const doc = new jsPDF();

    // Add Header
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text("Buildora", 20, 20);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice #${order.id}`, 20, 30);
    doc.text(`Date: ${format(order.date, 'PPP p')}`, 20, 35);
    
    doc.line(20, 40, 190, 40); // separator

    // Shipping Address
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text("Shipping Address", 20, 50);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const address = order.shippingAddress;
    const addressLines = [
        order.customerName,
        customer.phone || 'No phone number provided',
        address.line1,
        address.line2,
        `${address.city}, ${address.state} - ${address.pincode}`
    ].filter(Boolean); // filter out empty lines e.g. line2
    doc.text(addressLines, 20, 58);
    
    doc.line(20, 85, 190, 85); // separator

    // Order Items Table
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text("Order Details", 20, 95);
    
    const tableColumn = ["Product Name", "Quantity", "Price (INR)", "Total (INR)"];
    const tableRows: (string|number)[][] = [];

    order.items.forEach(item => {
        const row = [
            item.name,
            item.quantity,
            item.price.toFixed(2),
            (item.price * item.quantity).toFixed(2)
        ];
        tableRows.push(row);
    });

    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 100,
        theme: 'striped',
        headStyles: { fillColor: [34, 139, 34] }, // A shade of green
        didParseCell: function (data) {
            if (data.column.index >= 2) { // Right-align price and total columns
                data.cell.styles.halign = 'right';
            }
        }
    });

    // Totals
    let finalY = (doc as any).lastAutoTable.finalY || 140;
    
    const rightAlignX = 190;
    const leftAlignX = 140;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    const subtotal = order.subtotal ?? order.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const shippingCost = order.shippingCost ?? 0;
    const taxes = order.taxes ?? subtotal * 0.18;
    const finalTotal = order.total ?? (subtotal + shippingCost + taxes);
    const shippingMethod = order.deliveryMethod === 'faster' ? 'Fast Shipping' : 'Standard Delivery';
    
    finalY += 10;
    doc.text("Subtotal:", leftAlignX, finalY);
    doc.text(`${subtotal.toFixed(2)} INR`, rightAlignX, finalY, { align: 'right' });

    finalY += 7;
    doc.text(`Shipping (${shippingMethod}):`, leftAlignX, finalY);
    doc.text(`${shippingCost.toFixed(2)} INR`, rightAlignX, finalY, { align: 'right' });

    finalY += 7;
    doc.text("GST (18%):", leftAlignX, finalY);
    doc.text(`${taxes.toFixed(2)} INR`, rightAlignX, finalY, { align: 'right' });
    
    finalY += 5;
    doc.line(leftAlignX, finalY, 190, finalY); // separator for total

    finalY += 5;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text("Total Paid:", leftAlignX, finalY);
    doc.text(`${finalTotal.toFixed(2)} INR`, rightAlignX, finalY, { align: 'right' });

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text("Thank you for your business!", 105, 280, { align: 'center' });
    
    doc.save(`Buildora-Invoice-${order.id}.pdf`);
}

  if (loading || !order) {
    return (
        <div className="flex h-96 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    )
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Back to Orders</span>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Track Order</h1>
          <p className="text-muted-foreground">Order ID: #{order.id}</p>
        </div>
      </div>
      
      <OrderStatusTracker currentStatus={order.status} />

      <div className="grid grid-cols-1 gap-6 items-start">
         <Card className="max-w-sm mx-auto w-full">
            <CardHeader>
                <CardTitle>Actions</CardTitle>
            </CardHeader>
             <CardContent className="grid gap-2">
                 <Button variant="outline" className="w-full justify-start gap-2" onClick={handleDownloadInvoice}>
                    <FileText className="h-4 w-4" /> Download Invoice
                </Button>
                 <Button variant="outline" className="w-full justify-start gap-2">
                    <HelpCircle className="h-4 w-4" /> Contact Support
                </Button>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
