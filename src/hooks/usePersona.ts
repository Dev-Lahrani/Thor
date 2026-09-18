import { useState, useCallback, useEffect } from 'react';
import type { PersonaId, PersonaConfig } from '../types/persona';
import { PERSONA_CONFIGS } from '../types/persona';

const STORAGE_KEY = 'thor-persona';

function loadPersona(): PersonaId {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored in PERSONA_CONFIGS) return stored as PersonaId;
  } catch { /* ignore */ }
  return 'soc';
}

export function usePersona() {
  const [personaId, setPersonaId] = useState<PersonaId>(loadPersona);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, personaId); } catch { /* ignore */ }
  }, [personaId]);

  const config: PersonaConfig = PERSONA_CONFIGS[personaId];

  const setPersona = useCallback((id: PersonaId) => {
    setPersonaId(id);
  }, []);

  return { personaId, config, setPersona };
}
