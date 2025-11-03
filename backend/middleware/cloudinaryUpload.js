const multer = require('multer');
const streamifier = require('streamifier');
const cloudinary = require('cloudinary').v2;
const path = require('path');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Multer Memory Storage Configuration
 * Dosyaları RAM'de saklayıp Cloudinary'ye gönder
 */
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Desteklenen dosya türleri
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

/**
 * Upload to Cloudinary
 * Memory içindeki file'ı Cloudinary'ye stream et
 * 
 * @param {Object} file - Multer file object
 * @param {string} folder - Cloudinary folder name
 * @param {string} publicId - Optional public ID
 * @returns {Promise<Object>} Upload result
 */
const uploadToCloudinary = (file, folder = 'meme-token', publicId = null) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided'));
      return;
    }

    const uploadOptions = {
      folder: folder,
      resource_type: 'auto',
      quality: 'auto:good',
      fetch_format: 'auto',
      transformation: [
        {
          if: 'w > 500 || h > 500',
          width: 500,
          height: 500,
          crop: 'limit'
        }
      ]
    };

    // Eğer publicId varsa, yeni versiyonla replace et (aynı ID ile)
    if (publicId) {
      uploadOptions.public_id = publicId;
      uploadOptions.overwrite = true;
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('❌ Cloudinary upload error:', error);
          reject(error);
        } else {
          resolve({
            success: true,
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            width: result.width,
            height: result.height,
            size: result.bytes,
            cloudinaryId: result.public_id
          });
        }
      }
    );

    // File buffer'ını stream'e yaz
    streamifier.createReadStream(file.buffer).pipe(uploadStream);
  });
};

/**
 * Delete from Cloudinary
 * 
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<Object>} Delete result
 */
const deleteFromCloudinary = async (publicId) => {
  try {
    if (!publicId) {
      throw new Error('Public ID required');
    }

    const result = await cloudinary.uploader.destroy(publicId);
    
    return {
      success: result.result === 'ok',
      result: result.result
    };
  } catch (error) {
    console.error('❌ Cloudinary delete error:', error);
    throw error;
  }
};

/**
 * Get multiple images URL'lerini optimize et
 */
const getOptimizedUrl = (url, width = 500, height = 500) => {
  if (!url) return null;
  
  // Eğer Cloudinary URL'i ise, transformation ekle
  if (url.includes('cloudinary')) {
    return url.replace('/upload/', `/upload/w_${width},h_${height},c_limit,q_auto:good,f_auto/`);
  }
  
  return url;
};

module.exports = {
  upload,
  uploadToCloudinary,
  deleteFromCloudinary,
  getOptimizedUrl
};
