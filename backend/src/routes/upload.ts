import express, { Response } from 'express';
import { uploadImages } from '../middleware/upload';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import fs from 'fs';
import path from 'path';
import FileModel from '../models/File';

const router = express.Router();

router.post(
  '/',
  authenticateToken,
  (req: AuthRequest, res: Response, next: Function) => {
    uploadImages(req, res, (err: any) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  },
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
        res.status(400).json({ error: 'No files uploaded' });
        return;
      }

const files = req.files as Express.Multer.File[];
      const savedFiles = [];

      for (const file of files) {
        const newFile = new FileModel({
          filename: file.filename,
          originalName: file.originalname,
          uploader: req.userId,
          size: file.size,
          mimetype: file.mimetype,
        });
        await newFile.save();
        savedFiles.push(`/uploads/${file.filename}`);
      }

      res.json({
        message: 'Images uploaded successfully',
        images: savedFiles,
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Failed to upload images' });
    }
  }
);

router.delete(
  '/:filename',
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
try {
      let { filename } = req.params;
      
      if (!filename || filename.length > 255) {
        res.status(400).json({ error: 'Invalid filename: length exceeded' });
        return;
      }

      try {
        const decoded = decodeURIComponent(filename);
        if (decoded !== filename) {
          filename = decoded;
        }
      } catch (e) {
      }

      if (filename.includes('\0') || filename.includes('%00')) {
        console.warn(`[SECURITY] Null byte attack detected: ${filename}`);
        res.status(400).json({ error: 'Invalid filename: null byte detected' });
        return;
      }

      const pathTraversalPatterns = [
        '..',          
        '/',            
        '\\',          
        '\u2215',     
        '\u2216',   
        '\uff0f',      
        '\uff3c',      
        '%2e',      
        '%2f',      
        '%5c',    
      ];

      for (const pattern of pathTraversalPatterns) {
        if (filename.toLowerCase().includes(pattern.toLowerCase())) {
          console.warn(`[SECURITY] Path traversal attack detected: ${filename}`);
          res.status(400).json({ error: 'Invalid filename: path traversal detected' });
          return;
        }
      }

      const blockedPatterns = [
        /^\.env/i,                  
        /^package\.json$/i,       
        /^package-lock\.json$/i,    
        /^docker-compose/i,        
        /^dockerfile$/i,           
        /^tsconfig/i,              
        /^\.git/i,                   
        /^node_modules/i,            
        /^src\//i,                  
        /^dist\//i,                  
        /^config/i,              
        /^\.dockerignore$/i,       
        /^\.npmrc$/i,                
        /^yarn\.lock$/i,             
        /^\.eslintrc/i,             
        /^\.prettierrc/i,             
        /^webpack\.config/i,         
        /^vite\.config/i,          
        /^\.vscode/i,               
        /^\.idea/i,                
      ];

      for (const pattern of blockedPatterns) {
        if (pattern.test(filename)) {
          console.warn(`[SECURITY] System file access attempt: ${filename}`);
          res.status(400).json({ error: 'Invalid filename: system file access denied' });
          return;
        }
      }

      const safeFilenamePattern = /^[0-9]+-[0-9]+-[a-zA-Z0-9가-힣._-]+\.(jpg|jpeg|png|gif|webp)$/i;
      if (!safeFilenamePattern.test(filename)) {
        console.warn(`[SECURITY] Invalid filename format: ${filename}`);
        res.status(400).json({ error: 'Invalid filename format' });
        return;
      }

      const fileRecord = await FileModel.findOne({ filename });

      if (!fileRecord) {
        res.status(404).json({ error: 'File not found' });
        return;
      }

      if (fileRecord.uploader.toString() !== req.userId && req.userRole !== 'admin') {
        res.status(403).json({ error: 'Permission denied: You do not own this file' });
        return;
      }

      const uploadsDir = path.resolve(__dirname, '../../uploads');
      const filePath = path.join(uploadsDir, filename);
      const normalizedPath = path.resolve(filePath);

      if (!normalizedPath.startsWith(uploadsDir + path.sep) && normalizedPath !== uploadsDir) {
        console.warn(`[SECURITY] Path escape attempt: ${filename} -> ${normalizedPath}`);
        res.status(400).json({ error: 'Invalid file path: access denied' });
        return;
      }

      const expectedPath = path.join(uploadsDir, filename);
      if (normalizedPath !== expectedPath) {
        console.warn(`[SECURITY] Path normalization mismatch: ${filename}`);
        res.status(400).json({ error: 'Invalid file path: normalization failed' });
        return;
      }

      if (fs.existsSync(normalizedPath)) {
        fs.unlinkSync(normalizedPath);
      }

      await FileModel.deleteOne({ _id: fileRecord._id });

      res.json({ message: 'Image deleted successfully' });
    } catch (error) {
      console.error('Delete image error:', error);
      res.status(500).json({ error: 'Failed to delete image' });
    }
  }
);

export default router;

