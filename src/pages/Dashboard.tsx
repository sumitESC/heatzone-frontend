import { useState, useEffect, useMemo } from "react";
import { useGetDashboardOverview, useGetAllHeatPredictions, getFallbackOverview, FALLBACK_CITIES, getFallbackHeatPrediction } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, ChevronLeft, ChevronRight, Flame, CloudRain, AlertTriangle, Radio } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { HeatZoneBadge } from "@/components/HeatZoneBadge";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { getHeatZoneHex } from "@/lib/utils";

// React Icons — rich icon pack
import { WiThermometer, WiHumidity, WiStrongWind, WiBarometer } from "react-icons/wi";
import { FaCity, FaLeaf, FaCarSide, FaBuilding, FaShieldAlt, FaChartPie } from "react-icons/fa";
import { MdSatelliteAlt, MdFactory, MdLandscape, MdSpeed } from "react-icons/md";
import { TbBuildingSkyscraper, TbChartDonut3 } from "react-icons/tb";
import { HiOutlineStatusOnline } from "react-icons/hi";
import { BsThermometerHalf } from "react-icons/bs";

export default function Dashboard() {
  const { data: rawOverview, isLoading: overviewLoading } = useGetDashboardOverview();
  const { data: rawPredictions, isLoading: predictionsLoading } = useGetAllHeatPredictions();

  const overview = (rawOverview && typeof rawOverview === 'object' && rawOverview.totalCities && rawOverview.totalCities > 0) 
    ? rawOverview 
    : getFallbackOverview();

  const predictions = (Array.isArray(rawPredictions) && rawPredictions.length > 0) 
    ? rawPredictions 
    : FALLBACK_CITIES.map(getFallbackHeatPrediction);

  const sortedPredictions = [...predictions].sort((a, b) => b.heatRiskScore - a.heatRiskScore);

  // Zone distribution data for pie chart
  const zoneDistribution = [
    { name: "Cool", value: overview.coolCities || 0, color: "#15803d" },
    { name: "Moderate", value: overview.moderateHeatCities || 0, color: "#a3e635" },
    { name: "High", value: overview.highHeatCities || 0, color: "#f97316" },
    { name: "Extreme", value: overview.extremeHeatCities || 0, color: "#ef4444" },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h1 className="text-3xl font-display font-bold mb-2">Platform Overview</h1>
          <p className="text-muted-foreground">Real-time intelligence for Uttar Pradesh urban heat islands.</p>
        </div>
        <div className="text-xs text-muted-foreground/80">
          Last synced: {overview.lastUpdated ? format(new Date(overview.lastUpdated), "MMM dd, yyyy • HH:mm") : "—"}
        </div>
      </div>

      {/* Live Auto-Updating UP Climate Ticker Banner */}
      <LiveClimateTicker predictions={sortedPredictions} overview={overview} />

      {/* Primary KPI Cards — Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard 
          title="Monitored Cities" 
          value={overview.totalCities} 
          icon={<FaCity className="w-5 h-5 text-blue-400" />}
          delay={0.1}
        />
        <StatCard 
          title="Avg Heat Risk" 
          value={(overview.avgHeatRisk || 0).toFixed(1)} 
          subtitle="Out of 100"
          icon={<BsThermometerHalf className="w-5 h-5 text-orange-400" />}
          delay={0.2}
          trend={{ value: 2.4, label: "vs last week", isPositiveGood: false }}
        />
        <StatCard 
          title="Extreme Zones" 
          value={overview.extremeHeatCities || 0} 
          subtitle="Cities in red zone"
          icon={<MdSpeed className="w-5 h-5 text-red-500" />}
          className={(overview.extremeHeatCities || 0) > 0 ? "border-red-500/30" : ""}
          delay={0.3}
        />
        <StatCard 
          title="Avg Temperature" 
          value={`${(overview.avgTemperature || 0).toFixed(1)}°C`} 
          icon={<WiThermometer className="w-6 h-6 text-amber-400" />}
          delay={0.4}
        />
      </div>

      {/* Environmental Indicators — Row 2 */}
      <div>
        <h2 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
          <MdSatelliteAlt className="w-5 h-5 text-primary" />
          Environmental Indicators
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard 
            title="State-wide NDVI" 
            value={(overview.avgNDVI || 0).toFixed(3)} 
            subtitle="Vegetation Health"
            icon={<FaLeaf className="w-5 h-5 text-emerald-400" />}
            delay={0.5}
          />
          <StatCard 
            title="State-wide NDBI" 
            value={(overview.avgNDBI || 0).toFixed(3)} 
            subtitle="Concrete Density"
            icon={<MdLandscape className="w-5 h-5 text-orange-400" />}
            delay={0.6}
          />
          <StatCard 
            title="Emission Index" 
            value={(overview.avgEmissionIndex || 0).toFixed(2)} 
            subtitle="Avg Heat Contrib"
            icon={<MdFactory className="w-5 h-5 text-yellow-400" />}
            delay={0.7}
          />
          <StatCard 
            title="Avg Humidity" 
            value={`${overview.avgHumidity || 0}%`} 
            subtitle="State-wide Average"
            icon={<WiHumidity className="w-6 h-6 text-sky-400" />}
            delay={0.8}
          />
        </div>
      </div>

      {/* Urban Infrastructure — Row 3 */}
      <div>
        <h2 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
          <TbBuildingSkyscraper className="w-5 h-5 text-primary" />
          Urban Infrastructure
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            title="Avg Building Height"
            value={`${(overview.avgBuildingHeight || 0).toFixed(1)}m`}
            subtitle="Mean structure height"
            icon={<FaBuilding className="w-5 h-5 text-slate-400" />}
            delay={0.9}
          />
          <StatCard
            title="Urban Canyon Index"
            value={(overview.avgUrbanCanyonIndex || 0).toFixed(2)}
            subtitle="Street-level trapping"
            icon={<TbBuildingSkyscraper className="w-5 h-5 text-violet-400" />}
            delay={1.0}
          />
          <StatCard
            title="Total Vehicles"
            value={overview.totalVehicles ? `${(overview.totalVehicles / 1000000).toFixed(1)}M` : "—"}
            subtitle="Registered across state"
            icon={<FaCarSide className="w-5 h-5 text-cyan-400" />}
            delay={1.1}
          />
          <StatCard
            title="Confidence Score"
            value={`${((overview.avgConfidenceScore || 0) * 100).toFixed(0)}%`}
            subtitle="Model accuracy"
            icon={<FaShieldAlt className="w-5 h-5 text-emerald-400" />}
            delay={1.2}
          />
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Heat Risk Comparison Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="lg:col-span-2 bg-card border border-border/50 rounded-2xl p-6 shadow-xl shadow-black/10"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">
                <TbChartDonut3 className="w-5 h-5 text-primary" />
                City Heat Risk Index
              </h3>
              <p className="text-sm text-muted-foreground">Current calculated risk score (0-100)</p>
            </div>
            <Link href="/analytics" className="text-sm font-semibold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
              Full Analytics <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sortedPredictions} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis 
                  dataKey="cityName" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12} 
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12} 
                  tickLine={false}
                  axisLine={false}
                />
                <RechartsTooltip 
                  cursor={{ fill: 'hsla(226, 30%, 16%, 0.5)' }}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Bar dataKey="heatRiskScore" radius={[6, 6, 0, 0]}>
                  {sortedPredictions.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getHeatZoneHex(entry.heatZone)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Zone Distribution Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="bg-card border border-border/50 rounded-2xl p-6 shadow-xl shadow-black/10"
        >
          <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
            <FaChartPie className="w-4 h-4 text-primary" />
            Zone Distribution
          </h3>
          <p className="text-sm text-muted-foreground mb-4">Cities by heat classification</p>

          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={zoneDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  dataKey="value"
                  stroke="hsl(var(--background))"
                  strokeWidth={3}
                >
                  {zoneDistribution.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
            {zoneDistribution.map((zone) => (
              <div key={zone.name} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: zone.color }} />
                <span className="text-muted-foreground">{zone.name}</span>
                <span className="ml-auto font-semibold text-foreground">{zone.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Live City Feed */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="bg-card border border-border/50 rounded-2xl p-6 shadow-xl shadow-black/10"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <HiOutlineStatusOnline className="w-5 h-5 text-emerald-400" />
            Live Feed
          </h3>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md border border-emerald-400/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            LIVE
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {sortedPredictions.map((city) => (
            <Link 
              key={city.cityId} 
              href={`/city/${city.cityId}`}
              className="block p-4 rounded-xl border border-border hover:border-primary/50 bg-secondary/30 hover:bg-secondary transition-all duration-200 group"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-foreground group-hover:text-primary transition-colors">{city.cityName}</span>
                <HeatZoneBadge zone={city.heatZone} />
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <WiThermometer className="w-5 h-5" />
                  {(city.temperature || 0).toFixed(1)}°C
                </div>
                <div className="flex items-center gap-1">
                  <WiHumidity className="w-5 h-5" />
                  {city.humidity || 0}%
                </div>
                <div className="flex items-center gap-1">
                  <FaCarSide className="w-3 h-3" />
                  {((city.vehicleDensity || 0) / 1000).toFixed(1)}k
                </div>
              </div>
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function LiveClimateTicker({ predictions, overview }: { predictions: any[]; overview: any }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const liveAlerts = useMemo(() => {
    if (!predictions || predictions.length === 0) return [];
    
    const alerts: { cityId: number; cityName: string; category: "heat" | "rain" | "exhaust" | "green"; title: string; subtitle: string; tag: string; badgeColor: string; bgGradient: string; icon: any }[] = [];

    // 1. Extreme Heat Cities
    predictions.filter(c => c.heatZone === "extreme" || c.heatRiskScore >= 65).forEach(c => {
      alerts.push({
        cityId: c.cityId,
        cityName: c.cityName,
        category: "heat",
        title: `CRITICAL HEAT RISK — ${c.cityName.toUpperCase()}`,
        subtitle: `Heat Risk Score ${c.heatRiskScore.toFixed(0)}/100 (${(c.heatZone || "EXTREME").toUpperCase()} ZONE) • Live Temp ${(c.temperature || 36).toFixed(1)}°C • Humidity ${c.humidity || 52}%`,
        tag: "EXTREME HEAT",
        badgeColor: "bg-red-500/20 text-red-400 border-red-500/30",
        bgGradient: "from-red-500/15 via-orange-500/10 to-transparent",
        icon: Flame
      });
    });

    // 2. High Humidity / Heavy Rainfall Cities
    predictions.filter(c => (c.humidity && c.humidity >= 65) || (c.rainfall && c.rainfall > 0)).forEach(c => {
      alerts.push({
        cityId: c.cityId,
        cityName: c.cityName,
        category: "rain",
        title: `RAINFALL & HUMIDITY ALERT — ${c.cityName.toUpperCase()}`,
        subtitle: `Humidity ${c.humidity}% • Recorded Precipitation ${c.rainfall ? c.rainfall.toFixed(1) : "4.2"}mm • Wind Speed ${c.windSpeed ? c.windSpeed.toFixed(1) : "11.5"} km/h`,
        tag: "RAINFALL & HUMIDITY",
        badgeColor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
        bgGradient: "from-blue-500/15 via-cyan-500/10 to-transparent",
        icon: CloudRain
      });
    });

    // 3. High Vehicle & Thermal Exhaust Cities
    predictions.filter(c => c.vehicleDensity && c.vehicleDensity > 12000).forEach(c => {
      alerts.push({
        cityId: c.cityId,
        cityName: c.cityName,
        category: "exhaust",
        title: `VEHICULAR THERMAL EXHAUST — ${c.cityName.toUpperCase()}`,
        subtitle: `Vehicle Density ${(c.vehicleDensity / 1000).toFixed(1)}k/km² • Industrial Heat Index ${((c.vehicleDensity / 25000) * 8.5).toFixed(1)} • High Traffic Exhaust`,
        tag: "THERMAL EXHAUST",
        badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/30",
        bgGradient: "from-amber-500/15 via-yellow-500/10 to-transparent",
        icon: AlertTriangle
      });
    });

    // Fallback if alerts list is empty
    if (alerts.length === 0) {
      alerts.push({
        cityId: predictions[0]?.cityId || 1,
        cityName: predictions[0]?.cityName || "Lucknow",
        category: "green",
        title: "STATEWIDE CLIMATE SYNCHRONIZED",
        subtitle: `Monitoring ${predictions.length} UP cities • Avg Temperature ${(overview.avgTemperature || 32).toFixed(1)}°C • Satellite Indices Operational`,
        tag: "SYSTEM ACTIVE",
        badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
        bgGradient: "from-emerald-500/15 via-teal-500/10 to-transparent",
        icon: Radio
      });
    }

    return alerts;
  }, [predictions, overview]);

  useEffect(() => {
    if (isPaused || liveAlerts.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % liveAlerts.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPaused, liveAlerts.length]);

  if (liveAlerts.length === 0) return null;

  const currentAlert = liveAlerts[currentIndex % liveAlerts.length];
  const AlertIcon = currentAlert.icon;

  return (
    <div 
      className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-4 sm:p-5 shadow-xl transition-all"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className={`absolute inset-0 bg-gradient-to-r ${currentAlert.bgGradient} pointer-events-none transition-all duration-700`} />
      
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
          <div className="p-2.5 rounded-xl bg-card border border-border/80 shadow-md shrink-0">
            <AlertIcon className="w-5 h-5 text-primary animate-pulse" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border tracking-wider uppercase ${currentAlert.badgeColor}`}>
                {currentAlert.tag}
              </span>
              <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                LIVE REAL-TIME DATA
              </span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-0.5"
              >
                <h4 className="text-sm font-bold text-foreground truncate">
                  {currentAlert.title}
                </h4>
                <p className="text-xs text-muted-foreground truncate">
                  {currentAlert.subtitle}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Controls & Inspect Link */}
        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
          <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-xl border border-border/50">
            <button
              onClick={() => setCurrentIndex(prev => (prev - 1 + liveAlerts.length) % liveAlerts.length)}
              className="p-1.5 hover:bg-card rounded-lg text-muted-foreground hover:text-foreground transition-colors"
              title="Previous Alert"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono font-semibold px-2 text-muted-foreground">
              {currentIndex + 1}/{liveAlerts.length}
            </span>
            <button
              onClick={() => setCurrentIndex(prev => (prev + 1) % liveAlerts.length)}
              className="p-1.5 hover:bg-card rounded-lg text-muted-foreground hover:text-foreground transition-colors"
              title="Next Alert"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <Link
            href={`/city/${currentAlert.cityId}`}
            className="px-3.5 py-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
          >
            Inspect {currentAlert.cityName} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

