import { useMemo, useState } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line,
} from 'react-simple-maps';
import { ZoomIn, ZoomOut, RotateCcw, Info } from 'lucide-react';
import { useCTI } from '../contexts/CTIContext';
import type { IoC, ThreatLevel } from '../types/cti';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

const THREAT_COLORS: Record<ThreatLevel, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
  unknown: '#6b7280',
};

const TYPE_ICONS: Record<string, string> = {
  ipv4: 'IP',
  ipv6: 'IP',
  domain: 'DOM',
  url: 'URL',
  sha256: 'HASH',
  sha1: 'HASH',
  md5: 'HASH',
  email: 'EMAIL',
};

function clusterIoCs(iocs: IoC[]): Map<string, { lat: number; lon: number; iocs: IoC[] }> {
  const clusters = new Map<string, { lat: number; lon: number; iocs: IoC[] }>();

  for (const ioc of iocs) {
    if (!ioc.geo?.lat || !ioc.geo?.lon) continue;
    const key = `${Math.round(ioc.geo.lat * 2)}_${Math.round(ioc.geo.lon * 2)}`;
    const existing = clusters.get(key);
    if (existing) {
      existing.iocs.push(ioc);
    } else {
      clusters.set(key, { lat: ioc.geo.lat, lon: ioc.geo.lon, iocs: [ioc] });
    }
  }
  return clusters;
}

function maxThreatLevel(iocs: IoC[]): ThreatLevel {
  const order: ThreatLevel[] = ['unknown', 'low', 'medium', 'high', 'critical'];
  let max = 'unknown' as ThreatLevel;
  for (const ioc of iocs) {
    if (order.indexOf(ioc.threatLevel) > order.indexOf(max)) {
      max = ioc.threatLevel;
    }
  }
  return max;
}

export function ThreatMap() {
  const { filteredIoCs, isLoading } = useCTI();
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ coordinates: [0, 0] as [number, number] });
  const [hoveredCluster, setHoveredCluster] = useState<{ lat: number; lon: number; iocs: IoC[] } | null>(null);

  const clusters = useMemo(() => clusterIoCs(filteredIoCs), [filteredIoCs]);

  const geoEnrichedCount = useMemo(
    () => filteredIoCs.filter(i => i.geo?.lat && i.geo?.lon).length,
    [filteredIoCs],
  );

  const connections = useMemo(() => {
    const lines: { from: [number, number]; to: [number, number]; threat: ThreatLevel }[] = [];
    for (const ioc of filteredIoCs) {
      if (!ioc.relatedIoCs?.length || !ioc.geo?.lat || !ioc.geo?.lon) continue;
      for (const relId of ioc.relatedIoCs) {
        const related = filteredIoCs.find(r => r.id === relId);
        if (related?.geo?.lat && related?.geo?.lon) {
          lines.push({
            from: [ioc.geo.lon, ioc.geo.lat],
            to: [related.geo.lon, related.geo.lat],
            threat: maxThreatLevel([ioc, related]),
          });
        }
      }
    }
    return lines;
  }, [filteredIoCs]);

  const handleZoomIn = () => setZoom(z => Math.min(z * 1.5, 8));
  const handleZoomOut = () => setZoom(z => Math.max(z / 1.5, 0.5));
  const handleReset = () => {
    setZoom(1);
    setPosition({ coordinates: [0, 0] });
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0a0a12]">
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at center, #0d1a2d 0%, #0a0a12 70%)' }}
      />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(0,245,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,245,255,0.03) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Controls */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        <button onClick={handleZoomIn} className="p-2 glass rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-neon-cyan" title="Zoom In">
          <ZoomIn className="w-5 h-5" />
        </button>
        <button onClick={handleZoomOut} className="p-2 glass rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-neon-cyan" title="Zoom Out">
          <ZoomOut className="w-5 h-5" />
        </button>
        <button onClick={handleReset} className="p-2 glass rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-neon-cyan" title="Reset View">
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>

      {/* Map */}
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 140,
          center: position.coordinates,
        }}
        className="w-full h-full"
        style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.3s ease' }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map(geo => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="#1a2332"
                stroke="#2a3a4e"
                strokeWidth={0.5}
                style={{
                  default: { outline: 'none' },
                  hover: { fill: '#1e2d40', outline: 'none' },
                  pressed: { outline: 'none' },
                }}
              />
            ))
          }
        </Geographies>

        {/* Connection lines */}
        {connections.map((conn, i) => (
          <Line
            key={i}
            from={conn.from}
            to={conn.to}
            stroke={THREAT_COLORS[conn.threat]}
            strokeWidth={1}
            strokeOpacity={0.4}
            strokeDasharray="4 2"
          />
        ))}

        {/* IoC markers */}
        {Array.from(clusters.entries()).map(([key, cluster]) => {
          const threat = maxThreatLevel(cluster.iocs);
          const color = THREAT_COLORS[threat];
          const size = Math.min(4 + cluster.iocs.length, 12);

          return (
            <Marker
              key={key}
              coordinates={[cluster.lon, cluster.lat]}
              onMouseEnter={() => setHoveredCluster(cluster)}
              onMouseLeave={() => setHoveredCluster(null)}
            >
              {/* Pulse ring for high/critical */}
              {(threat === 'critical' || threat === 'high') && (
                <circle r={size + 4} fill="none" stroke={color} strokeWidth={1} strokeOpacity={0.3}>
                  <animate attributeName="r" from={size} to={size + 8} dur="2s" repeatCount="indefinite" />
                  <animate attributeName="stroke-opacity" from="0.4" to="0" dur="2s" repeatCount="indefinite" />
                </circle>
              )}
              <circle r={size} fill={color} fillOpacity={0.3} stroke={color} strokeWidth={1.5} />
              <circle r={size * 0.4} fill={color} />
            </Marker>
          );
        })}
      </ComposableMap>

      {/* Hover tooltip */}
      {hoveredCluster && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 glass rounded-lg p-3 border border-white/10 max-w-xs pointer-events-none">
          <div className="text-xs text-gray-400 mb-1">
            {hoveredCluster.lat.toFixed(2)}, {hoveredCluster.lon.toFixed(2)}
          </div>
          <div className="text-sm font-medium text-white mb-1">
            {hoveredCluster.iocs.length} IoC{hoveredCluster.iocs.length > 1 ? 's' : ''} at this location
          </div>
          <div className="flex flex-wrap gap-1">
            {hoveredCluster.iocs.slice(0, 5).map(ioc => (
              <span
                key={ioc.id}
                className="px-1.5 py-0.5 text-[10px] rounded border"
                style={{
                  color: THREAT_COLORS[ioc.threatLevel],
                  borderColor: THREAT_COLORS[ioc.threatLevel] + '40',
                  backgroundColor: THREAT_COLORS[ioc.threatLevel] + '10',
                }}
              >
                {TYPE_ICONS[ioc.type]}: {ioc.value.slice(0, 24)}
              </span>
            ))}
            {hoveredCluster.iocs.length > 5 && (
              <span className="text-[10px] text-gray-500 self-center">+{hoveredCluster.iocs.length - 5} more</span>
            )}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-20 glass rounded-lg p-3 border border-white/10">
        <div className="flex items-center gap-1.5 mb-2">
          <Info className="w-3 h-3 text-gray-500" />
          <span className="text-[10px] uppercase text-gray-500 tracking-wider">Threat Level</span>
        </div>
        <div className="flex flex-col gap-1">
          {(['critical', 'high', 'medium', 'low', 'unknown'] as ThreatLevel[]).map(level => (
            <div key={level} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: THREAT_COLORS[level] }} />
              <span className="text-[10px] text-gray-400 capitalize">{level}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <div className="absolute bottom-4 right-4 z-20 glass rounded-lg p-3 border border-white/10">
        <div className="text-xs text-gray-400">
          <span className="text-white font-medium">{geoEnrichedCount}</span> geo-located IoCs
          <span className="mx-1.5 text-gray-600">|</span>
          <span className="text-white font-medium">{clusters.size}</span> clusters
          {connections.length > 0 && (
            <>
              <span className="mx-1.5 text-gray-600">|</span>
              <span className="text-white font-medium">{connections.length}</span> connections
            </>
          )}
        </div>
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#0a0a12]/80">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Loading threat map...</p>
          </div>
        </div>
      )}
    </div>
  );
}
