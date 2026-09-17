import React from 'react';
import { Database, Globe, ShieldAlert, Radio, Fish, Github, ExternalLink } from 'lucide-react';

const SOURCES = [
  { href: 'https://nvd.nist.gov/', label: 'NVD', icon: Database, color: 'text-neon-cyan', bg: 'bg-neon-cyan/10 hover:bg-neon-cyan/20' },
  { href: 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog', label: 'CISA KEV', icon: ShieldAlert, color: 'text-red-400', bg: 'bg-red-500/10 hover:bg-red-500/20' },
  { href: 'https://feodotracker.abuse.ch/', label: 'abuse.ch', icon: Radio, color: 'text-orange-400', bg: 'bg-orange-500/10 hover:bg-orange-500/20' },
  { href: 'https://isc.sans.edu/', label: 'DShield', icon: Globe, color: 'text-neon-green', bg: 'bg-green-500/10 hover:bg-green-500/20' },
  { href: 'https://openphish.com/', label: 'OpenPhish', icon: Fish, color: 'text-pink-400', bg: 'bg-pink-500/10 hover:bg-pink-500/20' },
  { href: 'https://haveibeenpwned.com/', label: 'HIBP', icon: Database, color: 'text-neon-purple', bg: 'bg-neon-purple/10 hover:bg-neon-purple/20' },
];

export const Footer: React.FC = () => {
  return (
    <footer className="glass-darker px-6 py-2.5 flex items-center justify-between text-[11px] border-t border-white/5">
      <div className="flex items-center gap-5 flex-wrap">
        <span className="flex items-center gap-1.5 text-gray-500 font-medium">
          <Globe className="w-3 h-3" />
          Data Sources
        </span>
        <div className="h-3 w-px bg-white/10" />
        {SOURCES.map(({ href, label, icon: Icon, color, bg }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-all duration-300 group"
          >
            <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${bg}`}>
              <Icon className={`w-2.5 h-2.5 ${color}`} />
            </div>
            <span>{label}</span>
            <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <a
          href="https://github.com/Dev-Lahrani/Thor"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-gray-500 hover:text-white transition-colors group"
        >
          <Github className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">GitHub</span>
        </a>
        <div className="h-3 w-px bg-white/10" />
        <div className="flex items-center gap-2 text-gray-500">
          <span className="font-mono font-medium text-gray-400">Thor</span>
          <span className="px-1.5 py-0.5 rounded bg-white/5 text-[9px] font-bold text-gray-400">v3.0</span>
        </div>
      </div>
    </footer>
  );
};
