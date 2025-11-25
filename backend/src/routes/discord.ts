import express, { Response } from 'express';
import { query, validationResult } from 'express-validator';
import discordService from '../services/discord.service';
import { authenticateToken, AuthRequest, isAdmin } from '../middleware/auth';

const router = express.Router();

router.get('/status', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const isConnected = discordService.isConnected();
    const channels = discordService.getConfiguredChannels();

    res.json({
      connected: isConnected,
      channels: channels,
    });
  } catch (error) {
    console.error('Get Discord status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get(
  '/announcements',
  [query('limit').optional().isInt({ min: 1, max: 50 }).toInt()],
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const limit = Number(req.query.limit) || 20;
      const messages = await discordService.getMessages('announcement', limit);

      res.json({
        messages,
        total: messages.length,
      });
    } catch (error) {
      console.error('Get announcements error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

router.get(
  '/missions',
  [query('limit').optional().isInt({ min: 1, max: 50 }).toInt()],
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const limit = Number(req.query.limit) || 20;
      const messages = await discordService.getMessages('mission', limit);

      res.json({
        messages,
        total: messages.length,
      });
    } catch (error) {
      console.error('Get missions error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

router.post(
  '/sync',
  authenticateToken,
  isAdmin,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const result = await discordService.syncMessages();

      res.json({
        message: 'Discord messages synced successfully',
        result,
      });
    } catch (error: any) {
      console.error('Sync Discord messages error:', error);
      res.status(500).json({ 
        error: 'Failed to sync messages'
      });
    }
  }
);

export default router;

