import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Check, Copy, Mail, MessageSquare } from 'lucide-react';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from 'motion/react';
import { PROFILE } from '../data/portfolio';
import { ARTCRAFT_EASE, ParallaxLayer, SectionChoreoHeader } from './MotionPrimitives';
import { LiveClock } from './LiveClock';

interface FormErrors {
  name?: string;
  email?: string;
  message?: string;
}

interface MagneticLinkProps {
  href: string;
  children: React.ReactNode;
  allowMagnetic: boolean;
  prefersReducedMotion: boolean;
  entranceDelay?: number;
  className?: string;
  wrapperClassName?: string;
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

const CHANNEL_LIST_VARIANTS = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.085,
      delayChildren: 0.08,
    },
  },
};

const CHANNEL_ITEM_VARIANTS = {
  hidden: { opacity: 0, y: 26, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: ENTRANCE_SPRING,
  },
};

const MagneticLink: React.FC<MagneticLinkProps> = ({
  href,
  children,
  allowMagnetic,
  prefersReducedMotion,
  entranceDelay = 0,
  className = '',
  wrapperClassName = '',
}) => {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const rawRotate = useMotionValue(0);
  const springX = useSpring(rawX, MAGNETIC_LINK_SPRING);
  const springY = useSpring(rawY, MAGNETIC_LINK_SPRING);
  const springRotate = useSpring(rawRotate, MAGNETIC_LINK_SPRING);

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
    setIsHovered(true);
  };

  const handlePointerReset = () => {
    setIsHovered(false);
    rawX.set(0);
    rawY.set(0);
    rawRotate.set(0);
  };

  return (
    <motion.div
      initial={
        prefersReducedMotion
          ? false
          : { opacity: 0, y: 20, scale: 0.92, rotate: -1.5 }
      }
      whileInView={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
      viewport={{ once: true, amount: 'some' }}
      transition={
        prefersReducedMotion
          ? { duration: 0 }
          : { ...ENTRANCE_SPRING, delay: entranceDelay }
      }
      className={`inline-block ${wrapperClassName}`}
    >
      <motion.a
        ref={linkRef}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onPointerEnter={handlePointerEnter}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerReset}
        onPointerCancel={handlePointerReset}
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
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [sentNotice, setSentNotice] = useState<string | null>(null);
  const copyTimerRef = useRef<number | null>(null);

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

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};
    if (!name.trim()) nextErrors.name = 'Please enter your name.';
    if (!email.trim()) {
      nextErrors.email = 'Please enter your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = 'Please enter a valid email address.';
    }
    if (!message.trim()) nextErrors.message = 'Please share a brief note about your project.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleCopyEmail = async () => {
    let copied = false;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(PROFILE.email);
        copied = true;
      }
    } catch {
      copied = false;
    }

    if (!copied) {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = PROFILE.email;
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

    if (copied) {
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
      setCopiedEmail(true);
      copyTimerRef.current = window.setTimeout(() => {
        setCopiedEmail(false);
        copyTimerRef.current = null;
      }, 2400);
    }
  };

  const handleSubmitEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const subject = encodeURIComponent(`Portfolio Inquiry from ${name.trim()}`);
    const body = encodeURIComponent(
      `Hi Aadesh,\n\nName: ${name.trim()}\nEmail: ${email.trim()}\n\n${message.trim()}`
    );

    window.location.href = `mailto:${PROFILE.email}?subject=${subject}&body=${body}`;
    setSentNotice('Opened your default email client with your prepared inquiry.');
  };

  const handleSendWhatsApp = () => {
    if (!validate()) return;
    const text = encodeURIComponent(
      `Hi Aadesh, I'm ${name.trim()} (${email.trim()}). ${message.trim()}`
    );
    window.location.href = `${PROFILE.whatsappHref}?text=${text}`;
    setSentNotice('Redirecting to WhatsApp with your message.');
  };

  return (
    <>
      <section id="contact" className="snap-start py-14 sm:py-20 lg:py-28 border-b border-[#E5E5E5] dark:border-[#262626]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            {/* Left Column: Direct Channels */}
            <ParallaxLayer speed={10} className="lg:col-span-5">
              <motion.div
                initial={
                  prefersReducedMotion
                    ? false
                    : { opacity: 0, y: 24, filter: 'blur(8px)' }
                }
                whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.75, ease: ARTCRAFT_EASE }}
                className="space-y-6 sm:space-y-8"
              >
              <div className="space-y-3 sm:space-y-4">
                <SectionChoreoHeader eyebrow="04. Connection">
                  <h2
                    className="font-display text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#0A0A0A] dark:text-white"
                    style={{ textWrap: 'balance' }}
                  >
                    Let&apos;s build something{' '}
                    <span className="font-serif italic font-medium text-[#C94B00] dark:text-[#FF721A]">
                      meaningful
                    </span>{' '}
                    together.
                  </h2>
                </SectionChoreoHeader>
                <p className="text-base leading-relaxed text-[#525252] dark:text-[#A3A3A3]">
                  Have a web application, brand system, or applied electronics collaboration in
                  mind? Reach out directly via email or WhatsApp.
                </p>
              </div>

              <motion.div
                variants={prefersReducedMotion ? undefined : CHANNEL_LIST_VARIANTS}
                initial={prefersReducedMotion ? false : 'hidden'}
                whileInView="visible"
                viewport={{ once: true, amount: 'some' }}
                className="divide-y divide-[#E5E5E5] dark:divide-[#262626] border-y border-[#E5E5E5] dark:border-[#262626]"
              >
                <motion.div
                  variants={prefersReducedMotion ? undefined : CHANNEL_ITEM_VARIANTS}
                  className="py-4 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <motion.span
                        aria-hidden="true"
                        initial={prefersReducedMotion ? false : { scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true, amount: 'some' }}
                        transition={{ ...ENTRANCE_SPRING, delay: 0.22 }}
                        className="inline-block w-1.5 h-1.5 bg-[#FF721A]"
                      />
                      <p className="text-xs text-[#525252] dark:text-[#A3A3A3]">Email</p>
                    </div>
                    <motion.a
                      href={`mailto:${PROFILE.email}`}
                      whileHover={prefersReducedMotion ? undefined : { x: 4 }}
                      whileTap={prefersReducedMotion ? undefined : { scale: 0.985 }}
                      transition={INTERACTION_SPRING}
                      className="group/email relative inline-block max-w-full font-medium text-sm sm:text-base text-[#0A0A0A] dark:text-white hover:text-[#C94B00] dark:hover:text-[#FF721A] transition-colors truncate"
                    >
                      <span>{PROFILE.email}</span>
                      <span
                        aria-hidden="true"
                        className="block h-[1.5px] w-full bg-[#FF721A] origin-left scale-x-0 group-hover/email:scale-x-100 group-focus-visible/email:scale-x-100 transition-transform duration-300 ease-out"
                      />
                    </motion.a>
                  </div>
                  <motion.button
                    type="button"
                    onClick={handleCopyEmail}
                    whileHover={prefersReducedMotion ? undefined : { y: -2, scale: 1.03 }}
                    whileTap={prefersReducedMotion ? undefined : { scale: 0.94 }}
                    transition={INTERACTION_SPRING}
                    aria-label="Copy email address"
                    className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-lg border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#0A0A0A] text-xs font-semibold text-[#0A0A0A] dark:text-white hover:border-[#FF721A] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF721A]"
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {copiedEmail ? (
                        <motion.span
                          key="copied"
                          initial={prefersReducedMotion ? false : { scale: 0.75, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={prefersReducedMotion ? { opacity: 0 } : { scale: 0.75, opacity: 0 }}
                          transition={INTERACTION_SPRING}
                          className="inline-flex items-center gap-1.5"
                        >
                          <Check size={14} className="text-[#C94B00] dark:text-[#FF721A]" aria-hidden="true" />
                          <span>Copied!</span>
                        </motion.span>
                      ) : (
                        <motion.span
                          key="copy"
                          initial={prefersReducedMotion ? false : { scale: 0.75, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={prefersReducedMotion ? { opacity: 0 } : { scale: 0.75, opacity: 0 }}
                          transition={INTERACTION_SPRING}
                          className="inline-flex items-center gap-1.5"
                        >
                          <Copy size={14} aria-hidden="true" />
                          <span>Copy Email</span>
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </motion.div>

                <motion.a
                  variants={prefersReducedMotion ? undefined : CHANNEL_ITEM_VARIANTS}
                  href={PROFILE.whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={prefersReducedMotion ? undefined : { x: 4 }}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.99 }}
                  transition={INTERACTION_SPRING}
                  className="py-4 flex items-center justify-between gap-4 group"
                >
                  <div>
                    <p className="text-xs text-[#525252] dark:text-[#A3A3A3]">WhatsApp</p>
                    <p className="font-mono text-sm sm:text-base tabular-nums font-medium text-[#0A0A0A] dark:text-white group-hover:text-[#C94B00] dark:group-hover:text-[#FF721A] transition-colors">
                      {PROFILE.whatsappDisplay}
                    </p>
                  </div>
                  <ArrowUpRight
                    size={16}
                    className="text-[#525252] dark:text-[#A3A3A3] group-hover:text-[#C94B00] dark:group-hover:text-[#FF721A] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                    aria-hidden="true"
                  />
                </motion.a>

                <motion.div
                  variants={prefersReducedMotion ? undefined : CHANNEL_ITEM_VARIANTS}
                  className="py-4 flex flex-wrap items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-xs text-[#525252] dark:text-[#A3A3A3]">Social</p>
                    <p className="text-xs text-[#737373] dark:text-[#737373] mt-0.5">
                      Connect directly
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <MagneticLink
                      href={PROFILE.linkedinHref}
                      allowMagnetic={allowMagnetic}
                      prefersReducedMotion={prefersReducedMotion}
                      entranceDelay={0.2}
                      className="inline-flex items-center justify-center min-h-[40px] px-3.5 py-2 rounded-lg border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#0A0A0A] text-xs font-semibold text-[#0A0A0A] dark:text-white hover:border-[#FF721A] hover:text-[#C94B00] dark:hover:text-[#FF721A] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF721A]"
                    >
                      LinkedIn
                    </MagneticLink>
                    <MagneticLink
                      href={PROFILE.instagramHref}
                      allowMagnetic={allowMagnetic}
                      prefersReducedMotion={prefersReducedMotion}
                      entranceDelay={0.28}
                      className="inline-flex items-center justify-center min-h-[40px] px-3.5 py-2 rounded-lg border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#0A0A0A] text-xs font-semibold text-[#0A0A0A] dark:text-white hover:border-[#FF721A] hover:text-[#C94B00] dark:hover:text-[#FF721A] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF721A]"
                    >
                      Instagram
                    </MagneticLink>
                  </div>
                </motion.div>

                <motion.div
                  variants={prefersReducedMotion ? undefined : CHANNEL_ITEM_VARIANTS}
                  className="py-4 flex items-center justify-between gap-4"
                >
                  <div>
                    <p className="text-xs text-[#525252] dark:text-[#A3A3A3]">
                      Local Time · {PROFILE.location}
                    </p>
                    <LiveClock className="text-sm sm:text-base font-medium text-[#0A0A0A] dark:text-white" />
                  </div>
                  <span className="font-mono text-xs text-[#C94B00] dark:text-[#FF721A]">
                    UTC+5:30
                  </span>
                </motion.div>
              </motion.div>
              </motion.div>
            </ParallaxLayer>

            {/* Right Column: Interactive Inquiry Composer */}
            <ParallaxLayer speed={20} className="lg:col-span-7">
              <motion.div
                initial={
                  prefersReducedMotion
                    ? false
                    : { opacity: 0, y: 24, filter: 'blur(8px)' }
                }
                whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.78, delay: prefersReducedMotion ? 0 : 0.1, ease: ARTCRAFT_EASE }}
              >
              <form
                onSubmit={handleSubmitEmail}
                noValidate
                className="p-5 sm:p-7 lg:p-9 rounded-2xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#0A0A0A] space-y-5 sm:space-y-6"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label
                      htmlFor="contact-name"
                      className="block text-xs font-semibold text-[#0A0A0A] dark:text-white"
                    >
                      Your Name
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                      }}
                      placeholder="Aarav Menon"
                      className={`w-full px-4 py-3 rounded-lg bg-white dark:bg-[#141414] border text-sm text-[#0A0A0A] dark:text-white placeholder:text-[#737373] focus:outline-none focus:border-[#FF721A] transition-colors ${
                        errors.name
                          ? 'border-red-600 dark:border-red-500'
                          : 'border-[#E5E5E5] dark:border-[#262626]'
                      }`}
                    />
                    {errors.name && (
                      <p className="text-xs text-red-600 dark:text-red-400">{errors.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="contact-email"
                      className="block text-xs font-semibold text-[#0A0A0A] dark:text-white"
                    >
                      Email Address
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                      }}
                      placeholder="you@example.com"
                      className={`w-full px-4 py-3 rounded-lg bg-white dark:bg-[#141414] border text-sm text-[#0A0A0A] dark:text-white placeholder:text-[#737373] focus:outline-none focus:border-[#FF721A] transition-colors ${
                        errors.email
                          ? 'border-red-600 dark:border-red-500'
                          : 'border-[#E5E5E5] dark:border-[#262626]'
                      }`}
                    />
                    {errors.email && (
                      <p className="text-xs text-red-600 dark:text-red-400">{errors.email}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="contact-message"
                    className="block text-xs font-semibold text-[#0A0A0A] dark:text-white"
                  >
                    Project Brief
                  </label>
                  <textarea
                    id="contact-message"
                    rows={4}
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      if (errors.message) setErrors((prev) => ({ ...prev, message: undefined }));
                    }}
                    placeholder="Share your goals, timeline, or hardware/software requirements..."
                    className={`w-full px-4 py-3 rounded-lg bg-white dark:bg-[#141414] border text-sm text-[#0A0A0A] dark:text-white placeholder:text-[#737373] focus:outline-none focus:border-[#FF721A] transition-colors resize-y ${
                      errors.message
                        ? 'border-red-600 dark:border-red-500'
                        : 'border-[#E5E5E5] dark:border-[#262626]'
                    }`}
                  />
                  {errors.message && (
                    <p className="text-xs text-red-600 dark:text-red-400">{errors.message}</p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 pt-1">
                  <button
                    type="submit"
                    className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#FF721A] text-[#0A0A0A] text-sm font-bold hover:bg-[#E56212] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF721A]"
                  >
                    <Mail size={16} aria-hidden="true" />
                    <span>Compose Email</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSendWhatsApp}
                    className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg border border-[#E5E5E5] dark:border-[#262626] bg-white dark:bg-[#141414] text-sm font-semibold text-[#0A0A0A] dark:text-white hover:border-[#FF721A] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF721A]"
                  >
                    <MessageSquare size={16} aria-hidden="true" />
                    <span>Send via WhatsApp</span>
                  </button>
                </div>

                {sentNotice && (
                  <p
                    role="status"
                    className="text-xs font-medium text-[#0A0A0A] dark:text-white pt-1"
                  >
                    {sentNotice}
                  </p>
                )}
              </form>
              </motion.div>
            </ParallaxLayer>
          </div>
        </div>
      </section>

      {/* Quiet Editorial Footer with bottom clearance for floating Back-to-Top button */}
      <footer className="snap-end pt-10 pb-20 sm:pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-center sm:text-left text-[#525252] dark:text-[#A3A3A3]">
          <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-3 sm:gap-4">
            <a href="#top" aria-label={PROFILE.name} className="inline-flex items-center shrink-0">
              <img
                src="/assets/aistudio/Black_Blue_and_White_Gradient_Modern_Business_LinkedIn_Banner__3__1be4a1fb.png"
                alt={PROFILE.name}
                referrerPolicy="no-referrer"
                className="h-8 w-auto object-contain select-none mix-blend-multiply dark:invert dark:hue-rotate-180 dark:mix-blend-screen transition-[filter] duration-200"
              />
            </a>
            <p>
              © 2026{' '}
              <strong className="font-bold text-[#0A0A0A] dark:text-white">
                Aadesh PS
              </strong>
              . Crafted with precision.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-5 sm:gap-6">
            <MagneticLink
              href={PROFILE.linkedinHref}
              allowMagnetic={allowMagnetic}
              prefersReducedMotion={prefersReducedMotion}
              entranceDelay={0.05}
              className="inline-flex items-center py-1.5 px-2 -mx-2 rounded-md hover:text-[#C94B00] dark:hover:text-[#FF721A] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF721A]"
            >
              LinkedIn
            </MagneticLink>
            <MagneticLink
              href={PROFILE.instagramHref}
              allowMagnetic={allowMagnetic}
              prefersReducedMotion={prefersReducedMotion}
              entranceDelay={0.14}
              className="inline-flex items-center py-1.5 px-2 -mx-2 rounded-md hover:text-[#C94B00] dark:hover:text-[#FF721A] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF721A]"
            >
              Instagram
            </MagneticLink>
          </div>
        </div>
      </footer>

      {/* Brief 'Copied!' Toast Notification */}
      <AnimatePresence>
        {copiedEmail && (
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
                {PROFILE.email}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
