"use client";

import React, { useState } from "react";
import { Header } from "./Header";
import {
  Home,
  Book,
  BarChart3,
  Settings,
  Users,
  Zap,
  GraduationCap,
} from "lucide-react";

/**
 * EXAMPLE 1: Basic Header
 * Minimal setup with default styling and no customization
 */
export const BasicHeaderExample = () => {
  return <Header />;
};

/**
 * EXAMPLE 2: Header with Custom Navigation
 * Shows how to add custom navigation items with icons and badges
 */
export const CustomNavHeaderExample = () => {
  const navItems = [
    { label: "Dashboard", href: "/", icon: <Home size={18} /> },
    { label: "Study Notes", href: "/notes", icon: <Book size={18} /> },
    {
      label: "Progress",
      href: "/progress",
      icon: <BarChart3 size={18} />,
      badge: 3,
    },
    { label: "Settings", href: "/settings", icon: <Settings size={18} /> },
  ];

  return (
    <Header
      title="Study Hub"
      subtitle="Learning Platform"
      navItems={navItems}
      logo="/logo/Logo.png"
      logoAlt="Study Hub Logo"
    />
  );
};

/**
 * EXAMPLE 3: Header with Breadcrumbs
 * Demonstrates breadcrumb navigation for showing page hierarchy
 */
export const BreadcrumbHeaderExample = () => {
  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Notes", href: "/notes" },
    { label: "Math", href: "/notes/math" },
    { label: "Algebra - Chapter 3", href: "" }, // Current page
  ];

  return (
    <Header
      title="Just Before Exam"
      navItems={[
        { label: "Home", href: "/", icon: <Home size={18} /> },
        { label: "Notes", href: "/notes", icon: <Book size={18} /> },
      ]}
      breadcrumbs={breadcrumbs}
    />
  );
};

/**
 * EXAMPLE 4: Header with Theme Toggle
 * Complete integration with dark/light mode switching
 */
export const ThemeToggleHeaderExample = () => {
  const [isDark, setIsDark] = useState(true);

  const handleThemeToggle = () => {
    setIsDark(!isDark);
    // Apply theme change to document
    document.documentElement.classList.toggle("dark", !isDark);
    localStorage.setItem("theme", isDark ? "light" : "dark");
  };

  return (
    <Header
      title="Just Before Exam"
      navItems={[
        { label: "Home", href: "/", icon: <Home size={18} /> },
        { label: "Notes", href: "/notes", icon: <Book size={18} /> },
        { label: "Reports", href: "/reports", icon: <BarChart3 size={18} /> },
      ]}
      isDark={isDark}
      onThemeToggle={handleThemeToggle}
      showThemeToggle={true}
    />
  );
};

/**
 * EXAMPLE 5: Header with All Features
 * Complete header with all available features enabled
 */
export const FullFeaturedHeaderExample = () => {
  const [isDark, setIsDark] = useState(true);
  const [notificationCount, setNotificationCount] = useState(5);

  const navItems = [
    { label: "Home", href: "/", icon: <Home size={18} /> },
    { label: "Notes", href: "/notes", icon: <Book size={18} /> },
    { label: "Progress", href: "/progress", icon: <BarChart3 size={18} /> },
    {
      label: "Team",
      href: "/team",
      icon: <Users size={18} />,
      badge: notificationCount,
    },
  ];

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Dashboard" },
  ];

  const handleThemeToggle = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark", !isDark);
  };

  return (
    <Header
      title="Study Master"
      subtitle="AI-Powered Learning"
      logo="/logo/Logo.png"
      logoAlt="Study Master"
      navItems={navItems}
      breadcrumbs={breadcrumbs}
      isDark={isDark}
      onThemeToggle={handleThemeToggle}
      showUserMenu={true}
      showThemeToggle={true}
      showNotifications={true}
      notificationCount={notificationCount}
    />
  );
};

/**
 * EXAMPLE 6: Minimal Header for Mobile-First Design
 * Optimized for mobile with simplified navigation
 */
export const MobileOptimizedHeaderExample = () => {
  const navItems = [
    { label: "Home", href: "/", icon: <Home size={18} /> },
    { label: "Notes", href: "/notes", icon: <Book size={18} /> },
    { label: "Study", href: "/study", icon: <Zap size={18} /> },
  ];

  return (
    <Header
      title="Exam Prep"
      navItems={navItems}
      showUserMenu={true}
      showThemeToggle={false}
      showNotifications={false}
    />
  );
};

/**
 * EXAMPLE 7: Header with Dynamic Navigation Badge Updates
 * Shows how to update badges dynamically (e.g., for notifications or pending tasks)
 */
export const DynamicBadgeHeaderExample = () => {
  const [pendingTasks, setPendingTasks] = useState(2);
  const [unreadMessages, setUnreadMessages] = useState(7);

  const navItems = [
    { label: "Home", href: "/", icon: <Home size={18} /> },
    {
      label: "Tasks",
      href: "/tasks",
      icon: <Zap size={18} />,
      badge: pendingTasks,
    },
    {
      label: "Messages",
      href: "/messages",
      icon: <Users size={18} />,
      badge: unreadMessages,
    },
  ];

  return (
    <Header
      title="Learning Dashboard"
      navItems={navItems}
      notificationCount={pendingTasks + unreadMessages}
      showNotifications={true}
    />
  );
};

/**
 * EXAMPLE 8: Integration with Next.js Layout
 * Shows how to integrate Header into a Next.js layout file
 */
export const LayoutIntegrationExample = `
// app/layout.tsx or app/(main)/layout.tsx
"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { Home, Book, BarChart3 } from "lucide-react";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isDark, setIsDark] = useState(true);

  const navItems = [
    { label: "Home", href: "/", icon: <Home size={18} /> },
    { label: "Notes", href: "/notes", icon: <Book size={18} /> },
    { label: "Reports", href: "/reports", icon: <BarChart3 size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      <Header
        title="Just Before Exam"
        navItems={navItems}
        isDark={isDark}
        onThemeToggle={() => setIsDark(!isDark)}
        showThemeToggle={true}
        showUserMenu={true}
      />
      <main className="relative z-10">
        {children}
      </main>
    </div>
  );
}
`;

/**
 * EXAMPLE 9: Header in a Page with Dynamic Breadcrumbs
 * Demonstrates how to update breadcrumbs based on current route
 */
export const DynamicBreadcrumbPageExample = `
// app/notes/[subject]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { Header } from "@/components/Header";
import { Home, Book } from "lucide-react";

export default function NotesPage() {
  const params = useParams();
  const subject = params.subject as string;

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Notes", href: "/notes" },
    { label: subject.charAt(0).toUpperCase() + subject.slice(1) },
  ];

  const navItems = [
    { label: "Home", href: "/", icon: <Home size={18} /> },
    { label: "Notes", href: "/notes", icon: <Book size={18} /> },
  ];

  return (
    <>
      <Header
        title="Just Before Exam"
        navItems={navItems}
        breadcrumbs={breadcrumbs}
      />
      <main className="p-8">
        {/* Page content */}
      </main>
    </>
  );
}
`;

/**
 * EXAMPLE 10: Composite Example - Full Page Setup
 * Complete working example with all features integrated
 */
export const CompletePageSetupExample = () => {
  const [isDark, setIsDark] = useState(true);
  const [notifications, setNotifications] = useState(3);

  const navItems = [
    { label: "Home", href: "/", icon: <Home size={18} /> },
    { label: "Notes", href: "/notes", icon: <Book size={18} /> },
    { label: "Progress", href: "/progress", icon: <BarChart3 size={18} /> },
    {
      label: "Learn",
      href: "/learn",
      icon: <GraduationCap size={18} />,
      badge: notifications,
    },
  ];

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Dashboard" },
  ];

  const handleThemeToggle = () => {
    setIsDark(!isDark);
  };

  return (
    <div className={`min-h-screen ${isDark ? "dark" : ""}`}>
      <div className="bg-gradient-to-b from-slate-950 via-slate-900/95 to-slate-950">
        <Header
          title="Just Before Exam"
          subtitle="Study Smarter"
          logo="/logo/Logo.png"
          logoAlt="Just Before Exam"
          navItems={navItems}
          breadcrumbs={breadcrumbs}
          isDark={isDark}
          onThemeToggle={handleThemeToggle}
          showUserMenu={true}
          showThemeToggle={true}
          showNotifications={true}
          notificationCount={notifications}
        />

        {/* Main Content Area */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-20">
          <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm p-8">
            <h1 className="text-2xl font-bold text-white mb-4">Welcome Back!</h1>
            <p className="text-slate-300">
              This demonstrates a complete page setup with the Header component.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * INTEGRATION GUIDE
 *
 * Step 1: Add to your main layout
 * --------------------------------
 * import { Header } from "@/components/Header";
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <div>
 *       <Header title="Your App" navItems={navItems} />
 *       <main>{children}</main>
 *     </div>
 *   );
 * }
 *
 * Step 2: Customize navigation items
 * -----------------------------------
 * const navItems = [
 *   { label: "Home", href: "/", icon: <Home size={18} /> },
 *   { label: "About", href: "/about", icon: <Info size={18} /> },
 * ];
 *
 * Step 3: Add breadcrumbs for page hierarchy
 * -------------------------------------------
 * const breadcrumbs = [
 *   { label: "Home", href: "/" },
 *   { label: "Current Page" },
 * ];
 *
 * Step 4: Integrate theme toggle
 * --------------------------------
 * const [isDark, setIsDark] = useState(true);
 *
 * <Header
 *   isDark={isDark}
 *   onThemeToggle={() => setIsDark(!isDark)}
 * />
 *
 * Features:
 * ✓ Sticky positioning with glassmorphism
 * ✓ Responsive mobile hamburger menu
 * ✓ Smooth animations (Framer Motion)
 * ✓ Theme toggle support
 * ✓ Notification badges
 * ✓ User dropdown menu
 * ✓ Breadcrumb navigation
 * ✓ Accessibility (ARIA labels)
 * ✓ Tailwind CSS styling
 */

export default CompletePageSetupExample;
