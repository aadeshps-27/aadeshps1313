import React, { useCallback, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { AnimatePresence } from 'motion/react';
import { Navbar } from './components/Navbar';
import { ScrollProgressBar } from './components/ScrollProgressBar';
import { CustomCursor } from './components/CustomCursor';
import { Preloader } from './components/Preloader';
import { WorksSection } from './components/WorksSection';
import { AboutSection, ExperienceSection } from './components/AboutAndExperience';
import { ContactAndFooter } from './components/ContactAndFooter';
import { CaseStudyModal } from './components/CaseStudyModal';
import { BackToTopButton } from './components/BackToTopButton';
import { AiCharacterMotion } from './components/AiCharacterMotion';
import { InteractiveDotGrid } from './components/InteractiveDotGrid';
import {
  FloatingAudioToggle,
  SpatialAudioProvider,
} from './components/SpatialAudioProvider';
import { SectionDivider } from './components/SectionDivider';
import {
  BRAND_LOGO_URL,
  PROFILE,
  PROJECTS,
  ProjectCategory,
  ProjectId,
} from './data/portfolio';
import { playModalOpen, playThemeSwitch } from './utils/spatialAudio';
import { warmImagesOnIdle } from './utils/imagePreload';

type DocumentWithViewTransition = Document & {
  startViewTransition?: (updateCallback: () => void) => {
    ready: Promise<void>;
    finished: Promise<void>;
  };
};

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    }
    return 'dark';
  });

  const [isPreloading, setIsPreloading] = useState(true);
  const [isNavRevealed, setIsNavRevealed] = useState(false);
  const [activeFilter, setActiveFilter] = useState<ProjectCategory>('all');
  const [selectedProject, setSelectedProject] = useState<ProjectId | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    return warmImagesOnIdle([
      BRAND_LOGO_URL,
      PROFILE.portraitImage,
      ...PROJECTS.map((project) => project.image),
    ]);
  }, []);

  const applyThemeDom = (nextTheme: 'light' | 'dark') => {
    const root = document.documentElement;
    root.classList.toggle('dark', nextTheme === 'dark');
    try {
      localStorage.setItem('aadesh-portfolio-theme', nextTheme);
    } catch {
      // ignore storage errors
    }
  };

  const toggleTheme = (event?: React.MouseEvent<HTMLButtonElement>) => {
    const nextTheme: 'light' | 'dark' = theme === 'dark' ? 'light' : 'dark';
    playThemeSwitch(nextTheme, event?.currentTarget);
    const root = document.documentElement;
    const doc = document as DocumentWithViewTransition;
    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (
      reduceMotion ||
      typeof doc.startViewTransition !== 'function' ||
      typeof root.animate !== 'function'
    ) {
      applyThemeDom(nextTheme);
      setTheme(nextTheme);
      return;
    }

    const rect = event?.currentTarget?.getBoundingClientRect();
    const originX = rect ? rect.left + rect.width / 2 : window.innerWidth - 72;
    const originY = rect ? rect.top + rect.height / 2 : 32;
    const maxRadius = Math.hypot(
      Math.max(originX, window.innerWidth - originX),
      Math.max(originY, window.innerHeight - originY)
    );

    root.classList.add('theme-animating');
    const transition = doc.startViewTransition(() => {
      applyThemeDom(nextTheme);
      flushSync(() => {
        setTheme(nextTheme);
      });
    });

    transition.ready
      .then(() => {
        root.animate(
          {
            clipPath: [
              `circle(0px at ${originX}px ${originY}px)`,
              `circle(${maxRadius}px at ${originX}px ${originY}px)`,
            ],
          },
          {
            duration: 640,
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
            pseudoElement: '::view-transition-new(root)',
          }
        );
      })
      .catch(() => {
        // Fallback silently if view transition is interrupted
      });

    transition.finished
      .finally(() => {
        root.classList.remove('theme-animating');
      })
      .catch(() => {
        root.classList.remove('theme-animating');
      });
  };

  const handleRevealNavbar = useCallback(() => {
    setIsNavRevealed(true);
  }, []);

  const handlePreloaderComplete = useCallback(() => {
    setIsNavRevealed(true);
    setIsPreloading(false);
  }, []);

  const handleOpenProject = useCallback(
    (id: ProjectId, source?: HTMLElement | null) => {
      playModalOpen(source);
      setSelectedProject(id);
    },
    []
  );

  const isOverlayOpen = selectedProject !== null || isPreloading;

  return (
    <SpatialAudioProvider>
      <div className="relative min-h-screen bg-white text-[#0A0A0A] dark:bg-black dark:text-white transition-colors duration-200">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-4 focus:z-[70] focus:px-4 focus:py-2.5 focus:rounded-lg focus:bg-[#FF721A] focus:text-[#0A0A0A] focus:font-bold focus:text-xs focus:shadow-lg focus:outline-2 focus:outline-offset-2 focus:outline-[#0A0A0A] dark:focus:outline-white"
        >
          Skip to main content
        </a>

        <InteractiveDotGrid />

        <AnimatePresence>
          {isPreloading && (
            <Preloader
              key="site-preloader"
              onRevealNavbar={handleRevealNavbar}
              onComplete={handlePreloaderComplete}
            />
          )}
        </AnimatePresence>

        <CustomCursor />
        <ScrollProgressBar isModalOpen={isOverlayOpen} />

        <div
          aria-hidden={isOverlayOpen || undefined}
          inert={isOverlayOpen}
        >
          <Navbar
            theme={theme}
            onToggleTheme={toggleTheme}
            brandRevealed={isNavRevealed}
          />

          <main id="main" tabIndex={-1} className="relative z-[1] overflow-x-clip focus:outline-none">
            <AboutSection
              entranceReady={!isPreloading}
              onSelectDisciplineFilter={(filter) => setActiveFilter(filter)}
            />

            <SectionDivider
              index="02"
              label="Selected Works"
              descriptor="Case Studies & Research"
            />

            <WorksSection
              activeFilter={activeFilter}
              onChangeFilter={setActiveFilter}
              onOpenProject={handleOpenProject}
            />

            <SectionDivider
              index="03"
              label="Professional Background"
              descriptor="Roles & Academic Journey"
            />

            <ExperienceSection />

            <SectionDivider
              index="04"
              label="Direct Connection"
              descriptor="Collaborations & Inquiries"
            />

            <ContactAndFooter />
          </main>

          <div className="fixed bottom-4 right-8 sm:bottom-6 sm:right-9 md:right-12 z-30 flex flex-col items-end gap-2.5">
            <FloatingAudioToggle />
            <BackToTopButton inline />
          </div>
        </div>

        <AnimatePresence>
          {selectedProject && (
            <CaseStudyModal
              key="case-study-modal"
              projectId={selectedProject}
              onClose={() => setSelectedProject(null)}
              onSelectProject={(id) => setSelectedProject(id)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {!isPreloading && selectedProject === null && (
            <AiCharacterMotion key="ai-character-motion" />
          )}
        </AnimatePresence>
      </div>
    </SpatialAudioProvider>
  );
}
