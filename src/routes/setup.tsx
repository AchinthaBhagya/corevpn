import { createFileRoute } from "@tanstack/react-router";
import { Download, Copy, Settings, Play } from "lucide-react";

export const Route = createFileRoute("/setup")({
  component: Setup,
  head: () => ({ meta: [{ title: "Setup — coreVPN" }, { name: "description", content: "Step-by-step guide to import and use a coreVPN config." }] }),
});

const steps = [
  { icon: Download, title: "Install a V2Ray client", body: "Download v2rayNG (Android) or Streisand / V2Box (iOS) from the Play Store / App Store. Desktop users can use Hiddify or Nekoray." },
  { icon: Copy, title: "Copy a config from Configs page", body: "Login to coreVPN and head to the Configs page. Pick your ISP and package (e.g. Dialog 724 Zoom). Tap Copy to copy the vless:// link." },
  { icon: Settings, title: "Import into your client", body: "Open your VPN app, press the + button and choose 'Import from clipboard'. The config will appear in your server list automatically." },
  { icon: Play, title: "Connect and enjoy", body: "Select the imported config and tap the Connect / Play button. Verify connection by visiting any website — you're now tunnelled through coreVPN." },
];

export function Setup() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-16">
      <div className="text-center">
        <div className="inline-flex rounded-full bg-accent px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent-foreground">Setup</div>
        <h1 className="mt-4 font-display text-4xl font-bold md:text-5xl">How to setup a config</h1>
        <p className="mt-4 text-lg text-muted-foreground">Get up and running in under 2 minutes. Follow these 4 simple steps.</p>
      </div>

      <ol className="mt-12 space-y-4">
        {steps.map((s, i) => (
          <li key={s.title} className="relative rounded-2xl border border-border/60 bg-card p-6 shadow-card transition-all hover:border-primary/40">
            <div className="flex gap-5">
              <div className="flex flex-col items-center">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
                  <s.icon className="h-5 w-5" />
                </div>
                {i < steps.length - 1 && <div className="mt-2 w-px flex-1 bg-border" />}
              </div>
              <div className="flex-1 pb-4">
                <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Step {i + 1}</div>
                <h3 className="mt-1 font-display text-xl font-bold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
              </div>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-12 rounded-2xl border border-warning/40 bg-warning/5 p-6">
        <h3 className="font-display text-lg font-bold">⚠️ Important note</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Make sure your data package (e.g. 724 Zoom or Social Media) is active on your SIM <strong>before</strong> connecting.
          Using the wrong config for your ISP/package may consume your normal data balance.
        </p>
      </div>
    </div>
  );
}
