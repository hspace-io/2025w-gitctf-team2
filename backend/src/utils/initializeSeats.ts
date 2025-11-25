import Seat from '../models/Seat';


export const initializeSeatsIfEmpty = async () => {
  try {
    const seatCount = await Seat.countDocuments();
    
    if (seatCount > 0) {
      console.log(`✅ Seats already initialized (${seatCount} seats found)`);
      return;
    }

    console.log('📍 No seats found. Initializing seats...');

    const seatsToCreate = [];

    for (let i = 1; i <= 36; i++) {
      seatsToCreate.push({
        seatNumber: `W${String(i).padStart(2, '0')}`,
        room: 'white',
        isAvailable: true,
        position: { x: 0, y: 0 }, 
      });
    }

   
    for (let i = 1; i <= 12; i++) {
      seatsToCreate.push({
        seatNumber: `S${String(i).padStart(2, '0')}`,
        room: 'staff',
        isAvailable: true,
        position: { x: 0, y: 0 }, 
      });
    }

    const result = await Seat.insertMany(seatsToCreate);
    console.log(`✅ Seats initialized successfully (${result.length} seats created)`);
  } catch (error) {
    console.error('❌ Failed to initialize seats:', error);
  }
};



