import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import {
  getAudioEnabled,
  playFilterTab,
  setAudioEnabled,
  subscribeAudioEnabled,
} from '../utils/spatialAudio';
import { useLanguage } from './LanguageProvider';

interface SpatialAudioContextValue {
  enabled: boolean;
  toggleAudio: (sourceEl?: HTMLElement | null) => void;
  setEnabled: (next: boolean) => void;
}

const SpatialAudioContext = createContext<SpatialAudioContextValue>({
  enabled: true,
  toggleAudio: () => {},
  setEnabled: () => {},
});

export const SpatialAudioProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [enabled, setEnabledState] = useState<boolean>(() => getAudioEnabled());

  useEffect(() => {
    return subscribeAudioEnabled(setEnabledState);
  }, []);

  const setEnabled = useCallback((next: boolean) => {
    setAudioEnabled(next);
  }, []);

  const toggleAudio = useCallback((sourceEl?: HTMLElement | null) => {
    const next = !getAudioEnabled();
    setAudioEnabled(next);
    if (next) {
      playFilterTab(2, 3, sourceEl);
    }
  }, []);

  return (
    <SpatialAudioContext.Provider value={{ enabled, toggleAudio, setEnabled }}>
      {children}
    </SpatialAudioContext.Provider>
  );
};

export function useSpatialAudio(): SpatialAudioContextValue {
  return useContext(SpatialAudioContext);
}

export const FloatingAudioToggle: React.FC = () => {
  const { enabled, toggleAudio } = useSpatialAudio();
  const { t } = useLanguage();
  const prefersReducedMotion = Boolean(useReducedMotion());

  return (
    <motion.button
      type="button"
      onClick={(e) => toggleAudio(e.currentTarget)}
      whileHover={prefersReducedMotion ? undefined : { y: -1.5, scale: 1.03 }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 420, damping: 24 }}
      aria-pressed={enabled}
      aria-label={enabled ? t.audio.muteAria : t.audio.enableAria}
      title={enabled ? t.audio.floatingOnTitle : t.audio.floatingOffTitle}
      className={`inline-flex items-center justify-center w-11 h-11 rounded-xl border shadow-md transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF721A] ${
        enabled
          ? 'bg-white/95 dark:bg-[#0A0A0A]/95 text-[#0A0A0A] dark:text-white border-[#E5E5E5] dark:border-[#262626] hover:border-[#FF721A] hover:text-[#C94B00] dark:hover:text-[#FF721A]'
          : 'bg-[#F5F5F5]/95 dark:bg-[#141414]/95 text-[#737373] dark:text-[#737373] border-[#E5E5E5] dark:border-[#262626] hover:border-[#FF721A] hover:text-[#0A0A0A] dark:hover:text-white'
      } backdrop-blur-md`}
    >
      {enabled ? (
        <Volume2 size={17} aria-hidden="true" />
      ) : (
        <VolumeX size={17} aria-hidden="true" />
      )}
    </motion.button>
  );
};

export const InlineAudioToggle: React.FC = () => {
  const { enabled, toggleAudio } = useSpatialAudio();
  const { t } = useLanguage();

  return (
    <button
      type="button"
      onClick={(e) => toggleAudio(e.currentTarget)}
      aria-pressed={enabled}
      aria-label={enabled ? t.audio.muteAria : t.audio.enableAria}
      title={enabled ? t.audio.inlineOnTitle : t.audio.inlineOffTitle}
      className={`w-10 h-10 rounded-lg border inline-flex items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF721A] ${
        enabled
          ? 'border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#0A0A0A] text-[#0A0A0A] dark:text-white hover:border-[#FF721A] hover:text-[#C94B00] dark:hover:text-[#FF721A]'
          : 'border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#0A0A0A] text-[#737373] hover:border-[#FF721A] hover:text-[#0A0A0A] dark:hover:text-white'
      }`}
    >
      {enabled ? (
        <Volume2 size={15} aria-hidden="true" />
      ) : (
        <VolumeX size={15} aria-hidden="true" />
      )}
    </button>
  );
};
