import { useState } from 'react';
import InnoceanLogo from './components/InnoceanLogo';
import { Icon } from './components/icons/Icon';

const inputClass =
  'w-full px-3.5 py-2.5 bg-white border border-[#DFE1E6] text-[#172B4D] rounded-lg text-sm placeholder:text-[#8993A4] outline-none transition-[border-color,box-shadow] focus:border-[#0C66E4] focus:ring-2 focus:ring-[#0C66E4]/20';

const labelClass = 'block text-[13px] font-semibold text-[#172B4D] mb-1.5';

const primaryBtnClass =
  'w-full cursor-pointer bg-[#0C66E4] hover:bg-[#0055CC] active:bg-[#09326C] text-white font-semibold py-2.5 mt-1 rounded-lg text-sm transition-colors disabled:bg-[#091E420F] disabled:text-[#091E424F] disabled:cursor-not-allowed shadow-sm';

const googleBtnClass =
  'w-full cursor-pointer bg-white hover:bg-[#F4F5F7] text-[#172B4D] font-semibold py-2.5 rounded-lg text-sm border border-[#DFE1E6] flex items-center justify-center gap-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

const linkClass =
  'cursor-pointer font-semibold text-[#0C66E4] hover:text-[#0055CC] hover:underline transition-colors';

function OrDivider() {
  return (
    <div className='relative flex items-center py-1'>
      <div className='flex-grow border-t border-[#DFE1E6]' />
      <span className='mx-3 text-[#626F86] text-xs font-medium'>or</span>
      <div className='flex-grow border-t border-[#DFE1E6]' />
    </div>
  );
}

function PasswordToggle({ visible, setVisible }) {
  return (
    <button
      type='button'
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => setVisible((prev) => !prev)}
      className='absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-[#8993A4] hover:text-[#172B4D] transition-colors'
      aria-label={visible ? 'Hide password' : 'Show password'}
      aria-pressed={visible}>
      {visible ? (
        <Icon name='eye-off' className='w-4 h-4' />
      ) : (
        <Icon name='eye' className='w-4 h-4' />
      )}
    </button>
  );
}

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

  const title = isResetMode
    ? 'Choose a new password'
    : isForgotMode
      ? 'Forgot your password?'
      : isLoginMode
        ? 'Login to your account'
        : 'Create your account';

  const subtitle = isResetMode
    ? 'Enter a new password for your workspace account.'
    : isForgotMode
      ? "Enter your email and we'll send you a reset link."
      : isLoginMode
        ? null
        : 'Seconds to sign up — get access to your workspace.';

  return (
    <div className='bg-white w-full max-w-md rounded-xl shadow-[0_8px_24px_rgba(9,30,66,0.12)] border border-[#DFE1E6] overflow-hidden form-animate'>
      <div className='px-8 pt-8 pb-7'>
        <div className='text-center mb-7 flex flex-col items-center'>
          <InnoceanLogo size='lg' className='items-center' forceBlack />
          <h1 className='text-[#172B4D] font-bold text-[22px] leading-tight mt-5 tracking-tight'>
            {title}
          </h1>
          {subtitle && (
            <p className='text-[#626F86] text-sm mt-2 leading-relaxed max-w-2xs'>
              {subtitle}
            </p>
          )}
        </div>

        {isResetMode ? (
          <form
            key='reset'
            onSubmit={handleResetPassword}
            className='space-y-4'>
            <div>
              <label className={labelClass}>New password</label>
              <div className='relative'>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder='Enter new password'
                  className={`${inputClass} pr-10`}
                  required
                />
                <PasswordToggle
                  visible={showPassword}
                  setVisible={setShowPassword}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Confirm password</label>
              <div className='relative'>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder='Confirm new password'
                  className={`${inputClass} pr-10`}
                  required
                />
                <PasswordToggle
                  visible={showConfirmPassword}
                  setVisible={setShowConfirmPassword}
                />
              </div>
            </div>
            <button type='submit' className={primaryBtnClass}>
              Save new password
            </button>
            <div className='text-center pt-1'>
              <button
                type='button'
                onClick={() => {
                  setIsResetMode(false);
                  setResetToken(null);
                }}
                className={`text-sm ${linkClass}`}>
                Back to login
              </button>
            </div>
          </form>
        ) : isForgotMode ? (
          <form
            key='forgot'
            onSubmit={handleForgotPassword}
            className='space-y-4'>
            <div>
              <label className={labelClass}>
                Email <span className='text-[#AE2A19]'>*</span>
              </label>
              <input
                type='email'
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder='Enter your email'
                className={inputClass}
                required
              />
            </div>
            <button type='submit' className={primaryBtnClass}>
              Send reset link
            </button>
            <div className='text-center pt-1'>
              <button
                type='button'
                onClick={() => setIsForgotMode(false)}
                className={`text-sm ${linkClass}`}>
                Back to login
              </button>
            </div>
          </form>
        ) : isLoginMode ? (
          <form key='login' onSubmit={handleLogin} className='space-y-4'>
            <div>
              <label className={labelClass}>
                Username <span className='text-[#AE2A19]'>*</span>
              </label>
              <input
                type='text'
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder='Enter your username'
                className={inputClass}
                autoComplete='username'
              />
            </div>
            <div>
              <div className='flex justify-between items-center mb-1.5'>
                <label className='text-[13px] font-semibold text-[#172B4D]'>
                  Password <span className='text-[#AE2A19]'>*</span>
                </label>
                <button
                  type='button'
                  onClick={() => setIsForgotMode(true)}
                  className={`text-xs ${linkClass}`}>
                  Forgot password?
                </button>
              </div>
              <div className='relative'>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder='Enter your password'
                  className={`${inputClass} pr-10`}
                  autoComplete='current-password'
                />
                <PasswordToggle
                  visible={showPassword}
                  setVisible={setShowPassword}
                />
              </div>
            </div>

            <button type='submit' className={primaryBtnClass}>
              Login
            </button>

            <OrDivider />

            <button
              type='button'
              onClick={() => loginWithGoogle()}
              className={googleBtnClass}>
              <Icon iconify='logos:google-icon' className='w-4 h-4' />
              Continue with Google
            </button>

            {isLoginMode && !isForgotMode && !isResetMode && (
              <p className='text-[#626F86] text-sm mt-2 text-center'>
                Don&apos;t have an account?{' '}
                <button
                  type='button'
                  onClick={() => {
                    setIsLoginMode(false);
                    setLoginUsername('');
                    setLoginPassword('');
                  }}
                  className={linkClass}>
                  Sign up
                </button>
              </p>
            )}
            {!isLoginMode && !isForgotMode && !isResetMode && (
              <p className='text-[#626F86] text-sm mt-2 text-center'>
                Already have an account?{' '}
                <button
                  type='button'
                  onClick={() => {
                    setIsLoginMode(true);
                    setLoginUsername('');
                    setLoginPassword('');
                    setRegConfirmPassword('');
                  }}
                  className={linkClass}>
                  Sign in
                </button>
              </p>
            )}
          </form>
        ) : (
          <form
            key='register'
            onSubmit={handleRegister}
            className='space-y-3.5'>
            <div>
              <label className={labelClass}>Full name</label>
              <input
                type='text'
                value={regFullName}
                onChange={(e) => setRegFullName(e.target.value)}
                placeholder='Enter your full name'
                className={inputClass}
                autoComplete='name'
              />
            </div>
            <div>
              <label className={labelClass}>Work email</label>
              <input
                type='email'
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder='Enter your work email'
                className={inputClass}
                autoComplete='email'
              />
            </div>
            <div>
              <label className={labelClass}>Username</label>
              <input
                type='text'
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder='Choose a username'
                className={inputClass}
                autoComplete='username'
              />
            </div>
            <div>
              <label className={labelClass}>Password</label>
              <div className='relative'>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder='Create a password'
                  className={`${inputClass} pr-10`}
                  autoComplete='new-password'
                />
                <PasswordToggle
                  visible={showPassword}
                  setVisible={setShowPassword}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Confirm password</label>
              <div className='relative'>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder='Confirm your password'
                  className={`${inputClass} pr-10`}
                  autoComplete='new-password'
                />
                <PasswordToggle
                  visible={showConfirmPassword}
                  setVisible={setShowConfirmPassword}
                />
              </div>
            </div>

            <div className='flex items-start gap-2 rounded-lg bg-[#E3FCEF] border border-[#ABF5D1] px-3 py-2.5'>
              <Icon
                name='lock'
                className='w-3.5 h-3.5 shrink-0 text-[#006644] mt-0.5'
              />
              <p className='text-[11px] font-medium text-[#006644] leading-relaxed'>
                Passwords are one-way encrypted. Admins cannot view or retrieve
                your password.
              </p>
            </div>

            <div className='flex items-start gap-2.5 pt-0.5'>
              <label
                htmlFor='reg-agree'
                className='relative mt-0.5 inline-flex h-4 w-4 shrink-0 cursor-pointer'>
                <input
                  type='checkbox'
                  id='reg-agree'
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className='peer sr-only'
                />
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded-[3px] border transition-colors ${
                    agreed
                      ? 'border-[#0C66E4] bg-[#0C66E4]'
                      : 'border-[#172B4D] bg-white'
                  } peer-focus-visible:ring-2 peer-focus-visible:ring-[#0C66E4]/35`}>
                  {agreed && (
                    <Icon
                      name='check'
                      className='w-3 h-3 text-white'
                      strokeWidth={3}
                    />
                  )}
                </span>
              </label>
              <label
                htmlFor='reg-agree'
                className='text-xs text-[#626F86] font-medium leading-relaxed cursor-pointer select-none'>
                I have read and agree to the{' '}
                <button
                  type='button'
                  onClick={() => setIsTermsOpen?.(true)}
                  className={linkClass}>
                  Terms of Service
                </button>{' '}
                and{' '}
                <button
                  type='button'
                  onClick={() => setIsPrivacyOpen?.(true)}
                  className={linkClass}>
                  Privacy Policy
                </button>
                .
              </label>
            </div>

            <button
              type='submit'
              disabled={!agreed}
              className={primaryBtnClass}>
              Sign up with email
            </button>

            <OrDivider />

            <button
              type='button'
              disabled={!agreed}
              onClick={() => loginWithGoogle()}
              className={googleBtnClass}>
              <Icon iconify='logos:google-icon' className='w-4 h-4' />
              Continue with Google
            </button>
          </form>
        )}
      </div>

      {!isResetMode && !isForgotMode && (
        <div className='px-8 py-4 bg-[#FAFBFC] border-t border-[#DFE1E6] text-center'>
          <p className='text-[11px] text-[#626F86] leading-relaxed'>
            One account for your workspace projects and collaboration.
          </p>
        </div>
      )}
    </div>
  );
}
