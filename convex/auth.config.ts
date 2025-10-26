/**
 * Convex Auth Configuration for Clerk
 *
 * To complete the setup:
 * 1. Go to your Clerk Dashboard: https://dashboard.clerk.com
 * 2. Navigate to JWT Templates
 * 3. Create a new template and select "Convex"
 * 4. Copy the Issuer URL (it will look like: https://your-clerk-domain.clerk.accounts.dev)
 * 5. Replace the domain value below with your Issuer URL
 */

export default {
  providers: [
    {
      domain: process.env.CONVEX_SITE_URL,
      applicationID: "convex",
    },
  ],
};
