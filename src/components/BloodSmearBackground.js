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
  pltMorphologies = null,
  edgeProximity = 0, // 0 = center of slide, 1 = feathered edge (more WBCs)
  showShadows = false, // Performance-dependent cell shadows
  slideOffset = null, // { x: 0-1, y: 0-1 } for continuous scrolling transform
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
    // At feathered edge, RBCs thin out dramatically and disappear at the very edge
    // edgeProximity 0-0.7: full RBCs, 0.7-0.9: gradual reduction, 0.9-1.0: severe reduction
    const rbcEdgeFalloff = edgeProximity < 0.7 ? 1.0 :
      edgeProximity < 0.9 ? 1.0 - ((edgeProximity - 0.7) / 0.2) * 0.6 : // 100% to 40%
      Math.max(0.05, 0.4 - ((edgeProximity - 0.9) / 0.1) * 0.35); // 40% to 5%
    const numRBCs = Math.floor((500 + Math.floor(Math.random() * 100)) * scale * rbcCountFactor * rbcEdgeFalloff);

    // Hard cutoff Y position - cells cannot appear above this at extreme edge
    // Moving cells should be BELOW the stationary cutoff line (which is at 2-10%)
    const MOVING_CUTOFF_EARLY = edgeProximity > 0.95 ? 14 : edgeProximity > 0.92 ? 12 : 0;

    // Helper to get Y position with cutoff enforcement
    const getYWithCutoff = () => {
      const y = Math.random() * 100;
      return edgeProximity > 0.92 ? Math.max(MOVING_CUTOFF_EARLY, y) : y;
    };

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
        size = rbcMeanSize * 1.1; // Slightly larger so fragment shape is visible
      } else if (morphType === 'teardrop') {
        size = rbcMeanSize * 1.0;
      } else if (morphType === 'rouleaux') {
        size = rbcMeanSize * 1.2; // Larger base size for visible stacks
      } else if (morphType === 'burr-cell') {
        size = rbcMeanSize * 1.3; // Larger so spicules are visible
      } else if (morphType === 'acanthocyte') {
        size = rbcMeanSize * 1.3; // Larger so irregular spicules are visible
      } else if (morphType === 'bite-cell') {
        size = rbcMeanSize * 1.1; // Slightly larger so bite is visible
      }

      // Random rotation for all cells (different orientations)
      const rotation = Math.floor(Math.random() * 360);
      // Random stack size for rouleaux (3-5 cells for compact stacks)
      const stackSize = morphType === 'rouleaux' ? 3 + Math.floor(Math.random() * 3) : 0;

      cellArray.push({
        id: i,
        type: morphType,
        x: Math.random() * 100,
        y: getYWithCutoff(), // Enforce cutoff at extreme edge
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
        y: getYWithCutoff(), // Enforce cutoff at extreme edge
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
    // Platelets thin out at edge even faster than RBCs (small cells get pushed out)
    const pltRatio = pltPerUL / 5000000; // e.g., 250000/5000000 = 0.05
    const pltEdgeFalloff = edgeProximity < 0.6 ? 1.0 :
      edgeProximity < 0.85 ? 1.0 - ((edgeProximity - 0.6) / 0.25) * 0.7 : // 100% to 30%
      Math.max(0, 0.3 - ((edgeProximity - 0.85) / 0.15) * 0.3); // 30% to 0%
    const numPlatelets = Math.max(0, Math.round(numRBCs * pltRatio * pltEdgeFalloff));

    // Platelet morphology percentages (default to normal if not provided)
    const pltMorph = pltMorphologies || { giantPlatelet: 0, plateletClump: 0, hypogranular: 0 };
    const giantPct = pltMorph.giantPlatelet || 0;
    const clumpPct = pltMorph.plateletClump || 0;
    const hypoPct = pltMorph.hypogranular || 0;

    for (let i = 0; i < numPlatelets; i++) {
      const roll = Math.random() * 100;
      let pltType = 'platelet'; // normal
      let size = RBC_BASE_SIZE * 0.25 + wideGaussian() * (RBC_BASE_SIZE * 0.15);

      if (roll < giantPct) {
        // Giant platelet - approaches RBC size
        pltType = 'giant-platelet';
        size = RBC_BASE_SIZE * 0.6 + wideGaussian() * (RBC_BASE_SIZE * 0.2);
      } else if (roll < giantPct + clumpPct) {
        // Platelet clump - larger mass
        pltType = 'platelet-clump';
        size = RBC_BASE_SIZE * 0.8 + wideGaussian() * (RBC_BASE_SIZE * 0.3);
      } else if (roll < giantPct + clumpPct + hypoPct) {
        // Hypogranular - same size, different appearance
        pltType = 'hypogranular-plt';
      }

      cellArray.push({
        id: numRBCs + i,
        type: pltType,
        x: Math.random() * 100,
        y: getYWithCutoff(), // Enforce cutoff at extreme edge
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

    // =================================================================
    // FEATHERED EDGE EFFECT - WBCs accumulate at the edge of the smear
    // =================================================================
    // During smear preparation, larger cells get pushed to the feathered edge
    // edgeProximity: 0 = center (normal distribution), 1 = feathered edge (WBC accumulation)
    // At the edge: WBC count increases dramatically, larger cells concentrate more
    // Use exponential growth at high edgeProximity for realistic dense band effect
    const baseEdgeMultiplier = 1 + (edgeProximity * 4); // 1x at center, 5x at 1.0
    // Super-dense band at the very edge (>0.85) - exponential increase for massive WBC pile-up
    const superDenseBand = edgeProximity > 0.85
      ? Math.pow((edgeProximity - 0.85) / 0.15, 1.5) * 8 // 0 at 0.85, up to 8x more at 1.0
      : 0;
    // Extreme edge (>0.95) - the cutoff zone with maximum WBC density
    const extremeEdge = edgeProximity > 0.95
      ? Math.pow((edgeProximity - 0.95) / 0.05, 1.2) * 6 // Extra boost at very edge
      : 0;
    const edgeWbcMultiplier = baseEdgeMultiplier + superDenseBand + extremeEdge; // Up to ~19x at very edge

    // Size-based edge weights (larger cells accumulate more at edge)
    // Monocytes are largest, then neutrophils/blasts, then lymphocytes
    const getEdgeWeight = (cellType) => {
      if (edgeProximity === 0) return 1;
      const sizeWeights = {
        monocyte: 2.5,      // Largest WBC, most affected at edge
        'auer-rod': 2.3,    // Promyelocytes are large
        blast: 2.3,         // Blasts are large
        myelocyte: 2.0,     // Large immature cells
        metamyelocyte: 1.8, // Medium-large
        neutrophil: 1.6,    // Medium-large granulocyte
        eosinophil: 1.6,    // Similar to neutrophil
        basophil: 1.4,      // Slightly smaller
        lymphocyte: 1.0,    // Smallest, least affected
      };
      const baseWeight = sizeWeights[cellType] || 1.0;
      return 1 + (baseWeight - 1) * edgeProximity * (1 + superDenseBand * 0.4 + extremeEdge * 0.3);
    };

    // =================================================================
    // CLUMPING AND POSITIONING AT FEATHERED EDGE
    // =================================================================
    // At the feathered edge, WBCs cluster together and concentrate at the top
    // Generate clump centers for cells to gather around - more clumps at extreme edge
    const numClumps = edgeProximity > 0.5
      ? Math.floor(3 + edgeProximity * 8 + (extremeEdge > 0 ? 5 : 0))
      : 0;
    const clumpCenters = [];
    for (let i = 0; i < numClumps; i++) {
      // At extreme edge, clumps concentrate in a tight band at the very top
      const maxY = edgeProximity > 0.95
        ? 8  // Very tight band at extreme edge
        : edgeProximity > 0.85
          ? 15 // Tight band at super-dense zone
          : 30 - edgeProximity * 20;
      clumpCenters.push({
        x: 5 + Math.random() * 90, // Spread across width
        y: Math.random() * maxY, // Concentrate toward top at edge
      });
    }

    // Helper to get Y position biased toward top at feathered edge
    const getEdgeBiasedY = () => {
      if (edgeProximity < 0.3) return Math.random() * 100; // Normal distribution
      // At edge, bias toward top of screen (low Y values)
      // Use beta-like distribution favoring top
      const bias = edgeProximity > 0.95
        ? 2.5 // Extreme bias at cutoff
        : edgeProximity > 0.85
          ? 1.5 // Strong bias at super-dense
          : edgeProximity * 0.8;
      const raw = Math.random();
      // Power function biases toward 0 (top)
      return Math.pow(raw, 1 + bias * 2) * 100;
    };

    // =================================================================
    // HARD CUTOFF LINE - The edge of the smear
    // =================================================================
    // At the very edge, there's a visible cutoff where cells stop
    // Above this line is empty (white/slide background)
    // The cutoff line has stationary clumped WBCs forming a discontinuous border
    const CUTOFF_Y = 2; // Nothing above this Y percentage (empty space)
    const CUTOFF_BAND_Y = 10; // The band where stationary cutoff clumps appear (2-10% Y)
    const MOVING_CELL_CUTOFF = 12; // Moving cells must be below this (clear separation)

    // Helper to position cell near a clump (if clumps exist)
    const getClumpedPosition = (respectCutoff = true) => {
      // At extreme edge, almost all cells should be clumped
      const clumpChance = edgeProximity > 0.95
        ? 0.95 // 95% clumped at extreme edge
        : edgeProximity > 0.85
          ? 0.85 // 85% clumped at super-dense
          : edgeProximity * 0.7;

      let pos;
      if (clumpCenters.length === 0 || Math.random() > clumpChance) {
        // Not clumped - use edge-biased random position
        pos = { x: Math.random() * 100, y: getEdgeBiasedY() };
      } else {
        // Pick a random clump center and offset slightly
        const clump = clumpCenters[Math.floor(Math.random() * clumpCenters.length)];
        // Tighter clumps at edge, very tight at extreme edge
        const spread = edgeProximity > 0.95
          ? 2 // Very tight clumps
          : edgeProximity > 0.85
            ? 4 // Tight clumps
            : 8 - edgeProximity * 4;
        pos = {
          x: Math.max(0, Math.min(100, clump.x + (Math.random() - 0.5) * spread * 2)),
          y: Math.max(0, Math.min(100, clump.y + (Math.random() - 0.5) * spread * 2)),
        };
      }

      // At extreme edge, enforce the hard cutoff - moving cells stay below the stationary line
      if (respectCutoff && edgeProximity > 0.92) {
        pos.y = Math.max(MOVING_CELL_CUTOFF, pos.y); // Push cells well below the cutoff band
      }

      return pos;
    };

    // =================================================================
    // CUTOFF LINE CELLS - Stationary clumps at the boundary
    // =================================================================
    // Generate stationary WBC clumps at the cutoff line when at extreme edge
    if (edgeProximity > 0.92) {
      // Number of clump groups along the cutoff line (discontinuous)
      const numCutoffClumps = Math.floor(6 + (edgeProximity - 0.92) / 0.08 * 10); // 6-16 clumps

      // Generate discontinuous clump positions along the cutoff line
      const cutoffClumpPositions = [];
      for (let i = 0; i < numCutoffClumps; i++) {
        // Random X positions with some clustering
        const baseX = (i / numCutoffClumps) * 100 + (Math.random() - 0.5) * 15;
        if (Math.random() < 0.7) { // 70% chance to have a clump at this position
          cutoffClumpPositions.push({
            x: Math.max(2, Math.min(98, baseX)),
            y: CUTOFF_Y + Math.random() * (CUTOFF_BAND_Y - CUTOFF_Y), // In the cutoff band
          });
        }
      }

      // Generate stationary cells at each cutoff clump
      // Use actual WBC differential and morphology settings for realistic case representation
      let cutoffCellId = 900000; // High ID to avoid conflicts

      // Get differential and morphology settings (same as used for main WBC generation)
      const cutoffDiff = wbcDifferential || {
        neutrophil: 60, lymphocyte: 30, monocyte: 5, eosinophil: 3, basophil: 2,
      };
      const cutoffMorphs = wbcMorphologies || {};

      // Build weighted cell type array based on differential and morphologies
      // Large cells are weighted MORE heavily at the cutoff (they accumulate there)
      const getCutoffCellType = () => {
        const roll = Math.random() * 100;
        let cumulative = 0;

        // Check for blasts first (large, accumulate heavily at edge)
        const blastPct = (cutoffMorphs.blast || 0) * 2.5; // 2.5x weight at edge
        if ((cumulative += blastPct) > roll) {
          return { type: 'blast', size: RBC_BASE_SIZE * 1.8 };
        }

        // Promyelocytes with Auer rods (large, accumulate at edge)
        const auerPct = (cutoffMorphs.auerRod || 0) * 2.5;
        if ((cumulative += auerPct) > roll) {
          return { type: 'auer-rod', size: RBC_BASE_SIZE * 2.0 };
        }

        // Myelocytes (large immature cells)
        const myeloPct = (cutoffMorphs.myelocyte || 0) * 2.0;
        if ((cumulative += myeloPct) > roll) {
          return { type: 'myelocyte', size: RBC_BASE_SIZE * 1.7 };
        }

        // Metamyelocytes
        const metaPct = (cutoffMorphs.metamyelocyte || 0) * 1.8;
        if ((cumulative += metaPct) > roll) {
          return { type: 'metamyelocyte', size: RBC_BASE_SIZE * 1.5 };
        }

        // Monocytes (largest WBC, most affected by edge)
        const monoPct = (cutoffDiff.monocyte || 5) * 2.0;
        if ((cumulative += monoPct) > roll) {
          return { type: 'monocyte', size: RBC_BASE_SIZE * 2.2 };
        }

        // Neutrophils (check for band forms too)
        const neutPct = (cutoffDiff.neutrophil || 60) * 1.3;
        if ((cumulative += neutPct) > roll) {
          const bandPct = cutoffMorphs.bandNeutrophil || 0;
          if (Math.random() * 100 < bandPct) {
            return { type: 'band-neutrophil', size: RBC_BASE_SIZE * 1.55 };
          }
          return { type: Math.random() < 0.5 ? 'neutrophil' : 'neutrophil-3lobe', size: RBC_BASE_SIZE * 1.6 };
        }

        // Eosinophils
        const eosPct = (cutoffDiff.eosinophil || 3) * 1.3;
        if ((cumulative += eosPct) > roll) {
          return { type: Math.random() < 0.5 ? 'eosinophil' : 'eosinophil-3lobe', size: RBC_BASE_SIZE * 1.7 };
        }

        // Basophils
        const basoPct = (cutoffDiff.basophil || 2) * 1.2;
        if ((cumulative += basoPct) > roll) {
          return { type: 'basophil', size: RBC_BASE_SIZE * 1.4 };
        }

        // Lymphocytes (smallest, less likely at edge but still present)
        const lymphPct = (cutoffDiff.lymphocyte || 30) * 0.5; // Reduced weight
        if ((cumulative += lymphPct) > roll) {
          // Check for atypical lymphs or smudge cells
          if (Math.random() * 100 < (cutoffMorphs.atypicalLymph || 0)) {
            return { type: 'atypical-lymph', size: RBC_BASE_SIZE * 1.5 };
          }
          if (Math.random() * 100 < (cutoffMorphs.smudgeCell || 0)) {
            return { type: 'smudge-cell', size: RBC_BASE_SIZE * 1.3 };
          }
          return { type: 'lymphocyte', size: RBC_BASE_SIZE * 1.1 };
        }

        // Default to neutrophil
        return { type: 'neutrophil', size: RBC_BASE_SIZE * 1.6 };
      };

      cutoffClumpPositions.forEach((clumpPos) => {
        // Each clump has 4-10 cells
        const clumpSize = 4 + Math.floor(Math.random() * 7);
        for (let j = 0; j < clumpSize; j++) {
          const { type: cellType, size: baseSize } = getCutoffCellType();

          // Position within the clump (very tight)
          const cellX = clumpPos.x + (Math.random() - 0.5) * 3;
          const cellY = clumpPos.y + (Math.random() - 0.5) * 2;

          cellArray.push({
            id: cutoffCellId++,
            type: cellType,
            x: Math.max(0, Math.min(100, cellX)),
            y: Math.max(CUTOFF_Y, Math.min(CUTOFF_BAND_Y, cellY)),
            size: baseSize + wideGaussian() * (RBC_BASE_SIZE * 0.3),
            duration: 0, // No movement - stationary!
            delay: 0,
            opacity: 0.45 + Math.random() * 0.15, // More visible
            isStationary: true, // Flag for CSS
          });
        }
      });
    }

    const baseWBCs = Math.max(1, Math.round(numRBCs * wbcRatio));
    const totalWBCs = Math.round(baseWBCs * edgeWbcMultiplier);

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

    // Calculate number of blasts and Auer rod cells (promyelocytes) to add
    // Ensure at least 1 cell when morphology percentage is set (for visibility)
    const blastPct = wbcMorphs.blast || 0;
    const numBlasts = blastPct > 0
      ? Math.max(1, Math.round(totalWBCs * blastPct / 100 * getEdgeWeight('blast')))
      : 0;
    const auerRodPct = wbcMorphs.auerRod || 0;
    const numAuerRods = auerRodPct > 0
      ? Math.max(1, Math.round(totalWBCs * auerRodPct / 100 * getEdgeWeight('auer-rod')))
      : 0;

    // Add blasts
    for (let i = 0; i < numBlasts; i++) {
      const size = RBC_BASE_SIZE * 1.8 + wideGaussian() * (RBC_BASE_SIZE * 0.4);
      const pos = getClumpedPosition();
      cellArray.push({
        id: cellId++,
        type: 'blast',
        x: pos.x,
        y: pos.y,
        size: size,
        duration: 25 + Math.random() * 35,
        delay: Math.random() * -30,
        opacity: 0.35 + Math.random() * 0.1,
      });
    }

    // Add Auer rod cells (promyelocytes)
    for (let i = 0; i < numAuerRods; i++) {
      const size = RBC_BASE_SIZE * 2.0 + wideGaussian() * (RBC_BASE_SIZE * 0.4);
      const pos = getClumpedPosition();
      cellArray.push({
        id: cellId++,
        type: 'auer-rod',
        x: pos.x,
        y: pos.y,
        size: size,
        duration: 25 + Math.random() * 35,
        delay: Math.random() * -30,
        opacity: 0.35 + Math.random() * 0.1,
      });
    }

    // Add myelocytes - intermediate between blast and metamyelocyte
    // Size: ~18-20µm, slightly smaller than promyelocyte
    const myelocytePct = wbcMorphs.myelocyte || 0;
    const numMyelocytes = myelocytePct > 0
      ? Math.max(1, Math.round(totalWBCs * myelocytePct / 100 * getEdgeWeight('myelocyte')))
      : 0;
    for (let i = 0; i < numMyelocytes; i++) {
      const size = RBC_BASE_SIZE * 1.7 + wideGaussian() * (RBC_BASE_SIZE * 0.35);
      const pos = getClumpedPosition();
      cellArray.push({
        id: cellId++,
        type: 'myelocyte',
        x: pos.x,
        y: pos.y,
        size: size,
        duration: 25 + Math.random() * 35,
        delay: Math.random() * -30,
        opacity: 0.33 + Math.random() * 0.1,
      });
    }

    // Add metamyelocytes - kidney-shaped nucleus, nearly mature
    // Size: ~15-18µm, smaller than myelocyte
    const metamyelocytePct = wbcMorphs.metamyelocyte || 0;
    const numMetamyelocytes = metamyelocytePct > 0
      ? Math.max(1, Math.round(totalWBCs * metamyelocytePct / 100 * getEdgeWeight('metamyelocyte')))
      : 0;
    for (let i = 0; i < numMetamyelocytes; i++) {
      const size = RBC_BASE_SIZE * 1.5 + wideGaussian() * (RBC_BASE_SIZE * 0.3);
      const pos = getClumpedPosition();
      cellArray.push({
        id: cellId++,
        type: 'metamyelocyte',
        x: pos.x,
        y: pos.y,
        size: size,
        duration: 25 + Math.random() * 35,
        delay: Math.random() * -30,
        opacity: 0.32 + Math.random() * 0.1,
      });
    }

    // Neutrophils: segmented nucleus, most common granulocyte
    // Size: 13.5 µm (12-15) → ratio 1.8 → 20-27 px
    const numNeutrophils = Math.round(totalWBCs * normalize(diff.neutrophil) * getEdgeWeight('neutrophil'));
    for (let i = 0; i < numNeutrophils; i++) {
      const neutType = getNeutrophilType();
      let size = RBC_BASE_SIZE * 1.55 + wideGaussian() * (RBC_BASE_SIZE * 0.5);

      // Hypersegmented neutrophils are larger
      if (neutType === 'hypersegmented') {
        size = RBC_BASE_SIZE * 1.8 + wideGaussian() * (RBC_BASE_SIZE * 0.4);
      }

      const pos = getClumpedPosition();
      cellArray.push({
        id: cellId++,
        type: neutType,
        x: pos.x,
        y: pos.y,
        size: size,
        duration: 25 + Math.random() * 35,
        delay: Math.random() * -30,
        opacity: 0.27 + Math.random() * 0.15,
      });
    }

    // Lymphocytes: round nucleus, adaptive immunity (T cells, B cells, NK cells)
    // Size: 9 µm (7-12) → ratio 1.2 (highly variable - small vs large lymphs)
    const numLymphocytes = Math.round(totalWBCs * normalize(diff.lymphocyte) * getEdgeWeight('lymphocyte'));
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

      const pos = getClumpedPosition();
      cellArray.push({
        id: cellId++,
        type: lymphType,
        x: pos.x,
        y: pos.y,
        size: size,
        duration: 25 + Math.random() * 35,
        delay: Math.random() * -30,
        opacity: lymphType === 'smudge-cell' ? 0.2 : 0.3 + Math.random() * 0.15,
      });
    }

    // Monocytes: largest WBC, kidney-shaped nucleus, become macrophages
    // Size: 17.5 µm (15-20) → ratio 2.3 → 27-35 px
    // Monocytes accumulate most at the feathered edge due to their large size
    const numMonocytes = Math.round(totalWBCs * normalize(diff.monocyte) * getEdgeWeight('monocyte'));
    for (let i = 0; i < numMonocytes; i++) {
      const size = RBC_BASE_SIZE * 2.0 + wideGaussian() * (RBC_BASE_SIZE * 0.6);
      const pos = getClumpedPosition();
      cellArray.push({
        id: cellId++,
        type: 'monocyte',
        x: pos.x,
        y: pos.y,
        size: size,
        duration: 25 + Math.random() * 35,
        delay: Math.random() * -30,
        opacity: 0.27 + Math.random() * 0.15,
      });
    }

    // Eosinophils: bilobed nucleus, orange granules, parasites/allergies
    // Size: 14.5 µm (12-17) → ratio 1.9 → 21-30 px
    const numEosinophils = Math.round(totalWBCs * normalize(diff.eosinophil) * getEdgeWeight('eosinophil'));
    for (let i = 0; i < numEosinophils; i++) {
      const size = RBC_BASE_SIZE * 1.6 + wideGaussian() * (RBC_BASE_SIZE * 0.6);
      const pos = getClumpedPosition();
      cellArray.push({
        id: cellId++,
        type: Math.random() < 0.5 ? 'eosinophil' : 'eosinophil-3lobe',
        x: pos.x,
        y: pos.y,
        size: size,
        duration: 25 + Math.random() * 35,
        delay: Math.random() * -30,
        opacity: 0.33 + Math.random() * 0.15,
      });
    }

    // Basophils: rarest WBC, dark purple granules, histamine release
    // Size: 12 µm (10-14) → ratio 1.6 → 18-25 px
    const numBasophils = Math.round(totalWBCs * normalize(diff.basophil) * getEdgeWeight('basophil'));
    for (let i = 0; i < numBasophils; i++) {
      const size = RBC_BASE_SIZE * 1.4 + wideGaussian() * (RBC_BASE_SIZE * 0.5);
      const pos = getClumpedPosition();
      cellArray.push({
        id: cellId++,
        type: 'basophil',
        x: pos.x,
        y: pos.y,
        size: size,
        duration: 25 + Math.random() * 35,
        delay: Math.random() * -30,
        opacity: 0.33 + Math.random() * 0.15,
      });
    }

    return cellArray;
  }, [effectiveDensity, scaleOverride, rbcPerUL, mcv, rdw, nrbcPer100RBC, wbcPerUL, wbcDifferential, pltPerUL, rbcMorphologies, wbcMorphologies, pltMorphologies, edgeProximity]);

  // Calculate transform for continuous scrolling effect
  // Shift cells based on slideOffset to create parallax-like movement
  const scrollTransform = slideOffset
    ? `translate(${(slideOffset.x - 0.5) * -30}%, ${(slideOffset.y) * -25}%)`
    : 'none';

  return (
    <div
      className={`blood-smear-background${isMobile ? ' blood-smear-mobile' : ''}${showShadows ? ' with-shadows' : ''}`}
      style={{
        transform: scrollTransform,
        // Make container slightly larger to allow transform without gaps
        width: slideOffset ? '130%' : '100%',
        height: slideOffset ? '130%' : '100%',
        marginLeft: slideOffset ? '-15%' : '0',
        marginTop: slideOffset ? '-5%' : '0',
      }}
    >
      {cells.map((cell) => (
        <div
          key={cell.id}
          className={`floating-cell ${cell.type}${cell.isStationary ? ' stationary' : ''}`}
          style={{
            left: `${cell.x}%`,
            top: `${cell.y}%`,
            width: `${cell.size}px`,
            height: `${cell.size}px`,
            opacity: cell.opacity,
            animationDuration: cell.isStationary ? '0s' : `${cell.duration}s`,
            animationDelay: cell.isStationary ? '0s' : `${cell.delay}s`,
            zIndex: cell.isStationary ? 10 : (cell.zIndex || 1), // Stationary cells on top
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
