import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { recruitService, Recruit } from '../services/recruit.service';
import { useAuthStore } from '../store/authStore';
import CategoryTabs from '../components/CategoryTabs';
import Pagination from '../components/Pagination';

const RECRUIT_CATEGORIES = [
  { value: 'all', label: '전체' },
  { value: 'ctf', label: 'CTF' },
  { value: 'project', label: '프로젝트' },
  { value: 'study', label: '스터디' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'recruiting', label: '모집중' },
  { value: 'closed', label: '마감' },
];

const RecruitList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [recruits, setRecruits] = useState<Recruit[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });

  const category = searchParams.get('category') || 'all';
  const status = searchParams.get('status') || 'all';
  const page = parseInt(searchParams.get('page') || '1');
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    loadRecruits();
  }, [category, status, page]);

  const loadRecruits = async () => {
    try {
      setLoading(true);
      const data = await recruitService.getRecruits(category, status, page);
      setRecruits(data.recruits);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to load recruits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (newCategory: string) => {
    setSearchParams({ category: newCategory, status, page: '1' });
  };

  const handleStatusChange = (newStatus: string) => {
    setSearchParams({ category, status: newStatus, page: '1' });
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams({ category, status, page: newPage.toString() });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR');
  };

  const getCategoryBadge = (cat: string) => {
    const badges: Record<string, { text: string; className: string }> = {
      ctf: { text: 'CTF', className: 'bg-[#264874] text-[#91bbff]' },
      project: { text: '프로젝트', className: 'bg-[#1f4634] text-[#4dd4ac]' },
      study: { text: '스터디', className: 'bg-[#3a2758] text-[#bfa3ff]' },
    };
    const badge = badges[cat] || { text: cat, className: 'bg-[#22283c] text-night-muted' };
    return (
      <span className={`chip ${badge.className}`}>
        {badge.text}
      </span>
    );
  };

  const getStatusBadge = (stat: string) => (
    <span
      className={`chip ${
        stat === 'recruiting'
          ? 'bg-[#1f4634] text-[#4dd4ac]'
          : 'bg-[#2a2f43] text-night-muted'
      }`}
    >
      {stat === 'recruiting' ? '모집중' : '마감'}
    </span>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-night">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-night-heading">모집</h1>
        {isAuthenticated && (
          <Link
            to="/recruits/new"
            className="btn btn-primary"
          >
            모집글 작성
          </Link>
        )}
      </div>

      <div className="card bg-surface-2 border border-night">
        <div className="px-6 py-4 border-b border-night">
          <CategoryTabs
            tabs={RECRUIT_CATEGORIES}
            activeTab={category}
            onChange={handleCategoryChange}
          />
        </div>

        <div className="px-6 py-4 border-b border-night">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-night-muted">상태:</span>
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleStatusChange(opt.value)}
                className={`px-3 py-1 rounded-full text-sm font-medium border ${
                  status === opt.value
                    ? 'border-[#7c5dfa] bg-[#2b2341] text-night-heading'
                    : 'border-night bg-[#151f2d] text-night-muted hover:text-night'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-night-muted">로딩 중...</div>
        ) : recruits.length === 0 ? (
          <div className="p-12 text-center text-night-muted">
            모집글이 없습니다.
          </div>
        ) : (
          <>
            <div className="divide-y divide-night">
              {recruits.map((recruit) => (
                <Link
                  key={recruit._id}
                  to={`/recruits/${recruit._id}`}
                  className="block px-6 py-4 hover:bg-[#1a1f30] transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {getCategoryBadge(recruit.category)}
                        {getStatusBadge(recruit.status)}
                        <h3 className="text-lg font-semibold text-night truncate">
                          {recruit.title}
                        </h3>
                      </div>
                      <div className="flex items-center text-sm text-night-muted space-x-4 mb-2">
                        <span>{recruit.author.username}</span>
                        <span>
                          {recruit.currentMembers}/{recruit.maxMembers}명
                        </span>
                        <span>조회 {recruit.views}</span>
                        <span>댓글 {recruit.comments.length}</span>
                        <span>{formatDate(recruit.createdAt)}</span>
                      </div>
                      {recruit.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {recruit.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-[#1f2539] text-night-muted"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="px-6 py-4">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RecruitList;

