import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';
import Recruit from './models/Recruit';
import authRoutes from './routes/auth';
import boardRoutes from './routes/boards';
import recruitRoutes from './routes/recruits';
import seatRoutes from './routes/seats';
import chatbotRoutes from './routes/chatbot';
import discordRoutes from './routes/discord';
import uploadRoutes from './routes/upload';
import { apiLimiter, limitContentSize, sanitizeInput } from './middleware/security';
import { validateEnv } from './config/validateEnv';
import { startCleanupScheduler } from './utils/seatCleanup';
import { initializeSeatsIfEmpty } from './utils/initializeSeats';
import discordService from './services/discord.service';

const config = validateEnv();

const app = express();
const PORT = config.PORT;
const MONGODB_URI = config.MONGODB_URI;
const NODE_ENV = config.NODE_ENV;

app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

const allowedOrigins = config.ALLOWED_ORIGINS
  ? config.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost', 'http://localhost:5000'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      if (NODE_ENV === 'development') {
        return callback(null, true);
      }

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(mongoSanitize());

app.use(xss());

app.use(limitContentSize);

app.use(sanitizeInput);

app.use('/api/', apiLimiter);

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/recruits', recruitRoutes);
app.use('/api/seats', seatRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/discord', discordRoutes);
app.use('/api/upload', uploadRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.message);
  
  if (NODE_ENV === 'production') {
    res.status(err.status || 500).json({
      error: 'An error occurred',
    });
  } else {
    res.status(err.status || 500).json({
      error: err.message,
      stack: err.stack,
    });
  }
});

app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({ error: 'Not Found' });
});

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return next(new Error('Server configuration error'));
    }

    const decoded = jwt.verify(token, secret) as { userId: string; role: string };
    socket.data.userId = decoded.userId;
    socket.data.role = decoded.role;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log(`✅ Socket connected: ${socket.id} (User: ${socket.data.userId})`);

  socket.on('join-team-chat', async (recruitId: string) => {
    try {
      if (typeof recruitId !== 'string' || recruitId.length > 50 || !/^[a-f0-9]{24}$/i.test(recruitId)) {
        socket.emit('error', { message: 'Invalid recruit ID' });
        return;
      }

      const recruit = await Recruit.findById(recruitId)
        .populate('members', '_id')
        .populate('author', '_id');

      if (!recruit) {
        socket.emit('error', { message: 'Recruit not found' });
        return;
      }

      const userIdStr = socket.data.userId;
      const isAuthor = recruit.author.toString() === userIdStr;
      const isMember = recruit.members.some((member: any) => {
        const memberId = member._id ? member._id.toString() : member.toString();
        return memberId === userIdStr;
      });

      if (!isAuthor && !isMember) {
        socket.emit('error', { message: 'Not authorized to join team chat' });
        return;
      }

      socket.join(`team-${recruitId}`);
      console.log(`User ${socket.data.userId} joined team-${recruitId}`);
    } catch (error) {
      console.error('Join team chat error:', error);
      socket.emit('error', { message: 'Failed to join team chat' });
    }
  });

  socket.on('leave-team-chat', (recruitId: string) => {
    if (typeof recruitId !== 'string' || recruitId.length > 50) {
      return;
    }
    socket.leave(`team-${recruitId}`);
    console.log(`User ${socket.data.userId} left team-${recruitId}`);
  });

  const userId = socket.data.userId;
  if (userId) {
    socket.join(`user-${userId}`);
    console.log(`User ${userId} joined notification room: user-${userId}`);
  }

  socket.on('disconnect', () => {
    console.log(`❌ Socket disconnected: ${socket.id}`);
  });
});

export { io };

// MongoDB connection
mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    console.log(`🌍 Environment: ${NODE_ENV}`);
    console.log(`🔒 Security features enabled`);
    
    await initializeSeatsIfEmpty();
    
    startCleanupScheduler(5);
    
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`🔌 Socket.io server enabled`);
      
      if (NODE_ENV === 'development') {
        console.log(`📝 API Documentation: http://localhost:${PORT}/api`);
      }
    });
    
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  mongoose.connection.close();
  process.exit(0);
});

export default app;

