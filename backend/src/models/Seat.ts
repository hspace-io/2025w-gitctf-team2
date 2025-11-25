import mongoose, { Document, Schema } from 'mongoose';

export interface ISeat extends Document {
  seatNumber: string;
  room: 'white' | 'staff';
  position: {
    x: number;
    y: number;
  };
  isAvailable: boolean;
  currentUser?: mongoose.Types.ObjectId;
  reservedUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SeatSchema = new Schema<ISeat>(
  {
    seatNumber: {
      type: String,
      required: true,
      unique: true,
    },
    room: {
      type: String,
      enum: ['white', 'staff'],
      required: true,
    },
    position: {
      x: {
        type: Number,
        required: true,
      },
      y: {
        type: Number,
        required: true,
      },
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    currentUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reservedUntil: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ISeat>('Seat', SeatSchema);

