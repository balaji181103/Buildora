
import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { droneId } = req.query;

  if (!droneId || typeof droneId !== 'string') {
    return res.status(400).json({ error: "Missing or invalid 'droneId' query parameter." });
  }

  if (!adminDb) {
    return res.status(500).json({ error: 'Firebase Admin SDK not initialized.' });
  }

  try {
    const ordersRef = adminDb.collection("orders");
    const snapshot = await ordersRef
      .where("deliveryVehicleId", "==", droneId)
      .where("status", "==", "Processing")
      .limit(1)
      .get();

    if (snapshot.empty) {
      console.log(`No mission found for drone ${droneId}`);
      return res.status(200).json({}); // No mission, send empty object
    }

    const orderDoc = snapshot.docs[0];
    const orderData = orderDoc.data();

    if (!orderData.shippingAddress?.latitude || !orderData.shippingAddress?.longitude) {
        console.error(`Order ${orderDoc.id} is missing location data.`);
        // Optionally update order status to 'Cancelled' or 'Error'
        return res.status(500).json({ error: `Order ${orderDoc.id} is missing location data.` });
    }

    console.log(`Found mission for drone ${droneId}: Order ${orderDoc.id}`);
    res.status(200).json({
      orderId: orderDoc.id,
      latitude: orderData.shippingAddress.latitude,
      longitude: orderData.shippingAddress.longitude,
    });
  } catch (error) {
    console.error(`Error getting mission for drone ${droneId}:`, error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
