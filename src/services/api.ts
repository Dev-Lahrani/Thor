import type { 
  DisasterEvent, 
  DisasterCategory, 
  EONETResponse, 
  EONETEvent,
  WeatherData,
  City,
  SeverityLevel,
  AlertLevel
} from '../types';

// --- SWR localStorage cache + AbortController helpers ---

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

function readCache<T>(key: string, ttlMs: number): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() - entry.timestamp > ttlMs) {
      localStorage.removeItem(key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now() };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // quota exceeded or private browsing — silently ignore
  }
}

async function cachedFetch<T>(
  url: string,
  opts: { cacheKey: string; ttlMs: number; signal?: AbortSignal },
): Promise<T> {
  const response = await fetch(url, { signal: opts.signal });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  const data: T = await response.json();
  writeCache(opts.cacheKey, data);
  return data;
}

function cachedFetchWithFallback<T>(
  url: string,
  opts: { cacheKey: string; ttlMs: number; signal?: AbortSignal },
): Promise<T> {
  return cachedFetch<T>(url, opts).catch((err) => {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    const cached = readCache<T>(opts.cacheKey, opts.ttlMs * 5);
    if (cached) return cached;
    throw err;
  });
}

// NASA EONET API - Real-time natural events
const EONET_API_URL = 'https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=100';

// USGS Earthquake APIs - Multiple feeds for comprehensive coverage
// All earthquakes M1.0+ in the past hour (most real-time)
const USGS_HOUR_URL = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/1.0_hour.geojson';
// All earthquakes M2.5+ in the past day
const USGS_DAY_URL = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson';
// Significant earthquakes (past week)
const USGS_SIGNIFICANT_URL = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_week.geojson';

// Category mapping from EONET to our types
const categoryMap: Record<string, DisasterCategory> = {
  'earthquakes': 'earthquakes',
  'floods': 'floods',
  'wildfires': 'wildfires',
  'severeStorms': 'severeStorms',
  'volcanoes': 'volcanoes',
  'seaLakeIce': 'weather',
  'snow': 'weather',
  'dustHaze': 'weather',
  'waterColor': 'weather',
  'landslides': 'earthquakes',
  'tempExtremes': 'weather',
  'drought': 'weather',
};

function mapEONETCategory(eonetCategory: string): DisasterCategory {
  return categoryMap[eonetCategory] || 'weather';
}

function transformEONETEvent(event: EONETEvent): DisasterEvent | null {
  // Get the most recent geometry (location)
  const latestGeometry = event.geometry[event.geometry.length - 1];
  if (!latestGeometry || !latestGeometry.coordinates) return null;

  const categoryId = event.categories[0]?.id || 'weather';
  
  return {
    id: event.id,
    title: event.title,
    description: event.description || `Active ${event.categories[0]?.title || 'event'} detected`,
    category: mapEONETCategory(categoryId),
    coordinates: latestGeometry.coordinates as [number, number],
    date: latestGeometry.date,
    sources: event.sources.map(s => ({ id: s.id, url: s.url })),
    closed: event.closed || undefined,
  };
}

// USGS GeoJSON types
interface USGSFeature {
  type: string;
  properties: {
    mag: number;
    place: string;
    time: number;
    updated: number;
    url: string;
    detail: string;
    felt: number | null;
    cdi: number | null;
    mmi: number | null;
    alert: string | null;
    status: string;
    tsunami: number;
    sig: number;
    net: string;
    code: string;
    ids: string;
    sources: string;
    types: string;
    nst: number | null;
    dmin: number | null;
    rms: number;
    gap: number | null;
    magType: string;
    type: string;
    title: string;
  };
  geometry: {
    type: string;
    coordinates: [number, number, number]; // [lon, lat, depth]
  };
  id: string;
}

interface USGSResponse {
  type: string;
  metadata: {
    generated: number;
    url: string;
    title: string;
    status: number;
    api: string;
    count: number;
  };
  features: USGSFeature[];
}

function transformUSGSEarthquake(feature: USGSFeature): DisasterEvent {
  const { properties, geometry, id } = feature;
  const magnitude = properties.mag;
  const depth = geometry.coordinates[2];
  
  // Determine severity based on magnitude
  let severity: SeverityLevel = 'minor';
  let alertLevel: AlertLevel = 'green';
  let estimatedAffected = 0;
  let impactRadius = 0;
  
  if (magnitude >= 8) {
    severity = 'catastrophic';
    alertLevel = 'red';
    estimatedAffected = 10000000; // 10M+
    impactRadius = 500;
  } else if (magnitude >= 7) {
    severity = 'extreme';
    alertLevel = 'red';
    estimatedAffected = 1000000; // 1M+
    impactRadius = 250;
  } else if (magnitude >= 6) {
    severity = 'severe';
    alertLevel = 'orange';
    estimatedAffected = 100000;
    impactRadius = 100;
  } else if (magnitude >= 5) {
    severity = 'moderate';
    alertLevel = 'yellow';
    estimatedAffected = 10000;
    impactRadius = 50;
  } else if (magnitude >= 4) {
    severity = 'minor';
    alertLevel = 'yellow';
    estimatedAffected = 1000;
    impactRadius = 20;
  } else {
    impactRadius = 10;
    estimatedAffected = 100;
  }

  // Use USGS alert if available
  if (properties.alert) {
    alertLevel = properties.alert as AlertLevel;
  }

  // Parse location from place string
  const placeStr = properties.place || '';
  const locationParts = placeStr.split(' of ');
  let distanceFromCity: number | undefined;
  let nearestCity: string | undefined;
  
  if (locationParts.length >= 2) {
    const distMatch = locationParts[0].match(/(\d+)\s*km/);
    if (distMatch) {
      distanceFromCity = parseInt(distMatch[1]);
    }
    nearestCity = locationParts[locationParts.length - 1];
  }

  // Get severity description
  const severityLabels: Record<SeverityLevel, string> = {
    minor: 'Minor',
    moderate: 'Moderate', 
    severe: 'Severe',
    extreme: 'Extreme',
    catastrophic: 'Catastrophic'
  };
  
  const description = [
    `${severityLabels[severity]} earthquake with magnitude ${magnitude.toFixed(1)} at ${depth.toFixed(1)}km depth.`,
    properties.tsunami ? '⚠️ TSUNAMI WARNING ISSUED.' : '',
    properties.felt ? `Felt by ${properties.felt.toLocaleString()} people.` : '',
    properties.mmi ? `Modified Mercalli Intensity: ${properties.mmi.toFixed(1)}` : '',
    `Estimated impact radius: ${impactRadius}km.`,
    estimatedAffected > 0 ? `Potentially affecting up to ${estimatedAffected.toLocaleString()} people.` : '',
  ].filter(Boolean).join(' ');
  
  return {
    id: `usgs-${id}`,
    title: `M${magnitude.toFixed(1)} Earthquake - ${properties.place}`,
    description,
    category: 'earthquakes',
    coordinates: [geometry.coordinates[0], geometry.coordinates[1]],
    date: new Date(properties.time).toISOString(),
    sources: [{ id: 'USGS', url: properties.url }],
    magnitude,
    depth,
    severity,
    alertLevel,
    estimatedAffected,
    impactRadius,
    location: {
      nearestCity,
      distanceFromCity,
    },
    tsunami: properties.tsunami === 1,
    felt: properties.felt || undefined,
    mmi: properties.mmi || undefined,
    cdi: properties.cdi || undefined,
    sig: properties.sig,
    status: properties.status,
    eventType: properties.type,
  };
}

async function fetchUSGSEarthquakes(signal?: AbortSignal): Promise<DisasterEvent[]> {
  try {
    const [hourData, dayData, significantData] = await Promise.all([
      cachedFetchWithFallback<USGSResponse>(USGS_HOUR_URL, {
        cacheKey: 'usgs-hour', ttlMs: 60_000, signal,
      }),
      cachedFetchWithFallback<USGSResponse>(USGS_DAY_URL, {
        cacheKey: 'usgs-day', ttlMs: 300_000, signal,
      }),
      cachedFetchWithFallback<USGSResponse>(USGS_SIGNIFICANT_URL, {
        cacheKey: 'usgs-significant', ttlMs: 300_000, signal,
      }),
    ]);

    const events: DisasterEvent[] = [];
    const seenIds = new Set<string>();

    for (const feature of hourData.features) {
      if (!seenIds.has(feature.id)) {
        seenIds.add(feature.id);
        events.push(transformUSGSEarthquake(feature));
      }
    }
    for (const feature of dayData.features) {
      if (!seenIds.has(feature.id)) {
        seenIds.add(feature.id);
        events.push(transformUSGSEarthquake(feature));
      }
    }
    for (const feature of significantData.features) {
      if (!seenIds.has(feature.id)) {
        seenIds.add(feature.id);
        events.push(transformUSGSEarthquake(feature));
      }
    }

    return events;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    console.error('Failed to fetch USGS earthquakes:', error);
    return [];
  }
}

async function fetchEONETEvents(signal?: AbortSignal): Promise<DisasterEvent[]> {
  try {
    const data = await cachedFetchWithFallback<EONETResponse>(EONET_API_URL, {
      cacheKey: 'eonet', ttlMs: 300_000, signal,
    });

    return data.events
      .map(transformEONETEvent)
      .filter((event): event is DisasterEvent => event !== null);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    console.error('Failed to fetch EONET events:', error);
    return [];
  }
}

export async function fetchDisasterEvents(signal?: AbortSignal): Promise<DisasterEvent[]> {
  try {
    const [eonetEvents, usgsEarthquakes] = await Promise.all([
      fetchEONETEvents(signal),
      fetchUSGSEarthquakes(signal),
    ]);
    
    // Combine and deduplicate events
    const allEvents: DisasterEvent[] = [];
    const seenCoords = new Set<string>();
    
    // Add USGS earthquakes first (more accurate real-time data)
    for (const event of usgsEarthquakes) {
      const coordKey = `${event.coordinates[0].toFixed(2)},${event.coordinates[1].toFixed(2)}`;
      if (!seenCoords.has(coordKey)) {
        seenCoords.add(coordKey);
        allEvents.push(event);
      }
    }
    
    // Add EONET events (excluding earthquakes that might duplicate USGS)
    for (const event of eonetEvents) {
      const coordKey = `${event.coordinates[0].toFixed(2)},${event.coordinates[1].toFixed(2)}`;
      // Skip if same location already exists (likely duplicate earthquake)
      if (event.category === 'earthquakes' && seenCoords.has(coordKey)) {
        continue;
      }
      if (!seenCoords.has(coordKey)) {
        seenCoords.add(coordKey);
      }
      allEvents.push(event);
    }
    
    // Sort by date (most recent first)
    allEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return allEvents;
  } catch (error) {
    console.error('Failed to fetch disaster events:', error);
    throw error;
  }
}

// Major cities for weather data
const MAJOR_CITIES: City[] = [
  { name: 'New York', country: 'USA', lat: 40.7128, lon: -74.0060 },
  { name: 'Los Angeles', country: 'USA', lat: 34.0522, lon: -118.2437 },
  { name: 'London', country: 'UK', lat: 51.5074, lon: -0.1278 },
  { name: 'Paris', country: 'France', lat: 48.8566, lon: 2.3522 },
  { name: 'Tokyo', country: 'Japan', lat: 35.6762, lon: 139.6503 },
  { name: 'Sydney', country: 'Australia', lat: -33.8688, lon: 151.2093 },
  { name: 'Dubai', country: 'UAE', lat: 25.2048, lon: 55.2708 },
  { name: 'Singapore', country: 'Singapore', lat: 1.3521, lon: 103.8198 },
  { name: 'Mumbai', country: 'India', lat: 19.0760, lon: 72.8777 },
  { name: 'São Paulo', country: 'Brazil', lat: -23.5505, lon: -46.6333 },
  { name: 'Cairo', country: 'Egypt', lat: 30.0444, lon: 31.2357 },
  { name: 'Moscow', country: 'Russia', lat: 55.7558, lon: 37.6173 },
  { name: 'Beijing', country: 'China', lat: 39.9042, lon: 116.4074 },
  { name: 'Berlin', country: 'Germany', lat: 52.5200, lon: 13.4050 },
  { name: 'Cape Town', country: 'South Africa', lat: -33.9249, lon: 18.4241 },
  { name: 'Mexico City', country: 'Mexico', lat: 19.4326, lon: -99.1332 },
  { name: 'Toronto', country: 'Canada', lat: 43.6532, lon: -79.3832 },
  { name: 'Seoul', country: 'South Korea', lat: 37.5665, lon: 126.9780 },
  { name: 'Bangkok', country: 'Thailand', lat: 13.7563, lon: 100.5018 },
  { name: 'Lagos', country: 'Nigeria', lat: 6.5244, lon: 3.3792 },
];

// Weather code descriptions
const weatherCodeDescriptions: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Light freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail',
};

async function fetchCityWeather(city: City, signal?: AbortSignal): Promise<WeatherData | null> {
  try {
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,relative_humidity_2m,is_day,precipitation,cloud_cover,pressure_msl,surface_pressure,dew_point_2m&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max&timezone=auto`;
    
    const airQualityUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${city.lat}&longitude=${city.lon}&current=us_aqi,pm10,pm2_5`;
    
    const [weatherResponse, airQualityResponse] = await Promise.all([
      fetch(weatherUrl, { signal }),
      fetch(airQualityUrl, { signal }).catch(() => null),
    ]);
    
    if (!weatherResponse.ok) return null;
    
    const weatherData = await weatherResponse.json();
    let airQualityData = null;
    
    if (airQualityResponse?.ok) {
      airQualityData = await airQualityResponse.json();
    }
    
    // Determine air quality level
    let airQualityLevel: 'good' | 'moderate' | 'unhealthy-sensitive' | 'unhealthy' | 'very-unhealthy' | 'hazardous' = 'good';
    const aqi = airQualityData?.current?.us_aqi || 0;
    
    if (aqi > 300) airQualityLevel = 'hazardous';
    else if (aqi > 200) airQualityLevel = 'very-unhealthy';
    else if (aqi > 150) airQualityLevel = 'unhealthy';
    else if (aqi > 100) airQualityLevel = 'unhealthy-sensitive';
    else if (aqi > 50) airQualityLevel = 'moderate';
    
    // Get today's daily data
    const todayIndex = 0;
    
    return {
      city: city.name,
      country: city.country,
      coordinates: [city.lon, city.lat],
      temperature: Math.round(weatherData.current.temperature_2m),
      feelsLike: Math.round(weatherData.current.apparent_temperature),
      tempMin: Math.round(weatherData.daily?.temperature_2m_min?.[todayIndex] || weatherData.current.temperature_2m - 3),
      tempMax: Math.round(weatherData.daily?.temperature_2m_max?.[todayIndex] || weatherData.current.temperature_2m + 3),
      weatherCode: weatherData.current.weather_code,
      windSpeed: Math.round(weatherData.current.wind_speed_10m),
      windDirection: weatherData.current.wind_direction_10m,
      windGusts: Math.round(weatherData.current.wind_gusts_10m || 0),
      humidity: weatherData.current.relative_humidity_2m,
      description: weatherCodeDescriptions[weatherData.current.weather_code] || 'Unknown',
      isDay: weatherData.current.is_day === 1,
      pressure: Math.round(weatherData.current.pressure_msl || weatherData.current.surface_pressure || 1013),
      visibility: 10, // Open-Meteo doesn't provide visibility, using default
      uvIndex: Math.round(weatherData.daily?.uv_index_max?.[todayIndex] || 0),
      cloudCover: weatherData.current.cloud_cover,
      precipitation: weatherData.current.precipitation || 0,
      precipitationProbability: weatherData.daily?.precipitation_probability_max?.[todayIndex] || 0,
      dewPoint: Math.round(weatherData.current.dew_point_2m || 0),
      airQualityIndex: aqi,
      airQualityLevel,
      pm25: airQualityData?.current?.pm2_5 || undefined,
      pm10: airQualityData?.current?.pm10 || undefined,
      sunrise: weatherData.daily?.sunrise?.[todayIndex] || undefined,
      sunset: weatherData.daily?.sunset?.[todayIndex] || undefined,
      weatherAlerts: [], // Would need a separate alerts API
    };
  } catch (error) {
    console.error(`Failed to fetch weather for ${city.name}:`, error);
    return null;
  }
}

export async function fetchWeatherData(signal?: AbortSignal): Promise<WeatherData[]> {
  try {
    const weatherPromises = MAJOR_CITIES.map(city => fetchCityWeather(city, signal));
    const results = await Promise.all(weatherPromises);
    return results.filter((w): w is WeatherData => w !== null);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    console.error('Failed to fetch weather data:', error);
    throw error;
  }
}
