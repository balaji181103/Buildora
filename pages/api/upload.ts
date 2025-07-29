
import { NextApiRequest, NextApiResponse } from 'next';
import { v2 as cloudinary } from 'cloudinary';
import formidable from 'formidable';

cloudinary.config({
  cloud_name: 'drzf6hssv',
  api_key: '556997438736985',
  api_secret: 'CoK_XBTrwAXARbs6aOp3mMsHYMQ',
});

export const config = {
  api: {
    bodyParser: false,
  },
};

const uploadFromFile = (req: NextApiRequest): Promise<{ secure_url: string; public_id: string } | null> => {
    return new Promise((resolve, reject) => {
        const form = formidable({});

        form.parse(req, (err, fields, files) => {
            if (err) {
                console.error('Formidable parsing error:', err);
                return reject(new Error('Failed to parse form data.'));
            }

            const file = files.file?.[0];

            if (!file) {
                return reject(new Error('No file uploaded.'));
            }

            cloudinary.uploader.upload(file.filepath, {
                folder: 'buildora_assets',
                resource_type: 'auto',
            })
            .then(result => {
                if (!result) {
                    return reject(new Error('Cloudinary did not return a result.'));
                }
                resolve({
                    secure_url: result.secure_url,
                    public_id: result.public_id,
                });
            })
            .catch(uploadError => {
                console.error('Cloudinary Upload Error:', uploadError);
                reject(new Error('Failed to upload image to Cloudinary.'));
            });
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
    
    if (result) {
        return res.status(200).json({ url: result.secure_url, public_id: result.public_id });
    } else {
        return res.status(500).json({ message: 'Upload failed and did not return a result.'});
    }

  } catch (error: any) {
    console.error('Upload Handler Error:', error);
    return res.status(500).json({ message: error.message || 'An unexpected error occurred during upload.' });
  }
}
