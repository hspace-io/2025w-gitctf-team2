import Seat from '../models/Seat';

/**
 * 만료된 좌석 예약을 자동으로 정리하는 함수
 * 이 함수는 주기적으로 실행되어야 합니다 (예: 5분마다)
 */
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

/**
 * 정리 작업을 주기적으로 실행하는 인터벌 시작
 * @param intervalMinutes 실행 주기 (분 단위, 기본값: 5분)
 */
export const startCleanupScheduler = (intervalMinutes: number = 5) => {
  // 즉시 한 번 실행
  cleanupExpiredReservations();

  // 주기적으로 실행
  const interval = setInterval(() => {
    cleanupExpiredReservations();
  }, intervalMinutes * 60 * 1000);

  console.log(`✅ Seat cleanup scheduler started (every ${intervalMinutes} minutes)`);

  return interval;
};



