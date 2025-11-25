import mongoose, { Document, Schema } from 'mongoose';

export interface IBoard extends Document {
  title: string;
  content: string;
  category: 'notice' | 'anonymous' | 'wargame-ctf';
  author: mongoose.Types.ObjectId | string;
  isAnonymous: boolean;
  images: string[]; 
  views: number;
  likes: mongoose.Types.ObjectId[];
  comments: IComment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IComment {
  _id: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId | string;
  content: string;
  isAnonymous: boolean;
  createdAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const BoardSchema = new Schema<IBoard>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['notice', 'anonymous', 'wargame-ctf'],
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    images: {
      type: [String],
      default: [],
    },
    views: {
      type: Number,
      default: 0,
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    comments: [CommentSchema],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IBoard>('Board', BoardSchema);

