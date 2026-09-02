import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { useGetCityDataset } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { MapContainer, TileLayer, CircleMarker, Popup, ZoomControl, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { 
  ArrowLeft, Thermometer, Droplets, Wind, CloudRain, Car, TreePine, 
  Building2, Users, Loader2, AlertCircle, TrendingUp, MapPin, Brain, 
  Construction, Zap, Satellite, Gauge, Sun, Cloud, CloudSun, CloudDrizzle, 
  CloudLightning, CalendarDays, Activity, ExternalLink, Building, Factory, 
  ShieldCheck, ShieldAlert
} from "lucide-react";
import { HeatZoneBadge } from "@/components/HeatZoneBadge";
import { cn, getPriorityColor, getHeatZoneHex } from "@/lib/utils";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar 
} from 'recharts';

function CityMapController() {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    const timer1 = setTimeout(() => map.invalidateSize(), 100);
    const timer2 = setTimeout(() => map.invalidateSize(), 500);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [map]);
  return null;
}

export default function CityDetail() {
  const [, params] = useRoute<{ cityId: string }>("/city/:cityId");
  const cityId = params?.cityId ? parseInt(params.cityId, 10) : 0;
  
  const { data, isLoading, error } = useGetCityDataset(cityId, {
    query: { enabled: !!cityId, queryKey: ['cityDataset', cityId] }
  });

  const [cityForecast, setCityForecast] = useState<any[]>([]);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [mapTileMode, setMapTileMode] = useState<"osm" | "dark" | "satellite">("osm");

  useEffect(() => {
    if (!data?.city?.name) return;
    const fetchForecast = async () => {
      setLoadingForecast(true);
      try {
        const RENDER_BASE = import.meta.env.VITE_API_BASE_URL || 'https://heatzone-backend.onrender.com';
        const res = await fetch(`${RENDER_BASE}/api/v1/weather/${encodeURIComponent(data.city.name)}/forecast`);
        if (res.ok) {
          const json = await res.json();
          const list = json.forecast || json.ml_16day || (Array.isArray(json) ? json : []);
          setCityForecast(list);
        } else {
          // Simulation fallback for 16 days
          setCityForecast(Array.from({ length: 16 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() + i);
            return {
              date: d.toISOString().split("T")[0],
              Temp_Max_C: (data.latestPrediction?.temperature || 34) + (i % 3) - 1,
              Temp_Min_C: (data.latestPrediction?.temperature || 34) - 8 + (i % 2),
              Precipitation_mm: i === 2 || i === 7 ? 6.4 : (i % 5 === 0 ? 1.2 : 0),
              Humidity_Mean_pct: (data.latestWeather?.humidity || 55) + (i % 4) * 3,
              Wind_Speed_Max_kmh: 9 + (i % 3),
              heat_risk_score: (data.latestPrediction?.heatRiskScore || 60) + (i % 4) * 2 - 3,
              primary_driver: "Urban Canyon"
            };
          }));
        }
      } catch (err) {
        console.error("Failed to load forecast for city:", err);
      } finally {
        setLoadingForecast(false);
      }
    };
    fetchForecast();
  }, [data?.city?.name]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-muted-foreground">Compiling urban profile...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center text-red-400 bg-red-500/10 rounded-2xl border border-red-500/20 max-w-lg mx-auto mt-20">
        <AlertCircle className="w-12 h-12 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Profile Not Found</h2>
        <p>Could not retrieve data for this city. It might not exist in the database.</p>
        <Link href="/" className="inline-block mt-4 text-white bg-secondary px-4 py-2 rounded-lg hover:bg-secondary/80">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const { city, latestWeather, latestPrediction, recommendations, heatHistory } = data;
  
  // Format data for Radar chart
  const radarData = [
    { subject: 'Emissions', A: Math.min(100, (latestPrediction?.emissionIndex || 0) * 10), fullMark: 100 },
    { subject: 'Concrete', A: (latestPrediction?.ndbi || 0.35) * 200, fullMark: 100 },
    { subject: '3D Density', A: ((latestPrediction as any)?.urbanCanyonIndex || 0.4) * 100, fullMark: 100 },
    { subject: 'Industrial', A: ((latestPrediction as any)?.industrialHeatFactor || 0.2) * 100, fullMark: 100 },
    { subject: 'Temperature', A: Math.min(100, (latestPrediction?.temperature || 32) * 2), fullMark: 100 },
    { subject: 'Veg Depletion', A: Math.max(0, 100 - ((latestPrediction?.ndvi || 0.22) * 200)), fullMark: 100 },
  ];

  // Format data for Area chart
  const historyData = heatHistory.slice(0, 10).reverse().map(h => ({
    time: format(new Date(h.predictedAt), 'HH:mm'),
    temp: h.temperature,
    risk: h.heatRiskScore
  }));

  return (
    <div className="space-y-6 pb-12">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-card border border-border/50 p-6 md:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-display font-extrabold text-white mb-3">{city.name}</h1>
          <div className="flex flex-wrap items-center gap-3">
            <HeatZoneBadge zone={latestPrediction?.heatZone || 'unknown'} className="text-sm px-4 py-1.5" />
            <span className="text-muted-foreground flex items-center gap-1.5 text-sm font-medium">
              <MapPin className="w-4 h-4 text-red-400" /> {city.name}, Uttar Pradesh
            </span>
            {(latestPrediction as any)?.confidenceScore && (
               <div className={cn(
                 "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border",
                 (latestPrediction as any).confidenceScore > 0.8 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
               )}>
                 {(latestPrediction as any).confidenceScore > 0.8 ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                 MODEL CONFIDENCE: {((latestPrediction as any).confidenceScore * 100).toFixed(0)}%
               </div>
            )}
          </div>
        </div>

        <div className="relative z-10 flex flex-col md:items-end mt-4 md:mt-0">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-1">Overall Heat Risk</p>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-display font-black tracking-tighter" style={{ color: `var(--color-heat-${latestPrediction?.heatZone || 'moderate'})`}}>
              {latestPrediction?.heatRiskScore.toFixed(0)}
            </span>
            <span className="text-xl text-muted-foreground font-bold">/100</span>
          </div>
        </div>
      </div>
      
      {/* ML Engine Insight Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="bg-primary/5 border border-primary/20 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center gap-6"
      >
        <div className="bg-primary/10 p-4 rounded-full">
          <Brain className="w-8 h-8 text-primary" />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-lg font-bold text-white flex items-center justify-center md:justify-start gap-2 mb-1">
            Causal Intelligence Engine
            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-md font-mono">PyTorch Ensemble v2.0</span>
          </h2>
          <p className="text-muted-foreground text-sm italic font-medium leading-relaxed">
            "{latestPrediction?.riskExplanation || `Microclimate analysis active for ${city.name}. Primary heat drivers include ${latestPrediction?.primaryRiskDriver || 'Urban Canyon and Built-Up Density'}.`}"
          </p>
        </div>
        <div className="shrink-0 flex flex-col items-center gap-1">
          <span className="text-[10px] font-bold uppercase text-muted-foreground whitespace-nowrap">Primary Risk Driver</span>
          <div className="bg-secondary/50 border border-border px-4 py-2 rounded-xl text-sm font-bold text-white shadow-sm flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            {latestPrediction?.primaryRiskDriver || "Morphology"}
          </div>
        </div>
      </motion.div>

      {/* ─── 16-DAY CITY FORECAST STRIP ─── */}
      {cityForecast.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border/50 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-purple-400" />
              16-Day Forecast Preview — {city.name}
            </h3>
            <Link href="/forecast" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
              Full Forecast Page →
            </Link>
          </div>

          <div className="flex overflow-x-auto pb-3 gap-3 snap-x hide-scrollbar" style={{ scrollbarWidth: 'none' }}>
            {cityForecast.map((f, idx) => {
              const maxT = Math.round(f.Temp_Max_C ?? f.tempMax ?? 34);
              const minT = Math.round(f.Temp_Min_C ?? f.tempMin ?? 24);
              const rain = f.Precipitation_mm ?? f.rainfall ?? 0;
              const hum = f.Humidity_Mean_pct ?? f.humidity ?? 55;
              const dateLabel = f.date ? format(parseISO(f.date), "EEE, MMM dd") : `Day ${idx + 1}`;

              return (
                <div key={idx} className="flex-none w-[150px] bg-secondary/30 border border-border/50 rounded-xl p-3.5 snap-start hover:border-primary/40 transition-colors">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase">{dateLabel}</p>
                  <div className="flex items-center justify-between my-2">
                    {rain > 2 ? <CloudRain className="w-6 h-6 text-blue-400" /> : <Sun className="w-6 h-6 text-yellow-400" />}
                    <div className="text-right">
                      <span className="text-lg font-bold text-red-400">{maxT}°</span>
                      <span className="text-xs text-muted-foreground ml-1">{minT}°</span>
                    </div>
                  </div>
                  <div className="space-y-1 text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                    <div className="flex justify-between">
                      <span className="flex items-center gap-1"><CloudRain className="w-3 h-3 text-blue-400" /> Rain</span>
                      <span className="font-semibold text-foreground">{rain} mm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="flex items-center gap-1"><Droplets className="w-3 h-3 text-sky-400" /> Humidity</span>
                      <span className="font-semibold text-foreground">{hum}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ─── GEOSPATIAL CITY THERMAL MAP ─── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-card border border-border/50 rounded-2xl p-6 shadow-xl relative overflow-hidden space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
              <MapPin className="w-5 h-5 text-red-400" />
              Geospatial City Heat Map — {city.name}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Location: {city.latitude.toFixed(4)}°N, {city.longitude.toFixed(4)}°E • Zoom Level 12 Local Heat Island Analysis
            </p>
          </div>
          <div className="flex items-center gap-1.5 bg-secondary/50 border border-border p-1 rounded-xl">
            <button
              onClick={() => setMapTileMode("osm")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${mapTileMode === "osm" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              🗺️ OpenStreetMap
            </button>
            <button
              onClick={() => setMapTileMode("satellite")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${mapTileMode === "satellite" ? "bg-blue-600 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              🛰️ Satellite
            </button>
            <button
              onClick={() => setMapTileMode("dark")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${mapTileMode === "dark" ? "bg-slate-800 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              🌙 Dark Map
            </button>
            <Link href="/map" className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-lg hover:bg-primary/20 transition-colors flex items-center gap-1 ml-1">
              State Map <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        <div className="rounded-xl overflow-hidden border border-border/60 h-[360px] relative z-0">
          <MapContainer
            center={[city.latitude, city.longitude]}
            zoom={12}
            style={{ height: '360px', width: '100%', zIndex: 0 }}
            zoomControl={false}
          >
            <CityMapController />
            <TileLayer
              key={mapTileMode}
              url={
                mapTileMode === "osm"
                  ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  : mapTileMode === "dark"
                    ? "https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png"
                    : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              }
              attribution={
                mapTileMode === "osm"
                  ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  : mapTileMode === "dark"
                    ? '&copy; CARTO'
                    : '&copy; Esri World Imagery'
              }
            />
            <ZoomControl position="bottomright" />
            <CircleMarker
              center={[city.latitude, city.longitude]}
              radius={32}
              pathOptions={{
                color: getHeatZoneHex(latestPrediction?.heatZone),
                fillColor: getHeatZoneHex(latestPrediction?.heatZone),
                fillOpacity: 0.45,
                weight: 3,
              }}
            >
              <Popup>
                <div className="p-1 min-w-[200px]">
                  <h4 className="font-bold text-base text-foreground mb-1">{city.name}</h4>
                  <p className="text-xs text-muted-foreground mb-2">Heat Risk Score: <strong>{latestPrediction?.heatRiskScore.toFixed(1)}/100</strong></p>
                  <div className="text-xs space-y-1.5 border-t border-border/50 pt-2">
                    <div className="flex justify-between"><span>Temperature:</span> <strong>{latestWeather?.temperature.toFixed(1)}°C</strong></div>
                    <div className="flex justify-between"><span>Concrete (NDBI):</span> <strong>{latestPrediction?.ndbi.toFixed(3)}</strong></div>
                    <div className="flex justify-between"><span>Vegetation (NDVI):</span> <strong>{latestPrediction?.ndvi.toFixed(3)}</strong></div>
                    <div className="flex justify-between"><span>Heat Zone:</span> <strong className="uppercase">{latestPrediction?.heatZone}</strong></div>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          </MapContainer>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Weather & Environment Column */}
        <div className="space-y-6">
          
          {/* Current Weather & Hydrology */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}
            className="bg-card border border-border/50 rounded-2xl p-6 shadow-lg"
          >
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Thermometer className="w-5 h-5 text-primary" /> Current Weather & Hydrology</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-secondary/30 p-3 rounded-xl">
                <p className="text-xs text-muted-foreground mb-1">Temperature</p>
                <p className="text-2xl font-bold text-foreground">{latestWeather?.temperature.toFixed(1)}°C</p>
              </div>
              <div className="bg-secondary/30 p-3 rounded-xl">
                <p className="text-xs text-muted-foreground mb-1">Feels Like</p>
                <p className="text-2xl font-bold text-foreground">{latestWeather?.feelsLike.toFixed(1)}°C</p>
              </div>
              
              {/* Rain & Precipitation */}
              <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl">
                <p className="text-xs text-blue-400 font-medium mb-1 flex items-center gap-1">
                  <CloudRain className="w-3.5 h-3.5 text-blue-400" /> Precipitation
                </p>
                <p className="text-xl font-bold text-blue-400">
                  {latestWeather?.rainfall ? latestWeather.rainfall.toFixed(1) : "0.0"} mm
                </p>
              </div>

              {/* Atmospheric Pressure */}
              <div className="bg-secondary/30 p-3 rounded-xl">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5 text-purple-400" /> Pressure
                </p>
                <p className="text-lg font-bold text-foreground">{latestWeather?.pressure || 1012} hPa</p>
              </div>

              <div className="bg-secondary/30 p-3 rounded-xl">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Droplets className="w-3.5 h-3.5 text-sky-400"/> Humidity</p>
                <p className="text-lg font-bold text-foreground">{latestWeather?.humidity}%</p>
              </div>

              <div className="bg-secondary/30 p-3 rounded-xl">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Wind className="w-3.5 h-3.5 text-slate-400"/> Wind</p>
                <p className="text-lg font-bold text-foreground">{latestWeather?.windSpeed} m/s</p>
              </div>
            </div>
          </motion.div>

          {/* Satellite Remote Sensing & Vegetation Diagnostic */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-card border border-border/50 rounded-2xl p-6 shadow-lg"
          >
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Satellite className="w-5 h-5 text-blue-400" /> Satellite & Ecological Indices</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5 font-bold uppercase tracking-wider">
                  <span className="text-muted-foreground flex items-center gap-1"><TreePine className="w-4 h-4 text-emerald-400"/> NDVI (Green Cover Index)</span>
                  <span className="text-emerald-400 font-bold">{latestPrediction?.ndvi?.toFixed(3) || "0.220"}</span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, Math.max(5, (latestPrediction?.ndvi || 0.22) * 200))}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5 font-bold uppercase tracking-wider">
                  <span className="text-muted-foreground flex items-center gap-1"><Construction className="w-4 h-4 text-orange-400"/> NDBI (Built-Up Index)</span>
                  <span className="text-orange-400 font-bold">{latestPrediction?.ndbi?.toFixed(3) || "0.350"}</span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: `${Math.min(100, (latestPrediction?.ndbi || 0.35) * 200)}%` }}></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-secondary/40 p-3 rounded-xl border border-border/40">
                   <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Water Index (NDWI)</span>
                   <p className="text-base font-bold text-blue-400">{(latestPrediction?.ndwi || -0.24).toFixed(3)}</p>
                </div>
                <div className="bg-secondary/40 p-3 rounded-xl border border-border/40">
                   <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Emission Index</span>
                   <p className="text-base font-bold text-yellow-400">{(latestPrediction?.emissionIndex || 3.5).toFixed(2)}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Urban Canopy & Vehicular Exhaust Panel */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
            className="bg-card border border-border/50 rounded-2xl p-6 shadow-lg"
          >
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Car className="w-5 h-5 text-amber-400" /> Urban Canyon & Traffic Heat</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-secondary/40 p-3 rounded-xl border border-border/40">
                 <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Vehicle Density</span>
                 <p className="text-lg font-bold text-foreground">{((latestPrediction?.vehicleDensity || 15000) / 1000).toFixed(1)}k / km²</p>
              </div>
              <div className="bg-secondary/40 p-3 rounded-xl border border-border/40">
                 <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Urban Canyon Index</span>
                 <p className="text-lg font-bold text-foreground">{((latestPrediction as any)?.urbanCanyonIndex || 0.42).toFixed(2)}</p>
              </div>
              <div className="bg-secondary/40 p-3 rounded-xl border border-border/40">
                 <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Avg Building Height</span>
                 <p className="text-lg font-bold text-foreground">{((latestPrediction as any)?.avgBuildingHeight || 12.0).toFixed(1)}m</p>
              </div>
              <div className="bg-secondary/40 p-3 rounded-xl border border-border/40">
                 <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">AC Thermal Exhaust</span>
                 <p className="text-lg font-bold text-foreground">{((latestPrediction as any)?.acThermalExhaust || 0.25).toFixed(2)}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Charts & AI Interventions Column */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-card border border-border/50 rounded-2xl p-6 shadow-lg"
          >
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" /> Heat Risk Trend (Last 24h)</h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historyData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    itemStyle={{ color: 'hsl(var(--primary))', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="risk" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorRisk)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-card border border-border/50 rounded-2xl p-6 shadow-lg flex flex-col"
            >
              <h3 className="font-bold text-lg mb-2">Heat Factor Analysis</h3>
              <p className="text-xs text-muted-foreground mb-4">Multi-variate contributors to the heat island effect.</p>
              <div className="h-[220px] w-full flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <Radar name="City Profile" dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.4} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Recommendations */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-col gap-3"
            >
              <h3 className="font-bold text-lg text-white mb-1">AI Interventions</h3>
              {recommendations.slice(0, 3).map((rec, i) => (
                <div key={rec.id} className="bg-secondary/40 border border-border/50 rounded-xl p-4 hover:bg-secondary transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-sm text-foreground pr-2">{rec.title}</h4>
                    <span className={cn("text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border", getPriorityColor(rec.priority))}>
                      {rec.priority}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{rec.description}</p>
                </div>
              ))}
              {recommendations.length === 0 && (
                <div className="text-sm text-muted-foreground p-4 bg-secondary/20 rounded-xl border border-dashed border-border text-center">
                  No active recommendations at this time.
                </div>
              )}
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
}
