import { Shield } from "lucide-react";

const TELEGRAM_GROUP_URL = "https://t.me/corevpnsl";

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06-.01.24-.01.38z" />
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
