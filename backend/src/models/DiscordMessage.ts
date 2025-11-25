import mongoose, { Document, Schema } from 'mongoose';

export interface IDiscordMessage extends Document {
  messageId: string;
  channelId: string;
  channelName: string;
  threadName?: string;
  content: string;
  author: {
    username: string;
    avatar?: string;
  };
  embeds?: any[];
  attachments?: any[];
  timestamp: Date;
  type: 'announcement' | 'mission' | 'general';
  createdAt: Date;
  updatedAt: Date;
}

const DiscordMessageSchema = new Schema<IDiscordMessage>(
  {
    messageId: {
      type: String,
      required: true,
      unique: true,
    },
    channelId: {
      type: String,
      required: true,
      index: true,
    },
    channelName: {
      type: String,
      required: true,
    },
    threadName: {
      type: String,
    },
    content: {
      type: String,
      default: '',
    },
    author: {
      username: {
        type: String,
        required: true,
      },
      avatar: {
        type: String,
      },
    },
    embeds: {
      type: [Schema.Types.Mixed] as any,
      default: [],
    },
    attachments: {
      type: [Schema.Types.Mixed] as any,
      default: [],
    },
    timestamp: {
      type: Date,
      required: true,
    },
    type: {
      type: String,
      enum: ['announcement', 'mission', 'general'],
      default: 'general',
    },
  },
  {
    timestamps: true,
  }
);

DiscordMessageSchema.index({ channelId: 1, timestamp: -1 });
DiscordMessageSchema.index({ type: 1, timestamp: -1 });

export default mongoose.model<IDiscordMessage>('DiscordMessage', DiscordMessageSchema);

