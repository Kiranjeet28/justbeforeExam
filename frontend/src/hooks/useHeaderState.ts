"use client";

import { useEffect, useState, useCallback, useMemo } from "react";

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

interface UseHeaderStateReturn {
  // Theme management
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;

  // Notification management
  notificationCount: number;
  setNotificationCount: (count: number) => void;
  addNotification: (count?: number) => void;
  clearNotifications: () => void;
  incrementNotification: () => void;
  decrementNotification: () => void;

  // Navigation management
  navItems: NavItem[];
  setNavItems: (items: NavItem[]) => void;
  updateNavItem: (href: string, updates: Partial<NavItem>) => void;
  addNavItem: (item: NavItem) => void;
  removeNavItem: (href: string) => void;

  // Breadcrumb management
  breadcrumbs: BreadcrumbItem[];
  setBreadcrumbs: (items: BreadcrumbItem[]) => void;
  updateBreadcrumbs: (pathname: string) => void;

  // Utility
  mounted: boolean;
}

const DEFAULT_NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/", icon: undefined },
];

/**
 * Custom hook for managing Header component state
 * Provides theme, notification, navigation, and breadcrumb management
 * with persistence and SSR support
 *
 * @param initialNavItems - Optional initial navigation items
 * @param initialBreadcrumbs - Optional initial breadcrumbs
 * @returns Header state management object
 *
 * @example
 * ```typescript
 * const header = useHeaderState();
 * const { isDark, toggleTheme, notificationCount } = header;
 * ```
 */
export function useHeaderState(
  initialNavItems: NavItem[] = DEFAULT_NAV_ITEMS,
  initialBreadcrumbs: BreadcrumbItem[] = []
): UseHeaderStateReturn {
  // Theme state
  const [isDark, setIsDarkState] = useState(true);

  // Notification state
  const [notificationCount, setNotificationCount] = useState(0);

  // Navigation state
  const [navItems, setNavItems] = useState<NavItem[]>(initialNavItems);

  // Breadcrumb state
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>(
    initialBreadcrumbs
  );

  // Hydration safety
  const [mounted, setMounted] = useState(false);

  // Initialize theme from localStorage and system preferences on mount
  useEffect(() => {
    setMounted(true);

    // Check localStorage for saved preference
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme) {
      const isDarkTheme = savedTheme === "dark";
      setIsDarkState(isDarkTheme);
      applyThemeToDocument(isDarkTheme);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      setIsDarkState(prefersDark);
      applyThemeToDocument(prefersDark);
    }

    // Listen for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkState(e.matches);
      applyThemeToDocument(e.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
    // Legacy browsers
    else {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  // Apply theme to document and localStorage
  const applyThemeToDocument = useCallback((dark: boolean) => {
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, []);

  // Theme management
  const toggleTheme = useCallback(() => {
    setIsDarkState((prev) => {
      const newTheme = !prev;
      applyThemeToDocument(newTheme);
      return newTheme;
    });
  }, [applyThemeToDocument]);

  const setTheme = useCallback(
    (dark: boolean) => {
      setIsDarkState(dark);
      applyThemeToDocument(dark);
    },
    [applyThemeToDocument]
  );

  // Notification management
  const addNotification = useCallback((count: number = 1) => {
    setNotificationCount((prev) => Math.min(prev + count, 999));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotificationCount(0);
  }, []);

  const incrementNotification = useCallback(() => {
    setNotificationCount((prev) => Math.min(prev + 1, 999));
  }, []);

  const decrementNotification = useCallback(() => {
    setNotificationCount((prev) => Math.max(prev - 1, 0));
  }, []);

  // Navigation management
  const updateNavItem = useCallback((href: string, updates: Partial<NavItem>) => {
    setNavItems((prev) =>
      prev.map((item) =>
        item.href === href ? { ...item, ...updates } : item
      )
    );
  }, []);

  const addNavItem = useCallback((item: NavItem) => {
    setNavItems((prev) => {
      // Check if item already exists
      if (prev.some((existing) => existing.href === item.href)) {
        return prev;
      }
      return [...prev, item];
    });
  }, []);

  const removeNavItem = useCallback((href: string) => {
    setNavItems((prev) => prev.filter((item) => item.href !== href));
  }, []);

  // Breadcrumb management
  const updateBreadcrumbs = useCallback((pathname: string) => {
    const paths = pathname.split("/").filter(Boolean);
    const newBreadcrumbs: BreadcrumbItem[] = [
      { label: "Home", href: "/" },
      ...paths.map((path, index) => {
        const href = "/" + paths.slice(0, index + 1).join("/");
        const label = path
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");

        return {
          label,
          href: index === paths.length - 1 ? undefined : href,
        };
      }),
    ];
    setBreadcrumbs(newBreadcrumbs);
  }, []);

  // Memoize return object to prevent unnecessary re-renders
  const headerState = useMemo<UseHeaderStateReturn>(
    () => ({
      isDark,
      toggleTheme,
      setTheme,
      notificationCount,
      setNotificationCount,
      addNotification,
      clearNotifications,
      incrementNotification,
      decrementNotification,
      navItems,
      setNavItems,
      updateNavItem,
      addNavItem,
      removeNavItem,
      breadcrumbs,
      setBreadcrumbs,
      updateBreadcrumbs,
      mounted,
    }),
    [
      isDark,
      toggleTheme,
      setTheme,
      notificationCount,
      addNotification,
      clearNotifications,
      incrementNotification,
      decrementNotification,
      navItems,
      updateNavItem,
      addNavItem,
      removeNavItem,
      breadcrumbs,
      updateBreadcrumbs,
      mounted,
    ]
  );

  return headerState;
}

/**
 * Hook for managing theme independently
 * Useful when you only need theme functionality
 */
export function useTheme() {
  const [isDark, setIsDarkState] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      const isDarkTheme = savedTheme === "dark";
      setIsDarkState(isDarkTheme);
      applyTheme(isDarkTheme);
    } else {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      setIsDarkState(prefersDark);
      applyTheme(prefersDark);
    }
  }, []);

  const applyTheme = (dark: boolean) => {
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", dark ? "dark" : "light");
  };

  const toggleTheme = useCallback(() => {
    setIsDarkState((prev) => {
      const newTheme = !prev;
      applyTheme(newTheme);
      return newTheme;
    });
  }, []);

  const setTheme = useCallback((dark: boolean) => {
    setIsDarkState(dark);
    applyTheme(dark);
  }, []);

  return { isDark, toggleTheme, setTheme, mounted };
}

/**
 * Hook for managing notifications independently
 * Useful when you only need notification functionality
 */
export function useNotifications(initialCount: number = 0) {
  const [count, setCount] = useState(initialCount);

  const add = useCallback((amount: number = 1) => {
    setCount((prev) => Math.min(prev + amount, 999));
  }, []);

  const remove = useCallback((amount: number = 1) => {
    setCount((prev) => Math.max(prev - amount, 0));
  }, []);

  const clear = useCallback(() => {
    setCount(0);
  }, []);

  const set = useCallback((newCount: number) => {
    setCount(Math.max(0, Math.min(newCount, 999)));
  }, []);

  return { count, add, remove, clear, set, increment: add, decrement: remove };
}

/**
 * Hook for managing breadcrumbs independently
 * Useful when you only need breadcrumb functionality
 */
export function useBreadcrumbs(initialBreadcrumbs: BreadcrumbItem[] = []) {
  const [breadcrumbs, setBreadcrumbs] = useState(initialBreadcrumbs);

  const updateFromPathname = useCallback((pathname: string) => {
    const paths = pathname.split("/").filter(Boolean);
    const newBreadcrumbs: BreadcrumbItem[] = [
      { label: "Home", href: "/" },
      ...paths.map((path, index) => {
        const href = "/" + paths.slice(0, index + 1).join("/");
        const label = path
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");

        return {
          label,
          href: index === paths.length - 1 ? undefined : href,
        };
      }),
    ];
    setBreadcrumbs(newBreadcrumbs);
  }, []);

  const add = useCallback((item: BreadcrumbItem) => {
    setBreadcrumbs((prev) => [...prev, item]);
  }, []);

  const remove = useCallback((index: number) => {
    setBreadcrumbs((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clear = useCallback(() => {
    setBreadcrumbs([]);
  }, []);

  return {
    breadcrumbs,
    setBreadcrumbs,
    updateFromPathname,
    add,
    remove,
    clear,
  };
}
