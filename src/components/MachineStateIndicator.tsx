import React from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { useLanguage } from './LanguageProvider';

export const MachineStateIndicator: React.FC = () => {
  const { lang } = useLanguage();
  const { scrollYProgress } = useScroll();

  const freq = useTransform(scrollYProgress, [0, 1], [55, 126]);
  const gain = useTransform(scrollYProgress, [0, 1], [0.002, 0.016]);
  const sync = useTransform(scrollYProgress, [0, 1], [99.2, 99.9]);

  const [displayFreq, setDisplayFreq] = React.useState('55.0Hz');
  const [displayGain, setDisplayGain] = React.useState('0.002');
  const [displaySync, setDisplaySync] = React.useState('99.2%');

  React.useEffect(() => {
    const unsub1 = freq.on('change', (v) => setDisplayFreq(`${v.toFixed(1)}Hz`));
    const unsub2 = gain.on('change', (v) => setDisplayGain(v.toFixed(3)));
    const unsub3 = sync.on('change', (v) => setDisplaySync(`${v.toFixed(1)}%`));
    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, [freq, gain, sync]);

  return (
    <div className="flex items-center gap-2 sm:gap-3 px-3 py-1.5 rounded-lg border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#0A0A0A] font-mono text-[10px] sm:text-[11px] tabular-nums text-[#525252] dark:text-[#A3A3A3]">
      <div className="flex items-center gap-1.5">
        <motion.span
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.9, 1.15, 0.9] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          className="inline-block w-2 h-2 rounded-full bg-[#FF721A] shadow-[0_0_8px_rgba(255,114,26,0.65)]"
          aria-hidden="true"
        />
        <span className="font-semibold text-[#0A0A0A] dark:text-white">
          {lang === 'ml' ? 'യന്ത്ര നില' : 'SYS-STATE'}
        </span>
      </div>
      <span aria-hidden="true" className="text-[#E5E5E5] dark:text-[#262626]">|</span>
      <span>FREQ: <strong className="text-[#C94B00] dark:text-[#FF721A]">{displayFreq}</strong></span>
      <span aria-hidden="true" className="hidden sm:inline text-[#E5E5E5] dark:text-[#262626]">|</span>
      <span className="hidden sm:inline">GAIN: <strong className="text-[#0A0A0A] dark:text-white">{displayGain}</strong></span>
      <span aria-hidden="true" className="text-[#E5E5E5] dark:text-[#262626]">|</span>
      <span>SYNC: <strong className="text-[#0A0A0A] dark:text-white">{displaySync}</strong></span>
    </div>
  );
};
