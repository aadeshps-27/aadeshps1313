import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { DISCIPLINES, ProjectCategory } from '../data/portfolio';
import { LiveClock } from './LiveClock';
import {
  ARTCRAFT_EASE,
  DrawRule,
  ParallaxLayer,
  RegistrationTick,
} from './MotionPrimitives';

interface HeroProps {
  onSelectDisciplineFilter: (filter: Exclude<ProjectCategory, 'all'>) => void;
}

export const Hero: React.FC<HeroProps> = ({ onSelectDisciplineFilter }) => {
  const prefersReducedMotion = Boolean(useReducedMotion());

  return (
    <section
      id="top"
      className="snap-start overflow-x-clip border-b border-[#E5E5E5] dark:border-[#262626]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-6 pb-10 sm:pt-8 sm:pb-12 lg:pt-10 lg:pb-14">
        <div className="space-y-5 sm:space-y-6">
          <div className="flex items-center justify-end gap-2 text-xs text-[#525252] dark:text-[#A3A3A3]">
            <RegistrationTick onMount delay={0.2} />
            <span className="inline-flex items-center gap-1.5 font-mono tabular-nums">
              <span>Kerala, IN</span>
              <span aria-hidden="true" className="text-[#C94B00] dark:text-[#FF721A]">·</span>
              <LiveClock className="text-[#0A0A0A] dark:text-white" />
            </span>
          </div>

          <DrawRule delay={0.12} />
          <div
            data-reveal-group=""
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5 lg:gap-6"
          >
            {DISCIPLINES.map((item, idx) => (
              <ParallaxLayer
                key={item.number}
                speed={idx % 2 === 0 ? 7 : 15}
                className="h-full"
              >
                <motion.button
                  type="button"
                  data-reveal=""
                  initial={
                    prefersReducedMotion
                      ? false
                      : { opacity: 0, y: 20, filter: 'blur(6px)' }
                  }
                  whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  viewport={{ once: true, amount: 0.2 }}
                  whileHover={prefersReducedMotion ? undefined : { y: -3 }}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.985 }}
                  transition={{
                    duration: 0.65,
                    delay: prefersReducedMotion ? 0 : idx * 0.065,
                    ease: ARTCRAFT_EASE,
                  }}
                  onClick={() => {
                    onSelectDisciplineFilter(item.filter);
                    const el = document.getElementById('work');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full h-full group rule-reveal overflow-hidden text-left p-4 sm:p-5 rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#0A0A0A] hover:border-[#FF721A] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF721A]"
                >
                  <div className="flex items-center justify-between mb-2.5 sm:mb-3">
                    <span className="font-mono text-xs tabular-nums font-semibold text-[#C94B00] dark:text-[#FF721A]">
                      {item.number}
                    </span>
                    <ArrowUpRight
                      size={15}
                      className="text-[#737373] group-hover:text-[#C94B00] dark:group-hover:text-[#FF721A] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200"
                      aria-hidden="true"
                    />
                  </div>
                  <h2 className="font-display text-base font-semibold text-[#0A0A0A] dark:text-white">
                    {item.title}
                  </h2>
                  <p className="mt-1 text-xs text-[#525252] dark:text-[#A3A3A3]">
                    {item.detail}
                  </p>
                </motion.button>
              </ParallaxLayer>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
