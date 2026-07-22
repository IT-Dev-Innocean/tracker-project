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
          isInstallable={isInstallable}
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
          className={`fixed bottom-6 right-6 md:bottom-10 md:right-10 z-[100] w-12 h-12 bg-white dark:bg-neutral-800 text-black dark:text-white border border-slate-200 dark:border-slate-700 rounded-full shadow-xl flex items-center justify-center hover:scale-110 transition-all duration-300 ${
            showScrollTop ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0 pointer-events-none'
          }`}
          title="Jump to Top"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 15l7-7 7 7"></path>
          </svg>
        </button>

        {isPrivacyOpen && <PrivacyPolicyModal setIsPrivacyOpen={setIsPrivacyOpen} />}
        {isTermsOpen && <TermsOfServiceModal setIsTermsOpen={setIsTermsOpen} />}

        {isSupportAlertOpen && (
          <div className="fixed inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 transition-opacity duration-200">
            <div className="bg-white dark:bg-neutral-950 p-6 sm:p-10 w-full max-w-sm border border-neutral-200 dark:border-neutral-800 shadow-2xl rounded-3xl md:rounded-[2.5rem] text-center mac-animate">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl shadow-sm border border-blue-200 dark:border-blue-800/50">
                🎧
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
                className="w-full px-4 py-4 rounded-full font-bold text-white bg-black dark:bg-white dark:text-black hover:opacity-80 shadow-md transition-all uppercase tracking-widest text-xs hover:-translate-y-0.5"
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
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-4 transition-colors duration-200 relative selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
      <style>{`
        @keyframes form-fade {
          0% { opacity: 0; filter: blur(4px); transform: scale(0.98); }
          100% { opacity: 1; filter: blur(0); transform: scale(1); }
        }
        .form-animate {
          animation: form-fade 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
      <button
        onClick={() => setShowAuthForm(false)}
        className="absolute top-8 left-8 text-neutral-400 hover:text-black dark:hover:text-white font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-colors"
      >
        ← Back
      </button>

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
      {isPrivacyOpen && <PrivacyPolicyModal setIsPrivacyOpen={setIsPrivacyOpen} />}
      {isTermsOpen && <TermsOfServiceModal setIsTermsOpen={setIsTermsOpen} />}
    </div>
  );
}
