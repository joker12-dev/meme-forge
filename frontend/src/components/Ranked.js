import React, { useEffect, useState } from 'react';
import { FaCrown, FaChartBar } from 'react-icons/fa';
import { fetchMultipleTokensData, mergeDexDataWithToken } from '../utils/dexscreener';
import './Ranked.css';

const Ranked = () => {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    const fetchRankedTokens = async () => {
      setLoading(true);
      try {
        // Backend'den tokenları çek
        const backendURL = process.env.REACT_APP_BACKEND_URL || '${getBackendURL()}';
        const response = await fetch(`${backendURL}/api/tokens`);
        const dbTokens = await response.json();
        if (!Array.isArray(dbTokens) || dbTokens.length === 0) {
          setTokens([]);
          setLoading(false);
          return;
        }
        // Adresleri al
        const addresses = dbTokens.map(t => t.address).filter(Boolean);
        // DexScreener'dan canlı verileri çek
        const dexData = await fetchMultipleTokensData(addresses);
        // Verileri birleştir
        const merged = dbTokens.map(token => {
          const dexInfo = dexData[token.address?.toLowerCase()];
          if (dexInfo) {
            return {
              ...mergeDexDataWithToken(dexInfo, token),
              liveOnDex: true
            };
          }
          return token;
        });
        setTokens(merged);
        setLastUpdated(new Date());
      } catch (err) {
        setTokens([]);
      }
      setLoading(false);
    };
    fetchRankedTokens();
    // Otomatik güncelleme (her 30 saniyede bir)
    const interval = setInterval(fetchRankedTokens, 30000);
    return () => clearInterval(interval);
  }, []);

  // Sıralama
  const topMarketCap = [...tokens]
    .filter(t => t.marketCap > 0)
    .sort((a, b) => b.marketCap - a.marketCap)
    .slice(0, 10);
  const topVolume = [...tokens]
    .filter(t => t.volume24h > 0)
    .sort((a, b) => b.volume24h - a.volume24h)
    .slice(0, 10);

  return (
    <div className="ranked-page">
      <div className="ranked-header">
        <h1 className="ranked-title">MEME FORGE RANKING</h1>
        <div className="ranked-update">Son güncelleme: {lastUpdated && lastUpdated.toLocaleString()} (UTC+3)</div>
      </div>
      <div className="ranked-bg-coins"></div>
      <div className="ranked-main">
        <div className="ranked-section">
          <h2 className="ranked-section-title"><FaCrown /> MarketCap Sıralaması</h2>
          <ul className="ranked-list">
            {topMarketCap.length === 0 && <div className="ranked-empty">Token bulunamadı.</div>}
            {topMarketCap.map((token, i) => (
              <a href={`/token/${token.address}`} style={{textDecoration: 'none', color: 'inherit'}}>
                <li key={token.address} className="ranked-item ranked-item-hover">
                  <div className="ranked-rank">{i < 3 ? <span className={`rank-badge rank-${i+1}`}>🏅{i+1}</span> : i+1}</div>
                  <img src={token.logoURI || token.logoURL || '/default-logo.png'} alt="logo" className="ranked-logo" />
                  <div className="ranked-info">
                    <div className="ranked-name">{token.name}</div>
                    <div className="ranked-symbol">{token.symbol}</div>
                    <div className="ranked-marketcap">${token.marketCap?.toLocaleString(undefined, { maximumFractionDigits: 2 })}M</div>
                    <div className="ranked-marketcap-label">Market Cap</div>
                  </div>
                </li>
              </a>
            ))}
          </ul>
        </div>
        <div className="ranked-section">
          <h2 className="ranked-section-title"><FaChartBar /> 24 Saatlik Hacim</h2>
          <ul className="ranked-list">
            {topVolume.length === 0 && <div className="ranked-empty">Token bulunamadı.</div>}
            {topVolume.map((token, i) => (
              <a href={`/token/${token.address}`} style={{textDecoration: 'none', color: 'inherit'}}>
                <li key={token.address} className="ranked-item ranked-item-hover">
                  <div className="ranked-rank">{i < 3 ? <span className={`rank-badge rank-${i+1}`}>🏅{i+1}</span> : i+1}</div>
                  <img src={token.logoURI || token.logoURL || '/default-logo.png'} alt="logo" className="ranked-logo" />
                  <div className="ranked-info">
                    <div className="ranked-name">{token.name}</div>
                    <div className="ranked-symbol">{token.symbol}</div>
                    <div className="ranked-volume">${token.volume24h?.toLocaleString(undefined, { maximumFractionDigits: 2 })}M</div>
                    <div className="ranked-volume-label">24 Saatlik Hacim</div>
                  </div>
                </li>
              </a>
            ))}
          </ul>
        </div>
      </div>
      {loading && <div className="ranked-loading">Yükleniyor...</div>}
    </div>
  );
};

export default Ranked;

