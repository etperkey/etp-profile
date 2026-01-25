import React, { useMemo } from 'react';

// Blood Smear Background Component
// Realistic blood smear animation with RBCs, WBCs, and platelets
function BloodSmearBackground() {
  const cells = useMemo(() => {
    const cellArray = [];
    // Generate 1200-1500 RBCs for dense smear (~7μm, smaller)
    // Slight size variation (anisocytosis) and occasional overlapping
    const numRBCs = 1200 + Math.floor(Math.random() * 300);
    for (let i = 0; i < numRBCs; i++) {
      const size = 11 + Math.random() * 3; // Subtle size variation (~80% range)
      cellArray.push({
        id: i,
        type: 'rbc',
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: size,
        duration: 35 + Math.random() * 25, // Slower for small cells (parallax)
        delay: Math.random() * -30,
        opacity: 0.15 + Math.random() * 0.1,
        zIndex: Math.random() < 0.15 ? 2 : 1, // 15% overlap others
      });
    }

    // Platelets (100-150) - tiny purple fragments, ~10-20 per RBC in real smear
    const numPlatelets = 100 + Math.floor(Math.random() * 50);
    for (let i = 0; i < numPlatelets; i++) {
      cellArray.push({
        id: numRBCs + i,
        type: 'platelet',
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 4 + Math.random() * 4, // Very small
        duration: 45 + Math.random() * 30, // Slowest (smallest = parallax)
        delay: Math.random() * -30,
        opacity: 0.25 + Math.random() * 0.15,
        zIndex: 0,
      });
    }

    // WBCs with realistic differential (~60% neutrophils, ~30% lymphocytes, ~10% monocytes)
    let cellId = numRBCs + numPlatelets;

    // Neutrophils (16-24) - segmented nucleus, ~12-15μm (2x RBC)
    // 50% have 2 lobes, 50% have 3 lobes
    const numNeutrophils = 16 + Math.floor(Math.random() * 9);
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

    // Lymphocytes (8-12) - large round nucleus, ~8-12μm (1.5x RBC), ~25-30% of WBCs
    const numLymphocytes = 8 + Math.floor(Math.random() * 5);
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

    // Monocytes (1-3) - kidney-shaped nucleus, ~18-22μm (3x RBC, largest WBC), ~5-8% of WBCs
    const numMonocytes = 1 + Math.floor(Math.random() * 3);
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

    // Eosinophils (1-2) - bilobed nucleus, bright red granules, ~12-17μm (rare, 1-4% of WBCs)
    // 50% have 2 lobes, 50% have 3 lobes
    const numEosinophils = 1 + Math.floor(Math.random() * 2);
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

    // Basophils (0-1) - super rare, <1% of WBCs, dark purple granules obscuring nucleus
    const numBasophils = Math.random() < 0.5 ? 0 : 1;
    for (let i = 0; i < numBasophils; i++) {
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
  }, []);

  return (
    <div className="blood-smear-background">
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
