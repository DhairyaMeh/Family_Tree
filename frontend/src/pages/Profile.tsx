import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export default function Profile() {
  const navigate = useNavigate();
  const { user, token, logout, updateUser } = useAuth();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Email verification state
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verifyError, setVerifyError] = useState('');
  const [verifySuccess, setVerifySuccess] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);

  // Countdown timer for resend button
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSendVerificationOtp = async () => {
    setVerifyError('');
    setVerifySuccess('');
    setVerifyLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ email: user?.email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      setOtpSent(true);
      setResendCooldown(60); // 60 second cooldown
      setVerifySuccess('OTP sent to your email!');
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyError('');
    setVerifySuccess('');
    setVerifyLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ email: user?.email, otp: otpValue }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid OTP');
      }

      // Update user state with verified email
      if (user) {
        updateUser({ ...user, isEmailVerified: true });
      }
      
      setVerifySuccess('Email verified successfully!');
      setIsVerifyingEmail(false);
      setOtpValue('');
      setOtpSent(false);
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setVerifyLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update password');
      }

      setSuccess('Password updated successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setIsChangingPassword(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'admin': return 'linear-gradient(135deg, #ef4444, #dc2626)';
      case 'gold': return 'linear-gradient(135deg, #f59e0b, #d97706)';
      case 'silver': return 'linear-gradient(135deg, #94a3b8, #64748b)';
      default: return 'linear-gradient(135deg, #3b82f6, #2563eb)';
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="profile-page">
      <nav className="profile-nav">
        <Link to="/" className="nav-brand">
          <span>🌳</span> Family Tree
        </Link>
        <Link to="/tree" className="btn-secondary">Back to Trees</Link>
      </nav>

      <div className="profile-content">
        <motion.div 
          className="profile-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="profile-header">
            <div className="profile-avatar">
              {user.profileImage ? (
                <img src={user.profileImage} alt={user.username} />
              ) : (
                <span>{user.username.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <h1>{user.username}</h1>
            <p>{user.email}</p>
            <span className="tier-badge" style={{ background: getTierColor(user.tier) }}>
              {user.tier.toUpperCase()}
            </span>
          </div>

          {/* Account Info */}
          <div className="profile-section">
            <h3>Account Information</h3>
            <div className="info-row">
              <span className="info-label">Username</span>
              <span className="info-value">{user.username}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Email</span>
              <span className="info-value">{user.email}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Email Verified</span>
              <span className="info-value">
                {user.isEmailVerified ? (
                  '✅ Verified'
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    ❌ Not Verified
                    {!isVerifyingEmail && (
                      <button
                        className="btn-verify-small"
                        onClick={() => setIsVerifyingEmail(true)}
                      >
                        Verify Now
                      </button>
                    )}
                  </span>
                )}
              </span>
            </div>
            
            {/* Email Verification Section */}
            {!user.isEmailVerified && isVerifyingEmail && (
              <div className="verify-section">
                {verifyError && <div className="form-error">{verifyError}</div>}
                {verifySuccess && <div className="form-success">{verifySuccess}</div>}
                
                {!otpSent ? (
                  <div className="verify-step">
                    <p>Click below to send a verification code to <strong>{user.email}</strong></p>
                    <button
                      className="btn-primary"
                      onClick={handleSendVerificationOtp}
                      disabled={verifyLoading}
                    >
                      {verifyLoading ? 'Sending...' : 'Send OTP'}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="verify-form">
                    <p>Enter the 6-digit code sent to <strong>{user.email}</strong></p>
                    <div className="otp-input-group">
                      <input
                        type="text"
                        value={otpValue}
                        onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="Enter 6-digit OTP"
                        maxLength={6}
                        className="otp-input"
                      />
                      <button
                        type="submit"
                        className="btn-primary"
                        disabled={verifyLoading || otpValue.length !== 6}
                      >
                        {verifyLoading ? 'Verifying...' : 'Verify'}
                      </button>
                    </div>
                    <div className="resend-section">
                      {resendCooldown > 0 ? (
                        <span className="resend-timer">Resend OTP in {resendCooldown}s</span>
                      ) : (
                        <button
                          type="button"
                          className="btn-link"
                          onClick={handleSendVerificationOtp}
                          disabled={verifyLoading}
                        >
                          Resend OTP
                        </button>
                      )}
                    </div>
                  </form>
                )}
                
                <button
                  className="btn-outline btn-small"
                  onClick={() => {
                    setIsVerifyingEmail(false);
                    setOtpSent(false);
                    setOtpValue('');
                    setVerifyError('');
                    setVerifySuccess('');
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
            <div className="info-row">
              <span className="info-label">Subscription</span>
              <span className="info-value" style={{ textTransform: 'capitalize' }}>{user.tier}</span>
            </div>
          </div>

          {/* Change Password */}
          <div className="profile-section">
            <h3>Security</h3>
            {!isChangingPassword ? (
              <button 
                className="btn-outline"
                onClick={() => setIsChangingPassword(true)}
              >
                Change Password
              </button>
            ) : (
              <form onSubmit={handlePasswordChange} className="password-form">
                {error && <div className="form-error">{error}</div>}
                {success && <div className="form-success">{success}</div>}
                
                <div className="form-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>
                
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    required
                  />
                </div>
                
                <div className="form-actions">
                  <button type="submit" className="btn-primary" disabled={isLoading}>
                    {isLoading ? 'Updating...' : 'Update Password'}
                  </button>
                  <button 
                    type="button" 
                    className="btn-outline"
                    onClick={() => {
                      setIsChangingPassword(false);
                      setError('');
                      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Logout */}
          <div className="profile-section logout-section">
            <button onClick={handleLogout} className="btn-logout">
              Logout
            </button>
          </div>
        </motion.div>
      </div>

      <style>{`
        .profile-page {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
          color: #f1f5f9;
          overflow-y: auto;
          overflow-x: hidden;
        }

        .profile-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 40px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .nav-brand {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 20px;
          font-weight: 600;
          text-decoration: none;
          color: #f1f5f9;
        }

        .btn-secondary {
          padding: 10px 20px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: #f1f5f9;
          text-decoration: none;
          font-size: 14px;
          transition: all 0.2s;
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        .profile-content {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px 40px 60px;
        }

        .profile-card {
          background: #1e293b;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          overflow: hidden;
        }

        .profile-header {
          text-align: center;
          padding: 40px 20px;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1));
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .profile-avatar {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          font-size: 40px;
          font-weight: 600;
          color: white;
          overflow: hidden;
        }

        .profile-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .profile-header h1 {
          margin: 0 0 8px;
          font-size: 28px;
        }

        .profile-header p {
          margin: 0 0 16px;
          color: #94a3b8;
        }

        .tier-badge {
          display: inline-block;
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          color: white;
        }

        .profile-section {
          padding: 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .profile-section:last-child {
          border-bottom: none;
        }

        .profile-section h3 {
          margin: 0 0 16px;
          font-size: 16px;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .info-row:last-child {
          border-bottom: none;
        }

        .info-label {
          color: #94a3b8;
        }

        .info-value {
          color: #f1f5f9;
          font-weight: 500;
        }

        .btn-outline {
          padding: 10px 20px;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: #f1f5f9;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-outline:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .password-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          color: #94a3b8;
          font-size: 14px;
        }

        .form-group input {
          padding: 12px;
          background: #0f172a;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #f1f5f9;
          font-size: 14px;
        }

        .form-group input:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .form-error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #f87171;
          padding: 12px;
          border-radius: 8px;
          font-size: 14px;
        }

        .form-success {
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.3);
          color: #4ade80;
          padding: 12px;
          border-radius: 8px;
          font-size: 14px;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          margin-top: 8px;
        }

        .btn-primary {
          padding: 12px 24px;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border: none;
          border-radius: 8px;
          color: white;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
        }

        .btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .logout-section {
          text-align: center;
        }

        .btn-logout {
          padding: 12px 32px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 8px;
          color: #f87171;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-logout:hover {
          background: rgba(239, 68, 68, 0.2);
        }

        .btn-verify-small {
          padding: 4px 12px;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border: none;
          border-radius: 4px;
          color: white;
          font-size: 12px;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .btn-verify-small:hover {
          transform: translateY(-1px);
        }

        .verify-section {
          margin-top: 16px;
          padding: 16px;
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 8px;
        }

        .verify-step {
          text-align: center;
        }

        .verify-step p {
          margin: 0 0 16px;
          color: #94a3b8;
        }

        .verify-form p {
          margin: 0 0 16px;
          color: #94a3b8;
          text-align: center;
        }

        .otp-input-group {
          display: flex;
          gap: 12px;
          justify-content: center;
          margin-bottom: 16px;
        }

        .otp-input {
          width: 140px;
          padding: 12px 16px;
          background: #0f172a;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: #f1f5f9;
          font-size: 18px;
          text-align: center;
          letter-spacing: 8px;
        }

        .otp-input:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .resend-section {
          text-align: center;
          margin-bottom: 16px;
        }

        .resend-timer {
          color: #64748b;
          font-size: 14px;
        }

        .btn-link {
          background: none;
          border: none;
          color: #3b82f6;
          font-size: 14px;
          cursor: pointer;
          text-decoration: underline;
        }

        .btn-link:hover {
          color: #60a5fa;
        }

        .btn-link:disabled {
          color: #64748b;
          cursor: not-allowed;
        }

        .btn-small {
          padding: 8px 16px;
          font-size: 12px;
        }
      `}</style>
    </div>
  );
}

