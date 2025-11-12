import React, { useEffect } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes, FaTimesCircle } from 'react-icons/fa';
import './Notification.css';

const Notification = ({ 
  type = 'success', // success, error, info, warning
  message, 
  onClose, 
  duration = 4000,
  icon = null 
}) => {
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getIcon = () => {
    if (icon) return icon;
    
    switch (type) {
      case 'success':
        return <FaCheckCircle className="notification-icon success-icon" />;
      case 'error':
        return <FaTimesCircle className="notification-icon error-icon" />;
      case 'warning':
        return <FaExclamationCircle className="notification-icon warning-icon" />;
      case 'info':
        return <FaInfoCircle className="notification-icon info-icon" />;
      default:
        return <FaInfoCircle className="notification-icon info-icon" />;
    }
  };

  return (
    <div className={`notification notification-${type} notification-enter`}>
      <div className="notification-content">
        <div className="notification-icon-wrapper">
          {getIcon()}
        </div>
        <div className="notification-text">
          <p className="notification-message">{message}</p>
        </div>
        <button 
          className="notification-close" 
          onClick={onClose}
          aria-label="Close notification"
        >
          <FaTimes />
        </button>
      </div>
      <div className="notification-progress-bar"></div>
    </div>
  );
};

export default Notification;
