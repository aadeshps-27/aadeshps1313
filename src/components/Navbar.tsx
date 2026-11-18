import React, { useEffect, useId, useRef, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'motion/react';
import { PROFILE } from '../data/portfolio';
import { ARTCRAFT_EASE } from './MotionPrimitives';

interface NavbarProps {
  theme: 'light' | 'dark';
  onToggleTheme: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

const SUN_RAY_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];
const NAV_LINK_SPRING = { type: 'spring' as const, stiffness: 460, damping: 24, mass: 0.55 };
const NAV_RULE_SPRING = { type: 'spring' as const, stiffness: 440, damping: 32 };
const NAV_SECTION_IDS = ['about', 'work', 'experience', 'contact'] as const;

const AnimatedThemeIcon: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const rawMaskId = useId();
  const maskId = `theme-mask-${rawMaskId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  return (
    <motion.svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      animate={prefersReducedMotion ? undefined : { rotate: isDark ? 40 : 90 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
    >
      <mask id={maskId}>
        <rect x="0" y="0" width="24" height="24" fill="white" />
        <motion.circle
          cx="12"
          cy="12"
          r="9"
          fill="black"
          initial={false}
          animate={{
            cx: isDark ? 12 : 24,
            cy: isDark ? 4 : 0,
            r: isDark ? 6.5 : 0,
          }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { type: 'spring', stiffness: 280, damping: 24 }
          }
        />
      </mask>

      <motion.circle
        cx="12"
        cy="12"
        fill="currentColor"
        stroke="none"
        mask={`url(#${maskId})`}
        initial={false}
        animate={{ r: isDark ? 8.2 : 4.8 }}
        transition={
          prefersReducedMotion
            ? { duration: 0 }
            : { type: 'spring', stiffness: 280, damping: 22 }
        }
      />

      <motion.g
        initial={false}
        animate={{
          opacity: isDark ? 0 : 1,
          scale: isDark ? 0.4 : 1,
        }}
        transition={
          prefersReducedMotion
            ? { duration: 0 }
            : { duration: 0.25, ease: ARTCRAFT_EASE }
        }
        style={{ transformOrigin: '12px 12px' }}
      >
        {SUN_RAY_ANGLES.map((deg) => {
          const rad = (deg * Math.PI) / 180;
          const x1 = 12 + Math.cos(rad) * 7.8;
          const y1 = 12 + Math.sin(rad) * 7.8;
          const x2 = 12 + Math.cos(rad) * 10.2;
          const y2 = 12 + Math.sin(rad) * 10.2;
          return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} />;
        })}
      </motion.g>
    </motion.svg>
  );
};

export const Navbar: React.FC<NavbarProps> = ({ theme, onToggleTheme }) => {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const headerRef = useRef<HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);
  const [activeHref, setActiveHref] = useState<string>('#about');
  const [scrolled, setScrolled] = useState(false);
  const isDark = theme === 'dark';

  const navLinks = [
    { label: 'About', href: '#about' },
    { label: 'Work', href: '#work' },
    { label: 'Experience', href: '#experience' },
    { label: 'Contact', href: '#contact' },
  ];

  // Track active portfolio section & scroll shadow state
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateNavState = () => {
      const scrollY = window.scrollY;
      setScrolled(scrollY > 8);

      const vh = window.innerHeight || 800;
      const docH = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
        vh + 1
      );

      if (scrollY + vh >= docH - 48) {
        setActiveHref('#contact');
        return;
      }

      const markerY = vh * 0.36;
      let currentId: (typeof NAV_SECTION_IDS)[number] = 'about';
      for (const id of NAV_SECTION_IDS) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= markerY) {
          currentId = id;
        }
      }
      setActiveHref(`#${currentId}`);
    };

    updateNavState();
    window.addEventListener('scroll', updateNavState, { passive: true });
    window.addEventListener('resize', updateNavState, { passive: true });
    return () => {
      window.removeEventListener('scroll', updateNavState);
      window.removeEventListener('resize', updateNavState);
    };
  }, []);

  // Close mobile drawer on Escape, outside pointer tap, or viewport expansion >= 768px
  useEffect(() => {
    if (!mobileOpen) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };

    const handleOutsideTap = (e: PointerEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    };

    const mq = window.matchMedia('(min-width: 768px)');
    const handleViewportChange = () => {
      if (mq.matches) setMobileOpen(false);
    };

    window.addEventListener('keydown', handleEsc);
    window.addEventListener('pointerdown', handleOutsideTap);
    mq.addEventListener('change', handleViewportChange);

    return () => {
      window.removeEventListener('keydown', handleEsc);
      window.removeEventListener('pointerdown', handleOutsideTap);
      mq.removeEventListener('change', handleViewportChange);
    };
  }, [mobileOpen]);

  const scrollToSection = (href: string) => {
    const id = href.replace(/^#/, '');
    if (id === 'top') {
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      });
      return;
    }
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start',
      });
    }
  };

  const handleDesktopLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    e.preventDefault();
    scrollToSection(href);
  };

  const handleMobileLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    e.preventDefault();
    setMobileOpen(false);
    // Defer scroll by one frame so drawer collapse doesn't skew landing offset
    window.requestAnimationFrame(() => {
      scrollToSection(href);
    });
  };

  const indicatorHref = hoveredHref ?? activeHref;

  return (
    <header
      ref={headerRef}
      className={`sticky top-0 z-40 border-b border-[#E5E5E5] dark:border-[#262626] bg-white/95 dark:bg-black/95 backdrop-blur-md transition-shadow duration-200 ${
        scrolled ? 'shadow-[0_1px_12px_rgba(0,0,0,0.06)] dark:shadow-[0_1px_16px_rgba(0,0,0,0.5)]' : ''
      }`}
    >
      {/* Clear right-edge architectural scroll ruler (34px wide) on md+ screens */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:pr-12 lg:pl-10 lg:pr-14 h-14 sm:h-16 flex items-center justify-between gap-4 sm:gap-6 lg:gap-8">
        {/* Zone 1: Brand wordmark blended seamlessly in Light & Dark modes */}
        <motion.a
          href="#top"
          onClick={(e) => handleDesktopLinkClick(e, '#top')}
          aria-label={PROFILE.name}
          whileHover={prefersReducedMotion ? undefined : { y: -1, scale: 1.02 }}
          whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
          transition={NAV_LINK_SPRING}
          className="inline-flex items-center shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FF721A] rounded-sm"
        >
          <img
            src="/assets/aistudio/Black_Blue_and_White_Gradient_Modern_Business_LinkedIn_Banner__3__1be4a1fb.png"
            alt={PROFILE.name}
            referrerPolicy="no-referrer"
            className="h-8 sm:h-9 lg:h-10 w-auto max-w-[160px] sm:max-w-[200px] object-contain object-left select-none mix-blend-multiply dark:invert dark:hue-rotate-180 dark:mix-blend-screen transition-[filter] duration-200"
          />
        </motion.a>

        {/* Zone 2: Clean single-line navigation links with active & hover tracking hairline */}
        <LayoutGroup id="navbar-hover-indicator">
          <nav
            aria-label="Primary Navigation"
            onMouseLeave={() => setHoveredHref(null)}
            className="hidden md:flex items-center md:gap-6 lg:gap-8 text-sm font-medium text-[#525252] dark:text-[#A3A3A3]"
          >
            {navLinks.map((item) => {
              const isHighlighted = indicatorHref === item.href;
              const isActiveSection = activeHref === item.href;
              return (
                <motion.a
                  key={item.href}
                  href={item.href}
                  aria-current={isActiveSection ? 'location' : undefined}
                  onClick={(e) => handleDesktopLinkClick(e, item.href)}
                  onMouseEnter={() => setHoveredHref(item.href)}
                  onFocus={() => setHoveredHref(item.href)}
                  onBlur={() => setHoveredHref((prev) => (prev === item.href ? null : prev))}
                  whileHover={prefersReducedMotion ? undefined : { y: -1.5 }}
                  whileTap={prefersReducedMotion ? undefined : { y: 0, scale: 0.96 }}
                  transition={NAV_LINK_SPRING}
                  className={`relative py-2 whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FF721A] ${
                    isHighlighted
                      ? 'text-[#0A0A0A] dark:text-white'
                      : 'hover:text-[#0A0A0A] dark:hover:text-white'
                  }`}
                >
                  <span>{item.label}</span>
                  {isHighlighted && (
                    <motion.span
                      layoutId="nav-hover-underline"
                      aria-hidden="true"
                      transition={prefersReducedMotion ? { duration: 0 } : NAV_RULE_SPRING}
                      className="absolute left-0 right-0 bottom-0 h-[2px] bg-[#FF721A]"
                    />
                  )}
                </motion.a>
              );
            })}
          </nav>
        </LayoutGroup>

        {/* Zone 3: Animated Morphing Theme Toggle + CTA */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <motion.button
            type="button"
            onClick={onToggleTheme}
            whileHover={prefersReducedMotion ? undefined : { y: -1 }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.94 }}
            transition={NAV_LINK_SPRING}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
            title={isDark ? 'Light Mode' : 'Dark Mode'}
            className="invert-block inline-flex items-center justify-center gap-2 min-h-[40px] min-w-[40px] px-2.5 lg:px-3.5 py-2 text-xs font-medium rounded-lg border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#0A0A0A] text-[#0A0A0A] dark:text-white hover:bg-[#0A0A0A] hover:text-white dark:hover:bg-white dark:hover:text-[#0A0A0A] hover:border-[#0A0A0A] dark:hover:border-white whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF721A]"
          >
            <AnimatedThemeIcon isDark={isDark} />
            <span className="hidden lg:inline-flex items-center h-4 overflow-hidden">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={theme}
                  initial={
                    prefersReducedMotion ? false : { y: 10, opacity: 0 }
                  }
                  animate={{ y: 0, opacity: 1 }}
                  exit={
                    prefersReducedMotion ? { opacity: 0 } : { y: -10, opacity: 0 }
                  }
                  transition={{ duration: 0.22, ease: ARTCRAFT_EASE }}
                >
                  {isDark ? 'Light Mode' : 'Dark Mode'}
                </motion.span>
              </AnimatePresence>
            </span>
          </motion.button>

          <motion.a
            href="#contact"
            onClick={(e) => handleDesktopLinkClick(e, '#contact')}
            whileHover={prefersReducedMotion ? undefined : { y: -1.5, scale: 1.02 }}
            whileTap={prefersReducedMotion ? undefined : { y: 0, scale: 0.96 }}
            transition={NAV_LINK_SPRING}
            className="hidden md:inline-flex items-center justify-center min-h-[40px] px-4 lg:px-5 py-2 text-sm font-semibold rounded-lg bg-[#0A0A0A] text-white dark:bg-white dark:text-[#0A0A0A] hover:bg-[#FF721A] hover:text-[#0A0A0A] dark:hover:bg-[#FF721A] dark:hover:text-[#0A0A0A] transition-colors duration-200 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF721A]"
          >
            Get in Touch
          </motion.a>

          <motion.button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.92 }}
            transition={NAV_LINK_SPRING}
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation-drawer"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg border border-[#E5E5E5] dark:border-[#262626] text-[#0A0A0A] dark:text-white hover:bg-[#F5F5F5] dark:hover:bg-[#141414] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF721A]"
          >
            {mobileOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </motion.button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="mobile-navigation-drawer"
            key="mobile-nav-drawer"
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.24, ease: ARTCRAFT_EASE }}
            className="md:hidden overflow-hidden border-t border-[#E5E5E5] dark:border-[#262626] bg-white dark:bg-black px-4 sm:px-6 shadow-lg"
          >
            <nav aria-label="Mobile Navigation" className="py-4 flex flex-col gap-1">
              {navLinks.map((item) => {
                const isActive = activeHref === item.href;
                return (
                  <motion.a
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? 'location' : undefined}
                    onClick={(e) => handleMobileLinkClick(e, item.href)}
                    whileHover={prefersReducedMotion ? undefined : { x: 6 }}
                    whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                    transition={NAV_LINK_SPRING}
                    className={`min-h-[44px] flex items-center justify-between py-2.5 text-base font-medium border-b border-[#E5E5E5]/70 dark:border-[#262626]/70 last:border-b-0 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF721A] ${
                      isActive
                        ? 'text-[#C94B00] dark:text-[#FF721A] font-semibold'
                        : 'text-[#0A0A0A] dark:text-white hover:text-[#C94B00] dark:hover:text-[#FF721A]'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span
                      className={`w-1.5 h-1.5 transition-opacity ${
                        isActive ? 'bg-[#FF721A] opacity-100' : 'bg-[#FF721A]/40 opacity-70'
                      }`}
                      aria-hidden="true"
                    />
                  </motion.a>
                );
              })}
              <motion.a
                href="#contact"
                onClick={(e) => handleMobileLinkClick(e, '#contact')}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
                transition={NAV_LINK_SPRING}
                className="mt-3 min-h-[44px] inline-flex items-center justify-center py-3 px-4 rounded-lg bg-[#FF721A] text-[#0A0A0A] font-bold text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF721A]"
              >
                Get in Touch
              </motion.a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
