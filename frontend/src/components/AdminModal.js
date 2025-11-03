import React, { useState, useEffect } from 'react';
import './AdminModal.css';

const AdminModal = ({ show, onClose, onSave, editingAdmin }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'admin',
    status: 'active',
    permissions: {
      manage_admins: false,
      manage_tokens: false,
      manage_users: false,
      manage_trades: false,
      manage_contact: false,
      view_analytics: false,
      manage_settings: false
    }
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingAdmin) {
      setFormData({
        username: editingAdmin.username,
        email: editingAdmin.email,
        password: '',
        role: editingAdmin.role,
        status: editingAdmin.status,
        permissions: editingAdmin.permissions || {
          manage_admins: false,
          manage_tokens: false,
          manage_users: false,
          manage_trades: false,
          manage_contact: false,
          view_analytics: false,
          manage_settings: false
        }
      });
    } else {
      setFormData({
        username: '',
        email: '',
        password: '',
        role: 'admin',
        status: 'active',
        permissions: {
          manage_admins: false,
          manage_tokens: false,
          manage_users: false,
          manage_trades: false,
          manage_contact: false,
          view_analytics: false,
          manage_settings: false
        }
      });
    }
    setErrors({});
  }, [editingAdmin, show]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handlePermissionChange = (permission) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: !prev.permissions[permission]
      }
    }));
  };

  const handleSelectAll = () => {
    const allTrue = Object.values(formData.permissions).every(v => v);
    const newPermissions = {};
    Object.keys(formData.permissions).forEach(key => {
      newPermissions[key] = !allTrue;
    });
    setFormData(prev => ({ ...prev, permissions: newPermissions }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Kullanıcı adı gerekli';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Kullanıcı adı en az 3 karakter olmalı';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'E-posta gerekli';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Geçerli bir e-posta adresi girin';
    }

    if (!editingAdmin && !formData.password) {
      newErrors.password = 'Şifre gerekli';
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Şifre en az 6 karakter olmalı';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const submitData = { ...formData };
      if (editingAdmin && !submitData.password) {
        delete submitData.password;
      }

      await onSave(submitData);
      onClose();
    } catch (error) {
      console.error('Submit error:', error);
      setErrors({ submit: error.message || 'Bir hata oluştu' });
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <h2>{editingAdmin ? 'Admin Düzenle' : 'Yeni Admin Ekle'}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="admin-modal-form">
          <div className="form-group">
            <label>Kullanıcı Adı *</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="admin_user"
              disabled={!!editingAdmin}
              className={errors.username ? 'error' : ''}
            />
            {errors.username && <span className="error-text">{errors.username}</span>}
          </div>

          <div className="form-group">
            <label>E-posta *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="admin@example.com"
              className={errors.email ? 'error' : ''}
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label>Şifre {!editingAdmin && '*'}</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={editingAdmin ? 'Değiştirmek için girin' : 'Minimum 6 karakter'}
              className={errors.password ? 'error' : ''}
            />
            {errors.password && <span className="error-text">{errors.password}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Rol *</label>
              <select name="role" value={formData.role} onChange={handleChange}>
                <option value="admin">Admin</option>
                <option value="moderator">Moderator</option>
              </select>
            </div>

            <div className="form-group">
              <label>Durum *</label>
              <select name="status" value={formData.status} onChange={handleChange}>
                <option value="active">Aktif</option>
                <option value="inactive">İnaktif</option>
                <option value="suspended">Askıya Alındı</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <div className="permissions-header">
              <label>Yetkiler</label>
              <button type="button" className="select-all-btn" onClick={handleSelectAll}>
                {Object.values(formData.permissions).every(v => v) ? 'Tümünü Kaldır' : 'Tümünü Seç'}
              </button>
            </div>
            <div className="permissions-grid">
              <label className="permission-item">
                <input
                  type="checkbox"
                  checked={formData.permissions.manage_admins}
                  onChange={() => handlePermissionChange('manage_admins')}
                />
                <span>Admin Yönetimi</span>
              </label>
              <label className="permission-item">
                <input
                  type="checkbox"
                  checked={formData.permissions.manage_tokens}
                  onChange={() => handlePermissionChange('manage_tokens')}
                />
                <span>Token Yönetimi</span>
              </label>
              <label className="permission-item">
                <input
                  type="checkbox"
                  checked={formData.permissions.manage_users}
                  onChange={() => handlePermissionChange('manage_users')}
                />
                <span>Kullanıcı Yönetimi</span>
              </label>
              <label className="permission-item">
                <input
                  type="checkbox"
                  checked={formData.permissions.manage_trades}
                  onChange={() => handlePermissionChange('manage_trades')}
                />
                <span>İşlem Yönetimi</span>
              </label>
              <label className="permission-item">
                <input
                  type="checkbox"
                  checked={formData.permissions.manage_contact}
                  onChange={() => handlePermissionChange('manage_contact')}
                />
                <span>Mesaj Yönetimi</span>
              </label>
              <label className="permission-item">
                <input
                  type="checkbox"
                  checked={formData.permissions.view_analytics}
                  onChange={() => handlePermissionChange('view_analytics')}
                />
                <span>Analitik Görüntüleme</span>
              </label>
              <label className="permission-item">
                <input
                  type="checkbox"
                  checked={formData.permissions.manage_settings}
                  onChange={() => handlePermissionChange('manage_settings')}
                />
                <span>Ayar Yönetimi</span>
              </label>
            </div>
          </div>

          {errors.submit && (
            <div className="error-message">{errors.submit}</div>
          )}

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-btn" disabled={loading}>
              İptal
            </button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Kaydediliyor...' : (editingAdmin ? 'Güncelle' : 'Ekle')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminModal;

