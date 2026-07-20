import React, { useState } from 'react';

export default function AuthForms({
  isLoginMode,
  setIsLoginMode,
  isResetMode,
  setIsResetMode,
  setResetToken,
  isForgotMode,
  setIsForgotMode,
  loginUsername,
  setLoginUsername,
  loginPassword,
  setLoginPassword,
  regFullName,
  setRegFullName,
  regEmail,
  setRegEmail,
  regConfirmPassword,
  setRegConfirmPassword,
  forgotEmail,
  setForgotEmail,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  handleLogin,
  handleRegister,
  handleForgotPassword,
  handleResetPassword,
  loginWithGoogle,
  setIsPrivacyOpen,
  setIsTermsOpen,
}) {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="bg-white dark:bg-black p-10 shadow-2xl border border-neutral-200 dark:border-neutral-800 w-full max-w-sm rounded-none mac-animate overflow-hidden">
      <div className="text-center mb-10 flex flex-col items-center">
        <div className="flex flex-col items-center">
          <h1 className="text-3xl font-black text-black dark:text-white tracking-tighter uppercase leading-none">
            INNOCEAN
          </h1>
          <span className="text-[10px] font-bold text-neutral-500 tracking-[0.3em] uppercase mt-1">Tracker</span>
        </div>
        <p className="text-neutral-500 dark:text-neutral-400 font-medium mt-4 text-xs uppercase tracking-widest form-animate">
          {isResetMode
            ? 'Reset Password'
            : isForgotMode
            ? 'Account Recovery'
            : isLoginMode
            ? 'Workspace Login'
            : 'Request Access'}
        </p>
      </div>

      {isResetMode ? (
        <form key="reset" onSubmit={handleResetPassword} className="space-y-4 form-animate">
          <p className="text-xs font-bold text-center text-slate-500 dark:text-slate-400 uppercase mb-4">
            Enter your new password below.
          </p>
          <div>
            <label className="block text-[10px] font-bold text-black dark:text-white mb-1 uppercase tracking-wider">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full p-3 bg-transparent border border-neutral-300 dark:border-neutral-700 text-black dark:text-white rounded-none focus:border-black dark:focus:border-white outline-none text-sm pr-10"
                required
              />
              <button
                type="button"
                onMouseDown={() => setShowPassword(true)}
                onMouseUp={() => setShowPassword(false)}
                onMouseLeave={() => setShowPassword(false)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black dark:hover:text-white"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-black dark:text-white mb-1 uppercase tracking-wider">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={regConfirmPassword}
                onChange={(e) => setRegConfirmPassword(e.target.value)}
                className="w-full p-3 bg-transparent border border-neutral-300 dark:border-neutral-700 text-black dark:text-white rounded-none focus:border-black dark:focus:border-white outline-none text-sm pr-10"
                required
              />
              <button
                type="button"
                onMouseDown={() => setShowConfirmPassword(true)}
                onMouseUp={() => setShowConfirmPassword(false)}
                onMouseLeave={() => setShowConfirmPassword(false)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black dark:hover:text-white"
              >
                {showConfirmPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 font-bold py-3.5 mt-4 uppercase tracking-widest text-xs border border-black dark:border-white rounded-none"
          >
            Save New Password
          </button>
          <div className="text-center mt-6">
            <button
              type="button"
              onClick={() => {
                setIsResetMode(false);
                setResetToken(null);
              }}
              className="text-[10px] font-bold text-neutral-500 hover:text-black dark:hover:text-white uppercase tracking-wider transition-colors"
            >
              Back to Login
            </button>
          </div>
        </form>
      ) : isForgotMode ? (
        <form key="forgot" onSubmit={handleForgotPassword} className="space-y-4 form-animate">
          <p className="text-xs font-bold text-center text-slate-500 dark:text-slate-400 uppercase mb-4">
            Enter your email to receive a password reset link.
          </p>
          <div>
            <label className="block text-xs font-bold text-black dark:text-white mb-2 uppercase tracking-wider">
              Email Address
            </label>
            <input
              type="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              className="w-full p-3 bg-transparent border border-neutral-300 dark:border-neutral-700 text-black dark:text-white focus:border-black dark:focus:border-white focus:ring-0 outline-none transition-colors rounded-none"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 font-bold py-3.5 mt-4 uppercase tracking-widest text-xs border border-black dark:border-white rounded-none"
          >
            Send Reset Link
          </button>
          <div className="relative flex items-center py-4">
            <div className="flex-grow border-t border-neutral-200 dark:border-neutral-800"></div>
            <span className="mx-4 text-neutral-400 text-[10px] font-bold uppercase tracking-widest">Or</span>
            <div className="flex-grow border-t border-neutral-200 dark:border-neutral-800"></div>
          </div>
          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsForgotMode(false)}
              className="text-[10px] font-bold text-neutral-500 hover:text-black dark:hover:text-white uppercase tracking-wider transition-colors"
            >
              Back to Login
            </button>
          </div>
        </form>
      ) : isLoginMode ? (
        <form key="login" onSubmit={handleLogin} className="space-y-5 form-animate">
          <div>
            <label className="block text-xs font-bold text-black dark:text-white mb-2 uppercase tracking-wider">
              Username
            </label>
            <input
              type="text"
              value={loginUsername}
              onChange={(e) => setLoginUsername(e.target.value)}
              className="w-full p-3 bg-transparent border border-neutral-300 dark:border-neutral-700 text-black dark:text-white focus:border-black dark:focus:border-white outline-none rounded-none"
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-bold text-black dark:text-white uppercase tracking-wider">
                Password
              </label>
              <button
                type="button"
                onClick={() => setIsForgotMode(true)}
                className="text-[10px] font-bold text-neutral-500 hover:text-black dark:hover:text-white uppercase tracking-wider transition-colors"
              >
                Recover?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full p-3 bg-transparent border border-neutral-300 dark:border-neutral-700 text-black dark:text-white focus:border-black dark:focus:border-white outline-none pr-10 rounded-none"
              />
              <button
                type="button"
                onMouseDown={() => setShowPassword(true)}
                onMouseUp={() => setShowPassword(false)}
                onMouseLeave={() => setShowPassword(false)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black dark:hover:text-white"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 font-bold py-3.5 mt-4 uppercase tracking-widest text-xs border border-black dark:border-white rounded-none transition-colors"
          >
            Login
          </button>
          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-neutral-200 dark:border-neutral-800"></div>
            <span className="mx-4 text-neutral-400 text-[10px] font-bold uppercase tracking-widest">Or</span>
            <div className="flex-grow border-t border-neutral-200 dark:border-neutral-800"></div>
          </div>
          <button
            type="button"
            onClick={() => loginWithGoogle()}
            className="w-full bg-transparent text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 font-bold py-3.5 uppercase tracking-widest text-xs border border-neutral-300 dark:border-neutral-700 rounded-none flex items-center justify-center gap-3 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>{' '}
            Continue with Google
          </button>
        </form>
      ) : (
        <form key="register" onSubmit={handleRegister} className="space-y-4 form-animate">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-black dark:text-white mb-1 uppercase tracking-wider">
                Full Name
              </label>
              <input
                type="text"
                value={regFullName}
                onChange={(e) => setRegFullName(e.target.value)}
                className="w-full p-2 bg-transparent border border-neutral-300 dark:border-neutral-700 text-black dark:text-white rounded-none focus:border-black dark:focus:border-white outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-black dark:text-white mb-1 uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className="w-full p-2 bg-transparent border border-neutral-300 dark:border-neutral-700 text-black dark:text-white rounded-none focus:border-black dark:focus:border-white outline-none text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-black dark:text-white mb-1 uppercase tracking-wider">
              Username
            </label>
            <input
              type="text"
              value={loginUsername}
              onChange={(e) => setLoginUsername(e.target.value)}
              className="w-full p-2 bg-transparent border border-neutral-300 dark:border-neutral-700 text-black dark:text-white rounded-none focus:border-black dark:focus:border-white outline-none text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-black dark:text-white mb-1 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full p-2 bg-transparent border border-neutral-300 dark:border-neutral-700 text-black dark:text-white rounded-none focus:border-black dark:focus:border-white outline-none text-sm pr-8"
                />
                <button
                  type="button"
                  onMouseDown={() => setShowPassword(true)}
                  onMouseUp={() => setShowPassword(false)}
                  onMouseLeave={() => setShowPassword(false)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-black dark:hover:text-white"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-black dark:text-white mb-1 uppercase tracking-wider">
                Confirm
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  className="w-full p-2 bg-transparent border border-neutral-300 dark:border-neutral-700 text-black dark:text-white rounded-none focus:border-black dark:focus:border-white outline-none text-sm pr-8"
                />
                <button
                  type="button"
                  onMouseDown={() => setShowConfirmPassword(true)}
                  onMouseUp={() => setShowConfirmPassword(false)}
                  onMouseLeave={() => setShowConfirmPassword(false)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-black dark:hover:text-white"
                >
                  {showConfirmPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-start gap-1.5 mt-2">
            <span className="text-[10px]">🔒</span>
            <p className="text-[10px] font-medium text-emerald-600 dark:text-emerald-500 leading-relaxed">
              Passwords are mathematically one-way encrypted. System admins cannot view or retrieve your password.
            </p>
          </div>

          <div className="flex items-start gap-2 mt-4">
            <input
              type="checkbox"
              id="reg-agree"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 w-3.5 h-3.5 rounded border-neutral-300 text-indigo-600 dark:text-indigo-400 focus:ring-indigo-500 cursor-pointer shrink-0"
            />
            <label
              htmlFor="reg-agree"
              className="text-[10px] text-neutral-500 font-medium leading-relaxed cursor-pointer select-none"
            >
              I have read and agree to the{' '}
              <button
                type="button"
                onClick={() => setIsTermsOpen?.(true)}
                className="text-black dark:text-white font-bold hover:underline"
              >
                Terms of Service
              </button>{' '}
              and{' '}
              <button
                type="button"
                onClick={() => setIsPrivacyOpen?.(true)}
                className="text-black dark:text-white font-bold hover:underline"
              >
                Privacy Policy
              </button>
              .
            </label>
          </div>

          <button
            type="submit"
            disabled={!agreed}
            className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 font-bold py-3.5 mt-4 uppercase tracking-widest text-xs border border-black dark:border-white rounded-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Account
          </button>
          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-neutral-200 dark:border-neutral-800"></div>
            <span className="mx-4 text-neutral-400 text-[10px] font-bold uppercase tracking-widest">Or</span>
            <div className="flex-grow border-t border-neutral-200 dark:border-neutral-800"></div>
          </div>
          <button
            type="button"
            disabled={!agreed}
            onClick={() => loginWithGoogle()}
            className="w-full bg-transparent text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 font-bold py-3.5 uppercase tracking-widest text-xs border border-neutral-300 dark:border-neutral-700 rounded-none flex items-center justify-center gap-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>{' '}
            Continue with Google
          </button>
        </form>
      )}

      {!isResetMode &&
        !isForgotMode &&
        (isLoginMode ? (
          <p className="mt-8 text-center text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest form-animate">
            Don't have access?{' '}
            <button
              type="button"
              onClick={() => {
                setIsLoginMode(false);
                setLoginUsername('');
                setLoginPassword('');
              }}
              className="font-bold text-black dark:text-white hover:underline"
            >
              Register
            </button>
          </p>
        ) : (
          <p className="mt-8 text-center text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest form-animate">
            Already have access?{' '}
            <button
              type="button"
              onClick={() => {
                setIsLoginMode(true);
                setLoginUsername('');
                setLoginPassword('');
                setRegConfirmPassword('');
              }}
              className="font-bold text-black dark:text-white hover:underline"
            >
              Sign In
            </button>
          </p>
        ))}
    </div>
  );
}
