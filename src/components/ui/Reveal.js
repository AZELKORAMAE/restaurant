"use client";
import { motion } from 'framer-motion';

/** Fades and lifts its content in when it scrolls into view. */
export default function Reveal({ children, delay = 0, y = 24, style, as = 'div' }) {
    const Tag = motion[as] || motion.div;
    return (
        <Tag initial={{ opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }} style={style}>
            {children}
        </Tag>
    );
}
