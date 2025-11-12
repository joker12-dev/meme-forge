import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { WalletProvider } from './contexts/WalletContext';
import { NotificationProvider } from './components/NotificationContainer';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './components/Home';
import Ranked from './components/Ranked';
import CreateToken from './components/CreateToken';
import TokenList from './components/TokenList';
import TokenDetails from './components/TokenDetails';
import Campaigns from './components/Campaigns';
import CampaignDetail from './components/CampaignDetail';
import Docs from './components/Docs';
import Privacy from './components/Privacy';
import Terms from './components/Terms';
import Disclaimer from './components/Disclaimer';
import Contact from './components/Contact';
import AdminPanel from './components/AdminPanel';
import PageTransition from './components/PageTransition';
import Maintenance from './components/Maintenance';
import MyTokens from './pages/MyTokens';
import MyProfile from './pages/MyProfile';
import MyTrades from './pages/MyTrades';
import MyWallet from './pages/MyWallet';
import ProfilePage from './pages/ProfilePage';
import MyPosts from './pages/MyPosts';
import PostsFeed from './pages/PostsFeed';
import PostDetail from './pages/PostDetail';
import FollowList from './pages/FollowList';
import './App.css';

function AppLayout() {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');
  const [isLoading, setIsLoading] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  useEffect(() => {
    // Bakım modu durumunu kontrol et
    const checkMaintenanceMode = async () => {
      try {
        const response = await fetch(process.env.REACT_APP_BACKEND_URL + '/api/settings/maintenance');
        const data = await response.json();
        setMaintenanceMode(data.maintenanceMode);
      } catch (error) {
        console.error('Bakım modu kontrol hatası:', error);
      }
    };

    checkMaintenanceMode();
    // Her 30 saniyede bir kontrol et
    const interval = setInterval(checkMaintenanceMode, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Sayfa değiştiğinde loading göster
    setIsLoading(true);
    
    // 600ms sonra loading'i kapat
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Admin sayfası değilse ve bakım modu açıksa bakım sayfasını göster
  if (maintenanceMode && !isAdminPage) {
    return <Maintenance />;
  }

  return (
    <div className="App">
      <PageTransition isLoading={isLoading} />
      <div style={{ 
        opacity: isLoading ? 0 : 1,
        transition: 'opacity 0.3s ease-in-out',
        pointerEvents: isLoading ? 'none' : 'auto'
      }}>
        {!isAdminPage && <Header />}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/ranked" element={<Ranked />} />
          <Route path="/create" element={<CreateToken />} />
          <Route path="/tokens" element={<TokenList />} />
          <Route path="/token/:address" element={<TokenDetails />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/campaign/:id" element={<CampaignDetail />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/disclaimer" element={<Disclaimer />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/my-tokens" element={<MyTokens />} />
          <Route path="/my-profile" element={<MyProfile />} />
          <Route path="/my-trades" element={<MyTrades />} />
          <Route path="/my-wallet" element={<MyWallet />} />
          <Route path="/my-posts" element={<MyPosts />} />
          <Route path="/profile/:address" element={<ProfilePage />} />
          <Route path="/profile/:address/followers" element={<FollowList type="followers" />} />
          <Route path="/profile/:address/following" element={<FollowList type="following" />} />
          <Route path="/posts" element={<PostsFeed />} />
          <Route path="/posts/:postId" element={<PostDetail />} />
        </Routes>
        {!isAdminPage && <Footer />}
      </div>
    </div>
  );
}

function App() {
  return (
    <NotificationProvider>
      <WalletProvider>
        <Router>
          <AppLayout />
        </Router>
      </WalletProvider>
    </NotificationProvider>
  );
}

export default App;

