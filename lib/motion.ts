/*
 * Shared motion variants.
 *
 * Centralized so page/list entrances feel identical across the app,
 * and so the `prefers-reduced-motion` CSS rule in globals.css governs
 * every animation in one place.
 */

export const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

export const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: "easeOut" as const,
    },
  },
};

export const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35 },
};
