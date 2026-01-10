import React from 'react';
import { Icons } from './Icon';

// Custom wrapper for consistency
const SocialLink = ({ href, children, label }: { href: string; children?: React.ReactNode; label: string }) => (
  <a 
    href={href} 
    target="_blank" 
    rel="noopener noreferrer"
    className="text-zenith-muted hover:text-zenith-orange transition-all duration-200 transform hover:scale-110 hover:-translate-y-0.5"
    aria-label={label}
  >
    {children}
  </a>
);

// Custom SVGs for branding not in Lucide
const customIcons = {
  // X (Twitter) - Custom because Lucide Twitter is the bird
  x: <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>,
  // Bluesky
  bluesky: <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg"><path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.685-6.262 7.823-8.316 1.137 2.054 2.809 13.506 7.823 8.316 4.557-5.073 1.083-6.498-2.83-7.078-.139-.016-.277-.034-.415-.056.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.206-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8z" /></svg>,
  // PayPal
  paypal: <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg"><path d="M7.076 21.337H4.75a.5.5 0 0 1-.496-.568l1.836-13.915a.5.5 0 0 1 .496-.434h6.071c3.21 0 4.382.986 4.382 3.633 0 2.227-1.413 3.328-3.917 3.328H10.59a.5.5 0 0 0-.496.435l-1.066 6.944a.5.5 0 0 1-.496.435h-1.456zM20.212 6.055c0-3.172-2.235-5.328-5.756-5.328h-7.66a.5.5 0 0 0-.496.435l-2.094 15.88a.5.5 0 0 0 .496.568h3.407l.955-6.055a.5.5 0 0 1 .496-.435h2.182c4.327 0 7.973-1.678 8.47-5.065z" /></svg>,
  // Discord
  discord: <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" /></svg>
};

const SocialBar = () => {
  return (
    <div className="inline-flex items-center gap-6 bg-zenith-surface border border-zenith-border rounded-full px-8 py-3 hover:border-zenith-orange/50 transition-colors duration-300 shadow-lg shadow-black/50 mt-8 mb-4">
      {/* Website */}
      <SocialLink href="https://wildsalt.me/" label="WildSalt Official">
         <Icons.Globe className="w-5 h-5" />
      </SocialLink>
      
      <div className="w-px h-4 bg-zenith-border/50"></div>
      
      {/* Socials */}
      <div className="flex items-center gap-5">
        <SocialLink href="https://x.com/uschan" label="X (Twitter)">
            {customIcons.x}
        </SocialLink>
        <SocialLink href="https://github.com/uschan" label="GitHub">
            <Icons.Github className="w-5 h-5" />
        </SocialLink>
        <SocialLink href="https://www.instagram.com/bujjun" label="Instagram">
            <Icons.Instagram className="w-5 h-5" />
        </SocialLink>
        <SocialLink href="https://bsky.app/profile/wildsalt.bsky.social" label="Bluesky">
            {customIcons.bluesky}
        </SocialLink>
      </div>

      <div className="w-px h-4 bg-zenith-border/50"></div>

      {/* Support & Community */}
      <div className="flex items-center gap-5">
        <SocialLink href="https://discord.gg/26nJEhq6Yj" label="Discord">
            {customIcons.discord}
        </SocialLink>
        <SocialLink href="https://paypal.me/wildsaltme?utm_source=wildsalt.me" label="PayPal">
            {customIcons.paypal}
        </SocialLink>
      </div>
    </div>
  );
};

export default SocialBar;