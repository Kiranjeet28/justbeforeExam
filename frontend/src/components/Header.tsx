"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  Sun,
  Moon,
  User,
  LogOut,
  Settings,
  Home,
  Book,
  BarChart3,
  Help,
  Bell,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface HeaderProps {
  logo?: string;
  logoAlt?: string;
  title?: string;
  subtitle?: string;
  navItems?: NavItem[];
  showUserMenu?: boolean;
  showThemeToggle?: boolean;
  showNotifications?: boolean;
  breadcrumbs?: BreadcrumbItem[];
  onThemeToggle?: () => void;
  isDark?: boolean;
  className?: string;
  notificationCount?: number;
}

// Navigation item component with animations
const NavItemComponent: React.FC<{
  item: NavItem;
  isActive?: boolean;
  isMobile?: boolean;
}> = ({ item, isActive = false, isMobile = false }) => {
  return (
    <motion.div
      whileHover={!isMobile ? { y: -2 } : {}}
      whileTap={{ scale: 0.95 }}
      className="relative"
    >
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-medium transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500",
          isActive
            ? "text-white bg-gradient-to-r from-violet-600 to-indigo-600"
            : "text-slate-300 hover:text-white hover:bg-slate-700/50 dark:hover:bg-slate-700/50"
        )}
        aria-current={isActive ? "page" : undefined}
      >
        {item.icon && (
          <motion.span
            animate={{ scale: isActive ? 1.15 : 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="flex"
          >
            {item.icon}
          </motion.span>
        )}
        <span>{item.label}</span>
        {item.badge && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="ml-2 px-2 py-0.5 text-xs font-bold rounded-full bg-red-500 text-white"
          >
            {item.badge}
          </motion.span>
        )}
      </Link>
    </motion.div>
  );
};

// Breadcrumb component
const Breadcrumb: React.FC<{ items: BreadcrumbItem[] }> = ({ items }) => {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="flex items-center gap-2 text-sm text-slate-400 overflow-x-auto pb-2 sm:pb-0"
      aria-label="Breadcrumb"
    >
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <ChevronRight size={16} className="flex-shrink-0 text-slate-500" />
          )}
          {item.href ? (
            <Link
              href={item.href}
              className="hover:text-violet-400 transition-colors duration-200 whitespace-nowrap"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-slate-300 font-medium whitespace-nowrap">
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </motion.nav>
  );
};

// User menu dropdown
const UserMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { label: "Profile", icon: <User size={18} />, href: "#" },
    { label: "Settings", icon: <Settings size={18} />, href: "#" },
    { label: "Help", icon: <Help size={18} />, href: "#" },
    { label: "Logout", icon: <LogOut size={18} />, href: "#", isDanger: true },
  ];

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
        aria-label="Open user menu"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <User size={20} className="text-white" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40"
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="absolute right-0 mt-2 w-48 rounded-xl bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 shadow-2xl py-2 z-50"
            >
              {menuItems.map((item, index) => (
                <motion.a
                  key={index}
                  href={item.href}
                  whileHover={{ x: 4 }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 transition-all duration-200",
                    item.isDanger
                      ? "text-red-400 hover:bg-red-500/10"
                      : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                  )}
                >
                  {item.icon}
                  <span className="font-medium text-sm">{item.label}</span>
                </motion.a>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// Main Header Component
export const Header: React.FC<HeaderProps> = ({
  logo = "/logo/Logo.png",
  logoAlt = "Logo",
  title = "Just Before Exam",
  subtitle,
  navItems,
  showUserMenu = true,
  showThemeToggle = true,
  showNotifications = true,
  breadcrumbs,
  onThemeToggle,
  isDark = true,
  className,
  notificationCount = 0,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll for sticky header effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Default navigation items
  const defaultNavItems: NavItem[] = [
    { label: "Home", href: "/", icon: <Home size={18} /> },
    { label: "Notes", href: "/notes", icon: <Book size={18} /> },
    { label: "Reports", href: "/reports", icon: <BarChart3 size={18} /> },
  ];

  const finalNavItems = navItems || defaultNavItems;

  const headerVariants = {
    initial: { y: -100, opacity: 0 },
    animate: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, type: "spring", stiffness: 100 },
    },
  };

  const mobileMenuVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: {
      opacity: 1,
      height: "auto",
      transition: {
        duration: 0.3,
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
    exit: {
      opacity: 0,
      height: 0,
      transition: { duration: 0.2 },
    },
  };

  const mobileMenuItemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: { x: 0, opacity: 1 },
  };

  return (
    <>
      {/* Main Header */}
      <motion.header
        variants={headerVariants}
        initial="initial"
        animate="animate"
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-300",
          isScrolled
            ? "bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 shadow-lg"
            : "bg-slate-950/50 backdrop-blur-md border-b border-slate-800/30",
          className
        )}
      >
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Top Navigation Row */}
          <div className="flex items-center justify-between py-3 sm:py-4 min-h-16 sm:min-h-20">
            {/* Left: Logo and Branding */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-3 group cursor-pointer flex-shrink-0"
            >
              <Link href="/" className="flex items-center gap-3">
                {/* Logo Image */}
                <div className="relative h-8 sm:h-10 flex items-center transition-transform duration-300 group-hover:scale-105">
                  <Image
                    src={logo}
                    alt={logoAlt}
                    width={40}
                    height={40}
                    className="h-full w-auto"
                    priority
                  />
                </div>

                {/* Brand Text */}
                <div className="hidden sm:flex flex-col gap-0.5">
                  <motion.p
                    whileHover={{ scale: 1.02 }}
                    className="text-xs sm:text-sm font-bold uppercase tracking-widest bg-gradient-to-r from-violet-400 via-indigo-300 to-violet-400 bg-clip-text text-transparent"
                  >
                    {title}
                  </motion.p>
                  {subtitle && (
                    <p className="text-xs text-slate-400 font-medium tracking-wider">
                      {subtitle}
                    </p>
                  )}
                </div>
              </Link>
            </motion.div>

            {/* Center: Desktop Navigation */}
            <nav
              className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2"
              aria-label="Main navigation"
            >
              {finalNavItems.map((item) => (
                <NavItemComponent key={item.href} item={item} />
              ))}
            </nav>

            {/* Right: User Actions */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {/* Notifications */}
              {showNotifications && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-slate-700/50 hover:bg-slate-600/70 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                  aria-label="Notifications"
                >
                  <Bell size={20} className="text-slate-300 hover:text-white" />
                  {notificationCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold bg-red-500 text-white rounded-full"
                    >
                      {notificationCount > 99 ? "99+" : notificationCount}
                    </motion.span>
                  )}
                </motion.button>
              )}

              {/* Theme Toggle */}
              {showThemeToggle && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onThemeToggle}
                  className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-slate-700/50 hover:bg-slate-600/70 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                  aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                >
                  <motion.div
                    initial={false}
                    animate={{ rotate: isDark ? 180 : 0, scale: isDark ? 0.8 : 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {isDark ? (
                      <Moon size={20} className="text-slate-300" />
                    ) : (
                      <Sun size={20} className="text-slate-300" />
                    )}
                  </motion.div>
                </motion.button>
              )}

              {/* User Menu */}
              {showUserMenu && <UserMenu />}

              {/* Mobile Menu Toggle */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-slate-700/50 hover:bg-slate-600/70 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                aria-label="Toggle mobile menu"
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-menu"
              >
                <AnimatePresence mode="wait">
                  {isMobileMenuOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <X size={20} className="text-slate-300" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="open"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Menu size={20} className="text-slate-300" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>

          {/* Breadcrumb Row */}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <div className="py-2 border-t border-slate-700/30">
              <Breadcrumb items={breadcrumbs} />
            </div>
          )}
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              id="mobile-menu"
              variants={mobileMenuVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="md:hidden border-t border-slate-700/30 bg-slate-950/50 backdrop-blur-sm"
            >
              <nav className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-4 space-y-2">
                {finalNavItems.map((item) => (
                  <motion.div
                    key={item.href}
                    variants={mobileMenuItemVariants}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <NavItemComponent item={item} isMobile />
                  </motion.div>
                ))}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Spacer to prevent content overlap */}
      <div className="h-0" />
    </>
  );
};

export default Header;
```

Now, let me create a comprehensive example/hook file showing how to use this Header component:
