import React from 'react';
import { Link } from 'react-router-dom';
import { FaCheckCircle } from 'react-icons/fa';

const VerifiedUsername = ({ 
  username, 
  badges = [], 
  isVerified = false, 
  fontSize = 16, 
  style = {},
  walletAddress = null,
  isLink = true 
}) => {
  // Badge array'de "Verified" varsa veya isVerified true ise göster
  const hasVerified = isVerified || (badges && (Array.isArray(badges) ? badges.some(b => b.includes('Verified')) : badges.includes('Verified')));
  
  // Username display
  const usernameDisplay = (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, ...style }}>
      <span style={{ fontSize }}>{username}</span>
      {hasVerified && (
        <span
          title="Verified"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#F0B90B',
            fontSize: fontSize * 0.75
          }}
        >
          <FaCheckCircle />
        </span>
      )}
    </span>
  );

  // Link olarak dönüş yap
  if (isLink && walletAddress) {
    return (
      <Link 
        to={`/profile/${walletAddress}`}
        style={{ textDecoration: 'none', color: 'inherit' }}
      >
        {usernameDisplay}
      </Link>
    );
  }

  return usernameDisplay;
};

export default VerifiedUsername;

