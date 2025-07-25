
import { NextApiRequest, NextApiResponse } from 'next';
import { v2 as cloudinary } from 'cloudinary';
import { Writable } from 'stream';

// Configure Cloudinary with your credentials from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Disable the default body parser to handle file streams
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper function to parse the form data and upload the file
const uploadFromFile = (req: NextApiRequest): Promise<{ url: string; public_id: string }> => {
  return new Promise((resolve, reject) => {
    const chunks: any[] = [];
    const writable = new Writable({
      write: (chunk, encoding, next) => {
        chunks.push(chunk);
        next();
      },
      destroy: (err) => {
        if (err) {
          reject(err);
        }
      },
    });

    req.pipe(writable);

    writable.on('finish', () => {
      const buffer = Buffer.concat(chunks);
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'buildora_products', // Optional: Upload to a specific folder
          resource_type: 'image',
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary Upload Error:', error);
            return reject(new Error('Failed to upload image to Cloudinary.'));
          }
          if (!result) {
            return reject(new Error('Cloudinary did not return a result.'));
          }
          resolve({
            url: result.secure_url,
            public_id: result.public_id,
          });
        }
      );
      uploadStream.end(buffer);
    });

    writable.on('error', (err) => {
      console.error('Writable Stream Error:', err);
      reject(err);
    });
  });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const result = await uploadFromFile(req);
    return res.status(200).json({ url: result.url, public_id: result.public_id });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Something went wrong' });
  }
}
