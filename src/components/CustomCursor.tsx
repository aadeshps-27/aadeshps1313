import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react';

type CursorVariant = 'default' | 'interactive' | 'project';

export const CustomCursor: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [variant, setVariant] = useState<CursorVariant>('default');
  const [pressed, setPressed] = useState(false);

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const smoothX = useSpring(cursorX, { stiffness: 450, damping: 32, mass: 0.5 });
  const smoothY = useSpring(cursorY, { stiffness: 450, damping: 32, mass: 0.5 });

  useEffect(() => {
    if (typeof window === 'undefined' || prefersReducedMotion) {
      setEnabled(false);
      return;
    }

    const pointerQuery = window.matchMedia('(pointer: fine)');
    const updateEnabled = () => setEnabled(pointerQuery.matches);
    updateEnabled();

    pointerQuery.addEventListener('change', updateEnabled);
    return () => pointerQuery.removeEventListener('change', updateEnabled);
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (!enabled) return;

    const handleMouseMove = (e: MouseEvent) => {
      setVisible(true);
      const target = e.target as HTMLElement | null;

      const interactiveEl = target?.closest(
        'a, button, [role="tab"], input[type="range"]'
      ) as HTMLElement | null;
      const projectCard = target?.closest('[data-cursor="project"]') as HTMLElement | null;

      if (interactiveEl) {
        setVariant('interactive');
        const rect = interactiveEl.getBoundingClientRect();
        // Gentle magnetic pull toward center of compact interactive controls
        if (rect.width <= 260 && rect.height <= 80) {
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          const magneticX = e.clientX + (centerX - e.clientX) * 0.28;
          const magneticY = e.clientY + (centerY - e.clientY) * 0.28;
          cursorX.set(magneticX - 16);
          cursorY.set(magneticY - 16);
          return;
        }
      } else if (projectCard) {
        setVariant('project');
      } else {
        setVariant('default');
      }

      cursorX.set(e.clientX - 16);
      cursorY.set(e.clientY - 16);
    };

    const handleMouseDown = () => setPressed(true);
    const handleMouseUp = () => setPressed(false);
    const handleMouseLeave = () => {
      setVisible(false);
      setVariant('default');
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [enabled, cursorX, cursorY]);

  if (!enabled) return null;

  const baseScale = variant === 'project' ? 2.4 : variant === 'interactive' ? 1.75 : 1;
  const finalScale = pressed ? baseScale * 0.85 : baseScale;

  return (
    <motion.div
      aria-hidden="true"
      style={{ x: smoothX, y: smoothY }}
      animate={{
        opacity: visible ? 1 : 0,
        scale: finalScale,
      }}
      transition={{
        opacity: { duration: 0.15 },
        scale: { type: 'spring', stiffness: 360, damping: 26 },
      }}
      className={`pointer-events-none fixed top-0 left-0 z-[60] w-8 h-8 rounded-full border transition-colors duration-150 flex items-center justify-center ${
        variant === 'project'
          ? 'border-[#FF721A] bg-[#FF721A]/15'
          : variant === 'interactive'
            ? 'border-[#FF721A] bg-[#FF721A]/10'
            : 'border-[#0A0A0A]/45 dark:border-white/45 bg-transparent'
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full transition-colors duration-150 ${
          variant === 'default'
            ? 'bg-[#FF721A]'
            : 'bg-[#FF721A]/90'
        }`}
      />
    </motion.div>
  );
};
