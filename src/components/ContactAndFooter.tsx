import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Bold,
  Check,
  ChevronDown,
  Italic,
  Mail,
  MessageSquare,
} from 'lucide-react';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from 'motion/react';
import { BRAND_LOGO_URL, PROFILE } from '../data/portfolio';
import { ContactGridBackground } from './ContactGridBackground';
import {
  ARTCRAFT_EASE,
  ParallaxLayer,
  RfButtonFlickerText,
  RfFlickerText,
  SectionChoreoHeader,
} from './MotionPrimitives';
import {
  drawSignatureStrokes,
  SignaturePadModal,
  SignatureStrokes,
} from './SignaturePadModal';
import {
  playCopyConfirm,
  playNavSelect,
} from '../utils/spatialAudio';

type InquiryKind = 'A collaboration' | 'Just a hello';

interface FormErrors {
  email?: string;
  body?: string;
  sign?: string;
}

interface MagneticLinkTooltip {
  platform: string;
  detail: string;
  align?: 'center' | 'end';
}

interface MagneticLinkProps {
  href: string;
  children: React.ReactNode;
  allowMagnetic: boolean;
  prefersReducedMotion: boolean;
  entranceDelay?: number;
  className?: string;
  wrapperClassName?: string;
  tooltip?: MagneticLinkTooltip;
}

const INQUIRY_KINDS: InquiryKind[] = [
  'A collaboration',
  'Just a hello',
];

const VIA_SUGGESTIONS = [
  'LinkedIn',
  'Instagram',
  'Friend or Colleague',
  'Google Search',
  'Direct Visit',
];

const MONTHS_SHORT = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC',
];

function formatLetterDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const mon = MONTHS_SHORT[date.getMonth()] ?? 'JAN';
  const year = date.getFullYear();
  return `${day} ${mon} ${year}`;
}

function formatReceivedStampTime(date: Date): string {
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  });
}

const VALID_EMAIL_RE = /^[^\s@]{1,64}@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/;

function getEmailError(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return 'Please include your reply email address.';
  }
  if (trimmed.length > 160) {
    return 'Email address must be 160 characters or fewer.';
  }
  if (trimmed.includes('..') || !VALID_EMAIL_RE.test(trimmed)) {
    return 'Enter a valid email address (e.g. you@studio.com).';
  }
  return undefined;
}

function getBodyError(value: string): string | undefined {
  if (!value.trim()) {
    return 'Write a short note on what you are making.';
  }
  if (value.length > 6000) {
    return 'Message must be 6000 characters or fewer.';
  }
  return undefined;
}

function getSignError(hasDrawn: boolean, typedName: string): string | undefined {
  if (!hasDrawn && !typedName.trim()) {
    return 'Please sign above or enter your name.';
  }
  if (typedName.trim().length > 120) {
    return 'Name must be 120 characters or fewer.';
  }
  return undefined;
}

function toUnicodeBold(text: string): string {
  return [...text]
    .map((ch) => {
      const code = ch.codePointAt(0);
      if (code === undefined) return ch;
      if (code >= 65 && code <= 90) return String.fromCodePoint(0x1d5d4 + code - 65);
      if (code >= 97 && code <= 122) return String.fromCodePoint(0x1d5ee + code - 97);
      if (code >= 48 && code <= 57) return String.fromCodePoint(0x1d7ec + code - 48);
      return ch;
    })
    .join('');
}

function toUnicodeItalic(text: string): string {
  return [...text]
    .map((ch) => {
      const code = ch.codePointAt(0);
      if (code === undefined) return ch;
      if (code >= 65 && code <= 90) return String.fromCodePoint(0x1d608 + code - 65);
      if (code >= 97 && code <= 122) return String.fromCodePoint(0x1d622 + code - 97);
      return ch;
    })
    .join('');
}

function toUnicodeBoldItalic(text: string): string {
  return [...text]
    .map((ch) => {
      const code = ch.codePointAt(0);
      if (code === undefined) return ch;
      if (code >= 65 && code <= 90) return String.fromCodePoint(0x1d63c + code - 65);
      if (code >= 97 && code <= 122) return String.fromCodePoint(0x1d656 + code - 97);
      if (code >= 48 && code <= 57) return String.fromCodePoint(0x1d7ec + code - 48);
      return ch;
    })
    .join('');
}

function formatInlineEmailText(raw: string): string {
  return raw
    .replace(
      /(^|[\s(>])\*_([^\s_*][^*_]*?[^\s_*]|[^\s_*])_\*(?=$|[\s.,!?;:)<])/gm,
      (_, lead: string, inner: string) => `${lead}${toUnicodeBoldItalic(inner)}`
    )
    .replace(
      /(^|[\s(>])_\*([^\s_*][^*_]*?[^\s_*]|[^\s_*])\*_(?=$|[\s.,!?;:)<])/gm,
      (_, lead: string, inner: string) => `${lead}${toUnicodeBoldItalic(inner)}`
    )
    .replace(
      /(^|[\s(>])\*([^\s*][^*\r\n]*?[^\s*]|[^\s*])\*(?=$|[\s.,!?;:)<])/gm,
      (_, lead: string, inner: string) => `${lead}${toUnicodeBold(inner)}`
    )
    .replace(
      /(^|[\s(>])_([^\s_][^_\r\n]*?[^\s_]|[^\s_])_(?=$|[\s.,!?;:)<])/gm,
      (_, lead: string, inner: string) => `${lead}${toUnicodeItalic(inner)}`
    );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatInlineHtml(raw: string): string {
  const escaped = escapeHtml(raw);
  return escaped
    .replace(
      /(^|[\s(>])\*_([^\s_*][^*_]*?[^\s_*]|[^\s_*])_\*(?=$|[\s.,!?;:)<])/gm,
      (_, lead: string, inner: string) => `${lead}<strong><em>${inner}</em></strong>`
    )
    .replace(
      /(^|[\s(>])_\*([^\s_*][^*_]*?[^\s_*]|[^\s_*])\*_(?=$|[\s.,!?;:)<])/gm,
      (_, lead: string, inner: string) => `${lead}<strong><em>${inner}</em></strong>`
    )
    .replace(
      /(^|[\s(>])\*([^\s*][^*\r\n]*?[^\s*]|[^\s*])\*(?=$|[\s.,!?;:)<])/gm,
      (_, lead: string, inner: string) => `${lead}<strong>${inner}</strong>`
    )
    .replace(
      /(^|[\s(>])_([^\s_][^_\r\n]*?[^\s_]|[^\s_])_(?=$|[\s.,!?;:)<])/gm,
      (_, lead: string, inner: string) => `${lead}<em>${inner}</em>`
    )
    .replace(/\r?\n/g, '<br/>');
}

const MAGNETIC_LINK_SPRING = { stiffness: 320, damping: 20, mass: 0.45 };
const ENTRANCE_SPRING = {
  type: 'spring' as const,
  stiffness: 330,
  damping: 22,
  mass: 0.78,
};
const INTERACTION_SPRING = {
  type: 'spring' as const,
  stiffness: 460,
  damping: 22,
  mass: 0.5,
};

const MagneticLink: React.FC<MagneticLinkProps> = ({
  href,
  children,
  allowMagnetic,
  prefersReducedMotion,
  entranceDelay = 0,
  className = '',
  wrapperClassName = '',
  tooltip,
}) => {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const tooltipId = useId();
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const rawRotate = useMotionValue(0);
  const springX = useSpring(rawX, MAGNETIC_LINK_SPRING);
  const springY = useSpring(rawY, MAGNETIC_LINK_SPRING);
  const springRotate = useSpring(rawRotate, MAGNETIC_LINK_SPRING);

  const showTooltip = Boolean(tooltip) && (isHovered || isFocused) && !isDismissed;

  const handlePointerMove = (e: React.PointerEvent<HTMLAnchorElement>) => {
    if (!allowMagnetic || !linkRef.current) return;
    const rect = linkRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const offsetX = e.clientX - centerX;
    const offsetY = e.clientY - centerY;
    const deltaX = Math.max(-9, Math.min(9, offsetX * 0.34));
    const deltaY = Math.max(-7, Math.min(7, offsetY * 0.34));
    const tilt = Math.max(-2.5, Math.min(2.5, (offsetX / Math.max(rect.width, 1)) * 4));
    rawX.set(deltaX);
    rawY.set(deltaY);
    rawRotate.set(tilt);
  };

  const handlePointerEnter = () => {
    setIsDismissed(false);
    setIsHovered(true);
  };

  const handlePointerReset = () => {
    setIsHovered(false);
    setIsDismissed(false);
    rawX.set(0);
    rawY.set(0);
    rawRotate.set(0);
  };

  const handleFocus = () => {
    setIsDismissed(false);
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setIsDismissed(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLAnchorElement>) => {
    if (e.key === 'Escape' && showTooltip) {
      setIsDismissed(true);
    }
  };

  const isEndAligned = tooltip?.align === 'end';

  return (
    <motion.div
      initial={
        prefersReducedMotion
          ? false
          : { opacity: 0, y: 16, scale: 0.94 }
      }
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 'some' }}
      transition={
        prefersReducedMotion
          ? { duration: 0 }
          : { ...ENTRANCE_SPRING, delay: entranceDelay }
      }
      className={`relative inline-block ${wrapperClassName}`}
    >
      <AnimatePresence>
        {tooltip && showTooltip && (
          <motion.div
            id={tooltipId}
            role="tooltip"
            initial={
              prefersReducedMotion
                ? { opacity: 1 }
                : { opacity: 0, y: 6, scale: 0.95 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 4, scale: 0.96 }
            }
            transition={{
              duration: prefersReducedMotion ? 0 : 0.16,
              ease: [0.16, 1, 0.3, 1],
            }}
            className={`pointer-events-none absolute bottom-full mb-2.5 z-30 ${
              isEndAligned
                ? 'left-1/2 -translate-x-1/2 sm:left-auto sm:right-0 sm:translate-x-0'
                : 'left-1/2 -translate-x-1/2'
            }`}
          >
            <div className="relative px-3 py-2 rounded-lg bg-[#0A0A0A] text-white dark:bg-white dark:text-[#0A0A0A] border border-[#262626] dark:border-[#E5E5E5] shadow-lg whitespace-nowrap">
              <span className="inline-flex items-center gap-1.5 leading-none">
                <span
                  aria-hidden="true"
                  className="inline-block w-1.5 h-1.5 bg-[#FF721A] shrink-0"
                />
                <span className="font-semibold text-[11px] tracking-tight">
                  {tooltip.platform}
                </span>
                <span
                  aria-hidden="true"
                  className="text-[#737373] dark:text-[#A3A3A3]"
                >
                  ·
                </span>
                <span className="font-mono text-[10px] text-[#D4D4D4] dark:text-[#525252]">
                  {tooltip.detail}
                </span>
              </span>
              <span
                aria-hidden="true"
                className={`absolute -bottom-1 w-2 h-2 rotate-45 bg-[#0A0A0A] dark:bg-white border-r border-b border-[#262626] dark:border-[#E5E5E5] ${
                  isEndAligned
                    ? 'left-1/2 -translate-x-1/2 sm:left-auto sm:right-5 sm:translate-x-0'
                    : 'left-1/2 -translate-x-1/2'
                }`}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.a
        ref={linkRef}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-describedby={showTooltip ? tooltipId : undefined}
        onPointerEnter={handlePointerEnter}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerReset}
        onPointerCancel={handlePointerReset}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        whileHover={prefersReducedMotion ? undefined : { scale: 1.03 }}
        whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
        transition={INTERACTION_SPRING}
        style={
          allowMagnetic
            ? { x: springX, y: springY, rotate: springRotate }
            : undefined
        }
        className={className}
      >
        <span className="inline-flex items-center gap-1.5">
          <span>{children}</span>
          <motion.span
            aria-hidden="true"
            animate={
              prefersReducedMotion
                ? undefined
                : isHovered
                  ? { x: 2.5, y: -2.5, scale: 1.1 }
                  : { x: 0, y: 0, scale: 1 }
            }
            transition={INTERACTION_SPRING}
            className="inline-flex items-center"
          >
            <ArrowUpRight size={13} />
          </motion.span>
        </span>
      </motion.a>
    </motion.div>
  );
};

export const ContactAndFooter: React.FC = () => {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const [pointerFine, setPointerFine] = useState(false);

  // Correspondence Letter State
  const [kind, setKind] = useState<InquiryKind>('A collaboration');
  const [email, setEmail] = useState('');
  const [source, setSource] = useState('');
  const [body, setBody] = useState('');
  const [name, setName] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [signatureStrokes, setSignatureStrokes] = useState<SignatureStrokes>([]);
  const [sigModalOpen, setSigModalOpen] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<{
    email: boolean;
    body: boolean;
    sign: boolean;
  }>({ email: false, body: false, sign: false });
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [viaOpen, setViaOpen] = useState(false);
  const [viaActiveIndex, setViaActiveIndex] = useState(-1);

  // Intake Ticket / Stamp State
  const [sentInfo, setSentInfo] = useState<{
    jobId: string;
    receivedAt: string;
    replyBy: string;
    viaLabel: 'Email' | 'WhatsApp';
  } | null>(null);

  const [copiedNotice, setCopiedNotice] = useState<string | null>(null);
  const copyTimerRef = useRef<number | null>(null);
  const viaContainerRef = useRef<HTMLDivElement>(null);
  const viaInputRef = useRef<HTMLInputElement>(null);
  const viaListboxId = useId();
  const emailInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const sigPreviewCanvasRef = useRef<HTMLCanvasElement>(null);
  const sigTriggerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const todayStr = useMemo(() => formatLetterDate(new Date()), []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(pointer: fine)');
    const sync = () => setPointerFine(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const allowMagnetic = pointerFine && !prefersReducedMotion;

  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  // Auto-grow ruled letter textarea cleanly in 30px line increments
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const nextHeight = Math.max(180, el.scrollHeight);
    el.style.height = `${nextHeight}px`;
  }, [body]);

  // Render inline signature preview canvas & re-tint automatically on Light/Dark theme switch
  useEffect(() => {
    const renderPreview = () => {
      const canvas = sigPreviewCanvasRef.current;
      if (!canvas) return;
      const dark = document.documentElement.classList.contains('dark');
      const ink = dark ? '#F5F5F5' : '#1B2440';
      drawSignatureStrokes(canvas, signatureStrokes, ink, 2.2);
    };

    renderPreview();

    const resizeObserver =
      typeof ResizeObserver !== 'undefined' && sigPreviewCanvasRef.current
        ? new ResizeObserver(renderPreview)
        : null;
    if (sigPreviewCanvasRef.current) {
      resizeObserver?.observe(sigPreviewCanvasRef.current);
    }

    const themeObserver = new MutationObserver(renderPreview);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => {
      resizeObserver?.disconnect();
      themeObserver.disconnect();
    };
  }, [signatureStrokes]);

  const hasDrawnSig = signatureStrokes.length > 0;
  const isSigned = hasDrawnSig || name.trim().length > 0;
  const isEmailValid = !getEmailError(email);
  const isBodyValid = !getBodyError(body);
  const isSignValid = !getSignError(hasDrawnSig, name);
  const isFormValid = isEmailValid && isBodyValid && isSignValid;

  const filteredViaSuggestions = useMemo(() => {
    const query = source.trim().toLowerCase();
    if (!query) return VIA_SUGGESTIONS;
    const exact = VIA_SUGGESTIONS.some((item) => item.toLowerCase() === query);
    if (exact) return VIA_SUGGESTIONS;
    return VIA_SUGGESTIONS.filter((item) => item.toLowerCase().includes(query));
  }, [source]);

  const showToast = (label: string) => {
    if (copyTimerRef.current !== null) {
      window.clearTimeout(copyTimerRef.current);
    }
    setCopiedNotice(label);
    copyTimerRef.current = window.setTimeout(() => {
      setCopiedNotice(null);
      copyTimerRef.current = null;
    }, 2400);
  };

  const copyFormattedToClipboard = async (
    plainText: string,
    htmlText: string,
    sourceEl?: HTMLElement | null
  ) => {
    let copied = false;
    try {
      if (
        navigator.clipboard &&
        window.isSecureContext &&
        typeof ClipboardItem !== 'undefined' &&
        typeof navigator.clipboard.write === 'function'
      ) {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/plain': new Blob([plainText], { type: 'text/plain' }),
            'text/html': new Blob([htmlText], { type: 'text/html' }),
          }),
        ]);
        copied = true;
      } else if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(plainText);
        copied = true;
      }
    } catch {
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(plainText);
          copied = true;
        }
      } catch {
        copied = false;
      }
    }

    if (!copied) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = plainText;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        copied = document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch {
        copied = false;
      }
    }

    if (copied && sourceEl) {
      playCopyConfirm(sourceEl);
    }
    return copied;
  };

  const sanitizeLine = (value: string) =>
    value.replace(/[\r\n\u0000-\u001f\u007f]/g, ' ').trim();

  const applyBodyFormat = (marker: '*' | '_') => {
    const el = textareaRef.current;
    if (!el || sentInfo) return;

    const start = el.selectionStart ?? body.length;
    const end = el.selectionEnd ?? body.length;
    const selected = body.slice(start, end);
    const placeholder = marker === '*' ? 'bold text' : 'italic text';

    let nextBody: string;
    let nextSelStart: number;
    let nextSelEnd: number;

    if (selected.length > 0) {
      const wrappedAlready =
        selected.length >= 2 &&
        selected.startsWith(marker) &&
        selected.endsWith(marker);

      if (wrappedAlready) {
        const unwrapped = selected.slice(1, -1);
        nextBody = body.slice(0, start) + unwrapped + body.slice(end);
        nextSelStart = start;
        nextSelEnd = start + unwrapped.length;
      } else {
        nextBody = `${body.slice(0, start)}${marker}${selected}${marker}${body.slice(end)}`;
        nextSelStart = start + 1;
        nextSelEnd = end + 1;
      }
    } else {
      nextBody = `${body.slice(0, start)}${marker}${placeholder}${marker}${body.slice(end)}`;
      nextSelStart = start + 1;
      nextSelEnd = start + 1 + placeholder.length;
    }

    setBody(nextBody);
    if (touched.body || hasSubmitted) {
      setErrors((prev) => ({ ...prev, body: getBodyError(nextBody) }));
    } else if (errors.body && !getBodyError(nextBody)) {
      setErrors((prev) => ({ ...prev, body: undefined }));
    }

    window.requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(nextSelStart, nextSelEnd);
    });
  };

  const getSubmissionFields = () => {
    const cleanEmail = sanitizeLine(email);
    const cleanName = sanitizeLine(name) || '(Hand-signed)';
    const cleanSource = sanitizeLine(source) || 'Direct visit';
    const cleanBody = body.trim();
    const signatureMode =
      hasDrawnSig && sanitizeLine(name)
        ? 'Hand-drawn + Typed name'
        : hasDrawnSig
          ? 'Hand-drawn signature'
          : 'Typed name';
    return { cleanEmail, cleanName, cleanSource, cleanBody, signatureMode };
  };

  const buildFormattedSubmission = (
    channel: 'Email' | 'WhatsApp',
    ticket: { jobId: string; receivedAt: string; replyBy: string }
  ) => {
    const { cleanEmail, cleanName, cleanSource, cleanBody, signatureMode } =
      getSubmissionFields();

    if (channel === 'WhatsApp') {
      return [
        `*PORTFOLIO CORRESPONDENCE — ${PROFILE.name.toUpperCase()}*`,
        '_Project Inquiry & Collaboration Dispatch_',
        '────────────────────────',
        '',
        '*DISPATCH SUMMARY*',
        `• *Reference ID:* ${ticket.jobId}`,
        `• *Submitted:* ${todayStr} · ${ticket.receivedAt} IST`,
        `• *Target Reply:* ${ticket.replyBy}`,
        `• *Channel:* WhatsApp`,
        '',
        '*CORRESPONDENT DETAILS*',
        `• *Subject (RE):* ${kind}`,
        `• *Name:* ${cleanName}`,
        `• *Reply Email:* ${cleanEmail}`,
        `• *Referral (VIA):* ${cleanSource}`,
        `• *Signature:* _${signatureMode}_`,
        '',
        '*MESSAGE*',
        cleanBody,
        '',
        '_Sincerely,_',
        `*${cleanName}*`,
      ].join('\n');
    }

    const formattedMessageBody = formatInlineEmailText(cleanBody);

    return [
      toUnicodeBold(`PORTFOLIO CORRESPONDENCE — ${PROFILE.name.toUpperCase()}`),
      toUnicodeItalic('Project Inquiry & Collaboration Dispatch'),
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '',
      toUnicodeBold('DISPATCH SUMMARY'),
      `• ${toUnicodeBold('Reference ID')}   : ${ticket.jobId}`,
      `• ${toUnicodeBold('Submitted')}      : ${todayStr} · ${ticket.receivedAt} IST`,
      `• ${toUnicodeBold('Target Reply')}   : ${ticket.replyBy}`,
      `• ${toUnicodeBold('Channel')}        : ${channel}`,
      '',
      toUnicodeBold('CORRESPONDENT DETAILS'),
      `• ${toUnicodeBold('Subject (RE)')}   : ${kind}`,
      `• ${toUnicodeBold('Name')}           : ${cleanName}`,
      `• ${toUnicodeBold('Reply Email')}    : ${cleanEmail}`,
      `• ${toUnicodeBold('Referral (VIA)')} : ${cleanSource}`,
      `• ${toUnicodeBold('Signature')}      : ${toUnicodeItalic(signatureMode)}`,
      '',
      toUnicodeBold('MESSAGE'),
      '────────────────────────────────────────────',
      formattedMessageBody,
      '────────────────────────────────────────────',
      '',
      toUnicodeItalic('Sincerely,'),
      toUnicodeBold(cleanName),
      cleanEmail,
    ].join('\r\n');
  };

  const buildFormattedHtmlSubmission = (
    channel: 'Email' | 'WhatsApp',
    ticket: { jobId: string; receivedAt: string; replyBy: string }
  ) => {
    const { cleanEmail, cleanName, cleanSource, cleanBody, signatureMode } =
      getSubmissionFields();

    return [
      `<div style="font-family:Inter,Arial,sans-serif;color:#111111;line-height:1.6;max-width:600px;">`,
      `<p style="margin:0;font-size:14px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">PORTFOLIO CORRESPONDENCE &mdash; ${escapeHtml(PROFILE.name.toUpperCase())}</p>`,
      `<p style="margin:2px 0 12px;font-size:12px;color:#525252;"><em>Project Inquiry &amp; Collaboration Dispatch</em></p>`,
      `<hr style="border:none;border-top:2px solid #111111;margin:0 0 14px;" />`,
      `<p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">DISPATCH SUMMARY</p>`,
      `<p style="margin:0 0 12px;font-size:13px;">`,
      `<strong>Reference ID:</strong> ${escapeHtml(ticket.jobId)}<br/>`,
      `<strong>Submitted:</strong> ${escapeHtml(todayStr)} &middot; ${escapeHtml(ticket.receivedAt)} IST<br/>`,
      `<strong>Target Reply:</strong> ${escapeHtml(ticket.replyBy)}<br/>`,
      `<strong>Channel:</strong> ${escapeHtml(channel)}`,
      `</p>`,
      `<p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">CORRESPONDENT DETAILS</p>`,
      `<p style="margin:0 0 12px;font-size:13px;">`,
      `<strong>Subject (RE):</strong> ${escapeHtml(kind)}<br/>`,
      `<strong>Name:</strong> ${escapeHtml(cleanName)}<br/>`,
      `<strong>Reply Email:</strong> ${escapeHtml(cleanEmail)}<br/>`,
      `<strong>Referral (VIA):</strong> ${escapeHtml(cleanSource)}<br/>`,
      `<strong>Signature:</strong> <em>${escapeHtml(signatureMode)}</em>`,
      `</p>`,
      `<p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">MESSAGE</p>`,
      `<div style="border-top:1px solid #d4d4d4;border-bottom:1px solid #d4d4d4;padding:10px 0;margin:0 0 14px;font-size:14px;">${formatInlineHtml(cleanBody)}</div>`,
      `<p style="margin:0;font-size:13px;"><em>Sincerely,</em><br/><strong>${escapeHtml(cleanName)}</strong><br/>${escapeHtml(cleanEmail)}</p>`,
      `</div>`,
    ].join('');
  };

  const validateLetter = (): boolean => {
    setHasSubmitted(true);
    setTouched({ email: true, body: true, sign: true });

    const emailErr = getEmailError(email);
    const bodyErr = getBodyError(body);
    const signErr = getSignError(hasDrawnSig, name);

    const next: FormErrors = {};
    if (emailErr) next.email = emailErr;
    if (bodyErr) next.body = bodyErr;
    if (signErr) next.sign = signErr;

    setErrors(next);

    if (emailErr) {
      emailInputRef.current?.focus();
    } else if (bodyErr) {
      textareaRef.current?.focus();
    } else if (signErr) {
      nameInputRef.current?.focus();
    }

    return Object.keys(next).length === 0;
  };

  const stampAndLogTicket = (viaLabel: 'Email' | 'WhatsApp') => {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const seq = String((now.getMinutes() % 89) + 10);
    const ticket = {
      jobId: `AP-${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}-${seq}`,
      receivedAt: formatReceivedStampTime(now),
      replyBy: formatLetterDate(tomorrow),
      viaLabel,
    };
    setSentInfo(ticket);
    return ticket;
  };

  const handleSendLetter = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (honeypot.trim().length > 0) return;
    if (!validateLetter()) return;

    playNavSelect(e.currentTarget);
    const ticket = stampAndLogTicket('Email');
    const senderLabel = sanitizeLine(name) || sanitizeLine(email);
    const subject = encodeURIComponent(`[${kind}] ${ticket.jobId} — ${senderLabel}`);
    const mailBody = encodeURIComponent(buildFormattedSubmission('Email', ticket));

    const anchor = document.createElement('a');
    anchor.href = `mailto:${PROFILE.email}?subject=${subject}&body=${mailBody}`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  const handleSendWhatsApp = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (honeypot.trim().length > 0) return;
    if (!validateLetter()) return;

    playNavSelect(e.currentTarget);
    const ticket = stampAndLogTicket('WhatsApp');
    const text = encodeURIComponent(buildFormattedSubmission('WhatsApp', ticket));
    const waUrl = `${PROFILE.whatsappHref}?text=${text}`;

    // Open in a new tab via anchor click so iframe/SPA hosts never navigate into blocked frames
    const anchor = document.createElement('a');
    anchor.href = waUrl;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  const handleKeepCopy = async (e: React.MouseEvent<HTMLButtonElement>) => {
    const activeTicket = sentInfo ?? {
      jobId: 'DRAFT',
      receivedAt: formatReceivedStampTime(new Date()),
      replyBy: formatLetterDate(new Date(Date.now() + 24 * 60 * 60 * 1000)),
      viaLabel: 'Email' as const,
    };
    const channel = activeTicket.viaLabel === 'WhatsApp' ? 'WhatsApp' : 'Email';
    const transcript = buildFormattedSubmission(channel, activeTicket);
    const htmlTranscript = buildFormattedHtmlSubmission(channel, activeTicket);
    const ok = await copyFormattedToClipboard(
      transcript,
      htmlTranscript,
      e.currentTarget
    );
    if (ok) showToast('Formatted copy saved to clipboard');
  };

  const handleResetLetter = () => {
    setSentInfo(null);
    setHoneypot('');
    setViaOpen(false);
    setViaActiveIndex(-1);
    setErrors({});
    setTouched({ email: false, body: false, sign: false });
    setHasSubmitted(false);
  };

  const stubStatus = sentInfo
    ? 'RECEIVED'
    : isFormValid
      ? 'READY TO SEND'
      : isSigned
        ? 'SIGNED · DRAFT'
        : 'BEING WRITTEN';

  return (
    <>
      <section
        id="contact"
        className="relative overflow-hidden snap-start bg-white dark:bg-black pt-12 pb-16 sm:pt-16 sm:pb-20 lg:pt-24 lg:pb-28 border-b border-[#E5E5E5] dark:border-[#262626]"
      >
        <ContactGridBackground />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 space-y-10 sm:space-y-12">
          {/* Editorial Section Header */}
          <div className="max-w-2xl space-y-3">
            <SectionChoreoHeader eyebrow="04. Connection">
              <RfFlickerText
                as="h2"
                mode="heading"
                className="font-display text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#0A0A0A] dark:text-white"
                style={{ textWrap: 'balance' }}
                segments={[
                  { text: "Let's build something " },
                  {
                    text: 'meaningful',
                    className:
                      'font-serif italic font-medium text-[#C94B00] dark:text-[#FF721A]',
                  },
                  { text: ' together.' },
                ]}
              />
            </SectionChoreoHeader>
            <p className="text-sm sm:text-base leading-relaxed text-[#525252] dark:text-[#A3A3A3]">
              Compose a short note on the desk below, sign it by hand or name, and dispatch it
              directly via email or WhatsApp.
            </p>
          </div>

          {/* Correspondence Desk: Bond Letterhead Sheet + Thermal Press Intake Stub */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            {/* Left / Primary: Archival Bond Stationery Sheet */}
            <ParallaxLayer speed={10} className="lg:col-span-8">
              <motion.form
                onSubmit={handleSendLetter}
                noValidate
                aria-label="Project inquiry letter"
                initial={
                  prefersReducedMotion
                    ? false
                    : { opacity: 0, y: 24, filter: 'blur(8px)' }
                }
                whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.72, ease: ARTCRAFT_EASE }}
                className="relative bg-[#F3F2EE]/95 dark:bg-[#111111]/95 backdrop-blur-md text-[#1A1A1A] dark:text-[#F5F5F5] font-mono text-[13px] sm:text-[14px] leading-[30px] border border-[#E2DFD7] dark:border-[#262626] shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_16px_42px_rgba(10,10,10,0.08)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_24px_60px_rgba(0,0,0,0.65)]"
              >
                {/* Honeypot anti-bot trap: hidden from sighted, keyboard, and screen-reader users */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -left-[9999px] top-auto w-px h-px overflow-hidden opacity-0"
                >
                  <label htmlFor="contact-website-trap">Website</label>
                  <input
                    id="contact-website-trap"
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                  />
                </div>

                <div className="relative p-6 sm:p-10 lg:p-12">
                  {/* Letterhead Header */}
                  <header className="relative flex flex-wrap sm:flex-nowrap items-center gap-4 sm:gap-5 pb-5 border-b border-[#1A1A1A]/20 dark:border-white/15">
                    <div className="shrink-0">
                      <img
                        src={BRAND_LOGO_URL}
                        alt={PROFILE.name}
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                        className="h-9 sm:h-10 w-auto object-contain select-none mix-blend-multiply dark:invert dark:hue-rotate-180 dark:mix-blend-screen"
                      />
                    </div>
                    <div className="min-w-0 leading-[1.45]">
                      <p className="font-display text-base sm:text-lg font-semibold tracking-tight text-[#0A0A0A] dark:text-white">
                        {PROFILE.name}
                      </p>
                      <p className="text-[11px] uppercase tracking-[0.06em] text-[#525252] dark:text-[#A3A3A3]">
                        {PROFILE.role}
                      </p>
                      <p className="text-[11px] uppercase tracking-[0.06em] text-[#525252] dark:text-[#A3A3A3] break-words">
                        <a
                          href={`mailto:${PROFILE.email}`}
                          className="hover:text-[#C94B00] dark:hover:text-[#FF721A] hover:underline underline-offset-4 transition-colors"
                        >
                          {PROFILE.email}
                        </a>
                        {' · '}
                        {PROFILE.location}
                      </p>
                    </div>
                  </header>

                  {/* Date + Salutation */}
                  <p className="mt-7 text-xs tracking-[0.04em] text-[#525252] dark:text-[#A3A3A3]">
                    {todayStr}
                  </p>
                  <p className="mt-1.5 text-[15px] font-medium text-[#0A0A0A] dark:text-white">
                    Dear {PROFILE.shortName},
                  </p>

                  {/* RE :: Inquiry Type Radio Selector */}
                  <fieldset className="mt-4 flex flex-wrap items-baseline gap-x-5 gap-y-2 border-0 p-0">
                    <legend className="sr-only">Inquiry subject</legend>
                    <span
                      aria-hidden="true"
                      className="text-[11px] tracking-[0.06em] text-[#525252] dark:text-[#A3A3A3] mr-1"
                    >
                      RE ::
                    </span>
                    {INQUIRY_KINDS.map((option) => {
                      const selected = kind === option;
                      return (
                        <label
                          key={option}
                          className="relative inline-flex items-center gap-1.5 cursor-pointer text-[13px] select-none py-0.5 text-[#1A1A1A] dark:text-[#E5E5E5] hover:text-[#C94B00] dark:hover:text-[#FF721A] transition-colors"
                        >
                          <input
                            type="radio"
                            name="inquiry_kind"
                            value={option}
                            checked={selected}
                            disabled={Boolean(sentInfo)}
                            onChange={() => setKind(option)}
                            className="sr-only peer"
                          />
                          <span
                            aria-hidden="true"
                            className={`font-mono text-xs peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#FF721A] ${
                              selected
                                ? 'text-[#C94B00] dark:text-[#FF721A] font-bold'
                                : 'text-[#525252] dark:text-[#A3A3A3]'
                            }`}
                          >
                            {selected ? '[X]' : '[ ]'}
                          </span>
                          <span className={selected ? 'font-semibold' : ''}>{option}</span>
                        </label>
                      );
                    })}
                  </fieldset>

                  {/* FROM :: Email Field */}
                  <div className="mt-3">
                    <label className="group/field relative flex items-baseline gap-3 pb-0.5">
                      <span className="flex-none min-w-[4.8em] text-[11px] tracking-[0.06em] text-[#525252] dark:text-[#A3A3A3]">
                        FROM ::
                      </span>
                      <input
                        ref={emailInputRef}
                        type="email"
                        name="email"
                        required
                        readOnly={Boolean(sentInfo)}
                        value={email}
                        aria-invalid={Boolean(errors.email)}
                        aria-describedby={errors.email ? 'letter-note-email' : undefined}
                        onChange={(e) => {
                          const nextVal = e.target.value;
                          setEmail(nextVal);
                          if (touched.email || hasSubmitted) {
                            setErrors((prev) => ({ ...prev, email: getEmailError(nextVal) }));
                          } else if (errors.email && !getEmailError(nextVal)) {
                            setErrors((prev) => ({ ...prev, email: undefined }));
                          }
                        }}
                        onBlur={() => {
                          if (sentInfo) return;
                          setTouched((prev) => ({ ...prev, email: true }));
                          setErrors((prev) => ({ ...prev, email: getEmailError(email) }));
                        }}
                        placeholder="you@studio.com"
                        className="flex-1 min-w-0 bg-transparent border-0 outline-none p-0 text-base sm:text-[14px] text-[#0A0A0A] dark:text-white placeholder:text-[#737373] dark:placeholder:text-[#737373]"
                      />
                      {isEmailValid && !errors.email && (
                        <span
                          aria-label="Valid email"
                          className="shrink-0 inline-flex items-center gap-1 text-[10px] tracking-[0.06em] uppercase text-emerald-700 dark:text-emerald-400"
                        >
                          <Check size={11} aria-hidden="true" />
                          <span>valid</span>
                        </span>
                      )}
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none absolute inset-x-0 bottom-0 h-px transition-colors duration-200 ${
                          errors.email
                            ? 'bg-red-600 dark:bg-red-500'
                            : isEmailValid
                              ? 'bg-emerald-600/60 dark:bg-emerald-400/50'
                              : 'bg-[#1A1A1A]/20 dark:bg-white/15 group-focus-within/field:bg-[#FF721A]'
                        }`}
                      />
                    </label>
                    {errors.email && (
                      <p
                        id="letter-note-email"
                        role="status"
                        aria-live="polite"
                        className="mt-1 text-[11px] leading-snug text-red-600 dark:text-red-400"
                      >
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* VIA :: Optional Referral Field with Interactive Suggestions */}
                  <div
                    ref={viaContainerRef}
                    className="relative mt-2.5"
                    onBlur={(e) => {
                      if (!viaContainerRef.current?.contains(e.relatedTarget as Node)) {
                        setViaOpen(false);
                        setViaActiveIndex(-1);
                      }
                    }}
                  >
                    <label className="group/field relative flex items-baseline gap-3 pb-0.5">
                      <span className="flex-none min-w-[4.8em] text-[11px] tracking-[0.06em] text-[#525252] dark:text-[#A3A3A3]">
                        VIA ::
                      </span>
                      <input
                        ref={viaInputRef}
                        type="text"
                        name="source"
                        maxLength={120}
                        autoComplete="off"
                        role="combobox"
                        aria-autocomplete="list"
                        aria-expanded={viaOpen && !sentInfo && filteredViaSuggestions.length > 0}
                        aria-controls={viaListboxId}
                        aria-activedescendant={
                          viaOpen && viaActiveIndex >= 0
                            ? `${viaListboxId}-opt-${viaActiveIndex}`
                            : undefined
                        }
                        readOnly={Boolean(sentInfo)}
                        value={source}
                        onFocus={() => {
                          if (!sentInfo) {
                            setViaOpen(true);
                            setViaActiveIndex(-1);
                          }
                        }}
                        onChange={(e) => {
                          setSource(e.target.value);
                          if (!sentInfo) {
                            setViaOpen(true);
                            setViaActiveIndex(-1);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (sentInfo) return;
                          if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            if (!viaOpen) {
                              setViaOpen(true);
                              setViaActiveIndex(0);
                            } else if (filteredViaSuggestions.length > 0) {
                              setViaActiveIndex((prev) =>
                                prev < filteredViaSuggestions.length - 1 ? prev + 1 : 0
                              );
                            }
                          } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            if (viaOpen && filteredViaSuggestions.length > 0) {
                              setViaActiveIndex((prev) =>
                                prev > 0 ? prev - 1 : filteredViaSuggestions.length - 1
                              );
                            }
                          } else if (
                            e.key === 'Enter' &&
                            viaOpen &&
                            viaActiveIndex >= 0 &&
                            filteredViaSuggestions[viaActiveIndex]
                          ) {
                            e.preventDefault();
                            setSource(filteredViaSuggestions[viaActiveIndex]);
                            setViaOpen(false);
                            setViaActiveIndex(-1);
                          } else if (e.key === 'Escape' && viaOpen) {
                            e.preventDefault();
                            setViaOpen(false);
                            setViaActiveIndex(-1);
                          }
                        }}
                        placeholder="A friend, LinkedIn, Instagram, a search… (optional)"
                        className="flex-1 min-w-0 bg-transparent border-0 outline-none p-0 text-base sm:text-[14px] text-[#0A0A0A] dark:text-white placeholder:text-[#737373] dark:placeholder:text-[#737373]"
                      />
                      {!sentInfo && (
                        <button
                          type="button"
                          aria-label={viaOpen ? 'Hide referral suggestions' : 'Show referral suggestions'}
                          aria-expanded={viaOpen}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            if (viaOpen) {
                              setViaOpen(false);
                              setViaActiveIndex(-1);
                            } else {
                              setViaOpen(true);
                              setViaActiveIndex(-1);
                              viaInputRef.current?.focus();
                            }
                          }}
                          className="shrink-0 inline-flex items-center gap-1 text-[10px] tracking-[0.06em] uppercase text-[#737373] dark:text-[#A3A3A3] hover:text-[#C94B00] dark:hover:text-[#FF721A] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF721A]"
                        >
                          <span>suggestions</span>
                          <ChevronDown
                            size={11}
                            aria-hidden="true"
                            className={`transition-transform duration-150 ${
                              viaOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                      )}
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[#1A1A1A]/20 dark:bg-white/15 group-focus-within/field:bg-[#FF721A] transition-colors duration-200"
                      />
                    </label>

                    <AnimatePresence>
                      {viaOpen && !sentInfo && filteredViaSuggestions.length > 0 && (
                        <motion.ul
                          id={viaListboxId}
                          role="listbox"
                          aria-label="Referral source suggestions"
                          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
                          transition={{ duration: prefersReducedMotion ? 0 : 0.14 }}
                          className="absolute left-0 right-0 top-full mt-1.5 z-30 border border-[#DFDCD4] dark:border-[#2A2A2A] bg-[#F7F7F4] dark:bg-[#181818] shadow-[0_12px_28px_rgba(10,10,10,0.12)] dark:shadow-[0_16px_36px_rgba(0,0,0,0.65)] py-1 max-h-56 overflow-y-auto"
                        >
                          {filteredViaSuggestions.map((option, idx) => {
                            const isSelected =
                              source.trim().toLowerCase() === option.toLowerCase();
                            const isHighlighted = idx === viaActiveIndex;
                            return (
                              <li
                                key={option}
                                id={`${viaListboxId}-opt-${idx}`}
                                role="option"
                                aria-selected={isSelected}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setSource(option);
                                  setViaOpen(false);
                                  setViaActiveIndex(-1);
                                }}
                                onMouseEnter={() => setViaActiveIndex(idx)}
                                className={`flex items-center justify-between gap-2 px-3 py-1.5 text-xs cursor-pointer transition-colors ${
                                  isHighlighted
                                    ? 'bg-[#C94B00]/10 text-[#C94B00] dark:bg-[#FF721A]/15 dark:text-[#FF721A]'
                                    : isSelected
                                      ? 'text-[#C94B00] dark:text-[#FF721A] font-semibold'
                                      : 'text-[#1A1A1A] dark:text-[#E5E5E5] hover:bg-[#1A1A1A]/[0.04] dark:hover:bg-white/[0.05]'
                                }`}
                              >
                                <span>{option}</span>
                                {isSelected && (
                                  <Check size={12} aria-hidden="true" className="shrink-0" />
                                )}
                              </li>
                            );
                          })}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Ruled Stationery Letter Body */}
                  <label
                    className={`block mt-5 letter-ruled-paper ${
                      errors.body ? 'letter-ruled-paper-error' : ''
                    }`}
                  >
                    <span className="sr-only">The letter</span>
                    <textarea
                      ref={textareaRef}
                      name="body"
                      rows={6}
                      maxLength={6000}
                      required
                      readOnly={Boolean(sentInfo)}
                      value={body}
                      aria-invalid={Boolean(errors.body)}
                      aria-describedby={errors.body ? 'letter-note-body' : undefined}
                      onChange={(e) => {
                        const nextVal = e.target.value;
                        setBody(nextVal);
                        if (touched.body || hasSubmitted) {
                          setErrors((prev) => ({ ...prev, body: getBodyError(nextVal) }));
                        } else if (errors.body && !getBodyError(nextVal)) {
                          setErrors((prev) => ({ ...prev, body: undefined }));
                        }
                      }}
                      onBlur={() => {
                        if (sentInfo) return;
                        setTouched((prev) => ({ ...prev, body: true }));
                        setErrors((prev) => ({ ...prev, body: getBodyError(body) }));
                      }}
                      onKeyDown={(e) => {
                        if (sentInfo) return;
                        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
                          e.preventDefault();
                          applyBodyFormat('*');
                        } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
                          e.preventDefault();
                          applyBodyFormat('_');
                        }
                      }}
                      placeholder="What are we making?"
                      className="block w-full min-h-[180px] resize-none overflow-hidden bg-transparent border-0 outline-none p-0 text-base sm:text-[14px] leading-[30px] text-[#0A0A0A] dark:text-white placeholder:text-[#737373] dark:placeholder:text-[#737373]"
                    />
                  </label>
                  <div className="mt-1.5 flex items-center justify-between gap-3">
                    {errors.body ? (
                      <p
                        id="letter-note-body"
                        role="status"
                        aria-live="polite"
                        className="text-[11px] leading-snug text-red-600 dark:text-red-400"
                      >
                        {errors.body}
                      </p>
                    ) : (
                      <span />
                    )}
                    {!sentInfo && (
                      <div className="inline-flex items-center gap-2 shrink-0">
                        <div
                          role="group"
                          aria-label="Message text formatting"
                          className="inline-flex items-center gap-1"
                        >
                          <button
                            type="button"
                            onClick={() => applyBodyFormat('*')}
                            title="Bold selection (*text*, Ctrl+B)"
                            aria-label="Bold selected text"
                            className="inline-flex items-center justify-center w-6 h-6 rounded border border-[#1A1A1A]/15 dark:border-white/15 text-[#525252] dark:text-[#A3A3A3] hover:border-[#FF721A] hover:text-[#C94B00] dark:hover:text-[#FF721A] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF721A]"
                          >
                            <Bold size={11} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => applyBodyFormat('_')}
                            title="Italic selection (_text_, Ctrl+I)"
                            aria-label="Italicize selected text"
                            className="inline-flex items-center justify-center w-6 h-6 rounded border border-[#1A1A1A]/15 dark:border-white/15 text-[#525252] dark:text-[#A3A3A3] hover:border-[#FF721A] hover:text-[#C94B00] dark:hover:text-[#FF721A] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF721A]"
                          >
                            <Italic size={11} aria-hidden="true" />
                          </button>
                        </div>
                        {body.length > 0 && (
                          <span className="text-[10px] tabular-nums tracking-[0.04em] text-[#737373] dark:text-[#737373]">
                            {body.length} / 6000
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Closing + Signature Pad Box */}
                  <p className="mt-6 text-[15px] font-medium text-[#0A0A0A] dark:text-white">
                    Sincerely,
                  </p>

                  <div
                    ref={sigTriggerRef}
                    role="button"
                    tabIndex={sentInfo ? -1 : 0}
                    aria-label="Sign your name"
                    aria-haspopup="dialog"
                    aria-disabled={Boolean(sentInfo)}
                    onClick={() => {
                      if (!sentInfo) setSigModalOpen(true);
                    }}
                    onKeyDown={(e) => {
                      if (!sentInfo && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        setSigModalOpen(true);
                      }
                    }}
                    className={`relative mt-2 h-20 sm:h-24 w-full max-w-md border-b transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FF721A] ${
                      errors.sign
                        ? 'border-red-600 dark:border-red-500'
                        : 'border-[#1A1A1A]/25 dark:border-white/20 hover:border-[#FF721A]'
                    } ${sentInfo ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    <canvas
                      ref={sigPreviewCanvasRef}
                      aria-hidden="true"
                      className="absolute inset-0 block w-full h-full pointer-events-none"
                    />
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none absolute left-0 bottom-2 text-xs text-[#737373] dark:text-[#A3A3A3] transition-opacity duration-200 ${
                        hasDrawnSig ? 'opacity-0' : 'opacity-80'
                      }`}
                    >
                      sign here (click or tap)
                    </span>
                  </div>

                  {/* Typed Name Line + Clear Signature */}
                  <div className="mt-2 max-w-md flex items-baseline justify-between gap-4">
                    <input
                      ref={nameInputRef}
                      type="text"
                      name="name"
                      autoComplete="name"
                      maxLength={120}
                      readOnly={Boolean(sentInfo)}
                      value={name}
                      aria-label="Your name"
                      aria-invalid={Boolean(errors.sign)}
                      aria-describedby={errors.sign ? 'letter-note-sign' : undefined}
                      onChange={(e) => {
                        const nextName = e.target.value;
                        setName(nextName);
                        if (touched.sign || hasSubmitted) {
                          setErrors((prev) => ({
                            ...prev,
                            sign: getSignError(hasDrawnSig, nextName),
                          }));
                        } else if (errors.sign && !getSignError(hasDrawnSig, nextName)) {
                          setErrors((prev) => ({ ...prev, sign: undefined }));
                        }
                      }}
                      onBlur={() => {
                        if (sentInfo) return;
                        setTouched((prev) => ({ ...prev, sign: true }));
                        setErrors((prev) => ({
                          ...prev,
                          sign: getSignError(hasDrawnSig, name),
                        }));
                      }}
                      placeholder="Your name"
                      className="flex-1 min-w-0 bg-transparent border-0 outline-none p-0 text-base sm:text-[13px] text-[#0A0A0A] dark:text-white placeholder:text-[#737373] dark:placeholder:text-[#737373] focus:underline decoration-[#FF721A] underline-offset-4"
                    />

                    {hasDrawnSig && !sentInfo && (
                      <button
                        type="button"
                        onClick={() => {
                          setSignatureStrokes([]);
                          if (touched.sign || hasSubmitted) {
                            setErrors((prev) => ({
                              ...prev,
                              sign: getSignError(false, name),
                            }));
                          }
                        }}
                        className="text-[11px] tracking-[0.06em] uppercase text-[#525252] dark:text-[#A3A3A3] hover:text-[#C94B00] dark:hover:text-[#FF721A] transition-colors shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF721A]"
                      >
                        clear signature
                      </button>
                    )}
                  </div>
                  {errors.sign && (
                    <p
                      id="letter-note-sign"
                      role="status"
                      aria-live="polite"
                      className="mt-1 text-[11px] leading-snug text-red-600 dark:text-red-400"
                    >
                      {errors.sign}
                    </p>
                  )}

                  {/* Rubber Stamp / Seal on Dispatch — flows cleanly below signature on mobile, floats right on sm+ */}
                  <AnimatePresence>
                    {sentInfo && (
                      <motion.div
                        aria-hidden="true"
                        initial={
                          prefersReducedMotion
                            ? { opacity: 0.94 }
                            : { opacity: 0, scale: 1.28, rotate: -13 }
                        }
                        animate={{ opacity: 0.94, scale: 1, rotate: -7 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.34, ease: ARTCRAFT_EASE }}
                        className="pointer-events-none mt-6 ml-auto w-40 sm:mt-0 sm:ml-0 sm:absolute sm:right-10 sm:bottom-28 lg:bottom-32 sm:w-44 select-none z-10"
                      >
                        <div className="border-2 border-[#C94B00] dark:border-[#FF721A] bg-[#C94B00]/[0.05] dark:bg-[#FF721A]/[0.08] p-1 text-[#C94B00] dark:text-[#FF721A]">
                          <div className="border border-current/60 px-2.5 py-1.5 text-center tracking-[0.1em]">
                            <p className="text-[9px] font-bold leading-tight">AADESH PS · PRESS</p>
                            <p className="text-xs sm:text-sm font-extrabold tracking-[0.16em] border-y border-current my-1 py-0.5 leading-tight">
                              DISPATCHED
                            </p>
                            <p className="text-[9px] tabular-nums leading-tight">
                              {sentInfo.jobId} · {sentInfo.viaLabel.toUpperCase()}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Footer Status + Dispatch Buttons */}
                  <div className="mt-8 sm:mt-9 pt-4 border-t border-[#1A1A1A]/15 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <p className="text-[11px] tracking-[0.06em] uppercase leading-relaxed text-[#525252] dark:text-[#A3A3A3]">
                      ONE REPLY, NO NEWSLETTER ·{' '}
                      <span
                        aria-live="polite"
                        className={
                          sentInfo || isFormValid || isSigned
                            ? 'text-[#C94B00] dark:text-[#FF721A] font-semibold'
                            : ''
                        }
                      >
                        {sentInfo
                          ? 'RECEIVED'
                          : isFormValid
                            ? 'READY TO SEND'
                            : isSigned
                              ? 'SIGNED'
                              : 'NOT YET SIGNED'}
                      </span>
                    </p>

                    <div className="flex flex-wrap items-center gap-3">
                      {!sentInfo ? (
                        <>
                          <motion.button
                            type="submit"
                            whileHover={prefersReducedMotion ? undefined : { y: -1.5 }}
                            whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
                            className="rf-btn-flicker min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2 rounded-lg bg-[#0A0A0A] text-white dark:bg-[#FF721A] dark:text-[#0A0A0A] text-xs font-bold tracking-[0.04em] hover:bg-[#FF721A] hover:text-[#0A0A0A] dark:hover:bg-[#E56212] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF721A]"
                          >
                            <Mail size={14} aria-hidden="true" />
                            <RfButtonFlickerText text="Send it" />
                          </motion.button>

                          <motion.button
                            type="button"
                            onClick={handleSendWhatsApp}
                            whileHover={prefersReducedMotion ? undefined : { y: -1.5 }}
                            whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
                            className="rf-btn-flicker min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-[#1A1A1A]/25 dark:border-white/20 bg-white/60 dark:bg-[#1A1A1A] text-xs font-semibold text-[#0A0A0A] dark:text-white hover:border-[#FF721A] hover:text-[#C94B00] dark:hover:text-[#FF721A] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF721A]"
                          >
                            <MessageSquare size={14} aria-hidden="true" />
                            <RfButtonFlickerText text="WhatsApp" />
                          </motion.button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={handleKeepCopy}
                            className="min-h-[40px] px-2 text-[11px] tracking-[0.06em] uppercase underline underline-offset-4 text-[#0A0A0A] dark:text-white hover:text-[#C94B00] dark:hover:text-[#FF721A] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF721A]"
                          >
                            Keep a copy
                          </button>
                          <button
                            type="button"
                            onClick={handleResetLetter}
                            className="min-h-[40px] px-4 py-2 rounded-lg border border-[#1A1A1A]/25 dark:border-white/20 text-[11px] tracking-[0.06em] uppercase text-[#525252] dark:text-[#A3A3A3] hover:text-[#0A0A0A] dark:hover:text-white hover:border-[#FF721A] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF721A]"
                          >
                            Write another
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                </div>
              </motion.form>
            </ParallaxLayer>

            {/* Right: Thermal Press Job Ticket Stub */}
            <ParallaxLayer speed={18} className="lg:col-span-4 lg:sticky lg:top-24">
              <motion.aside
                aria-label="Job ticket"
                initial={
                  prefersReducedMotion
                    ? false
                    : { opacity: 0, y: 26, filter: 'blur(6px)' }
                }
                whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.75, delay: prefersReducedMotion ? 0 : 0.1, ease: ARTCRAFT_EASE }}
                className={`w-full max-w-[330px] mx-auto lg:max-w-none bg-[#F7F7F4]/95 dark:bg-[#161616]/95 backdrop-blur-md text-[#1A1A1A] dark:text-[#F5F5F5] font-mono uppercase tracking-[0.04em] p-6 border border-[#E5E3DC] dark:border-[#2A2A2A] shadow-[0_6px_22px_rgba(10,10,10,0.08)] dark:shadow-[0_18px_40px_rgba(0,0,0,0.55)] transition-transform duration-300 ${
                  prefersReducedMotion ? '' : 'lg:rotate-[1deg] hover:lg:rotate-0'
                }`}
              >
                <p className="text-xs font-semibold text-[#0A0A0A] dark:text-white">
                  AADESH PS :: PRESS
                </p>
                <p className="mt-0.5 pb-2.5 text-[10px] text-[#525252] dark:text-[#A3A3A3] border-b border-dashed border-[#1A1A1A]/25 dark:border-white/20">
                  INTAKE · COUNTER 01
                </p>

                <dl className="mt-3 text-[11px] leading-[1.6]">
                  <div className="flex items-baseline justify-between gap-2 py-1.5 border-b border-dotted border-[#1A1A1A]/20 dark:border-white/15">
                    <dt className="text-[#525252] dark:text-[#A3A3A3]">JOB</dt>
                    <dd
                      className={`text-right tabular-nums ${
                        sentInfo
                          ? 'text-[#0A0A0A] dark:text-white font-semibold'
                          : 'text-[#737373] dark:text-[#737373]'
                      }`}
                    >
                      {sentInfo ? sentInfo.jobId : '——'}
                    </dd>
                  </div>

                  <div className="flex items-baseline justify-between gap-2 py-1.5 border-b border-dotted border-[#1A1A1A]/20 dark:border-white/15">
                    <dt className="text-[#525252] dark:text-[#A3A3A3]">RECEIVED</dt>
                    <dd
                      className={`text-right tabular-nums ${
                        sentInfo
                          ? 'text-[#0A0A0A] dark:text-white font-semibold'
                          : 'text-[#737373] dark:text-[#737373]'
                      }`}
                    >
                      {sentInfo ? sentInfo.receivedAt : '——'}
                    </dd>
                  </div>

                  <div className="flex items-baseline justify-between gap-2 py-1.5 border-b border-dotted border-[#1A1A1A]/20 dark:border-white/15">
                    <dt className="text-[#525252] dark:text-[#A3A3A3]">REPLY BY</dt>
                    <dd
                      className={`text-right tabular-nums ${
                        sentInfo
                          ? 'text-[#0A0A0A] dark:text-white font-semibold'
                          : 'text-[#737373] dark:text-[#737373]'
                      }`}
                    >
                      {sentInfo ? sentInfo.replyBy : '——'}
                    </dd>
                  </div>

                  <div className="flex items-baseline justify-between gap-2 py-1.5 border-b border-dotted border-[#1A1A1A]/20 dark:border-white/15">
                    <dt className="text-[#525252] dark:text-[#A3A3A3]">STATUS</dt>
                    <dd
                      className={`text-right font-semibold ${
                        sentInfo || isSigned
                          ? 'text-[#C94B00] dark:text-[#FF721A]'
                          : 'text-[#0A0A0A] dark:text-white'
                      }`}
                    >
                      {stubStatus}
                    </dd>
                  </div>

                  <div className="flex items-baseline justify-between gap-2 py-1.5 border-b border-dotted border-[#1A1A1A]/20 dark:border-white/15">
                    <dt className="text-[#525252] dark:text-[#A3A3A3]">FILE UNDER</dt>
                    <dd className="text-right font-semibold text-[#0A0A0A] dark:text-white">
                      {kind.toUpperCase()}
                    </dd>
                  </div>
                </dl>

                <span
                  aria-hidden="true"
                  className="letter-stub-bars block h-[26px] mt-4 text-[#1A1A1A] dark:text-[#E5E5E5]"
                />
                <p className="mt-2 text-[10px] text-[#525252] dark:text-[#A3A3A3]">
                  KEEP THIS HALF
                </p>
              </motion.aside>
            </ParallaxLayer>
          </div>
        </div>
      </section>

      {/* Interactive Signature Slip Modal */}
      <SignaturePadModal
        open={sigModalOpen}
        initialStrokes={signatureStrokes}
        onClose={() => {
          setSigModalOpen(false);
          window.requestAnimationFrame(() => sigTriggerRef.current?.focus());
        }}
        onDone={(strokes) => {
          setSignatureStrokes(strokes);
          const nextSignErr = getSignError(strokes.length > 0, name);
          if (strokes.length > 0) {
            setErrors((prev) => ({ ...prev, sign: nextSignErr }));
          } else if (touched.sign || hasSubmitted) {
            setErrors((prev) => ({ ...prev, sign: nextSignErr }));
          }
          setSigModalOpen(false);
          window.requestAnimationFrame(() => sigTriggerRef.current?.focus());
        }}
      />

      {/* Quiet Editorial Footer with bottom clearance for floating Back-to-Top button */}
      <footer className="snap-end pt-10 pb-20 sm:pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-center sm:text-left text-[#525252] dark:text-[#A3A3A3]">
          <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-3 sm:gap-4">
            <a href="#top" aria-label={PROFILE.name} className="inline-flex items-center shrink-0">
              <img
                src={BRAND_LOGO_URL}
                alt={PROFILE.name}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                className="h-8 w-auto object-contain select-none mix-blend-multiply dark:invert dark:hue-rotate-180 dark:mix-blend-screen transition-[filter] duration-200"
              />
            </a>
            <p>
              © 2026{' '}
              <strong className="font-bold text-[#0A0A0A] dark:text-white">
                Aadesh PS
              </strong>
              {' · Crafted with precision'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-5 sm:gap-6">
            <MagneticLink
              href={PROFILE.linkedinHref}
              allowMagnetic={allowMagnetic}
              prefersReducedMotion={prefersReducedMotion}
              entranceDelay={0.05}
              tooltip={{ platform: 'LinkedIn', detail: 'in/aadeshps27' }}
              className="inline-flex items-center py-1.5 px-2 -mx-2 rounded-md hover:text-[#C94B00] dark:hover:text-[#FF721A] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF721A]"
            >
              LinkedIn
            </MagneticLink>
            <MagneticLink
              href={PROFILE.instagramHref}
              allowMagnetic={allowMagnetic}
              prefersReducedMotion={prefersReducedMotion}
              entranceDelay={0.14}
              tooltip={{
                platform: 'Instagram',
                detail: '@_aadeshps',
                align: 'end',
              }}
              className="inline-flex items-center py-1.5 px-2 -mx-2 rounded-md hover:text-[#C94B00] dark:hover:text-[#FF721A] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF721A]"
            >
              Instagram
            </MagneticLink>
          </div>
        </div>
      </footer>

      {/* Brief 'Copied!' Toast Notification */}
      <AnimatePresence>
        {copiedNotice && (
          <motion.div
            key="email-copied-toast"
            role="status"
            aria-live="polite"
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-4 left-4 right-16 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 sm:bottom-6 z-40 pointer-events-none flex justify-start sm:justify-center"
          >
            <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#0A0A0A] text-white dark:bg-white dark:text-[#0A0A0A] border border-[#262626] dark:border-[#E5E5E5] shadow-lg text-xs font-semibold">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-[#FF721A] text-[#0A0A0A] shrink-0">
                <Check size={12} strokeWidth={2.5} aria-hidden="true" />
              </span>
              <span>Copied!</span>
              <span className="text-[#A3A3A3] dark:text-[#525252] font-mono font-normal truncate max-w-[200px] sm:max-w-none">
                {copiedNotice}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
