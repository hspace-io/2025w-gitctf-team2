import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import Recruit from '../models/Recruit';
import User from '../models/User';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { createPostLimiter, commentLimiter } from '../middleware/security';
import { validateObjectId, validateObjectIds } from '../middleware/validation';
import { io } from '../server';

const router = express.Router();

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { category, status, page = '1', limit = '20' } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const query: any = {};
    if (category && category !== 'all') {
      query.category = category;
    }
    if (status && status !== 'all') {
      query.status = status;
    }

    const total = await Recruit.countDocuments(query);
    const recruits = await Recruit.find(query)
      .populate('author', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      recruits,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get recruits error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});


router.get(
  '/my-chats',
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userIdStr = req.userId as string;

      const recruits = await Recruit.find({
        $or: [
          { author: userIdStr },
          { members: userIdStr },
        ],
      })
        .populate('author', 'username')
        .populate('members', 'username _id')
        .populate('teamChat.author', 'username _id')
        .select('title category status author members teamChat createdAt updatedAt')
        .sort({ updatedAt: -1 });

      const chatRooms = recruits.map(recruit => {
        const sortedChat = recruit.teamChat && recruit.teamChat.length > 0
          ? [...recruit.teamChat].sort((a: any, b: any) => {
              const dateA = new Date(a.createdAt).getTime();
              const dateB = new Date(b.createdAt).getTime();
              return dateB - dateA; 
            })
          : [];
        
        const lastMessage = sortedChat.length > 0 ? sortedChat[0] : null;

        return {
          _id: recruit._id,
          title: recruit.title,
          category: recruit.category,
          status: recruit.status,
          author: recruit.author,
          members: recruit.members, 
          lastMessage: lastMessage ? {
            _id: lastMessage._id.toString(),
            content: lastMessage.content,
            createdAt: lastMessage.createdAt,
            author: lastMessage.author ? {
              _id: (lastMessage.author as any)._id?.toString() || lastMessage.author.toString(),
              username: (lastMessage.author as any).username || 'Unknown',
            } : null,
          } : null,
          unreadCount: 0, 
          createdAt: recruit.createdAt,
          updatedAt: recruit.updatedAt,
        };
      });

      res.json({ chatRooms });
    } catch (error) {
      console.error('Get my chats error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

router.get('/:id', validateObjectId('id'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const recruit = await Recruit.findById(req.params.id)
      .populate('author', 'username')
      .populate('comments.author', 'username')
      .populate('members', 'username')
      .populate('pendingMembers', 'username');

    if (!recruit) {
      res.status(404).json({ error: 'Recruit not found' });
      return;
    }

    recruit.views += 1;
    await recruit.save();

    res.json({ recruit });
  } catch (error) {
    console.error('Get recruit error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post(
  '/',
  authenticateToken,
  createPostLimiter,
  [
    body('title')
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Title must be between 1 and 200 characters'),
    body('content').trim().notEmpty().withMessage('Content is required'),
    body('category')
      .isIn(['ctf', 'project', 'study'])
      .withMessage('Invalid category'),
    body('maxMembers')
      .isInt({ min: 1 })
      .withMessage('Max members must be at least 1'),
    body('deadline')
      .notEmpty()
      .withMessage('Deadline is required')
      .isISO8601()
      .withMessage('Deadline must be a valid date'),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { title, content, category, maxMembers, tags, images, deadline } = req.body;

      const recruit = new Recruit({
        title,
        content,
        category,
        author: req.userId,
        maxMembers,
        currentMembers: 1,
        members: [req.userId], 
        pendingMembers: [],
        tags: tags || [],
        images: images || [],
        deadline: new Date(deadline),
      });

      await recruit.save();
      await recruit.populate('author', 'username');
      await recruit.populate('members', 'username');

      res.status(201).json({
        message: 'Recruit created successfully',
        recruit,
      });
    } catch (error) {
      console.error('Create recruit error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

router.put(
  '/:id',
  authenticateToken,
  validateObjectId('id'),
  [
    body('title')
      .optional()
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Title must be between 1 and 200 characters'),
    body('content')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Content cannot be empty'),
    body('maxMembers')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Max members must be at least 1'),
    body('currentMembers')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Current members must be at least 1'),
    body('deadline')
      .notEmpty()
      .withMessage('Deadline is required')
      .isISO8601()
      .withMessage('Deadline must be a valid date'),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const recruit = await Recruit.findById(req.params.id);
      if (!recruit) {
        res.status(404).json({ error: 'Recruit not found' });
        return;
      }

      if (
        recruit.author.toString() !== req.userId &&
        req.userRole !== 'admin'
      ) {
        res.status(403).json({ error: 'Not authorized' });
        return;
      }

      const { title, content, maxMembers, currentMembers, status, tags, images, deadline } = req.body;
      
      if (title) recruit.title = title;
      if (content) recruit.content = content;
      if (maxMembers) recruit.maxMembers = maxMembers;
      if (images !== undefined) recruit.images = images;
      if (currentMembers !== undefined) {
        if (currentMembers > recruit.maxMembers) {
          res.status(400).json({ error: 'Current members cannot exceed max members' });
          return;
        }
        recruit.currentMembers = currentMembers;
      }
      if (status) recruit.status = status;
      if (tags) recruit.tags = tags;
      if (deadline) recruit.deadline = new Date(deadline);

      await recruit.save();
      await recruit.populate('author', 'username');

      res.json({
        message: 'Recruit updated successfully',
        recruit,
      });
    } catch (error) {
      console.error('Update recruit error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

router.delete(
  '/:id',
  authenticateToken,
  validateObjectId('id'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const recruit = await Recruit.findById(req.params.id);
      if (!recruit) {
        res.status(404).json({ error: 'Recruit not found' });
        return;
      }

      if (
        recruit.author.toString() !== req.userId &&
        req.userRole !== 'admin'
      ) {
        res.status(403).json({ error: 'Not authorized' });
        return;
      }

      await Recruit.findByIdAndDelete(req.params.id);
      res.json({ message: 'Recruit deleted successfully' });
    } catch (error) {
      console.error('Delete recruit error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

router.post(
  '/:id/like',
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const recruit = await Recruit.findById(req.params.id);
      if (!recruit) {
        res.status(404).json({ error: 'Recruit not found' });
        return;
      }

      const userIdStr = req.userId as string;
      const likeIndex = recruit.likes.findIndex(
        (id) => id.toString() === userIdStr
      );

      if (likeIndex > -1) {
        recruit.likes.splice(likeIndex, 1);
      } else {
        recruit.likes.push(userIdStr as any);
      }

      await recruit.save();
      res.json({
        message: 'Like updated',
        likes: recruit.likes.length,
        isLiked: likeIndex === -1,
      });
    } catch (error) {
      console.error('Like recruit error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

router.post(
  '/:id/comments',
  authenticateToken,
  commentLimiter,
  [body('content').trim().notEmpty().withMessage('Comment content is required')],
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const recruit = await Recruit.findById(req.params.id);
      if (!recruit) {
        res.status(404).json({ error: 'Recruit not found' });
        return;
      }

      const { content } = req.body;

      recruit.comments.push({
        author: req.userId as any,
        content,
        createdAt: new Date(),
      } as any);

      await recruit.save();
      await recruit.populate('comments.author', 'username');

      const lastComment = recruit.comments[recruit.comments.length - 1];

      res.status(201).json({
        message: 'Comment added successfully',
        comment: lastComment,
      });
    } catch (error) {
      console.error('Add comment error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

router.delete(
  '/:recruitId/comments/:commentId',
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const recruit = await Recruit.findById(req.params.recruitId);
      if (!recruit) {
        res.status(404).json({ error: 'Recruit not found' });
        return;
      }

      const comment = (recruit.comments as any).id(req.params.commentId);
      if (!comment) {
        res.status(404).json({ error: 'Comment not found' });
        return;
      }

      if (
        comment.author.toString() !== req.userId &&
        req.userRole !== 'admin'
      ) {
        res.status(403).json({ error: 'Not authorized' });
        return;
      }

      (recruit.comments as any).pull(req.params.commentId);
      await recruit.save();

      res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
      console.error('Delete comment error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);


router.post(
  '/:id/join',
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const recruit = await Recruit.findById(req.params.id);
      if (!recruit) {
        res.status(404).json({ error: 'Recruit not found' });
        return;
      }

      if (recruit.status === 'closed') {
        res.status(400).json({ error: '모집이 마감되었습니다' });
        return;
      }

      const userIdStr = req.userId as string;
      if (recruit.members.some(id => id.toString() === userIdStr)) {
        res.status(400).json({ error: '이미 팀원입니다' });
        return;
      }

      if (recruit.pendingMembers.some(id => id.toString() === userIdStr)) {
        res.status(400).json({ error: '이미 참가 신청했습니다' });
        return;
      }

      if (recruit.currentMembers >= recruit.maxMembers) {
        res.status(400).json({ error: '팀원이 가득 찼습니다' });
        return;
      }

      recruit.pendingMembers.push(userIdStr as any);
      await recruit.save();

      const applicant = await User.findById(userIdStr).select('username');

      const authorId = recruit.author.toString();
      const applicationNotification = {
        type: 'recruit-application',
        recruitId: recruit._id.toString(),
        recruitTitle: recruit.title,
        applicantId: userIdStr,
        applicantUsername: applicant?.username || '알 수 없음',
        message: `${applicant?.username}님이 팀 참가를 신청했습니다.`,
        createdAt: new Date(),
      };
      
      console.log(`📤 Sending application notification to user-${authorId}:`, applicationNotification);
      io.to(`user-${authorId}`).emit('recruit-application', applicationNotification);

      res.json({ message: '참가 신청이 완료되었습니다' });
    } catch (error) {
      console.error('Join team error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

router.delete(
  '/:id/join',
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const recruit = await Recruit.findById(req.params.id);
      if (!recruit) {
        res.status(404).json({ error: 'Recruit not found' });
        return;
      }

      const userIdStr = req.userId as string;
      recruit.pendingMembers = recruit.pendingMembers.filter(
        id => id.toString() !== userIdStr
      );
      await recruit.save();

      res.json({ message: '참가 신청이 취소되었습니다' });
    } catch (error) {
      console.error('Cancel join error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

router.post(
  '/:id/approve/:userId',
  authenticateToken,
  validateObjectIds('id', 'userId'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const recruit = await Recruit.findById(req.params.id);
      if (!recruit) {
        res.status(404).json({ error: 'Recruit not found' });
        return;
      }

      if (recruit.author.toString() !== req.userId) {
        res.status(403).json({ error: 'Not authorized' });
        return;
      }

      const { userId } = req.params;
      const { approve } = req.body; 

      if (!recruit.pendingMembers.some(id => id.toString() === userId)) {
        res.status(400).json({ error: '참가 신청 내역이 없습니다' });
        return;
      }

      recruit.pendingMembers = recruit.pendingMembers.filter(
        id => id.toString() !== userId
      );

      const applicant = await User.findById(userId).select('username');
      const recruitTitle = recruit.title;

      if (approve) {
        if (recruit.currentMembers >= recruit.maxMembers) {
          await recruit.save();
          res.status(400).json({ error: '팀원이 가득 찼습니다' });
          return;
        }

        recruit.members.push(userId as any);
        recruit.currentMembers += 1;
      }

      await recruit.save();
      await recruit.populate('members', 'username');
      await recruit.populate('pendingMembers', 'username');

      const notificationData = {
        type: approve ? 'recruit-approval' : 'recruit-rejection',
        recruitId: recruit._id.toString(),
        recruitTitle: recruitTitle,
        message: approve 
          ? `"${recruitTitle}" 팀 참가가 승인되었습니다!` 
          : `"${recruitTitle}" 팀 참가가 거부되었습니다.`,
        createdAt: new Date(),
      };
      
      console.log(`📤 Sending approval notification to user-${userId}:`, notificationData);
      io.to(`user-${userId}`).emit('recruit-approval', notificationData);

      res.json({
        message: approve ? '팀원이 승인되었습니다' : '참가가 거부되었습니다',
        members: recruit.members,
        pendingMembers: recruit.pendingMembers,
      });
    } catch (error) {
      console.error('Approve member error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

router.delete(
  '/:id/members/:userId',
  authenticateToken,
  validateObjectIds('id', 'userId'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const recruit = await Recruit.findById(req.params.id);
      if (!recruit) {
        res.status(404).json({ error: 'Recruit not found' });
        return;
      }

      if (recruit.author.toString() !== req.userId) {
        res.status(403).json({ error: 'Not authorized' });
        return;
      }

      const { userId } = req.params;
      
      recruit.members = recruit.members.filter(id => id.toString() !== userId);
      recruit.currentMembers = Math.max(1, recruit.currentMembers - 1);
      await recruit.save();

      res.json({ message: '팀원이 퇴출되었습니다' });
    } catch (error) {
      console.error('Remove member error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

router.get(
  '/:id/chat',
  authenticateToken,
  validateObjectId('id'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const recruit = await Recruit.findById(req.params.id)
        .populate('teamChat.author', 'username')
        .populate('members', 'username');

      if (!recruit) {
        res.status(404).json({ error: 'Recruit not found' });
        return;
      }

      const userIdStr = req.userId as string;
      const isAuthor = recruit.author.toString() === userIdStr;
      const isMember = recruit.members.some((member: any) => {
        const memberId = member._id ? member._id.toString() : member.toString();
        return memberId === userIdStr;
      });

      if (!isAuthor && !isMember) {
        res.status(403).json({ error: '팀원만 채팅을 볼 수 있습니다' });
        return;
      }

      const sortedMessages = [...recruit.teamChat].sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateA - dateB;
      });

      res.json({
        messages: sortedMessages,
        members: recruit.members,
      });
    } catch (error) {
      console.error('Get team chat error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

router.post(
  '/:id/chat',
  authenticateToken,
  validateObjectId('id'),
  commentLimiter,
  [body('content').trim().notEmpty().withMessage('Message content is required')],
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const recruit = await Recruit.findById(req.params.id);
      if (!recruit) {
        res.status(404).json({ error: 'Recruit not found' });
        return;
      }

      const userIdStr = req.userId as string;
      const isAuthor = recruit.author.toString() === userIdStr;
      const isMember = recruit.members.some((member: any) => {
        const memberId = member._id ? member._id.toString() : member.toString();
        return memberId === userIdStr;
      });

      if (!isAuthor && !isMember) {
        res.status(403).json({ error: '팀원만 채팅할 수 있습니다' });
        return;
      }

      const { content } = req.body;

      if (content.length > 1000) {
        res.status(400).json({ error: '메시지는 1000자 이하여야 합니다.' });
        return;
      }

      const sanitizedContent = content
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');

      recruit.teamChat.push({
        author: userIdStr as any,
        content: sanitizedContent,
        createdAt: new Date(),
      } as any);

      await recruit.save();
      
      const updatedRecruit = await Recruit.findById(req.params.id)
        .populate('teamChat.author', 'username _id');
      
      if (!updatedRecruit) {
        res.status(404).json({ error: 'Recruit not found' });
        return;
      }

      const lastMessage = updatedRecruit.teamChat[updatedRecruit.teamChat.length - 1];
      
      const messageData = {
        _id: lastMessage._id.toString(),
        author: {
          _id: (lastMessage.author as any)._id.toString(),
          username: (lastMessage.author as any).username,
        },
        content: lastMessage.content,
        createdAt: lastMessage.createdAt,
      };

      io.to(`team-${req.params.id}`).emit('team-message', messageData);

      res.status(201).json({
        message: 'Message sent successfully',
        chatMessage: messageData,
      });
    } catch (error) {
      console.error('Send team chat error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

router.delete(
  '/:recruitId/chat/:messageId',
  authenticateToken,
  validateObjectIds('recruitId', 'messageId'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const recruit = await Recruit.findById(req.params.recruitId);
      if (!recruit) {
        res.status(404).json({ error: 'Recruit not found' });
        return;
      }

      const message = (recruit.teamChat as any).id(req.params.messageId);
      if (!message) {
        res.status(404).json({ error: 'Message not found' });
        return;
      }

      const isAuthor = recruit.author.toString() === req.userId;
      const isMessageAuthor = message.author.toString() === req.userId;

      if (!isAuthor && !isMessageAuthor && req.userRole !== 'admin') {
        res.status(403).json({ error: 'Not authorized' });
        return;
      }

      (recruit.teamChat as any).pull(req.params.messageId);
      await recruit.save();

      res.json({ message: 'Message deleted successfully' });
    } catch (error) {
      console.error('Delete team chat error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

export default router;

