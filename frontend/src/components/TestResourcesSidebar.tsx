'use client';

import { motion } from 'framer-motion';
import { Globe, Video, Zap, ExternalLink, BookOpen } from 'lucide-react';

interface TestResourcesSidebarProps {
  onSelectLink: (url: string, label: string) => void;
  isLoading?: boolean;
  className?: string;
}

interface TestResource {
  url: string;
  label: string;
  description: string;
  type: 'video' | 'article';
  icon?: React.ReactNode;
}

const TEST_RESOURCES: TestResource[] = [
  {
    url: 'https://www.geeksforgeeks.org/computer-networks/cryptography-and-its-types/',
    label: 'GeeksforGeeks - Cryptography',
    description: 'Comprehensive guide on cryptography types',
    type: 'article',
  },
  {
    url: 'https://www.tutorialspoint.com/cryptography/index.htm',
    label: 'TutorialsPoint - Cryptography',
    description: 'Complete cryptography tutorial',
    type: 'article',
  },
  {
    url: 'https://youtu.be/trHox1bN5es?si=HkTPipEwVRi7In3H',
    label: 'YouTube - Cryptography Basics',
    description: 'Video introduction to cryptography',
    type: 'video',
  },
];

function getTypeIcon(type: 'video' | 'article') {
  if (type === 'video') {
    return <Video size={14} className="text-rose-400 shrink-0" />;
  }
  return <Globe size={14} className="text-cyan-400 shrink-0" />;
}

export default function TestResourcesSidebar({
  onSelectLink,
  isLoading = false,
  className = '',
}: TestResourcesSidebarProps) {
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.08,
        delayChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  };

  const headerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.4 },
    },
  };

  return (
    <motion.aside
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={`rounded-2xl border border-slate-700/40 bg-gradient-to-br from-slate-900/60 via-slate-900/40 to-slate-950/60 p-6 shadow-2xl backdrop-blur-md transition-all duration-300 hover:border-slate-700/60 ${className}`}
    >
      {/* Header */}
      <motion.div variants={headerVariants} className="mb-6 space-y-2">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/10 p-2.5 border border-blue-500/30 shadow-lg shadow-blue-500/10">
            <Zap size={18} className="text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold bg-gradient-to-r from-slate-50 via-slate-100 to-slate-200 bg-clip-text text-transparent">
              Test Resources
            </h3>
          </div>
        </div>
        <p className="text-xs text-slate-500 pl-11">
          Quick access to sample materials
        </p>
      </motion.div>

      {/* Resources List */}
      <div className="space-y-2.5">
        {TEST_RESOURCES.map((resource, idx) => (
          <motion.button
            key={`test-resource-${idx}`}
            variants={itemVariants}
            onClick={() => !isLoading && onSelectLink(resource.url, resource.label)}
            disabled={isLoading}
            whileHover={isLoading ? {} : { scale: 1.02, x: 4 }}
            whileTap={isLoading ? {} : { scale: 0.98 }}
            className={`group relative w-full text-left rounded-lg border border-slate-700/50 bg-gradient-to-br from-slate-800/40 to-slate-900/20 p-4 transition-all duration-300 ${
              isLoading
                ? 'opacity-60 cursor-not-allowed'
                : 'hover:border-blue-500/40 hover:bg-gradient-to-br hover:from-slate-800/60 hover:to-blue-950/20 hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer'
            }`}
          >
            {/* Content Container */}
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                {/* Left Side - Type Icon and Text */}
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <div className="flex-shrink-0 mt-1 rounded-full bg-slate-700/30 p-1.5">
                    {getTypeIcon(resource.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-0.5">
                      {resource.type}
                    </p>
                    <p className="text-sm font-semibold text-slate-100 line-clamp-2 group-hover:text-blue-300 transition-colors break-words leading-tight">
                      {resource.label}
                    </p>
                  </div>
                </div>

                {/* Right Side - External Link Icon */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.6 }}
                  whileHover={isLoading ? {} : { opacity: 1, scale: 1 }}
                  className="flex-shrink-0 rounded-full bg-blue-500/10 p-2 group-hover:bg-blue-500/20 transition-colors opacity-0"
                >
                  <ExternalLink size={13} className="text-blue-400" strokeWidth={2.5} />
                </motion.div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-400 line-clamp-1 group-hover:text-slate-300 transition-colors">
                {resource.description}
              </p>
            </div>

            {/* Animated Border on Hover */}
            <motion.div
              className="absolute inset-0 rounded-lg border border-blue-500/0 group-hover:border-blue-500/30 transition-colors pointer-events-none"
              initial={false}
              animate={{ borderColor: 'rgba(59, 130, 246, 0)' }}
            />

            {/* Loading State Indicator */}
            {isLoading && (
              <div className="absolute inset-0 rounded-lg bg-slate-950/40 backdrop-blur-sm flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                  className="h-4 w-4 rounded-full border-2 border-blue-400/30 border-t-blue-400"
                />
              </div>
            )}
          </motion.button>
        ))}
      </div>

      {/* Divider */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="h-px bg-gradient-to-r from-transparent via-slate-700/40 to-transparent my-5 origin-center"
      />

      {/* Footer Info */}
      <motion.div
        variants={itemVariants}
        className="space-y-2"
      >
        <div className="flex items-start gap-2 rounded-lg bg-blue-950/20 border border-blue-500/20 p-3">
          <BookOpen size={14} className="text-blue-300 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-200">
            Click any resource to populate the input field and start the pipeline
          </p>
        </div>
      </motion.div>
    </motion.aside>
  );
}
