import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import FloatingChatbot from './components/FloatingChatbot';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import BoardList from './pages/BoardList';
import BoardDetail from './pages/BoardDetail';
import BoardForm from './pages/BoardForm';
import RecruitList from './pages/RecruitList';
import RecruitDetail from './pages/RecruitDetail';
import RecruitForm from './pages/RecruitForm';
import Seats from './pages/Seats';
import AdminPanel from './pages/AdminPanel';
import Chatbot from './pages/Chatbot';
import Announcements from './pages/Announcements';
import ChatList from './pages/ChatList';
import TeamChat from './pages/TeamChat';
import { useAuthStore } from './store/authStore';

function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);
  return (
    <Router>
      <div className="min-h-screen bg-night text-night font-sans">
        <Navbar />
        <FloatingChatbot />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/boards" element={<BoardList />} />
          <Route path="/boards/:id" element={<BoardDetail />} />
          <Route
            path="/boards/new"
            element={
              <ProtectedRoute>
                <BoardForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/boards/:id/edit"
            element={
              <ProtectedRoute>
                <BoardForm />
              </ProtectedRoute>
            }
          />

          <Route path="/recruits" element={<RecruitList />} />
          <Route path="/recruits/:id" element={<RecruitDetail />} />
          <Route
            path="/recruits/new"
            element={
              <ProtectedRoute>
                <RecruitForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruits/:id/edit"
            element={
              <ProtectedRoute>
                <RecruitForm />
              </ProtectedRoute>
            }
          />

          <Route path="/seats" element={<Seats />} />

          <Route path="/chatbot" element={<Chatbot />} />

          <Route path="/announcements" element={<Announcements />} />

          <Route
            path="/chats"
            element={
              <ProtectedRoute>
                <ChatList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chats/:recruitId"
            element={
              <ProtectedRoute>
                <TeamChat />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminPanel />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

