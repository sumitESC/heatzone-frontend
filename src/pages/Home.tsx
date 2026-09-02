import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { 
  Satellite, Building2, Cpu, Flame, CloudRain, ShieldAlert, Globe, 
  Activity, MapPin, ArrowRight, Zap, Car, Leaf, Factory, Compass
} from "lucide-react";

/* ─── Reusable scroll-reveal wrapper ─── */
function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Horizontal text marquee ─── */
function Marquee({ text, speed = 30 }: { text: string; speed?: number }) {
  return (
    <div className="overflow-hidden whitespace-nowrap border-y border-border py-6 bg-card/40 backdrop-blur-sm">
      <motion.div
        className="inline-flex gap-24 font-display text-4xl md:text-6xl font-bold uppercase tracking-tight opacity-20"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: speed, ease: "linear", repeat: Infinity }}
      >
        {[...Array(6)].map((_, i) => (
          <span key={i} className="flex items-center gap-12">
            <span>{text}</span>
            <span className="w-3 h-3 bg-primary rounded-full animate-ping" />
          </span>
        ))}
      </motion.div>
    </div>
  );
}

const BASE = import.meta.env.BASE_URL;

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div className="w-full overflow-x-hidden bg-background text-foreground">

      {/* ═══════════════ 1. HERO SECTION ═══════════════ */}
      <section ref={heroRef} className="relative min-h-[92vh] w-full flex items-center justify-center overflow-hidden bg-primary text-primary-foreground -mt-28 pt-28">
        {/* Parallax background image */}
        <motion.div className="absolute inset-0 z-0" style={{ y: heroY }}>
          <img
            src={`${BASE}images/landing/hero.png`}
            alt="Uttar Pradesh city heat distribution"
            className="w-full h-full object-cover opacity-35 scale-105"
          />
        </motion.div>

        {/* Gradient overlays */}
        <div className="absolute inset-0 z-[1] bg-gradient-to-b from-primary/80 via-primary/40 to-primary" />
        <div className="absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-primary/50 to-primary" />

        {/* Content */}
        <motion.div className="relative z-10 text-center px-6 max-w-5xl mx-auto py-16" style={{ opacity: heroOpacity }}>
          
          {/* UP State Badge */}
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-foreground/10 border border-primary-foreground/20 text-xs font-mono uppercase tracking-widest text-primary-foreground/90 mb-8"
          >
            <Compass className="w-3.5 h-3.5 text-yellow-400 animate-spin-slow" />
            UTTAR PRADESH URBAN HEAT INTELLIGENCE SYSTEM
          </motion.div>

          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="font-display font-extrabold text-5xl md:text-8xl lg:text-[7rem] leading-[0.9] tracking-tighter uppercase mb-6">
              MAPPING URBAN
              <br />
              HEAT ISLANDS
              <br />
              ACROSS UTTAR PRADESH
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="font-sans text-base md:text-xl text-primary-foreground/80 max-w-3xl mx-auto leading-relaxed mb-10"
          >
            Fusing <strong>Satellite Remote Sensing</strong> (NASA MODIS & Sentinel-2) with <strong>Local Microclimate Analytics</strong> (Street Canyon & Vehicular Exhaust) to protect 240+ Million UP residents from severe heatwaves.
          </motion.p>

          {/* Dual Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 font-mono text-xs tracking-widest uppercase bg-primary-foreground text-primary px-8 py-4 font-bold hover:bg-white hover:shadow-2xl transition-all duration-300 shadow-xl"
            >
              <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
              Enter UP State Dashboard
            </Link>
            
            <Link
              href="/map"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 font-mono text-xs tracking-widest uppercase border border-primary-foreground/40 px-8 py-4 text-primary-foreground hover:bg-primary-foreground/10 transition-all duration-300"
            >
              <Satellite className="w-4 h-4 text-blue-400" />
              Explore Satellite Heat Map
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Marquee strip */}
      <Marquee text="UTTAR PRADESH CLIMATE PLATFORM · SATELLITE REMOTE SENSING · LOCAL MICROCLIMATE ANALYSIS · PYTORCH ML FORECAST" />

      {/* ═══════════════ 2. OUR AIM & MISSION ═══════════════ */}
      <section className="py-24 md:py-36 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <Reveal className="lg:col-span-5">
            <span className="font-mono text-xs tracking-widest uppercase text-primary font-bold block mb-3">OUR CORE MISSION</span>
            <h2 className="font-display text-4xl md:text-6xl uppercase tracking-tighter leading-[0.9] mb-6">
              PROTECTING UTTAR PRADESH FROM SILENT HEATWAVES
            </h2>
            <p className="font-sans text-muted-foreground text-base leading-relaxed mb-6">
              Uttar Pradesh is experiencing rapid urban expansion across major economic corridors—from Kanpur's industrial belt to Lucknow's high-density canyons and Bundelkhand's extreme thermal zones.
            </p>
            <p className="font-sans text-muted-foreground text-base leading-relaxed mb-8">
              Concrete surfaces, vehicle exhaust, and depleted green cover trap surface heat, making urban centers up to <strong>8°C hotter</strong> than surrounding rural regions. Our aim is to provide real-time satellite remote sensing and local microclimate warnings to municipal authorities and citizens.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
              <div>
                <p className="font-display text-3xl font-extrabold text-foreground">75</p>
                <p className="font-mono text-xs text-muted-foreground uppercase">UP Districts Monitored</p>
              </div>
              <div>
                <p className="font-display text-3xl font-extrabold text-primary">240M+</p>
                <p className="font-mono text-xs text-muted-foreground uppercase">Residents Safeguarded</p>
              </div>
            </div>
          </Reveal>

          {/* Staggered Visual Grid */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Reveal delay={0.1}>
              <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-primary/50 transition-all">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
                  <Satellite className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-foreground">Satellite Remote Sensing</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Continuous processing of NASA MODIS Land Surface Temperature (LST) and Sentinel-2 NDVI/NDBI vegetation vs concrete indices.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.2} className="sm:mt-8">
              <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-primary/50 transition-all">
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-4">
                  <Building2 className="w-6 h-6 text-orange-400" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-foreground">Local Microclimate Analysis</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Street-level urban canyon modeling, 3D building height heat retention, AC thermal discharge, and vehicular traffic exhaust factors.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.3}>
              <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-primary/50 transition-all">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
                  <Cpu className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-foreground">16-Day PyTorch ML Engine</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Custom deep learning ensemble models predicting 16-day daily heat risk scores, rainfall probabilities, and primary risk drivers.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.4} className="sm:mt-8">
              <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-primary/50 transition-all">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-foreground">Actionable AI Interventions</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Generates targeted municipal cooling protocols, cool roof installation targets, and emergency cooling center placements.
                </p>
              </div>
            </Reveal>
          </div>

        </div>
      </section>

      {/* ═══════════════ 3. DUAL TECHNOLOGY ARCHITECTURE SHOWCASE ═══════════════ */}
      <section className="py-24 bg-card/60 border-y border-border">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          
          <Reveal className="text-center max-w-3xl mx-auto mb-16">
            <span className="font-mono text-xs tracking-widest uppercase text-primary font-bold block mb-2">OUR DUAL ENGINE ARCHITECTURE</span>
            <h2 className="font-display text-4xl md:text-6xl uppercase tracking-tighter">
              HOW HEATZONE AI ANALYZES UTTAR PRADESH
            </h2>
            <p className="font-sans text-muted-foreground mt-4 text-base">
              Combining macro satellite earth observation with micro street-level sensors to deliver unprecedented accuracy.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Engine 1: Satellite Remote Sensing */}
            <Reveal delay={0.1}>
              <div className="bg-background border border-border rounded-3xl p-8 relative overflow-hidden shadow-2xl h-full flex flex-col justify-between">
                <div className="absolute top-0 right-0 p-32 bg-blue-500/5 rounded-bl-full pointer-events-none" />
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">MACRO LAYER 01</span>
                    <Satellite className="w-7 h-7 text-blue-400" />
                  </div>
                  <h3 className="font-display text-2xl uppercase font-bold mb-4 text-foreground">SATELLITE REMOTE SENSING</h3>
                  <ul className="space-y-3 text-sm text-muted-foreground mb-8">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 font-bold">•</span>
                      <span><strong>NDVI (Vegetation Index):</strong> Tracks green canopy health and urban tree loss across UP districts.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 font-bold">•</span>
                      <span><strong>NDBI (Built-Up Index):</strong> Maps asphalt, roof concrete, and impervious surface absorption.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 font-bold">•</span>
                      <span><strong>NDWI (Water Index):</strong> Monitors surface water bodies and riverine cooling zones.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 font-bold">•</span>
                      <span><strong>NASA LST Surface Thermal Data:</strong> Measures actual ground radiant surface heat.</span>
                    </li>
                  </ul>
                </div>
                <Link href="/map" className="inline-flex items-center gap-2 text-xs font-mono uppercase text-blue-400 font-bold hover:underline">
                  Launch Satellite Map Layer →
                </Link>
              </div>
            </Reveal>

            {/* Engine 2: Local Microclimate Analysis */}
            <Reveal delay={0.2}>
              <div className="bg-background border border-border rounded-3xl p-8 relative overflow-hidden shadow-2xl h-full flex flex-col justify-between">
                <div className="absolute top-0 right-0 p-32 bg-orange-500/5 rounded-bl-full pointer-events-none" />
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-mono text-xs font-bold text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">MICRO LAYER 02</span>
                    <Building2 className="w-7 h-7 text-orange-400" />
                  </div>
                  <h3 className="font-display text-2xl uppercase font-bold mb-4 text-foreground">LOCAL MICROCLIMATE ANALYSIS</h3>
                  <ul className="space-y-3 text-sm text-muted-foreground mb-8">
                    <li className="flex items-start gap-2">
                      <span className="text-orange-400 font-bold">•</span>
                      <span><strong>Urban Canyon Index:</strong> Evaluates 3D building height ratio and street heat entrapment.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-400 font-bold">•</span>
                      <span><strong>Vehicular Thermal Exhaust:</strong> Analyzes 2W, 4W, and commercial transport heat discharge.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-400 font-bold">•</span>
                      <span><strong>AC HVAC Discharge Index:</strong> Quantifies artificial heat output from air conditioning units.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-400 font-bold">•</span>
                      <span><strong>Industrial Emission Index:</strong> Tracks factory heat exhaust in UP manufacturing hubs.</span>
                    </li>
                  </ul>
                </div>
                <Link href="/analytics" className="inline-flex items-center gap-2 text-xs font-mono uppercase text-orange-400 font-bold hover:underline">
                  View Analytics Engine →
                </Link>
              </div>
            </Reveal>

          </div>
        </div>
      </section>

      {/* ═══════════════ 4. STATISTICS COUNTER ═══════════════ */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { number: "75", label: "UP Cities Monitored", sublabel: "Continuous Coverage" },
            { number: "16-Day", label: "Predictive Horizon", sublabel: "PyTorch ML Ensemble" },
            { number: "<1ms", label: "In-Memory Engine", sublabel: "Real-Time Query Response" },
            { number: "24/7", label: "Emergency Alerts", sublabel: "Statewide Dispatch" },
          ].map((stat, i) => (
            <Reveal key={stat.label} delay={i * 0.1}>
              <div className="text-center md:text-left">
                <p className="font-display text-5xl md:text-6xl font-bold tracking-tighter">{stat.number}</p>
                <p className="font-mono text-xs tracking-widest uppercase mt-3 text-primary-foreground/80">{stat.label}</p>
                <p className="font-sans text-xs text-primary-foreground/50 mt-1">{stat.sublabel}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══════════════ 5. CTA SECTION ═══════════════ */}
      <section className="py-28 px-6 text-center bg-primary text-primary-foreground relative overflow-hidden">
        <Reveal>
          <span className="font-mono text-xs tracking-widest uppercase text-primary-foreground/50 mb-6 block">Ready to Protect Uttar Pradesh</span>
          <h2 className="font-display text-5xl md:text-8xl uppercase tracking-tighter leading-[0.85] max-w-4xl mx-auto mb-8">
            EVERY DEGREE
            <br />
            MATTERS
          </h2>
          <p className="font-sans text-base md:text-lg text-primary-foreground/75 max-w-xl mx-auto mb-10 leading-relaxed">
            Access real-time urban heat risk scores, satellite remote sensing diagnostics, and 16-day predictive forecasts for any city in Uttar Pradesh.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-3 font-mono text-xs tracking-widest uppercase bg-primary-foreground text-primary px-10 py-5 font-bold hover:opacity-90 transition-opacity"
            >
              Open UP State Dashboard
            </Link>
            <Link
              href="/advisor"
              className="inline-flex items-center justify-center gap-3 font-mono text-xs tracking-widest uppercase border border-primary-foreground/40 px-10 py-5 hover:bg-primary-foreground/10 transition-colors"
            >
              Ask AI Climate Advisor
            </Link>
          </div>
        </Reveal>
      </section>

    </div>
  );
}
