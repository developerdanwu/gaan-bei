import { httpRouter } from "convex/server";
import { Webhook } from "svix";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";

const http = httpRouter();

/**
 * Clerk webhook handler for user sync
 *
 * Setup instructions:
 * 1. Go to Clerk Dashboard > Webhooks
 * 2. Add endpoint: https://your-deployment.convex.site/clerk-webhook
 * 3. Subscribe to events: user.created, user.updated, user.deleted
 * 4. Copy the signing secret and add it to your Convex environment variables as CLERK_WEBHOOK_SECRET
 */
http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("Missing CLERK_WEBHOOK_SECRET environment variable");
      return new Response("Webhook secret not configured", { status: 500 });
    }

    // Get the headers
    const svixId = request.headers.get("svix-id");
    const svixTimestamp = request.headers.get("svix-timestamp");
    const svixSignature = request.headers.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      return new Response("Missing svix headers", { status: 400 });
    }

    // Get the body
    const payload = await request.text();

    // Verify the webhook signature
    const wh = new Webhook(webhookSecret);
    let evt: any;

    try {
      evt = wh.verify(payload, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      });
    } catch (err) {
      console.error("Error verifying webhook:", err);
      return new Response("Invalid signature", { status: 400 });
    }

    // Handle the webhook
    const eventType = evt.type;
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;

    try {
      switch (eventType) {
        case "user.created":
        case "user.updated":
          await ctx.runMutation(internal.users.upsertUserFromClerk, {
            clerkId: id,
            email: email_addresses[0]?.email_address || "",
            firstName: first_name || undefined,
            lastName: last_name || undefined,
            imageUrl: image_url || undefined,
          });
          break;

        case "user.deleted":
          if (id) {
            await ctx.runMutation(internal.users.deleteUserByClerkId, {
              clerkId: id,
            });
          }
          break;

        default:
          console.log(`Unhandled webhook event type: ${eventType}`);
      }

      return new Response("Webhook processed successfully", { status: 200 });
    } catch (error) {
      console.error("Error processing webhook:", error);
      return new Response("Error processing webhook", { status: 500 });
    }
  }),
});

export default http;
