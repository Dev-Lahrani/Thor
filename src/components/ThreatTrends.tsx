import React, { useMemo } from 'react';
import {
  X,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  Calendar,
  AlertTriangle,
  Activity,
  ShieldAlert,
} from 'lucide-react';
import type { ThreatEvent, ThreatCategory } from '../types';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
  Legend,
} from 'recharts';
import { CATEGORY_INFO } from '../utils/helpers';

interface ThreatTrendsProps {
  events: ThreatEvent[];
  isOpen: boolean;
  onClose: () => void;
}

const ThreatTrendsContent: React.FC<ThreatTrendsProps> = ({
  events,
  onClose,
}) => {
  // Category distribution
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    events.forEach(e => {
      counts[e.category] = (counts[e.category] || 0) + 1;
    });
    return Object.entries(counts).map(([category, count]) => ({
      name: CATEGORY_INFO[category as ThreatCategory]?.label || category,
      value: count,
      color: CATEGORY_INFO[category as ThreatCategory]?.color || '#666',
    }));
  }, [events]);

  // Severity distribution
  const severityData = useMemo(() => {
    const counts: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
    events.forEach(e => {
      counts[e.severity] = (counts[e.severity] || 0) + 1;
    });
    return [
      { name: 'Low', value: counts.low, color: '#22c55e' },
      { name: 'Medium', value: counts.medium, color: '#eab308' },
      { name: 'High', value: counts.high, color: '#f97316' },
      { name: 'Critical', value: counts.critical, color: '#ef4444' },
    ].filter(d => d.value > 0);
  }, [events]);

  // Time-based data (last 24 hours)
  const timelineData = useMemo(() => {
    const now = new Date();
    const hours: { hour: string; count: number; kev: number; maliciousIp: number }[] = [];

    for (let i = 23; i >= 0; i--) {
      const hourStart = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourEnd = new Date(now.getTime() - (i - 1) * 60 * 60 * 1000);

      const hourEvents = events.filter(e => {
        const dDate = new Date(e.date);
        return dDate >= hourStart && dDate < hourEnd;
      });

      hours.push({
        hour: hourStart.toLocaleTimeString([], { hour: '2-digit' }),
        count: hourEvents.length,
        kev: hourEvents.filter(e => e.category === 'kev').length,
        maliciousIp: hourEvents.filter(e => e.category === 'maliciousIp').length,
      });
    }

    return hours;
  }, [events]);

  // CVSS bands
  const cvssData = useMemo(() => {
    const scored = events.filter(e => e.cvssScore !== undefined && e.cvssScore > 0);
    const ranges = [
      { range: '0-4', min: 0, max: 4, count: 0 },
      { range: '4-7', min: 4, max: 7, count: 0 },
      { range: '7-9', min: 7, max: 9, count: 0 },
      { range: '9-10', min: 9, max: 10.1, count: 0 },
    ];

    scored.forEach(e => {
      const score = e.cvssScore || 0;
      const range = ranges.find(r => score >= r.min && score < r.max);
      if (range) range.count++;
    });

    return ranges;
  }, [events]);

  // Stats
  const totalEvents = events.length;
  const criticalEvents = events.filter(e => e.severity === 'critical').length;
  const avgCvss = useMemo(() => {
    const scored = events.filter(e => e.cvssScore !== undefined && e.cvssScore > 0);
    if (scored.length === 0) return 0;
    return scored.reduce((sum, e) => sum + (e.cvssScore || 0), 0) / scored.length;
  }, [events]);
  const ransomwareTags = events.filter(e => e.magnitudeLabel === 'RANSOMWARE').length;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="glass-card rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col border border-white/[0.08] shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-neon-purple/20 to-pink-500/10 flex items-center justify-center border border-neon-purple/20">
              <BarChart3 className="w-4 h-4 text-neon-purple" />
            </div>
            <h2 className="text-lg font-bold text-white">Threat Trends & Analytics</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 hover:bg-white/[0.06] rounded-xl text-gray-400 hover:text-white transition-all duration-300 border border-transparent hover:border-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="glass-card rounded-2xl p-4 border border-white/[0.06]">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <Activity className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase tracking-widest font-medium">Total Signals</span>
              </div>
              <div className="text-3xl font-bold font-mono bg-gradient-to-r from-neon-cyan to-blue-400 bg-clip-text text-transparent">{totalEvents}</div>
            </div>
            <div className="glass-card rounded-2xl p-4 border border-white/[0.06]">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                <span className="text-[10px] uppercase tracking-widest font-medium">Critical</span>
              </div>
              <div className="text-3xl font-bold font-mono text-red-400">{criticalEvents}</div>
            </div>
            <div className="glass-card rounded-2xl p-4 border border-white/[0.06]">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <TrendingUp className="w-3.5 h-3.5 text-neon-purple" />
                <span className="text-[10px] uppercase tracking-widest font-medium">Avg CVSS</span>
              </div>
              <div className="text-3xl font-bold font-mono text-neon-purple">{avgCvss.toFixed(1)}</div>
            </div>
            <div className="glass-card rounded-2xl p-4 border border-white/[0.06]">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <ShieldAlert className="w-3.5 h-3.5 text-neon-red" />
                <span className="text-[10px] uppercase tracking-widest font-medium">Ransomware Tags</span>
              </div>
              <div className="text-3xl font-bold font-mono text-neon-red">{ransomwareTags}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Category Distribution */}
            <div className="glass-card rounded-2xl p-5 border border-white/[0.06]">
              <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-neon-cyan/15 flex items-center justify-center">
                  <PieChartIcon className="w-3.5 h-3.5 text-neon-cyan" />
                </div>
                Signals by Category
              </h3>
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                      labelLine={false}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(10,10,16,0.95)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '12px',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  No data available
                </div>
              )}
            </div>

            {/* Severity Distribution */}
            <div className="glass-card rounded-2xl p-5 border border-white/[0.06]">
              <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-orange-500/15 flex items-center justify-center">
                  <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
                </div>
                Signals by Severity
              </h3>
              {severityData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={severityData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis type="number" stroke="#555" fontSize={11} />
                    <YAxis type="category" dataKey="name" stroke="#555" fontSize={11} width={80} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(10,10,16,0.95)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '12px',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
                      }}
                    />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                      {severityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  No severity data available
                </div>
              )}
            </div>

            {/* 24-Hour Timeline */}
            <div className="glass-card rounded-2xl p-5 lg:col-span-2 border border-white/[0.06]">
              <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-neon-green/15 flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5 text-neon-green" />
                </div>
                Signals Over Last 24 Hours
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="hour" stroke="#555" fontSize={10} />
                  <YAxis stroke="#555" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(10,10,16,0.95)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '12px',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
                    }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="kev" stackId="1" stroke="#ef4444" fill="#ef444440" name="KEV Exploits" />
                  <Area type="monotone" dataKey="maliciousIp" stackId="1" stroke="#f97316" fill="#f9731640" name="Malicious IPs" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* CVSS Distribution */}
            <div className="glass-card rounded-2xl p-5 lg:col-span-2 border border-white/[0.06]">
              <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-neon-red/15 flex items-center justify-center">
                  <BarChart3 className="w-3.5 h-3.5 text-neon-red" />
                </div>
                CVSS Score Distribution
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={cvssData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="range" stroke="#555" fontSize={11} />
                  <YAxis stroke="#555" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(10,10,16,0.95)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '12px',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
                    }}
                    formatter={(value) => [`${value} signals`, 'Count']}
                  />
                  <Bar dataKey="count" fill="#ef4444" radius={[6, 6, 0, 0]} name="CVEs">
                    {cvssData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={`rgba(239, 68, 68, ${0.3 + (index * 0.2)})`}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-5 text-center text-[10px] text-gray-600 font-mono flex items-center justify-center gap-1.5">
            <Calendar className="w-3 h-3" />
            KEV window: last 180 days · NVD window: last 3 days
          </div>
        </div>
      </div>
    </div>
  );
};

export const ThreatTrends: React.FC<ThreatTrendsProps> = (props) => {
  if (!props.isOpen) return null;
  return <ThreatTrendsContent {...props} />;
};
