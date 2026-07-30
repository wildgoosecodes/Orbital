import type { Transition, Variants } from 'framer-motion';

/** Standard entrance for text/content blocks — fade + slight rise. */
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

export const fadeInUpTransition: Transition = { duration: 0.3, ease: 'easeOut' };

/** Wrap a list of `fadeInUp` children in this to stagger their entrance. */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06 },
  },
};

/** Entrance/exit for individual rows in a list (tasks, habits, activity feed, etc). */
export const listItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, scale: 0.97, transition: { duration: 0.15 } },
};

export const listItemTransition: Transition = { duration: 0.25, ease: 'easeOut' };

/** Fade + scale for dropdowns/modals — matches the pattern already used by
 *  EditProfileModal/WhatsNewModal, extended here to the nav dropdowns. */
export const dropdownVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: -4 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.96, y: -4 },
};

export const dropdownTransition: Transition = { duration: 0.15 };

/** whileTap for buttons/pills — a small, consistent press-down feel. */
export const tapScale = { scale: 0.96 };

/** whileHover for standalone buttons (not list rows, which use their own lift). */
export const hoverScale = { scale: 1.02 };

/** whileHover for cards — a subtle lift, not a scale (keeps grid layout stable). */
export const cardHover = { y: -2 };

/** Height-animated expand/collapse for accordion-style sections. */
export const expandCollapse: Variants = {
  hidden: { height: 0, opacity: 0 },
  visible: { height: 'auto', opacity: 1 },
  exit: { height: 0, opacity: 0 },
};

export const expandCollapseTransition: Transition = { duration: 0.25, ease: 'easeInOut' };
