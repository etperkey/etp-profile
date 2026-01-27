import { useMemo, useState, useEffect } from 'react';

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
// density: 'full' (default), 'medium', 'light', 'ultra', 'max' - controls cell count for performance
// scaleOverride: optional numeric multiplier (overrides density-based scale)
// rbcPerUL: RBC count per microliter (normal: 4.5-5.5M, default 5,000,000)
// mcv: Mean Corpuscular Volume in fL (normal: 80-100, default 90)
//   - <80 fL: Microcytic (IDA, thalassemia)
//   - 80-100 fL: Normocytic
//   - >100 fL: Macrocytic (B12/folate deficiency)
// rdw: Red cell Distribution Width % (normal: 11.5-14.5%, default 13%)
//   - Higher RDW = more anisocytosis (size variation)
// nrbcPer100RBC: Nucleated RBCs per 100 RBCs (normal: 0, default 0)
//   - Present in: severe anemia, hemolysis, marrow stress, myelophthisis
//   - Reported clinically as nRBC/100 WBC, but we use per 100 RBC for simplicity
// wbcPerUL: WBC count per microliter (normal: 5,000-10,000, default 7500)
//   - Used to calculate WBC:RBC ratio (normal RBCs ~5,000,000/µL)
//   - Higher values simulate leukocytosis/leukemia
// wbcDifferential: object with percentages for each WBC type (must sum to 100)
//   - neutrophil, lymphocyte, monocyte, eosinophil, basophil
// On mobile, density is automatically reduced for better performance
function BloodSmearBackground({
  density = 'full',
  scaleOverride = null,
  rbcPerUL = 5000000,
  mcv = 90,
  rdw = 13,
  nrbcPer100RBC = 0,
  wbcPerUL = 7500,
  wbcDifferential = null,
  pltPerUL = 250000,
  rbcMorphologies = null,
  wbcMorphologies = null,
}) {
  const isMobile = useIsMobile();

  // On mobile, cap density at 'light' but allow lower densities through
  // full -> light, medium -> medium, light -> light
  // Skip mobile cap if scaleOverride is provided (viewer mode)
  const densityOrder = { light: 0, medium: 1, full: 2, ultra: 3, max: 4 };
  const effectiveDensity =
    scaleOverride !== null
      ? density
      : isMobile && densityOrder[density] > densityOrder['light']
        ? 'light'
        : density;

  const cells = useMemo(() => {
    const cellArray = [];

    // Scale factors based on effective density (mobile-aware)
    // light: 0.5, medium: 0.4, full: 1.0, ultra: 3.0, max: 5.0
    // Or use scaleOverride if provided
    let scale;
    if (scaleOverride !== null) {
      scale = scaleOverride;
    } else {
      scale =
        effectiveDensity === 'max'
          ? 5
          : effectiveDensity === 'ultra'
            ? 3
            : effectiveDensity === 'full'
              ? 1
              : effectiveDensity === 'medium'
                ? 0.4
                : 0.5;
    }

    // =================================================================
    // BIOLOGICALLY ACCURATE BLOOD CELL RATIOS
    // =================================================================
    // Real blood composition per microliter:
    //   RBCs: ~5,000,000/µL
    //   Platelets: ~150,000-400,000/µL (ratio ~1:15 to RBCs)
    //   WBCs: ~5,000-10,000/µL (ratio ~1:500-1000 to RBCs)
    //
    // WBC Differential (percentage of total WBCs):
    //   Neutrophils: 50-70% (avg 60%)
    //   Lymphocytes: 20-40% (avg 30%)
    //   Monocytes: 2-8% (avg 5%)
    //   Eosinophils: 1-4% (avg 2.5%)
    //   Basophils: <1% (avg 0.5%)
    // =================================================================

    // =================================================================
    // GAUSSIAN-LIKE SIZE DISTRIBUTION
    // =================================================================
    // Using sum of multiple uniforms to approximate normal distribution
    // tightGaussian: CV ~5% for uniform cells (RBCs)
    // wideGaussian: CV ~15% for variable cells (WBCs)
    const tightGaussian = () =>
      (Math.random() + Math.random() + Math.random() + Math.random()) / 4;
    const wideGaussian = () =>
      (Math.random() + Math.random() + Math.random()) / 3;

    // =================================================================
    // BIOLOGICALLY ACCURATE CELL SIZES (relative to RBC baseline)
    // =================================================================
    // Real sizes in µm (RBC = 7.5µm baseline at MCV 90):
    //   RBC: 7.5 µm (6-8) - ratio 1.0, very uniform (CV ~3-4%)
    //   Platelet: 2.5 µm (2-3) - ratio 0.33
    //   Lymphocyte: 9 µm (7-12) - ratio 1.2 (small) to 1.6 (large)
    //   Basophil: 12 µm (10-14) - ratio 1.6
    //   Neutrophil: 13.5 µm (12-15) - ratio 1.8
    //   Eosinophil: 14.5 µm (12-17) - ratio 1.9
    //   Monocyte: 17.5 µm (15-20) - ratio 2.3
    //
    // MCV affects RBC size:
    //   MCV 60 fL (severe microcytic) → ~0.67x normal size
    //   MCV 80 fL (low normal) → ~0.89x normal size
    //   MCV 90 fL (normal) → 1.0x normal size
    //   MCV 100 fL (high normal) → ~1.11x normal size
    //   MCV 120 fL (macrocytic) → ~1.33x normal size
    //
    // RDW affects size variation:
    //   RDW 12% (normal) → tight distribution (CV ~5%)
    //   RDW 18% (high) → wide distribution (CV ~15%)
    //   RDW 25% (very high) → very wide distribution (CV ~25%)
    // =================================================================
    const RBC_BASE_SIZE = 13; // pixels - baseline for MCV 90

    // Scale RBC size based on MCV (90 fL = normal baseline)
    const mcvSizeFactor = mcv / 90;
    const rbcMeanSize = RBC_BASE_SIZE * mcvSizeFactor;

    // Scale RBC variation based on RDW (13% = normal baseline)
    // Normal RDW (12-14%): tight distribution
    // High RDW (>14.5%): anisocytosis - wide size variation
    const rdwVariationFactor = rdw / 13;
    const rbcSizeVariation = 2 * rdwVariationFactor; // Base variation ±2px at normal RDW

    // RBC count based on rbcPerUL (normal ~5M/µL)
    // Use a base visual count scaled by density and relative to normal
    const rbcCountFactor = rbcPerUL / 5000000;
    const numRBCs = Math.floor((500 + Math.floor(Math.random() * 100)) * scale * rbcCountFactor);

    // =================================================================
    // RBC MORPHOLOGY VARIANTS
    // =================================================================
    // Calculate how many of each morphology type to generate based on percentages
    const morphologyTypes = rbcMorphologies || {};
    const getMorphType = () => {
      const roll = Math.random() * 100;
      let cumulative = 0;

      // Check each morphology type
      if ((cumulative += (morphologyTypes.spherocyte || 0)) > roll) return 'spherocyte';
      if ((cumulative += (morphologyTypes.targetCell || 0)) > roll) return 'target-cell';
      if ((cumulative += (morphologyTypes.schistocyte || 0)) > roll) return 'schistocyte';
      if ((cumulative += (morphologyTypes.sickleCell || 0)) > roll) return 'sickle-cell';
      if ((cumulative += (morphologyTypes.teardrop || 0)) > roll) return 'teardrop';
      if ((cumulative += (morphologyTypes.elliptocyte || 0)) > roll) return 'elliptocyte';
      if ((cumulative += (morphologyTypes.biteCell || 0)) > roll) return 'bite-cell';
      if ((cumulative += (morphologyTypes.burrCell || 0)) > roll) return 'burr-cell';
      if ((cumulative += (morphologyTypes.acanthocyte || 0)) > roll) return 'acanthocyte';
      if ((cumulative += (morphologyTypes.stomatocyte || 0)) > roll) return 'stomatocyte';
      if ((cumulative += (morphologyTypes.rouleaux || 0)) > roll) return 'rouleaux';
      if ((cumulative += (morphologyTypes.howellJolly || 0)) > roll) return 'howell-jolly';
      if ((cumulative += (morphologyTypes.basophilicStippling || 0)) > roll) return 'basophilic-stippling';
      if ((cumulative += (morphologyTypes.pappenheimer || 0)) > roll) return 'pappenheimer';
      if ((cumulative += (morphologyTypes.polychromasia || 0)) > roll) return 'polychromasia';

      return 'rbc'; // Normal RBC
    };

    // Generate RBCs with MCV-adjusted size and RDW-adjusted variation
    for (let i = 0; i < numRBCs; i++) {
      // Use tight or wide Gaussian based on RDW
      const sizeVariation = rdw > 15
        ? wideGaussian() * rbcSizeVariation * 2 // High RDW: use wide gaussian
        : tightGaussian() * rbcSizeVariation;   // Normal RDW: use tight gaussian

      let size = rbcMeanSize - rbcSizeVariation / 2 + sizeVariation;
      const morphType = getMorphType();

      // Adjust size based on morphology type
      if (morphType === 'spherocyte') {
        size = rbcMeanSize * 0.8; // Smaller, denser
      } else if (morphType === 'elliptocyte') {
        size = rbcMeanSize * 1.1; // Slightly larger, elongated
      } else if (morphType === 'polychromasia') {
        size = rbcMeanSize * 1.15; // Larger (reticulocytes)
      } else if (morphType === 'schistocyte') {
        size = rbcMeanSize * 0.8; // Fragment, but not too small
      } else if (morphType === 'teardrop') {
        size = rbcMeanSize * 0.9;
      } else if (morphType === 'rouleaux') {
        size = rbcMeanSize * 0.9; // Base size for rouleaux
      }

      // Random rotation for rouleaux stacks (different orientations)
      const rotation = morphType === 'rouleaux' ? Math.floor(Math.random() * 360) : 0;
      // Random stack size for rouleaux (3-8 cells)
      const stackSize = morphType === 'rouleaux' ? 3 + Math.floor(Math.random() * 6) : 0;

      cellArray.push({
        id: i,
        type: morphType,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.max(6, size), // Minimum size for visibility
        duration: 35 + Math.random() * 25,
        delay: Math.random() * -30,
        opacity: morphType === 'polychromasia' ? 0.2 : 0.15 + Math.random() * 0.1,
        zIndex: Math.random() < 0.15 ? 2 : 1,
        rotation: rotation,
        stackSize: stackSize,
      });
    }

    // =================================================================
    // NUCLEATED RBCs (nRBCs) - Immature RBCs with retained nucleus
    // =================================================================
    // Present in: severe anemia, hemolysis, marrow stress, myelophthisis,
    // thalassemia major, erythroleukemia, newborns
    // Size: Slightly larger than mature RBCs (nucleus adds bulk)
    // Appearance: RBC with dark purple central nucleus
    // Stages: Orthochromatic (most mature, small dark nucleus),
    //         Polychromatic (medium), Basophilic (least mature, large nucleus)
    const numNRBCs = Math.round((numRBCs * nrbcPer100RBC) / 100);
    for (let i = 0; i < numNRBCs; i++) {
      // nRBCs are slightly larger than mature RBCs (1.1-1.3x)
      const nrbcSizeFactor = 1.1 + wideGaussian() * 0.2;
      const size = rbcMeanSize * nrbcSizeFactor;

      // Randomly assign maturation stage (affects nucleus size in CSS)
      // Most should be orthochromatic (most mature), fewer polychromatic/basophilic
      const stageRoll = Math.random();
      const stage = stageRoll < 0.6 ? 'ortho' : stageRoll < 0.85 ? 'poly' : 'baso';

      cellArray.push({
        id: `nrbc-${i}`,
        type: `nrbc-${stage}`,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: size,
        duration: 35 + Math.random() * 25,
        delay: Math.random() * -30,
        opacity: 0.25 + Math.random() * 0.1,
        zIndex: 2, // nRBCs should be visible above regular RBCs
      });
    }

    // Platelets: calculate based on pltPerUL relative to RBCs
    // Normal: 150-400K/µL vs RBCs 5M/µL = ratio ~1:15 to 1:33
    // Size: 2.5 µm (2-3) → ratio 0.33 → 3-5 px
    const pltRatio = pltPerUL / 5000000; // e.g., 250000/5000000 = 0.05
    const numPlatelets = Math.max(1, Math.round(numRBCs * pltRatio));
    for (let i = 0; i < numPlatelets; i++) {
      const size = RBC_BASE_SIZE * 0.25 + wideGaussian() * (RBC_BASE_SIZE * 0.15);
      cellArray.push({
        id: numRBCs + i,
        type: 'platelet',
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: size,
        duration: 45 + Math.random() * 30,
        delay: Math.random() * -30,
        opacity: 0.25 + Math.random() * 0.15,
        zIndex: 0,
      });
    }

    let cellId = numRBCs + numPlatelets;

    // =================================================================
    // WBC GENERATION - Biologically accurate differential
    // =================================================================
    // Calculate WBC:RBC ratio based on wbcPerUL parameter
    // Normal values:
    //   RBCs: ~5,000,000/µL
    //   WBCs: 5,000-10,000/µL (normal), up to 100,000+ (leukemia)
    //
    // Examples:
    //   7,500 WBC/µL (normal) → ratio 1:667
    //   20,000 WBC/µL (leukocytosis) → ratio 1:250
    //   50,000 WBC/µL (marked leukocytosis) → ratio 1:100
    //   100,000 WBC/µL (leukemia) → ratio 1:50
    //   500,000 WBC/µL (blast crisis) → ratio 1:10
    const RBC_PER_UL = 5000000;
    const wbcRatio = wbcPerUL / RBC_PER_UL; // e.g., 7500/5000000 = 0.0015
    const totalWBCs = Math.max(1, Math.round(numRBCs * wbcRatio));

    // Calculate each WBC type based on differential percentages
    // Use custom differential if provided, otherwise use randomized biological ranges
    const diff = wbcDifferential || {
      neutrophil: 50 + Math.random() * 20, // 50-70%
      lymphocyte: 20 + Math.random() * 20, // 20-40%
      monocyte: 2 + Math.random() * 6, // 2-8%
      eosinophil: 1 + Math.random() * 3, // 1-4%
      basophil: Math.random() * 1, // 0-1%
    };

    // Normalize percentages to ensure they sum to 100
    const totalPercent =
      diff.neutrophil + diff.lymphocyte + diff.monocyte + diff.eosinophil + diff.basophil;
    const normalize = (val) => val / totalPercent;

    // =================================================================
    // WBC MORPHOLOGY VARIANTS
    // =================================================================
    const wbcMorphs = wbcMorphologies || {};

    // Helper to determine neutrophil variant
    const getNeutrophilType = () => {
      const roll = Math.random() * 100;
      if (roll < (wbcMorphs.bandNeutrophil || 0)) return 'band-neutrophil';
      if (roll < (wbcMorphs.bandNeutrophil || 0) + (wbcMorphs.hypersegmented || 0)) return 'hypersegmented';
      if (roll < (wbcMorphs.bandNeutrophil || 0) + (wbcMorphs.hypersegmented || 0) + (wbcMorphs.toxicGranulation || 0)) return 'toxic-granulation';
      if (roll < (wbcMorphs.bandNeutrophil || 0) + (wbcMorphs.hypersegmented || 0) + (wbcMorphs.toxicGranulation || 0) + (wbcMorphs.dohleBodies || 0)) return 'dohle-bodies';
      return Math.random() < 0.5 ? 'neutrophil' : 'neutrophil-3lobe';
    };

    // Helper to determine lymphocyte variant
    const getLymphocyteType = () => {
      const roll = Math.random() * 100;
      if (roll < (wbcMorphs.atypicalLymph || 0)) return 'atypical-lymph';
      if (roll < (wbcMorphs.atypicalLymph || 0) + (wbcMorphs.smudgeCell || 0)) return 'smudge-cell';
      return 'lymphocyte';
    };

    // Calculate number of blasts and Auer rod cells to add
    const numBlasts = Math.round(totalWBCs * (wbcMorphs.blast || 0) / 100);
    const numAuerRods = Math.round(totalWBCs * (wbcMorphs.auerRod || 0) / 100);

    // Add blasts
    for (let i = 0; i < numBlasts; i++) {
      const size = RBC_BASE_SIZE * 1.8 + wideGaussian() * (RBC_BASE_SIZE * 0.4);
      cellArray.push({
        id: cellId++,
        type: 'blast',
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: size,
        duration: 25 + Math.random() * 35,
        delay: Math.random() * -30,
        opacity: 0.35 + Math.random() * 0.1,
      });
    }

    // Add Auer rod cells (promyelocytes)
    for (let i = 0; i < numAuerRods; i++) {
      const size = RBC_BASE_SIZE * 2.0 + wideGaussian() * (RBC_BASE_SIZE * 0.4);
      cellArray.push({
        id: cellId++,
        type: 'auer-rod',
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: size,
        duration: 25 + Math.random() * 35,
        delay: Math.random() * -30,
        opacity: 0.35 + Math.random() * 0.1,
      });
    }

    // Neutrophils: segmented nucleus, most common granulocyte
    // Size: 13.5 µm (12-15) → ratio 1.8 → 20-27 px
    const numNeutrophils = Math.round(totalWBCs * normalize(diff.neutrophil));
    for (let i = 0; i < numNeutrophils; i++) {
      const neutType = getNeutrophilType();
      let size = RBC_BASE_SIZE * 1.55 + wideGaussian() * (RBC_BASE_SIZE * 0.5);

      // Hypersegmented neutrophils are larger
      if (neutType === 'hypersegmented') {
        size = RBC_BASE_SIZE * 1.8 + wideGaussian() * (RBC_BASE_SIZE * 0.4);
      }

      cellArray.push({
        id: cellId++,
        type: neutType,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: size,
        duration: 25 + Math.random() * 35,
        delay: Math.random() * -30,
        opacity: 0.27 + Math.random() * 0.15,
      });
    }

    // Lymphocytes: round nucleus, adaptive immunity (T cells, B cells, NK cells)
    // Size: 9 µm (7-12) → ratio 1.2 (highly variable - small vs large lymphs)
    const numLymphocytes = Math.round(totalWBCs * normalize(diff.lymphocyte));
    for (let i = 0; i < numLymphocytes; i++) {
      const lymphType = getLymphocyteType();
      // Lymphocytes have wide size range (small vs activated/large)
      let size = RBC_BASE_SIZE * 0.9 + wideGaussian() * (RBC_BASE_SIZE * 0.7);

      // Atypical lymphs are larger
      if (lymphType === 'atypical-lymph') {
        size = RBC_BASE_SIZE * 1.5 + wideGaussian() * (RBC_BASE_SIZE * 0.5);
      } else if (lymphType === 'smudge-cell') {
        size = RBC_BASE_SIZE * 1.3;
      }

      cellArray.push({
        id: cellId++,
        type: lymphType,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: size,
        duration: 25 + Math.random() * 35,
        delay: Math.random() * -30,
        opacity: lymphType === 'smudge-cell' ? 0.2 : 0.3 + Math.random() * 0.15,
      });
    }

    // Monocytes: largest WBC, kidney-shaped nucleus, become macrophages
    // Size: 17.5 µm (15-20) → ratio 2.3 → 27-35 px
    const numMonocytes = Math.round(totalWBCs * normalize(diff.monocyte));
    for (let i = 0; i < numMonocytes; i++) {
      const size = RBC_BASE_SIZE * 2.0 + wideGaussian() * (RBC_BASE_SIZE * 0.6);
      cellArray.push({
        id: cellId++,
        type: 'monocyte',
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: size,
        duration: 25 + Math.random() * 35,
        delay: Math.random() * -30,
        opacity: 0.27 + Math.random() * 0.15,
      });
    }

    // Eosinophils: bilobed nucleus, orange granules, parasites/allergies
    // Size: 14.5 µm (12-17) → ratio 1.9 → 21-30 px
    const numEosinophils = Math.round(totalWBCs * normalize(diff.eosinophil));
    for (let i = 0; i < numEosinophils; i++) {
      const size = RBC_BASE_SIZE * 1.6 + wideGaussian() * (RBC_BASE_SIZE * 0.6);
      cellArray.push({
        id: cellId++,
        type: Math.random() < 0.5 ? 'eosinophil' : 'eosinophil-3lobe',
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: size,
        duration: 25 + Math.random() * 35,
        delay: Math.random() * -30,
        opacity: 0.33 + Math.random() * 0.15,
      });
    }

    // Basophils: rarest WBC, dark purple granules, histamine release
    // Size: 12 µm (10-14) → ratio 1.6 → 18-25 px
    const numBasophils = Math.round(totalWBCs * normalize(diff.basophil));
    for (let i = 0; i < numBasophils; i++) {
      const size = RBC_BASE_SIZE * 1.4 + wideGaussian() * (RBC_BASE_SIZE * 0.5);
      cellArray.push({
        id: cellId++,
        type: 'basophil',
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: size,
        duration: 25 + Math.random() * 35,
        delay: Math.random() * -30,
        opacity: 0.33 + Math.random() * 0.15,
      });
    }

    return cellArray;
  }, [effectiveDensity, scaleOverride, rbcPerUL, mcv, rdw, nrbcPer100RBC, wbcPerUL, wbcDifferential, pltPerUL, rbcMorphologies, wbcMorphologies]);

  return (
    <div className={`blood-smear-background${isMobile ? ' blood-smear-mobile' : ''}`}>
      {cells.map((cell) => (
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
            '--cell-rotation': cell.rotation ? `${cell.rotation}deg` : '0deg',
          }}
        >
          {/* Render individual cells for rouleaux stacks */}
          {cell.type === 'rouleaux' && cell.stackSize > 0 && (
            [...Array(cell.stackSize)].map((_, idx) => (
              <div
                key={idx}
                className="rouleaux-cell"
                style={{
                  '--stack-index': idx,
                  '--stack-size': cell.stackSize,
                }}
              />
            ))
          )}
        </div>
      ))}
    </div>
  );
}

export default BloodSmearBackground;
