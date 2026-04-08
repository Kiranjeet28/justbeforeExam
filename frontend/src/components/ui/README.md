# UI Components Documentation

Comprehensive documentation for all reusable UI components in Just Before Exam frontend.

## Table of Contents

1. [Overview](#overview)
2. [Button Component](#button-component)
3. [Input Component](#input-component)
4. [Card Component](#card-component)
5. [Badge Component](#badge-component)
6. [Modal Component](#modal-component)
7. [Toast Component](#toast-component)
8. [Loader Component](#loader-component)
9. [Alert Component](#alert-component)
10. [Best Practices](#best-practices)
11. [Accessibility](#accessibility)
12. [Dark Mode](#dark-mode)

---

## Overview

This UI library provides a comprehensive set of reusable, accessible, and animated components built with:

- **TypeScript** - Full type safety with comprehensive interfaces
- **Tailwind CSS** - Utility-first styling with custom color scheme
- **Framer Motion** - Smooth animations and transitions
- **Lucide React** - Beautiful icon library
- **Accessibility** - WCAG 2.1 compliant with ARIA labels

### Installation

All components are located in `src/components/ui/` and can be imported from the barrel export:

```typescript
import {
  Button,
  Input,
  Card,
  Badge,
  Modal,
  Toast,
  Loader,
  Alert
} from '@/components/ui';
```

---

## Button Component

A versatile button component with multiple variants and states.

### Basic Usage

```typescript
import { Button } from '@/components/ui';

export function MyComponent() {
  return <Button>Click me</Button>;
}
```

### Props

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  children: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  disabled?: boolean;
}
```

### Examples

```typescript
// Variants
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="danger">Delete</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

// With Icons
<Button leftIcon={<Heart size={20} />}>Like</Button>
<Button rightIcon={<ArrowRight size={20} />}>Next</Button>

// States
<Button isLoading>Processing...</Button>
<Button disabled>Disabled</Button>
<Button fullWidth>Full Width</Button>
```

### Features

- ✅ Multiple variants (primary, secondary, ghost, danger)
- ✅ Three sizes (sm, md, lg)
- ✅ Loading state with spinner animation
- ✅ Icon support (left/right positioning)
- ✅ Hover/focus animations
- ✅ Full width option
- ✅ Keyboard accessible
- ✅ Dark mode support

---

## Input Component

Enhanced text input with validation states and helper text.

### Basic Usage

```typescript
import { Input } from '@/components/ui';

export function MyComponent() {
  const [email, setEmail] = useState('');
  
  return (
    <Input
      label="Email"
      type="email"
      placeholder="you@example.com"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
    />
  );
}
```

### Props

```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  placeholder?: string;
  helperText?: string;
  errorMessage?: string;
  successMessage?: string;
  state?: "default" | "error" | "success" | "warning";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
  isLoading?: boolean;
  showPasswordToggle?: boolean;
  disabled?: boolean;
}
```

### Examples

```typescript
// Basic input
<Input label="Name" placeholder="Enter your name" />

// Email with validation
<Input
  label="Email"
  type="email"
  placeholder="you@example.com"
  helperText="We'll never share your email"
/>

// Password with toggle
<Input
  label="Password"
  type="password"
  showPasswordToggle
/>

// Error state
<Input
  label="Username"
  placeholder="Pick a username"
  errorMessage="Username already taken"
/>

// Success state
<Input
  label="Code"
  placeholder="Enter verification code"
  successMessage="Code verified!"
/>

// With icon
<Input
  icon={<Mail size={18} />}
  placeholder="Search..."
  iconPosition="left"
/>

// Loading state
<Input
  placeholder="Checking availability..."
  isLoading
/>
```

### Features

- ✅ Label and helper text
- ✅ Validation states (error, success, warning)
- ✅ Password toggle visibility
- ✅ Icon support
- ✅ Loading state
- ✅ Three sizes
- ✅ Three variants (default, filled, flushed)
- ✅ Keyboard accessible
- ✅ Dark mode support

---

## Card Component

Container component with variants and optional interactivity.

### Basic Usage

```typescript
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui';

export function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
      </CardHeader>
      <CardContent>
        Card content goes here
      </CardContent>
      <CardFooter>
        <Button>Action</Button>
      </CardFooter>
    </Card>
  );
}
```

### Props

```typescript
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "outlined" | "gradient";
  gradient?: "violet-blue" | "blue-cyan" | "emerald-teal" | "amber-orange" | "rose-red" | "none";
  hoverable?: boolean;
  interactive?: boolean;
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  children: React.ReactNode;
}
```

### Examples

```typescript
// Default card
<Card variant="default">
  <CardContent>Content</CardContent>
</Card>

// Elevated card
<Card variant="elevated">
  <CardContent>Elevated content</CardContent>
</Card>

// Gradient card
<Card variant="gradient" gradient="violet-blue">
  <CardContent>Gradient content</CardContent>
</Card>

// Hoverable card
<Card hoverable>
  <CardContent>Hover me!</CardContent>
</Card>

// Interactive card
<Card interactive onClick={() => console.log('clicked')}>
  <CardContent>Click me!</CardContent>
</Card>

// With subcomponents
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Main content
  </CardContent>
  <CardFooter>
    Footer content
  </CardFooter>
</Card>
```

### Features

- ✅ Multiple variants (default, elevated, outlined, gradient)
- ✅ Gradient backgrounds (6 presets)
- ✅ Hover effects
- ✅ Interactive mode
- ✅ Subcomponents (Header, Title, Description, Content, Footer)
- ✅ Customizable padding
- ✅ Keyboard accessible (interactive mode)
- ✅ Dark mode support

---

## Badge Component

Compact label for displaying tags, statuses, and counts.

### Basic Usage

```typescript
import { Badge } from '@/components/ui';

export function MyComponent() {
  return <Badge color="primary">New</Badge>;
}
```

### Props

```typescript
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "solid" | "outline" | "ghost" | "dot";
  color?: "primary" | "secondary" | "success" | "warning" | "danger" | "info" | "neutral";
  size?: "xs" | "sm" | "md" | "lg";
  icon?: React.ReactNode;
  onRemove?: () => void;
  removable?: boolean;
  pill?: boolean;
  animated?: boolean;
  children: React.ReactNode;
}
```

### Examples

```typescript
// Color variants
<Badge color="primary">Primary</Badge>
<Badge color="success">Active</Badge>
<Badge color="warning">Pending</Badge>
<Badge color="danger">Critical</Badge>
<Badge color="info">Info</Badge>

// Style variants
<Badge variant="solid">Solid</Badge>
<Badge variant="outline">Outline</Badge>
<Badge variant="ghost">Ghost</Badge>
<Badge variant="dot">Dot</Badge>

// Sizes
<Badge size="xs">Extra small</Badge>
<Badge size="sm">Small</Badge>
<Badge size="md">Medium</Badge>
<Badge size="lg">Large</Badge>

// Pill style
<Badge pill>Pill Badge</Badge>

// Removable
<Badge removable onRemove={() => console.log('removed')}>
  Remove me
</Badge>

// Animated
<Badge animated color="success">
  Live
</Badge>

// With icon
<Badge icon={<Star size={16} />}>Featured</Badge>
```

### Features

- ✅ Multiple color options
- ✅ 4 style variants
- ✅ 4 size options
- ✅ Pill style
- ✅ Removable with callback
- ✅ Icon support
- ✅ Animation option
- ✅ Dot variant for status indicators
- ✅ Dark mode support

---

## Modal Component

Accessible dialog/modal for important actions.

### Basic Usage

```typescript
import { Modal, Button } from '@/components/ui';
import { useState } from 'react';

export function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
      
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Modal Title"
        description="Modal description goes here"
      >
        Modal content
      </Modal>
    </>
  );
}
```

### Props

```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  footer?: React.ReactNode;
}
```

### Examples

```typescript
// Basic modal
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Action"
>
  Are you sure you want to proceed?
</Modal>

// With footer
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Settings"
  footer={
    <>
      <Button variant="secondary" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button variant="primary" onClick={handleSave}>
        Save
      </Button>
    </>
  }
>
  Modal content
</Modal>

// Different sizes
<Modal size="sm">Small</Modal>
<Modal size="md">Medium</Modal>
<Modal size="lg">Large</Modal>
<Modal size="xl">Extra Large</Modal>
<Modal size="2xl">2XL</Modal>

// Control close behavior
<Modal
  closeOnEscape={true}
  closeOnOverlayClick={false}
  showCloseButton={true}
>
  Content
</Modal>
```

### Features

- ✅ Backdrop blur effect
- ✅ 5 size options
- ✅ Configurable close behavior
- ✅ Focus management
- ✅ Keyboard navigation (Tab, Escape)
- ✅ Custom header/footer
- ✅ Smooth animations
- ✅ Prevents body scroll
- ✅ Accessibility features
- ✅ Dark mode support

---

## Toast Component

Notifications that appear temporarily on screen.

### Basic Usage

```typescript
import { Toast, useToast, ToastProvider } from '@/components/ui';

// In layout.tsx
export default function RootLayout({ children }) {
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  );
}

// In your component
export function MyComponent() {
  const { addToast } = useToast();
  
  return (
    <Button
      onClick={() =>
        addToast({
          type: 'success',
          title: 'Success',
          message: 'Action completed!'
        })
      }
    >
      Show Toast
    </Button>
  );
}
```

### Props

```typescript
interface ToastProps {
  id?: string;
  type?: "success" | "error" | "warning" | "info";
  title?: string;
  message?: string;
  duration?: number;
  onClose?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ReactNode;
  dismissible?: boolean;
}

interface ToastProviderProps {
  children: React.ReactNode;
  position?: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
  maxToasts?: number;
}
```

### Examples

```typescript
const { addToast } = useToast();

// Success toast
addToast({
  type: 'success',
  title: 'Success!',
  message: 'Changes saved successfully',
  duration: 3000
});

// Error toast
addToast({
  type: 'error',
  title: 'Error',
  message: 'Failed to save changes',
  duration: 5000
});

// Warning toast
addToast({
  type: 'warning',
  title: 'Warning',
  message: 'This action cannot be undone'
});

// Info toast
addToast({
  type: 'info',
  message: 'New updates available'
});

// Toast with action
addToast({
  type: 'info',
  message: 'Download ready',
  action: {
    label: 'Download',
    onClick: () => console.log('download')
  }
});

// Persistent toast (no auto-dismiss)
addToast({
  type: 'info',
  message: 'Important notice',
  duration: 0
});
```

### Features

- ✅ 4 type variants (success, error, warning, info)
- ✅ Auto-dismiss with configurable duration
- ✅ Optional action button
- ✅ Dismissible by user
- ✅ 6 position options
- ✅ Maximum toast limit
- ✅ Toast context hook
- ✅ Progress bar for auto-dismiss
- ✅ Dark mode support

---

## Loader Component

Loading indicators with multiple animation styles.

### Basic Usage

```typescript
import { Loader } from '@/components/ui';

export function MyComponent() {
  return <Loader variant="spinner" size="md" />;
}
```

### Props

```typescript
interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "spinner" | "skeleton" | "progress" | "pulse" | "dots" | "bars";
  size?: "sm" | "md" | "lg" | "xl";
  color?: "violet" | "blue" | "emerald" | "red" | "amber";
  text?: string;
  progress?: number;
  isLoading?: boolean;
  fullscreen?: boolean;
  overlay?: boolean;
}
```

### Examples

```typescript
// Spinner variants
<Loader variant="spinner" size="md" />
<Loader variant="dots" size="md" />
<Loader variant="pulse" size="md" />
<Loader variant="bars" size="md" />

// Sizes
<Loader size="sm" />
<Loader size="md" />
<Loader size="lg" />
<Loader size="xl" />

// With text
<Loader text="Loading..." />
<Loader text="Processing your request..." />

// With color
<Loader color="violet" />
<Loader color="emerald" />
<Loader color="red" />

// Progress bar
<Loader variant="progress" progress={65} />

// Skeleton loading
<Loader variant="skeleton" />

// Fullscreen with overlay
<Loader
  variant="spinner"
  fullscreen
  overlay
  text="Loading application..."
/>
```

### Features

- ✅ 6 animation variants
- ✅ 4 size options
- ✅ 5 color options
- ✅ Optional text
- ✅ Progress bar variant
- ✅ Skeleton placeholder
- ✅ Fullscreen mode
- ✅ Overlay mode
- ✅ Dark mode support

---

## Alert Component

Alert messages for errors, warnings, success, and info.

### Basic Usage

```typescript
import { Alert } from '@/components/ui';

export function MyComponent() {
  return (
    <Alert
      variant="success"
      style="soft"
      title="Success!"
      description="Your action was completed."
    />
  );
}
```

### Props

```typescript
interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "success" | "error" | "warning" | "info";
  style?: "solid" | "soft" | "outlined";
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
  onDismiss?: () => void;
  showIcon?: boolean;
  children?: React.ReactNode;
}
```

### Examples

```typescript
// Success alert
<Alert
  variant="success"
  style="soft"
  title="Success!"
  description="Your changes have been saved."
/>

// Error alert
<Alert
  variant="error"
  style="solid"
  title="Error"
  description="Something went wrong. Please try again."
/>

// Warning alert
<Alert
  variant="warning"
  style="outlined"
  title="Warning"
  description="Please review before proceeding."
/>

// Info alert
<Alert
  variant="info"
  style="soft"
  description="New features available"
/>

// Dismissible alert
<Alert
  variant="success"
  title="Success"
  description="Operation completed"
  dismissible
  onDismiss={() => console.log('dismissed')}
/>

// With action
<Alert
  variant="error"
  title="Error"
  description="Failed to upload file"
  action={{
    label: 'Retry',
    onClick: () => console.log('retry')
  }}
/>

// Custom icon
<Alert
  variant="info"
  icon={<CustomIcon />}
  title="Custom Icon"
/>

// Without icon
<Alert
  variant="success"
  title="Success"
  showIcon={false}
/>
```

### Features

- ✅ 4 variant types (success, error, warning, info)
- ✅ 3 style options (solid, soft, outlined)
- ✅ Custom icon support
- ✅ Optional action button
- ✅ Dismissible
- ✅ Title and description
- ✅ Children support
- ✅ Animations
- ✅ Dark mode support

---

## Best Practices

### Component Composition

```typescript
// Good: Use components in composition
export function UserForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>User Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <Input
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          errorMessage={error}
        />
      </CardContent>
      <CardFooter>
        <Button variant="primary">Save</Button>
      </CardFooter>
    </Card>
  );
}
```

### State Management

```typescript
// Good: Use states appropriately
const [isLoading, setIsLoading] = useState(false);
const [success, setSuccess] = useState(false);

const handleSubmit = async () => {
  setIsLoading(true);
  try {
    await saveData();
    setSuccess(true);
  } finally {
    setIsLoading(false);
  }
};
```

### Error Handling

```typescript
// Good: Show errors with validation
const [errors, setErrors] = useState({});

const handleChange = (field: string, value: string) => {
  if (!value.trim()) {
    setErrors(prev => ({...prev, [field]: 'Required'}));
  } else {
    setErrors(prev => ({...prev, [field]: ''}));
  }
};
```

---

## Accessibility

All components include:

- ✅ **ARIA Labels** - Proper ARIA attributes for screen readers
- ✅ **Keyboard Navigation** - Full keyboard support (Tab, Enter, Escape)
- ✅ **Focus Management** - Proper focus indicators and management
- ✅ **Color Contrast** - WCAG AA compliant contrast ratios
- ✅ **Semantic HTML** - Proper HTML semantics for better accessibility
- ✅ **Role Attributes** - Correct role attributes for interactive elements
- ✅ **Error Messages** - Descriptive error messages linked to fields

### Example: Accessible Form

```typescript
export function AccessibleForm() {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState('');
  
  return (
    <div role="form" aria-label="User Registration">
      <Input
        id="email-input"
        label="Email Address"
        aria-describedby="email-help"
        aria-invalid={!!errors}
        aria-errormessage={errors ? 'email-error' : undefined}
        onChange={(e) => setEmail(e.target.value)}
      />
      {errors && (
        <div id="email-error" role="alert">
          {errors}
        </div>
      )}
    </div>
  );
}
```

---

## Dark Mode

All components automatically support dark mode through Tailwind's `dark:` prefix. Dark mode is controlled by:

1. HTML class attribute: `dark` on `<html>` element
2. System preference detection
3. Manual toggle in app settings

### Dark Mode Support

- ✅ All color variants adapt to dark mode
- ✅ Text contrast maintained in dark mode
- ✅ Smooth transitions between modes
- ✅ Preference persisted in localStorage

### Example: Dark Mode Toggle

```typescript
export function DarkModeToggle() {
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains('dark')
  );
  
  const toggle = () => {
    document.documentElement.classList.toggle('dark');
    setIsDark(!isDark);
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
  };
  
  return <Button onClick={toggle}>Toggle Dark Mode</Button>;
}
```

---

## Color Scheme

### Primary Colors
- **Violet**: Primary actions and accents
- **Blue**: Secondary information
- **Emerald**: Success states
- **Red**: Danger/Error states
- **Amber**: Warning states

### Semantic Colors
- **Success**: Emerald (0.65 0.16 142.5)
- **Warning**: Amber (0.77 0.18 70)
- **Error**: Red (0.577 0.245 27.325)
- **Info**: Blue (0.65 0.16 270)

---

## Performance Tips

1. **Lazy Load Modals** - Only render when open
2. **Memoize Callbacks** - Use `useCallback` for event handlers
3. **Code Split Components** - Use dynamic imports for heavy components
4. **Optimize Re-renders** - Use `React.memo` for expensive components

```typescript
const HeavyComponent = React.memo(({ data }) => {
  return <div>{data}</div>;
});
```

---

## Troubleshooting

### Animations Not Showing
- Ensure Framer Motion is installed
- Check if animations are disabled in browser settings
- Verify `prefers-reduced-motion` media query

### Dark Mode Not Working
- Add `suppressHydrationWarning` to `<html>` tag
- Ensure dark class is properly toggled
- Clear browser cache

### Focus Visible Not Showing
- Check CSS for outline removal
- Ensure focus-visible utility is in Tailwind config
- Test with keyboard navigation

---

## Contributing

When adding new components:

1. Follow TypeScript interfaces
2. Include Framer Motion animations
3. Add dark mode support
4. Include accessibility features
5. Write comprehensive documentation
6. Add examples to showcase

---

Last updated: 2024