"use client";

import React, { useState } from "react";
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  Modal,
  Toast,
  Loader,
  Alert,
} from "./ui";
import { Heart, Mail, Lock, Search, Sparkles, Zap } from "lucide-react";

export const UIComponentsShowcase: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const showToast = (type: "success" | "error" | "warning" | "info", message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(""), 5000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            UI Components Showcase
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Explore all reusable, accessible, and animated components
          </p>
        </div>

        {/* Buttons Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Buttons</h2>
          <Card variant="elevated">
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button variant="primary" onClick={() => showToast("success", "Primary clicked!")}>
                  Primary Button
                </Button>
                <Button variant="secondary" onClick={() => showToast("info", "Secondary clicked!")}>
                  Secondary Button
                </Button>
                <Button variant="ghost" onClick={() => showToast("warning", "Ghost clicked!")}>
                  Ghost Button
                </Button>
                <Button variant="danger" onClick={() => showToast("error", "Danger clicked!")}>
                  Danger Button
                </Button>
                <Button size="sm" variant="primary" leftIcon={<Heart size={16} />}>
                  Small
                </Button>
                <Button size="lg" variant="primary" rightIcon={<Zap size={20} />}>
                  Large
                </Button>
                <Button variant="primary" isLoading fullWidth>
                  Loading State
                </Button>
                <Button variant="primary" disabled>
                  Disabled
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Inputs Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Inputs</h2>
          <Card variant="elevated">
            <CardContent className="space-y-6">
              <Input
                label="Email Address"
                placeholder="you@example.com"
                icon={<Mail size={18} />}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                helperText="We'll never share your email"
              />
              <Input
                label="Password"
                placeholder="Enter your password"
                icon={<Lock size={18} />}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                showPasswordToggle
              />
              <Input
                label="Search"
                placeholder="Search components..."
                icon={<Search size={18} />}
                variant="filled"
              />
              <Input
                label="Error State"
                placeholder="Something went wrong"
                errorMessage="This field is required"
              />
              <Input
                label="Success State"
                placeholder="All good!"
                successMessage="Validated successfully"
              />
              <Input
                label="Loading State"
                placeholder="Checking availability..."
                isLoading
              />
            </CardContent>
          </Card>
        </section>

        {/* Cards Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card variant="default">
              <CardHeader>
                <CardTitle>Default Card</CardTitle>
                <CardDescription>Standard card with border</CardDescription>
              </CardHeader>
              <CardContent>
                <p>This is a basic card component with clean styling.</p>
              </CardContent>
            </Card>

            <Card variant="gradient" gradient="violet-blue" hoverable>
              <CardHeader>
                <CardTitle>Gradient Card</CardTitle>
                <CardDescription>With violet-blue gradient background</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Hover to see the animation effect on this card.</p>
              </CardContent>
            </Card>

            <Card variant="elevated" interactive onClick={() => setIsModalOpen(true)}>
              <CardHeader>
                <CardTitle>Elevated Card</CardTitle>
                <CardDescription>Click to open modal</CardDescription>
              </CardHeader>
              <CardContent>
                <p>This is an interactive card with elevation shadow.</p>
              </CardContent>
              <CardFooter>
                <Button size="sm" variant="primary">
                  Open Modal
                </Button>
              </CardFooter>
            </Card>

            <Card variant="outlined" gradient="emerald-teal">
              <CardHeader>
                <CardTitle>Outlined Card</CardTitle>
                <CardDescription>With emerald-teal gradient</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Clean outlined style with gradient background.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Badges Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Badges</h2>
          <Card variant="elevated">
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="solid" color="primary">
                  Primary
                </Badge>
                <Badge variant="solid" color="success">
                  Success
                </Badge>
                <Badge variant="solid" color="warning">
                  Warning
                </Badge>
                <Badge variant="solid" color="danger">
                  Danger
                </Badge>
                <Badge variant="solid" color="info">
                  Info
                </Badge>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" color="primary">
                  Outlined
                </Badge>
                <Badge variant="ghost" color="secondary">
                  Ghost
                </Badge>
                <Badge variant="dot" color="success">
                  Dot Badge
                </Badge>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge size="sm" color="primary" pill>
                  Small Pill
                </Badge>
                <Badge size="md" color="primary" pill animated>
                  Animated Pill
                </Badge>
                <Badge removable onRemove={() => showToast("info", "Badge removed")}>
                  Removable Badge
                </Badge>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Modal Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Modal</h2>
          <Card variant="elevated">
            <CardContent>
              <Button onClick={() => setIsModalOpen(true)} variant="primary">
                Open Modal Dialog
              </Button>
            </CardContent>
          </Card>

          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Welcome to Modal"
            description="This is a fully accessible modal with animations"
            size="md"
            footer={
              <>
                <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={() => {
                  setIsModalOpen(false);
                  showToast("success", "Modal action confirmed!");
                }}>
                  Confirm
                </Button>
              </>
            }
          >
            <div className="space-y-4">
              <p>
                This modal includes several features:
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-700 dark:text-slate-300">
                <li>Keyboard navigation (Tab, Shift+Tab, Escape)</li>
                <li>Focus management</li>
                <li>Smooth animations</li>
                <li>Dark mode support</li>
                <li>Backdrop blur effect</li>
              </ul>
            </div>
          </Modal>
        </section>

        {/* Loaders Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Loaders</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            <Card variant="elevated" className="flex items-center justify-center min-h-40">
              <div className="text-center">
                <Loader variant="spinner" size="md" />
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-3">Spinner</p>
              </div>
            </Card>
            <Card variant="elevated" className="flex items-center justify-center min-h-40">
              <div className="text-center">
                <Loader variant="dots" size="md" />
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-3">Dots</p>
              </div>
            </Card>
            <Card variant="elevated" className="flex items-center justify-center min-h-40">
              <div className="text-center">
                <Loader variant="pulse" size="md" />
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-3">Pulse</p>
              </div>
            </Card>
            <Card variant="elevated" className="flex items-center justify-center min-h-40">
              <div className="text-center">
                <Loader variant="bars" size="md" />
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-3">Bars</p>
              </div>
            </Card>
            <Card variant="elevated" className="flex items-center justify-center min-h-40">
              <div className="text-center">
                <Loader variant="spinner" size="sm" />
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-3">Small</p>
              </div>
            </Card>
            <Card variant="elevated" className="flex items-center justify-center min-h-40">
              <div className="text-center">
                <Loader variant="spinner" size="lg" />
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-3">Large</p>
              </div>
            </Card>
          </div>
        </section>

        {/* Alerts Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Alerts</h2>
          <Card variant="elevated">
            <CardContent className="space-y-4">
              <Alert
                variant="success"
                style="soft"
                title="Success!"
                description="Your changes have been saved successfully."
                showIcon
                dismissible
              />
              <Alert
                variant="info"
                style="soft"
                title="Information"
                description="This is an informational message to guide you."
                showIcon
              />
              <Alert
                variant="warning"
                style="soft"
                title="Warning"
                description="Please review this before proceeding."
                showIcon
                dismissible
              />
              <Alert
                variant="error"
                style="soft"
                title="Error"
                description="Something went wrong. Please try again."
                showIcon
                dismissible
                action={{
                  label: "Retry",
                  onClick: () => showToast("info", "Retry clicked"),
                }}
              />
            </CardContent>
          </Card>
        </section>

        {/* Features */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Component Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Accessible",
                description: "Full ARIA labels, keyboard navigation, and screen reader support",
                icon: "♿",
              },
              {
                title: "Dark Mode",
                description: "Automatic dark mode support with optimized colors",
                icon: "🌙",
              },
              {
                title: "Animated",
                description: "Smooth Framer Motion animations throughout",
                icon: "✨",
              },
              {
                title: "TypeScript",
                description: "Full type safety with comprehensive interfaces",
                icon: "📘",
              },
              {
                title: "Responsive",
                description: "Mobile-first design with responsive utilities",
                icon: "📱",
              },
              {
                title: "Customizable",
                description: "Variants, sizes, and className overrides",
                icon: "🎨",
              },
            ].map((feature, index) => (
              <Card key={index} variant="default">
                <CardContent className="pt-6">
                  <div className="text-4xl mb-3">{feature.icon}</div>
                  <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Toast Demo */}
        {toastMessage && (
          <div className="fixed bottom-8 right-8 z-50">
            <Toast
              id="demo-toast"
              type="info"
              message={toastMessage}
              onClose={() => setToastMessage("")}
              duration={5000}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default UIComponentsShowcase;
