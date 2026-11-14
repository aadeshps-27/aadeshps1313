import React, { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { PROFILE } from '../data/portfolio';

export const Navbar: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { label: 'Work', href: '#work' },
    { label: 'About', href: '#about' },
    { label: 'Experience', href: '#experience' },
    { label: 'Contact', href: '#contact' },
  ];

  useEffect(() => {
    if (!mobileOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [mobileOpen]);

  const handleLinkClick = () => {
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#E5E5E5] dark:border-[#262626] bg-white/95 dark:bg-black/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 h-14 sm:h-16 flex items-center justify-between gap-4 sm:gap-6 lg:gap-8">
        {/* Zone 1: Brand logo blended seamlessly in Light & Dark modes */}
        <a
          href="#top"
          aria-label={PROFILE.name}
          className="inline-flex items-center shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FF721A]"
        >
          <img
            src="/assets/aistudio/Black_Blue_and_White_Gradient_Modern_Business_LinkedIn_Banner__3__1be4a1fb.png"
            alt={PROFILE.name}
            referrerPolicy="no-referrer"
            className="h-9 sm:h-11 lg:h-12 w-auto object-contain select-none mix-blend-multiply dark:invert dark:hue-rotate-180 dark:mix-blend-screen transition-[filter] duration-200"
          />
        </a>

        {/* Zone 2: Clean single-line navigation links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center md:gap-5 lg:gap-8 text-sm font-medium text-[#525252] dark:text-[#A3A3A3]"
        >
          {navLinks.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="relative py-1 whitespace-nowrap shrink-0 hover:text-[#0A0A0A] dark:hover:text-white transition-colors after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-0 after:h-[2px] after:bg-[#FF721A] hover:after:w-full after:transition-all after:duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FF721A]"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Zone 3: Single primary action on tablet/desktop, mobile toggle on narrow screens */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="#contact"
            className="hidden md:inline-flex items-center justify-center px-4 lg:px-5 py-2.5 text-sm font-semibold rounded-lg bg-[#0A0A0A] text-white dark:bg-white dark:text-[#0A0A0A] hover:bg-[#FF721A] hover:text-[#0A0A0A] dark:hover:bg-[#FF721A] dark:hover:text-[#0A0A0A] transition-colors duration-200 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF721A]"
          >
            Get in Touch
          </a>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg border border-[#E5E5E5] dark:border-[#262626] text-[#0A0A0A] dark:text-white hover:bg-[#F5F5F5] dark:hover:bg-[#141414] transition-colors"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#E5E5E5] dark:border-[#262626] bg-white dark:bg-black px-4 sm:px-6 py-4 shadow-lg">
          <nav aria-label="Mobile Navigation" className="flex flex-col gap-1">
            {navLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={handleLinkClick}
                className="min-h-[44px] flex items-center py-2.5 text-base font-medium text-[#0A0A0A] dark:text-white border-b border-[#E5E5E5]/70 dark:border-[#262626]/70 last:border-b-0"
              >
                {item.label}
              </a>
            ))}
            <a
              href="#contact"
              onClick={handleLinkClick}
              className="mt-3 min-h-[44px] inline-flex items-center justify-center py-3 px-4 rounded-lg bg-[#FF721A] text-[#0A0A0A] font-bold text-sm"
            >
              Get in Touch
            </a>
          </nav>
        </div>
      )}
    </header>
  );
};
