import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';


export const validateObjectId = (paramName: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const id = req.params[paramName];
    
    if (!id) {
      res.status(400).json({ error: `${paramName} parameter is required` });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: `Invalid ${paramName} format` });
      return;
    }

    next();
  };
};


export const validateObjectIds = (...paramNames: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    for (const paramName of paramNames) {
      const id = req.params[paramName];
      
      if (id && !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ error: `Invalid ${paramName} format` });
        return;
      }
    }

    next();
  };
};

