import api from './api';

export interface Seat {
  _id: string;
  seatNumber: string;
  room: 'white' | 'staff';
  position: {
    x: number;
    y: number;
  };
  isAvailable: boolean;
  currentUser?: {
    _id: string;
    username: string;
  };
  reservedUntil?: string;
  createdAt: string;
  updatedAt: string;
}

export const seatService = {
  async getSeats(room?: string) {
    const params = new URLSearchParams();
    if (room && room !== 'all') params.append('room', room);
    
    const response = await api.get(`/seats?${params.toString()}`);
    return response.data.seats;
  },

  async getMyReservation() {
    const response = await api.get('/seats/my-reservation');
    return response.data.seat;
  },

  async reserveSeat(seatNumber: string, hours: number) {
    const response = await api.post(`/seats/${seatNumber}/reserve`, { hours });
    return response.data;
  },

  async releaseSeat(seatNumber: string) {
    const response = await api.post(`/seats/${seatNumber}/release`);
    return response.data;
  },

  async initializeSeats() {
    const response = await api.post('/seats/initialize');
    return response.data;
  },

  async cleanupExpired() {
    const response = await api.post('/seats/cleanup-expired');
    return response.data;
  },
};



