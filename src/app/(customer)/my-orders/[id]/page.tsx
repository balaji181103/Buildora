
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
import { doc, onSnapshot } from 'firebase/firestore';
import type { Order } from '@/lib/types';
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
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!id) return;
    const unsubscribe = onSnapshot(doc(db, "orders", id), (docSnap) => {
      if (docSnap.exists()) {
        const orderData = { 
            id: docSnap.id, 
            ...docSnap.data(),
            date: docSnap.data().date.toDate() 
        } as Order;
        setOrder(orderData);
        setLoading(false);
      } else {
        notFound();
      }
    });

    return () => unsubscribe();
  }, [id]);

  const handleDownloadInvoice = () => {
    if (!order) return;
    
    const doc = new jsPDF();
    const gstRate = 0.18;
    const subtotal = order.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const gstAmount = subtotal * gstRate;

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
        address.line1,
        address.line2,
        `${address.city}, ${address.state} - ${address.pincode}`
    ].filter(Boolean); // filter out empty lines e.g. line2
    doc.text(addressLines, 20, 58);
    
    doc.line(20, 80, 190, 80); // separator

    // Order Items Table
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text("Order Details", 20, 90);
    
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
        startY: 95,
        theme: 'striped',
        headStyles: { fillColor: [24, 158, 109] }, // Primary color
    });

    // Totals
    let finalY = (doc as any).lastAutoTable.finalY || 140;
    
    const rightAlign = 190;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');

    doc.text("Subtotal:", 140, finalY + 10);
    doc.text(`${subtotal.toFixed(2)} INR`, rightAlign, finalY + 10, { align: 'right' });

    doc.text("GST (18%):", 140, finalY + 17);
    doc.text(`${gstAmount.toFixed(2)} INR`, rightAlign, finalY + 17, { align: 'right' });
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text("Total Paid:", 140, finalY + 25);
    doc.text(`${order.total.toFixed(2)} INR`, rightAlign, finalY + 25, { align: 'right' });

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
