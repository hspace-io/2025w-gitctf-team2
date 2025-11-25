import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import Board from '../models/Board';
import { authenticateToken, isAdmin, AuthRequest } from '../middleware/auth';
import { createPostLimiter, commentLimiter } from '../middleware/security';
import { validateObjectId, validateObjectIds } from '../middleware/validation';

const router = express.Router();


router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { category, page = '1', limit = '20' } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const query: any = {};
    if (category && category !== 'all') {
      query.category = category;
    }

    const total = await Board.countDocuments(query);
    const boards = await Board.find(query)
      .populate('author', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    
    const boardsWithAnonymous = boards.map((board) => {
      const boardObj = board.toObject();
      if (board.isAnonymous && boardObj.author && typeof boardObj.author === 'object' && !Array.isArray(boardObj.author)) {
        boardObj.author = {
          ...(boardObj.author as any),
          username: '익명'
        };
      }
      return boardObj;
    });

    res.json({
      boards: boardsWithAnonymous,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get boards error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});


router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const board = await Board.findById(req.params.id)
      .populate('author', 'username')
      .populate('comments.author', 'username');

    if (!board) {
      res.status(404).json({ error: 'Board not found' });
      return;
    }

    
    board.views += 1;
    await board.save();

    const boardObj = board.toObject();
    
    
    if (board.isAnonymous && boardObj.author && typeof boardObj.author === 'object' && !Array.isArray(boardObj.author)) {
      boardObj.author = {
        ...(boardObj.author as any),
        username: '익명'
      };
    }

    
    boardObj.comments = boardObj.comments.map((comment: any) => {
      if (comment.isAnonymous && comment.author) {
        return {
          ...comment,
          author: {
            ...comment.author,
            username: '익명'
          }
        };
      }
      return comment;
    });

    res.json({ board: boardObj });
  } catch (error) {
    console.error('Get board error:', error);
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
      .isIn(['notice', 'anonymous', 'wargame-ctf'])
      .withMessage('Invalid category'),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { title, content, category, isAnonymous, images } = req.body;

      
      if (category === 'notice' && req.userRole !== 'admin') {
        res.status(403).json({ error: 'Only admins can create notices' });
        return;
      }

      const board = new Board({
        title,
        content,
        category,
        author: req.userId,
        isAnonymous: (isAnonymous === true),
        images: images || [],
      });

      await board.save();
      await board.populate('author', 'username');

      const boardObj = board.toObject();
      if (board.isAnonymous && boardObj.author && typeof boardObj.author === 'object' && !Array.isArray(boardObj.author) && '_id' in boardObj.author) {
        boardObj.author = {
          ...(boardObj.author as any),
          username: '익명'
        };
      }

      res.status(201).json({
        message: 'Board created successfully',
        board: boardObj,
      });
    } catch (error) {
      console.error('Create board error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);


router.put(
  '/:id',
  authenticateToken,
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
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const board = await Board.findById(req.params.id);
      if (!board) {
        res.status(404).json({ error: 'Board not found' });
        return;
      }

      
      if (
        board.author.toString() !== req.userId &&
        req.userRole !== 'admin'
      ) {
        res.status(403).json({ error: 'Not authorized' });
        return;
      }

      const { title, content, images } = req.body;
      if (title) board.title = title;
      if (content) board.content = content;
      if (images !== undefined) board.images = images;

      await board.save();
      await board.populate('author', 'username');

      const boardObj: any = board.toObject();
      if (board.isAnonymous && boardObj.author) {
        boardObj.author = { _id: (boardObj.author as any)._id || boardObj.author, username: '익명' };
      }

      res.json({
        message: 'Board updated successfully',
        board: boardObj,
      });
    } catch (error) {
      console.error('Update board error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);


router.delete(
  '/:id',
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const board = await Board.findById(req.params.id);
      if (!board) {
        res.status(404).json({ error: 'Board not found' });
        return;
      }

      
      if (
        board.author.toString() !== req.userId &&
        req.userRole !== 'admin'
      ) {
        res.status(403).json({ error: 'Not authorized' });
        return;
      }

      await Board.findByIdAndDelete(req.params.id);
      res.json({ message: 'Board deleted successfully' });
    } catch (error) {
      console.error('Delete board error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);


router.post(
  '/:id/like',
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const board = await Board.findById(req.params.id);
      if (!board) {
        res.status(404).json({ error: 'Board not found' });
        return;
      }

      const userIdStr = req.userId as string;
      const likeIndex = board.likes.findIndex(
        (id) => id.toString() === userIdStr
      );

      if (likeIndex > -1) {
        
        board.likes.splice(likeIndex, 1);
      } else {
        
        board.likes.push(userIdStr as any);
      }

      await board.save();
      res.json({
        message: 'Like updated',
        likes: board.likes.length,
        isLiked: likeIndex === -1,
      });
    } catch (error) {
      console.error('Like board error:', error);
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

      const board = await Board.findById(req.params.id);
      if (!board) {
        res.status(404).json({ error: 'Board not found' });
        return;
      }

      const { content, isAnonymous } = req.body;

      board.comments.push({
        author: req.userId as any,
        content,
        isAnonymous: (isAnonymous === true),
        createdAt: new Date(),
      } as any);

      await board.save();
      await board.populate('comments.author', 'username');

      const lastComment = board.comments[board.comments.length - 1];
      const commentObj = (lastComment as any).toObject();
      
      if ((lastComment as any).isAnonymous && commentObj.author && typeof commentObj.author === 'object' && !Array.isArray(commentObj.author)) {
        commentObj.author = {
          ...(commentObj.author as any),
          username: '익명'
        };
      }

      res.status(201).json({
        message: 'Comment added successfully',
        comment: commentObj,
      });
    } catch (error) {
      console.error('Add comment error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);


router.delete(
  '/:boardId/comments/:commentId',
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const board = await Board.findById(req.params.boardId);
      if (!board) {
        res.status(404).json({ error: 'Board not found' });
        return;
      }

      const comment = (board.comments as any).id(req.params.commentId);
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

      (board.comments as any).pull(req.params.commentId);
      await board.save();

      res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
      console.error('Delete comment error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

export default router;

