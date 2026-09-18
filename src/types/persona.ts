export type PersonaId = 'soc' | 'cti' | 'exec';

export interface PersonaConfig {
  id: PersonaId;
  label: string;
  description: string;
  accentColor: string;
  defaultViewMode: 'dashboard' | 'cti';
  defaultCtiSubView: 'feeds' | 'map' | 'campaigns' | 'actors';
  defaultSidebarView: 'list' | 'timeline';
  showWeatherPanels: boolean;
  showCTIPanels: boolean;
  showCampaignPanel: boolean;
  showActorPanel: boolean;
  showCrossFeedClusters: boolean;
  showTemporalClusters: boolean;
  toolbarButtons: string[];
}

export const PERSONA_CONFIGS: Record<PersonaId, PersonaConfig> = {
  soc: {
    id: 'soc',
    label: 'SOC Analyst',
    description: 'Real-time monitoring, IoC feeds, threat map',
    accentColor: 'neon-cyan',
    defaultViewMode: 'cti',
    defaultCtiSubView: 'feeds',
    defaultSidebarView: 'list',
    showWeatherPanels: true,
    showCTIPanels: true,
    showCampaignPanel: false,
    showActorPanel: false,
    showCrossFeedClusters: true,
    showTemporalClusters: false,
    toolbarButtons: ['globe', 'trends', 'compare', 'stats', 'export'],
  },
  cti: {
    id: 'cti',
    label: 'CTI Analyst',
    description: 'Campaign tracking, actor profiles, deep correlation',
    accentColor: 'neon-purple',
    defaultViewMode: 'cti',
    defaultCtiSubView: 'campaigns',
    defaultSidebarView: 'list',
    showWeatherPanels: false,
    showCTIPanels: true,
    showCampaignPanel: true,
    showActorPanel: true,
    showCrossFeedClusters: true,
    showTemporalClusters: true,
    toolbarButtons: ['stats', 'export'],
  },
  exec: {
    id: 'exec',
    label: 'Executive',
    description: 'High-level overview, trends, key metrics',
    accentColor: 'neon-orange',
    defaultViewMode: 'dashboard',
    defaultCtiSubView: 'map',
    defaultSidebarView: 'timeline',
    showWeatherPanels: true,
    showCTIPanels: true,
    showCampaignPanel: false,
    showActorPanel: false,
    showCrossFeedClusters: false,
    showTemporalClusters: false,
    toolbarButtons: ['globe', 'trends', 'stats', 'export'],
  },
};

export const PERSONA_LIST: PersonaConfig[] = Object.values(PERSONA_CONFIGS);
