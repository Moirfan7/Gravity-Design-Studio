import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { motion } from "motion/react";
import { ArrowRight, PenTool, Eraser, Play, Sparkles, ChevronDown } from "lucide-react";

interface HeroSectionProps {
  onGetStarted: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onGetStarted }) => {
  const heroVideoRef = useRef<HTMLVideoElement>(null);
  const demoVideoRef = useRef<HTMLVideoElement>(null);
  const videoSrc = "https://stream.mux.com/T6oQJQ02cQ6N01TR6iHwZkKFkbepS34dkkIc9iukgy400g.m3u8";

  const [isMobile, setIsMobile] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Scroll detection for fixed navbar styling
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // HLS stream bindings
  useEffect(() => {
    const bindHls = (video: HTMLVideoElement | null) => {
      if (!video) return;
      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(videoSrc);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch((e) => console.log("Auto-play prevented:", e));
        });
        return hls;
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = videoSrc;
        video.addEventListener("loadedmetadata", () => {
          video.play().catch((e) => console.log("Auto-play prevented:", e));
        });
      }
      return null;
    };

    const hls1 = bindHls(heroVideoRef.current);
    const hls2 = bindHls(demoVideoRef.current);

    return () => {
      if (hls1) hls1.destroy();
      if (hls2) hls2.destroy();
    };
  }, []);

  return (
    <div
      style={{
        width: "100%",
        backgroundColor: "#000000",
        color: "#ffffff",
        fontFamily: '"Instrument Sans", sans-serif',
        overflowX: "hidden",
      }}
    >
      {/* Sticky Top Navbar */}
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          zIndex: 100,
          backgroundColor: scrolled ? "rgba(10, 10, 12, 0.75)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(255, 255, 255, 0.05)" : "none",
          padding: scrolled ? "12px 24px" : "20px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }} onClick={onGetStarted}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="4" fill="#ffffff" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
          </svg>
          <span style={{ fontWeight: 800, fontSize: "16px", letterSpacing: "0.5px" }}>GRAVITY</span>
        </div>

        {/* Right Action */}
        <button
          onClick={onGetStarted}
          style={{
            backgroundColor: "#ffffff",
            color: "#000000",
            border: "none",
            borderRadius: "9999px",
            padding: scrolled ? "8px 16px" : "10px 20px",
            fontWeight: 600,
            fontSize: "14px",
            cursor: "pointer",
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.05)";
            e.currentTarget.style.boxShadow = "0 0 15px rgba(255,255,255,0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          Get Started
        </button>
      </header>

      {/* HERO SECTION CONTAINER */}
      <section
        style={{
          position: "relative",
          width: "100%",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          overflow: "hidden",
        }}
      >
        {/* Background Video Layer */}
        <video
          ref={heroVideoRef}
          muted
          loop
          playsInline
          poster="https://images.unsplash.com/photo-1647356191320-d7a1f80ca777?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGRhcmslMjB0ZWNobm9sb2d5JTIwbmV1cmFsJTIwbmV0d29ya3xlbnwxfHx8fDE3Njg5NzIyNTV8MA&ixlib=rb-4.1.0&q=80&w=1080"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.5,
            zIndex: 0,
          }}
        />

        {/* Video Overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(2px)",
            zIndex: 1,
          }}
        />

        {/* Decorative Gradients */}
        <div
          style={{
            position: "absolute",
            top: "-20%",
            left: "20%",
            width: "600px",
            height: "600px",
            backgroundColor: "rgba(139, 92, 246, 0.15)",
            borderRadius: "50%",
            filter: "blur(120px)",
            mixBlendMode: "screen",
            zIndex: 2,
            pointerEvents: "none",
          }}
        />

        {/* Content Container */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            maxWidth: "1024px",
            width: "100%",
            padding: "0 24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: isMobile ? "20px" : "32px",
          }}
        >
          {/* Pre-headline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              fontFamily: '"Instrument Serif", serif',
              fontSize: isMobile ? "28px" : "48px",
              lineHeight: 1.1,
              color: "#ffffff",
              margin: 0,
            }}
          >
            Design at the speed of thought
          </motion.p>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            style={{
              fontFamily: '"Instrument Sans", sans-serif',
              fontWeight: 700,
              fontSize: isMobile ? "54px" : "124px",
              lineHeight: 0.95,
              letterSpacing: "-0.04em",
              background: "linear-gradient(to bottom, #ffffff, #ffffff, #b4c0ff)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              margin: 0,
            }}
          >
            Build Faster
          </motion.h1>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            style={{ marginTop: "16px" }}
          >
            <button
              onClick={onGetStarted}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                padding: "6px 6px 6px 24px",
                borderRadius: "9999px",
                backgroundColor: "#ffffff",
                color: "#0a0400",
                border: "none",
                cursor: "pointer",
                fontFamily: '"Instrument Sans", sans-serif',
                fontSize: "16px",
                fontWeight: 600,
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
                e.currentTarget.style.boxShadow = "0 0 25px rgba(255,255,255,0.45)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              Start Designing Free
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  backgroundColor: "#3054ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ArrowRight size={20} color="#ffffff" />
              </div>
            </button>
          </motion.div>
        </div>

        {/* Scroll Down Indicator */}
        <div
          style={{
            position: "absolute",
            bottom: "30px",
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
            color: "rgba(255, 255, 255, 0.4)",
            fontSize: "12px",
            letterSpacing: "2px",
            pointerEvents: "none",
          }}
        >
          <span>SCROLL DOWN</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          >
            <ChevronDown size={16} />
          </motion.div>
        </div>
      </section>

      {/* PRODUCT FEATURES WALKTHROUGH SECTION */}
      <section
        style={{
          width: "100%",
          padding: isMobile ? "80px 16px" : "120px 24px",
          background: "linear-gradient(to bottom, #000000, #09090b, #000000)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: isMobile ? "60px" : "100px",
        }}
      >
        {/* Section Header */}
        <div style={{ textAlign: "center", maxWidth: "600px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "2px",
              color: "#8b5cf6",
              textTransform: "uppercase",
              marginBottom: "16px",
            }}
          >
            <Sparkles size={14} /> Built for Creative Minds
          </div>
          <h2
            style={{
              fontSize: isMobile ? "32px" : "48px",
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            Design, Mask, and Animate Without Boundaries
          </h2>
        </div>

        {/* FEATURE 1: Vector Drawing */}
        <motion.div
          initial={{ opacity: 0, y: 60, rotateX: 10 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: "center",
            gap: isMobile ? "32px" : "64px",
            maxWidth: "1024px",
            width: "100%",
          }}
        >
          {/* Text */}
          <div style={{ flex: 1 }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                backgroundColor: "rgba(139, 92, 246, 0.1)",
                border: "1px solid rgba(139, 92, 246, 0.2)",
                color: "#8b5cf6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "24px",
              }}
            >
              <PenTool size={24} />
            </div>
            <h3 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "16px" }}>
              1. Advanced Vector Drawing
            </h3>
            <p style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "16px", lineHeight: 1.6, margin: 0 }}>
              Sketch and layout geometric shapes like Rectangles, Ellipses, Triangles, and Stars with total layout control. Select colors, stroke thicknesses, and edit properties with high responsiveness.
            </p>
          </div>

          {/* Visual Simulation */}
          <div
            style={{
              flex: 1.2,
              width: "100%",
              height: "280px",
              background: "#121116",
              borderRadius: "16px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              position: "relative",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
            }}
          >
            {/* Visual Grid Background */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: "radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)",
                backgroundSize: "20px 20px",
                opacity: 0.6,
              }}
            />
            {/* Animated Shape Primitives */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
              style={{
                position: "relative",
                width: "120px",
                height: "120px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none">
                <rect x="10" y="10" width="80" height="80" rx="10" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="4 4" />
                <circle cx="50" cy="50" r="30" stroke="#06b6d4" strokeWidth="2" />
                <path d="M50 15 L85 85 L15 85 Z" stroke="#10b981" strokeWidth="1.5" />
              </svg>
            </motion.div>
          </div>
        </motion.div>

        {/* FEATURE 2: Mask-Based Vector Eraser */}
        <motion.div
          initial={{ opacity: 0, y: 60, rotateX: 10 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{
            display: "flex",
            flexDirection: isMobile ? "column-reverse" : "row",
            alignItems: "center",
            gap: isMobile ? "32px" : "64px",
            maxWidth: "1024px",
            width: "100%",
          }}
        >
          {/* Visual Simulation */}
          <div
            style={{
              flex: 1.2,
              width: "100%",
              height: "280px",
              background: "#121116",
              borderRadius: "16px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              position: "relative",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: "radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)",
                backgroundSize: "20px 20px",
                opacity: 0.6,
              }}
            />
            {/* Visual representation of masking */}
            <div style={{ position: "relative" }}>
              {/* Star shape with a simulated mask stroke cut */}
              <svg width="120" height="120" viewBox="0 0 100 100">
                <mask id="feature-eraser-mask">
                  <rect x="0" y="0" width="100" height="100" fill="white" />
                  {/* Animating cut paths representing eraser */}
                  <motion.path
                    d="M10 50 Q 50 30 90 50"
                    fill="none"
                    stroke="black"
                    strokeWidth="16"
                    strokeLinecap="round"
                    animate={{ d: ["M10 50 Q 50 30 90 50", "M10 20 Q 50 60 90 80", "M10 50 Q 50 30 90 50"] }}
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  />
                </mask>
                <polygon
                  points="50,5 64,36 98,36 70,57 81,91 50,70 19,91 30,57 2,36 36,36"
                  fill="#7D79A2"
                  stroke="#ffffff"
                  strokeWidth="2"
                  mask="url(#feature-eraser-mask)"
                />
              </svg>
              {/* Animating cursor brush indicator */}
              <motion.div
                animate={{ x: [-40, 40, -40], y: [-10, 20, -10] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(239, 68, 68, 0.4)",
                  border: "1.5px solid #ef4444",
                  pointerEvents: "none",
                }}
              />
            </div>
          </div>

          {/* Text */}
          <div style={{ flex: 1 }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                backgroundColor: "rgba(6, 182, 212, 0.1)",
                border: "1px solid rgba(6, 182, 212, 0.2)",
                color: "#06b6d4",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "24px",
              }}
            >
              <Eraser size={24} />
            </div>
            <h3 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "16px" }}>
              2. Vector Eraser & Masking
            </h3>
            <p style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "16px", lineHeight: 1.6, margin: 0 }}>
              The vector path-splitting and masking eraser allows you to slice, carve, and partially delete elements with high flexibility. Erased segments move and rotate together with the shapes, maintaining vector precision.
            </p>
          </div>
        </motion.div>

        {/* FEATURE 3: Timeline & Easing Curves */}
        <motion.div
          initial={{ opacity: 0, y: 60, rotateX: 10 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: "center",
            gap: isMobile ? "32px" : "64px",
            maxWidth: "1024px",
            width: "100%",
          }}
        >
          {/* Text */}
          <div style={{ flex: 1 }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                backgroundColor: "rgba(16, 185, 129, 0.1)",
                border: "1px solid rgba(16, 185, 129, 0.2)",
                color: "#10b981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "24px",
              }}
            >
              <Play size={24} />
            </div>
            <h3 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "16px" }}>
              3. Playback Timeline & Animation Easing
            </h3>
            <p style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "16px", lineHeight: 1.6, margin: 0 }}>
              Bring drawings to life with interactive timelines, custom keyframes, and motion interpolation. Adjust animation easing curves (Linear, Ease-in, Ease-out, Bounce) to make movement natural and engaging.
            </p>
          </div>

          {/* HLS Video Showcase Player */}
          <div
            style={{
              flex: 1.2,
              width: "100%",
              height: "280px",
              borderRadius: "16px",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              position: "relative",
              overflow: "hidden",
              boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
            }}
          >
            <video
              ref={demoVideoRef}
              muted
              loop
              playsInline
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
            {/* Playback Badge */}
            <div
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                padding: "4px 8px",
                background: "rgba(0,0,0,0.6)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "4px",
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "1px",
              }}
            >
              TIMELINE STREAM
            </div>
          </div>
        </motion.div>
      </section>

      {/* FINAL CALL TO ACTION FOOTER */}
      <section
        style={{
          width: "100%",
          padding: "100px 24px",
          textAlign: "center",
          background: "#050507",
          borderTop: "1px solid rgba(255, 255, 255, 0.04)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "24px",
        }}
      >
        <h2 style={{ fontSize: isMobile ? "28px" : "44px", fontWeight: 700, maxWidth: "600px", margin: 0 }}>
          Ready to Craft Your Masterpiece?
        </h2>
        <p style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "16px", maxWidth: "450px", margin: "0 auto 12px auto" }}>
          Hop straight into the editor, pick a template, and start designing vectors and animations instantly.
        </p>
        <button
          onClick={onGetStarted}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            padding: "6px 6px 6px 24px",
            borderRadius: "9999px",
            backgroundColor: "#ffffff",
            color: "#0a0400",
            border: "none",
            cursor: "pointer",
            fontFamily: '"Instrument Sans", sans-serif',
            fontSize: "16px",
            fontWeight: 600,
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.05)";
            e.currentTarget.style.boxShadow = "0 0 25px rgba(255,255,255,0.45)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          Enter Gravity Studio
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              backgroundColor: "#3054ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ArrowRight size={20} color="#ffffff" />
          </div>
        </button>
      </section>
    </div>
  );
};

export default HeroSection;
