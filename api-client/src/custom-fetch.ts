import { 
  FALLBACK_CITIES, 
  getFallbackOverview, 
  getFallbackHeatPrediction, 
  getFallbackWeather, 
  getFallbackRecommendations, 
  getFallbackCityDataset 
} from "./fallback-data";

export type CustomFetchOptions = RequestInit & {
  responseType?: "json" | "text" | "blob" | "auto";
};

export type ErrorType<T = unknown> = ApiError<T>;

export type BodyType<T> = T;

const NO_BODY_STATUS = new Set([204, 205, 304]);
const DEFAULT_JSON_ACCEPT = "application/json, application/problem+json";

function isRequest(input: RequestInfo | URL): input is Request {
  return typeof Request !== "undefined" && input instanceof Request;
}

function resolveMethod(input: RequestInfo | URL, explicitMethod?: string): string {
  if (explicitMethod) return explicitMethod.toUpperCase();
  if (isRequest(input)) return input.method.toUpperCase();
  return "GET";
}

function isUrl(input: RequestInfo | URL): input is URL {
  return typeof URL !== "undefined" && input instanceof URL;
}

function resolveUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (isUrl(input)) return input.toString();
  return input.url;
}

function mergeHeaders(...sources: Array<HeadersInit | undefined>): Headers {
  const headers = new Headers();

  for (const source of sources) {
    if (!source) continue;
    new Headers(source).forEach((value, key) => {
      headers.set(key, value);
    });
  }

  return headers;
}

function getMediaType(headers: Headers): string | null {
  const value = headers.get("content-type");
  return value ? value.split(";", 1)[0].trim().toLowerCase() : null;
}

function isJsonMediaType(mediaType: string | null): boolean {
  return mediaType === "application/json" || Boolean(mediaType?.endsWith("+json"));
}

function isTextMediaType(mediaType: string | null): boolean {
  return Boolean(
    mediaType &&
      (mediaType.startsWith("text/") ||
        mediaType === "application/xml" ||
        mediaType === "text/xml" ||
        mediaType.endsWith("+xml") ||
        mediaType === "application/x-www-form-urlencoded"),
  );
}

function hasNoBody(response: Response, method: string): boolean {
  if (method === "HEAD") return true;
  if (NO_BODY_STATUS.has(response.status)) return true;
  if (response.headers.get("content-length") === "0") return true;
  if (response.body == null) return true;
  return false;
}

function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function looksLikeJson(text: string): boolean {
  const trimmed = text.trimStart();
  return trimmed.startsWith("{") || trimmed.startsWith("[");
}

function getStringField(value: unknown, key: string): string | undefined {
  if (!value || typeof value !== "object") return undefined;

  const candidate = (value as Record<string, unknown>)[key];
  if (typeof candidate !== "string") return undefined;

  const trimmed = candidate.trim();
  return trimmed === "" ? undefined : trimmed;
}

function truncate(text: string, maxLength = 300): string {
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

function buildErrorMessage(response: Response, data: unknown): string {
  const prefix = `HTTP ${response.status} ${response.statusText}`;

  if (typeof data === "string") {
    const text = data.trim();
    return text ? `${prefix}: ${truncate(text)}` : prefix;
  }

  const title = getStringField(data, "title");
  const detail = getStringField(data, "detail");
  const message =
    getStringField(data, "message") ??
    getStringField(data, "error_description") ??
    getStringField(data, "error");

  if (title && detail) return `${prefix}: ${title} — ${detail}`;
  if (detail) return `${prefix}: ${detail}`;
  if (message) return `${prefix}: ${message}`;
  if (title) return `${prefix}: ${title}`;

  return prefix;
}

export class ApiError<T = unknown> extends Error {
  readonly name = "ApiError";
  readonly status: number;
  readonly statusText: string;
  readonly data: T | null;
  readonly headers: Headers;
  readonly response: Response;
  readonly method: string;
  readonly url: string;

  constructor(
    response: Response,
    data: T | null,
    requestInfo: { method: string; url: string },
  ) {
    super(buildErrorMessage(response, data));
    Object.setPrototypeOf(this, new.target.prototype);

    this.status = response.status;
    this.statusText = response.statusText;
    this.data = data;
    this.headers = response.headers;
    this.response = response;
    this.method = requestInfo.method;
    this.url = response.url || requestInfo.url;
  }
}

export class ResponseParseError extends Error {
  readonly name = "ResponseParseError";
  readonly status: number;
  readonly statusText: string;
  readonly headers: Headers;
  readonly response: Response;
  readonly method: string;
  readonly url: string;
  readonly rawBody: string;
  readonly cause: unknown;

  constructor(
    response: Response,
    rawBody: string,
    cause: unknown,
    requestInfo: { method: string; url: string },
  ) {
    super(
      `Failed to parse response from ${requestInfo.method} ${response.url || requestInfo.url} ` +
        `(${response.status} ${response.statusText}) as JSON`,
    );
    Object.setPrototypeOf(this, new.target.prototype);

    this.status = response.status;
    this.statusText = response.statusText;
    this.headers = response.headers;
    this.response = response;
    this.method = requestInfo.method;
    this.url = response.url || requestInfo.url;
    this.rawBody = rawBody;
    this.cause = cause;
  }
}

async function parseJsonBody(
  response: Response,
  requestInfo: { method: string; url: string },
): Promise<unknown> {
  const raw = await response.text();
  const normalized = stripBom(raw);

  if (normalized.trim() === "") {
    return null;
  }

  try {
    return JSON.parse(normalized);
  } catch (cause) {
    throw new ResponseParseError(response, raw, cause, requestInfo);
  }
}

async function parseErrorBody(response: Response, method: string): Promise<unknown> {
  if (hasNoBody(response, method)) {
    return null;
  }

  const mediaType = getMediaType(response.headers);

  if (mediaType && !isJsonMediaType(mediaType) && !isTextMediaType(mediaType)) {
    return typeof response.blob === "function" ? response.blob() : response.text();
  }

  const raw = await response.text();
  const normalized = stripBom(raw);
  const trimmed = normalized.trim();

  if (trimmed === "") {
    return null;
  }

  if (isJsonMediaType(mediaType) || looksLikeJson(normalized)) {
    try {
      return JSON.parse(normalized);
    } catch {
      return raw;
    }
  }

  return raw;
}

function inferResponseType(response: Response): "json" | "text" | "blob" {
  const mediaType = getMediaType(response.headers);

  if (isJsonMediaType(mediaType)) return "json";
  if (isTextMediaType(mediaType) || mediaType == null) return "text";
  return "blob";
}

async function parseSuccessBody(
  response: Response,
  responseType: "json" | "text" | "blob" | "auto",
  requestInfo: { method: string; url: string },
): Promise<unknown> {
  if (hasNoBody(response, requestInfo.method)) {
    return null;
  }

  const effectiveType =
    responseType === "auto" ? inferResponseType(response) : responseType;

  switch (effectiveType) {
    case "json":
      return parseJsonBody(response, requestInfo);

    case "text": {
      const text = await response.text();
      return text === "" ? null : text;
    }

    case "blob":
      if (typeof response.blob !== "function") {
        throw new TypeError(
          "Blob responses are not supported in this runtime. " +
            "Use responseType \"json\" or \"text\" instead.",
        );
      }
      return response.blob();
  }
}

// Fallback resolver for missing endpoints
function handleFallback(urlStr: string): any {
  if (urlStr.includes("/api/cities/")) {
    const match = urlStr.match(/\/api\/cities\/(\d+)/);
    const id = match ? parseInt(match[1]) : 1;
    return FALLBACK_CITIES.find(c => c.id === id) || FALLBACK_CITIES[0];
  }

  if (urlStr.includes("/api/cities")) {
    try {
      localStorage.setItem('heatzone_cities', JSON.stringify(FALLBACK_CITIES));
    } catch (e) {}
    return FALLBACK_CITIES;
  }

  if (urlStr.includes("/api/datasets/overview")) {
    return getFallbackOverview();
  }

  if (urlStr.includes("/api/heatzone/all")) {
    return FALLBACK_CITIES.map(getFallbackHeatPrediction);
  }

  if (urlStr.includes("/api/heatzone/predict/")) {
    const match = urlStr.match(/\/api\/heatzone\/predict\/(\d+)/);
    const id = match ? parseInt(match[1]) : 1;
    const city = FALLBACK_CITIES.find(c => c.id === id) || FALLBACK_CITIES[0];
    return getFallbackHeatPrediction(city);
  }

  if (urlStr.includes("/api/weather/current/")) {
    const match = urlStr.match(/\/api\/weather\/current\/(\d+)/);
    const id = match ? parseInt(match[1]) : 1;
    const city = FALLBACK_CITIES.find(c => c.id === id) || FALLBACK_CITIES[0];
    return getFallbackWeather(city);
  }

  if (urlStr.includes("/api/recommendations/")) {
    const match = urlStr.match(/\/api\/recommendations\/(\d+)/);
    const id = match ? parseInt(match[1]) : 1;
    return getFallbackRecommendations(id);
  }

  if (urlStr.includes("/api/datasets/city/")) {
    const match = urlStr.match(/\/api\/datasets\/city\/(\d+)/);
    const id = match ? parseInt(match[1]) : 1;
    return getFallbackCityDataset(id);
  }

  if (urlStr.includes("/api/weather/history/") || urlStr.includes("/api/heatzone/history/")) {
    const match = urlStr.match(/\/(?:weather|heatzone)\/history\/(\d+)/);
    const id = match ? parseInt(match[1]) : 1;
    return getFallbackCityDataset(id).heatHistory;
  }

  return null;
}

export async function customFetch<T = unknown>(
  input: RequestInfo | URL,
  options: CustomFetchOptions = {},
): Promise<T> {
  const { responseType = "auto", headers: headersInit, ...init } = options;
  const method = resolveMethod(input, init.method);
  const urlStr = resolveUrl(input);

  if (init.body != null && (method === "GET" || method === "HEAD")) {
    throw new TypeError(`customFetch: ${method} requests cannot have a body.`);
  }

  const headers = mergeHeaders(isRequest(input) ? input.headers : undefined, headersInit);

  if (
    typeof init.body === "string" &&
    !headers.has("content-type") &&
    looksLikeJson(init.body)
  ) {
    headers.set("content-type", "application/json");
  }

  if (responseType === "json" && !headers.has("accept")) {
    headers.set("accept", DEFAULT_JSON_ACCEPT);
  }

  const requestInfo = { method, url: urlStr };
  let fetchUrl: RequestInfo | URL = input;

  // Ensure cities are cached
  try {
    const cached = localStorage.getItem('heatzone_cities');
    if (!cached) {
      localStorage.setItem('heatzone_cities', JSON.stringify(FALLBACK_CITIES));
    }
  } catch (e) {}

  // API Interceptor for Live Render ML Model
  try {
    const RENDER_BASE = "https://heatzone-backend.onrender.com/api/v1";
    const dataSource = localStorage.getItem('heatzone_datasource') || 'ML_MODEL';
    
    if (typeof input === 'string') {
      const citiesRaw = localStorage.getItem('heatzone_cities');
      const cities = citiesRaw ? JSON.parse(citiesRaw) : FALLBACK_CITIES;
      
      const getCityName = (idStr: string) => {
        const id = parseInt(idStr);
        const city = cities.find((c: any) => c.id === id);
        return city ? city.name : idStr;
      };

      const currentMatch = input.match(/\/api\/weather\/current\/(\d+)/);
      if (currentMatch) {
        fetchUrl = `${RENDER_BASE}/weather/${getCityName(currentMatch[1])}/current`;
      }
      
      const heatMatch = input.match(/\/api\/heatzone\/predict\/(\d+)/);
      if (heatMatch) {
        fetchUrl = `${RENDER_BASE}/weather/${getCityName(heatMatch[1])}/current`;
      }
      
      const histMatch = input.match(/\/api\/weather\/history\/(\d+)/);
      if (histMatch) {
        fetchUrl = `${RENDER_BASE}/weather/${getCityName(histMatch[1])}/forecast`;
      }
      
      const heatHistMatch = input.match(/\/api\/heatzone\/history\/(\d+)/);
      if (heatHistMatch) {
        fetchUrl = `${RENDER_BASE}/weather/${getCityName(heatHistMatch[1])}/forecast`;
      }
    }
  } catch (e) {
    console.error("Error in API interceptor", e);
  }

  try {
    const response = await fetch(fetchUrl, { ...init, method, headers });

    if (!response.ok) {
      const fallback = handleFallback(urlStr);
      if (fallback !== null) {
        return fallback as T;
      }
      const errorData = await parseErrorBody(response, method);
      throw new ApiError(response, errorData, requestInfo);
    }

    let data = (await parseSuccessBody(response, responseType, requestInfo)) as any;

    // Response Mapper for ML Model Toggle
    try {
      const dataSource = localStorage.getItem('heatzone_datasource');
      if (dataSource === 'ML_MODEL' && typeof input === 'string') {
        const citiesRaw = localStorage.getItem('heatzone_cities');
        const cities = citiesRaw ? JSON.parse(citiesRaw) : FALLBACK_CITIES;
        
        const heatMatch = input.match(/\/api\/heatzone\/predict\/(\d+)/);
        if (heatMatch && data && (data.current || data.forecast)) {
          const id = parseInt(heatMatch[1]);
          const city = cities.find((c: any) => c.id === id) || FALLBACK_CITIES[0];
          const cur = data.current || (data.forecast ? data.forecast[0] : null);
          if (cur) {
            data = {
              id: Math.random() * 10000,
              cityId: id,
              cityName: city.name || data.city,
              heatRiskScore: cur.heat_risk_score || 55,
              heatZone: cur.heat_zone || "moderate",
              temperature: cur.Temp_Max_C || 34,
              humidity: cur.Humidity_Mean_pct || 55,
              vehicleDensity: city.populationDensity || 1000,
              populationDensity: city.populationDensity || 1000,
              greenCoverRatio: 0.15,
              builtUpRatio: 0.55,
              coolingIndex: 0.25,
              trafficHeatFactor: 900,
              latitude: city.latitude || 26.8467,
              longitude: city.longitude || 80.9462,
              predictedAt: (cur.date || new Date().toISOString().split("T")[0]) + "T00:00:00Z"
            };
          }
        }
        
        const currentMatch = input.match(/\/api\/weather\/current\/(\d+)/);
        if (currentMatch && data && (data.current || data.forecast)) {
          const id = parseInt(currentMatch[1]);
          const city = cities.find((c: any) => c.id === id) || FALLBACK_CITIES[0];
          const cur = data.current || (data.forecast ? data.forecast[0] : null);
          if (cur) {
            data = {
              id: Math.random() * 10000,
              cityId: id,
              cityName: city.name || data.city,
              temperature: cur.Temp_Max_C || 34,
              feelsLike: (cur.Temp_Max_C || 34) + 2,
              humidity: cur.Humidity_Mean_pct || 55,
              windSpeed: cur.Wind_Speed_Max_kmh || 8,
              pressure: cur.Pressure_MSL_hPa || 1008,
              cloudCover: 20,
              rainfall: cur.Precipitation_mm || 0,
              weatherMain: "Clear",
              weatherDescription: cur.primary_driver || "clear sky",
              recordedAt: (cur.date || new Date().toISOString().split("T")[0]) + "T00:00:00Z"
            };
          }
        }
      }
    } catch (e) {
      console.error("Error mapping ML response", e);
    }

    if (!data || (typeof data === "object" && Object.keys(data).length === 0) || (Array.isArray(data) && data.length === 0)) {
      const fallback = handleFallback(urlStr);
      if (fallback !== null) {
        return fallback as T;
      }
    }

    if (urlStr.includes("/api/datasets/overview") && (!data || typeof data !== "object" || !data.totalCities || data.totalCities === 0)) {
      return getFallbackOverview() as T;
    }

    if (urlStr.includes("/api/heatzone/all") && (!data || !Array.isArray(data) || data.length === 0)) {
      return FALLBACK_CITIES.map(getFallbackHeatPrediction) as T;
    }

    if (urlStr.includes("/api/cities") && (!data || !Array.isArray(data) || data.length === 0)) {
      return FALLBACK_CITIES as T;
    }

    return data as T;
  } catch (err: any) {
    const fallback = handleFallback(urlStr);
    if (fallback !== null) {
      return fallback as T;
    }
    throw err;
  }
}
