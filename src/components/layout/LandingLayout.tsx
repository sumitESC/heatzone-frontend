import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";

interface LandingLayoutProps {
  children: ReactNode;
}

export function LandingLayout({ children }: LandingLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  const [location] = useLocation();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 60);
  });

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  // Live UP Climate Weather Feed Ticker
  const upLiveCities = [
    { name: "Kanpur", temp: "38.5°C", risk: "88 (EXTREME)", icon: "🔥", status: "Critical Heat Island" },
    { name: "Lucknow", temp: "34.2°C", risk: "68 (HIGH)", icon: "☀️", status: "Urban Canyon Heat" },
    { name: "Gorakhpur", temp: "31.0°C", risk: "42 (MODERATE)", icon: "🌧️", status: "Monsoon Convection" },
    { name: "Ghaziabad", temp: "37.1°C", risk: "82 (EXTREME)", icon: "⚠️", status: "Traffic & Industrial Exhaust" },
    { name: "Varanasi", temp: "35.8°C", risk: "76 (HIGH)", icon: "🌡️", status: "High Thermal Radiation" },
    { name: "Prayagraj", temp: "36.4°C", risk: "79 (HIGH)", icon: "🔥", status: "Built-up Heat Trap" },
    { name: "Jhansi", temp: "39.1°C", risk: "91 (EXTREME)", icon: "🔥", status: "Bundelkhand Heatwave" },
  ];

  const [activeTickerIndex, setActiveTickerIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTickerIndex((prev) => (prev + 1) % upLiveCities.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const currentTicker = upLiveCities[activeTickerIndex];

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/map", label: "Heat Map" },
    { href: "/analytics", label: "Analytics" },
    { href: "/advisor", label: "Advisor" },
    { href: "/forecast", label: "Forecast" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-foreground selection:text-background">

      {/* ─── Animated Top Navigation with Live UP Stream ─── */}
      <motion.header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          backgroundColor: scrolled ? "hsl(var(--background) / 0.95)" : "rgba(10, 15, 30, 0.9)",
          backdropFilter: "blur(20px)",
          borderBottom: scrolled ? "1px solid hsl(var(--border) / 0.4)" : "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        {/* Top Ticker Strip */}
        <div className="w-full bg-primary/20 border-b border-white/10 py-1.5 px-4 sm:px-6 text-xs font-mono flex items-center justify-between overflow-hidden">
          <div className="flex items-center gap-3 shrink-0">
            <span className="flex items-center gap-1.5 font-bold text-blue-400 bg-blue-500/20 px-2.5 py-0.5 rounded-full border border-blue-500/30 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              LIVE UP CLIMATE STREAM
            </span>
            <span className="hidden md:inline text-white/60 text-[11px]">75 Districts Monitored</span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTickerIndex}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-3 font-semibold text-white truncate mx-4 text-[11px]"
            >
              <span>{currentTicker.icon}</span>
              <span className="font-bold text-yellow-400">{currentTicker.name.toUpperCase()}</span>
              <span>Temp: <strong className="text-red-400">{currentTicker.temp}</strong></span>
              <span className="hidden sm:inline">Risk: <strong className="text-orange-400">{currentTicker.risk}</strong></span>
              <span className="hidden lg:inline text-white/60">({currentTicker.status})</span>
            </motion.div>
          </AnimatePresence>

          <Link href="/map" className="shrink-0 text-blue-400 font-bold hover:underline hidden sm:flex items-center gap-1 text-[11px]">
            Open Map →
          </Link>
        </div>

        {/* Main Nav Bar */}
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="relative z-50">
            <motion.span
              className="font-display font-bold text-xl tracking-[0.2em] uppercase text-white"
              transition={{ duration: 0.3 }}
            >
              HeatZone AI
            </motion.span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-10">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium tracking-widest uppercase transition-opacity hover:opacity-60 text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="hidden lg:inline-flex text-xs font-mono tracking-widest px-6 py-2.5 uppercase transition-all duration-300 border border-white/30 text-white hover:bg-white hover:text-black font-bold"
            >
              Enter Dashboard →
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              className="lg:hidden relative z-50 w-10 h-10 flex flex-col items-center justify-center gap-1.5"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <motion.span
                className="block w-6 h-0.5 origin-center bg-white"
                animate={mobileMenuOpen ? { rotate: 45, y: 4 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.3 }}
              />
              <motion.span
                className="block w-6 h-0.5 origin-center bg-white"
                animate={mobileMenuOpen ? { rotate: -45, y: -4 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.3 }}
              />
            </button>
          </div>
        </div>
      </motion.header>

      {/* ─── Mobile Menu Overlay ─── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-background flex flex-col items-center justify-center gap-8"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {navLinks.map((link, i) => (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08, ease: "easeOut" }}
              >
                <Link
                  href={link.href}
                  className="font-display text-4xl uppercase tracking-wider hover:opacity-60 transition-opacity"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              </motion.div>
            ))}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: navLinks.length * 0.08 }}
            >
              <Link
                href="/dashboard"
                className="font-mono text-xs tracking-widest uppercase border border-foreground/30 px-8 py-4 mt-8 hover:bg-foreground hover:text-background transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Enter Dashboard →
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Main Content ─── */}
      <main className="flex-1 w-full pt-28">
        {children}
      </main>

      {/* ─── Massive Typographic Footer ─── */}
      <footer className="bg-foreground text-background pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 mb-24">
            <div>
              <h4 className="font-mono text-xs uppercase tracking-widest text-background/50 mb-6">Navigation</h4>
              <ul className="space-y-4">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="hover:opacity-70 transition-opacity text-sm">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-mono text-xs uppercase tracking-widest text-background/50 mb-6">Follow Us</h4>
              <ul className="space-y-4 text-sm">
                <li><a href="#" className="hover:opacity-70 transition-opacity">LinkedIn</a></li>
                <li><a href="#" className="hover:opacity-70 transition-opacity">GitHub</a></li>
                <li><a href="#" className="hover:opacity-70 transition-opacity">X / Twitter</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-mono text-xs uppercase tracking-widest text-background/50 mb-6">Research</h4>
              <ul className="space-y-4 text-sm">
                <li><a href="#" className="hover:opacity-70 transition-opacity">Urban Heat Islands</a></li>
                <li><a href="#" className="hover:opacity-70 transition-opacity">Green Infrastructure</a></li>
                <li><a href="#" className="hover:opacity-70 transition-opacity">Climate Adaptation</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-mono text-xs uppercase tracking-widest text-background/50 mb-6">Contact</h4>
              <p className="text-background/70 leading-relaxed mb-4 text-sm">
                Uttar Pradesh, India<br />
                Heat Intelligence Lab
              </p>
              <p className="font-mono text-sm">hello@heatzone.ai</p>
            </div>
          </div>

          {/* Huge logo text */}
          <div className="border-t border-background/15 pt-12 text-center overflow-hidden">
            <h2 className="font-display font-bold text-[11vw] leading-none tracking-tight whitespace-nowrap opacity-90">
              HEATZONE AI
            </h2>
          </div>

          <div className="mt-12 flex flex-col md:flex-row items-center justify-between text-xs font-mono text-background/40 border-t border-background/10 pt-8">
            <div className="flex gap-6 mb-4 md:mb-0">
              <a href="#" className="hover:text-background transition-colors">Terms & Conditions</a>
              <a href="#" className="hover:text-background transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-background transition-colors">Accessibility</a>
            </div>
            <p>© {new Date().getFullYear()} HeatZone AI. Urban Resilience.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
