
import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '@/lib/firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  
  if (!adminDb) {
    return res.status(500).json({ error: 'Firebase Admin SDK not initialized.' });
  }

  try {
    const { droneId, latitude, longitude, battery, status } = req.body;

    if (!droneId || latitude === undefined || longitude === undefined || battery === undefined || !status) {
      return res.status(400).json({ error: "Missing required fields in request body. Required: droneId, latitude, longitude, battery, status" });
    }

    const droneRef = adminDb.collection('drones').doc(droneId as string);

    await droneRef.update({
      location: `Lat: ${Number(latitude).toFixed(4)}, Lon: ${Number(longitude).toFixed(4)}`,
      battery: Number(battery),
      status: status,
    });

    console.log(`Updated status for drone ${droneId}`);
    res.status(200).json({ message: 'Status updated successfully.' });

  } catch (error) {
    console.error('Error updating drone status:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
