import React, { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import { playNavSelect } from '../utils/spatialAudio';

interface BackToTopButtonProps {
  inline?: boolean;
}

export const BackToTopButton: React.FC<BackToTopButtonProps> = ({ inline = false }) => {
  const prefersReducedMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const checkPastHero = () => {
      const heroSection = document.getElementById('top');
      if (!heroSection) {
        setVisible(window.scrollY > window.innerHeight * 0.85);
        return;
      }
      const rect = heroSection.getBoundingClientRect();
      // Reveal once the first section (Hero) has scrolled past the sticky top bar
      setVisible(rect.bottom <= 64);
    };

    checkPastHero();
    window.addEventListener('scroll', checkPastHero, { passive: true });
    window.addEventListener('resize', checkPastHero, { passive: true });

    return () => {
      window.removeEventListener('scroll', checkPastHero);
      window.removeEventListener('resize', checkPastHero);
    };
  }, []);

  const handleScrollTop = (e: React.MouseEvent<HTMLButtonElement>) => {
    playNavSelect(e.currentTarget);
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          key="back-to-top"
          type="button"
          onClick={handleScrollTop}
          aria-label="Back to top"
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 14, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.92 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className={`${
            inline ? '' : 'fixed bottom-4 right-4 sm:bottom-6 sm:right-6 md:right-12 z-30 '
          }inline-flex items-center justify-center w-11 h-11 rounded-xl bg-[#0A0A0A] text-white dark:bg-white dark:text-[#0A0A0A] border border-[#262626] dark:border-[#E5E5E5] shadow-md hover:bg-[#FF721A] hover:text-[#0A0A0A] hover:border-[#FF721A] dark:hover:bg-[#FF721A] dark:hover:text-[#0A0A0A] dark:hover:border-[#FF721A] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF721A]`}
        >
          <ArrowUp size={18} aria-hidden="true" />
        </motion.button>
      )}
    </AnimatePresence>
  );
};
