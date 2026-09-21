import InnoceanLogo from '../InnoceanLogo';

export default function LandingFooter({
  setIsSupportAlertOpen,
  setIsPrivacyOpen,
  setIsTermsOpen,
  tMsg = (en) => en,
}) {
  return (
    <footer className="py-8 bg-white dark:bg-black text-center border-t border-neutral-200 dark:border-neutral-900 relative z-10">
      <div className="flex justify-center mb-4">
        <InnoceanLogo size="lg" showTracker={false} />
      </div>
      <div className="flex justify-center gap-6 mb-4 flex-wrap px-4">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setIsSupportAlertOpen(true);
          }}
          className="text-[10px] font-bold text-neutral-400 hover:text-black dark:hover:text-white uppercase tracking-widest transition-colors"
        >
          {tMsg('Contact IT Support', 'Hubungi IT Support')}
        </a>
        <button
          onClick={() => setIsPrivacyOpen(true)}
          className="text-[10px] font-bold text-neutral-400 hover:text-black dark:hover:text-white uppercase tracking-widest transition-colors"
        >
          {tMsg('Privacy Policy', 'Kebijakan Privasi')}
        </button>
        <button
          onClick={() => setIsTermsOpen(true)}
          className="text-[10px] font-bold text-neutral-400 hover:text-black dark:hover:text-white uppercase tracking-widest transition-colors"
        >
          {tMsg('Terms of Service', 'Ketentuan Layanan')}
        </button>
      </div>
      <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
        © {new Date().getFullYear()} INNOCEAN Tracker
      </p>
    </footer>
  );
}
