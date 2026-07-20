import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useGoogleLogin } from '@react-oauth/google';

export function useAuth({ showNotification, setIsLoading, language, onClearSession }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('token')) {
      localStorage.removeItem('innocean_auth');
      localStorage.removeItem('innocean_token');
      localStorage.removeItem('innocean_username');
      return false;
    }
    return localStorage.getItem('innocean_auth') === 'true';
  });

  const isAuthenticatedRef = useRef(isAuthenticated);
  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);

  const [currentUser, setCurrentUser] = useState(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('token')) return '';
    return localStorage.getItem('innocean_username') || '';
  });
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [showAuthForm, setShowAuthForm] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const path = window.location.pathname;
      if (
        params.get('token') ||
        params.get('verify') ||
        params.get('task') ||
        params.get('board') ||
        path.startsWith('/task/') ||
        path.startsWith('/project/')
      )
        return true;
    }
    return false;
  });

  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  const [resetToken, setResetToken] = useState(() => {
    if (typeof window !== 'undefined') return new URLSearchParams(window.location.search).get('token') || '';
    return '';
  });
  const [isResetMode, setIsResetMode] = useState(!!resetToken);
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [role, setRole] = useState('user');
  const [accountStatus, setAccountStatus] = useState('active');
  const [isVerifying, setIsVerifying] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    const sessionExpired = sessionStorage.getItem('innocean_session_expired');
    if (sessionExpired) {
      sessionStorage.removeItem('innocean_session_expired');
      showNotification('Session expired. Please login again.', 'error');
    }
  }, []);

  useEffect(() => {
    const handleAuthError = () => {
      if (window.isLoggingOut) return;
      
      // Clear storage
      localStorage.removeItem('innocean_auth');
      localStorage.removeItem('innocean_token');
      localStorage.removeItem('innocean_username');
      localStorage.removeItem('innocean_selected_board');
      
      // Set session expired indicator
      sessionStorage.setItem('innocean_session_expired', 'true');

      // Redirect immediately to clean all state and prevent blank/black screens
      window.location.href = '/';
    };
    window.addEventListener('auth_error', handleAuthError);
    return () => window.removeEventListener('auth_error', handleAuthError);
  }, [onClearSession, setIsLoading, showNotification]);

  const loginWithGoogle = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      setIsLoading(true);

      const wakeTimer = setTimeout(() => {
        showNotification(
          language === 'id'
            ? 'Server sedang dibangunkan (Cold Start). Harap tunggu hingga 50 detik...'
            : 'Waking up server (Cold Start). Please wait up to 50 seconds...',
          'info'
        );
      }, 5000);

      axios
        .post('/api/google-login', { token: tokenResponse.access_token }, { timeout: 75000 })
        .then((res) => {
          clearTimeout(wakeTimer);
          localStorage.setItem('innocean_auth', 'true');
          localStorage.setItem('innocean_token', res.data.token);
          localStorage.setItem('innocean_username', res.data.username);
          sessionStorage.setItem('innocean_just_logged_in', 'true');
          window.location.href = '/';
        })
        .catch((err) => {
          clearTimeout(wakeTimer);
          setIsLoading(false);
          showNotification(err.response?.data?.detail || 'Google Login failed', 'error');
        });
    },
    onError: () => showNotification('Google Login failed or cancelled', 'error'),
  });

  const handleLogout = (setIsLogoutConfirmOpen) => {
    if (setIsLogoutConfirmOpen) setIsLogoutConfirmOpen(false);
    setIsLoading(true);
    window.isLoggingOut = true;

    setShowAuthForm(false);
    setIsAuthenticated(false);
    setCurrentUser('');
    if (onClearSession) onClearSession();

    setTimeout(() => {
      localStorage.removeItem('innocean_auth');
      localStorage.removeItem('innocean_token');
      localStorage.removeItem('innocean_username');
      
      window.location.href = '/';
    }, 1000);
  };

  const handleLogin = (e) => {
    if (e) e.preventDefault();
    if (!loginUsername.trim() || !loginPassword.trim()) {
      showNotification('Username and Password are required!', 'error');
      return;
    }
    setIsLoading(true);

    const wakeTimer = setTimeout(() => {
      showNotification(
        language === 'id'
          ? 'Server sedang dibangunkan (Cold Start). Harap tunggu hingga 50 detik...'
          : 'Waking up server (Cold Start). Please wait up to 50 seconds...',
        'info'
      );
    }, 5000);

    axios
      .post('/api/login', { username: loginUsername.trim(), password: loginPassword }, { timeout: 75000 })
      .then((res) => {
        clearTimeout(wakeTimer);
        localStorage.setItem('innocean_auth', 'true');
        localStorage.setItem('innocean_token', res.data.token);
        localStorage.setItem('innocean_username', loginUsername.trim());

        sessionStorage.setItem('innocean_just_logged_in', 'true');
        window.location.href = '/';
      })
      .catch((err) => {
        clearTimeout(wakeTimer);
        setIsLoading(false);
        let errorMsg = 'Invalid username or password!';
        if (err.response?.data?.detail) {
          errorMsg = typeof err.response.data.detail === 'string' ? err.response.data.detail : errorMsg;
        } else if (err.response?.data) {
          errorMsg = typeof err.response.data === 'string' ? `Server Error: ${err.response.data}` : 'Server Error';
        } else if (err.message) {
          errorMsg = `Connection Error: ${err.message}. Is the backend running?`;
        }
        showNotification(errorMsg, 'error');
      });
  };

  const handleRegister = (e) => {
    if (e) e.preventDefault();
    if (!loginUsername.trim() || !loginPassword.trim() || !regFullName.trim() || !regEmail.trim()) {
      showNotification('All form fields are required!', 'error');
      return;
    }
    if (loginPassword !== regConfirmPassword) {
      showNotification('Passwords do not match!', 'error');
      return;
    }
    setIsLoading(true);

    const wakeTimer = setTimeout(() => {
      showNotification(
        language === 'id'
          ? 'Server sedang dibangunkan (Cold Start). Harap tunggu hingga 50 detik...'
          : 'Waking up server (Cold Start). Please wait up to 50 seconds...',
        'info'
      );
    }, 5000);

    axios
      .post(
        '/api/register',
        {
          full_name: regFullName.trim(),
          email: regEmail.trim(),
          username: loginUsername.trim(),
          password: loginPassword,
        },
        { timeout: 75000 }
      )
      .then(() => {
        clearTimeout(wakeTimer);
        setTimeout(() => {
          setIsLoading(false);
          setLoginPassword('');
          setRegConfirmPassword('');
          setIsLoginMode(true);
          showNotification(
            language === 'id'
              ? 'Akun berhasil dibuat! Silakan verifikasi email Anda untuk login.'
              : 'Account created successfully! Please verify your email to login.',
            'success'
          );
        }, 1000);
      })
      .catch((err) => {
        clearTimeout(wakeTimer);
        setIsLoading(false);
        showNotification(err.response?.data?.detail || 'Registration failed!', 'error');
      });
  };

  const handleForgotPassword = (e) => {
    if (e) e.preventDefault();
    if (!forgotEmail.trim()) {
      showNotification('Please enter your email!', 'error');
      return;
    }
    setIsLoading(true);

    axios
      .post('/api/forgot-password', { email: forgotEmail.trim() }, { timeout: 75000 })
      .then(() => {
        setIsLoading(false);
        showNotification('Password reset link sent! Check your email.', 'success');
        setIsForgotMode(false);
        setForgotEmail('');
      })
      .catch((err) => {
        setIsLoading(false);
        showNotification(err.response?.data?.detail || 'Failed to send reset link.', 'error');
      });
  };

  const handleResetPassword = (e) => {
    if (e) e.preventDefault();
    if (!loginPassword.trim() || !regConfirmPassword.trim()) {
      showNotification('All fields are required!', 'error');
      return;
    }
    if (loginPassword !== regConfirmPassword) {
      showNotification('Passwords do not match!', 'error');
      return;
    }
    setIsLoading(true);

    axios
      .post('/api/reset-password', { token: resetToken, new_password: loginPassword }, { timeout: 75000 })
      .then(() => {
        setIsLoading(false);
        setIsResetMode(false);
        setResetToken('');
        setLoginPassword('');
        setRegConfirmPassword('');
        showNotification('Password successfully reset! You can now login.', 'success');
        window.history.replaceState({}, document.title, '/');
      })
      .catch((err) => {
        setIsLoading(false);
        showNotification(err.response?.data?.detail || 'Failed to reset password. Link may be expired.', 'error');
      });
  };

  return {
    isAuthenticated, setIsAuthenticated,
    currentUser, setCurrentUser,
    isLoginMode, setIsLoginMode,
    showAuthForm, setShowAuthForm,
    loginUsername, setLoginUsername,
    loginPassword, setLoginPassword,
    regFullName, setRegFullName,
    regEmail, setRegEmail,
    regConfirmPassword, setRegConfirmPassword,
    resetToken, setResetToken,
    isResetMode, setIsResetMode,
    isForgotMode, setIsForgotMode,
    forgotEmail, setForgotEmail,
    role, setRole,
    accountStatus, setAccountStatus,
    isVerifying, setIsVerifying,
    authLoading, setAuthLoading,
    loginWithGoogle,
    handleLogout,
    handleLogin,
    handleRegister,
    handleForgotPassword,
    handleResetPassword,
  };
}
