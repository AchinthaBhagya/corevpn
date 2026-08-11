// Server-only Discord webhook helpers.

type Field = { name: string; value: string; inline?: boolean };

export async function sendDiscord(
  webhookUrl: string | undefined,
  opts: { title: string; color: number; fields: Field[] },
): Promise<void> {
  if (!webhookUrl) return;
  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        username: "coreVPN",
        embeds: [
          {
            title: opts.title,
            color: opts.color,
            fields: opts.fields.map((f) => ({
              name: f.name,
              value: f.value.slice(0, 1000) || "—",
              inline: f.inline ?? true,
            })),
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    });
  } catch (e) {
    console.error("discord webhook failed", e);
  }
}
