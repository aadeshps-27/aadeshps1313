import React, { useEffect } from 'react';
import {
  smoothScrollBy,
  smoothScrollToSectionId,
  smoothScrollToY,
} from '../utils/smoothScroll';
import { playNavSelect } from '../utils/spatialAudio';

interface SmoothKeyboardNavigationProps {
  disabled?: boolean;
}

const SECTION_IDS = ['about', 'work', 'experience', 'contact'] as const;

function isEditableOrWidget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  if (el.isContentEditable) return true;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'CANVAS') {
    return true;
  }
  const widget = el.closest(
    'input, textarea, select, [contenteditable="true"], [role="slider"], [role="spinbutton"], [role="tablist"], [role="tab"], [role="radiogroup"], [role="radio"], [role="listbox"], [role="menu"], [role="menuitem"], [role="scrollbar"], [role="dialog"], dialog'
  );
  return Boolean(widget);
}

function isInteractiveControl(el: Element | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  if (el.id === 'main' || el === document.body || el === document.documentElement) {
    return false;
  }
  const tag = el.tagName;
  if (tag === 'A' || tag === 'BUTTON' || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
    return true;
  }
  return Boolean(el.closest('a, button, [role], [tabindex]:not(#main)'));
}

function getCurrentSectionIndex(): number {
  const vh = window.innerHeight || 800;
  const scrollY = window.scrollY;
  const docH = Math.max(
    document.documentElement.scrollHeight,
    document.body.scrollHeight,
    vh + 1
  );

  if (scrollY + vh >= docH - 64) {
    return SECTION_IDS.length - 1;
  }

  const markerY = vh * 0.38;
  let currentIdx = 0;
  for (let i = 0; i < SECTION_IDS.length; i++) {
    const el = document.getElementById(SECTION_IDS[i]);
    if (!el) continue;
    if (el.getBoundingClientRect().top <= markerY) {
      currentIdx = i;
    }
  }
  return currentIdx;
}

export const SmoothKeyboardNavigation: React.FC<SmoothKeyboardNavigationProps> = ({
  disabled = false,
}) => {
  useEffect(() => {
    if (disabled || typeof window === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;

      // Never intercept when any dialog / modal / signature pad is open
      if (document.querySelector('[role="dialog"], dialog[open]')) {
        return;
      }

      const activeEl = document.activeElement;
      if (isEditableOrWidget(e.target) || isEditableOrWidget(activeEl)) {
        return;
      }

      const vh = window.innerHeight || 800;
      const arrowStep = Math.max(130, Math.min(220, Math.round(vh * 0.22)));
      const pageStep = Math.max(360, Math.round(vh * 0.82));

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          smoothScrollBy(arrowStep);
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          smoothScrollBy(-arrowStep);
          break;
        }
        case 'PageDown': {
          e.preventDefault();
          smoothScrollBy(pageStep);
          break;
        }
        case 'PageUp': {
          e.preventDefault();
          smoothScrollBy(-pageStep);
          break;
        }
        case 'Home': {
          e.preventDefault();
          smoothScrollToY(0);
          break;
        }
        case 'End': {
          e.preventDefault();
          const maxDocH = Math.max(
            document.documentElement.scrollHeight,
            document.body.scrollHeight
          );
          smoothScrollToY(maxDocH);
          break;
        }
        case 'ArrowRight': {
          if (isInteractiveControl(activeEl)) return;
          const idx = getCurrentSectionIndex();
          const nextIdx = Math.min(SECTION_IDS.length - 1, idx + 1);
          if (nextIdx !== idx) {
            e.preventDefault();
            playNavSelect(document.getElementById(SECTION_IDS[nextIdx]));
            smoothScrollToSectionId(SECTION_IDS[nextIdx]);
          }
          break;
        }
        case 'ArrowLeft': {
          if (isInteractiveControl(activeEl)) return;
          const idx = getCurrentSectionIndex();
          const prevIdx = Math.max(0, idx - 1);
          if (prevIdx !== idx) {
            e.preventDefault();
            playNavSelect(document.getElementById(SECTION_IDS[prevIdx]));
            smoothScrollToSectionId(SECTION_IDS[prevIdx]);
          } else if (window.scrollY > 40) {
            e.preventDefault();
            smoothScrollToY(0);
          }
          break;
        }
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [disabled]);

  return null;
};
