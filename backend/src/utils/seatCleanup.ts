import Seat from '../models/Seat';

export const cleanupExpiredReservations = async () => {
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

    if (result.modifiedCount > 0) {
      console.log(`🧹 Cleaned up ${result.modifiedCount} expired seat reservations`);
    }

    return result.modifiedCount;
  } catch (error) {
    console.error('❌ Error cleaning up expired reservations:', error);
    throw error;
  }
};

export const startCleanupScheduler = (intervalMinutes: number = 5) => {
  
  cleanupExpiredReservations();

  const interval = setInterval(() => {
    cleanupExpiredReservations();
  }, intervalMinutes * 60 * 1000);

  console.log(`✅ Seat cleanup scheduler started (every ${intervalMinutes} minutes)`);

  return interval;
};

