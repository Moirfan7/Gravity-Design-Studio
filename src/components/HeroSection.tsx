import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { motion } from "motion/react";
import { ArrowRight, ChevronDown } from "lucide-react";

interface HeroSectionProps {
  onGetStarted: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onGetStarted }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoSrc = "https://stream.mux.com/T6oQJQ02cQ6N01TR6iHwZkKFkbepS34dkkIc9iukgy400g.m3u8";

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(videoSrc);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch((e) => console.log("Auto-play prevented:", e));
      });
      return () => {
        hls.destroy();
      };
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = videoSrc;
      video.addEventListener("loadedmetadata", () => {
        video.play().catch((e) => console.log("Auto-play prevented:", e));
      });
    }
  }, []);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        minHeight: "100vh",
        backgroundColor: "#000000",
        color: "#ffffff",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: '"Instrument Sans", sans-serif',
      }}
    >
      {/* Background Video Layer */}
      <video
        ref={videoRef}
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
          opacity: 0.6,
          zIndex: 0,
        }}
      />

      {/* Video Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.6)",
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
          backgroundColor: "rgba(30, 58, 138, 0.15)",
          borderRadius: "50%",
          filter: "blur(120px)",
          mixBlendMode: "screen",
          zIndex: 2,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-10%",
          right: "20%",
          width: "500px",
          height: "500px",
          backgroundColor: "rgba(49, 46, 129, 0.15)",
          borderRadius: "50%",
          filter: "blur(120px)",
          mixBlendMode: "screen",
          zIndex: 2,
          pointerEvents: "none",
        }}
      />

      {/* Navbar Component */}
      <header
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          zIndex: 50,
          backgroundColor: "transparent",
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Left Section - Sunburst SVG Icon */}
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

        {/* Center Section (Navigation Links) */}
        {!isMobile && (
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: "32px",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            <a
              href="#"
              style={{
                color: "rgba(255, 255, 255, 0.8)",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255, 255, 255, 0.8)")}
            >
              Products <ChevronDown size={14} />
            </a>
            <a
              href="#"
              style={{
                color: "rgba(255, 255, 255, 0.8)",
                textDecoration: "none",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255, 255, 255, 0.8)")}
            >
              Customer Stories
            </a>
            <a
              href="#"
              style={{
                color: "rgba(255, 255, 255, 0.8)",
                textDecoration: "none",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255, 255, 255, 0.8)")}
            >
              Resources
            </a>
            <a
              href="#"
              style={{
                color: "rgba(255, 255, 255, 0.8)",
                textDecoration: "none",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255, 255, 255, 0.8)")}
            >
              Pricing
            </a>
          </nav>
        )}

        {/* Right Section */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          {!isMobile && (
            <a
              href="#"
              style={{
                color: "rgba(255, 255, 255, 0.8)",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: 500,
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255, 255, 255, 0.8)")}
            >
              Book A Demo
            </a>
          )}
          <button
            onClick={onGetStarted}
            style={{
              backgroundColor: "#ffffff",
              color: "#000000",
              border: "none",
              borderRadius: "9999px",
              padding: "10px 20px",
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
        </div>
      </header>

      {/* Content Container */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          maxWidth: "1024px",
          width: "100%",
          margin: "0 auto",
          padding: "0 24px",
          marginTop: isMobile ? "120px" : "100px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: isMobile ? "24px" : "36px",
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
            fontSize: isMobile ? "48px" : "120px",
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

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          style={{
            fontFamily: '"Instrument Sans", sans-serif',
            fontSize: isMobile ? "16px" : "20px",
            lineHeight: 1.65,
            color: "#ffffff",
            maxWidth: "600px",
            margin: "0 auto",
          }}
        >
          Create fully functional, SEO-optimized websites in seconds with our advanced AI engine.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            gap: "20px",
            alignItems: "center",
            justifyContent: "center",
            marginTop: "12px",
          }}
        >
          {/* Primary Button */}
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
            Start Building Free
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                backgroundColor: "#3054ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#2040e0")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#3054ff")}
            >
              <ArrowRight size={20} color="#ffffff" />
            </div>
          </button>

          {/* Secondary Button */}
          <button
            onClick={onGetStarted}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 24px",
              borderRadius: "8px",
              color: "rgba(255, 255, 255, 0.7)",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              backdropFilter: "blur(4px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              cursor: "pointer",
              fontFamily: '"Instrument Sans", sans-serif',
              fontSize: "16px",
              fontWeight: 500,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#ffffff";
              e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)";
              e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
            }}
          >
            See Examples
            <ArrowRight size={16} />
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default HeroSection;
