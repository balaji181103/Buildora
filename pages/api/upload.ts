
import { NextApiRequest, NextApiResponse } from 'next';
import { v2 as cloudinary } from 'cloudinary';

// Explicitly configure Cloudinary. 
// This is the most reliable way to ensure the SDK is authenticated.
cloudinary.config({
  cloud_name: 'drzf6hssv',
  api_key: '556997438736985',
  api_secret: 'CoK_XBTrwAXARbs6aOp3mMsHYMQ',
});

// Disable the default body parser to handle file streams
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper to pipe the request stream to a buffer
const streamToBuffer = (req: NextApiRequest): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        const chunks: Uint8Array[] = [];
        req.on('data', (chunk) => chunks.push(chunk));
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', (err) => reject(err));
    });
};

// Helper to upload the buffer to Cloudinary
const uploadToCloudinary = (buffer: Buffer): Promise<{ secure_url: string; public_id: string }> => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            {
                folder: 'buildora_assets',
                resource_type: 'auto',
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
                    secure_url: result.secure_url,
                    public_id: result.public_id,
                });
            }
        ).end(buffer);
    });
};


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const buffer = await streamToBuffer(req);
    const result = await uploadToCloudinary(buffer);
    
    return res.status(200).json({ url: result.secure_url, public_id: result.public_id });

  } catch (error: any) {
    console.error('Upload Handler Error:', error);
    return res.status(500).json({ message: error.message || 'An unexpected error occurred during upload.' });
  }
}
