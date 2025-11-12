import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { getBackendURL } from '../utils/api';
import '../styles/MyTrades.css';

const MyTrades = () => {
  const { account: walletAccount } = useWallet();
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [walletAddress, setWalletAddress] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTrades, setTotalTrades] = useState(0);
  
  // Filtreler
  const [filterType, setFilterType] = useState('ALL');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('DESC');
  
  const navigate = useNavigate();

  useEffect(() => {
    if (!walletAccount) {
      navigate('/');
      return;
    }
    setWalletAddress(walletAccount);
    setPage(1); // Reset to page 1 when filters change
    fetchTrades(walletAccount, 1);
  }, [navigate, walletAccount, filterType, sortBy, sortOrder]);

  useEffect(() => {
    if (walletAddress) {
      fetchTrades(walletAddress, page);
    }
  }, [page]);

  const fetchTrades = async (address, pageNum) => {
    try {
      setLoading(true);
      const response = await fetch(
        `${getBackendURL()}/api/trades/user/${address}?page=${pageNum}&limit=20`
      );
      const data = await response.json();
      
      if (data.success) {
        let filteredTrades = data.trades || [];
        
        // Apply type filter
        if (filterType !== 'ALL') {
          filteredTrades = filteredTrades.filter(t => t.type === filterType);
        }
        
        // Apply sorting
        filteredTrades.sort((a, b) => {
          let aVal, bVal;
          
          switch(sortBy) {
            case 'value':
              aVal = Number(a.value);
              bVal = Number(b.value);
              break;
            case 'amount':
              aVal = Number(a.amount);
              bVal = Number(b.amount);
              break;
            case 'price':
              aVal = Number(a.price);
              bVal = Number(b.price);
              break;
            case 'date':
            default:
              aVal = new Date(a.timestamp).getTime();
              bVal = new Date(b.timestamp).getTime();
          }
          
          return sortOrder === 'DESC' ? bVal - aVal : aVal - bVal;
        });
        
        setTrades(filteredTrades);
        setTotalTrades(data.pagination?.total || 0);
        setTotalPages(data.pagination?.pages || 1);
      } else {
        console.error('Error:', data.error);
        setTrades([]);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setTrades([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTokenClick = (tokenAddress) => {
    navigate(`/token/${tokenAddress}`);
  };

  const getTokenLogo = (trade) => {
    // Use logoURL from database if available
    if (trade.logoURL) {
      return trade.logoURL;
    }
    return null; // Will show badge instead
  };

  // Show text badge if logo not available
  const handleLogoError = (e, tokenName) => {
    try {
      e.target.style.display = 'none';
      
      // Create and show text badge
      const badge = document.createElement('div');
      badge.className = 'logo-badge';
      badge.textContent = (tokenName || '?')[0].toUpperCase();
      e.target.parentNode.insertBefore(badge, e.target);
    } catch (err) {
      console.error('Logo error handler failed:', err);
    }
  };

  const formatNumber = (num) => {
    const n = Number(num);
    if (n >= 1000000) return (n / 1000000).toFixed(2) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(2) + 'K';
    return n.toFixed(2);
  };

  const getStatsData = () => {
    if (trades.length === 0) return { buys: 0, sells: 0, totalValue: 0 };
    
    const buys = trades.filter(t => t.type === 'BUY').length;
    const sells = trades.filter(t => t.type === 'SELL').length;
    const totalValue = trades.reduce((sum, t) => sum + Number(t.value), 0);
    
    return { buys, sells, totalValue };
  };

  const stats = getStatsData();

  return (
    <div className="my-trades-container">
      {/* Header */}
      <div className="my-trades-header">
        <div className="header-content">
          <h1>📊 My Trading History</h1>
          <p>Track all your trades and analyze your trading performance</p>
        </div>
      </div>

      {/* Stats Cards */}
      {trades.length > 0 && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Trades</div>
            <div className="stat-value">{totalTrades}</div>
          </div>
          <div className="stat-card buy">
            <div className="stat-label">Buys</div>
            <div className="stat-value">{stats.buys}</div>
          </div>
          <div className="stat-card sell">
            <div className="stat-label">Sells</div>
            <div className="stat-value">{stats.sells}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Value</div>
            <div className="stat-value">{formatNumber(stats.totalValue)} BNB</div>
          </div>
        </div>
      )}

      {/* Filters and Sorting */}
      {trades.length > 0 && (
        <div className="controls-section">
          <div className="filter-group">
            <label>Type:</label>
            <div className="filter-buttons">
              {['ALL', 'BUY', 'SELL'].map(type => (
                <button
                  key={type}
                  className={`filter-btn ${filterType === type ? 'active' : ''}`}
                  onClick={() => setFilterType(type)}
                >
                  {type === 'ALL' ? 'All Trades' : `${type}s`}
                </button>
              ))}
            </div>
          </div>

          <div className="sort-group">
            <label>Sort by:</label>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="date">Date</option>
              <option value="value">Value</option>
              <option value="amount">Amount</option>
              <option value="price">Price</option>
            </select>

            <button
              className="sort-order-btn"
              onClick={() => setSortOrder(sortOrder === 'DESC' ? 'ASC' : 'DESC')}
              title="Toggle sort order"
            >
              {sortOrder === 'DESC' ? '↓' : '↑'}
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading trades...</p>
        </div>
      ) : trades.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <p>No trades yet. Start trading tokens!</p>
          <button 
            className="cta-button"
            onClick={() => navigate('/tokens')}
          >
            Browse Tokens
          </button>
        </div>
      ) : (
        <>
          <div className="trades-container">
            {/* Desktop Table */}
            <div className="trades-table desktop-only">
              <div className="table-header">
                <div className="col-type">Type</div>
                <div className="col-token">Token</div>
                <div className="col-amount">Amount</div>
                <div className="col-value">Value</div>
                <div className="col-price">Price</div>
                <div className="col-time">Time</div>
              </div>

              {trades.map((trade, index) => {
                const t = trade.dataValues || trade;
                const date = new Date(t.timestamp);
                const timeStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div 
                    key={index} 
                    className="table-row"
                    onClick={() => handleTokenClick(t.tokenAddress)}
                  >
                    <div className={`col-type type-${t.type?.toLowerCase()}`}>
                      <span className="badge">{t.type === 'BUY' ? '📈 BUY' : '📉 SELL'}</span>
                    </div>
                    <div className="col-token">
                      <div className="token-info">
                        {getTokenLogo(t) ? (
                          <img 
                            src={getTokenLogo(t)} 
                            alt={t.tokenSymbol}
                            className="token-logo"
                            onError={(e) => handleLogoError(e, t.tokenName)}
                          />
                        ) : (
                          <div className="logo-badge">{(t.tokenName || '?')[0].toUpperCase()}</div>
                        )}
                        <div className="token-text">
                          <span className="token-symbol">{t.tokenSymbol}</span>
                          <span className="token-name">{t.tokenName?.substring(0, 20)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="col-amount">{formatNumber(t.amount)}</div>
                    <div className="col-value">{Number(t.value).toFixed(4)} BNB</div>
                    <div className="col-price">${Number(t.price).toFixed(8)}</div>
                    <div className="col-time">{timeStr}</div>
                  </div>
                );
              })}
            </div>

            {/* Mobile Cards */}
            <div className="trades-mobile mobile-only">
              {trades.map((trade, index) => {
                const t = trade.dataValues || trade;
                const date = new Date(t.timestamp);
                const timeStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div 
                    key={index} 
                    className="trade-card"
                    onClick={() => handleTokenClick(t.tokenAddress)}
                  >
                    <div className="trade-card-header">
                      <div className="token-info">
                        {getTokenLogo(t) ? (
                          <img 
                            src={getTokenLogo(t)} 
                            alt={t.tokenSymbol}
                            className="token-logo"
                            onError={(e) => handleLogoError(e, t.tokenName)}
                          />
                        ) : (
                          <div className="logo-badge">{(t.tokenName || '?')[0].toUpperCase()}</div>
                        )}
                        <div className="token-text">
                          <span className="token-symbol">{t.tokenSymbol}</span>
                          <span className="token-name">{t.tokenName?.substring(0, 20)}</span>
                        </div>
                      </div>
                      <span className={`type-badge type-${t.type?.toLowerCase()}`}>
                        {t.type === 'BUY' ? '📈' : '📉'}
                      </span>
                    </div>
                    <div className="trade-card-body">
                      <div className="trade-row">
                        <span className="label">Amount:</span>
                        <span className="value">{formatNumber(t.amount)}</span>
                      </div>
                      <div className="trade-row">
                        <span className="label">Value:</span>
                        <span className="value">{Number(t.value).toFixed(4)} BNB</span>
                      </div>
                      <div className="trade-row">
                        <span className="label">Price:</span>
                        <span className="value">${Number(t.price).toFixed(8)}</span>
                      </div>
                      <div className="trade-row">
                        <span className="label">Time:</span>
                        <span className="value">{timeStr}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination-section">
              <button 
                className="pagination-btn prev-btn"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                ← Previous
              </button>

              <div className="page-numbers">
                {[...Array(totalPages)].map((_, i) => {
                  const pageNum = i + 1;
                  const isNear = Math.abs(pageNum - page) <= 1;
                  const isEnd = pageNum === 1 || pageNum === totalPages;
                  
                  if (isNear || isEnd) {
                    return (
                      <button
                        key={pageNum}
                        className={`page-num ${page === pageNum ? 'active' : ''}`}
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  } else if (Math.abs(pageNum - page) === 2) {
                    return <span key={pageNum} className="page-ellipsis">...</span>;
                  }
                  return null;
                })}
              </div>

              <button 
                className="pagination-btn next-btn"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next →
              </button>

              <span className="page-info">Page {page} of {totalPages}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyTrades;
