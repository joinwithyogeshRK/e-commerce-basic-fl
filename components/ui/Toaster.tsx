'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useMisc } from '@/lib/store';

export default function Toaster() {
  const { toasts } = useMisc();
  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[90] flex -translate-x-1/2 flex-col items-center gap-2 sm:left-6 sm:translate-x-0 sm:items-start">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-auto flex items-center gap-2.5 rounded-full bg-ink px-4 py-2.5 text-[13px] text-paper shadow-pop"
          >
            <Check size={15} className="text-emerald-300" />
            {t.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
