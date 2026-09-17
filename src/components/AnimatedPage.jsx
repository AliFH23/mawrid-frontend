import { motion } from 'framer-motion';

// wraps any page/section so it fades and slides up gently on mount, instead of
// popping into view abruptly. Reuse this everywhere (dashboards, cards, lists)
// for a consistent, professional feel across the whole app.
const pageVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};

function AnimatedPage({ children, ...props }) {
  return (
    <motion.div initial="hidden" animate="visible" variants={pageVariants} {...props}>
      {children}
    </motion.div>
  );
}

export default AnimatedPage;