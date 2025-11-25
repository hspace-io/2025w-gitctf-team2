import multer from 'multer';
import path from 'path';
import { Request } from 'express';

const uploadDir = path.join(__dirname, '../../uploads');

const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    cb(null, uploadDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    // 파일명 sanitization: 특수문자 제거 및 Path Traversal 방지
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    const nameWithoutExt = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9가-힣._-]/g, '_')  // 안전한 문자만 허용
      .slice(0, 50);  // 길이 제한
    cb(null, `${uniqueSuffix}-${nameWithoutExt}${ext}`);
  },
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true); // 통과
  } else {
    cb(new Error('Only image files are allowed!')); // 차단
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB 제한
  },
});

export const uploadImages = upload.array('images', 5);

