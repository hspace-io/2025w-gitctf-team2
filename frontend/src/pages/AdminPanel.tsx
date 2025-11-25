import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { seatService } from '../services/seat.service';
import { useAuthStore } from '../store/authStore';

const AdminPanel = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-night">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="alert alert-error text-center">
            <h2 className="text-xl font-bold mb-2">접근 권한이 없습니다</h2>
            <p>관리자만 접근할 수 있는 페이지입니다.</p>
          </div>
        </div>
      </div>
    );
  }

  const handleInitializeSeats = async () => {
    if (!window.confirm('모든 좌석을 초기화하시겠습니까? (기존 데이터는 삭제됩니다)')) {
      return;
    }

    try {
      setLoading(true);
      const result = await seatService.initializeSeats();
      alert(`좌석이 초기화되었습니다. (총 ${result.count}석)`);
    } catch (error: any) {
      console.error('Failed to initialize seats:', error);
      alert(error.response?.data?.error || '좌석 초기화에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCleanupExpired = async () => {
    if (!window.confirm('만료된 예약을 정리하시겠습니까?')) {
      return;
    }

    try {
      setLoading(true);
      const result = await seatService.cleanupExpired();
      alert(`${result.count}개의 만료된 예약이 정리되었습니다.`);
    } catch (error: any) {
      console.error('Failed to cleanup expired:', error);
      alert(error.response?.data?.error || '예약 정리에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-night">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-night-heading mb-8">관리자 패널</h1>

        <div className="space-y-6">
     
          <div className="card p-6">
            <h2 className="text-xl font-bold text-night-heading mb-4">공지사항 관리</h2>
            <p className="text-night-muted mb-4">
              공지사항은 게시판에서 작성할 수 있습니다. 관리자는 게시글을 작성할 때 "공지사항" 카테고리를 선택할 수 있습니다.
            </p>
            <button
              onClick={() => navigate('/boards/new')}
              className="btn btn-primary px-6 py-3 font-medium"
            >
              공지사항 작성하기
            </button>
          </div>

       
          <div className="card p-6">
            <h2 className="text-xl font-bold text-night-heading mb-4">좌석 관리</h2>

            <div className="space-y-4">
           
              <div className="bg-surface-2 border border-night rounded-xl p-4">
                <h3 className="font-semibold text-night-heading mb-2">좌석 초기화</h3>
                <p className="text-sm text-night-muted mb-3">
                  모든 좌석 데이터를 삭제하고 WHITE ROOM 36석, STAFF ROOM 12석으로 다시 생성합니다.
                </p>
                <button
                  onClick={handleInitializeSeats}
                  disabled={loading}
                  className="btn btn-primary px-4 py-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '처리 중...' : '좌석 초기화'}
                </button>
              </div>

            
              <div className="bg-surface-2 border border-night rounded-xl p-4">
                <h3 className="font-semibold text-night-heading mb-2">만료된 예약 정리</h3>
                <p className="text-sm text-night-muted mb-3">
                  시간이 초과된 예약을 즉시 정리합니다. (자동으로 5분마다 실행되지만 수동으로도 실행 가능)
                </p>
                <button
                  onClick={handleCleanupExpired}
                  disabled={loading}
                  className="btn btn-primary px-4 py-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '처리 중...' : '만료된 예약 정리'}
                </button>
              </div>

            
              <div className="bg-surface-2 border border-night rounded-xl p-4">
                <h3 className="font-semibold text-night-heading mb-2">좌석 현황</h3>
                <p className="text-sm text-night-muted mb-3">
                  현재 좌석 예약 현황을 확인하고 관리할 수 있습니다.
                </p>
                <button
                  onClick={() => navigate('/seats')}
                  className="btn btn-primary px-4 py-2 font-medium"
                >
                  좌석 현황 보기
                </button>
              </div>
            </div>
          </div>

        
          <div className="card p-6">
            <h2 className="text-xl font-bold text-night-heading mb-4">시스템 정보</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-surface-2 border border-night rounded-xl p-4">
                <div className="text-sm text-night-muted font-medium">총 좌석</div>
                <div className="text-2xl font-bold text-night-heading">48석</div>
                <div className="text-xs text-night-muted mt-1">WHITE 36석 + STAFF 12석</div>
              </div>
              <div className="bg-surface-2 border border-night rounded-xl p-4">
                <div className="text-sm text-night-muted font-medium">자동 정리</div>
                <div className="text-2xl font-bold text-night-heading">5분</div>
                <div className="text-xs text-night-muted mt-1">만료된 예약 자동 정리 주기</div>
              </div>
              <div className="bg-surface-2 border border-night rounded-xl p-4">
                <div className="text-sm text-night-muted font-medium">최대 예약 시간</div>
                <div className="text-2xl font-bold text-night-heading">8시간</div>
                <div className="text-xs text-night-muted mt-1">사용자당 1개 좌석만 예약 가능</div>
              </div>
            </div>
          </div>

        
          <div className="card p-6">
            <h3 className="text-xl font-bold text-night-heading mb-4">관리자 권한</h3>
            <ul className="list-disc list-inside space-y-2 text-night-muted">
              <li>모든 게시글 및 댓글 수정/삭제</li>
              <li>공지사항 작성 (게시판 카테고리: 공지)</li>
              <li>좌석 시스템 관리 (초기화, 강제 반납)</li>
              <li>모집 게시글 관리</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;



