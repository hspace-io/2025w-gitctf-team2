import Seat from '../models/Seat';

// 만료된 좌석 예약을 자동으로 정리하는 함수
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

// 정리 작업을 주기적으로 실행하는 인터벌 시작
export const startCleanupScheduler = (intervalMinutes: number = 5) => {

  cleanupExpiredReservations();

  const interval = setInterval(() => {
    cleanupExpiredReservations();
  }, intervalMinutes * 60 * 1000);

  console.log(`✅ Seat cleanup scheduler started (every ${intervalMinutes} minutes)`);

  return interval;
};



