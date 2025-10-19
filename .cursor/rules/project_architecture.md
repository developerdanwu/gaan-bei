# gaan-bei Project Architecture

## Tech Stack

This is a native mobile application targeting **iOS and Android only** (no web support), built with:

- **Frontend Framework**: React Native 0.81.4 with React 19.1.0
- **App Framework**: Expo ~54.0.13 (with new architecture enabled)
- **Routing**: Expo Router 6.0.11 (file-based routing)
- **Backend**: Convex 1.28.0 (real-time database with serverless functions)
- **Authentication**: Clerk Expo 2.17.0
- **Styling**: NativeWind 4.2.1 (Tailwind CSS for React Native)
- **Language**: TypeScript 5.9.2 (strict mode)
- **State Management**: Convex queries/mutations (built-in reactivity)
- **Forms**: @tanstack/react-form 1.23.7
- **Target Platforms**: iOS and Android (no web)

## Project Structure

```
gaan-bei/
├── app/                      # File-based routing (expo-router)
│   ├── _layout.tsx          # Root layout with providers
│   ├── (auth)/              # Authentication routes group
│   ├── (tabs)/              # Tab navigation routes group
│   │   ├── _layout.tsx     # Tab navigator configuration
│   │   ├── index.tsx       # Home tab
│   │   └── explore.tsx     # Explore tab
│   └── sign-in.tsx         # Sign-in screen
│
├── components/              # Reusable React components
│   ├── ui/                 # shadcn/ui-inspired primitives (adapted for RN)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── text.tsx
│   │   └── ...
│   ├── sign-in-form.tsx
│   ├── social-connections.tsx
│   └── ...
│
├── convex/                  # Backend (Convex serverless functions)
│   ├── _generated/         # Auto-generated Convex types
│   ├── schema.ts           # Database schema definition
│   ├── auth.config.ts      # Clerk authentication config
│   ├── http.ts             # HTTP endpoints (webhooks)
│   └── users.ts            # User-related queries/mutations
│
├── lib/                     # Shared utilities and configuration
│   ├── utils.ts            # Utility functions (cn helper)
│   └── theme.ts            # Theme configuration (light/dark)
│
├── hooks/                   # Custom React hooks
│   ├── use-color-scheme.ts
│   └── use-theme-color.ts
│
├── constants/               # App-wide constants
│   └── theme.ts
│
├── utils/                   # Utility modules
│   └── cache.ts            # Token cache for Clerk
│
└── global.css              # Global styles and CSS variables
```

## Authentication Architecture

### Provider Hierarchy

The root layout (`app/_layout.tsx`) establishes the following provider hierarchy:

```tsx
<SafeAreaView>
  <ClerkProvider publishableKey={...} tokenCache={tokenCache}>
    <ClerkLoaded>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <ThemeProvider value={...}>
          <Slot />
        </ThemeProvider>
      </ConvexProviderWithClerk>
    </ClerkLoaded>
  </ClerkProvider>
</SafeAreaView>
```

**Key points:**
- `SafeAreaView` ensures content respects device safe areas
- `ClerkProvider` handles authentication state
- `ClerkLoaded` prevents rendering before Clerk initializes
- `ConvexProviderWithClerk` integrates Convex with Clerk auth
- `ThemeProvider` manages light/dark mode
- `tokenCache` uses `expo-secure-store` for secure token storage

### Token Caching

File: `utils/cache.ts`

```typescript
export const tokenCache = createTokenCache();
```

**Pattern**: Use `expo-secure-store` for secure token storage on iOS and Android.

### User Synchronization

Two-way sync between Clerk and Convex:

1. **Client-side sync** (`convex/users.ts:syncUser`):
   - Called from client after authentication
   - Creates or updates user in Convex database
   - Uses mutation (can be called from client)

2. **Webhook sync** (`convex/http.ts:/clerk-webhook`):
   - Clerk webhooks trigger on user.created/updated/deleted
   - Calls `internal.users.upsertUserFromClerk` or `deleteUserByClerkId`
   - Uses internal mutations (cannot be called from client)

**Setup requirements:**
- Add `CLERK_JWT_ISSUER_DOMAIN` to Convex env vars
- Add `CLERK_WEBHOOK_SECRET` to Convex env vars
- Configure Clerk webhook to point to `https://your-deployment.convex.site/clerk-webhook`

## Backend Patterns (Convex)

### Database Schema

File: `convex/schema.ts`

```typescript
export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"]),
});
```

**Conventions:**
- Always define indexes for fields used in queries
- Index names follow pattern: `by_fieldName` or `by_field1_and_field2`
- Use `v.optional()` for nullable fields
- System fields `_id` and `_creationTime` are auto-added

### Function Types

**Public Functions** (callable from client):
- `query` - Read-only operations
- `mutation` - Write operations
- `action` - Non-transactional operations (can call external APIs)

**Internal Functions** (only callable from other Convex functions):
- `internalQuery`
- `internalMutation`
- `internalAction`

**Example pattern:**
```typescript
// Public mutation - callable from client
export const syncUser = mutation({
  args: { clerkId: v.string(), email: v.string(), ... },
  returns: v.id("users"),
  handler: async (ctx, args) => { ... }
});

// Internal mutation - only callable from other Convex functions
export const upsertUserFromClerk = internalMutation({
  args: { clerkId: v.string(), email: v.string(), ... },
  returns: v.id("users"),
  handler: async (ctx, args) => { ... }
});
```

### Authentication in Convex

Access authenticated user via `ctx.auth.getUserIdentity()`:

```typescript
export const getCurrentUser = query({
  args: {},
  returns: v.union(v.object({ ... }), v.null()),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    
    return user;
  },
});
```

**Key points:**
- `identity.subject` contains the Clerk user ID
- Always check if `identity` exists before proceeding
- Use indexes for efficient queries

### HTTP Endpoints

File: `convex/http.ts`

```typescript
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

const http = httpRouter();

http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Handle webhook
  }),
});

export default http;
```

**Endpoints are accessible at:** `https://your-deployment.convex.site/clerk-webhook`

## Styling System

### NativeWind Configuration

NativeWind enables Tailwind CSS in React Native with full TypeScript support.

**Global styles** (`global.css`):
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* CSS variables for theming */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 3.9%;
    --primary: 0 0% 9%;
    /* ... more tokens */
  }
  .dark {
    --background: 0 0% 3.9%;
    --foreground: 0 0% 98%;
    /* ... dark mode tokens */
  }
}
```

**Tailwind config** (`tailwind.config.ts`):
- Uses `nativewind/preset`
- Dark mode: `"class"` based
- Content: `["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"]`
- Extended colors map to CSS variables via `hsl(var(--token))`

### Theme System

File: `lib/theme.ts`

Defines light/dark theme tokens and navigation themes:

```typescript
export const THEME = {
  light: {
    background: "hsl(0 0% 100%)",
    foreground: "hsl(0 0% 3.9%)",
    primary: "hsl(0 0% 9%)",
    // ... more tokens
  },
  dark: { ... }
};

export const NAV_THEME = {
  light: { ...DefaultTheme, colors: { ... } },
  dark: { ...DarkTheme, colors: { ... } }
};
```

### Component Styling Pattern

UI components follow the shadcn/ui pattern adapted for React Native:

```typescript
import { cva, type VariantProps } from 'class-variance-authority';
import { Pressable } from 'react-native';
import { cn } from '@/lib/utils';

// Define variants using cva
const buttonVariants = cva(
  'group shrink-0 flex-row items-center justify-center gap-2 rounded-md shadow-none',
  {
    variants: {
      variant: {
        default: 'bg-primary active:bg-primary/90 shadow-sm shadow-black/5',
        destructive: 'bg-destructive active:bg-destructive/90 dark:bg-destructive/60 shadow-sm shadow-black/5',
        outline: 'border-border bg-background active:bg-accent border shadow-sm shadow-black/5',
      },
      size: { 
        default: 'h-10 px-4 py-2',
        sm: 'h-9 gap-1.5 rounded-md px-3',
        lg: 'h-11 rounded-md px-6'
      }
    },
    defaultVariants: { variant: 'default', size: 'default' }
  }
);

// Component props with variants
type ButtonProps = React.ComponentProps<typeof Pressable> & 
  VariantProps<typeof buttonVariants>;

// Component implementation
function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <Pressable
      className={cn(
        props.disabled && 'opacity-50',
        buttonVariants({ variant, size }),
        className
      )}
      {...props}
    />
  );
}
```

**Key patterns:**
- Use `cva` for variant management
- Use `active:` pseudo-classes for press states (native only)
- Always export variants, types, and component
- Use `cn()` utility for conditional class merging
- Provide `disabled` state styling

### Utility Function

File: `lib/utils.ts`

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Usage:** Merges Tailwind classes intelligently, resolving conflicts.

## Navigation & Routing

### File-Based Routing

Expo Router uses Next.js-style file-based routing:

- `app/index.tsx` → `/`
- `app/sign-in.tsx` → `/sign-in`
- `app/(tabs)/index.tsx` → `/` (within tabs group)
- `app/(tabs)/explore.tsx` → `/explore` (within tabs group)

**Route Groups** (parentheses):
- `(tabs)` - Tab navigation group
- `(auth)` - Authentication routes group
- Groups don't appear in URL path

### Layout Files

**Root Layout** (`app/_layout.tsx`):
- Sets up providers (Clerk, Convex, Theme)
- Wraps entire app
- Uses `<Slot />` to render child routes

**Tab Layout** (`app/(tabs)/_layout.tsx`):
- Configures bottom tab navigator
- Sets tab icons, labels, colors
- Uses `<Tabs>` component from expo-router

### Navigation Configuration

```typescript
export const unstable_settings = {
  anchor: "(tabs)",
};
```

**Effect:** Sets initial/default route to the tabs group.

## Development Conventions

### Import Aliases

Use `@/` prefix for absolute imports:

```typescript
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useColorScheme } from '@/hooks/use-color-scheme';
```

### TypeScript Conventions

- **Strict mode enabled** in `tsconfig.json`
- Always type component props
- Export types alongside components
- Use `Doc<"tableName">` and `Id<"tableName">` from Convex generated types

```typescript
import { Doc, Id } from "./_generated/dataModel";

function UserCard({ userId }: { userId: Id<"users"> }) {
  // userId is properly typed as a Convex ID for the users table
}
```

### Platform-Specific Code

Use `Platform.OS` for conditional iOS/Android code when needed:

```typescript
import { Platform } from 'react-native';

if (Platform.OS === 'ios') {
  // iOS-specific code
} else if (Platform.OS === 'android') {
  // Android-specific code
}
```

Or use `Platform.select()`:
```typescript
const styles = Platform.select({
  ios: 'ios-specific-styles',
  android: 'android-specific-styles',
});
```

### Component File Structure

```typescript
// 1. Imports
import { ... } from 'react';
import { ... } from 'react-native';
import { type VariantProps, cva } from 'class-variance-authority';

// 2. Variants definition
const componentVariants = cva(/* ... */);

// 3. Type definitions
type ComponentProps = ... & VariantProps<typeof componentVariants>;

// 4. Component implementation
function Component({ ...props }: ComponentProps) {
  return <View />;
}

// 5. Exports
export { Component, componentVariants };
export type { ComponentProps };
```

### Environment Variables

**Convex environment variables:**
- `CLERK_JWT_ISSUER_DOMAIN` - Clerk JWT issuer for auth
- `CLERK_WEBHOOK_SECRET` - Secret for webhook verification

**Client environment variables** (in `.env` or `app.json`):
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk public key
- `EXPO_PUBLIC_CONVEX_URL` - Convex deployment URL

**Access pattern:**
```typescript
// Client-side (prefixed with EXPO_PUBLIC_)
const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

// Server-side (Convex functions)
const secret = process.env.CLERK_WEBHOOK_SECRET;
```

## Experimental Features

Enabled in `app.json`:

```json
{
  "experiments": {
    "typedRoutes": true,    // Type-safe routing
    "reactCompiler": true   // React Compiler optimization
  },
  "newArchEnabled": true    // React Native new architecture
}
```

## Common Patterns

### Fetching Current User

```typescript
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

function MyComponent() {
  const user = useQuery(api.users.getCurrentUser);
  
  if (user === undefined) return <LoadingSpinner />;
  if (user === null) return <SignInPrompt />;
  
  return <div>Hello {user.firstName}!</div>;
}
```

**Note:** `undefined` means loading, `null` means not authenticated.

### Creating Forms

Use `@tanstack/react-form` for form state:

```typescript
import { useForm } from '@tanstack/react-form';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

function MyForm() {
  const createItem = useMutation(api.items.create);
  
  const form = useForm({
    defaultValues: { name: '' },
    onSubmit: async ({ value }) => {
      await createItem(value);
    },
  });
  
  // Render form fields
}
```

### Conditional Rendering Based on Authentication

```typescript
import { useAuth } from '@clerk/clerk-expo';

function MyScreen() {
  const { isSignedIn, isLoaded } = useAuth();
  
  if (!isLoaded) return <LoadingSpinner />;
  if (!isSignedIn) return <SignInScreen />;
  
  return <ProtectedContent />;
}
```

## Best Practices

1. **Always use indexes for Convex queries** - Define indexes in schema for any field you query by
2. **Handle loading states** - Convex queries return `undefined` while loading
3. **Use internal functions for sensitive operations** - Never expose admin functions as public mutations
4. **Secure webhooks** - Always verify webhook signatures
5. **Platform-aware development** - Use `Platform.OS` to handle iOS/Android differences when needed
6. **Type safety** - Use generated Convex types (`Doc`, `Id`, `api`)
7. **Component variants** - Use `cva` for consistent variant management
8. **Token caching** - Use `expo-secure-store` for secure token storage
9. **Error boundaries** - Implement error boundaries for graceful failures
10. **Responsive design** - Use Tailwind responsive modifiers (`sm:`, `md:`, `lg:`) for different screen sizes

