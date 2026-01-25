import React, { useMemo, useState, useEffect } from 'react';

// Hook to detect mobile devices for performance optimization
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => {
    // SSR-safe initial check
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= breakpoint;
  });

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= breakpoint);

    // Use matchMedia for better performance than resize listener
    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint}px)`);

    // Modern API (addEventListener) with fallback (addListener)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', checkMobile);
      return () => mediaQuery.removeEventListener('change', checkMobile);
    } else {
      mediaQuery.addListener(checkMobile);
      return () => mediaQuery.removeListener(checkMobile);
    }
  }, [breakpoint]);

  return isMobile;
}

// Blood Smear Background Component
// Realistic blood smear animation with RBCs, WBCs, and platelets
// density: 'full' (default), 'medium', 'light' - controls cell count for performance
// On mobile, density is automatically reduced for better performance
function BloodSmearBackground({ density = 'full' }) {
  const isMobile = useIsMobile();

  // On mobile, cap density at 'light' for performance
  // full -> light, medium -> light, light -> light
  const effectiveDensity = isMobile ? 'light' : density;

  const cells = useMemo(() => {
    const cellArray = [];

    // Scale factors based on effective density (mobile-aware)
    // light: 0.5 (was 0.25), medium: 0.4, full: 1.0
    const scale = effectiveDensity === 'full' ? 1 : effectiveDensity === 'medium' ? 0.4 : 0.5;

    // Generate RBCs - scaled by density
    const numRBCs = Math.floor((400 + Math.floor(Math.random() * 100)) * scale);
    for (let i = 0; i < numRBCs; i++) {
      const size = 11 + Math.random() * 3;
      cellArray.push({
        id: i,
        type: 'rbc',
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: size,
        duration: 35 + Math.random() * 25,
        delay: Math.random() * -30,
        opacity: 0.15 + Math.random() * 0.1,
        zIndex: Math.random() < 0.15 ? 2 : 1,
      });
    }

    // Platelets - scaled by density
    const numPlatelets = Math.floor((40 + Math.floor(Math.random() * 20)) * scale);
    for (let i = 0; i < numPlatelets; i++) {
      cellArray.push({
        id: numRBCs + i,
        type: 'platelet',
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 4 + Math.random() * 4,
        duration: 45 + Math.random() * 30,
        delay: Math.random() * -30,
        opacity: 0.25 + Math.random() * 0.15,
        zIndex: 0,
      });
    }

    let cellId = numRBCs + numPlatelets;

    // Neutrophils - scaled
    const numNeutrophils = Math.floor((8 + Math.floor(Math.random() * 4)) * scale);
    for (let i = 0; i < numNeutrophils; i++) {
      cellArray.push({
        id: cellId++,
        type: Math.random() < 0.5 ? 'neutrophil' : 'neutrophil-3lobe',
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 32 + Math.random() * 12,
        duration: 25 + Math.random() * 35,
        delay: Math.random() * -30,
        opacity: 0.27 + Math.random() * 0.15,
      });
    }

    // Lymphocytes - scaled
    const numLymphocytes = Math.floor((4 + Math.floor(Math.random() * 3)) * scale);
    for (let i = 0; i < numLymphocytes; i++) {
      cellArray.push({
        id: cellId++,
        type: 'lymphocyte',
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 26 + Math.random() * 10,
        duration: 25 + Math.random() * 35,
        delay: Math.random() * -30,
        opacity: 0.30 + Math.random() * 0.15,
      });
    }

    // Monocytes - scaled (at least 1 if density allows)
    const numMonocytes = Math.max(effectiveDensity === 'light' ? 0 : 1, Math.floor((1 + Math.floor(Math.random() * 2)) * scale));
    for (let i = 0; i < numMonocytes; i++) {
      cellArray.push({
        id: cellId++,
        type: 'monocyte',
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 42 + Math.random() * 14,
        duration: 25 + Math.random() * 35,
        delay: Math.random() * -30,
        opacity: 0.27 + Math.random() * 0.15,
      });
    }

    // Eosinophils - only in full/medium density
    if (effectiveDensity !== 'light') {
      const numEosinophils = Math.floor((1 + Math.floor(Math.random() * 1)) * scale);
      for (let i = 0; i < numEosinophils; i++) {
        cellArray.push({
          id: cellId++,
          type: Math.random() < 0.5 ? 'eosinophil' : 'eosinophil-3lobe',
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: 34 + Math.random() * 12,
          duration: 25 + Math.random() * 35,
          delay: Math.random() * -30,
          opacity: 0.33 + Math.random() * 0.15,
        });
      }
    }

    // Basophils - only in full density
    if (effectiveDensity === 'full' && Math.random() < 0.5) {
      cellArray.push({
        id: cellId++,
        type: 'basophil',
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 32 + Math.random() * 10,
        duration: 25 + Math.random() * 35,
        delay: Math.random() * -30,
        opacity: 0.33 + Math.random() * 0.15,
      });
    }

    return cellArray;
  }, [effectiveDensity]);

  return (
    <div className={`blood-smear-background${isMobile ? ' blood-smear-mobile' : ''}`}>
      {cells.map(cell => (
        <div
          key={cell.id}
          className={`floating-cell ${cell.type}`}
          style={{
            left: `${cell.x}%`,
            top: `${cell.y}%`,
            width: `${cell.size}px`,
            height: `${cell.size}px`,
            opacity: cell.opacity,
            animationDuration: `${cell.duration}s`,
            animationDelay: `${cell.delay}s`,
            zIndex: cell.zIndex || 1,
          }}
        />
      ))}
    </div>
  );
}

export default BloodSmearBackground;
