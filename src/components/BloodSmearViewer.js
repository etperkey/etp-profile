import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import BloodSmearBackground from './BloodSmearBackground';
import './BloodSmearViewer.css';

// Performance monitoring hook with dynamic adjustment to keep FPS > 20
function usePerformanceMonitor() {
  const [fps, setFps] = useState(60);
  const [performanceLevel, setPerformanceLevel] = useState('detecting');
  const frameTimesRef = useRef([]);
  const lastFrameTimeRef = useRef(performance.now());
  const rafRef = useRef(null);
  const lastLevelChangeRef = useRef(0);

  useEffect(() => {
    let frameCount = 0;
    const targetFrames = 30; // Sample 30 frames before initial decision (faster startup)

    const measureFrame = () => {
      const now = performance.now();
      const delta = now - lastFrameTimeRef.current;
      lastFrameTimeRef.current = now;

      if (delta > 0 && delta < 1000) {
        frameTimesRef.current.push(delta);
        frameCount++;

        // Calculate rolling FPS (use more samples for stability)
        if (frameTimesRef.current.length > 45) {
          frameTimesRef.current.shift();
        }

        const avgFrameTime =
          frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length;
        const currentFps = Math.round(1000 / avgFrameTime);
        setFps(currentFps);

        // Determine performance level - runs after initial detection
        // and continues to monitor for drops below 20 FPS
        const timeSinceLastChange = now - lastLevelChangeRef.current;
        const canChangeLevel = timeSinceLastChange > 2000; // Debounce: wait 2s between changes

        if (frameCount >= targetFrames) {
          let newLevel = performanceLevel;

          if (performanceLevel === 'detecting') {
            // Initial detection - be conservative to avoid stuttering
            if (currentFps >= 50) {
              newLevel = 'high';
            } else if (currentFps >= 35) {
              newLevel = 'medium';
            } else if (currentFps >= 20) {
              newLevel = 'low';
            } else {
              newLevel = 'minimal';
            }
            lastLevelChangeRef.current = now;
            setPerformanceLevel(newLevel);
          } else if (canChangeLevel) {
            // Dynamic adjustment - if FPS drops below 20, reduce density
            if (currentFps < 20 && performanceLevel !== 'minimal') {
              // Downgrade performance level
              if (performanceLevel === 'high') newLevel = 'medium';
              else if (performanceLevel === 'medium') newLevel = 'low';
              else if (performanceLevel === 'low') newLevel = 'minimal';

              if (newLevel !== performanceLevel) {
                lastLevelChangeRef.current = now;
                setPerformanceLevel(newLevel);
              }
            }
          }
        }
      }

      rafRef.current = requestAnimationFrame(measureFrame);
    };

    rafRef.current = requestAnimationFrame(measureFrame);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [performanceLevel]);

  return { fps, performanceLevel };
}

// Get hardware info (computed once on initialization)
function getHardwareInfo() {
  const info = {
    cores: navigator.hardwareConcurrency || 'unknown',
    memory: navigator.deviceMemory || null,
    gpu: null,
  };

  // Try to get GPU info via WebGL
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        info.gpu = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      }
    }
  } catch (e) {
    // WebGL not available
  }

  return info;
}

function useHardwareInfo() {
  // Compute once on mount using lazy initialization
  const [info] = useState(() => getHardwareInfo());
  return info;
}

function BloodSmearViewer() {
  const { fps, performanceLevel } = usePerformanceMonitor();
  const hardwareInfo = useHardwareInfo();
  const [manualDensity, setManualDensity] = useState(null);
  const [showPerfStats, setShowPerfStats] = useState(false); // Minimized by default
  const [isPanning, setIsPanning] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [rbcPerUL, setRbcPerUL] = useState(5000000); // Normal RBC count
  const [mcv, setMcv] = useState(90); // Mean Corpuscular Volume (fL)
  const [rdw, setRdw] = useState(13); // Red cell Distribution Width (%)
  const [nrbcPer100RBC, setNrbcPer100RBC] = useState(0); // Nucleated RBCs per 100 RBCs
  const [pltPerUL, setPltPerUL] = useState(250000); // Platelet count (normal 150-400K)
  const [showRbcPanel, setShowRbcPanel] = useState(true); // RBC panel expanded
  const [showPltPanel, setShowPltPanel] = useState(false); // PLT panel collapsed by default
  const [showWbcPanel, setShowWbcPanel] = useState(false); // WBC panel collapsed by default
  const [showMorphPanel, setShowMorphPanel] = useState(false); // Morphology panel collapsed by default

  // RBC Morphology percentages (percentage of RBCs showing this morphology)
  const [rbcMorphologies, setRbcMorphologies] = useState({
    spherocyte: 0,
    targetCell: 0,
    schistocyte: 0,
    sickleCell: 0,
    teardrop: 0,
    elliptocyte: 0,
    biteCell: 0,
    burrCell: 0,
    acanthocyte: 0,
    stomatocyte: 0,
    rouleaux: 0,
    howellJolly: 0,
    basophilicStippling: 0,
    pappenheimer: 0,
    polychromasia: 0,
  });

  // WBC Morphology percentages (percentage of WBCs showing this morphology)
  const [wbcMorphologies, setWbcMorphologies] = useState({
    bandNeutrophil: 0,
    hypersegmented: 0,
    toxicGranulation: 0,
    dohleBodies: 0,
    atypicalLymph: 0,
    blast: 0,
    smudgeCell: 0,
    auerRod: 0,
  });

  // PLT Morphology percentages
  const [pltMorphologies, setPltMorphologies] = useState({
    giantPlatelet: 0,
    plateletClump: 0,
    hypogranular: 0,
  });
  const [wbcPerUL, setWbcPerUL] = useState(7500); // Normal WBC count
  const [wbcDifferential, setWbcDifferential] = useState({
    neutrophil: 60,
    lymphocyte: 30,
    monocyte: 5,
    eosinophil: 3,
    basophil: 2,
  });
  const [isPaused, setIsPaused] = useState(false);
  const [objective, setObjective] = useState('10x'); // Start at scanning view
  const containerRef = useRef(null);

  // Map performance level to density - use max (5x) for high performance
  const getAutoDensity = useCallback(() => {
    switch (performanceLevel) {
      case 'high':
        return 'max';
      case 'medium':
        return 'full';
      case 'low':
        return 'medium';
      case 'minimal':
        return 'light';
      default:
        return 'medium'; // Default while detecting
    }
  }, [performanceLevel]);

  // Microscope objective configurations
  // 10x is baseline (fills screen), higher objectives zoom in progressively
  const objectives = {
    '10x': { zoom: 1, label: '10x', desc: 'Low power - scanning view', color: '#38a169' },
    '40x': { zoom: 2, label: '40x', desc: 'High power - standard view', color: '#3182ce' },
    '100x': { zoom: 5, label: '100x', desc: 'Oil immersion - detailed view', color: '#e53e3e' },
  };

  // Get current zoom from objective
  const currentZoom = objectives[objective]?.zoom || 1;

  // Handle objective change
  const handleObjectiveChange = useCallback((newObjective) => {
    setObjective(newObjective);
    setPanOffset({ x: 0, y: 0 }); // Reset pan when changing objective
  }, []);

  // Toggle pause/play
  const togglePause = useCallback(() => {
    setIsPaused((p) => !p);
  }, []);

  // Pan handlers for dragging when zoomed (100x oil immersion)
  const handleMouseDown = useCallback(
    (e) => {
      if (currentZoom > 1) {
        setIsPanning(true);
        setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      }
    },
    [currentZoom, panOffset]
  );

  const handleMouseMove = useCallback(
    (e) => {
      if (isPanning && currentZoom > 1) {
        const newX = e.clientX - panStart.x;
        const newY = e.clientY - panStart.y;
        // Limit panning to reasonable bounds
        const maxPan = (currentZoom - 1) * 300;
        setPanOffset({
          x: Math.max(-maxPan, Math.min(maxPan, newX)),
          y: Math.max(-maxPan, Math.min(maxPan, newY)),
        });
      }
    },
    [isPanning, currentZoom, panStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Touch support for mobile
  const handleTouchStart = useCallback(
    (e) => {
      if (currentZoom > 1 && e.touches.length === 1) {
        setIsPanning(true);
        setPanStart({
          x: e.touches[0].clientX - panOffset.x,
          y: e.touches[0].clientY - panOffset.y,
        });
      }
    },
    [currentZoom, panOffset]
  );

  const handleTouchMove = useCallback(
    (e) => {
      if (isPanning && currentZoom > 1 && e.touches.length === 1) {
        const newX = e.touches[0].clientX - panStart.x;
        const newY = e.touches[0].clientY - panStart.y;
        const maxPan = (currentZoom - 1) * 300;
        setPanOffset({
          x: Math.max(-maxPan, Math.min(maxPan, newX)),
          y: Math.max(-maxPan, Math.min(maxPan, newY)),
        });
      }
    },
    [isPanning, currentZoom, panStart]
  );

  const handleTouchEnd = useCallback(() => {
    setIsPanning(false);
  }, []);

  const currentDensity = manualDensity || getAutoDensity();

  // Estimate cell count based on density (derived value, no effect needed)
  // Biological ratios: RBCs + Platelets(~1:15) + WBCs(~1:100)
  const cellCount = useMemo(() => {
    const estimates = {
      max: '~3,000 total (~2,750 RBC, ~180 PLT, ~28 WBC)',
      ultra: '~1,800 total (~1,650 RBC, ~110 PLT, ~17 WBC)',
      full: '~600 total (~550 RBC, ~37 PLT, ~6 WBC)',
      medium: '~240 total (~220 RBC, ~15 PLT, ~2 WBC)',
      light: '~300 total (~275 RBC, ~18 PLT, ~3 WBC)',
    };
    return estimates[currentDensity] || '~240 cells';
  }, [currentDensity]);

  const densityOptions = [
    { value: null, label: 'Auto' },
    { value: 'light', label: 'Light' },
    { value: 'medium', label: 'Medium' },
    { value: 'full', label: 'Full' },
    { value: 'ultra', label: 'Ultra (3x)' },
    { value: 'max', label: 'Max (5x)' },
  ];

  const getPerformanceColor = () => {
    if (fps >= 55) return '#10b981';
    if (fps >= 40) return '#f59e0b';
    if (fps >= 25) return '#f97316';
    return '#ef4444';
  };

  const getPerformanceLabel = () => {
    switch (performanceLevel) {
      case 'detecting':
        return 'Detecting...';
      case 'high':
        return 'High Performance';
      case 'medium':
        return 'Medium Performance';
      case 'low':
        return 'Low Performance';
      case 'minimal':
        return 'Minimal Performance';
      default:
        return 'Unknown';
    }
  };

  // Calculate normalized percentages for display
  const getNormalizedPercent = (type) => {
    const total = Object.values(wbcDifferential).reduce((a, b) => a + b, 0);
    return total > 0 ? Math.round((wbcDifferential[type] / total) * 100) : 0;
  };

  // Get platelet status
  const getPltStatus = () => {
    const pltInK = pltPerUL / 1000;
    if (pltInK < 50) return { label: 'Severe Thrombocytopenia', color: '#dc2626' };
    if (pltInK < 100) return { label: 'Moderate Thrombocytopenia', color: '#ef4444' };
    if (pltInK < 150) return { label: 'Mild Thrombocytopenia', color: '#f59e0b' };
    if (pltInK <= 400) return { label: 'Normal', color: '#10b981' };
    if (pltInK <= 600) return { label: 'Thrombocytosis', color: '#f59e0b' };
    return { label: 'Marked Thrombocytosis', color: '#ef4444' };
  };

  // Calculate cell percentages based on actual counts
  const totalCellsPerUL = rbcPerUL + pltPerUL + wbcPerUL;
  const rbcPercent = ((rbcPerUL / totalCellsPerUL) * 100).toFixed(1);
  const pltPercent = ((pltPerUL / totalCellsPerUL) * 100).toFixed(1);
  const wbcTotalPercent = ((wbcPerUL / totalCellsPerUL) * 100).toFixed(2);

  // Calculate absolute WBC counts for each cell type
  const getAbsoluteWbcCount = (type) => {
    const total = Object.values(wbcDifferential).reduce((a, b) => a + b, 0);
    const percent = total > 0 ? wbcDifferential[type] / total : 0;
    return Math.round(wbcPerUL * percent);
  };

  // Format large numbers for display
  const formatCount = (count) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(2)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  // Cell types with dynamic percentages and absolute counts
  const cellTypes = [
    {
      type: 'rbc',
      name: 'RBC (Erythrocyte)',
      percent: `${rbcPercent}%`,
      desc: 'of all cells',
      absoluteCount: rbcPerUL,
      absoluteDisplay: `${formatCount(rbcPerUL)}/µL`,
      dynamic: true,
    },
    {
      type: 'platelet',
      name: 'Platelet',
      percent: `${pltPercent}%`,
      desc: 'of all cells',
      absoluteCount: pltPerUL,
      absoluteDisplay: `${formatCount(pltPerUL)}/µL`,
      dynamic: true,
    },
    {
      type: 'wbc-header',
      name: 'WBCs (Total)',
      percent: `${wbcTotalPercent}%`,
      desc: 'of all cells',
      absoluteCount: wbcPerUL,
      absoluteDisplay: `${formatCount(wbcPerUL)}/µL`,
      dynamic: true,
      isHeader: true,
    },
    {
      type: 'neutrophil',
      name: 'Neutrophil',
      percent: `${getNormalizedPercent('neutrophil')}%`,
      desc: 'of WBCs',
      absoluteCount: getAbsoluteWbcCount('neutrophil'),
      absoluteDisplay: `${formatCount(getAbsoluteWbcCount('neutrophil'))}/µL`,
      dynamic: true,
    },
    {
      type: 'lymphocyte',
      name: 'Lymphocyte',
      percent: `${getNormalizedPercent('lymphocyte')}%`,
      desc: 'of WBCs',
      absoluteCount: getAbsoluteWbcCount('lymphocyte'),
      absoluteDisplay: `${formatCount(getAbsoluteWbcCount('lymphocyte'))}/µL`,
      dynamic: true,
    },
    {
      type: 'monocyte',
      name: 'Monocyte',
      percent: `${getNormalizedPercent('monocyte')}%`,
      desc: 'of WBCs',
      absoluteCount: getAbsoluteWbcCount('monocyte'),
      absoluteDisplay: `${formatCount(getAbsoluteWbcCount('monocyte'))}/µL`,
      dynamic: true,
    },
    {
      type: 'eosinophil',
      name: 'Eosinophil',
      percent: `${getNormalizedPercent('eosinophil')}%`,
      desc: 'of WBCs',
      absoluteCount: getAbsoluteWbcCount('eosinophil'),
      absoluteDisplay: `${formatCount(getAbsoluteWbcCount('eosinophil'))}/µL`,
      dynamic: true,
    },
    {
      type: 'basophil',
      name: 'Basophil',
      percent: `${getNormalizedPercent('basophil')}%`,
      desc: 'of WBCs',
      absoluteCount: getAbsoluteWbcCount('basophil'),
      absoluteDisplay: `${formatCount(getAbsoluteWbcCount('basophil'))}/µL`,
      dynamic: true,
    },
  ];

  // =================================================================
  // RBC INDICES STATUS AND PRESETS
  // =================================================================

  // Get MCV status label
  const getMcvStatus = () => {
    if (mcv < 80) return { label: 'Microcytic', color: '#f59e0b' };
    if (mcv <= 100) return { label: 'Normocytic', color: '#10b981' };
    return { label: 'Macrocytic', color: '#8b5cf6' };
  };

  // Get RDW status label
  const getRdwStatus = () => {
    if (rdw <= 14.5) return { label: 'Normal', color: '#10b981' };
    if (rdw <= 18) return { label: 'Elevated', color: '#f59e0b' };
    return { label: 'High (Anisocytosis)', color: '#ef4444' };
  };

  // Get RBC count status
  const getRbcStatus = () => {
    const rbcInMillions = rbcPerUL / 1000000;
    if (rbcInMillions < 4.0) return { label: 'Low (Anemia)', color: '#ef4444' };
    if (rbcInMillions <= 5.5) return { label: 'Normal', color: '#10b981' };
    return { label: 'Elevated (Polycythemia)', color: '#f59e0b' };
  };

  // =================================================================
  // HEMOGLOBIN CALCULATION
  // =================================================================
  // Hgb (g/dL) = MCHC × RBC(M/µL) × MCV(fL) / 1000
  // MCHC (Mean Corpuscular Hemoglobin Concentration) ≈ 33 g/dL typical
  const MCHC = 33; // g/dL - typical value
  const hemoglobin = useMemo(() => {
    const rbcInMillions = rbcPerUL / 1000000;
    return (MCHC * rbcInMillions * mcv / 1000).toFixed(1);
  }, [rbcPerUL, mcv]);

  // Get hemoglobin status
  const getHgbStatus = () => {
    const hgb = parseFloat(hemoglobin);
    if (hgb < 7) return { label: 'Severe Anemia', color: '#dc2626' };
    if (hgb < 10) return { label: 'Moderate Anemia', color: '#ef4444' };
    if (hgb < 12) return { label: 'Mild Anemia', color: '#f59e0b' };
    if (hgb <= 17) return { label: 'Normal', color: '#10b981' };
    return { label: 'Elevated', color: '#8b5cf6' };
  };

  // Calculate hematocrit (Hct = RBC × MCV / 10, in %)
  const hematocrit = useMemo(() => {
    const rbcInMillions = rbcPerUL / 1000000;
    return (rbcInMillions * mcv / 10).toFixed(1);
  }, [rbcPerUL, mcv]);

  // Calculate absolute nRBC count
  const absoluteNrbcCount = useMemo(() => {
    // nRBC per 100 RBCs converted to per µL
    return Math.round((nrbcPer100RBC / 100) * rbcPerUL);
  }, [nrbcPer100RBC, rbcPerUL]);

  // Clinical anemia presets
  // Each preset sets RBC count, MCV, RDW, and nRBC to mimic the condition
  // nRBC values: normally 0, elevated in marrow stress/hemolysis/infiltration
  const anemiaPresets = [
    {
      name: 'Normal',
      desc: 'Healthy blood',
      rbc: 5000000,
      mcv: 90,
      rdw: 13,
      plt: 250000,
      nrbc: 0,
    },
    {
      name: 'IDA',
      desc: 'Iron Deficiency Anemia - reactive thrombocytosis',
      rbc: 3500000,
      mcv: 68,
      rdw: 19,
      plt: 380000, // Reactive thrombocytosis common in IDA
      nrbc: 0,
    },
    {
      name: 'Thalassemia',
      desc: 'Thalassemia Minor/Intermedia',
      rbc: 5500000,
      mcv: 65,
      rdw: 14,
      plt: 280000,
      nrbc: 3,
    },
    {
      name: 'B12/Folate',
      desc: 'Megaloblastic Anemia - pancytopenia',
      rbc: 2800000,
      mcv: 115,
      rdw: 18,
      plt: 100000, // Thrombocytopenia common
      nrbc: 2,
    },
    {
      name: 'Hemolytic',
      desc: 'Hemolytic Anemia',
      rbc: 3200000,
      mcv: 105,
      rdw: 20,
      plt: 200000,
      nrbc: 8,
    },
    {
      name: 'MDS',
      desc: 'Myelodysplastic Syndrome - cytopenias',
      rbc: 3000000,
      mcv: 108,
      rdw: 22,
      plt: 80000, // Often thrombocytopenic
      nrbc: 5,
    },
    {
      name: 'Myelophthisis',
      desc: 'Bone marrow infiltration - pancytopenia',
      rbc: 3000000,
      mcv: 95,
      rdw: 20,
      plt: 60000, // Thrombocytopenic
      nrbc: 15,
    },
    {
      name: 'Thal Major',
      desc: 'Thalassemia Major (severe)',
      rbc: 2500000,
      mcv: 60,
      rdw: 25,
      plt: 120000,
      nrbc: 20,
    },
  ];

  // Morphology presets - clinical scenarios with characteristic findings
  const morphologyPresets = [
    {
      name: 'Normal',
      desc: 'No abnormal morphology',
      rbc: { spherocyte: 0, targetCell: 0, schistocyte: 0, sickleCell: 0, teardrop: 0, elliptocyte: 0, biteCell: 0, burrCell: 0, acanthocyte: 0, stomatocyte: 0, rouleaux: 0, howellJolly: 0, basophilicStippling: 0, pappenheimer: 0, polychromasia: 0 },
      wbc: { bandNeutrophil: 0, hypersegmented: 0, toxicGranulation: 0, dohleBodies: 0, atypicalLymph: 0, blast: 0, smudgeCell: 0, auerRod: 0 },
      plt: { giantPlatelet: 0, plateletClump: 0, hypogranular: 0 },
    },
    {
      name: 'Sickle Cell',
      desc: 'Sickle cell disease with polychromasia',
      rbc: { spherocyte: 0, targetCell: 15, schistocyte: 0, sickleCell: 25, teardrop: 0, elliptocyte: 0, biteCell: 0, burrCell: 0, acanthocyte: 0, stomatocyte: 0, rouleaux: 0, howellJolly: 5, basophilicStippling: 0, pappenheimer: 0, polychromasia: 20 },
      wbc: { bandNeutrophil: 0, hypersegmented: 0, toxicGranulation: 0, dohleBodies: 0, atypicalLymph: 0, blast: 0, smudgeCell: 0, auerRod: 0 },
      plt: { giantPlatelet: 0, plateletClump: 0, hypogranular: 0 },
    },
    {
      name: 'MAHA/TTP',
      desc: 'Microangiopathic hemolytic anemia with schistocytes',
      rbc: { spherocyte: 5, targetCell: 0, schistocyte: 25, sickleCell: 0, teardrop: 0, elliptocyte: 0, biteCell: 0, burrCell: 0, acanthocyte: 0, stomatocyte: 0, rouleaux: 0, howellJolly: 0, basophilicStippling: 0, pappenheimer: 0, polychromasia: 15 },
      wbc: { bandNeutrophil: 5, hypersegmented: 0, toxicGranulation: 0, dohleBodies: 0, atypicalLymph: 0, blast: 0, smudgeCell: 0, auerRod: 0 },
      plt: { giantPlatelet: 10, plateletClump: 0, hypogranular: 0 },
    },
    {
      name: 'Liver Disease',
      desc: 'Target cells, acanthocytes, stomatocytes',
      rbc: { spherocyte: 0, targetCell: 20, schistocyte: 0, sickleCell: 0, teardrop: 0, elliptocyte: 0, biteCell: 0, burrCell: 0, acanthocyte: 15, stomatocyte: 10, rouleaux: 0, howellJolly: 0, basophilicStippling: 0, pappenheimer: 0, polychromasia: 0 },
      wbc: { bandNeutrophil: 0, hypersegmented: 0, toxicGranulation: 0, dohleBodies: 0, atypicalLymph: 0, blast: 0, smudgeCell: 0, auerRod: 0 },
      plt: { giantPlatelet: 5, plateletClump: 0, hypogranular: 0 },
    },
    {
      name: 'Myelofibrosis',
      desc: 'Teardrop cells, nRBCs (set in RBC panel)',
      rbc: { spherocyte: 0, targetCell: 5, schistocyte: 5, sickleCell: 0, teardrop: 30, elliptocyte: 10, biteCell: 0, burrCell: 0, acanthocyte: 0, stomatocyte: 0, rouleaux: 0, howellJolly: 0, basophilicStippling: 5, pappenheimer: 0, polychromasia: 10 },
      wbc: { bandNeutrophil: 10, hypersegmented: 0, toxicGranulation: 0, dohleBodies: 0, atypicalLymph: 0, blast: 5, smudgeCell: 0, auerRod: 0 },
      plt: { giantPlatelet: 20, plateletClump: 5, hypogranular: 0 },
    },
    {
      name: 'Sepsis',
      desc: 'Toxic changes, left shift, Döhle bodies',
      rbc: { spherocyte: 0, targetCell: 0, schistocyte: 5, sickleCell: 0, teardrop: 0, elliptocyte: 0, biteCell: 0, burrCell: 5, acanthocyte: 0, stomatocyte: 0, rouleaux: 10, howellJolly: 0, basophilicStippling: 0, pappenheimer: 0, polychromasia: 0 },
      wbc: { bandNeutrophil: 25, hypersegmented: 0, toxicGranulation: 40, dohleBodies: 20, atypicalLymph: 0, blast: 0, smudgeCell: 0, auerRod: 0 },
      plt: { giantPlatelet: 10, plateletClump: 0, hypogranular: 0 },
    },
    {
      name: 'B12/Folate',
      desc: 'Megaloblastic anemia with hypersegmented neutrophils',
      rbc: { spherocyte: 0, targetCell: 0, schistocyte: 0, sickleCell: 0, teardrop: 5, elliptocyte: 15, biteCell: 0, burrCell: 0, acanthocyte: 0, stomatocyte: 0, rouleaux: 0, howellJolly: 10, basophilicStippling: 5, pappenheimer: 0, polychromasia: 5 },
      wbc: { bandNeutrophil: 0, hypersegmented: 30, toxicGranulation: 0, dohleBodies: 0, atypicalLymph: 0, blast: 0, smudgeCell: 0, auerRod: 0 },
      plt: { giantPlatelet: 5, plateletClump: 0, hypogranular: 10 },
    },
    {
      name: 'Viral (Mono)',
      desc: 'Atypical lymphocytes (EBV/CMV)',
      rbc: { spherocyte: 0, targetCell: 0, schistocyte: 0, sickleCell: 0, teardrop: 0, elliptocyte: 0, biteCell: 0, burrCell: 0, acanthocyte: 0, stomatocyte: 0, rouleaux: 0, howellJolly: 0, basophilicStippling: 0, pappenheimer: 0, polychromasia: 0 },
      wbc: { bandNeutrophil: 0, hypersegmented: 0, toxicGranulation: 0, dohleBodies: 0, atypicalLymph: 40, blast: 0, smudgeCell: 0, auerRod: 0 },
      plt: { giantPlatelet: 0, plateletClump: 0, hypogranular: 0 },
    },
    {
      name: 'CLL',
      desc: 'Chronic lymphocytic leukemia with smudge cells',
      rbc: { spherocyte: 0, targetCell: 0, schistocyte: 0, sickleCell: 0, teardrop: 0, elliptocyte: 0, biteCell: 0, burrCell: 0, acanthocyte: 0, stomatocyte: 0, rouleaux: 5, howellJolly: 0, basophilicStippling: 0, pappenheimer: 0, polychromasia: 0 },
      wbc: { bandNeutrophil: 0, hypersegmented: 0, toxicGranulation: 0, dohleBodies: 0, atypicalLymph: 10, blast: 0, smudgeCell: 35, auerRod: 0 },
      plt: { giantPlatelet: 0, plateletClump: 0, hypogranular: 0 },
    },
    {
      name: 'AML',
      desc: 'Acute myeloid leukemia with blasts and Auer rods',
      rbc: { spherocyte: 0, targetCell: 0, schistocyte: 0, sickleCell: 0, teardrop: 0, elliptocyte: 0, biteCell: 0, burrCell: 0, acanthocyte: 0, stomatocyte: 0, rouleaux: 0, howellJolly: 0, basophilicStippling: 0, pappenheimer: 0, polychromasia: 5 },
      wbc: { bandNeutrophil: 0, hypersegmented: 0, toxicGranulation: 0, dohleBodies: 0, atypicalLymph: 0, blast: 50, smudgeCell: 0, auerRod: 15 },
      plt: { giantPlatelet: 0, plateletClump: 0, hypogranular: 15 },
    },
    {
      name: 'G6PD Crisis',
      desc: 'Bite cells, blister cells from oxidative stress',
      rbc: { spherocyte: 5, targetCell: 0, schistocyte: 5, sickleCell: 0, teardrop: 0, elliptocyte: 0, biteCell: 25, burrCell: 0, acanthocyte: 0, stomatocyte: 0, rouleaux: 0, howellJolly: 0, basophilicStippling: 0, pappenheimer: 0, polychromasia: 15 },
      wbc: { bandNeutrophil: 5, hypersegmented: 0, toxicGranulation: 0, dohleBodies: 0, atypicalLymph: 0, blast: 0, smudgeCell: 0, auerRod: 0 },
      plt: { giantPlatelet: 0, plateletClump: 0, hypogranular: 0 },
    },
    {
      name: 'Multiple Myeloma',
      desc: 'Rouleaux formation from paraprotein',
      rbc: { spherocyte: 0, targetCell: 0, schistocyte: 0, sickleCell: 0, teardrop: 0, elliptocyte: 0, biteCell: 0, burrCell: 0, acanthocyte: 0, stomatocyte: 0, rouleaux: 40, howellJolly: 0, basophilicStippling: 0, pappenheimer: 0, polychromasia: 0 },
      wbc: { bandNeutrophil: 0, hypersegmented: 0, toxicGranulation: 0, dohleBodies: 0, atypicalLymph: 0, blast: 0, smudgeCell: 0, auerRod: 0 },
      plt: { giantPlatelet: 0, plateletClump: 5, hypogranular: 0 },
    },
  ];

  // Apply a morphology preset
  const applyMorphologyPreset = (preset) => {
    setRbcMorphologies(preset.rbc);
    setWbcMorphologies(preset.wbc);
    setPltMorphologies(preset.plt);
  };

  // Update a single RBC morphology
  const updateRbcMorphology = (key, value) => {
    setRbcMorphologies((prev) => ({
      ...prev,
      [key]: Math.max(0, Math.min(100, value)),
    }));
  };

  // Update a single WBC morphology
  const updateWbcMorphology = (key, value) => {
    setWbcMorphologies((prev) => ({
      ...prev,
      [key]: Math.max(0, Math.min(100, value)),
    }));
  };

  // Platelet presets
  const plateletPresets = [
    { value: 250000, label: 'Normal', desc: '250K/µL' },
    { value: 25000, label: 'ITP', desc: 'Immune Thrombocytopenic Purpura' },
    { value: 50000, label: 'Moderate ↓', desc: 'Moderate thrombocytopenia' },
    { value: 500000, label: 'Reactive', desc: 'Reactive thrombocytosis' },
    { value: 700000, label: 'ET', desc: 'Essential Thrombocythemia' },
  ];

  // Apply an anemia preset
  const applyAnemiaPreset = (preset) => {
    setRbcPerUL(preset.rbc);
    setMcv(preset.mcv);
    setPltPerUL(preset.plt);
    setRdw(preset.rdw);
    setNrbcPer100RBC(preset.nrbc);
  };

  // Get nRBC status label
  const getNrbcStatus = () => {
    if (nrbcPer100RBC === 0) return { label: 'None', color: '#10b981' };
    if (nrbcPer100RBC <= 5) return { label: 'Present', color: '#f59e0b' };
    if (nrbcPer100RBC <= 15) return { label: 'Elevated', color: '#f97316' };
    return { label: 'Markedly Elevated', color: '#ef4444' };
  };

  // =================================================================
  // WBC COUNT AND DIFFERENTIAL
  // =================================================================

  // WBC count presets with clinical context
  const wbcPresets = [
    { value: 2500, label: 'Leukopenia', desc: '2,500/µL' },
    { value: 7500, label: 'Normal', desc: '7,500/µL' },
    { value: 15000, label: 'Mild ↑', desc: '15,000/µL' },
    { value: 30000, label: 'Leukocytosis', desc: '30,000/µL' },
    { value: 75000, label: 'Marked ↑', desc: '75,000/µL' },
    { value: 150000, label: 'Leukemia', desc: '150,000/µL' },
    { value: 500000, label: 'Blast Crisis', desc: '500,000/µL' },
  ];

  // Get WBC status label
  const getWbcStatus = () => {
    if (wbcPerUL < 4000) return { label: 'Leukopenia', color: '#3b82f6' };
    if (wbcPerUL <= 11000) return { label: 'Normal', color: '#10b981' };
    if (wbcPerUL <= 20000) return { label: 'Mild Leukocytosis', color: '#f59e0b' };
    if (wbcPerUL <= 50000) return { label: 'Leukocytosis', color: '#f97316' };
    if (wbcPerUL <= 100000) return { label: 'Marked Leukocytosis', color: '#ef4444' };
    return { label: 'Leukemia Range', color: '#dc2626' };
  };

  // WBC differential presets with clinical scenarios
  const differentialPresets = [
    {
      name: 'Normal',
      diff: { neutrophil: 60, lymphocyte: 30, monocyte: 5, eosinophil: 3, basophil: 2 },
    },
    {
      name: 'Bacterial Infection',
      desc: 'Neutrophilia',
      diff: { neutrophil: 85, lymphocyte: 10, monocyte: 3, eosinophil: 1, basophil: 1 },
    },
    {
      name: 'Viral Infection',
      desc: 'Lymphocytosis',
      diff: { neutrophil: 30, lymphocyte: 60, monocyte: 6, eosinophil: 3, basophil: 1 },
    },
    {
      name: 'Parasitic/Allergy',
      desc: 'Eosinophilia',
      diff: { neutrophil: 45, lymphocyte: 25, monocyte: 5, eosinophil: 23, basophil: 2 },
    },
    {
      name: 'Chronic Inflammation',
      desc: 'Monocytosis',
      diff: { neutrophil: 50, lymphocyte: 25, monocyte: 18, eosinophil: 5, basophil: 2 },
    },
    {
      name: 'CML',
      desc: 'Left shift + basophilia',
      diff: { neutrophil: 55, lymphocyte: 15, monocyte: 10, eosinophil: 8, basophil: 12 },
    },
  ];

  // Update a single differential value
  const updateDifferential = (type, value) => {
    setWbcDifferential((prev) => ({
      ...prev,
      [type]: Math.max(0, Math.min(100, value)),
    }));
  };

  return (
    <div
      className={`blood-smear-viewer ${isPanning ? 'panning' : ''} ${currentZoom > 1 ? 'zoomed' : ''} ${isPaused ? 'paused' : ''}`}
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="blood-smear-zoom-container"
        style={{
          transform: `scale(${currentZoom}) translate(${panOffset.x / currentZoom}px, ${panOffset.y / currentZoom}px)`,
          transformOrigin: 'center center',
        }}
      >
        <BloodSmearBackground
          density={currentDensity}
          scaleOverride={null}
          rbcPerUL={rbcPerUL}
          mcv={mcv}
          rdw={rdw}
          nrbcPer100RBC={nrbcPer100RBC}
          wbcPerUL={wbcPerUL}
          wbcDifferential={wbcDifferential}
          pltPerUL={pltPerUL}
          rbcMorphologies={rbcMorphologies}
          wbcMorphologies={wbcMorphologies}
          pltMorphologies={pltMorphologies}
        />
      </div>

      {/* Navigation buttons */}
      <div className="viewer-nav-buttons">
        <a
          href="#home"
          className="viewer-back-link"
          onClick={(e) => {
            e.preventDefault();
            window.location.hash = '';
          }}
        >
          ← Back to Home
        </a>
        <a
          href="#morphology"
          className="viewer-morphology-link"
          onClick={(e) => {
            e.preventDefault();
            window.location.hash = 'morphology';
          }}
        >
          Morphology Guide
        </a>
      </div>

      {/* Microscope controls - always visible */}
      <div className="microscope-panel">
        <div className="microscope-controls">
          {/* Pause/Play button */}
          <button
            className={`control-btn pause-btn ${isPaused ? 'paused' : ''}`}
            onClick={togglePause}
            title={isPaused ? 'Play animation' : 'Pause animation'}
          >
            {isPaused ? '▶' : '⏸'}
          </button>

          {/* Objective selector */}
          <div className="objective-selector">
            {Object.entries(objectives).map(([key, obj]) => (
              <button
                key={key}
                className={`objective-btn ${objective === key ? 'active' : ''}`}
                onClick={() => handleObjectiveChange(key)}
                title={obj.desc}
                style={{ '--obj-color': obj.color }}
              >
                {obj.label}
              </button>
            ))}
          </div>
        </div>
        <p className="objective-desc">{objectives[objective]?.desc}</p>
        {currentZoom > 1 && <p className="pan-hint">Drag to pan the field</p>}
      </div>

      {/* Cell Types Legend - always visible */}
      <div className="cell-types-panel">
        <h3>Cell Types</h3>

        {/* Hemoglobin Summary */}
        <div className="hgb-summary">
          <span className="hgb-label">Hgb</span>
          <span className="hgb-value" style={{ color: getHgbStatus().color }}>
            {hemoglobin} g/dL
          </span>
          <span className="hgb-status" style={{ color: getHgbStatus().color }}>
            {getHgbStatus().label}
          </span>
        </div>

        <div className="cell-types-list">
          {cellTypes.map((cell) => (
            <div
              key={cell.type}
              className={`cell-type-item ${cell.isHeader ? 'wbc-header-row' : ''}`}
            >
              {!cell.isHeader && <span className={`legend-dot ${cell.type}`}></span>}
              {cell.isHeader && <span className="wbc-header-icon">┌</span>}
              <div className="cell-type-info">
                <span className={`cell-type-name ${cell.isHeader ? 'header-name' : ''}`}>
                  {cell.name}
                </span>
                <span className={`cell-type-percent ${cell.dynamic ? 'dynamic' : ''}`}>
                  <span className={cell.dynamic ? 'dynamic-value' : ''}>{cell.percent}</span>{' '}
                  <span className="cell-type-desc">{cell.desc}</span>
                </span>
                <span className="cell-type-absolute">
                  {cell.absoluteDisplay}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Indices Panels Container - stacked in top left */}
      <div className="indices-panels-container">
        {/* RBC Indices Control - collapsible panel */}
        <div className={`rbc-control-panel ${showRbcPanel ? 'expanded' : 'collapsed'}`}>
        <button className="panel-toggle" onClick={() => setShowRbcPanel(!showRbcPanel)}>
          <span className="toggle-icon">{showRbcPanel ? '▼' : '▶'}</span>
          <span>RBC</span>
          <span className="panel-summary" style={{ color: getHgbStatus().color }}>
            Hgb {hemoglobin}
          </span>
        </button>

        {showRbcPanel && (
          <div className="panel-content">
            {/* Anemia Presets */}
            <div className="anemia-presets">
              {anemiaPresets.map((preset) => (
                <button
                  key={preset.name}
                  className={`anemia-preset-btn ${
                    rbcPerUL === preset.rbc && mcv === preset.mcv && rdw === preset.rdw && pltPerUL === preset.plt && nrbcPer100RBC === preset.nrbc
                      ? 'active'
                      : ''
                  }`}
                  onClick={() => applyAnemiaPreset(preset)}
                  title={preset.desc}
                >
                  {preset.name}
                </button>
              ))}
            </div>

            {/* RBC Count */}
            <div className="rbc-index-row">
              <div className="rbc-index-header">
                <span className="rbc-index-label">RBC</span>
                <span className="rbc-index-value">{(rbcPerUL / 1000000).toFixed(1)}M/µL</span>
                <span className="rbc-index-status" style={{ color: getRbcStatus().color }}>
                  {getRbcStatus().label}
                </span>
              </div>
              <input
                type="range"
                min="2000000"
                max="7000000"
                step="100000"
                value={rbcPerUL}
                onChange={(e) => setRbcPerUL(Number(e.target.value))}
                className="rbc-slider"
              />
            </div>

            {/* Hemoglobin - Calculated from RBC × MCV × MCHC */}
            <div className="rbc-index-row calculated-row">
              <div className="rbc-index-header">
                <span className="rbc-index-label">Hgb</span>
                <span className="rbc-index-value">{hemoglobin} g/dL</span>
                <span className="rbc-index-status" style={{ color: getHgbStatus().color }}>
                  {getHgbStatus().label}
                </span>
              </div>
              <div className="calculated-bar">
                <div
                  className="calculated-fill hgb-fill"
                  style={{ width: `${Math.min(100, (parseFloat(hemoglobin) / 17) * 100)}%` }}
                />
              </div>
            </div>

            {/* Hematocrit - Calculated from RBC × MCV */}
            <div className="rbc-index-row calculated-row">
              <div className="rbc-index-header">
                <span className="rbc-index-label">Hct</span>
                <span className="rbc-index-value">{hematocrit}%</span>
                <span className="rbc-index-status" style={{ color: getHgbStatus().color }}>
                  {parseFloat(hematocrit) < 36 ? 'Low' : parseFloat(hematocrit) <= 50 ? 'Normal' : 'High'}
                </span>
              </div>
              <div className="calculated-bar">
                <div
                  className="calculated-fill hct-fill"
                  style={{ width: `${Math.min(100, (parseFloat(hematocrit) / 50) * 100)}%` }}
                />
              </div>
            </div>

            {/* MCV */}
            <div className="rbc-index-row">
              <div className="rbc-index-header">
                <span className="rbc-index-label">MCV</span>
                <span className="rbc-index-value">{mcv} fL</span>
                <span className="rbc-index-status" style={{ color: getMcvStatus().color }}>
                  {getMcvStatus().label}
                </span>
              </div>
              <input
                type="range"
                min="60"
                max="130"
                step="1"
                value={mcv}
                onChange={(e) => setMcv(Number(e.target.value))}
                className="rbc-slider mcv-slider"
              />
            </div>

            {/* RDW */}
            <div className="rbc-index-row">
              <div className="rbc-index-header">
                <span className="rbc-index-label">RDW</span>
                <span className="rbc-index-value">{rdw}%</span>
                <span className="rbc-index-status" style={{ color: getRdwStatus().color }}>
                  {getRdwStatus().label}
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="30"
                step="0.5"
                value={rdw}
                onChange={(e) => setRdw(Number(e.target.value))}
                className="rbc-slider rdw-slider"
              />
            </div>

            {/* nRBC - Nucleated RBCs */}
            <div className="rbc-index-row nrbc-row">
              <div className="rbc-index-header">
                <span className="rbc-index-label nrbc-label">nRBC</span>
                <span className="rbc-index-value">{nrbcPer100RBC}/100</span>
                <span className="rbc-index-absolute">({formatCount(absoluteNrbcCount)}/µL)</span>
                <span className="rbc-index-status" style={{ color: getNrbcStatus().color }}>
                  {getNrbcStatus().label}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                step="1"
                value={nrbcPer100RBC}
                onChange={(e) => setNrbcPer100RBC(Number(e.target.value))}
                className="rbc-slider nrbc-slider"
              />
            </div>

            <p className="rbc-reference">Normal: nRBC 0/100 RBCs</p>
          </div>
        )}
      </div>

      {/* PLT Control - collapsible panel */}
      <div className={`plt-control-panel ${showPltPanel ? 'expanded' : 'collapsed'}`}>
        <button className="panel-toggle plt-toggle" onClick={() => setShowPltPanel(!showPltPanel)}>
          <span className="toggle-icon">{showPltPanel ? '▼' : '▶'}</span>
          <span>PLT</span>
          <span className="panel-summary" style={{ color: getPltStatus().color }}>
            {(pltPerUL / 1000).toFixed(0)}K
          </span>
        </button>

        {showPltPanel && (
          <div className="panel-content">
            <div className="plt-current">
              <span className="plt-value">{(pltPerUL / 1000).toFixed(0)}K/µL</span>
              <span className="plt-status" style={{ color: getPltStatus().color }}>
                {getPltStatus().label}
              </span>
            </div>
            <input
              type="range"
              min="10000"
              max="800000"
              step="10000"
              value={pltPerUL}
              onChange={(e) => setPltPerUL(Number(e.target.value))}
              className="plt-slider"
            />
            <div className="plt-presets">
              {plateletPresets.map((preset) => (
                <button
                  key={preset.label}
                  className={`plt-preset-btn ${pltPerUL === preset.value ? 'active' : ''}`}
                  onClick={() => setPltPerUL(preset.value)}
                  title={preset.desc}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <p className="plt-reference">Normal: 150-400K/µL</p>
          </div>
        )}
      </div>

      {/* WBC Count Control - collapsible panel */}
      <div className={`wbc-control-panel ${showWbcPanel ? 'expanded' : 'collapsed'}`}>
        <button className="panel-toggle wbc-toggle" onClick={() => setShowWbcPanel(!showWbcPanel)}>
          <span className="toggle-icon">{showWbcPanel ? '▼' : '▶'}</span>
          <span>WBC</span>
          <span className="panel-summary" style={{ color: getWbcStatus().color }}>
            {(wbcPerUL / 1000).toFixed(1)}K
          </span>
        </button>

        {showWbcPanel && (
          <div className="panel-content">
            <div className="wbc-current">
              <span className="wbc-value">{wbcPerUL.toLocaleString()}/µL</span>
              <span className="wbc-status" style={{ color: getWbcStatus().color }}>
                {getWbcStatus().label}
              </span>
            </div>
            <input
              type="range"
              min="1000"
              max="500000"
              step="1000"
              value={wbcPerUL}
              onChange={(e) => setWbcPerUL(Number(e.target.value))}
              className="wbc-slider"
            />
            <div className="wbc-presets">
              {wbcPresets.map((preset) => (
                <button
                  key={preset.value}
                  className={`wbc-preset-btn ${wbcPerUL === preset.value ? 'active' : ''}`}
                  onClick={() => setWbcPerUL(preset.value)}
                  title={preset.desc}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <p className="wbc-reference">Normal: 5,000-10,000/µL</p>

            {/* WBC Differential Control */}
            <div className="differential-section">
              <h4>WBC Differential</h4>
              <div className="differential-presets">
                {differentialPresets.map((preset) => (
                  <button
                    key={preset.name}
                    className={`diff-preset-btn ${
                      JSON.stringify(wbcDifferential) === JSON.stringify(preset.diff) ? 'active' : ''
                    }`}
                    onClick={() => setWbcDifferential(preset.diff)}
                    title={preset.desc || preset.name}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>

              <div className="differential-sliders">
                {[
                  { key: 'neutrophil', label: 'Neut', color: '#6a9fc4' },
                  { key: 'lymphocyte', label: 'Lymph', color: '#5a8ac4' },
                  { key: 'monocyte', label: 'Mono', color: '#8a9fc4' },
                  { key: 'eosinophil', label: 'Eos', color: '#e88a5a' },
                  { key: 'basophil', label: 'Baso', color: '#8a5aa4' },
                ].map((cell) => (
                  <div key={cell.key} className="diff-slider-row">
                    <span className="diff-label" style={{ color: cell.color }}>
                      {cell.label}
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={wbcDifferential[cell.key]}
                      onChange={(e) => updateDifferential(cell.key, Number(e.target.value))}
                      className="diff-slider"
                      style={{ accentColor: cell.color }}
                    />
                    <span className="diff-percent">{getNormalizedPercent(cell.key)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        </div>

        {/* Morphology Control - collapsible panel */}
        <div className={`morph-control-panel ${showMorphPanel ? 'expanded' : 'collapsed'}`}>
          <button className="panel-toggle morph-toggle" onClick={() => setShowMorphPanel(!showMorphPanel)}>
            <span className="toggle-icon">{showMorphPanel ? '▼' : '▶'}</span>
            <span>Morphology</span>
            <span className="panel-summary morph-summary">
              {Object.values(rbcMorphologies).some(v => v > 0) ||
               Object.values(wbcMorphologies).some(v => v > 0) ? '•' : ''}
            </span>
          </button>

          {showMorphPanel && (
            <div className="panel-content morph-panel-content">
              {/* Morphology Presets */}
              <div className="morph-presets">
                {morphologyPresets.map((preset) => (
                  <button
                    key={preset.name}
                    className={`morph-preset-btn ${
                      JSON.stringify(rbcMorphologies) === JSON.stringify(preset.rbc) &&
                      JSON.stringify(wbcMorphologies) === JSON.stringify(preset.wbc)
                        ? 'active'
                        : ''
                    }`}
                    onClick={() => applyMorphologyPreset(preset)}
                    title={preset.desc}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>

              {/* RBC Morphologies */}
              <div className="morph-section">
                <h4 className="morph-section-title rbc-morph-title">RBC Morphology</h4>
                <div className="morph-sliders">
                  {[
                    { key: 'spherocyte', label: 'Spherocyte' },
                    { key: 'targetCell', label: 'Target Cell' },
                    { key: 'schistocyte', label: 'Schistocyte' },
                    { key: 'sickleCell', label: 'Sickle Cell' },
                    { key: 'teardrop', label: 'Teardrop' },
                    { key: 'elliptocyte', label: 'Elliptocyte' },
                    { key: 'biteCell', label: 'Bite Cell' },
                    { key: 'burrCell', label: 'Burr Cell' },
                    { key: 'acanthocyte', label: 'Acanthocyte' },
                    { key: 'stomatocyte', label: 'Stomatocyte' },
                    { key: 'rouleaux', label: 'Rouleaux' },
                    { key: 'howellJolly', label: 'Howell-Jolly' },
                    { key: 'basophilicStippling', label: 'Baso Stippling' },
                    { key: 'polychromasia', label: 'Polychromasia' },
                  ].map((morph) => (
                    <div key={morph.key} className="morph-slider-row">
                      <span className="morph-label">{morph.label}</span>
                      <input
                        type="range"
                        min="0"
                        max="50"
                        value={rbcMorphologies[morph.key]}
                        onChange={(e) => updateRbcMorphology(morph.key, Number(e.target.value))}
                        className="morph-slider rbc-morph-slider"
                      />
                      <span className="morph-percent">{rbcMorphologies[morph.key]}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* WBC Morphologies */}
              <div className="morph-section">
                <h4 className="morph-section-title wbc-morph-title">WBC Morphology</h4>
                <div className="morph-sliders">
                  {[
                    { key: 'bandNeutrophil', label: 'Band Neut' },
                    { key: 'hypersegmented', label: 'Hyperseg' },
                    { key: 'toxicGranulation', label: 'Toxic Gran' },
                    { key: 'dohleBodies', label: 'Döhle Bodies' },
                    { key: 'atypicalLymph', label: 'Atypical Lymph' },
                    { key: 'blast', label: 'Blast' },
                    { key: 'smudgeCell', label: 'Smudge Cell' },
                    { key: 'auerRod', label: 'Auer Rod' },
                  ].map((morph) => (
                    <div key={morph.key} className="morph-slider-row">
                      <span className="morph-label">{morph.label}</span>
                      <input
                        type="range"
                        min="0"
                        max="50"
                        value={wbcMorphologies[morph.key]}
                        onChange={(e) => updateWbcMorphology(morph.key, Number(e.target.value))}
                        className="morph-slider wbc-morph-slider"
                      />
                      <span className="morph-percent">{wbcMorphologies[morph.key]}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Performance Stats - collapsible, minimized by default */}
      <div className={`perf-stats-panel ${showPerfStats ? 'expanded' : 'collapsed'}`}>
        <button className="perf-stats-toggle" onClick={() => setShowPerfStats(!showPerfStats)}>
          <span className="toggle-icon">{showPerfStats ? '▼' : '▶'}</span>
          <span>Performance Stats</span>
          <span className="fps-badge" style={{ color: getPerformanceColor() }}>
            {fps} FPS
          </span>
        </button>

        {showPerfStats && (
          <div className="perf-stats-content">
            <div className="stat-section">
              <div className="stat-row">
                <span className="stat-label">Level:</span>
                <span className="stat-value">{getPerformanceLabel()}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">CPU Cores:</span>
                <span className="stat-value">{hardwareInfo.cores}</span>
              </div>
              {hardwareInfo.memory && (
                <div className="stat-row">
                  <span className="stat-label">Memory:</span>
                  <span className="stat-value">{hardwareInfo.memory} GB</span>
                </div>
              )}
              {hardwareInfo.gpu && (
                <div className="stat-row gpu-row">
                  <span className="stat-label">GPU:</span>
                  <span className="stat-value gpu-value">{hardwareInfo.gpu}</span>
                </div>
              )}
            </div>

            <div className="stat-section">
              <h4>Density Control</h4>
              <div className="density-controls">
                {densityOptions.map((option) => (
                  <button
                    key={option.value || 'auto'}
                    className={`density-btn ${manualDensity === option.value ? 'active' : ''}`}
                    onClick={() => setManualDensity(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="stat-row">
                <span className="stat-label">Current:</span>
                <span className="stat-value density-value">{currentDensity}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Cells:</span>
                <span className="stat-value">{cellCount}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Title overlay */}
      <div className="viewer-title">
        <h1>Peripheral Blood Smear</h1>
        <p>Interactive visualization of blood cell morphology</p>
      </div>

      {/* Copyright notice */}
      <div className="viewer-copyright">
        <p>Created by Eric Perkey, MD-PhD</p>
        <p>© {new Date().getFullYear()} All Rights Reserved</p>
      </div>
    </div>
  );
}

export default BloodSmearViewer;
