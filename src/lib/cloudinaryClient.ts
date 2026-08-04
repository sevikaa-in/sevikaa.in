import { v2 as cloudinary } from 'cloudinary';

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  if (process.env.NODE_ENV !== 'test') {
    console.warn('[cloudinary] Missing CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET — uploads will fail.');
  }
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
  secure: true,
});

export default cloudinary;
