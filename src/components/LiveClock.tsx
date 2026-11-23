import React, { useEffect, useState } from 'react';
import { useLanguage } from './LanguageProvider';

interface LiveClockProps {
  className?: string;
  showZone?: boolean;
}

const formatKeralaTime = (date: Date): string => {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })
    .format(date)
    .toUpperCase();
};

export const LiveClock: React.FC<LiveClockProps> = ({
  className = '',
  showZone = true,
}) => {
  const { t } = useLanguage();
  const [timeString, setTimeString] = useState<string>(() =>
    formatKeralaTime(new Date())
  );

  useEffect(() => {
    const update = () => setTimeString(formatKeralaTime(new Date()));
    update();
    const intervalId = window.setInterval(update, 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <time
      aria-label={`${t.liveClock.ariaPrefix}: ${timeString} IST`}
      className={`font-mono tabular-nums whitespace-nowrap ${className}`}
    >
      {timeString}
      {showZone ? ' IST' : ''}
    </time>
  );
};
