import { useEffect, useState } from 'react';
import { ChevronUp } from 'lucide-react';
import LandingHero from './LandingHero';
import {
  LandingAISection,
  LandingCTA,
  LandingFAQ,
  LandingFeatures,
  LandingFooter,
} from './LandingSections';

export default function LandingPageContent() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 500);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-reveal');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.reveal-on-scroll').forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="overflow-x-hidden bg-white font-sans text-black transition-colors duration-200 dark:bg-black dark:text-white">
      <LandingHero />
      <LandingAISection />
      <LandingFeatures />
      <LandingFAQ />
      <LandingCTA />
      <LandingFooter />

      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-6 right-6 z-[100] flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-black shadow-xl transition-all duration-300 hover:scale-110 dark:border-slate-700 dark:bg-neutral-800 dark:text-white md:bottom-10 md:right-10 ${
          showScrollTop ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-16 opacity-0'
        }`}
        title="Jump to Top"
      >
        <ChevronUp className="h-5 w-5" />
      </button>
    </div>
  );
}
