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
import { ProjectCategory, ProjectId } from './data/portfolio';

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

  const handlePreloaderComplete = useCallback(() => {
    setIsPreloading(false);
  }, []);

  return (
    <div className="relative min-h-screen bg-white text-[#0A0A0A] dark:bg-black dark:text-white transition-colors duration-200">
      <InteractiveDotGrid />

      <AnimatePresence>
        {isPreloading && (
          <Preloader key="site-preloader" onComplete={handlePreloaderComplete} />
        )}
      </AnimatePresence>

      <CustomCursor />
      <ScrollProgressBar isModalOpen={selectedProject !== null || isPreloading} />
      <Navbar theme={theme} onToggleTheme={toggleTheme} />

      <main id="main" className="relative z-[1] overflow-x-clip">
        <AboutSection
          onSelectDisciplineFilter={(filter) => setActiveFilter(filter)}
        />

        <WorksSection
          activeFilter={activeFilter}
          onChangeFilter={setActiveFilter}
          onOpenProject={(id) => setSelectedProject(id)}
        />

        <ExperienceSection />

        <ContactAndFooter />
      </main>

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

      <BackToTopButton />
    </div>
  );
}
