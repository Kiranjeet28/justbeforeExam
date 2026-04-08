# UI Components Quick Start Guide

Get up and running with the UI component library in 5 minutes.

## Installation

All components are pre-built and ready to use. No additional installation needed!

```typescript
import {
  Button,
  Input,
  Card,
  Badge,
  Modal,
  Toast,
  Loader,
  Alert,
} from '@/components/ui';
```

## 1. Basic Button

```typescript
<Button>Click me</Button>
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="danger">Delete</Button>
```

## 2. Input Fields

```typescript
<Input label="Email" placeholder="you@example.com" />
<Input label="Password" type="password" showPasswordToggle />
<Input label="Search" icon={<Search size={18} />} />
```

## 3. Cards

```typescript
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';

<Card>
  <CardHeader>
    <CardTitle>My Card</CardTitle>
  </CardHeader>
  <CardContent>
    Card content goes here
  </CardContent>
</Card>
```

## 4. Badges

```typescript
<Badge color="primary">New</Badge>
<Badge color="success">Active</Badge>
<Badge color="danger">Critical</Badge>
<Badge removable>Tag</Badge>
```

## 5. Toast Notifications

```typescript
// In layout.tsx
import { ToastProvider } from '@/components/ui';

export default function RootLayout({ children }) {
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  );
}

// In your component
import { useToast } from '@/components/ui';

export function MyComponent() {
  const { addToast } = useToast();

  return (
    <Button
      onClick={() =>
        addToast({
          type: 'success',
          title: 'Success!',
          message: 'Changes saved',
        })
      }
    >
      Save
    </Button>
  );
}
```

## 6. Modal Dialog

```typescript
import { Modal } from '@/components/ui';
import { useState } from 'react';

export function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open</Button>
      
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Confirm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setIsOpen(false)}>
              Confirm
            </Button>
          </>
        }
      >
        Are you sure?
      </Modal>
    </>
  );
}
```

## 7. Loaders

```typescript
<Loader variant="spinner" size="md" />
<Loader variant="dots" size="md" />
<Loader variant="pulse" size="md" text="Loading..." />
```

## 8. Alerts

```typescript
<Alert
  variant="success"
  title="Success!"
  description="Operation completed"
/>

<Alert
  variant="error"
  title="Error"
  description="Something went wrong"
  dismissible
/>
```

## Common Patterns

### Form with Validation

```typescript
export function LoginForm() {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors('');
    setIsLoading(true);

    try {
      // Submit
      await submitForm(email);
      addToast({
        type: 'success',
        message: 'Login successful!',
      });
    } catch (error) {
      setErrors(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-md">
      <CardContent className="space-y-4">
        <Input
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          errorMessage={errors}
          type="email"
        />
        <Button
          variant="primary"
          fullWidth
          isLoading={isLoading}
          onClick={handleSubmit}
        >
          Login
        </Button>
      </CardContent>
    </Card>
  );
}
```

### List with Status Badges

```typescript
export function UserList({ users }) {
  return (
    <div className="space-y-2">
      {users.map((user) => (
        <Card key={user.id} hoverable>
          <CardContent className="flex items-center justify-between py-3">
            <span>{user.name}</span>
            <Badge
              color={user.isActive ? 'success' : 'warning'}
              variant="dot"
            >
              {user.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

### Loading State

```typescript
export function DataTable() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchData().then(setData).finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Loader variant="spinner" text="Loading..." />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {data.map((item) => (
        <Card key={item.id}>
          <CardContent>{item.name}</CardContent>
        </Card>
      ))}
    </div>
  );
}
```

## Tips & Tricks

### 1. Use `cn()` for Conditional Styles

```typescript
import { cn } from '@/lib/utils';

<Button className={cn(
  'text-lg',
  isSpecial && 'font-bold'
)}>
  Click
</Button>
```

### 2. Icon Integration

```typescript
import { Heart, Mail, Lock, Star } from 'lucide-react';

<Input icon={<Mail size={18} />} />
<Button leftIcon={<Heart size={20} />}>Like</Button>
<Badge icon={<Star size={16} />}>Featured</Badge>
```

### 3. Dark Mode is Automatic

```typescript
// No special code needed!
// Just use the components and they'll adapt to dark mode
<Button>This works in both light and dark mode</Button>
```

### 4. Responsive Design

```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <Card>Card 1</Card>
  <Card>Card 2</Card>
  <Card>Card 3</Card>
</div>
```

### 5. Keyboard Accessible

All components support:
- Tab navigation
- Enter/Space activation
- Escape to close modals
- Arrow keys where appropriate

No extra code needed!

## Component Sizes

Most components support three sizes:

```typescript
// Size variants
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

<Input size="sm" />
<Input size="md" />
<Input size="lg" />

<Badge size="xs" />
<Badge size="sm" />
<Badge size="md" />
<Badge size="lg" />

<Loader size="sm" />
<Loader size="md" />
<Loader size="lg" />
<Loader size="xl" />
```

## States

### Button States

```typescript
<Button disabled>Disabled</Button>
<Button isLoading>Loading</Button>
```

### Input States

```typescript
<Input errorMessage="This is required" />
<Input successMessage="Email verified" />
<Input isLoading />
```

### Toast Types

```typescript
addToast({ type: 'success', message: '...' })
addToast({ type: 'error', message: '...' })
addToast({ type: 'warning', message: '...' })
addToast({ type: 'info', message: '...' })
```

## Common Mistakes to Avoid

❌ **Don't:** Forget to wrap in ToastProvider
```typescript
// Missing in layout
// <ToastProvider>{children}</ToastProvider>
```

✅ **Do:** Add provider to layout
```typescript
export default function Layout({ children }) {
  return (
    <html>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
```

---

❌ **Don't:** Use hardcoded colors
```typescript
<div className="bg-blue-500">Wrong</div>
```

✅ **Do:** Use provided color options
```typescript
<Badge color="primary">Right</Badge>
```

---

❌ **Don't:** Forget accessibility attributes
```typescript
<input type="checkbox" />
```

✅ **Do:** Use proper components with built-in accessibility
```typescript
<Input label="Accept terms" type="checkbox" />
```

## Next Steps

- Check `README.md` for detailed documentation
- View `UIComponentsShowcase.tsx` for live examples
- Read component prop types for all options
- Explore color and size variants

## Need Help?

- Check component `README.md` for detailed docs
- View the showcase component for live examples
- Check individual component files for TypeScript interfaces
- Refer to Framer Motion docs for animation customization

---

**Happy building! 🚀**