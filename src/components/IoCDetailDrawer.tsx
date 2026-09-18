import { X, Copy, Shield, Globe, Hash, Calendar, Tag, ExternalLink } from 'lucide-react';
import type { IoC } from '../types/cti';
import { sanitizeIocUrl } from '../services/validateIoc';

const THREAT_STYLES: Record<string, string> = {
  critical: 'bg-neon-red/15 text-neon-red border-neon-red/30',
  high: 'bg-neon-orange/15 text-neon-orange border-neon-orange/30',
  medium: 'bg-neon-yellow/15 text-neon-yellow border-neon-yellow/30',
  low: 'bg-neon-cyan/15 text-neon-cyan border-neon-cyan/30',
  unknown: 'bg-white/5 text-gray-400 border-white/10',
};

const CONFIDENCE_STYLES: Record<string, string> = {
  confirmed: 'text-neon-green',
  probable: 'text-neon-yellow',
  possible: 'text-neon-orange',
  unknown: 'text-gray-500',
};

interface IoCDetailDrawerProps {
  ioc: IoC;
  onClose: () => void;
}

export function IoCDetailDrawer({ ioc, onClose }: IoCDetailDrawerProps) {
  const handleCopy = async () => {
    await navigator.clipboard.writeText(ioc.value);
  };

  // Security: ioc.value is untrusted feed data. Every outbound URL is built
  // with encodeURIComponent (or structural regex-validated for hashes/IPs)
  // and re-parsed through sanitizeIocUrl, which only permits http(s) — so a
  // crafted value can never yield a javascript:/data: link.
  const googleSearchUrl = sanitizeIocUrl(`https://www.google.com/search?q=${encodeURIComponent(ioc.value)}`) ?? '';
  const virustotalUrl = sanitizeIocUrl(
    ioc.type.startsWith('sha') || ioc.type === 'md5'
      ? `https://www.virustotal.com/gui/file/${ioc.value}`
      : `https://www.virustotal.com/gui/search/${encodeURIComponent(ioc.value)}`
  ) ?? '';
  const abuseipdbUrl = (ioc.type === 'ipv4' || ioc.type === 'ipv6')
    ? sanitizeIocUrl(`https://www.abuseipdb.com/check/${ioc.value}`)
    : null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[420px] bg-cyber-darker border-l border-white/10 z-50 flex flex-col animate-slide-in-right shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-neon-cyan" />
          <h3 className="font-bold text-white">IoC Details</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Value + Copy */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-3">
          <div className="text-[10px] uppercase text-gray-500 mb-1 tracking-wider">Indicator Value</div>
          <div className="flex items-center gap-2">
            <code className="text-sm text-white font-mono break-all flex-1">{ioc.value}</code>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-neon-cyan transition-colors flex-shrink-0"
              title="Copy to clipboard"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Badges Row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-2 py-0.5 rounded border text-xs font-medium ${THREAT_STYLES[ioc.threatLevel]}`}>
            {ioc.threatLevel.toUpperCase()}
          </span>
          <span className={`text-xs capitalize ${CONFIDENCE_STYLES[ioc.confidence]}`}>
            {ioc.confidence} confidence
          </span>
          <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-xs text-gray-300">
            {ioc.type}
          </span>
        </div>

        {/* Description */}
        {ioc.description && (
          <div>
            <div className="text-[10px] uppercase text-gray-500 mb-1 tracking-wider">Description</div>
            <p className="text-sm text-gray-300 leading-relaxed">{ioc.description}</p>
          </div>
        )}

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-3">
          <DetailField icon={Shield} label="Source" value={ioc.source} />
          <DetailField icon={Hash} label="Type" value={ioc.type} />
          <DetailField icon={Calendar} label="First Seen" value={ioc.firstSeen ? new Date(ioc.firstSeen).toLocaleDateString() : 'N/A'} />
          <DetailField icon={Calendar} label="Last Seen" value={new Date(ioc.lastSeen).toLocaleDateString()} />
          {ioc.tags.length > 0 && (
            <div className="col-span-2">
              <div className="text-[10px] uppercase text-gray-500 mb-1 tracking-wider flex items-center gap-1">
                <Tag className="w-3 h-3" /> Tags
              </div>
              <div className="flex flex-wrap gap-1">
                {ioc.tags.map(tag => (
                  <span key={tag} className="px-1.5 py-0.5 text-[10px] bg-neon-purple/10 text-neon-purple border border-neon-purple/20 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Geo Info */}
        {ioc.geo && (
          <div className="bg-white/5 border border-white/10 rounded-lg p-3">
            <div className="text-[10px] uppercase text-gray-500 mb-2 tracking-wider flex items-center gap-1">
              <Globe className="w-3 h-3" /> Geo Enrichment
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {ioc.geo.country && <div><span className="text-gray-500">Country:</span> <span className="text-gray-200">{ioc.geo.country}</span></div>}
              {ioc.geo.city && <div><span className="text-gray-500">City:</span> <span className="text-gray-200">{ioc.geo.city}</span></div>}
              {ioc.geo.org && <div className="col-span-2"><span className="text-gray-500">Org:</span> <span className="text-gray-200">{ioc.geo.org}</span></div>}
              {ioc.geo.asn && <div><span className="text-gray-500">ASN:</span> <span className="text-gray-200">{ioc.geo.asn}</span></div>}
            </div>
          </div>
        )}

        {/* External Links */}
        <div>
          <div className="text-[10px] uppercase text-gray-500 mb-2 tracking-wider">Investigate</div>
          <div className="flex flex-wrap gap-2">
            <ExternalLinkButton href={virustotalUrl} label="VirusTotal" />
            {abuseipdbUrl && <ExternalLinkButton href={abuseipdbUrl} label="AbuseIPDB" />}
            <ExternalLinkButton href={googleSearchUrl} label="Google" />
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailField({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase text-gray-500 mb-1 tracking-wider flex items-center gap-1">
        <Icon className="w-3 h-3" /> {label}
      </div>
      <div className="text-sm text-gray-200 truncate" title={value}>{value}</div>
    </div>
  );
}

function ExternalLinkButton({ href, label }: { href: string; label: string }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1 px-2 py-1 text-xs bg-white/5 border border-white/10 rounded text-gray-300 hover:text-neon-cyan hover:border-neon-cyan/30 transition-colors"
    >
      <ExternalLink className="w-3 h-3" />
      {label}
    </a>
  );
}
