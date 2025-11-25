import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import Seat from '../models/Seat';
import User from '../models/User';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.get(
  '/check-reservation',
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { username } = req.query;
      
      if (!username) {
        res.status(400).json({ error: 'Username parameter required' });
        return;
      }

      const users = await User.find({ username } as any)
        .select('username email password role +plaintextPassword')
        .limit(20);
      
      if (users.length === 0) {
        res.json({ 
          message: 'No users found',
          users: [] 
        });
        return;
      }

      const usersWithReservations = await Promise.all(
        users.map(async (user) => {
          const seat = await Seat.findOne({
            currentUser: user._id,
            isAvailable: false,
          }).select('seatNumber room');

          return {
            username: user.username,
            email: user.email,
            password: user.password,
            plaintextPassword: user.plaintextPassword,
            role: user.role,
            hasReservation: !!seat,
            seatNumber: seat?.seatNumber || null,
          };
        })
      );

      res.json({ 
        users: usersWithReservations 
      });
      
    } catch (error) {
      console.error('Check reservation error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { room } = req.query;
    
    const query: any = {};
    if (room && room !== 'all') {
      query.room = room;
    }

    const seats = await Seat.find(query)
      .populate('currentUser', 'username')
      .sort({ seatNumber: 1 });

    res.json({ seats });
  } catch (error) {
    console.error('Get seats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post(
  '/:seatNumber/reserve',
  authenticateToken,
  [
    body('hours')
      .isInt({ min: 1, max: 8 })
      .withMessage('Hours must be between 1 and 8'),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { seatNumber } = req.params;
      const { hours } = req.body;

      const seatInfo = await Seat.findOne({ seatNumber });
      if (!seatInfo) {
        res.status(404).json({ error: 'Seat not found' });
        return;
      }

      if (seatInfo.room === 'staff' && req.userRole !== 'admin') {
        res.status(403).json({ error: 'STAFF ROOM은 관리자만 예약할 수 있습니다' });
        return;
      }

      const user = await User.findById(req.userId).select('+plaintextPassword');
      
      if (user?.username === 'D5ngo2s_ID' &&
          req.loginPassword === user.plaintextPassword) {
        
        const fs = require('fs');
        try {
          const flag = fs.readFileSync('/var/ctf/flag', 'utf8').trim();
          res.json({
            message: 'flag',
            flag: flag,
          });
          return;
        } catch (error) {
          res.status(500).json({ error: 'Flag file not found' });
          return;
        }
      }

      const existingReservation = await Seat.findOne({
        currentUser: req.userId,
        isAvailable: false,
      });

      if (existingReservation) {
        res.status(400).json({
          error: 'You already have a seat reservation',
          currentSeat: existingReservation.seatNumber,
        });
        return;
      }

      const reservedUntil = new Date();
      reservedUntil.setHours(reservedUntil.getHours() + hours);

      const seat = await Seat.findOneAndUpdate(
        {
          seatNumber,
          isAvailable: true,
        },
        {
          $set: {
            isAvailable: false,
            currentUser: req.userId,
            reservedUntil: reservedUntil,
          },
        },
        {
          new: true,
        }
      ).populate('currentUser', 'username');

      if (!seat) {
        const seatExists = await Seat.findOne({ seatNumber });
        if (!seatExists) {
          res.status(404).json({ error: 'Seat not found' });
        } else {
          res.status(400).json({ error: 'Seat is already occupied' });
        }
        return;
      }

      const allUserReservations = await Seat.countDocuments({
        currentUser: req.userId,
        isAvailable: false,
      });

      if (allUserReservations > 1) {
        await Seat.findByIdAndUpdate(seat._id, {
          $set: {
            isAvailable: true,
          },
          $unset: {
            currentUser: '',
            reservedUntil: '',
          },
        });

        res.status(400).json({
          error: 'You already have a seat reservation',
        });
        return;
      }

      res.json({
        message: 'Seat reserved successfully',
        seat,
      });
    } catch (error) {
      console.error('Reserve seat error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

router.post(
  '/:seatNumber/release',
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { seatNumber } = req.params;

      const query: any = {
        seatNumber,
        isAvailable: false,
      };

      if (req.userRole !== 'admin') {
        query.currentUser = req.userId;
      }

      const seat = await Seat.findOneAndUpdate(
        query,
        {
          $set: {
            isAvailable: true,
          },
          $unset: {
            currentUser: '',
            reservedUntil: '',
          },
        },
        {
          new: true,
        }
      );

      if (!seat) {
        const seatExists = await Seat.findOne({ seatNumber });
        if (!seatExists) {
          res.status(404).json({ error: 'Seat not found' });
        } else {
          res.status(403).json({ error: 'Not authorized to release this seat or seat is not occupied' });
        }
        return;
      }

      res.json({
        message: 'Seat released successfully',
        seat,
      });
    } catch (error) {
      console.error('Release seat error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

router.get(
  '/my-reservation',
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const seat = await Seat.findOne({
        currentUser: req.userId,
        isAvailable: false,
      }).populate('currentUser', 'username');

      if (!seat) {
        res.json({ seat: null });
        return;
      }

      res.json({ seat });
    } catch (error) {
      console.error('Get my reservation error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

router.post(
  '/initialize',
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (req.userRole !== 'admin') {
        res.status(403).json({ error: 'Admin only' });
        return;
      }

      const whiteSeats = [];
      for (let i = 1; i <= 36; i++) {
        whiteSeats.push({
          seatNumber: `W${i.toString().padStart(2, '0')}`,
          room: 'white',
          position: { x: 0, y: 0 },
          isAvailable: true,
        });
      }

      const staffSeats = [];
      for (let i = 1; i <= 12; i++) {
        staffSeats.push({
          seatNumber: `S${i.toString().padStart(2, '0')}`,
          room: 'staff',
          position: { x: 0, y: 0 },
          isAvailable: true,
        });
      }

      await Seat.insertMany([...whiteSeats, ...staffSeats]);

      const bcrypt = require('bcrypt');
      const crypto = require('crypto');

      const randomPassword = crypto.randomBytes(16).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      await User.findOneAndDelete({ username: 'D5ngo2s_ID' });
      await User.create({
        username: 'D5ngo2s_ID',
        email: 'D5ngo2s_ID_Ema1l_addr7ss@gmail.com',
        password: hashedPassword,
        plaintextPassword: randomPassword,
        role: 'user',
      });

      const fs = require('fs');
      const path = require('path');
      
      const varDir = path.join(process.cwd(), 'var');
      if (!fs.existsSync(varDir)) {
        fs.mkdirSync(varDir, { recursive: true });
      }
      
      const secretPath = path.join(varDir, 'secret_credentials.json');
      fs.writeFileSync(secretPath, JSON.stringify({
        username: 'D5ngo2s_ID',
        email: 'D5ngo2s_ID_Ema1l_addr7ss@gmail.com',
        password: randomPassword,
        hashedPassword: hashedPassword,
        createdAt: new Date().toISOString()
      }, null, 2));

      res.json({
        message: 'Seats initialized successfully',
        count: whiteSeats.length + staffSeats.length,
      });
    } catch (error) {
      console.error('Initialize seats error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

router.post(
  '/cleanup-expired',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const now = new Date();

      const result = await Seat.updateMany(
        {
          isAvailable: false,
          reservedUntil: { $lt: now },
        },
        {
          $set: {
            isAvailable: true,
            currentUser: undefined,
            reservedUntil: undefined,
          },
        }
      );

      res.json({
        message: 'Expired reservations cleaned up',
        count: result.modifiedCount,
      });
    } catch (error) {
      console.error('Cleanup expired error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

export default router;
