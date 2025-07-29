
import { NextApiRequest, NextApiResponse } from 'next';
import { v2 as cloudinary } from 'cloudinary';
import { IncomingForm, type File } from 'formidable';

// The Cloudinary SDK will automatically use the CLOUDINARY_URL environment variable.
// No explicit config is needed if the URL is set.
// We add a warning here to help with debugging if the variable is not set.
if (!process.env.CLOUDINARY_URL) {
  console.warn('CLOUDINARY_URL is not set. Please check your environment variables.');
}


// Disable the default body parser to handle file streams
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper function to parse the form data and upload the file
const uploadFromFile = async (req: NextApiRequest): Promise<{ url: string; public_id: string }> => {
  const form = new IncomingForm();
  
  const [fields, files] = await form.parse(req);

  // formidable can place the file in an array or as a single object.
  // This robustly gets the file regardless of the structure.
  const file = (Array.isArray(files.file) ? files.file[0] : files.file) as File | undefined;
  
  if (!file?.filepath) {
    console.error('No file found in `files.file`. All files:', JSON.stringify(files, null, 2));
    throw new Error('No file uploaded or file path is missing.');
  }
  
  try {
    const result = await cloudinary.uploader.upload(file.filepath, {
      folder: 'buildora_assets',
      resource_type: 'image',
    });

    return {
      url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (error) {
      console.error('Cloudinary Upload Error:', error);
      // Re-throw a more specific error to be caught by the handler
      throw new Error('Failed to upload image to Cloudinary. Check server logs and credentials.');
  }
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
    console.error('Upload Handler Error:', error);
    // Send the specific error message from the try/catch block
    return res.status(500).json({ message: error.message || 'Something went wrong' });
  }
}
