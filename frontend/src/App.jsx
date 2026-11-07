import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import SiteChrome from './components/SiteChrome.jsx';
import CreatorLayout from './components/CreatorLayout.jsx';
import HomePage from './pages/HomePage.jsx';
import ContentPage from './pages/ContentPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SetupPage from './pages/SetupPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ContentManagerPage from './pages/ContentManagerPage.jsx';
import ContentFormPage from './pages/ContentFormPage.jsx';
import CommentsPage from './pages/CommentsPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import ViewerAuthPage from './pages/ViewerAuthPage.jsx';
import ViewerProfilePage from './pages/ViewerProfilePage.jsx';
import ViewerBookmarksPage from './pages/ViewerBookmarksPage.jsx';
import ViewerCreateContentPage from './pages/ViewerCreateContentPage.jsx';
import ViewerNotificationsPage from './pages/ViewerNotificationsPage.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';

function Protected({ children }) {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <div className="page-loading">Opening your creator studio…</div>;
  if (!user) return <Navigate to="/creator/login" replace state={{ from: location.pathname }} />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route element={<SiteChrome />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/content/:id" element={<ContentPage />} />
        <Route path="/creator/login" element={<LoginPage />} />
        <Route path="/creator/setup" element={<SetupPage />} />
        <Route path="/viewer/register" element={<ViewerAuthPage mode="register" />} />
        <Route path="/viewer/login" element={<ViewerAuthPage mode="login" />} />
        <Route path="/viewer/profile" element={<ViewerProfilePage />} />
        <Route path="/viewer/post" element={<ViewerCreateContentPage />} />
        <Route path="/viewer/saved" element={<ViewerBookmarksPage />} />
        <Route path="/viewer/notifications" element={<ViewerNotificationsPage />} />
      </Route>
      <Route path="/creator" element={<Protected><CreatorLayout /></Protected>}>
        <Route index element={<DashboardPage />} />
        <Route path="content" element={<ContentManagerPage />} />
        <Route path="content/new" element={<ContentFormPage />} />
        <Route path="content/:id/edit" element={<ContentFormPage />} />
        <Route path="comments" element={<CommentsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
