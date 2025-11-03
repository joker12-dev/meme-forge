import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {  FaArrowLeft, FaArrowRight, FaSort } from 'react-icons/fa';
import { FiSearch } from 'react-icons/fi';
import HypeSlider from './HypeSlider';
import CampaignSlider from './CampaignSlider';
import ErrorAlert from './ErrorAlert';
import './TokenList.css';

const TokenListEnhanced = () => {
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [tokensPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  // Filters & Sort
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [filterMarketCapMin, setFilterMarketCapMin] = useState(0);
  const [filterMarketCapMax, setFilterMarketCapMax] = useState('');
  const [filterLiquidityMin, setFilterLiquidityMin] = useState(0);
  const [filterVolumeMin, setFilterVolumeMin] = useState(0);

  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [liveTransactions, setLiveTransactions] = useState([]);

  // Fetch live transactions
  useEffect(() => {
    const fetchLiveTransactions = async () => {
      try {
        const backendURL = process.env.REACT_APP_BACKEND_URL || '${getBackendURL()}';
        const response = await fetch(`${backendURL}/api/trades/recent/BSC?limit=30`);
        const data = await response.json();
        
        if (data.success && Array.isArray(data.trades)) {
          const formatAddress = (addr) => {
            if (!addr || typeof addr !== 'string') return 'unknown';
            return addr.slice(0, 6) + '...' + addr.slice(-4);
          };
          
          const txs = data.trades.map(trade => ({
            user: formatAddress(trade.user || trade.userAddress),
            action: (trade.type || '').toUpperCase() === 'SELL' ? 'Sold' : 'Bought',
            amount: `${trade.amount || '0'} ${trade.tokenSymbol || ''}`,
            token: trade.tokenSymbol || ''
          }));
          
          setLiveTransactions(txs);
        }
      } catch (err) {
        console.error('Live transactions error:', err);
      }
    };

    fetchLiveTransactions();
    const interval = setInterval(fetchLiveTransactions, 3000);
    return () => clearInterval(interval);
  }, []);

  // Fetch tokens
  useEffect(() => {
    const fetchTokens = async () => {
      try {
        setLoading(true);
        setError('');
        const backendURL = process.env.REACT_APP_BACKEND_URL || '${getBackendURL()}';
        
        const params = new URLSearchParams({
          page: currentPage,
          limit: tokensPerPage,
          sortBy: sortBy,
          sortOrder: sortOrder
        });

        if (searchTerm) params.append('search', searchTerm);
        if (filterMarketCapMin > 0) params.append('minMarketCap', filterMarketCapMin);
        if (filterMarketCapMax) params.append('maxMarketCap', filterMarketCapMax);
        if (filterLiquidityMin > 0) params.append('minLiquidity', filterLiquidityMin);
        if (filterVolumeMin > 0) params.append('minVolume', filterVolumeMin);

        const response = await fetch(`${backendURL}/api/tokens?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error(`Sunucu hatası: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
          // Backend gönderdiği: { success, data: tokens, pagination }
          const tokenList = data.data || data.tokens || [];
          const pagination = data.pagination || { pages: 1, total: 0 };
          
          setTokens(tokenList);
          setTotalPages(pagination.pages || 1);
        } else {
          setError(data.error || 'Tokenlar yüklenemedi');
          setTokens([]);
        }
      } catch (err) {
        const errorMessage = err instanceof Error 
          ? err.message 
          : 'Tokenlar yüklenirken bir hata oluştu. Lütfen internet bağlantınızı kontrol edin.';
        setError(errorMessage);
        setTokens([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTokens();
  }, [currentPage, searchTerm, sortBy, sortOrder, filterMarketCapMin, filterMarketCapMax, filterLiquidityMin, filterVolumeMin]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterMarketCapMin(0);
    setFilterMarketCapMax('');
    setFilterLiquidityMin(0);
    setFilterVolumeMin(0);
    setSortBy('createdAt');
    setSortOrder('DESC');
    setCurrentPage(1);
  };

  const formatNumber = (num) => {
    const n = Number(num);
    if (isNaN(n) || !n) return '$0';
    if (n >= 1000000) return `$${(n / 1000000).toFixed(2)}M`;
    if (n >= 1000) return `$${(n / 1000).toFixed(2)}K`;
    return `$${n.toFixed(2)}`;
  };

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a' }}>
      {/* Live Transactions Ticker */}
      {liveTransactions.length > 0 && (
        <div style={{
          background: 'linear-gradient(90deg, #1a1a1a 0%, #2a2a2a 50%, #1a1a1a 100%)',
          borderBottom: '1px solid #333',
          padding: '12px 0',
          overflow: 'hidden',
          marginBottom: 20
        }}>
          <div style={{ display: 'flex', gap: 30, animation: 'scroll 20s linear infinite' }}>
            {Array.from({ length: 3 }).map((_, set) =>
              liveTransactions.map((tx, i) => (
                <div key={`${set}-${i}`} style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                  fontSize: 12,
                  color: '#aaa',
                  whiteSpace: 'nowrap'
                }}>
                  <span>{tx.user}</span>
                  <span style={{ color: tx.action === 'Bought' ? '#00ff88' : '#ff4d4d' }}>
                    {tx.action}
                  </span>
                  <span>{tx.amount}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '300px 1fr',
        gap: 20,
        padding: '20px 24px',
        maxWidth: 1400,
        margin: '0 auto',
        marginBottom: 40
      }}>
        <Link
          to="/create"
          style={{
            background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
            borderRadius: 16,
            padding: 24,
            textDecoration: 'none',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: 200,
            color: '#1a1a1a',
            fontWeight: 700
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(255,215,0,0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div>
            <div style={{ fontSize: 24 }}>🚀</div>
            <div style={{ marginTop: 12 }}>Create Token</div>
            <div style={{ fontSize: 12, fontWeight: 400, marginTop: 4, color: '#333' }}>
              Launch your own token
            </div>
          </div>
          <div style={{ fontSize: 18 }}>→</div>
        </Link>

        <HypeSlider />
      </div>

      <CampaignSlider />

      {/* Main Content */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px' }}>
        {/* Header */}
        <h1 style={{ color: '#ffd700', fontSize: 32, marginBottom: 8 }}>🚀 Tokenler</h1>
        <p style={{ color: '#aaa', marginBottom: 32 }}>Tüm tokenları keşfet, filtrele ve sırala</p>

        {/* Error Alert */}
        {error && (
          <ErrorAlert
            error={error}
            onRetry={() => {
              setError('');
              setCurrentPage(1);
            }}
            onDismiss={() => setError('')}
            type="error"
          />
        )}

        {/* Filter Section */}
        <div style={{
          background: 'linear-gradient(135deg, #181818 0%, #232323 100%)',
          borderRadius: 16,
          padding: 24,
          border: '1px solid #333',
          marginBottom: 32
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
            marginBottom: 16
          }}>
            {/* Search */}
            <div>
              <label style={{ color: '#aaa', fontSize: 12, display: 'block', marginBottom: 8 }}>
                Ara
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: '#2a2a2a',
                borderRadius: 8,
                border: '1px solid #333',
                padding: '10px 12px',
                gap: 8
              }}>
                <FiSearch color="#aaa" />
                <input
                  type="text"
                  placeholder="Token adı, sembol..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#fff',
                    outline: 'none',
                    flex: 1,
                    fontSize: 14
                  }}
                />
              </div>
            </div>

            {/* Sort By */}
            <div>
              <label style={{ color: '#aaa', fontSize: 12, display: 'block', marginBottom: 8 }}>
                Sırala
              </label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  width: '100%',
                  background: '#2a2a2a',
                  border: '1px solid #333',
                  borderRadius: 8,
                  padding: '10px 12px',
                  color: '#ffd700',
                  cursor: 'pointer',
                  fontSize: 14
                }}
              >
                <option value="createdAt">Yeniden Eskiye</option>
                <option value="marketCap">Market Cap</option>
                <option value="liquidity">Likidite</option>
                <option value="totalVolume">Hacim</option>
                <option value="views">Popülerlik</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label style={{ color: '#aaa', fontSize: 12, display: 'block', marginBottom: 8 }}>
                Sıra
              </label>
              <button
                onClick={() => setSortOrder(sortOrder === 'DESC' ? 'ASC' : 'DESC')}
                style={{
                  width: '100%',
                  background: '#2a2a2a',
                  border: '1px solid #333',
                  borderRadius: 8,
                  padding: '10px 12px',
                  color: '#ffd700',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600
                }}
              >
                {sortOrder === 'DESC' ? '↓ Azalan' : '↑ Artan'}
              </button>
            </div>

            {/* Market Cap Min */}
            <div>
              <label style={{ color: '#aaa', fontSize: 12, display: 'block', marginBottom: 8 }}>
                Min Market Cap
              </label>
              <input
                type="number"
                placeholder="0"
                value={filterMarketCapMin}
                onChange={(e) => {
                  setFilterMarketCapMin(parseInt(e.target.value) || 0);
                  setCurrentPage(1);
                }}
                style={{
                  width: '100%',
                  background: '#2a2a2a',
                  border: '1px solid #333',
                  borderRadius: 8,
                  padding: '10px 12px',
                  color: '#fff',
                  fontSize: 14
                }}
              />
            </div>

            {/* Market Cap Max */}
            <div>
              <label style={{ color: '#aaa', fontSize: 12, display: 'block', marginBottom: 8 }}>
                Max Market Cap
              </label>
              <input
                type="number"
                placeholder="Sınırsız"
                value={filterMarketCapMax}
                onChange={(e) => {
                  setFilterMarketCapMax(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  width: '100%',
                  background: '#2a2a2a',
                  border: '1px solid #333',
                  borderRadius: 8,
                  padding: '10px 12px',
                  color: '#fff',
                  fontSize: 14
                }}
              />
            </div>

            {/* Liquidity Min */}
            <div>
              <label style={{ color: '#aaa', fontSize: 12, display: 'block', marginBottom: 8 }}>
                Min Likidite
              </label>
              <input
                type="number"
                placeholder="0"
                value={filterLiquidityMin}
                onChange={(e) => {
                  setFilterLiquidityMin(parseInt(e.target.value) || 0);
                  setCurrentPage(1);
                }}
                style={{
                  width: '100%',
                  background: '#2a2a2a',
                  border: '1px solid #333',
                  borderRadius: 8,
                  padding: '10px 12px',
                  color: '#fff',
                  fontSize: 14
                }}
              />
            </div>

            {/* Volume Min */}
            <div>
              <label style={{ color: '#aaa', fontSize: 12, display: 'block', marginBottom: 8 }}>
                Min Hacim (24s)
              </label>
              <input
                type="number"
                placeholder="0"
                value={filterVolumeMin}
                onChange={(e) => {
                  setFilterVolumeMin(parseInt(e.target.value) || 0);
                  setCurrentPage(1);
                }}
                style={{
                  width: '100%',
                  background: '#2a2a2a',
                  border: '1px solid #333',
                  borderRadius: 8,
                  padding: '10px 12px',
                  color: '#fff',
                  fontSize: 14
                }}
              />
            </div>
          </div>

          {/* Reset Button */}
          <button
            onClick={handleResetFilters}
            style={{
              background: 'none',
              border: '1px solid #ffd700',
              borderRadius: 8,
              padding: '10px 16px',
              color: '#ffd700',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#ffd700';
              e.target.style.color = '#1a1a1a';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'none';
              e.target.style.color = '#ffd700';
            }}
          >
            Filtreleri Sıfırla
          </button>
        </div>

        {/* Tokens Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#ffd700' }}>
            <div style={{
              width: 50,
              height: 50,
              border: '3px solid #ffd700',
              borderTop: '3px solid transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }}></div>
            Tokenler yükleniyor...
          </div>
        ) : tokens.length > 0 ? (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: 20,
              marginBottom: 40
            }}>
              {tokens.map((token) => (
                <Link
                  key={token.address}
                  to={`/token/${token.address}`}
                  style={{
                    background: 'linear-gradient(135deg, #1a1a1a 0%, #222 100%)',
                    borderRadius: 16,
                    padding: 16,
                    textDecoration: 'none',
                    border: '1px solid #333',
                    transition: 'all 0.3s',
                    color: 'inherit'
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
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12, gap: 8 }}>
                    {token.logoURL && (
                      <img
                        src={token.logoURL}
                        alt={token.symbol}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          border: '1px solid #ffd700'
                        }}
                      />
                    )}
                    <div>
                      <div style={{ color: '#ffd700', fontWeight: 700, fontSize: 14 }}>
                        {token.name}
                      </div>
                      <div style={{ color: '#aaa', fontSize: 12 }}>{token.symbol}</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12, marginBottom: 12 }}>
                    <div>
                      <div style={{ color: '#aaa' }}>Market Cap</div>
                      <div style={{ color: '#ffd700', fontWeight: 600 }}>
                        {formatNumber(token.marketCap)}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#aaa' }}>Likidite</div>
                      <div style={{ color: '#ffd700', fontWeight: 600 }}>
                        {formatNumber(token.liquidity)}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#aaa' }}>Hacim</div>
                      <div style={{ color: '#ffd700', fontWeight: 600 }}>
                        {formatNumber(token.totalVolume)}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#aaa' }}>Değişim</div>
                      <div style={{
                        color: Number(token.priceChange24h || 0) >= 0 ? '#00ff88' : '#ff4d4d',
                        fontWeight: 600
                      }}>
                        {Number(token.priceChange24h || 0) >= 0 ? '+' : ''}{Number(token.priceChange24h || 0).toFixed(2)}%
                      </div>
                    </div>
                  </div>

                  <div style={{
                    fontSize: 11,
                    color: '#aaa',
                    paddingTop: 12,
                    borderTop: '1px solid #333'
                  }}>
                    {new Date(token.createdAt).toLocaleDateString()}
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination - Load More Button */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 16,
              marginBottom: 40,
              flexDirection: 'column'
            }}>
              {/* Page Info */}
              <div style={{
                color: '#aaa',
                fontSize: 13,
                textAlign: 'center'
              }}>
                Page {currentPage} of {totalPages}
              </div>

              {/* Navigation Buttons */}
              <div style={{
                display: 'flex',
                gap: 8,
                justifyContent: 'center',
                width: '100%',
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  style={{
                    background: currentPage === 1 ? '#333' : '#ffd700',
                    border: 'none',
                    borderRadius: 8,
                    padding: '10px 14px',
                    color: currentPage === 1 ? '#666' : '#1a1a1a',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 13
                  }}
                >
                  <FaArrowLeft /> Previous
                </button>

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  style={{
                    background: currentPage === totalPages ? '#333' : '#ffd700',
                    border: 'none',
                    borderRadius: 8,
                    padding: '10px 14px',
                    color: currentPage === totalPages ? '#666' : '#1a1a1a',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 13
                  }}
                >
                  Next <FaArrowRight />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#aaa',
            fontSize: 16
          }}>
            Hiç token bulunamadı
          </div>
        )}
      </div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}
      </style>
    </div>
  );
};

export default TokenListEnhanced;

