import React from 'react';
import { motion } from 'framer-motion';

// Displays one product capability with its icon, description, and optional badge.
export const FeatureCard = ({ icon: Icon, title, description, badge, color = "from-blue-500 to-cyan-500" }) => {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="glass-card rounded-3xl p-6 relative overflow-hidden group space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className={`p-3.5 rounded-2xl bg-gradient-to-br ${color} text-white shadow-lg`}>
          <Icon className="w-6 h-6" />
        </div>
        {badge && (
          <span className="px-2.5 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-full border border-blue-200 dark:border-blue-800">
            {badge}
          </span>
        )}
      </div>

      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {title}
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
          {description}
        </p>
      </div>
    </motion.div>
  );
};
