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
  // Check if mobile on initial render
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  const [showRbcPanel, setShowRbcPanel] = useState(!isMobile); // Collapsed on mobile, expanded on desktop
  const [showPltPanel, setShowPltPanel] = useState(false); // PLT panel collapsed by default
  const [showWbcPanel, setShowWbcPanel] = useState(false); // WBC panel collapsed by default
  const [showMorphPanel, setShowMorphPanel] = useState(false); // Morphology panel collapsed by default
  const [showMobileInfo, setShowMobileInfo] = useState(false); // Mobile info dropdown

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
    myelocyte: 0,
    metamyelocyte: 0,
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
        // Prevent page scroll while panning the smear
        e.preventDefault();
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

  // Keyboard controls for accessibility
  const handleKeyDown = useCallback(
    (e) => {
      const panStep = 50;
      const maxPan = (currentZoom - 1) * 300;

      switch (e.key) {
        // Zoom controls
        case '+':
        case '=':
          e.preventDefault();
          if (objective === '10x') handleObjectiveChange('40x');
          else if (objective === '40x') handleObjectiveChange('100x');
          break;
        case '-':
        case '_':
          e.preventDefault();
          if (objective === '100x') handleObjectiveChange('40x');
          else if (objective === '40x') handleObjectiveChange('10x');
          break;

        // Pan controls (only when zoomed)
        case 'ArrowUp':
          if (currentZoom > 1) {
            e.preventDefault();
            setPanOffset((prev) => ({
              ...prev,
              y: Math.min(maxPan, prev.y + panStep),
            }));
          }
          break;
        case 'ArrowDown':
          if (currentZoom > 1) {
            e.preventDefault();
            setPanOffset((prev) => ({
              ...prev,
              y: Math.max(-maxPan, prev.y - panStep),
            }));
          }
          break;
        case 'ArrowLeft':
          if (currentZoom > 1) {
            e.preventDefault();
            setPanOffset((prev) => ({
              ...prev,
              x: Math.min(maxPan, prev.x + panStep),
            }));
          }
          break;
        case 'ArrowRight':
          if (currentZoom > 1) {
            e.preventDefault();
            setPanOffset((prev) => ({
              ...prev,
              x: Math.max(-maxPan, prev.x - panStep),
            }));
          }
          break;

        // Pause/Play
        case ' ':
          e.preventDefault();
          togglePause();
          break;

        // Reset pan position
        case 'Home':
          e.preventDefault();
          setPanOffset({ x: 0, y: 0 });
          break;

        default:
          break;
      }
    },
    [currentZoom, objective, handleObjectiveChange, togglePause]
  );

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

  // Calculate absolute WBC counts for each cell type
  const getAbsoluteWbcCount = (type) => {
    const total = Object.values(wbcDifferential).reduce((a, b) => a + b, 0);
    const percent = total > 0 ? wbcDifferential[type] / total : 0;
    return Math.round(wbcPerUL * percent);
  };

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

  // Clinical presets - organized by primary cell line affected
  const morphologyPresets = [
    // === NORMAL ===
    {
      name: 'Normal',
      desc: 'Healthy blood - no abnormal morphology',
      rbcCount: 5000000, mcv: 90, rdw: 13, nrbc: 0,
      pltCount: 250000,
      wbcCount: 7500,
      wbcDiff: { neutrophil: 60, lymphocyte: 30, monocyte: 5, eosinophil: 3, basophil: 2 },
      rbc: { spherocyte: 0, targetCell: 0, schistocyte: 0, sickleCell: 0, teardrop: 0, elliptocyte: 0, biteCell: 0, burrCell: 0, acanthocyte: 0, stomatocyte: 0, rouleaux: 0, howellJolly: 0, basophilicStippling: 0, pappenheimer: 0, polychromasia: 0 },
      wbc: { bandNeutrophil: 0, hypersegmented: 0, toxicGranulation: 0, dohleBodies: 0, atypicalLymph: 0, blast: 0, smudgeCell: 0, auerRod: 0, myelocyte: 0, metamyelocyte: 0 },
      plt: { giantPlatelet: 0, plateletClump: 0, hypogranular: 0 },
    },
    // === RBC DISORDERS ===
    {
      name: 'IDA',
      desc: 'Iron deficiency anemia - microcytic, high RDW',
      rbcCount: 3800000, mcv: 70, rdw: 19, nrbc: 0,
      pltCount: 420000,
      wbcCount: 7000,
      wbcDiff: { neutrophil: 60, lymphocyte: 30, monocyte: 5, eosinophil: 3, basophil: 2 },
      rbc: { spherocyte: 0, targetCell: 10, schistocyte: 0, sickleCell: 0, teardrop: 0, elliptocyte: 20, biteCell: 0, burrCell: 0, acanthocyte: 0, stomatocyte: 0, rouleaux: 0, howellJolly: 0, basophilicStippling: 0, pappenheimer: 0, polychromasia: 5 },
      wbc: { bandNeutrophil: 0, hypersegmented: 0, toxicGranulation: 0, dohleBodies: 0, atypicalLymph: 0, blast: 0, smudgeCell: 0, auerRod: 0, myelocyte: 0, metamyelocyte: 0 },
      plt: { giantPlatelet: 0, plateletClump: 0, hypogranular: 0 },
    },
    {
      name: 'Thal Minor',
      desc: 'Thalassemia minor - microcytic, normal RDW, high RBC',
      rbcCount: 5800000, mcv: 68, rdw: 14, nrbc: 1,
      pltCount: 260000,
      wbcCount: 7500,
      wbcDiff: { neutrophil: 60, lymphocyte: 30, monocyte: 5, eosinophil: 3, basophil: 2 },
      rbc: { spherocyte: 0, targetCell: 25, schistocyte: 0, sickleCell: 0, teardrop: 0, elliptocyte: 5, biteCell: 0, burrCell: 0, acanthocyte: 0, stomatocyte: 0, rouleaux: 0, howellJolly: 0, basophilicStippling: 5, pappenheimer: 0, polychromasia: 0 },
      wbc: { bandNeutrophil: 0, hypersegmented: 0, toxicGranulation: 0, dohleBodies: 0, atypicalLymph: 0, blast: 0, smudgeCell: 0, auerRod: 0, myelocyte: 0, metamyelocyte: 0 },
      plt: { giantPlatelet: 0, plateletClump: 0, hypogranular: 0 },
    },
    {
      name: 'ACD',
      desc: 'Anemia of chronic disease - normocytic',
      rbcCount: 3800000, mcv: 85, rdw: 14, nrbc: 0,
      pltCount: 320000,
      wbcCount: 8000,
      wbcDiff: { neutrophil: 60, lymphocyte: 30, monocyte: 6, eosinophil: 3, basophil: 1 },
      rbc: { spherocyte: 0, targetCell: 0, schistocyte: 0, sickleCell: 0, teardrop: 0, elliptocyte: 0, biteCell: 0, burrCell: 0, acanthocyte: 0, stomatocyte: 0, rouleaux: 0, howellJolly: 0, basophilicStippling: 0, pappenheimer: 0, polychromasia: 0 },
      wbc: { bandNeutrophil: 0, hypersegmented: 0, toxicGranulation: 0, dohleBodies: 0, atypicalLymph: 0, blast: 0, smudgeCell: 0, auerRod: 0, myelocyte: 0, metamyelocyte: 0 },
      plt: { giantPlatelet: 0, plateletClump: 0, hypogranular: 0 },
    },
    {
      name: 'B12/Folate',
      desc: 'Megaloblastic anemia - macrocytic',
      rbcCount: 2800000, mcv: 115, rdw: 18, nrbc: 2,
      pltCount: 100000,
      wbcCount: 3500,
      wbcDiff: { neutrophil: 55, lymphocyte: 35, monocyte: 6, eosinophil: 3, basophil: 1 },
      rbc: { spherocyte: 0, targetCell: 0, schistocyte: 0, sickleCell: 0, teardrop: 5, elliptocyte: 25, biteCell: 0, burrCell: 0, acanthocyte: 0, stomatocyte: 0, rouleaux: 0, howellJolly: 10, basophilicStippling: 5, pappenheimer: 0, polychromasia: 5 },
      wbc: { bandNeutrophil: 0, hypersegmented: 35, toxicGranulation: 0, dohleBodies: 0, atypicalLymph: 0, blast: 0, smudgeCell: 0, auerRod: 0, myelocyte: 0, metamyelocyte: 0 },
      plt: { giantPlatelet: 15, plateletClump: 0, hypogranular: 15 },
    },
    {
      name: 'Sickle Cell',
      desc: 'Sickle cell disease - functional asplenia',
      rbcCount: 3200000, mcv: 95, rdw: 20, nrbc: 5,
      pltCount: 350000,
      wbcCount: 12000,
      wbcDiff: { neutrophil: 65, lymphocyte: 25, monocyte: 7, eosinophil: 2, basophil: 1 },
      rbc: { spherocyte: 0, targetCell: 15, schistocyte: 0, sickleCell: 25, teardrop: 0, elliptocyte: 0, biteCell: 0, burrCell: 0, acanthocyte: 0, stomatocyte: 0, rouleaux: 0, howellJolly: 10, basophilicStippling: 0, pappenheimer: 0, polychromasia: 20 },
      wbc: { bandNeutrophil: 5, hypersegmented: 0, toxicGranulation: 0, dohleBodies: 0, atypicalLymph: 0, blast: 0, smudgeCell: 0, auerRod: 0, myelocyte: 0, metamyelocyte: 0 },
      plt: { giantPlatelet: 10, plateletClump: 0, hypogranular: 0 },
    },
    {
      name: 'Spherocytosis',
      desc: 'Hereditary spherocytosis - chronic hemolysis',
      rbcCount: 3500000, mcv: 82, rdw: 17, nrbc: 0,
      pltCount: 280000,
      wbcCount: 8000,
      wbcDiff: { neutrophil: 60, lymphocyte: 30, monocyte: 5, eosinophil: 3, basophil: 2 },
      rbc: { spherocyte: 35, targetCell: 0, schistocyte: 0, sickleCell: 0, teardrop: 0, elliptocyte: 0, biteCell: 0, burrCell: 0, acanthocyte: 0, stomatocyte: 0, rouleaux: 0, howellJolly: 0, basophilicStippling: 0, pappenheimer: 0, polychromasia: 20 },
      wbc: { bandNeutrophil: 0, hypersegmented: 0, toxicGranulation: 0, dohleBodies: 0, atypicalLymph: 0, blast: 0, smudgeCell: 0, auerRod: 0, myelocyte: 0, metamyelocyte: 0 },
      plt: { giantPlatelet: 0, plateletClump: 0, hypogranular: 0 },
    },
    {
      name: 'G6PD Crisis',
      desc: 'Oxidative hemolysis - bite cells, Heinz bodies',
      rbcCount: 2500000, mcv: 100, rdw: 22, nrbc: 5,
      pltCount: 280000,
      wbcCount: 12000,
      wbcDiff: { neutrophil: 70, lymphocyte: 20, monocyte: 7, eosinophil: 2, basophil: 1 },
      rbc: { spherocyte: 5, targetCell: 0, schistocyte: 5, sickleCell: 0, teardrop: 0, elliptocyte: 0, biteCell: 30, burrCell: 0, acanthocyte: 0, stomatocyte: 0, rouleaux: 0, howellJolly: 0, basophilicStippling: 0, pappenheimer: 0, polychromasia: 20 },
      wbc: { bandNeutrophil: 5, hypersegmented: 0, toxicGranulation: 0, dohleBodies: 0, atypicalLymph: 0, blast: 0, smudgeCell: 0, auerRod: 0, myelocyte: 0, metamyelocyte: 0 },
      plt: { giantPlatelet: 5, plateletClump: 0, hypogranular: 0 },
    },
    {
      name: 'MAHA/TTP',
      desc: 'Microangiopathic hemolytic anemia - schistocytes',
      rbcCount: 2800000, mcv: 95, rdw: 22, nrbc: 3,
      pltCount: 25000,
      wbcCount: 9000,
      wbcDiff: { neutrophil: 70, lymphocyte: 20, monocyte: 7, eosinophil: 2, basophil: 1 },
      rbc: { spherocyte: 5, targetCell: 0, schistocyte: 30, sickleCell: 0, teardrop: 0, elliptocyte: 0, biteCell: 0, burrCell: 0, acanthocyte: 0, stomatocyte: 0, rouleaux: 0, howellJolly: 0, basophilicStippling: 0, pappenheimer: 0, polychromasia: 20 },
      wbc: { bandNeutrophil: 5, hypersegmented: 0, toxicGranulation: 0, dohleBodies: 0, atypicalLymph: 0, blast: 0, smudgeCell: 0, auerRod: 0, myelocyte: 0, metamyelocyte: 0 },
      plt: { giantPlatelet: 30, plateletClump: 0, hypogranular: 0 },
    },
    {
      name: 'Lead Poisoning',
      desc: 'Basophilic stippling - impaired heme synthesis',
      rbcCount: 3800000, mcv: 78, rdw: 16, nrbc: 0,
      pltCount: 250000,
      wbcCount: 7000,
      wbcDiff: { neutrophil: 60, lymphocyte: 30, monocyte: 5, eosinophil: 3, basophil: 2 },
      rbc: { spherocyte: 0, targetCell: 0, schistocyte: 0, sickleCell: 0, teardrop: 0, elliptocyte: 0, biteCell: 0, burrCell: 0, acanthocyte: 0, stomatocyte: 0, rouleaux: 0, howellJolly: 0, basophilicStippling: 40, pappenheimer: 0, polychromasia: 10 },
      wbc: { bandNeutrophil: 0, hypersegmented: 0, toxicGranulation: 0, dohleBodies: 0, atypicalLymph: 0, blast: 0, smudgeCell: 0, auerRod: 0, myelocyte: 0, metamyelocyte: 0 },
      plt: { giantPlatelet: 0, plateletClump: 0, hypogranular: 0 },
    },
    {
      name: 'Polycythemia',
      desc: 'Elevated RBC count - erythrocytosis',
      rbcCount: 7000000, mcv: 88, rdw: 13, nrbc: 0,
      pltCount: 280000,
      wbcCount: 9000,
      wbcDiff: { neutrophil: 62, lymphocyte: 28, monocyte: 6, eosinophil: 3, basophil: 1 },
      rbc: { spherocyte: 0, targetCell: 0, schistocyte: 0, sickleCell: 0, teardrop: 0, elliptocyte: 0, biteCell: 0, burrCell: 0, acanthocyte: 0, stomatocyte: 0, rouleaux: 0, howellJolly: 0, basophilicStippling: 0, pappenheimer: 0, polychromasia: 0 },
      wbc: { bandNeutrophil: 0, hypersegmented: 0, toxicGranulation: 0, dohleBodies: 0, atypicalLymph: 0, blast: 0, smudgeCell: 0, auerRod: 0, myelocyte: 0, metamyelocyte: 0 },
      plt: { giantPlatelet: 0, plateletClump: 0, hypogranular: 0 },
    },
    {
      name: 'AIHA (Warm)',
      desc: 'Warm autoimmune hemolytic anemia - DAT positive',
      rbcCount: 3000000, mcv: 105, rdw: 20, nrbc: 3,
      pltCount: 200000,
      wbcCount: 10000,
      wbcDiff: { neutrophil: 60, lymphocyte: 30, monocyte: 6, eosinophil: 3, basophil: 1 },
      rbc: { spherocyte: 25, targetCell: 0, schistocyte: 0, sickleCell: 0, teardrop: 0, elliptocyte: 0, biteCell: 0, burrCell: 0, acanthocyte: 0, stomatocyte: 0, rouleaux: 0, howellJolly: 0, basophilicStippling: 0, pappenheimer: 0, polychromasia: 25 },
      wbc: { bandNeutrophil: 0, hypersegmented: 0, toxicGranulation: 0, dohleBodies: 0, atypicalLymph: 0, blast: 0, smudgeCell: 0, auerRod: 0, myelocyte: 0, metamyelocyte: 0 },
      plt: { giantPlatelet: 0, plateletClump: 0, hypogranular: 0 },
    },
    {
      name: 'Elliptocytosis',
      desc: 'Hereditary elliptocytosis - membrane defect',
      rbcCount: 4200000, mcv: 88, rdw: 15, nrbc: 0,
      pltCount: 250000,
      wbcCount: 7500,
      wbcDiff: { neutrophil: 60, lymphocyte: 30, monocyte: 5, eosinophil: 3, basophil: 2 },
      rbc: { spherocyte: 0, targetCell: 0, schistocyte: 0, sickleCell: 0, teardrop: 0, elliptocyte: 40, biteCell: 0, burrCell: 0, acanthocyte: 0, stomatocyte: 5, rouleaux: 0, howellJolly: 0, basophilicStippling: 0, pappenheimer: 0, polychromasia: 5 },
      wbc: { bandNeutrophil: 0, hypersegmented: 0, toxicGranulation: 0, dohleBodies: 0, atypicalLymph: 0, blast: 0, smudgeCell: 0, auerRod: 0, myelocyte: 0, metamyelocyte: 0 },
      plt: { giantPlatelet: 0, plateletClump: 0, hypogranular: 0 },
    },
    {
      name: 'Uremia',
      desc: 'Renal failure - burr cells (echinocytes)',
      rbcCount: 3200000, mcv: 90, rdw: 15, nrbc: 0,
      pltCount: 180000,
      wbcCount: 7000,
      wbcDiff: { neutrophil: 65, lymphocyte: 25, monocyte: 6, eosinophil: 3, basophil: 1 },
      rbc: { spherocyte: 0, targetCell: 0, schistocyte: 0, sickleCell: 0, teardrop: 0, elliptocyte: 0, biteCell: 0, burrCell: 35, acanthocyte: 5, stomatocyte: 0, rouleaux: 0, howellJolly: 0, basophilicStippling: 0, pappenheimer: 0, polychromasia: 0 },
      wbc: { bandNeutrophil: 0, hypersegmented: 0, toxicGranulation: 0, dohleBodies: 0, atypicalLymph: 0, blast: 0, smudgeCell: 0, auerRod: 0, myelocyte: 0, metamyelocyte: 0 },
      plt: { giantPlatelet: 5, plateletClump: 0, hypogranular: 10 },
    },
    {
      name: 'Post-splenectomy',
      desc: 'Asplenia - Howell-Jolly bodies, targets',
      rbcCount: 5200000, mcv: 90, rdw: 14, nrbc: 0,
      pltCount: 450000,
      wbcCount: 12000,
      wbcDiff: { neutrophil: 55, lymphocyte: 35, monocyte: 6, eosinophil: 3, basophil: 1 },
      rbc: { spherocyte: 0, targetCell: 15, schistocyte: 0, sickleCell: 0, teardrop: 0, elliptocyte: 0, biteCell: 0, burrCell: 0, acanthocyte: 5, stomatocyte: 0, rouleaux: 0, howellJolly: 20, basophilicStippling: 5, pappenheimer: 5, polychromasia: 0 },
      wbc: { bandNeutrophil: 0, hypersegmented: 0, toxicGranulation: 0, dohleBodies: 0, atypicalLymph: 0, blast: 0, smudgeCell: 0, auerRod: 0, myelocyte: 0, metamyelocyte: 0 },
      plt: { giantPlatelet: 10, plateletClump: 5, hypogranular: 0 },
    },
    // === WBC DISORDERS ===
    {
      name: 'Leukocytosis',
      desc: 'Elevated WBC - bacterial infection pattern',
      rbcCount: 4800000, mcv: 90, rdw: 13, nrbc: 0,
      pltCount: 280000,
      wbcCount: 22000,
      wbcDiff: { neutrophil: 78, lymphocyte: 15, monocyte: 5, eosinophil: 1, basophil: 1 },
      rbc: { spherocyte: 0, targetCell: 0, schistocyte: 0, sickleCell: 0, teardrop: 0, elliptocyte: 0, biteCell: 0, burrCell: 0, acanthocyte: 0, stomatocyte: 0, rouleaux: 0, howellJolly: 0, basophilicStippling: 0, pappenheimer: 0, polychromasia: 0 },
      wbc: { bandNeutrophil: 15, hypersegmented: 0, toxicGranulation: 10, dohleBodies: 0, atypicalLymph: 0, blast: 0, smudgeCell: 0, auerRod: 0, myelocyte: 0, metamyelocyte: 0 },
      plt: { giantPlatelet: 0, plateletClump: 0, hypogranular: 0 },
    },
    {
      name: 'Lymphocytosis',
      desc: 'Viral infection - lymphocyte predominant',
      rbcCount: 4800000, mcv: 90, rdw: 13, nrbc: 0,
      pltCount: 200000,
      wbcCount: 15000,
      wbcDiff: { neutrophil: 25, lymphocyte: 70, monocyte: 3, eosinophil: 1, basophil: 1 },
      rbc: { spherocyte: 0, targetCell: 0, schistocyte: 0, sickleCell: 0, teardrop: 0, elliptocyte: 0, biteCell: 0, burrCell: 0, acanthocyte: 0, stomatocyte: 0, rouleaux: 0, howellJolly: 0, basophilicStippling: 0, pappenheimer: 0, polychromasia: 0 },
      wbc: { bandNeutrophil: 0, hypersegmented: 0, toxicGranulation: 0, dohleBodies: 0, atypicalLymph: 15, blast: 0, smudgeCell: 0, auerRod: 0, myelocyte: 0, metamyelocyte: 0 },
      plt: { giantPlatelet: 0, plateletClump: 0, hypogranular: 0 },
    },
    {
      name: 'Eosinophilia',
      desc: 'Allergic or parasitic - elevated eosinophils',
      rbcCount: 4800000, mcv: 90, rdw: 13, nrbc: 0,
      pltCount: 250000,
      wbcCount: 12000,
      wbcDiff: { neutrophil: 45, lymphocyte: 25, monocyte: 3, eosinophil: 25, basophil: 2 },
      rbc: { spherocyte: 0, targetCell: 0, schistocyte: 0, sickleCell: 0, teardrop: 0, elliptocyte: 0, biteCell: 0, burrCell: 0, acanthocyte: 0, stomatocyte: 0, rouleaux: 0, howellJolly: 0, basophilicStippling: 0, pappenheimer: 0, polychromasia: 0 },
      wbc: { bandNeutrophil: 0, hypersegmented: 0, toxicGranulation: 0, dohleBodies: 0, atypicalLymph: 0, blast: 0, smudgeCell: 0, auerRod: 0, myelocyte: 0, metamyelocyte: 0 },
      plt: { giantPlatelet: 0, plateletClump: 0, hypogranular: 0 },
    },
    {
      name: 'Sepsis',
      desc: 'Bacterial sepsis - toxic changes, left shift',
      rbcCount: 4000000, mcv: 88, rdw: 15, nrbc: 2,
      pltCount: 90000,
      wbcCount: 28000,
      wbcDiff: { neutrophil: 85, lymphocyte: 8, monocyte: 5, eosinophil: 1, basophil: 1 },
      rbc: { spherocyte: 0, targetCell: 0, schistocyte: 8, sickleCell: 0, teardrop: 0, elliptocyte: 0, biteCell: 0, burrCell: 5, acanthocyte: 0, stomatocyte: 0, rouleaux: 0, howellJolly: 0, basophilicStippling: 0, pappenheimer: 0, polychromasia: 0 },
      wbc: { bandNeutrophil: 30, hypersegmented: 0, toxicGranulation: 45, dohleBodies: 25, atypicalLymph: 0, blast: 0, smudgeCell: 0, auerRod: 0, myelocyte: 0, metamyelocyte: 0 },
      plt: { giantPlatelet: 20, plateletClump: 5, hypogranular: 15 },
    },
    {
      name: 'Viral (Mono)',
      desc: 'Infectious mononucleosis - atypical lymphocytosis',
      rbcCount: 4800000, mcv: 90, rdw: 13, nrbc: 0,
      pltCount: 150000,
      wbcCount: 15000,
      wbcDiff: { neutrophil: 25, lymphocyte: 65, monocyte: 8, eosinophil: 1, basophil: 1 },
      rbc: { spherocyte: 0, targetCell: 0, schistocyte: 0, sickleCell: 0, teardrop: 0, elliptocyte: 0, biteCell: 0, burrCell: 0, acanthocyte: 0, stomatocyte: 0, rouleaux: 0, howellJolly: 0, basophilicStippling: 0, pappenheimer: 0, polychromasia: 0 },
      wbc: { bandNeutrophil: 0, hypersegmented: 0, toxicGranulation: 0, dohleBodies: 0, atypicalLymph: 45, blast: 0, smudgeCell: 0, auerRod: 0, myelocyte: 0, metamyelocyte: 0 },
      plt: { giantPlatelet: 5, plateletClump: 0, hypogranular: 0 },
    },
    {
      name: 'CLL',
      desc: 'Chronic lymphocytic leukemia - smudge cells',
      rbcCount: 4200000, mcv: 92, rdw: 14, nrbc: 0,
      pltCount: 120000,
      wbcCount: 85000,
      wbcDiff: { neutrophil: 15, lymphocyte: 80, monocyte: 3, eosinophil: 1, basophil: 1 },
      rbc: { spherocyte: 0, targetCell: 0, schistocyte: 0, sickleCell: 0, teardrop: 0, elliptocyte: 0, biteCell: 0, burrCell: 0, acanthocyte: 0, stomatocyte: 0, rouleaux: 0, howellJolly: 0, basophilicStippling: 0, pappenheimer: 0, polychromasia: 0 },
      wbc: { bandNeutrophil: 0, hypersegmented: 0, toxicGranulation: 0, dohleBodies: 0, atypicalLymph: 10, blast: 0, smudgeCell: 40, auerRod: 0, myelocyte: 0, metamyelocyte: 0 },
      plt: { giantPlatelet: 0, plateletClump: 5, hypogranular: 0 },
    },
    {
      name: 'AML',
      desc: 'Acute myeloid leukemia - blasts, Auer rods',
      rbcCount: 2800000, mcv: 95, rdw: 16, nrbc: 3,
      pltCount: 35000,
      wbcCount: 45000,
      wbcDiff: { neutrophil: 20, lymphocyte: 15, monocyte: 5, eosinophil: 0, basophil: 0 },
      rbc: { spherocyte: 0, targetCell: 0, schistocyte: 0, sickleCell: 0, teardrop: 0, elliptocyte: 0, biteCell: 0, burrCell: 0, acanthocyte: 0, stomatocyte: 0, rouleaux: 0, howellJolly: 0, basophilicStippling: 0, pappenheimer: 0, polychromasia: 5 },
      wbc: { bandNeutrophil: 0, hypersegmented: 0, toxicGranulation: 0, dohleBodies: 0, atypicalLymph: 0, blast: 55, smudgeCell: 0, auerRod: 20, myelocyte: 0, metamyelocyte: 0 },
      plt: { giantPlatelet: 10, plateletClump: 0, hypogranular: 30 },
    },
    {
      name: 'APL',
      desc: 'Acute promyelocytic leukemia - t(15;17), DIC',
      rbcCount: 3000000, mcv: 92, rdw: 15, nrbc: 2,
      pltCount: 20000,
      wbcCount: 12000,
      wbcDiff: { neutrophil: 15, lymphocyte: 20, monocyte: 5, eosinophil: 0, basophil: 0 },
      rbc: { spherocyte: 0, targetCell: 0, schistocyte: 18, sickleCell: 0, teardrop: 0, elliptocyte: 0, biteCell: 0, burrCell: 5, acanthocyte: 0, stomatocyte: 0, rouleaux: 0, howellJolly: 0, basophilicStippling: 0, pappenheimer: 0, polychromasia: 12 },
      wbc: { bandNeutrophil: 0, hypersegmented: 0, toxicGranulation: 0, dohleBodies: 0, atypicalLymph: 0, blast: 30, smudgeCell: 0, auerRod: 45, myelocyte: 0, metamyelocyte: 0 },
      plt: { giantPlatelet: 20, plateletClump: 5, hypogranular: 25 },
    },
    {
      name: 'ALL',
      desc: 'Acute lymphoblastic leukemia - lymphoid blasts',
      rbcCount: 3000000, mcv: 92, rdw: 15, nrbc: 2,
      pltCount: 30000,
      wbcCount: 35000,
      wbcDiff: { neutrophil: 15, lymphocyte: 25, monocyte: 3, eosinophil: 0, basophil: 0 },
      rbc: { spherocyte: 0, targetCell: 0, schistocyte: 0, sickleCell: 0, teardrop: 0, elliptocyte: 0, biteCell: 0, burrCell: 0, acanthocyte: 0, stomatocyte: 0, rouleaux: 0, howellJolly: 0, basophilicStippling: 0, pappenheimer: 0, polychromasia: 5 },
      wbc: { bandNeutrophil: 0, hypersegmented: 0, toxicGranulation: 0, dohleBodies: 0, atypicalLymph: 0, blast: 55, smudgeCell: 0, auerRod: 0, myelocyte: 0, metamyelocyte: 0 },
      plt: { giantPlatelet: 10, plateletClump: 0, hypogranular: 20 },
    },
    {
      name: 'CML',
      desc: 'Chronic myeloid leukemia - Ph+, full myeloid spectrum',
      rbcCount: 3800000, mcv: 90, rdw: 14, nrbc: 2,
      pltCount: 450000,
      wbcCount: 150000,
      wbcDiff: { neutrophil: 55, lymphocyte: 10, monocyte: 5, eosinophil: 8, basophil: 12 },
      rbc: { spherocyte: 0, targetCell: 0, schistocyte: 0, sickleCell: 0, teardrop: 5, elliptocyte: 0, biteCell: 0, burrCell: 0, acanthocyte: 0, stomatocyte: 0, rouleaux: 0, howellJolly: 0, basophilicStippling: 5, pappenheimer: 0, polychromasia: 5 },
      wbc: { bandNeutrophil: 20, hypersegmented: 0, toxicGranulation: 0, dohleBodies: 0, atypicalLymph: 0, blast: 5, smudgeCell: 0, auerRod: 0, myelocyte: 15, metamyelocyte: 12 },
      plt: { giantPlatelet: 25, plateletClump: 15, hypogranular: 5 },
    },
    {
      name: 'Chemo Neutropenia',
      desc: 'Post-chemotherapy - severe neutropenia',
      rbcCount: 3200000, mcv: 98, rdw: 15, nrbc: 0,
      pltCount: 65000,
      wbcCount: 1800,
      wbcDiff: { neutrophil: 25, lymphocyte: 65, monocyte: 8, eosinophil: 1, basophil: 1 },
      rbc: { spherocyte: 0, targetCell: 0, schistocyte: 0, sickleCell: 0, teardrop: 0, elliptocyte: 0, biteCell: 0, burrCell: 0, acanthocyte: 0, stomatocyte: 0, rouleaux: 0, howellJolly: 0, basophilicStippling: 0, pappenheimer: 0, polychromasia: 5 },
      wbc: { bandNeutrophil: 0, hypersegmented: 5, toxicGranulation: 0, dohleBodies: 0, atypicalLymph: 0, blast: 0, smudgeCell: 0, auerRod: 0, myelocyte: 0, metamyelocyte: 0 },
      plt: { giantPlatelet: 10, plateletClump: 0, hypogranular: 5 },
    },
    // === PLT DISORDERS ===
    {
      name: 'Thrombocytosis',
      desc: 'Reactive thrombocytosis - post-surgery/inflammation',
      rbcCount: 4800000, mcv: 90, rdw: 13, nrbc: 0,
      pltCount: 550000,
      wbcCount: 10000,
      wbcDiff: { neutrophil: 65, lymphocyte: 25, monocyte: 6, eosinophil: 3, basophil: 1 },
      rbc: { spherocyte: 0, targetCell: 0, schistocyte: 0, sickleCell: 0, teardrop: 0, elliptocyte: 0, biteCell: 0, burrCell: 0, acanthocyte: 0, stomatocyte: 0, rouleaux: 0, howellJolly: 0, basophilicStippling: 0, pappenheimer: 0, polychromasia: 0 },
      wbc: { bandNeutrophil: 5, hypersegmented: 0, toxicGranulation: 0, dohleBodies: 0, atypicalLymph: 0, blast: 0, smudgeCell: 0, auerRod: 0, myelocyte: 0, metamyelocyte: 0 },
      plt: { giantPlatelet: 5, plateletClump: 5, hypogranular: 0 },
    },
    {
      name: 'ITP',
      desc: 'Immune thrombocytopenia - large platelets',
      rbcCount: 4800000, mcv: 90, rdw: 13, nrbc: 0,
      pltCount: 15000,
      wbcCount: 7500,
      wbcDiff: { neutrophil: 60, lymphocyte: 30, monocyte: 5, eosinophil: 3, basophil: 2 },
      rbc: { spherocyte: 0, targetCell: 0, schistocyte: 0, sickleCell: 0, teardrop: 0, elliptocyte: 0, biteCell: 0, burrCell: 0, acanthocyte: 0, stomatocyte: 0, rouleaux: 0, howellJolly: 0, basophilicStippling: 0, pappenheimer: 0, polychromasia: 0 },
      wbc: { bandNeutrophil: 0, hypersegmented: 0, toxicGranulation: 0, dohleBodies: 0, atypicalLymph: 0, blast: 0, smudgeCell: 0, auerRod: 0, myelocyte: 0, metamyelocyte: 0 },
      plt: { giantPlatelet: 40, plateletClump: 0, hypogranular: 0 },
    },
    // === MULTI-LINEAGE DISORDERS ===
    {
      name: 'Myelofibrosis',
      desc: 'Primary myelofibrosis - leukoerythroblastic picture',
      rbcCount: 3000000, mcv: 95, rdw: 22, nrbc: 15,
      pltCount: 450000,
      wbcCount: 25000,
      wbcDiff: { neutrophil: 70, lymphocyte: 15, monocyte: 8, eosinophil: 4, basophil: 3 },
      rbc: { spherocyte: 0, targetCell: 5, schistocyte: 5, sickleCell: 0, teardrop: 35, elliptocyte: 10, biteCell: 0, burrCell: 0, acanthocyte: 0, stomatocyte: 0, rouleaux: 0, howellJolly: 0, basophilicStippling: 5, pappenheimer: 0, polychromasia: 15 },
      wbc: { bandNeutrophil: 15, hypersegmented: 0, toxicGranulation: 0, dohleBodies: 0, atypicalLymph: 0, blast: 8, smudgeCell: 0, auerRod: 0, myelocyte: 0, metamyelocyte: 0 },
      plt: { giantPlatelet: 35, plateletClump: 15, hypogranular: 5 },
    },
    {
      name: 'ET/PV',
      desc: 'MPN - thrombocytosis/erythrocytosis',
      rbcCount: 6500000, mcv: 85, rdw: 14, nrbc: 0,
      pltCount: 650000,
      wbcCount: 15000,
      wbcDiff: { neutrophil: 70, lymphocyte: 20, monocyte: 5, eosinophil: 3, basophil: 2 },
      rbc: { spherocyte: 0, targetCell: 0, schistocyte: 0, sickleCell: 0, teardrop: 5, elliptocyte: 0, biteCell: 0, burrCell: 0, acanthocyte: 0, stomatocyte: 0, rouleaux: 0, howellJolly: 0, basophilicStippling: 5, pappenheimer: 0, polychromasia: 5 },
      wbc: { bandNeutrophil: 5, hypersegmented: 0, toxicGranulation: 0, dohleBodies: 0, atypicalLymph: 0, blast: 0, smudgeCell: 0, auerRod: 0, myelocyte: 0, metamyelocyte: 0 },
      plt: { giantPlatelet: 40, plateletClump: 20, hypogranular: 5 },
    },
    {
      name: 'Liver Disease',
      desc: 'Cirrhosis - target cells, acanthocytes',
      rbcCount: 3500000, mcv: 100, rdw: 16, nrbc: 0,
      pltCount: 80000,
      wbcCount: 4500,
      wbcDiff: { neutrophil: 55, lymphocyte: 35, monocyte: 6, eosinophil: 3, basophil: 1 },
      rbc: { spherocyte: 0, targetCell: 25, schistocyte: 0, sickleCell: 0, teardrop: 0, elliptocyte: 0, biteCell: 0, burrCell: 0, acanthocyte: 15, stomatocyte: 10, rouleaux: 0, howellJolly: 0, basophilicStippling: 0, pappenheimer: 0, polychromasia: 0 },
      wbc: { bandNeutrophil: 0, hypersegmented: 0, toxicGranulation: 0, dohleBodies: 0, atypicalLymph: 0, blast: 0, smudgeCell: 0, auerRod: 0, myelocyte: 0, metamyelocyte: 0 },
      plt: { giantPlatelet: 5, plateletClump: 0, hypogranular: 15 },
    },
    {
      name: 'Multiple Myeloma',
      desc: 'Plasma cell neoplasm - rouleaux, anemia',
      rbcCount: 3200000, mcv: 95, rdw: 15, nrbc: 0,
      pltCount: 180000,
      wbcCount: 5500,
      wbcDiff: { neutrophil: 50, lymphocyte: 40, monocyte: 6, eosinophil: 3, basophil: 1 },
      rbc: { spherocyte: 0, targetCell: 0, schistocyte: 0, sickleCell: 0, teardrop: 0, elliptocyte: 0, biteCell: 0, burrCell: 0, acanthocyte: 0, stomatocyte: 0, rouleaux: 45, howellJolly: 0, basophilicStippling: 0, pappenheimer: 0, polychromasia: 0 },
      wbc: { bandNeutrophil: 0, hypersegmented: 0, toxicGranulation: 0, dohleBodies: 0, atypicalLymph: 0, blast: 0, smudgeCell: 0, auerRod: 0, myelocyte: 0, metamyelocyte: 0 },
      plt: { giantPlatelet: 0, plateletClump: 15, hypogranular: 5 },
    },
    {
      name: 'DIC',
      desc: 'Disseminated intravascular coagulation',
      rbcCount: 3500000, mcv: 92, rdw: 18, nrbc: 3,
      pltCount: 45000,
      wbcCount: 18000,
      wbcDiff: { neutrophil: 80, lymphocyte: 12, monocyte: 5, eosinophil: 2, basophil: 1 },
      rbc: { spherocyte: 0, targetCell: 0, schistocyte: 25, sickleCell: 0, teardrop: 0, elliptocyte: 0, biteCell: 0, burrCell: 8, acanthocyte: 0, stomatocyte: 0, rouleaux: 0, howellJolly: 0, basophilicStippling: 0, pappenheimer: 0, polychromasia: 12 },
      wbc: { bandNeutrophil: 20, hypersegmented: 0, toxicGranulation: 25, dohleBodies: 15, atypicalLymph: 0, blast: 0, smudgeCell: 0, auerRod: 0, myelocyte: 0, metamyelocyte: 0 },
      plt: { giantPlatelet: 25, plateletClump: 10, hypogranular: 20 },
    },
    {
      name: 'Pancytopenia',
      desc: 'Bone marrow failure - all lines low',
      rbcCount: 2800000, mcv: 100, rdw: 16, nrbc: 0,
      pltCount: 40000,
      wbcCount: 2500,
      wbcDiff: { neutrophil: 35, lymphocyte: 55, monocyte: 8, eosinophil: 1, basophil: 1 },
      rbc: { spherocyte: 0, targetCell: 0, schistocyte: 0, sickleCell: 0, teardrop: 0, elliptocyte: 0, biteCell: 0, burrCell: 0, acanthocyte: 0, stomatocyte: 0, rouleaux: 0, howellJolly: 0, basophilicStippling: 0, pappenheimer: 0, polychromasia: 5 },
      wbc: { bandNeutrophil: 0, hypersegmented: 0, toxicGranulation: 0, dohleBodies: 0, atypicalLymph: 0, blast: 0, smudgeCell: 0, auerRod: 0, myelocyte: 0, metamyelocyte: 0 },
      plt: { giantPlatelet: 15, plateletClump: 0, hypogranular: 0 },
    },
  ];

  // Apply a morphology preset
  const applyMorphologyPreset = (preset) => {
    // Set cell counts and indices
    if (preset.rbcCount !== undefined) setRbcPerUL(preset.rbcCount);
    if (preset.mcv !== undefined) setMcv(preset.mcv);
    if (preset.rdw !== undefined) setRdw(preset.rdw);
    if (preset.nrbc !== undefined) setNrbcPer100RBC(preset.nrbc);
    if (preset.pltCount !== undefined) setPltPerUL(preset.pltCount);
    if (preset.wbcCount !== undefined) setWbcPerUL(preset.wbcCount);
    if (preset.wbcDiff) setWbcDifferential(preset.wbcDiff);
    // Set morphologies
    if (preset.rbc) setRbcMorphologies(preset.rbc);
    if (preset.wbc) setWbcMorphologies(preset.wbc);
    if (preset.plt) setPltMorphologies(preset.plt);
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

  // Update a single PLT morphology
  const updatePltMorphology = (key, value) => {
    setPltMorphologies((prev) => ({
      ...prev,
      [key]: Math.max(0, Math.min(100, value)),
    }));
  };

  // Get nRBC status label
  const getNrbcStatus = () => {
    if (nrbcPer100RBC === 0) return { label: 'None', color: '#10b981' };
    if (nrbcPer100RBC <= 5) return { label: 'Present', color: '#f59e0b' };
    if (nrbcPer100RBC <= 15) return { label: 'Elevated', color: '#f97316' };
    return { label: 'Markedly Elevated', color: '#ef4444' };
  };

  // Get WBC status label
  const getWbcStatus = () => {
    if (wbcPerUL < 4000) return { label: 'Leukopenia', color: '#3b82f6' };
    if (wbcPerUL <= 11000) return { label: 'Normal', color: '#10b981' };
    if (wbcPerUL <= 20000) return { label: 'Mild Leukocytosis', color: '#f59e0b' };
    if (wbcPerUL <= 50000) return { label: 'Leukocytosis', color: '#f97316' };
    if (wbcPerUL <= 100000) return { label: 'Marked Leukocytosis', color: '#ef4444' };
    return { label: 'Leukemia Range', color: '#dc2626' };
  };

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
      tabIndex={0}
      role="application"
      aria-label="Interactive blood smear viewer. Use +/- to zoom, arrow keys to pan when zoomed, space to pause."
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onKeyDown={handleKeyDown}
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

      {/* Indices Panels Container - stacked in top left */}
      <div className="indices-panels-container">
        {/* RBC Indices Control - collapsible panel */}
        <div className={`rbc-control-panel ${showRbcPanel ? 'expanded' : 'collapsed'}`}>
        <button className="panel-toggle" onClick={() => setShowRbcPanel(!showRbcPanel)}>
          <span className="toggle-icon">{showRbcPanel ? '▼' : '▶'}</span>
          <span>RBC</span>
          <span className="panel-summary" style={{ color: getHgbStatus().color }}>
            Hgb {hemoglobin} g/dL
          </span>
        </button>

        {showRbcPanel && (
          <div className="panel-content">
            {/* RBC Count */}
            <div className="rbc-index-row">
              <span className="rbc-index-label">RBC</span>
              <input
                type="range"
                min="2000000"
                max="7000000"
                step="100000"
                value={rbcPerUL}
                onChange={(e) => setRbcPerUL(Number(e.target.value))}
                className="rbc-slider"
              />
              <span className="rbc-index-value">{(rbcPerUL / 1000000).toFixed(1)}<span className="unit">M/µL</span></span>
              <span className="rbc-index-status" style={{ color: getRbcStatus().color }}>
                {getRbcStatus().label}
              </span>
            </div>

            {/* Hemoglobin */}
            <div className="rbc-index-row calculated-row">
              <span className="rbc-index-label">Hgb</span>
              <div className="calculated-bar">
                <div
                  className="calculated-fill hgb-fill"
                  style={{ width: `${Math.min(100, (parseFloat(hemoglobin) / 17) * 100)}%` }}
                />
              </div>
              <span className="rbc-index-value">{hemoglobin}<span className="unit">g/dL</span></span>
              <span className="rbc-index-status" style={{ color: getHgbStatus().color }}>
                {getHgbStatus().label}
              </span>
            </div>

            {/* Hematocrit */}
            <div className="rbc-index-row calculated-row">
              <span className="rbc-index-label">Hct</span>
              <div className="calculated-bar">
                <div
                  className="calculated-fill hct-fill"
                  style={{ width: `${Math.min(100, (parseFloat(hematocrit) / 50) * 100)}%` }}
                />
              </div>
              <span className="rbc-index-value">{hematocrit}%</span>
              <span className="rbc-index-status" style={{ color: getHgbStatus().color }}>
                {parseFloat(hematocrit) < 36 ? 'Low' : parseFloat(hematocrit) <= 50 ? 'Normal' : 'High'}
              </span>
            </div>

            {/* MCV */}
            <div className="rbc-index-row">
              <span className="rbc-index-label">MCV</span>
              <input
                type="range"
                min="60"
                max="130"
                step="1"
                value={mcv}
                onChange={(e) => setMcv(Number(e.target.value))}
                className="rbc-slider mcv-slider"
              />
              <span className="rbc-index-value">{mcv} fL</span>
              <span className="rbc-index-status" style={{ color: getMcvStatus().color }}>
                {getMcvStatus().label}
              </span>
            </div>

            {/* RDW */}
            <div className="rbc-index-row">
              <span className="rbc-index-label">RDW</span>
              <input
                type="range"
                min="10"
                max="30"
                step="0.5"
                value={rdw}
                onChange={(e) => setRdw(Number(e.target.value))}
                className="rbc-slider rdw-slider"
              />
              <span className="rbc-index-value">{rdw}%</span>
              <span className="rbc-index-status" style={{ color: getRdwStatus().color }}>
                {getRdwStatus().label}
              </span>
            </div>

            {/* nRBC */}
            <div className="rbc-index-row nrbc-row">
              <span className="rbc-index-label nrbc-label">nRBC</span>
              <input
                type="range"
                min="0"
                max="30"
                step="1"
                value={nrbcPer100RBC}
                onChange={(e) => setNrbcPer100RBC(Number(e.target.value))}
                className="rbc-slider nrbc-slider"
              />
              <span className="rbc-index-value">{nrbcPer100RBC}/100</span>
              <span className="rbc-index-status" style={{ color: getNrbcStatus().color }}>
                {getNrbcStatus().label}
              </span>
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
          </div>
        )}
      </div>

      {/* PLT Control - collapsible panel */}
      <div className={`plt-control-panel ${showPltPanel ? 'expanded' : 'collapsed'}`}>
        <button className="panel-toggle plt-toggle" onClick={() => setShowPltPanel(!showPltPanel)}>
          <span className="toggle-icon">{showPltPanel ? '▼' : '▶'}</span>
          <span>PLT</span>
          <span className="panel-summary" style={{ color: getPltStatus().color }}>
            {(pltPerUL / 1000).toFixed(0)}K/µL
          </span>
        </button>

        {showPltPanel && (
          <div className="panel-content">
            <span className="panel-status" style={{ color: getPltStatus().color }}>
              {getPltStatus().label}
            </span>
            <input
              type="range"
              min="10000"
              max="800000"
              step="10000"
              value={pltPerUL}
              onChange={(e) => setPltPerUL(Number(e.target.value))}
              className="plt-slider"
            />

            {/* PLT Morphologies */}
            <div className="morph-section">
              <h4 className="morph-section-title plt-morph-title">PLT Morphology</h4>
              <div className="morph-sliders">
                {[
                  { key: 'giantPlatelet', label: 'Giant PLT' },
                  { key: 'plateletClump', label: 'PLT Clump' },
                  { key: 'hypogranular', label: 'Hypogranular' },
                ].map((morph) => (
                  <div key={morph.key} className="morph-slider-row">
                    <span className="morph-label">{morph.label}</span>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={pltMorphologies[morph.key]}
                      onChange={(e) => updatePltMorphology(morph.key, Number(e.target.value))}
                      className="morph-slider plt-morph-slider"
                    />
                    <span className="morph-percent">{pltMorphologies[morph.key]}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* WBC Count Control - collapsible panel */}
      <div className={`wbc-control-panel ${showWbcPanel ? 'expanded' : 'collapsed'}`}>
        <button className="panel-toggle wbc-toggle" onClick={() => setShowWbcPanel(!showWbcPanel)}>
          <span className="toggle-icon">{showWbcPanel ? '▼' : '▶'}</span>
          <span>WBC</span>
          <span className="panel-summary" style={{ color: getWbcStatus().color }}>
            {(wbcPerUL / 1000).toFixed(1)}K/µL
          </span>
        </button>

        {showWbcPanel && (
          <div className="panel-content">
            <span className="panel-status" style={{ color: getWbcStatus().color }}>
              {getWbcStatus().label}
            </span>
            <input
              type="range"
              min="1000"
              max="500000"
              step="1000"
              value={wbcPerUL}
              onChange={(e) => setWbcPerUL(Number(e.target.value))}
              className="wbc-slider"
            />

            {/* WBC Differential Control */}
            <div className="differential-section">
              <h4>WBC Differential</h4>

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
                    <span className="diff-absolute">{(getAbsoluteWbcCount(cell.key) / 1000).toFixed(1)}K</span>
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
                  { key: 'auerRod', label: 'Promyelocyte' },
                  { key: 'myelocyte', label: 'Myelocyte' },
                  { key: 'metamyelocyte', label: 'Metamyelo' },
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

        {/* Clinical Cases - collapsible panel */}
        <div className={`morph-control-panel ${showMorphPanel ? 'expanded' : 'collapsed'}`}>
          <button className="panel-toggle morph-toggle" onClick={() => setShowMorphPanel(!showMorphPanel)}>
            <span className="toggle-icon">{showMorphPanel ? '▼' : '▶'}</span>
            <span>Cases</span>
            <span className="panel-summary morph-summary">
              {Object.values(rbcMorphologies).some(v => v > 0) ||
               Object.values(wbcMorphologies).some(v => v > 0) ||
               Object.values(pltMorphologies).some(v => v > 0) ? '•' : ''}
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

      {/* Mobile info button */}
      <div
        className={`mobile-info-button ${showMobileInfo ? 'expanded' : ''}`}
        onClick={() => setShowMobileInfo(!showMobileInfo)}
        role="button"
        aria-expanded={showMobileInfo}
        aria-label="Peripheral Blood Smear information"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setShowMobileInfo(!showMobileInfo)}
      >
        <span className="mobile-info-title">Peripheral Blood Smear {showMobileInfo ? '▲' : '▼'}</span>
        {showMobileInfo && (
          <div className="mobile-info-content">
            <p>Created by Eric Perkey, MD-PhD</p>
            <p>© {new Date().getFullYear()} All Rights Reserved</p>
            <p className="mobile-info-hint">More features on desktop</p>
          </div>
        )}
      </div>

      {/* Desktop copyright notice */}
      <div className="viewer-copyright desktop-only">
        <p>Created by Eric Perkey, MD-PhD</p>
        <p>© {new Date().getFullYear()} All Rights Reserved</p>
      </div>
    </div>
  );
}

export default BloodSmearViewer;
