import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FaEdit,
  FaCheck,
  FaTimes,
  FaTwitter,
  FaTelegram,
  FaGlobe,
  FaDiscord,
  FaCopy,
  FaCheckCircle,
  FaCamera,
  FaArrowRight,
  FaArrowLeft,
  FaSortAmountDown,
  FaFilter,
  FaTrash
} from 'react-icons/fa';
import { ReactComponent as DefaultAvatar } from './default-avatar.svg';
import '../pages/MyProfile.css';

const MyProfile = () => {
  const [profile, setProfile] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setsSaveSuccess] = useState(false);
  const imageInputRef = React.useRef(null);

  // Pagination state
  const [tokenPage, setTokenPage] = useState(1);
  const [tokenLimit] = useState(12);
  const [tokenTotal, setTokenTotal] = useState(0);
  const [tokenPages, setTokenPages] = useState(1);

  // Filter & Sort state
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [filterMarketCap, setFilterMarketCap] = useState({ min: 0, max: Infinity });

  // Profile resmi upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    console.log('📷 [PROFILE] Image selected:', { name: file.name, size: file.size, type: file.type });

    // Dosyayı state'e kaydet (FormData olarak gönderilecek)
    setEditForm(prev => ({
      ...prev,
      profileImage: file
    }));

    // Preview URL'sini göster
    const reader = new FileReader();
    reader.onload = (event) => {
      console.log('📷 [PROFILE] Image preview URL created');
      setImagePreview(event.target.result);
    };
    reader.readAsDataURL(file);
    
    // Reset input value so same file can be selected again
    e.target.value = '';
  };

  // Get wallet address
  const getWalletAddress = async () => {
    try {
      const { getCurrentAccount } = await import('../utils/wallet');
      const address = await getCurrentAccount();
      return address ? address.toLowerCase() : null;
    } catch (err) {
      console.error('Wallet error:', err);
      return null;
    }
  };

  // Fetch profile
  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const address = await getWalletAddress();
        if (!address) {
          setWalletConnected(false);
          setLoading(false);
          return;
        }

        setWalletConnected(true);
        setWalletAddress(address);

        const backendURL = process.env.REACT_APP_BACKEND_URL || '${getBackendURL()}';
        const response = await fetch(`${backendURL}/api/users/${address}`, {
          headers: { 'wallet-address': address }
        });

        const data = await response.json();
        if (data.success && data.profile) {
          setProfile(data.profile);
          setEditForm(data.profile);
        }
      } catch (err) {
        console.error('Profile load error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  // Fetch tokens
  useEffect(() => {
    if (!walletAddress) return;

    const fetchTokens = async () => {
      try {
        const backendURL = process.env.REACT_APP_BACKEND_URL || '${getBackendURL()}';
        const offset = (tokenPage - 1) * tokenLimit;

        const params = new URLSearchParams({
          limit: tokenLimit,
          offset: offset,
          sortBy: sortBy,
          sortOrder: sortOrder
        });

        const response = await fetch(
          `${backendURL}/api/users/${walletAddress}/tokens?${params}`,
          { headers: { 'wallet-address': walletAddress } }
        );

        const data = await response.json();
        if (data.success) {
          setTokens(data.data);
          setTokenTotal(data.pagination.total);
          setTokenPages(data.pagination.pages);
        }
      } catch (err) {
        console.error('Tokens fetch error:', err);
      }
    };

    fetchTokens();
  }, [walletAddress, tokenPage, sortBy, sortOrder]);

  // Save profile
  const handleSaveProfile = async () => {
    if (!walletAddress) return;

    setSaveLoading(true);
    try {
      const backendURL = process.env.REACT_APP_BACKEND_URL || '${getBackendURL()}';

      console.log('💾 [PROFILE SAVE] Starting save...', { 
        walletAddress,
        hasImage: editForm.profileImage ? true : false,
        imageType: typeof editForm.profileImage
      });

      // FormData kullanarak image upload'u da yapabiliriz
      const formData = new FormData();
      formData.append('username', editForm.username);
      formData.append('bio', editForm.bio);
      formData.append('description', editForm.description);
      formData.append('twitter', editForm.twitter);
      formData.append('telegram', editForm.telegram);
      formData.append('website', editForm.website);
      formData.append('discord', editForm.discord);

      console.log('💾 [PROFILE SAVE] Checking image field...');

      // Eğer yeni bir image seçildiyse ve bir file ise (base64 değilse)
      if (editForm.profileImage && editForm.profileImage instanceof File) {
        console.log('💾 [PROFILE SAVE] Image is File object:', editForm.profileImage.name);
        formData.append('profileImage', editForm.profileImage);
      } else if (typeof editForm.profileImage === 'string' && editForm.profileImage.startsWith('data:')) {
        // Base64 encoded image
        console.log('💾 [PROFILE SAVE] Image is Base64, size:', editForm.profileImage.length);
        formData.append('profileImageBase64', editForm.profileImage);
      } else {
        console.log('💾 [PROFILE SAVE] No new image or invalid format');
      }

      console.log('💾 [PROFILE SAVE] Sending to backend...');

      const response = await fetch(`${backendURL}/api/users/${walletAddress}`, {
        method: 'PUT',
        headers: {
          'wallet-address': walletAddress
          // NOT setting Content-Type header - let the browser set it for FormData
        },
        body: formData
      });

      console.log('💾 [PROFILE SAVE] Response status:', response.status);

      const data = await response.json();
      console.log('💾 [PROFILE SAVE] Response:', { success: data.success, error: data.error });
      
      if (data.success) {
        console.log('✅ [PROFILE SAVE] Profile saved!');
        setProfile(data.profile);
        setIsEditing(false);
        setImagePreview(null);
        setEditForm({});
        setsSaveSuccess(true);
        setTimeout(() => setsSaveSuccess(false), 3000);
      } else {
        console.error('❌ [PROFILE SAVE] Error:', data.error);
        alert(`Save failed: ${data.error}`);
      }
    } catch (err) {
      console.error('❌ [PROFILE SAVE] Exception:', err);
      alert('Failed to save profile: ' + err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCopy = () => {
    if (profile?.address) {
      navigator.clipboard.writeText(profile.address);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }
  };

  const handleInputChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setImagePreview(null);
    setEditForm({});
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: 80, color: '#ffd700', fontSize: 18 }}>
        <div style={{
          width: 50,
          height: 50,
          border: '3px solid #ffd700',
          borderTop: '3px solid transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 20px'
        }}></div>
        Profil yükleniyor...
      </div>
    );
  }

  if (!walletConnected) {
    return (
      <div style={{
        textAlign: 'center',
        marginTop: 80,
        padding: '40px 20px',
        background: 'linear-gradient(135deg, #0f0f0f 0%, #232323 100%)',
        minHeight: '100vh'
      }}>
        <h2 style={{ color: '#ffd700', fontSize: 32, marginBottom: 20 }}>
          Profilinize erişmek için cüzdanınızı bağlayın
        </h2>
        <p style={{ color: '#aaa', fontSize: 16 }}>
          Bir cüzdan bağlandıktan sonra profilinizi görebilir ve yönetebilirsiniz.
        </p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{
        textAlign: 'center',
        marginTop: 80,
        color: '#ffd700',
        fontSize: 18
      }}>
        Profil yüklenemedi
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f0f 0%, #232323 50%, #1a1a1a 100%)',
      padding: '32px 24px 40px 24px',
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 32
        }}>
          <h1 style={{ color: '#ffd700', fontSize: 32, margin: 0 }}>Benim Profilim</h1>
          <button
            onClick={() => {
              if (isEditing) {
                handleCancelEdit();
              } else {
                setEditForm(profile);
                setIsEditing(true);
              }
            }}
            style={{
              background: isEditing ? 'linear-gradient(135deg, #ff4444 0%, #cc0000 100%)' : 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
              border: 'none',
              borderRadius: 12,
              padding: '12px 24px',
              fontWeight: 700,
              color: isEditing ? '#fff' : '#1a1a1a',
              cursor: 'pointer',
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(255,215,0,0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            {isEditing ? (
              <>
                <FaTimes /> Vazgeç
              </>
            ) : (
              <>
                <FaEdit /> Düzenle
              </>
            )}
          </button>
        </div>

        {/* Success message */}
        {saveSuccess && (
          <div style={{
            background: 'linear-gradient(135deg, #00ff88 0%, #00cc66 100%)',
            color: '#1a1a1a',
            padding: '16px 24px',
            borderRadius: 12,
            marginBottom: 24,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <FaCheckCircle /> Profil başarıyla güncellendi!
          </div>
        )}

        {/* Profile Section */}
        <div style={{
          background: 'linear-gradient(135deg, #181818 0%, #232323 100%)',
          borderRadius: 24,
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          padding: 40,
          marginBottom: 32,
          border: '1px solid #333'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 40,
            alignItems: 'start'
          }}>
            {/* Left: Avatar & Basic */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Avatar */}
              <div style={{
                position: 'relative',
                width: 200,
                height: 200,
                margin: '0 auto'
              }}>
                {imagePreview || (editForm.profileImage && typeof editForm.profileImage === 'string' && editForm.profileImage.startsWith('http')) ? (
                  <img
                    src={imagePreview || editForm.profileImage}
                    alt="Avatar"
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '4px solid #ffd700',
                      boxShadow: '0 8px 32px rgba(255,215,0,0.3)'
                    }}
                  />
                ) : (
                  <DefaultAvatar style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    border: '4px solid #ffd700',
                    boxShadow: '0 8px 32px rgba(255,215,0,0.3)',
                    background: '#fff'
                  }} />
                )}

                {isEditing && (
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('🖼️ [PROFILE] Camera button clicked');
                      imageInputRef.current?.click();
                    }}
                    style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: 60,
                    height: 60,
                    background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: 24,
                    color: '#1a1a1a',
                    border: '3px solid #1a1a1a',
                    transition: 'all 0.3s'
                  }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'scale(1)';
                    }}
                  >
                    <FaCamera />
                    <input
                      key={`image-input-${isEditing}`}
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        e.stopPropagation();
                        console.log('📷 [PROFILE] Input onChange triggered');
                        handleImageUpload(e);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('📷 [PROFILE] Input clicked');
                      }}
                      style={{ display: 'none' }}
                    />
                  </div>
                )}
              </div>

              {/* Address */}
              <div style={{
                background: '#2a2a2a',
                padding: '12px 16px',
                borderRadius: 12,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: '1px solid #333'
              }}>
                <span style={{ color: '#aaa', fontSize: 14 }}>
                  {profile.address ? `${profile.address.slice(0, 8)}...${profile.address.slice(-6)}` : 'N/A'}
                </span>
                <button
                  onClick={handleCopy}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ffd700',
                    cursor: 'pointer',
                    fontSize: 16,
                    padding: 4
                  }}
                >
                  {copyFeedback ? <FaCheckCircle /> : <FaCopy />}
                </button>
              </div>
            </div>

            {/* Right: Editable Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Username */}
              <div>
                <label style={{ color: '#aaa', fontSize: 12, display: 'block', marginBottom: 8 }}>
                  Kullanıcı Adı
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.username || ''}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    style={{
                      width: '100%',
                      background: '#2a2a2a',
                      border: '2px solid #ffd700',
                      borderRadius: 10,
                      padding: '12px 16px',
                      color: '#fff',
                      fontSize: 16,
                      fontFamily: 'inherit'
                    }}
                  />
                ) : (
                  <div style={{
                    background: '#2a2a2a',
                    padding: '12px 16px',
                    borderRadius: 10,
                    color: '#ffd700',
                    fontSize: 16,
                    fontWeight: 600
                  }}>
                    {profile.username || 'Unnamed'}
                  </div>
                )}
              </div>

              {/* Bio */}
              <div>
                <label style={{ color: '#aaa', fontSize: 12, display: 'block', marginBottom: 8 }}>
                  Bio (Kısa Açıklama)
                </label>
                {isEditing ? (
                  <textarea
                    value={editForm.bio || ''}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    style={{
                      width: '100%',
                      background: '#2a2a2a',
                      border: '2px solid #ffd700',
                      borderRadius: 10,
                      padding: '12px 16px',
                      color: '#fff',
                      fontSize: 14,
                      fontFamily: 'inherit',
                      minHeight: 80,
                      resize: 'vertical'
                    }}
                    placeholder="Kısa bir açıklama yazın..."
                  />
                ) : (
                  <div style={{
                    background: '#2a2a2a',
                    padding: '12px 16px',
                    borderRadius: 10,
                    color: '#ccc',
                    fontSize: 14,
                    minHeight: 80,
                    display: 'flex',
                    alignItems: 'flex-start'
                  }}>
                    {profile.bio || 'Bio yazılmamış'}
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label style={{ color: '#aaa', fontSize: 12, display: 'block', marginBottom: 8 }}>
                  Detaylı Açıklama
                </label>
                {isEditing ? (
                  <textarea
                    value={editForm.description || ''}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    style={{
                      width: '100%',
                      background: '#2a2a2a',
                      border: '2px solid #ffd700',
                      borderRadius: 10,
                      padding: '12px 16px',
                      color: '#fff',
                      fontSize: 14,
                      fontFamily: 'inherit',
                      minHeight: 100,
                      resize: 'vertical'
                    }}
                    placeholder="Kendiniz hakkında detaylı bilgi verin..."
                  />
                ) : (
                  <div style={{
                    background: '#2a2a2a',
                    padding: '12px 16px',
                    borderRadius: 10,
                    color: '#ccc',
                    fontSize: 14,
                    minHeight: 100,
                    display: 'flex',
                    alignItems: 'flex-start',
                    lineHeight: 1.6
                  }}>
                    {profile.description || 'Açıklama yazılmamış'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div style={{
            marginTop: 32,
            paddingTop: 32,
            borderTop: '1px solid #333'
          }}>
            <h3 style={{ color: '#ffd700', marginBottom: 16 }}>Sosyal Linkler</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 16
            }}>
              {/* Twitter */}
              <div>
                <label style={{ color: '#aaa', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <FaTwitter /> Twitter
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.twitter || ''}
                    onChange={(e) => handleInputChange('twitter', e.target.value)}
                    placeholder="https://twitter.com/..."
                    style={{
                      width: '100%',
                      background: '#2a2a2a',
                      border: '1px solid #333',
                      borderRadius: 8,
                      padding: '10px 14px',
                      color: '#fff',
                      fontSize: 13,
                      fontFamily: 'inherit'
                    }}
                  />
                ) : (
                  <div style={{
                    color: profile.twitter ? '#1da1f2' : '#666',
                    fontSize: 13,
                    wordBreak: 'break-all'
                  }}>
                    {profile.twitter || 'Bağlı değil'}
                  </div>
                )}
              </div>

              {/* Telegram */}
              <div>
                <label style={{ color: '#aaa', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <FaTelegram /> Telegram
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.telegram || ''}
                    onChange={(e) => handleInputChange('telegram', e.target.value)}
                    placeholder="https://t.me/..."
                    style={{
                      width: '100%',
                      background: '#2a2a2a',
                      border: '1px solid #333',
                      borderRadius: 8,
                      padding: '10px 14px',
                      color: '#fff',
                      fontSize: 13,
                      fontFamily: 'inherit'
                    }}
                  />
                ) : (
                  <div style={{
                    color: profile.telegram ? '#0088cc' : '#666',
                    fontSize: 13,
                    wordBreak: 'break-all'
                  }}>
                    {profile.telegram || 'Bağlı değil'}
                  </div>
                )}
              </div>

              {/* Website */}
              <div>
                <label style={{ color: '#aaa', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <FaGlobe /> Website
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.website || ''}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="https://..."
                    style={{
                      width: '100%',
                      background: '#2a2a2a',
                      border: '1px solid #333',
                      borderRadius: 8,
                      padding: '10px 14px',
                      color: '#fff',
                      fontSize: 13,
                      fontFamily: 'inherit'
                    }}
                  />
                ) : (
                  <div style={{
                    color: profile.website ? '#ffd700' : '#666',
                    fontSize: 13,
                    wordBreak: 'break-all'
                  }}>
                    {profile.website || 'Bağlı değil'}
                  </div>
                )}
              </div>

              {/* Discord */}
              <div>
                <label style={{ color: '#aaa', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <FaDiscord /> Discord
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.discord || ''}
                    onChange={(e) => handleInputChange('discord', e.target.value)}
                    placeholder="https://discord.gg/..."
                    style={{
                      width: '100%',
                      background: '#2a2a2a',
                      border: '1px solid #333',
                      borderRadius: 8,
                      padding: '10px 14px',
                      color: '#fff',
                      fontSize: 13,
                      fontFamily: 'inherit'
                    }}
                  />
                ) : (
                  <div style={{
                    color: profile.discord ? '#5865f2' : '#666',
                    fontSize: 13,
                    wordBreak: 'break-all'
                  }}>
                    {profile.discord || 'Bağlı değil'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div style={{
            marginTop: 32,
            paddingTop: 32,
            borderTop: '1px solid #333',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 16
          }}>
            <Link 
              to={`/profile/${walletAddress}/followers`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div style={{
                background: '#2a2a2a',
                borderRadius: 12,
                padding: 16,
                textAlign: 'center',
                border: '1px solid #333',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                ':hover': {
                  borderColor: '#ffd700',
                  background: '#353535'
                }
              }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#ffd700' }}>
                  {profile.followersCount || 0}
                </div>
                <div style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>Takipçiler</div>
              </div>
            </Link>

            <Link 
              to={`/profile/${walletAddress}/following`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div style={{
                background: '#2a2a2a',
                borderRadius: 12,
                padding: 16,
                textAlign: 'center',
                border: '1px solid #333',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                ':hover': {
                  borderColor: '#ffd700',
                  background: '#353535'
                }
              }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#ffd700' }}>
                  {profile.followingCount || 0}
                </div>
                <div style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>Takip Edilen</div>
              </div>
            </Link>

            <div style={{
              background: '#2a2a2a',
              borderRadius: 12,
              padding: 16,
              textAlign: 'center',
              border: '1px solid #333'
            }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#ffd700' }}>
                {profile.totalTokensCreated || 0}
              </div>
              <div style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>Token Oluşturdu</div>
            </div>

            <div style={{
              background: '#2a2a2a',
              borderRadius: 12,
              padding: 16,
              textAlign: 'center',
              border: '1px solid #333'
            }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#ffd700' }}>
                {profile.trustScore || 0}
              </div>
              <div style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>Trust Score</div>
            </div>
          </div>

          {/* Save Button */}
          {isEditing && (
            <button
              onClick={handleSaveProfile}
              disabled={saveLoading}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #00ff88 0%, #00cc66 100%)',
                border: 'none',
                borderRadius: 12,
                padding: '16px',
                fontWeight: 700,
                color: '#1a1a1a',
                cursor: saveLoading ? 'wait' : 'pointer',
                fontSize: 16,
                marginTop: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                if (!saveLoading) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 25px rgba(0,255,136,0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (!saveLoading) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }
              }}
            >
              {saveLoading ? (
                <>
                  <div style={{
                    width: 20,
                    height: 20,
                    border: '2px solid #1a1a1a',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <FaCheck /> Değişiklikleri Kaydet
                </>
              )}
            </button>
          )}
        </div>

        {/* Tokens Section */}
        <div style={{
          background: 'linear-gradient(135deg, #181818 0%, #232323 100%)',
          borderRadius: 24,
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          padding: 32,
          border: '1px solid #333'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24
          }}>
            <h2 style={{ color: '#ffd700', fontSize: 24, margin: 0 }}>
              Açtığım Tokenler ({tokenTotal})
            </h2>
            <div style={{ display: 'flex', gap: 12 }}>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setTokenPage(1);
                }}
                style={{
                  background: '#2a2a2a',
                  border: '1px solid #333',
                  borderRadius: 8,
                  padding: '10px 14px',
                  color: '#ffd700',
                  cursor: 'pointer',
                  fontSize: 14
                }}
              >
                <option value="createdAt">Son Oluşturulan</option>
                <option value="marketCap">Market Cap</option>
                <option value="liquidity">Likidite</option>
                <option value="totalVolume">Hacim</option>
              </select>

              <button
                onClick={() => setSortOrder(sortOrder === 'DESC' ? 'ASC' : 'DESC')}
                style={{
                  background: '#2a2a2a',
                  border: '1px solid #333',
                  borderRadius: 8,
                  padding: '10px 14px',
                  color: '#ffd700',
                  cursor: 'pointer',
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                {sortOrder === 'DESC' ? (
                  <>
                    <FaSortAmountDown /> Azalan
                  </>
                ) : (
                  <>
                    <FaSortAmountDown style={{ transform: 'rotate(180deg)' }} /> Artan
                  </>
                )}
              </button>
            </div>
          </div>

          {tokens.length > 0 ? (
            <>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 20,
                marginBottom: 32
              }}>
                {tokens.map((token) => (
                  <div
                    key={token.address}
                    style={{
                      background: 'linear-gradient(135deg, #1a1a1a 0%, #222 100%)',
                      borderRadius: 16,
                      padding: 20,
                      border: '1px solid #333',
                      transition: 'all 0.3s',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(255,215,0,0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                      <div>
                        <div style={{ color: '#ffd700', fontWeight: 700, fontSize: 16 }}>
                          {token.name}
                        </div>
                        <div style={{ color: '#aaa', fontSize: 13 }}>
                          {token.symbol}
                        </div>
                      </div>
                      <a
                        href={`/token/${token.address}`}
                        style={{
                          color: '#ffd700',
                          textDecoration: 'none',
                          fontSize: 18,
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        →
                      </a>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 12,
                      fontSize: 13
                    }}>
                      <div>
                        <span style={{ color: '#aaa' }}>Market Cap</span>
                        <div style={{ color: '#ffd700', fontWeight: 600 }}>
                          ${(parseFloat(token.marketCap) || 0).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <span style={{ color: '#aaa' }}>Likidite</span>
                        <div style={{ color: '#ffd700', fontWeight: 600 }}>
                          ${(parseFloat(token.liquidity) || 0).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <span style={{ color: '#aaa' }}>Hacim</span>
                        <div style={{ color: '#ffd700', fontWeight: 600 }}>
                          ${(parseFloat(token.totalVolume) || 0).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <span style={{ color: '#aaa' }}>Işlemler</span>
                        <div style={{ color: '#ffd700', fontWeight: 600 }}>
                          {token.totalTrades || 0}
                        </div>
                      </div>
                    </div>

                    <div style={{
                      marginTop: 12,
                      paddingTop: 12,
                      borderTop: '1px solid #333',
                      fontSize: 12,
                      color: '#aaa'
                    }}>
                      {new Date(token.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {tokenPages > 1 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 12
                }}>
                  <button
                    onClick={() => setTokenPage(Math.max(1, tokenPage - 1))}
                    disabled={tokenPage === 1}
                    style={{
                      background: tokenPage === 1 ? '#333' : '#ffd700',
                      border: 'none',
                      borderRadius: 8,
                      padding: '10px 14px',
                      color: tokenPage === 1 ? '#666' : '#1a1a1a',
                      cursor: tokenPage === 1 ? 'not-allowed' : 'pointer',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 14
                    }}
                  >
                    <FaArrowLeft /> Önceki
                  </button>

                  {Array.from({ length: tokenPages }, (_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setTokenPage(i + 1)}
                      style={{
                        background: tokenPage === i + 1 ? '#ffd700' : '#2a2a2a',
                        border: '1px solid #333',
                        borderRadius: 6,
                        padding: '8px 12px',
                        color: tokenPage === i + 1 ? '#1a1a1a' : '#ffd700',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: 14
                      }}
                    >
                      {i + 1}
                    </button>
                  ))}

                  <button
                    onClick={() => setTokenPage(Math.min(tokenPages, tokenPage + 1))}
                    disabled={tokenPage === tokenPages}
                    style={{
                      background: tokenPage === tokenPages ? '#333' : '#ffd700',
                      border: 'none',
                      borderRadius: 8,
                      padding: '10px 14px',
                      color: tokenPage === tokenPages ? '#666' : '#1a1a1a',
                      cursor: tokenPage === tokenPages ? 'not-allowed' : 'pointer',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 14
                    }}
                  >
                    Sonraki <FaArrowRight />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: '#aaa',
              fontSize: 16
            }}>
              Hiç token açılmamış
            </div>
          )}
        </div>
      </div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default MyProfile;

