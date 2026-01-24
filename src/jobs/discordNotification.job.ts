import { defineJob } from "./registry";

interface DiscordNotificationArgs {
  conversationId: number;
  conversationTitle?: string;
  status: "completed" | "failed";
  cost?: number;
  turns?: number;
  error?: string;
  responseText?: string;
}

// Discord embed limits
const MAX_DESCRIPTION_LENGTH = 4096;
const MAX_FIELD_VALUE_LENGTH = 1024;

export const SendDiscordNotificationJob = defineJob<DiscordNotificationArgs>(
  "SendDiscordNotificationJob",
  async (args) => {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) {
      console.log("DISCORD_WEBHOOK_URL not configured, skipping notification");
      return;
    }

    const color = args.status === "completed" ? 0x00ff00 : 0xff0000;
    const emoji = args.status === "completed" ? "\u2705" : "\u274c";

    // Build the title with optional link
    const baseUrl = process.env.CLAUDEKIQ_BASE_URL;
    const conversationUrl = baseUrl ? `${baseUrl}/conversations/${args.conversationId}` : null;

    const title = `${emoji} Conversation ${args.status}`;
    const conversationName = args.conversationTitle || `Conversation #${args.conversationId}`;

    // Build description with response text if available
    let description = conversationName;
    if (args.responseText) {
      const truncatedResponse = args.responseText.length > (MAX_DESCRIPTION_LENGTH - conversationName.length - 50)
        ? args.responseText.slice(0, MAX_DESCRIPTION_LENGTH - conversationName.length - 53) + "..."
        : args.responseText;
      description = `**${conversationName}**\n\n${truncatedResponse}`;
    }

    const fields: Array<{ name: string; value: string; inline?: boolean }> = [
      { name: "Conversation ID", value: String(args.conversationId), inline: true },
    ];

    if (args.turns !== undefined) {
      fields.push({ name: "Turns", value: String(args.turns), inline: true });
    }

    if (args.cost !== undefined) {
      fields.push({ name: "Cost", value: `$${args.cost.toFixed(4)}`, inline: true });
    }

    if (args.error) {
      fields.push({ name: "Error", value: args.error.slice(0, MAX_FIELD_VALUE_LENGTH) });
    }

    // Add link field if base URL is configured
    if (conversationUrl) {
      fields.push({ name: "View", value: `[Open Conversation](${conversationUrl})`, inline: true });
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [{
          title,
          description,
          color,
          fields,
          timestamp: new Date().toISOString(),
        }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Discord webhook failed: ${response.status} ${response.statusText}`);
    }

    console.log(`  [SendDiscordNotificationJob] Discord notification sent for conversation ${args.conversationId}`);
  }
);
