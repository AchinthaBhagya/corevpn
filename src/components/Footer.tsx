import { Shield } from "lucide-react";

const TELEGRAM_GROUP_URL = "https://t.me/corevpnsl";

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 1 0 0 12-12A12 12 1 0 0 11.944 0zm4.962 7.224c-.15-.003-.36.034-.577.15-1.04.543-5.54 2.99-6.12 3.32-.78.43-1.03.63-1.15 1.05-.15.52.36.74.92.96.53.21 1.78.62 2.53.84.65.2 1.25.08 1.72-.26.47-.34 2.1-1.73 2.65-2.24.55-.51 1.04-.35.19.17-.85.52-2.73 1.77-3.05 1.97-.5.32-.92.47-1.46.47-.54 0-1.1-.15-1.58-.43-.48-.28-1.9-1.04-2.64-1.45-.74-.4-1.3-.73-1.3-1.34 0-.3.15-.58.45-.81.3-.23 3.15-2.13 4.3-2.91 1.15-.78 2.3-1.56 2.55-1.71.55-.35 1.05-.52 1.45-.52.1 1.0 0-.05.2-.15z" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-background/60">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row">
        <div className="flex items-center gap-2 font-display font-semibold">
          <Shield className="h-4 w-4 text-primary" />
          <span>core<span className="text-gradient">VPN</span></span>
          <span className="text-muted-foreground text-sm font-sans font-normal">— Free VLESS configs for everyone</span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href={TELEGRAM_GROUP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#24A1DE]/15 px-3 py-1.5 text-sm font-medium text-[#24A1DE] transition-colors hover:bg-[#24A1DE]/25"
          >
            <TelegramIcon className="h-4 w-4" />
            Join Telegram
          </a>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} coreVPN</p>
        </div>
      </div>
    </footer>
  );
}
