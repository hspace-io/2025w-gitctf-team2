import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.',
      retryAfter: '15분 후',
    });
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, 
  message: '너무 많은 로그인 시도가 발생했습니다. 15분 후 다시 시도해주세요.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, 
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: '너무 많은 로그인 시도가 발생했습니다. 15분 후 다시 시도해주세요.',
      retryAfter: '15분 후',
    });
  },
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 3, 
  message: '너무 많은 회원가입 시도가 발생했습니다. 1시간 후 다시 시도해주세요.',
  standardHeaders: true,
  legacyHeaders: false, 
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: '너무 많은 회원가입 시도가 발생했습니다. 1시간 후 다시 시도해주세요.',
      retryAfter: '1시간 후',
    });
  },
});

export const createPostLimiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 10, 
  message: '게시글 작성이 너무 빠릅니다. 잠시 후 다시 시도해주세요.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: '게시글 작성이 너무 빠릅니다. 잠시 후 다시 시도해주세요.',
      retryAfter: '1분 후',
    });
  },
});

export const commentLimiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 20, 
  message: '댓글 작성이 너무 빠릅니다. 잠시 후 다시 시도해주세요.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: '댓글 작성이 너무 빠릅니다. 잠시 후 다시 시도해주세요.',
      retryAfter: '1분 후',
    });
  },
});

export const limitContentSize = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const contentLength = req.headers['content-length'];
  const maxSize = 10 * 1024 * 1024; 

  if (contentLength && parseInt(contentLength) > maxSize) {
    res.status(413).json({
      error: '요청 크기가 너무 큽니다. 최대 10MB까지 허용됩니다.',
    });
    return;
  }

  next();
};

export const sanitizeInput = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const dangerousPatterns = [
    /(\$where)/gi,
    /(\$ne)/gi,
    /(\$gt)/gi,
    /(\$lt)/gi,
    /(\$regex)/gi,
  ];

  const checkObject = (obj: any): boolean => {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        for (const pattern of dangerousPatterns) {
          if (pattern.test(obj[key])) {
            return true;
          }
        }
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        if (checkObject(obj[key])) {
          return true;
        }
      }
    }
    return false;
  };

  if (checkObject(req.body) || checkObject(req.query) || checkObject(req.params)) {
    res.status(400).json({
      error: '잘못된 요청입니다.',
    });
    return;
  }

  next();
};

