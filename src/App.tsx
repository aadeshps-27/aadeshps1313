import { useEffect, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { Navbar } from './components/Navbar';
import { ScrollProgressBar } from './components/ScrollProgressBar';
import { CustomCursor } from './components/CustomCursor';
import { Hero } from './components/Hero';
import { WorksSection } from './components/WorksSection';
import { AboutAndExperience } from './components/AboutAndExperience';
import { ContactAndFooter } from './components/ContactAndFooter';
import { CaseStudyModal } from './components/CaseStudyModal';
import { BackToTopButton } from './components/BackToTopButton';
import { ProjectCategory, ProjectId } from './data/portfolio';

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    }
    return 'light';
  });

  const [activeFilter, setActiveFilter] = useState<ProjectCategory>('all');
  const [selectedProject, setSelectedProject] = useState<ProjectId | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('aadesh-theme', theme);
    } catch {
      // ignore storage errors
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div className="min-h-screen bg-white text-[#0A0A0A] dark:bg-black dark:text-white transition-colors duration-200">
      <CustomCursor />
      <ScrollProgressBar isModalOpen={selectedProject !== null} />
      <Navbar />

      <main id="main">
        <Hero
          theme={theme}
          onToggleTheme={toggleTheme}
          onSelectDisciplineFilter={(filter) => setActiveFilter(filter)}
        />

        <WorksSection
          activeFilter={activeFilter}
          onChangeFilter={setActiveFilter}
          onOpenProject={(id) => setSelectedProject(id)}
        />

        <AboutAndExperience />

        <ContactAndFooter
          theme={theme}
          onToggleTheme={toggleTheme}
        />
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

      <BackToTopButton />
    </div>
  );
}
