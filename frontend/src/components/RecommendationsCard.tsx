"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import {
  BookOpen,
  Video,
  CheckCircle,
  ExternalLink,
  Star,
  Clock,
  Users,
} from "lucide-react";

export type ResourceType = "article" | "video" | "practice" | "course" | "doc";

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  type: ResourceType;
  difficulty?: "beginner" | "intermediate" | "advanced";
  duration?: string;
  instructor?: string;
  rating?: number;
  url?: string;
  tags?: string[];
}

export interface RecommendationsCardProps {
  recommendations: Recommendation[];
  title?: string;
  subtitle?: string;
  onResourceClick?: (recommendation: Recommendation) => void;
  isLoading?: boolean;
  emptyState?: boolean;
}

const getTypeIcon = (type: ResourceType) => {
  switch (type) {
    case "video":
      return <Video className="w-5 h-5" />;
    case "practice":
      return <CheckCircle className="w-5 h-5" />;
    case "course":
      return <BookOpen className="w-5 h-5" />;
    case "doc":
      return <BookOpen className="w-5 h-5" />;
    default:
      return <BookOpen className="w-5 h-5" />;
  }
};

const getTypeColor = (type: ResourceType) => {
  switch (type) {
    case "video":
      return "from-red-500 to-rose-600";
    case "practice":
      return "from-emerald-500 to-green-600";
    case "course":
      return "from-blue-500 to-indigo-600";
    case "doc":
      return "from-amber-500 to-orange-600";
    default:
      return "from-violet-500 to-blue-600";
  }
};

const getTypeLabel = (type: ResourceType) => {
  switch (type) {
    case "video":
      return "Video";
    case "practice":
      return "Practice";
    case "course":
      return "Course";
    case "doc":
      return "Article";
    default:
      return "Resource";
  }
};

const getDifficultyColor = (difficulty?: string) => {
  switch (difficulty) {
    case "beginner":
      return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
    case "intermediate":
      return "bg-amber-500/20 text-amber-300 border-amber-500/30";
    case "advanced":
      return "bg-red-500/20 text-red-300 border-red-500/30";
    default:
      return "bg-slate-600/20 text-slate-300 border-slate-600/30";
  }
};

const RecommendationCard: React.FC<{
  recommendation: Recommendation;
  index: number;
  onClick?: () => void;
}> = ({ recommendation, index, onClick }) => {
  const typeGradient = getTypeColor(recommendation.type);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.1,
        type: "spring",
        stiffness: 400,
        damping: 25,
      }}
      whileHover={{ y: -4 }}
    >
      <Card
        variant="elevated"
        padding="lg"
        hoverable
        interactive
        onClick={onClick}
        className="space-y-4 h-full cursor-pointer overflow-hidden group"
      >
        {/* Type Badge */}
        <div className="flex items-start justify-between gap-3">
          <div
            className={`p-2.5 rounded-lg bg-gradient-to-br ${typeGradient} bg-opacity-20 group-hover:bg-opacity-30 transition-all duration-300`}
          >
            <div className={`text-white`}>
              {getTypeIcon(recommendation.type)}
            </div>
          </div>

          {recommendation.rating && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/30"
            >
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-xs font-semibold text-amber-300">
                {recommendation.rating}
              </span>
            </motion.div>
          )}
        </div>

        {/* Content */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-bold text-slate-100 leading-snug group-hover:text-white transition-colors line-clamp-2">
              {recommendation.title}
            </h4>
          </div>

          <p className="text-sm text-slate-400 line-clamp-2 group-hover:text-slate-300 transition-colors">
            {recommendation.description}
          </p>
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap gap-2 pt-2">
          {/* Type Label */}
          <div className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-700/40 text-slate-300 border border-slate-600/30">
            {getTypeLabel(recommendation.type)}
          </div>

          {/* Difficulty */}
          {recommendation.difficulty && (
            <div
              className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(recommendation.difficulty)}`}
            >
              {recommendation.difficulty.charAt(0).toUpperCase() +
                recommendation.difficulty.slice(1)}
            </div>
          )}

          {/* Duration */}
          {recommendation.duration && (
            <div className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-700/40 text-slate-300 border border-slate-600/30 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {recommendation.duration}
            </div>
          )}
        </div>

        {/* Instructor/Additional Info */}
        <div className="pt-2 border-t border-slate-700/50 space-y-2">
          {recommendation.instructor && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Users className="w-3.5 h-3.5 text-violet-400" />
              <span>By {recommendation.instructor}</span>
            </div>
          )}

          {recommendation.tags && recommendation.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {recommendation.tags.map((tag, idx) => (
                <motion.span
                  key={idx}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="px-2 py-0.5 rounded-full text-xs bg-violet-500/20 text-violet-300 border border-violet-500/30"
                >
                  #{tag}
                </motion.span>
              ))}
            </div>
          )}
        </div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="pt-2"
        >
          <Button
            variant="primary"
            size="sm"
            fullWidth
            icon={<ExternalLink size={16} />}
            iconPosition="right"
            className="group-hover:shadow-lg group-hover:shadow-violet-500/20"
          >
            Access Resource
          </Button>
        </motion.div>
      </Card>
    </motion.div>
  );
};

export const RecommendationsCard: React.FC<RecommendationsCardProps> = ({
  recommendations,
  title = "Recommended Resources",
  subtitle = "Check out these resources to improve your understanding",
  onResourceClick,
  isLoading = false,
  emptyState = false,
}) => {
  const groupedByType = recommendations.reduce(
    (acc, rec) => {
      if (!acc[rec.type]) {
        acc[rec.type] = [];
      }
      acc[rec.type].push(rec);
      return acc;
    },
    {} as Record<ResourceType, Recommendation[]>
  );

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-12"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="mb-4"
        >
          <BookOpen className="w-8 h-8 text-violet-400" />
        </motion.div>
        <p className="text-slate-300 font-medium">
          Finding great resources for you...
        </p>
      </motion.div>
    );
  }

  if (emptyState || recommendations.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card variant="default" padding="lg" className="text-center space-y-4">
          <div className="p-4 bg-slate-700/20 rounded-lg w-fit mx-auto">
            <BookOpen className="w-8 h-8 text-slate-500" />
          </div>
          <div>
            <h3 className="text-slate-300 font-semibold mb-2">
              No recommendations yet
            </h3>
            <p className="text-slate-400 text-sm">
              Complete a quiz or select a topic to get personalized resource recommendations.
            </p>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-2"
      >
        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <span className="p-2 bg-gradient-to-br from-violet-500/20 to-blue-500/20 rounded-lg">
            <BookOpen className="w-6 h-6 text-violet-400" />
          </span>
          {title}
        </h2>
        <p className="text-slate-400 ml-10">{subtitle}</p>
      </motion.div>

      {/* Type Tabs (if multiple types) */}
      {Object.keys(groupedByType).length > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="flex flex-wrap gap-2"
        >
          {Object.entries(groupedByType).map(([type, items]) => (
            <motion.div
              key={type}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="px-3 py-1.5 rounded-lg bg-slate-700/40 text-slate-300 text-sm font-medium border border-slate-600/30 flex items-center gap-2"
            >
              <div>{getTypeIcon(type as ResourceType)}</div>
              <span>{getTypeLabel(type as ResourceType)}</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-600/50 text-xs font-bold">
                {items.length}
              </span>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Recommendations Grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {recommendations.map((recommendation, idx) => (
          <RecommendationCard
            key={recommendation.id}
            recommendation={recommendation}
            index={idx}
            onClick={() => {
              onResourceClick?.(recommendation);
              if (recommendation.url) {
                window.open(recommendation.url, "_blank");
              }
            }}
          />
        ))}
      </motion.div>

      {/* Footer Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="pt-4 border-t border-slate-700/50"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-slate-400 font-medium">
              Total Resources
            </p>
            <p className="text-2xl font-bold text-violet-400">
              {recommendations.length}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-slate-400 font-medium">
              Resource Types
            </p>
            <p className="text-2xl font-bold text-blue-400">
              {Object.keys(groupedByType).length}
            </p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-slate-400 font-medium">
              Avg. Rating
            </p>
            <p className="text-2xl font-bold text-amber-400">
              {recommendations.some((r) => r.rating)
                ? (
                    recommendations.reduce((sum, r) => sum + (r.rating || 0), 0) /
                    recommendations.filter((r) => r.rating).length
                  ).toFixed(1)
                : "N/A"}
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default RecommendationsCard;
