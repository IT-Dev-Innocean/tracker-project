import { Icon } from '../icons/Icon';
import React from 'react';

export default function LandingCTA({ setIsLoginMode, setShowAuthForm, tMsg = (en) => en }) {
  return (
    <section
      id="cta-section"
      className="py-20 md:py-28 bg-white dark:bg-black relative z-10 overflow-hidden border-t border-slate-200 dark:border-slate-800"
    >
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:20px_20px] opacity-50"></div>
      <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
        <h2 className="text-3xl md:text-5xl font-black text-black dark:text-white mb-6 leading-[1.15]">
          {tMsg('Already have an account? Log in to your workspace.', 'Sudah punya akun? Masuk ke workspace.')}
        </h2>
        <p className="text-neutral-500 dark:text-neutral-400 text-lg md:text-xl font-medium mb-10 max-w-2xl mx-auto">
          {tMsg(
            'Use your INNOCEAN work email or Google account. New teammates can sign up with the same office email. Inside, Smart Assistant is ready to help with everyday work.',
            'Pakai email kantor INNOCEAN atau akun Google. Rekan baru bisa daftar dengan email kantor yang sama. Di dalam, Smart Assistant siap membantu kerja harian.'
          )}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => {
              setIsLoginMode(true);
              setShowAuthForm(true);
            }}
            className="w-full sm:w-auto bg-black dark:bg-white text-white dark:text-black hover:opacity-80 font-bold py-4 px-10 rounded-full shadow-lg transition-all hover:-translate-y-1 flex items-center justify-center gap-2"
          >
            {tMsg('Log in', 'Masuk')} <Icon name="arrow-right" className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              setIsLoginMode(false);
              setShowAuthForm(true);
            }}
            className="w-full sm:w-auto bg-transparent text-black dark:text-white border border-neutral-300 dark:border-white/50 hover:bg-neutral-50 dark:hover:bg-white/10 font-bold py-4 px-10 rounded-full transition-all flex items-center justify-center"
          >
            {tMsg('Sign up', 'Daftar')}
          </button>
        </div>
      </div>
    </section>
  );
}
