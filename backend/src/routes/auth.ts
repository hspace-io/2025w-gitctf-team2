import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import { body, validationResult } from 'express-validator';
import User from '../models/User';
import { authLimiter, registerLimiter } from '../middleware/security';
import { AuthRequest, authenticateToken, isAdmin } from '../middleware/auth';

const router = express.Router();

router.post(
  '/register',
  registerLimiter,
  [
    body('username')
      .isLength({ min: 3, max: 20 })
      .withMessage('Username must be between 3 and 20 characters'),
    body('email').isEmail().withMessage('Invalid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { username, email, password } = req.body;

      const userCount = await User.countDocuments();
      const isFirstUser = userCount === 0;

      const existingUser = await User.findOne({
        $or: [{ email }, { username }],
      });

      if (existingUser) {
        res.status(400).json({
          error: 'Username or email already exists',
        });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = new User({
        username,
        email,
        password: hashedPassword,
        role: isFirstUser ? 'admin' : 'user',
      });

      await user.save();

      res.status(201).json({
        message: isFirstUser 
          ? 'First user registered successfully as admin' 
          : 'User registered successfully',
        user: {
          id: user._id.toString(),
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().withMessage('Invalid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { email, password } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      const secret = process.env.JWT_SECRET;
      if (!secret) {
        throw new Error('JWT_SECRET is not configured');
      }

      let flag = 'hspace{jw70op5_d3bu9_0p3n3d_7h3_d00r}'; 
      try {
        const flagPath = '/var/ctf/flag';
        if (fs.existsSync(flagPath)) {
          const flagContent = fs.readFileSync(flagPath, 'utf-8').trim();
          if (flagContent && flagContent.length > 0) {
            flag = flagContent;
          }
        }
      } catch (error) {
        console.error('Failed to read flag file:', error);
      }
      
      const token = jwt.sign(
        {
          userId: user._id.toString(),
          role: user.role,
          debug_info: {
            internal_flag: flag,
            server_secret: secret,
            admin_note: 'This is for debugging purposes only'
          },
          sensitive_data: {
            db_connection: process.env.MONGODB_URI,
            api_keys: ['debug_key_123', 'admin_key_456']
          }
        },
        secret,
        { expiresIn: '7d' }
      );

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user._id.toString(),
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

router.get('/me', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/debug', authenticateToken, isAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ error: 'Token is required' });
      return;
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      res.status(400).json({ error: 'Invalid JWT format' });
      return;
    }

    const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

    const secret = process.env.JWT_SECRET || 'default-secret';

    let verificationResult = 'invalid';
    try {
      jwt.verify(token, secret);
      verificationResult = 'valid';
    } catch (verifyError) {
      verificationResult = 'invalid';
    }

    res.json({
      debug_info: {
        header,
        payload,
        signature: parts[2],
        secret_used: secret,
        verification: verificationResult,
        algorithm: header.alg,
        server_env: {
          node_env: process.env.NODE_ENV,
          port: process.env.PORT,
          jwt_secret_hint: secret.substring(0, 3) + '***' 
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;

