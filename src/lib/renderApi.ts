/**
 * HeatZone AI — Render Backend API Service
 * Base URL: https://heatzone-backend.onrender.com
 */

export const RENDER_BACKEND_URL = import.meta.env.VITE_API_BASE_URL || 'https://heatzone-backend.onrender.com';

// Interfaces for API Responses

export interface RootStatusResponse {
  status: string;
  service: string;
  version?: string;
  endpoints?: Record<string, string>;
}

export interface HeatwaveRiskForecast {
  date: string;
  temp_max_c: number;
  temp_min_c: number;
  humidity_pct: number;
  rainfall_mm: number;
  wind_speed_kmh: number;
  heat_risk_score: number;
  heat_zone: 'Low' | 'Moderate' | 'High' | 'Extreme';
  primary_driver: string;
}

export interface CityForecastResponse {
  city: string;
  forecast_days: number;
  generated_at?: string;
  forecast: HeatwaveRiskForecast[];
}

export interface SatModelAnalysisResponse {
  city: string;
  horizon_hours: number;
  stage_1_corridors?: {
    monsoon_signal?: string;
    loo_wind_velocity?: number;
    western_disturbance?: string;
  };
  stage_2_satellite_indices?: {
    ndvi?: number;
    ndwi?: number;
    ndbi?: number;
    surface_temp_anomaly?: number;
  };
  stage_3_forecast_matrix?: Record<string, any>;
  summary?: string;
}

export interface CurrentWeatherResponse {
  city: string;
  date: string;
  temp_max_c: number;
  temp_min_c?: number;
  humidity_pct: number;
  rainfall_mm: number;
  wind_speed_kmh: number;
  pressure_hpa?: number;
  heat_risk_score: number;
  heat_zone: 'Low' | 'Moderate' | 'High' | 'Extreme';
  primary_driver?: string;
}

export interface HistoryRecord {
  date: string;
  temp_max_c: number;
  temp_min_c?: number;
  humidity_pct: number;
  rainfall_mm: number;
  wind_speed_kmh: number;
  heat_risk_score?: number;
  heat_zone?: string;
}

export interface HistoryResponse {
  city: string;
  start_date: string;
  end_date: string;
  records: HistoryRecord[];
}

export interface IndiaSentinelContextResponse {
  date: string;
  sentinel_cities?: Record<string, {
    temp_c: number;
    humidity: number;
    heat_index: number;
    status: string;
  }>;
  corridor_summary?: string;
}

// API Helper Functions

async function handleResponse<T>(res: Response, endpointName: string): Promise<T> {
  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Unknown error');
    throw new Error(`[Render API Error] ${endpointName} failed (${res.status}): ${errorText}`);
  }
  return res.json() as Promise<T>;
}

/**
 * 1. GET / - Root API status and health check
 */
export async function fetchRootStatus(): Promise<RootStatusResponse> {
  const res = await fetch(`${RENDER_BACKEND_URL}/`);
  return handleResponse<RootStatusResponse>(res, 'fetchRootStatus');
}

/**
 * 2. GET /api/v1/forecast/{city} - 16-Day AI Forecast + ML Heatwave Risk
 */
export async function fetchCityForecast(city: string): Promise<CityForecastResponse> {
  const res = await fetch(`${RENDER_BACKEND_URL}/api/v1/forecast/${encodeURIComponent(city)}`);
  return handleResponse<CityForecastResponse>(res, `fetchCityForecast(${city})`);
}

/**
 * 3. GET /api/v1/sat_model/{city}?horizon={hours} - Full Satellite Telemetry Analysis
 */
export async function fetchSatModelAnalysis(city: string, horizon: number = 72): Promise<SatModelAnalysisResponse> {
  const url = `${RENDER_BACKEND_URL}/api/v1/sat_model/${encodeURIComponent(city)}?horizon=${horizon}`;
  const res = await fetch(url);
  return handleResponse<SatModelAnalysisResponse>(res, `fetchSatModelAnalysis(${city})`);
}

/**
 * 4. GET /api/v1/sat_model/{city}/report - Markdown Report Output
 */
export async function fetchSatModelReport(city: string): Promise<string> {
  const url = `${RENDER_BACKEND_URL}/api/v1/sat_model/${encodeURIComponent(city)}/report`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch report for ${city}: ${res.statusText}`);
  }
  return res.text();
}

/**
 * 5. GET /api/v1/weather/{city}/current - Today's Current Weather & Heat Risk
 */
export async function fetchCurrentWeather(city: string): Promise<CurrentWeatherResponse> {
  const url = `${RENDER_BACKEND_URL}/api/v1/weather/${encodeURIComponent(city)}/current`;
  const res = await fetch(url);
  return handleResponse<CurrentWeatherResponse>(res, `fetchCurrentWeather(${city})`);
}

/**
 * 6. GET /api/v1/weather/{city}/forecast - 16-Day Unified Weather Forecast & Heat Risk
 */
export async function fetchUnifiedWeatherForecast(city: string): Promise<CityForecastResponse> {
  const url = `${RENDER_BACKEND_URL}/api/v1/weather/${encodeURIComponent(city)}/forecast`;
  const res = await fetch(url);
  return handleResponse<CityForecastResponse>(res, `fetchUnifiedWeatherForecast(${city})`);
}

/**
 * 7. GET /api/v1/weather/{city}/previous?date=YYYY-MM-DD - Previous Day Weather Record
 */
export async function fetchPreviousDayWeather(city: string, date: string): Promise<CurrentWeatherResponse> {
  const url = `${RENDER_BACKEND_URL}/api/v1/weather/${encodeURIComponent(city)}/previous?date=${date}`;
  const res = await fetch(url);
  return handleResponse<CurrentWeatherResponse>(res, `fetchPreviousDayWeather(${city}, ${date})`);
}

/**
 * 8. GET /api/v1/history/{city}?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD - Historical Weather Records
 */
export async function fetchHistoryRecords(city: string, startDate?: string, endDate?: string): Promise<HistoryResponse> {
  let url = `${RENDER_BACKEND_URL}/api/v1/history/${encodeURIComponent(city)}`;
  const params = new URLSearchParams();
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  if (params.toString()) {
    url += `?${params.toString()}`;
  }
  const res = await fetch(url);
  return handleResponse<HistoryResponse>(res, `fetchHistoryRecords(${city})`);
}

/**
 * 9. GET /api/v1/context/india?date=YYYY-MM-DD - Upstream India Sentinel Climate Signals
 */
export async function fetchIndiaSentinelContext(date?: string): Promise<IndiaSentinelContextResponse> {
  let url = `${RENDER_BACKEND_URL}/api/v1/context/india`;
  if (date) {
    url += `?date=${date}`;
  }
  const res = await fetch(url);
  return handleResponse<IndiaSentinelContextResponse>(res, 'fetchIndiaSentinelContext');
}
