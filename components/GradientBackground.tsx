import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { Easing } from 'react-native-reanimated';

interface GradientBackgroundProps {
  children: React.ReactNode;
  className?: string;
  mode?: 'blobs' | 'shift'; // 'blobs' = current animated circles, 'shift' = color shifting gradient
  shiftIntervalMs?: number; // time between shifts
}

export function GradientBackground({ children, className = '', mode = 'shift', shiftIntervalMs = 9000 }: GradientBackgroundProps) {
  if (mode === 'shift') {
    return <ColorShiftBackground className={className} interval={shiftIntervalMs}>{children}</ColorShiftBackground>;
  }
  return (
    <View style={{ flex: 1, backgroundColor: '#000' }} className={className}>
      {/* Layered radial gradient blobs for neon glow */}
      <View pointerEvents="none" style={{ ...StyleSheet.absoluteFillObject }}>
        {/* Static base gradient blobs */}
        <LinearGradient
          colors={['rgba(52,211,153,0.16)','rgba(0,0,0,0)']}
          style={{ position:'absolute', width:480, height:480, top:-160, left:-140, borderRadius:480 }}
        />
        <LinearGradient
          colors={['rgba(167,139,250,0.18)','rgba(0,0,0,0)']}
          style={{ position:'absolute', width:400, height:400, bottom:-140, right:-120, borderRadius:400 }}
        />
        {/* Animated floating blobs (purely visual, low opacity) */}
        <AnimatedBlob size={520} color="rgba(251,113,133,0.12)" initial={{ x:-260, y:260 }} drift={{ x: -180, y: 220 }} duration={16000} />
        <AnimatedBlob size={360} color="rgba(34,211,238,0.10)" initial={{ x:180, y:120 }} drift={{ x: 140, y: 190 }} duration={14000} delay={1500} />
        <AnimatedBlob size={300} color="rgba(167,139,250,0.12)" initial={{ x:-100, y:120 }} drift={{ x: -60, y: 80 }} duration={12000} delay={900} />
        <AnimatedBlob size={260} color="rgba(52,211,153,0.14)" initial={{ x:80, y:340 }} drift={{ x: 120, y: 380 }} duration={18000} delay={400} />
      </View>
      {/* Subtle grain overlay */}
      <View pointerEvents="none" style={{ ...StyleSheet.absoluteFillObject, opacity:0.15 }}>
        <LinearGradient colors={['rgba(255,255,255,0.02)','rgba(0,0,0,0.02)']} style={{ flex:1 }} />
      </View>
      <View style={{ flex:1 }}>{children}</View>
    </View>
  );
}

interface AnimatedBlobProps {
  size: number;
  color: string;
  initial: { x: number; y: number };
  drift: { x: number; y: number };
  duration: number;
  delay?: number;
}

const AnimatedBlob = ({ size, color, initial, drift, duration, delay=0 }: AnimatedBlobProps) => {
  return (
    <MotiView
      from={{ translateX: initial.x, translateY: initial.y, opacity: 0.45, scale: 0.9 }}
      animate={{ translateX: drift.x, translateY: drift.y, opacity: 0.7, scale: 1.05 }}
      transition={{ type:'timing', duration, delay, loop: true, repeatReverse: true, easing: Easing.out(Easing.quad) }}
      style={{ position:'absolute', width: size, height: size, borderRadius: size, backgroundColor: color }}
    />
  );
};

// -------- Color shifting gradient mode --------
// (imports consolidated at top)

interface ColorShiftBackgroundProps {
  children: React.ReactNode;
  className?: string;
  interval: number;
}

// Base dark-blue gradient stops (serve as anchor points for continuous hue modulation)
const baseStops = ['#040b1a', '#071d35', '#0a2e4f', '#040b1a'] as const;

function ColorShiftBackground({ children, className, interval }: ColorShiftBackgroundProps) {
  // Continuous hue/saturation modulation around base stops (no discrete jumps)
  const [colors, setColors] = useState<string[]>([...baseStops]);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  // Helpers: hex <-> hsl
  const hexToHsl = (hex: string) => {
    const h = hex.replace('#','');
    const r = parseInt(h.substring(0,2),16) / 255;
    const g = parseInt(h.substring(2,4),16) / 255;
    const b = parseInt(h.substring(4,6),16) / 255;
    const max = Math.max(r,g,b), min = Math.min(r,g,b);
    let H = 0, S = 0, L = (max + min)/2;
    const d = max - min;
    if (d !== 0) {
      S = L > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch(max){
        case r: H = (g - b) / d + (g < b ? 6 : 0); break;
        case g: H = (b - r) / d + 2; break;
        case b: H = (r - g) / d + 4; break;
      }
      H /= 6;
    }
    return { h: H * 360, s: S, l: L };
  };
  const hslToHex = ({h,s,l}:{h:number;s:number;l:number}) => {
    h = (h % 360 + 360) % 360;
    const c = (1 - Math.abs(2*l -1)) * s;
    const x = c * (1 - Math.abs(((h/60)%2) -1));
    const m = l - c/2;
    let r=0,g=0,b=0;
    if (h < 60){ r=c; g=x; }
    else if (h < 120){ r=x; g=c; }
    else if (h < 180){ g=c; b=x; }
    else if (h < 240){ g=x; b=c; }
    else if (h < 300){ r=x; b=c; }
    else { r=c; b=x; }
    const toHex = (v:number)=> Math.round((v+m)*255).toString(16).padStart(2,'0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  const baseHSL = useRef(baseStops.map(hexToHsl));

  useEffect(() => {
    const duration = interval; // full oscillation
    const amplitudeHue = 10; // degrees swing
    const amplitudeSat = 0.04; // subtle saturation variation
    const amplitudeLight = 0.02; // subtle lightness variation
    const animate = (ts: number) => {
      if (startRef.current == null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const phase = (elapsed % duration) / duration; // 0..1
      // Use two sine waves with phase offsets per stop for organic motion
      const newColors = baseHSL.current.map((b,i) => {
        const localPhase = phase + i * 0.17; // stagger
        const hue = b.h + Math.sin(localPhase * Math.PI * 2) * amplitudeHue;
        const sat = b.s + Math.sin((localPhase + 0.33) * Math.PI * 2) * amplitudeSat;
        const light = b.l + Math.sin((localPhase + 0.66) * Math.PI * 2) * amplitudeLight;
        return hslToHex({ h: hue, s: Math.min(1, Math.max(0, sat)), l: Math.min(1, Math.max(0, light)) });
      });
      setColors(newColors);
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [interval]);

  return (
    <View style={{ flex:1, backgroundColor:'#000' }} className={className}>
      <View style={{ ...StyleSheet.absoluteFillObject }} pointerEvents="none">
        <LinearGradient
          colors={colors as [string,string,string,string]}
          start={{ x:0, y:0 }}
          end={{ x:1, y:1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>
      <View pointerEvents="none" style={{ ...StyleSheet.absoluteFillObject, opacity:0.04 }}>
        <LinearGradient colors={['rgba(255,255,255,0.035)','rgba(0,0,0,0.035)']} style={{ flex:1 }} />
      </View>
      <View style={{ flex:1 }}>{children}</View>
    </View>
  );
}