import { Shield } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-background/60">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row">
        <div className="flex items-center gap-2 font-display font-semibold">
          <Shield className="h-4 w-4 text-primary" />
          <span>core<span className="text-gradient">VPN</span></span>
          <span className="text-muted-foreground text-sm font-sans font-normal">— Free VLESS configs for everyone</span>
        </div>
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} coreVPN. All rights reserved.</p>
      </div>
    </footer>
  );
}
