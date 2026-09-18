import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Shield, Eye, BarChart3 } from 'lucide-react';
import type { PersonaId } from '../types/persona';
import { PERSONA_LIST } from '../types/persona';

const PERSONA_ICONS: Record<PersonaId, typeof Shield> = {
  soc: Shield,
  cti: Eye,
  exec: BarChart3,
};

interface PersonaSelectorProps {
  currentPersona: PersonaId;
  onSelect: (id: PersonaId) => void;
}

export function PersonaSelector({ currentPersona, onSelect }: PersonaSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const current = PERSONA_LIST.find(p => p.id === currentPersona)!;
  const Icon = PERSONA_ICONS[currentPersona];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg bg-${current.accentColor}/10 border border-${current.accentColor}/30 text-${current.accentColor} hover:bg-${current.accentColor}/20 transition-colors`}
      >
        <Icon className="w-3.5 h-3.5" />
        <span className="font-medium">{current.label}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-cyber-dark border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-white/10">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Switch Persona</span>
          </div>
          {PERSONA_LIST.map(p => {
            const PIcon = PERSONA_ICONS[p.id];
            const isActive = p.id === currentPersona;
            return (
              <button
                key={p.id}
                onClick={() => { onSelect(p.id); setIsOpen(false); }}
                className={`w-full px-3 py-2.5 flex items-start gap-3 text-left transition-colors ${
                  isActive ? `bg-${p.accentColor}/10` : 'hover:bg-white/5'
                }`}
              >
                <div className={`mt-0.5 p-1.5 rounded bg-${p.accentColor}/10`}>
                  <PIcon className={`w-3.5 h-3.5 text-${p.accentColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-medium ${isActive ? `text-${p.accentColor}` : 'text-gray-300'}`}>
                    {p.label}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">{p.description}</div>
                </div>
                {isActive && (
                  <div className={`mt-1 w-1.5 h-1.5 rounded-full bg-${p.accentColor}`} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
