
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
  return new Promise((resolve, reject) => {
    const form = new IncomingForm();

    form.parse(req, (err, fields, files) => {
      if (err) {
        console.error('Formidable Parse Error:', err);
        return reject(new Error('Failed to parse form data.'));
      }

      // Robustly find the file from the files object
      const file = (Array.isArray(files.file) ? files.file[0] : files.file) as File | undefined;

      if (!file?.filepath) {
        console.error('No file found in `files.file`. All files:', JSON.stringify(files, null, 2));
        return reject(new Error('No file uploaded or file path is missing.'));
      }
      
      cloudinary.uploader.upload(
          file.filepath,
          {
              folder: 'buildora_assets',
              resource_type: 'image',
          },
          (error, result) => {
              if (error) {
                  console.error('Cloudinary Upload Error:', error);
                  return reject(new Error('Failed to upload image to Cloudinary. Check server logs and credentials.'));
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
    console.error('Upload Handler Error:', error);
    return res.status(500).json({ message: error.message || 'Something went wrong' });
  }
}
