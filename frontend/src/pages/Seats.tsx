import { useState, useEffect, ChangeEvent } from 'react';
import { seatService, Seat } from '../services/seat.service';
import { useAuthStore } from '../store/authStore';

const Seats = () => {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [myReservation, setMyReservation] = useState<Seat | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<'all' | 'white' | 'staff'>('white');
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [reserveHours, setReserveHours] = useState(4);
  const [showReserveModal, setShowReserveModal] = useState(false);
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    loadSeats();
    if (isAuthenticated) {
      loadMyReservation();
    }

    const interval = setInterval(() => {
      loadSeats();
      if (isAuthenticated) {
        loadMyReservation();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedRoom, isAuthenticated]);

  const loadSeats = async () => {
    try {
      setLoading(true);
      const data = await seatService.getSeats(selectedRoom);
      setSeats(data);
    } catch (error) {
      console.error('Failed to load seats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMyReservation = async () => {
    try {
      const data = await seatService.getMyReservation();
      setMyReservation(data);
    } catch (error) {
      console.error('Failed to load my reservation:', error);
    }
  };

  const handleSeatClick = (seat: Seat) => {
    if (!isAuthenticated) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (!seat.isAvailable) {
      
      if (seat.currentUser?._id === user?.id) {
        if (window.confirm('좌석을 반납하시겠습니까?')) {
          handleReleaseSeat(seat.seatNumber);
        }
      } else {
        alert('이미 사용 중인 좌석입니다.');
      }
      return;
    }

    if (seat.room === 'staff' && user?.role !== 'admin') {
      alert('STAFF ROOM은 관리자만 예약할 수 있습니다.');
      return;
    }

    if (myReservation) {
      alert('이미 예약된 좌석이 있습니다. 먼저 반납해주세요.');
      return;
    }

    setSelectedSeat(seat);
    setShowReserveModal(true);
  };

  const handleReserveSeat = async () => {
    if (!selectedSeat) return;

    try {
      await seatService.reserveSeat(selectedSeat.seatNumber, reserveHours);
      alert(`좌석 ${selectedSeat.seatNumber}이(가) ${reserveHours}시간 동안 예약되었습니다.`);
      setShowReserveModal(false);
      setSelectedSeat(null);
      loadSeats();
      loadMyReservation();
    } catch (error: any) {
      console.error('Failed to reserve seat:', error);
      alert(error.response?.data?.error || '좌석 예약에 실패했습니다.');
    }
  };

  const handleReleaseSeat = async (seatNumber: string) => {
    try {
      await seatService.releaseSeat(seatNumber);
      alert('좌석이 반납되었습니다.');
      loadSeats();
      loadMyReservation();
    } catch (error: any) {
      console.error('Failed to release seat:', error);
      alert(error.response?.data?.error || '좌석 반납에 실패했습니다.');
    }
  };

  const getRemainingTime = (reservedUntil: string) => {
    const now = new Date();
    const until = new Date(reservedUntil);
    const diff = until.getTime() - now.getTime();
    
    if (diff <= 0) return '만료됨';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}시간 ${minutes}분`;
  };

  const renderWhiteRoomSeats = () => {
    const whiteSeats = seats.filter((s: Seat) => s.room === 'white');

    const topSeats = whiteSeats.slice(0, 12);
    
    const bottomSeats = whiteSeats.slice(12, 36);

    return (
      <div className="space-y-8">
   
        <div>
          <h3 className="text-base font-semibold mb-4 text-night-muted">Section A</h3>
          <div className="grid grid-cols-6 gap-3">
            {topSeats.map((seat: Seat) => (
              <button
                key={seat._id}
                onClick={() => handleSeatClick(seat)}
                className={`p-4 rounded-2xl border-2 transition-all shadow-card ${
                  seat.isAvailable
                    ? 'bg-[#34c759]/10 border-[#34c759] hover:bg-[#34c759]/20 text-night cursor-pointer'
                    : seat.currentUser?._id === user?.id
                    ? 'night-gradient text-[#05070f] border-[#7c5dfa] cursor-pointer shadow-neon'
                    : 'bg-[#28131f] border-[#ff5f7e] cursor-not-allowed opacity-70 text-night-muted'
                }`}
                disabled={!seat.isAvailable && seat.currentUser?._id !== user?.id}
              >
                <div className="text-center">
                  <div className="font-semibold text-sm">{seat.seatNumber}</div>
                  {!seat.isAvailable && (
                    <div className="text-xs mt-1">
                      {seat.currentUser?._id === user?.id ? '사용중' : '예약됨'}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

   
        <div>
          <h3 className="text-base font-semibold mb-4 text-night-muted">Section B</h3>
          <div className="grid grid-cols-8 gap-3">
            {bottomSeats.map((seat: Seat) => (
              <button
                key={seat._id}
                onClick={() => handleSeatClick(seat)}
                className={`p-4 rounded-2xl border-2 transition-all shadow-card ${
                  seat.isAvailable
                    ? 'bg-[#34c759]/10 border-[#34c759] hover:bg-[#34c759]/20 text-night cursor-pointer'
                    : seat.currentUser?._id === user?.id
                    ? 'night-gradient text-[#05070f] border-[#7c5dfa] cursor-pointer shadow-neon'
                    : 'bg-[#28131f] border-[#ff5f7e] cursor-not-allowed opacity-70 text-night-muted'
                }`}
                disabled={!seat.isAvailable && seat.currentUser?._id !== user?.id}
              >
                <div className="text-center">
                  <div className="font-semibold text-sm">{seat.seatNumber}</div>
                  {!seat.isAvailable && (
                    <div className="text-xs mt-1">
                      {seat.currentUser?._id === user?.id ? '사용중' : '예약됨'}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderStaffRoomSeats = () => {
    const staffSeats = seats.filter((s: Seat) => s.room === 'staff');
    const isAdmin = user?.role === 'admin';
    
    return (
      <div className="grid grid-cols-6 gap-4">
        {staffSeats.map((seat: Seat) => {
          const canReserve = seat.isAvailable && isAdmin;
          const isMySeat = !seat.isAvailable && seat.currentUser?._id === user?.id;
          
          return (
            <button
              key={seat._id}
              onClick={() => handleSeatClick(seat)}
              className={`p-6 rounded-2xl border-2 transition-all shadow-card ${
                canReserve
                  ? 'bg-[#34c759]/10 border-[#34c759] hover:bg-[#34c759]/20 text-night cursor-pointer'
                  : isMySeat
                  ? 'night-gradient text-[#05070f] border-[#7c5dfa] cursor-pointer shadow-neon'
                  : !seat.isAvailable
                  ? 'bg-[#28131f] border-[#ff5f7e] cursor-not-allowed opacity-70 text-night-muted'
                  : 'bg-gray-800/30 border-gray-600 cursor-not-allowed opacity-50 text-night-muted'
              }`}
              disabled={!canReserve && !isMySeat}
              title={!isAdmin && seat.isAvailable ? '관리자만 예약 가능합니다' : ''}
            >
              <div className="text-center">
                <div className="font-semibold text-base">{seat.seatNumber}</div>
                {!seat.isAvailable && (
                  <div className="text-xs mt-1">
                    {seat.currentUser?._id === user?.id ? '사용중' : '예약됨'}
                  </div>
                )}
                {seat.isAvailable && !isAdmin && (
                  <div className="text-xs mt-1 text-night-muted">관리자 전용</div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="text-center text-night-muted">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 text-night">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-night-heading mb-6">HSPACE 좌석 예약</h1>
        
  
        {myReservation && (
          <div className="alert alert-info mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-night-heading mb-1">현재 예약 좌석</h3>
                <p className="text-sm text-night-muted">
                  좌석: <span className="font-bold text-night">{myReservation.seatNumber}</span> | 
                  남은 시간: <span className="font-bold text-night">{getRemainingTime(myReservation.reservedUntil!)}</span>
                </p>
              </div>
              <button
                onClick={() => handleReleaseSeat(myReservation.seatNumber)}
                className="btn btn-danger text-sm"
              >
                좌석 반납
              </button>
            </div>
          </div>
        )}

   
        <div className="flex flex-wrap items-center gap-5 text-sm mb-6 text-night-muted">
          {[
            { label: '이용 가능', color: '#34c759' },
            { label: '내 좌석', color: '#7c5dfa' },
            { label: '사용 중', color: '#ff5f7e' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span
                className="w-4 h-4 rounded-full border-2"
                style={{ borderColor: item.color }}
              ></span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>

   
        <div className="flex gap-3 mb-8">
          <button
            onClick={() => setSelectedRoom('white')}
            className={`btn ${selectedRoom === 'white' ? 'btn-primary' : 'btn-secondary'}`}
          >
            WHITE ROOM (36석)
          </button>
          <button
            onClick={() => setSelectedRoom('staff')}
            className={`btn ${selectedRoom === 'staff' ? 'btn-primary' : 'btn-secondary'}`}
          >
            STAFF ROOM (12석)
          </button>
        </div>
      </div>

    
      <div className="card p-10 bg-surface-2 border border-night">
        <h2 className="text-3xl font-semibold mb-8 text-night-heading">
          {selectedRoom === 'white' ? 'WHITE ROOM' : 'STAFF ROOM'}
        </h2>
        {selectedRoom === 'white' ? renderWhiteRoomSeats() : renderStaffRoomSeats()}
      </div>

    
      {showReserveModal && selectedSeat && (
        <div className="modal-overlay">
          <div className="modal-content p-8">
            <h3 className="text-2xl font-semibold mb-4 text-night-heading">좌석 예약</h3>
            <p className="text-night-muted mb-6">
              좌석 <span className="font-bold text-[#7c5dfa]">{selectedSeat.seatNumber}</span>을(를) 예약하시겠습니까?
            </p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-night-heading mb-3">
                이용 시간
              </label>
              <select
                value={reserveHours}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setReserveHours(Number(e.target.value))}
                className="input"
              >
                <option value={1}>1시간</option>
                <option value={2}>2시간</option>
                <option value={3}>3시간</option>
                <option value={4}>4시간</option>
                <option value={5}>5시간</option>
                <option value={6}>6시간</option>
                <option value={7}>7시간</option>
                <option value={8}>8시간</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleReserveSeat}
                className="btn btn-primary flex-1"
              >
                예약하기
              </button>
              <button
                onClick={() => {
                  setShowReserveModal(false);
                  setSelectedSeat(null);
                }}
                className="btn btn-secondary flex-1"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Seats;

