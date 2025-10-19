# Clerk Authentication Setup Guide

This guide will help you complete the Clerk authentication integration with Convex.

## ✅ Completed Setup

The following has already been configured:

- ✅ Clerk SDK installed (`@clerk/clerk-expo`)
- ✅ Secure token storage configured (`expo-secure-store`)
- ✅ Authentication screens created (sign-in, sign-up with OAuth + email/password)
- ✅ Protected routes configured
- ✅ Convex schema with users table
- ✅ User sync functions
- ✅ Webhook handler for user synchronization

## 🔧 Required Configuration Steps

### 1. Set up Clerk Application

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Create a new application or select an existing one
3. Enable the **Native API** in Settings > Native Applications

### 2. Configure Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Clerk Configuration
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here

# Convex Configuration
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.site
```

**To get your Clerk Publishable Key:**
- Go to Clerk Dashboard > API Keys
- Copy your Publishable Key from the "Quick Copy" section

**To get your Convex URL:**
- Run `npx convex dev` to start your Convex development server
- The URL will be displayed in the terminal

### 3. Configure Clerk JWT Template for Convex

1. In Clerk Dashboard, go to **JWT Templates**
2. Click **New template** and select **Convex**
3. Copy the **Issuer URL** (looks like: `https://your-domain.clerk.accounts.dev`)
4. Update `convex/auth.config.js` with your Issuer URL:

```javascript
export default {
  providers: [
    {
      domain: "https://your-domain.clerk.accounts.dev", // Replace with your Issuer URL
      applicationID: "convex",
    },
  ],
};
```

Or set it as an environment variable:
```env
CLERK_JWT_ISSUER_DOMAIN=https://your-domain.clerk.accounts.dev
```

### 4. Configure OAuth Providers (Optional)

To enable Google and Apple sign-in:

1. In Clerk Dashboard, go to **User & Authentication > Social Connections**
2. Enable **Google** and/or **Apple**
3. Follow Clerk's instructions to configure each provider
4. For Apple Sign-In on iOS, add the required capabilities in your app

### 5. Set up Clerk Webhooks (Optional but Recommended)

Webhooks keep your Convex database in sync with Clerk user changes:

1. Deploy your Convex backend: `npx convex deploy`
2. In Clerk Dashboard, go to **Webhooks**
3. Click **Add Endpoint**
4. Set the endpoint URL to: `https://your-deployment.convex.site/clerk-webhook`
5. Subscribe to these events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
6. Copy the **Signing Secret**
7. Add it to your Convex environment variables:
   ```bash
   npx convex env set CLERK_WEBHOOK_SECRET your_signing_secret_here
   ```

## 🚀 Running the App

1. **Start Convex development server:**
   ```bash
   npx convex dev
   ```

2. **Start Expo development server:**
   ```bash
   pnpm start
   ```

3. **Run on your device:**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app for physical device

## 📱 Testing Authentication

1. **Sign Up:**
   - Open the app
   - You'll be redirected to the sign-in screen
   - Tap "Sign Up"
   - Enter email and password OR use Google/Apple sign-in
   - Verify your email with the code sent

2. **Sign In:**
   - Enter your credentials
   - OR use OAuth providers

3. **Verify Convex Sync:**
   - After signing in, check your Convex dashboard
   - You should see a new user in the `users` table

## 🔐 Security Notes

- Never commit your `.env` file (it's already in `.gitignore`)
- Keep your Clerk secret keys secure
- Use the webhook signing secret to verify webhook authenticity
- Enable OTA updates for security patches

## 📚 Additional Resources

- [Clerk Expo Documentation](https://clerk.com/docs/expo/getting-started/quickstart)
- [Convex Authentication](https://docs.convex.dev/auth/clerk)
- [React Native Reusables](https://reactnativereusables.com)

## 🐛 Troubleshooting

### "Missing Publishable Key" Error
- Ensure `.env` file exists in project root
- Verify `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` is set correctly
- Restart the Expo development server

### OAuth Not Working
- Check that providers are enabled in Clerk Dashboard
- Verify redirect URLs are configured correctly
- For Apple Sign-In, ensure proper entitlements are set

### Convex Authentication Failing
- Verify JWT template is created in Clerk
- Check that `convex/auth.config.js` has correct issuer domain
- Ensure Convex deployment is running

### Users Not Syncing to Convex
- Verify webhook endpoint is configured correctly
- Check webhook signing secret is set in Convex environment
- Review Convex logs for webhook errors

## 📝 Next Steps

1. Customize the authentication UI to match your brand
2. Add user profile management
3. Implement role-based access control
4. Add multi-factor authentication
5. Set up email/SMS notifications

