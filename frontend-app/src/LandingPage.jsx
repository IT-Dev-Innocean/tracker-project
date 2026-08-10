import React, { useState, useEffect } from 'react';
import PrivacyPolicyModal from './PrivacyPolicyModal';
import TermsOfServiceModal from './TermsOfServiceModal';
import AuthForms from './AuthForms';
import LandingFooter from './components/LandingPage/LandingFooter';
import LandingHero from './components/LandingPage/LandingHero';
import LandingAISection from './components/LandingPage/LandingAISection';
import LandingFeatures from './components/LandingPage/LandingFeatures';
import LandingFAQ from './components/LandingPage/LandingFAQ';
import LandingCTA from './components/LandingPage/LandingCTA';
import { Icon } from './components/icons/Icon';
import { useFeatureFlag } from './featureFlags';

export default function LandingPage({
  showAuthForm,
  setShowAuthForm,
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
  isInstallable,
  handleInstallClick,
}) {
  const INSTALL_APP_UI_ENABLED = useFeatureFlag('INSTALL_APP_UI_ENABLED');
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isSupportAlertOpen, setIsSupportAlertOpen] = useState(false);




  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 500) setShowScrollTop(true);
      else setShowScrollTop(false);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!showAuthForm) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('animate-fade-up');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1 }
      );

      document.querySelectorAll('.reveal-on-scroll').forEach((el) => observer.observe(el));
      return () => observer.disconnect();
    }
  }, [showAuthForm]);

  if (!showAuthForm) {
    return (
      <div className="bg-white dark:bg-black text-black dark:text-white font-sans transition-colors duration-200 overflow-x-hidden">
        <style>{`
          @keyframes fade-up {
            0% { opacity: 0; transform: translateY(30px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-up {
            animation: fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          .reveal-on-scroll { opacity: 0; }
          @keyframes float {
            0% { transform: translateY(0px) rotate(-2deg); }
            50% { transform: translateY(-15px) rotate(0deg); }
            100% { transform: translateY(0px) rotate(-2deg); }
          }
          .animate-float {
            animation: float 6s ease-in-out infinite;
          }
          @keyframes float-reverse {
            0% { transform: translateY(0px) rotate(2deg); }
            50% { transform: translateY(-10px) rotate(0deg); }
            100% { transform: translateY(0px) rotate(2deg); }
          }
          .animate-float-reverse {
            animation: float-reverse 7s ease-in-out infinite;
          }
          @keyframes fade-up {
            0% { opacity: 0; transform: translateY(10px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-up {
            animation: fade-up 0.5s ease-out both;
          }
        `}</style>
        <LandingHero
          setIsLoginMode={setIsLoginMode}
          setShowAuthForm={setShowAuthForm}
          isInstallable={INSTALL_APP_UI_ENABLED && isInstallable}
          handleInstallClick={handleInstallClick}
        />
        <LandingAISection showAuthForm={showAuthForm} />
        <LandingFeatures showAuthForm={showAuthForm} />
        <LandingFAQ />

        <LandingCTA setIsLoginMode={setIsLoginMode} setShowAuthForm={setShowAuthForm} />

        <LandingFooter
          setIsSupportAlertOpen={setIsSupportAlertOpen}
          setIsPrivacyOpen={setIsPrivacyOpen}
          setIsTermsOpen={setIsTermsOpen}
        />

        {/* Jump to Top Button */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className={`fixed bottom-6 right-6 md:bottom-10 md:right-10 z-[100] w-12 h-12 cursor-pointer bg-white dark:bg-neutral-800 text-black dark:text-white border border-slate-200 dark:border-slate-700 rounded-full shadow-xl flex items-center justify-center hover:scale-110 transition-all duration-300 ${
            showScrollTop ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0 pointer-events-none'
          }`}
          title="Jump to Top"
        >
          <Icon name="chevron-up" className="w-5 h-5" />
        </button>

        {isPrivacyOpen && <PrivacyPolicyModal setIsPrivacyOpen={setIsPrivacyOpen} />}
        {isTermsOpen && <TermsOfServiceModal setIsTermsOpen={setIsTermsOpen} />}

        {isSupportAlertOpen && (
          <div className="fixed inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 transition-opacity duration-200">
            <div className="bg-white dark:bg-neutral-950 p-6 sm:p-10 w-full max-w-sm border border-neutral-200 dark:border-neutral-800 shadow-2xl rounded-3xl md:rounded-[2.5rem] text-center mac-animate">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl shadow-sm border border-blue-200 dark:border-blue-800/50">
                <Icon name="headphones" className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-black dark:text-white mb-4 uppercase">
                Coming Soon
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 mb-8 text-sm font-medium leading-relaxed">
                IT Support contact integration for guests is coming soon! Please log in to your account to submit a
                support ticket.
              </p>
              <button
                onClick={() => setIsSupportAlertOpen(false)}
                className="w-full cursor-pointer px-4 py-4 rounded-full font-bold text-white bg-black dark:bg-white dark:text-black hover:opacity-80 shadow-md transition-all uppercase tracking-widest text-xs hover:-translate-y-0.5"
              >
                Understood
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-x-hidden overflow-y-auto selection:bg-[#0C66E4] selection:text-white bg-[#F4F5F7]">
      <style>{`
        @keyframes form-fade {
          0% { opacity: 0; filter: blur(4px); transform: translateY(8px) scale(0.98); }
          100% { opacity: 1; filter: blur(0); transform: translateY(0) scale(1); }
        }
        .form-animate {
          animation: form-fade 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .auth-soft-glow {
          background:
            radial-gradient(ellipse 80% 50% at 50% -10%, rgba(12, 102, 228, 0.14), transparent 55%),
            radial-gradient(ellipse 40% 30% at 10% 90%, rgba(255, 171, 0, 0.08), transparent 50%),
            radial-gradient(ellipse 40% 30% at 90% 85%, rgba(54, 179, 126, 0.08), transparent 50%);
        }
      `}</style>

      {/* Soft atmospheric backdrop (ClickUp / Jira light) */}
      <div className="pointer-events-none absolute inset-0 auth-soft-glow" aria-hidden="true" />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-linear-to-b from-[#FFE8F0]/70 via-[#E8F0FF]/40 to-transparent"
        aria-hidden="true"
      />

      <button
        type="button"
        onClick={() => {
          setShowAuthForm(false);
          setIsForgotMode(false);
          setIsResetMode(false);
          setIsLoginMode(true);
        }}
        className="absolute top-5 left-5 sm:top-8 sm:left-8 z-50 cursor-pointer text-[#626F86] hover:text-[#172B4D] font-semibold text-sm flex items-center gap-2 transition-colors"
      >
        <Icon name="arrow-left" className="w-4 h-4" /> Back
      </button>

      <div className="relative z-0 w-full flex justify-center py-12 sm:py-8">
        <AuthForms
          isLoginMode={isLoginMode}
          setIsLoginMode={setIsLoginMode}
          isResetMode={isResetMode}
          setIsResetMode={setIsResetMode}
          setResetToken={setResetToken}
          isForgotMode={isForgotMode}
          setIsForgotMode={setIsForgotMode}
          loginUsername={loginUsername}
          setLoginUsername={setLoginUsername}
          loginPassword={loginPassword}
          setLoginPassword={setLoginPassword}
          regFullName={regFullName}
          setRegFullName={setRegFullName}
          regEmail={regEmail}
          setRegEmail={setRegEmail}
          regConfirmPassword={regConfirmPassword}
          setRegConfirmPassword={setRegConfirmPassword}
          forgotEmail={forgotEmail}
          setForgotEmail={setForgotEmail}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          showConfirmPassword={showConfirmPassword}
          setShowConfirmPassword={setShowConfirmPassword}
          handleLogin={handleLogin}
          handleRegister={handleRegister}
          handleForgotPassword={handleForgotPassword}
          handleResetPassword={handleResetPassword}
          loginWithGoogle={loginWithGoogle}
          setIsPrivacyOpen={setIsPrivacyOpen}
          setIsTermsOpen={setIsTermsOpen}
        />
      </div>
      {isPrivacyOpen && <PrivacyPolicyModal setIsPrivacyOpen={setIsPrivacyOpen} />}
      {isTermsOpen && <TermsOfServiceModal setIsTermsOpen={setIsTermsOpen} />}
    </div>
  );
}
