import React, { useEffect, useState } from 'react';
import './MyTokens.css';
// EditTokenMeta component (move above main component)
const EditTokenMeta = React.memo(function EditTokenMeta({ token, userAddress, onClose, onUpdated }) {
  // Cloudinary ayarları
  const CLOUDINARY_CLOUD_NAME = 'YOUR_CLOUD_NAME'; // Örn: memeapp
  const CLOUDINARY_UPLOAD_PRESET = 'YOUR_UPLOAD_PRESET'; // Örn: meme-token
  const [logoURL, setLogoURL] = useState(token.logoURL || '');
  const [logoFile, setLogoFile] = useState(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(token.logoURL || null);
  const [website, setWebsite] = useState(token.website || '');
  const [telegram, setTelegram] = useState(token.telegram || '');
  const [twitter, setTwitter] = useState(token.twitter || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const backendURL = '${getBackendURL()}';

  const handleLogoFileChange = async e => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoUploading(true);
    setError('');
    setLogoFile(file);
    // Önizleme
    const reader = new FileReader();
    reader.onload = (ev) => setPreviewImage(ev.target.result);
    reader.readAsDataURL(file);
    // Backend'e upload
    try {
      const formData = new FormData();
      formData.append('logo', file);
      const backendURL = process.env.REACT_APP_BACKEND_URL || '${getBackendURL()}';
      const uploadURL = `${backendURL}/api/upload/logo`;
      const response = await fetch(uploadURL, {
        method: 'POST',
        body: formData
      });
      if (!response.ok) {
        const errorText = await response.text();
        setError('Logo yükleme hatası: ' + errorText);
        setLogoUploading(false);
        return;
      }
      const data = await response.json();
      if (data.success && data.logoURL) {
        setLogoURL(data.logoURL);
      } else {
        setError(data.error || 'Logo yükleme başarısız');
      }
    } catch (err) {
      setError('Logo yüklenemedi: ' + err.message);
    } finally {
      setLogoUploading(false);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await axios.patch(`${backendURL}/api/tokens/${token.address}/edit-meta`, {
        logoURL, website, telegram, twitter
      }, {
        headers: { 'wallet-address': userAddress }
      });
      if (res.data.success) {
        setSuccess('Başarıyla güncellendi!');
        onUpdated(res.data.token);
        setTimeout(onClose, 1200);
      } else {
        setError(res.data.error || 'Güncelleme başarısız.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Sunucu hatası.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ background: 'linear-gradient(90deg,#232323 60%,#ffd70022 100%)', borderRadius: '0 0 14px 14px', boxShadow: '0 2px 12px #0002', padding: '2rem 2.5rem', margin: 0, width: '100%', minWidth: 0, position: 'relative', zIndex: 2, borderBottom: '1px solid #333' }}>
      <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '1.2rem', color: '#ffd700' }}>Token Bilgilerini Düzenle</div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: '1.2rem',
        width: '100%',
        marginBottom: '0.7rem',
        alignItems: 'center',
        justifyItems: 'start',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.7rem', minHeight: 90 }}>
          <div style={{ color: '#aaa', fontWeight: 500, marginBottom: '0.3rem', alignSelf: 'flex-start' }}>Logo</div>
          <label htmlFor="logo-upload" style={{
            display: 'inline-block',
            background: 'linear-gradient(90deg,#ffd700 60%,#fff700 100%)',
            color: '#232323',
            fontWeight: 700,
            fontSize: '1rem',
            borderRadius: '8px',
            padding: '0.6rem 1.5rem',
            cursor: 'pointer',
            boxShadow: '0 2px 8px #ffd70044',
            border: 'none',
            transition: 'background 0.2s, box-shadow 0.2s',
            marginBottom: '0.5rem',
            textAlign: 'center',
          }}>
            {logoUploading ? 'Yükleniyor...' : 'Logo Seç'}
            <input id="logo-upload" type="file" accept="image/*" onChange={handleLogoFileChange} style={{ display: 'none' }} />
          </label>
          {previewImage && (
            <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
              <img src={previewImage} alt="Logo preview" style={{ width: 56, height: 56, borderRadius: '50%', background: '#fff', objectFit: 'cover', boxShadow: '0 2px 8px #ffd70044', border: '2px solid #ffd700' }} />
              <span style={{ color: '#ffd700', fontWeight: 500, fontSize: '0.95rem', marginTop: '0.2rem' }}>Önizleme</span>
            </div>
          )}
          {error && <div style={{ color: '#ff4d4f', fontWeight: 600, marginTop: '0.3rem', fontSize: '0.95rem' }}>{error}</div>}
        </div>
        <div>
          <div style={{ color: '#aaa', fontWeight: 500, marginBottom: '0.3rem' }}>Website</div>
          <input type="text" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://..." style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #333', width: '100%', background: '#181818', color: '#ffd700' }} />
        </div>
        <div>
          <div style={{ color: '#aaa', fontWeight: 500, marginBottom: '0.3rem' }}>Telegram</div>
          <input type="text" value={telegram} onChange={e => setTelegram(e.target.value)} placeholder="https://t.me/..." style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #333', width: '100%', background: '#181818', color: '#ffd700' }} />
        </div>
        <div>
          <div style={{ color: '#aaa', fontWeight: 500, marginBottom: '0.3rem' }}>Twitter</div>
          <input type="text" value={twitter} onChange={e => setTwitter(e.target.value)} placeholder="https://twitter.com/..." style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #333', width: '100%', background: '#181818', color: '#ffd700' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', alignItems: 'flex-start', justifyContent: 'center' }}>
          <button type="submit" disabled={loading} style={{ background: 'linear-gradient(90deg,#ffd700 60%,#fff700 100%)', color: '#232323', fontWeight: 700, fontSize: '1.1rem', border: 'none', borderRadius: '8px', padding: '0.7rem 2.2rem', width: '160px', cursor: 'pointer', boxShadow: '0 2px 8px #ffd70044', transition: 'background 0.2s, box-shadow 0.2s', marginBottom: '0.5rem' }}>{loading ? 'Kaydediliyor...' : 'Kaydet'}</button>
          <button type="button" onClick={onClose} style={{ background: '#232323', color: '#ffd700', fontWeight: 700, fontSize: '1.1rem', border: '1px solid #ffd700', borderRadius: '8px', padding: '0.7rem 2.2rem', width: '160px', cursor: 'pointer', boxShadow: '0 2px 8px #ffd70044', transition: 'background 0.2s, box-shadow 0.2s' }}>İptal</button>
        </div>
      </div>
      {error && <div style={{ color: '#ff4d4f', fontWeight: 600, marginTop: '0.7rem' }}>{error}</div>}
      {success && <div style={{ color: '#4caf50', fontWeight: 600, marginTop: '0.7rem' }}>{success}</div>}
    </form>
  );
});
import { getCurrentAccount } from '../utils/wallet';
import axios from 'axios';

const MyTokens = () => {
  const [userAddress, setUserAddress] = useState('');
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDropdown, setOpenDropdown] = useState(null); // token address
  const [dropdownData, setDropdownData] = useState({}); // { [address]: { loading, data, error } }
  
  // Filter & Sort
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'active', 'inactive'
  const [sortBy, setSortBy] = useState('createdAt'); // 'createdAt', 'name', 'marketCap'
  const [sortOrder, setSortOrder] = useState('DESC'); // 'ASC', 'DESC'

  useEffect(() => {
    async function fetchTokens() {
      try {
        const address = await getCurrentAccount();
        setUserAddress(address);
        const backendURL = '${getBackendURL()}';
        console.log('MyTokens: wallet address:', address);
        console.log('MyTokens: backendURL:', backendURL);
        const res = await axios.get(`${backendURL}/api/my-tokens`, {
          headers: { 'wallet-address': address }
        });
        console.log('MyTokens: response:', res);
        setTokens(res.data || []);
      } catch (err) {
        console.error('MyTokens: error:', err);
        setError('Tokenlar alınamadı.');
      } finally {
        setLoading(false);
      }
    }
    fetchTokens();
  }, []);

  return (
    <div className="my-tokens-container">
      <h2 style={{ fontWeight: 700, fontSize: '2.4rem', color: '#ffd700', marginBottom: '1.5rem', letterSpacing: '1px', textAlign: 'center' }}>My Tokens</h2>
      <div style={{ color: '#aaa', fontSize: '1.05rem', marginBottom: '2rem', background: '#232323', padding: '0.9rem 1.5rem', borderRadius: '10px', boxShadow: '0 2px 8px #0002', width: '100%', maxWidth: '600px', textAlign: 'center' }}>
        <span style={{ fontWeight: 500 }}>Cüzdan adresin:</span> <span style={{ fontFamily: 'monospace', color: '#ffd700', wordBreak: 'break-all' }}>{userAddress}</span>
      </div>
      {loading && <div style={{ color: '#ffd700', fontWeight: 500, fontSize: '1.1rem' }}>Yükleniyor...</div>}
      {error && <div style={{ color: '#ff4d4f', fontWeight: 500 }}>{error}</div>}
      {(!loading && !error && tokens.length > 0) && (
        <>
          {/* Filter & Sort Controls */}
          <div style={{ width: '100%', maxWidth: '900px', display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
            {/* Filter Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ color: '#ffd700', fontWeight: 500, fontSize: '0.95rem' }}>Durum:</label>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                style={{
                  background: '#232323',
                  color: '#ffd700',
                  border: '2px solid #ffd700',
                  borderRadius: '6px',
                  padding: '0.5rem 0.8rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  outline: 'none',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 10px #ffd70055'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
              >
                <option value="all">Hepsi</option>
                <option value="active">Aktif</option>
                <option value="inactive">İnaktif</option>
              </select>
            </div>

            {/* Sort By */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ color: '#ffd700', fontWeight: 500, fontSize: '0.95rem' }}>Sırala:</label>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                style={{
                  background: '#232323',
                  color: '#ffd700',
                  border: '2px solid #ffd700',
                  borderRadius: '6px',
                  padding: '0.5rem 0.8rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  outline: 'none',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 10px #ffd70055'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
              >
                <option value="createdAt">En Yeni</option>
                <option value="name">İsim</option>
                <option value="marketCap">Pazar Değeri</option>
              </select>
            </div>

            {/* Sort Order */}
            <button
              onClick={() => setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC')}
              style={{
                background: '#232323',
                color: '#ffd700',
                border: '2px solid #ffd700',
                borderRadius: '6px',
                padding: '0.5rem 1rem',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.95rem',
                outline: 'none',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#ffd70055';
                e.currentTarget.style.boxShadow = '0 0 10px #ffd70055';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#232323';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {sortOrder === 'DESC' ? '↓ Azalan' : '↑ Artan'}
            </button>
          </div>

          {/* Results Info */}
          <div style={{ color: '#aaa', fontSize: '0.95rem', marginBottom: '1rem' }}>
            Toplam: <span style={{ color: '#ffd700', fontWeight: 600 }}>{tokens.length}</span> token
          </div>

          {/* Tokens Table */}
          <div className="my-tokens-table-wrapper">
            <table className="my-tokens-table">
          <thead>
            <tr style={{ background: '#181818' }}>
              <th style={{ padding: '1rem', fontWeight: 600, color: '#ffd700', borderTopLeftRadius: '12px' }}>Logo</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: '#ffd700' }}>Token Adı</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: '#ffd700' }}>Sembol</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: '#ffd700' }}>Adres</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: '#ffd700' }}>Arz</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: '#ffd700' }}>Paket</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: '#ffd700', borderTopRightRadius: '12px' }}>Paket</th>
            </tr>
          </thead>
          <tbody>
            {tokens
              .filter(token => {
                if (filterStatus === 'all') return true;
                if (filterStatus === 'active') return token.isActive !== false;
                if (filterStatus === 'inactive') return token.isActive === false;
                return true;
              })
              .sort((a, b) => {
                let aVal, bVal;
                if (sortBy === 'createdAt') {
                  aVal = new Date(a.createdAt || 0).getTime();
                  bVal = new Date(b.createdAt || 0).getTime();
                } else if (sortBy === 'name') {
                  aVal = (a.name || '').toLowerCase();
                  bVal = (b.name || '').toLowerCase();
                } else if (sortBy === 'marketCap') {
                  aVal = parseFloat(a.marketCap || 0);
                  bVal = parseFloat(b.marketCap || 0);
                }
                if (sortOrder === 'ASC') {
                  return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
                } else {
                  return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
                }
              })
              .map(token => (
              <React.Fragment key={token.address}>
                <tr
                  style={{
                    borderBottom: '1px solid #333',
                    cursor: 'pointer',
                    userSelect: 'none',
                    transition: 'background 0.25s, color 0.25s',
                  }}
                  onClick={() => window.location.href = `/token/${token.address}`}
                  title={`${token.name} detaylarını görüntüle`}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'linear-gradient(90deg,#232323 60%,#ffd70022 100%)';
                    e.currentTarget.style.color = '#ffd700';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = '';
                    e.currentTarget.style.color = '';
                  }}
                >
                  <td style={{ padding: '0.8rem', textAlign: 'center' }}>
                    {token.logoURL ? (
                      <img src={token.logoURL} alt={token.name} style={{ width: 36, height: 36, borderRadius: '50%', background: '#fff', objectFit: 'cover', boxShadow: '0 1px 4px #0002' }} />
                    ) : (
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#444', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffd700', fontWeight: 700, fontSize: '1.3rem' }}>
                        {token.name ? token.name[0].toUpperCase() : '?'}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '0.8rem', fontWeight: 500 }}>{token.name}</td>
                  <td style={{ padding: '0.8rem', fontWeight: 500 }}>{token.symbol}</td>
                  <td style={{ padding: '0.8rem', fontFamily: 'monospace', fontSize: '0.95rem', color: '#ffd700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>{token.address}</span>
                    <button
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ffd700',
                        cursor: 'pointer',
                        fontSize: '1.1rem',
                        padding: 0,
                        margin: 0,
                        outline: 'none',
                        transition: 'color 0.2s',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      title="Adresi kopyala"
                      onClick={e => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(token.address);
                        const btn = e.currentTarget;
                        const old = btn.innerHTML;
                        btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 10.5L9 14.5L15 7.5" stroke="#ffd700" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><rect x="3" y="6" width="10" height="12" rx="2" stroke="#ffd700" stroke-width="2"/></svg>`;
                        setTimeout(() => { btn.innerHTML = old; }, 1200);
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7 4C7 2.89543 7.89543 2 9 2H15C16.1046 2 17 2.89543 17 4V14C17 15.1046 16.1046 16 15 16H9C7.89543 16 7 15.1046 7 14V4Z" stroke="#ffd700" strokeWidth="2" />
                        <rect x="3" y="6" width="10" height="12" rx="2" stroke="#ffd700" strokeWidth="2" />
                      </svg>
                    </button>
                  </td>
                  <td style={{ padding: '0.8rem' }}>{token.totalSupply}</td>
                  <td style={{ padding: '0.8rem' }}>{token.tier}</td>
                  <td style={{ padding: '0.8rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}>
                      <button
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ffd700',
                          cursor: 'pointer',
                          fontSize: '1.2rem',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '6px',
                          transition: 'background 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Daha fazla bilgi"
                        onClick={async e => {
                          e.stopPropagation();
                          const isOpen = openDropdown === token.address;
                          setOpenDropdown(isOpen ? null : token.address);
                          if (!isOpen && !dropdownData[token.address]) {
                            setDropdownData(prev => ({ ...prev, [token.address]: { loading: true } }));
                            try {
                              // dexscreener API
                              const url = `https://api.dexscreener.com/latest/dex/tokens/${token.address}`;
                              const res = await fetch(url);
                              const json = await res.json();
                              setDropdownData(prev => ({ ...prev, [token.address]: { loading: false, data: json } }));
                            } catch (err) {
                              setDropdownData(prev => ({ ...prev, [token.address]: { loading: false, error: 'Dexscreener verisi alınamadı.' } }));
                            }
                          }
                        }}
                      >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="10" cy="10" r="9" stroke="#ffd700" strokeWidth="2" />
                          <path d="M10 7V13" stroke="#ffd700" strokeWidth="2" strokeLinecap="round" />
                          <circle cx="10" cy="15" r="1" fill="#ffd700" />
                        </svg>
                      </button>
                      {/* Edit icon only for owner */}
                      {userAddress && userAddress.toLowerCase() === token.creator?.toLowerCase() && (
                        <button
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ffd700',
                            cursor: 'pointer',
                            fontSize: '1.2rem',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '6px',
                            transition: 'background 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title="Düzenle"
                          onClick={e => {
                            e.stopPropagation();
                            setOpenDropdown(openDropdown === token.address + '-edit' ? null : token.address + '-edit');
                          }}
                        >
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 13.5V16H6.5L14.1 8.4L11.6 5.9L4 13.5Z" stroke="#ffd700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M12.8 4.7C13.1 4.4 13.6 4.4 13.9 4.7L15.3 6.1C15.6 6.4 15.6 6.9 15.3 7.2L14.1 8.4L11.6 5.9L12.8 4.7Z" stroke="#ffd700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                {/* Edit dropdown for logo/socials as a new row */}
                {openDropdown === token.address + '-edit' && (
                  <tr>
                    <td colSpan={7} style={{ padding: 0, borderBottom: 'none', position: 'relative' }}>
                      <EditTokenMeta token={token} userAddress={userAddress} onClose={() => setOpenDropdown(null)} onUpdated={updated => {
                        setTokens(tokens.map(t => t.address === updated.address ? updated : t));
                      }} />
                    </td>
                  </tr>
                )}
                {/* Info dropdown as a new row */}
                {openDropdown === token.address && (
                  <tr>
                    <td colSpan={7} style={{ padding: 0, borderBottom: 'none', position: 'relative' }}>
                      <div style={{
                        background: 'linear-gradient(90deg,#232323 60%,#ffd70022 100%)',
                        borderRadius: '0 0 14px 14px',
                        boxShadow: '0 2px 12px #0002',
                        padding: '2rem 2.5rem',
                        margin: 0,
                        width: '100%',
                        minWidth: 0,
                        position: 'relative',
                        zIndex: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        borderBottom: '1px solid #333'
                      }}>
                        {dropdownData[token.address]?.loading && (
                          <div style={{ color: '#ffd700', fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.7rem' }}>Dexscreener verileri yükleniyor...</div>
                        )}
                        {dropdownData[token.address]?.error && (
                          <div style={{ color: '#ff4d4f', fontWeight: 600 }}>{dropdownData[token.address].error}</div>
                        )}
                        {dropdownData[token.address]?.data && dropdownData[token.address].data.pairs && dropdownData[token.address].data.pairs.length > 0 && (
                          dropdownData[token.address].data.pairs.slice(0, 1).map(pair => (
                            <div key={pair.pairAddress} style={{ width: '100%' }}>
                              <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '1.2rem' }}> {pair.baseToken?.symbol} - {pair.quoteToken?.symbol}</div>
                              <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(6, 1fr)',
                                gap: '1.2rem',
                                width: '100%',
                                marginBottom: '0.7rem',
                                alignItems: 'center',
                                justifyItems: 'start',
                              }}>
                                <div>
                                  <div style={{ color: '#aaa', fontWeight: 500, marginBottom: '0.3rem' }}>Market Cap</div>
                                  <div style={{ fontWeight: 600, color: '#ffd700', fontSize: '1.05rem' }}>{pair.fdv ? `$${Number(pair.fdv).toLocaleString()}` : '-'}</div>
                                </div>
                                <div>
                                  <div style={{ color: '#aaa', fontWeight: 500, marginBottom: '0.3rem' }}>Liquidity (USD)</div>
                                  <div style={{ fontWeight: 600, color: '#ffd700', fontSize: '1.05rem' }}>{pair.liquidity?.usd ? `$${Number(pair.liquidity.usd).toLocaleString()}` : '-'}</div>
                                </div>
                                <div>
                                  <div style={{ color: '#aaa', fontWeight: 500, marginBottom: '0.3rem' }}>Liquidity ({pair.quoteToken?.symbol})</div>
                                  <div style={{ fontWeight: 600, color: '#ffd700', fontSize: '1.05rem' }}>{pair.liquidity?.base ? `${Number(pair.liquidity.base).toLocaleString()} ${pair.baseToken?.symbol}` : '-'}</div>
                                </div>
                                <div>
                                  <div style={{ color: '#aaa', fontWeight: 500, marginBottom: '0.3rem' }}>Price</div>
                                  <div style={{ fontWeight: 600, color: '#ffd700', fontSize: '1.05rem' }}>
                                    {pair.priceUsd && Number(pair.priceUsd) > 0
                                      ? `$${Number(pair.priceUsd) < 1 ? Number(pair.priceUsd).toFixed(6) : Number(pair.priceUsd).toLocaleString()}`
                                      : '-'}
                                  </div>
                                </div>
                                <div>
                                  <div style={{ color: '#aaa', fontWeight: 500, marginBottom: '0.3rem' }}>Price Change 24h</div>
                                  <div style={{ fontWeight: 600, color: pair.priceChange?.h24 > 0 ? '#4caf50' : pair.priceChange?.h24 < 0 ? '#ff4d4f' : '#ffd700', fontSize: '1.05rem' }}>{pair.priceChange?.h24 ? `${pair.priceChange.h24.toFixed(2)}%` : '-'}</div>
                                </div>
                                <div>
                                  <div style={{ color: '#aaa', fontWeight: 500, marginBottom: '0.3rem' }}>Price Change 1h</div>
                                  <div style={{ fontWeight: 600, color: pair.priceChange?.h1 > 0 ? '#4caf50' : pair.priceChange?.h1 < 0 ? '#ff4d4f' : '#ffd700', fontSize: '1.05rem' }}>{pair.priceChange?.h1 ? `${pair.priceChange.h1.toFixed(2)}%` : '-'}</div>
                                </div>
                              </div>
                              <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(6, 1fr)',
                                gap: '1.2rem',
                                width: '100%',
                                marginBottom: '0.7rem',
                                alignItems: 'center',
                                justifyItems: 'start',
                              }}>
                                <div>
                                  <div style={{ color: '#aaa', fontWeight: 500, marginBottom: '0.3rem' }}>Volume 1h</div>
                                  <div style={{ fontWeight: 600, color: '#ffd700', fontSize: '1.05rem' }}>{pair.volume?.h1 ? `$${Number(pair.volume.h1).toLocaleString()}` : '-'}</div>
                                </div>
                                <div>
                                  <div style={{ color: '#aaa', fontWeight: 500, marginBottom: '0.3rem' }}>Volume 6h</div>
                                  <div style={{ fontWeight: 600, color: '#ffd700', fontSize: '1.05rem' }}>{pair.volume?.h6 ? `$${Number(pair.volume.h6).toLocaleString()}` : '-'}</div>
                                </div>
                                <div>
                                  <div style={{ color: '#aaa', fontWeight: 500, marginBottom: '0.3rem' }}>Volume 24h</div>
                                  <div style={{ fontWeight: 600, color: '#ffd700', fontSize: '1.05rem' }}>{pair.volume?.h24 ? `$${Number(pair.volume.h24).toLocaleString()}` : '-'}</div>
                                </div>
                                <div>
                                  <div style={{ color: '#aaa', fontWeight: 500, marginBottom: '0.3rem' }}>Pair Created</div>
                                  <div style={{ fontWeight: 600, color: '#ffd700', fontSize: '1.05rem' }}>{pair.createdAt && Number(pair.createdAt) > 0 ? new Date(pair.createdAt * 1000).toLocaleDateString() : '-'}</div>
                                </div>
                                <div>
                                  <div style={{ color: '#aaa', fontWeight: 500, marginBottom: '0.3rem' }}>Txns 24h (Buys/Sells)</div>
                                  <div style={{ fontWeight: 600, color: '#ffd700', fontSize: '1.05rem' }}>
                                    {pair.txns?.h24 ? `${pair.txns.h24.buys ?? '-'} / ${pair.txns.h24.sells ?? '-'}` : '-'}
                                  </div>
                                </div>
                                <div>
                                  <div style={{ color: '#aaa', fontWeight: 500, marginBottom: '0.3rem' }}>Dexscreener</div>
                                  <a href={`https://dexscreener.com/${pair.chainId}/${pair.pairAddress}`} target="_blank" rel="noopener noreferrer" style={{ color: '#ffd700', textDecoration: 'underline', fontWeight: 600, fontSize: '1.05rem' }}>Detay</a>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                        {dropdownData[token.address]?.data && (!dropdownData[token.address].data.pairs || dropdownData[token.address].data.pairs.length === 0) && (
                          <div style={{ color: '#aaa', fontWeight: 500 }}>Dexscreener'da veri bulunamadı.</div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
          </div>
        </>
      )}
      {(!loading && !error && tokens.length === 0) && (
        <div style={{ marginTop: '3rem', textAlign: 'center', background: 'linear-gradient(90deg,#232323 60%,#ffd70022 100%)', borderRadius: '14px', boxShadow: '0 2px 12px #0002', padding: '2.5rem 1.5rem' }}>
          <div style={{ fontSize: '1.3rem', fontWeight: 600, color: '#ffd700', marginBottom: '1.2rem' }}>Hiç token oluşturmadınız.</div>
          <button
            style={{
              background: 'linear-gradient(90deg,#ffd700 60%,#fff700 100%)',
              color: '#232323',
              fontWeight: 700,
              fontSize: '1.1rem',
              border: 'none',
              borderRadius: '8px',
              padding: '0.8rem 2.2rem',
              cursor: 'pointer',
              boxShadow: '0 2px 8px #ffd70044',
              transition: 'background 0.2s, box-shadow 0.2s'
            }}
            onClick={() => window.location.href = '/create'}
          >
            Şimdi Token Oluştur
          </button>
        </div>
      )}
    </div>
  );
};

export default MyTokens;

