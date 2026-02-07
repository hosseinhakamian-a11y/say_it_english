import { Variants } from "framer-motion";

// ============================================
// 🎨 Say It English - Premium Animation System
// ============================================

// Page Transition Variants
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94], // Custom easing
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
    },
  },
};

// Card Hover Animation
export const cardVariants: Variants = {
  initial: {
    scale: 1,
    y: 0,
  },
  hover: {
    scale: 1.02,
    y: -8,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
  tap: {
    scale: 0.98,
  },
};

// Staggered List Animation (for lists of items)
export const containerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export const itemVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
};

// Button Press Animation
export const buttonVariants: Variants = {
  initial: { scale: 1 },
  tap: { scale: 0.95 },
  hover: { scale: 1.02 },
};

// Fade In Animation
export const fadeInVariants: Variants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: { duration: 0.5 }
  },
};

// Slide In from Right
export const slideInRightVariants: Variants = {
  initial: { x: 100, opacity: 0 },
  animate: { 
    x: 0, 
    opacity: 1,
    transition: { duration: 0.4, ease: "easeOut" }
  },
};

// Slide In from Left
export const slideInLeftVariants: Variants = {
  initial: { x: -100, opacity: 0 },
  animate: { 
    x: 0, 
    opacity: 1,
    transition: { duration: 0.4, ease: "easeOut" }
  },
};

// Scale Up Animation (for modals, popups)
export const scaleUpVariants: Variants = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { 
    scale: 1, 
    opacity: 1,
    transition: { duration: 0.3, ease: [0.34, 1.56, 0.64, 1] } // Spring-like
  },
  exit: { 
    scale: 0.8, 
    opacity: 0,
    transition: { duration: 0.2 }
  },
};

// Shimmer Animation for Skeletons (CSS-based, use with className)
export const shimmerKeyframes = `
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
`;

// Glass effect styles (for Tailwind className)
export const glassStyles = {
  light: "bg-white/70 backdrop-blur-xl border border-white/20 shadow-xl",
  dark: "bg-black/30 backdrop-blur-xl border border-white/10 shadow-xl",
  primary: "bg-primary/10 backdrop-blur-xl border border-primary/20 shadow-xl",
};
