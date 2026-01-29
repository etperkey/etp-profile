/**
 * WORMS PARODY - Rathergood Style Animation Engine
 * With photo backgrounds and scene transitions
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONFIG = {
    FPS: 12,
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 600,
    BPM: 120,
    BOUNCE_AMOUNT: 8,
    WOBBLE_AMOUNT: 2,
    JAW_OPEN_ANGLE: 15,
};

const BEAT_INTERVAL = 60 / CONFIG.BPM;

// =============================================================================
// ASSET LOADING
// =============================================================================

const ASSETS = {
    // Characters
    rfkHead: '../assets/processed/rfk-head-clean.png',  // Full head (not jaw-separated)
    rfkMouth: '../assets/RFKmouth.png',                 // Mouth for morphing
    jayHead: '../assets/processed/jay-head-clean.png',
    jayMouth: '../assets/processed/babymouth3-clean.png',  // Baby mouth for countdown
    wormNeutral: '../assets/animation-ready/worm-neutral.png',
    wormHappy: '../assets/animation-ready/worm-happy.png',
    wormOpen: '../assets/animation-ready/worm-open.png',
    wormSmug: '../assets/animation-ready/worm-smug.png',
    wormChomp: '../assets/animation-ready/worm-chomp.png',
    duneWorm: '../assets/animation-ready/DUNE-WORM-GIANT.png',

    // Real worm photos (clipped)
    realWorm1: '../assets/animation-ready/real-worm1.png',
    realWorm2: '../assets/animation-ready/real-worm2.png',
    realWorm3: '../assets/animation-ready/real-worm3-clean.png',

    // Woodwind instruments (transparent backgrounds)
    clarinet: '../assets/Instruments/clarinet.png',
    saxophone: '../assets/Instruments/saxophone.png',
    oboe: '../assets/Instruments/oboe.png',

    // Drum kit (transparent cutout for Jay)
    drumKit: '../assets/drumset-transparent.png',

    // Backgrounds - Real photos
    bgBrain: '../assets/backgrounds/brain-tissue.jpg',
    bgBrainWorms1: '../assets/worms/brainwithworms.jpg',      // Actual brain with worms
    bgBrainWorms2: '../assets/worms/brainwithworms2.jpg',     // Brain worms variant 2
    bgBrainWorms3: '../assets/worms/brainwithworms3.jpg',     // Brain worms variant 3
    bgBrainWorms4: '../assets/backgrounds/brainbackground4.png', // Brain cross-section with lesions
    bgGraveyard: '../assets/backgrounds/graveyard.png',       // Real cemetery photo
    bgHospital: '../assets/backgrounds/hospital.png',         // Real hospital room
    bgUnderground: '../assets/backgrounds/underground.jpg',
    bgNIH: '../assets/NIH-building.jpg',                      // Actual NIH Building 1
    bgStage: '../assets/backgrounds/rockbackground.jpg',      // Rock concert crowd
    bgChaos: '../assets/backgrounds/chaos.jpg',
};

const images = {};
let assetsLoaded = 0;
let totalAssets = Object.keys(ASSETS).length;

function loadAssets(callback) {
    for (const [name, src] of Object.entries(ASSETS)) {
        const img = new Image();
        img.onload = () => {
            assetsLoaded++;
            document.getElementById('loading').textContent =
                `Loading assets... ${assetsLoaded}/${totalAssets}`;
            if (assetsLoaded === totalAssets) {
                callback();
            }
        };
        img.onerror = () => {
            console.warn(`Failed to load: ${src}`);
            assetsLoaded++;
            if (assetsLoaded === totalAssets) {
                callback();
            }
        };
        img.src = src;
        images[name] = img;
    }
}

// =============================================================================
// SCENES WITH BACKGROUNDS
// =============================================================================

const SCENES = [
    // No brains until after verse 2 (ends at 86s)
    { name: 'intro-countoff', start: 0, end: 6, bg: 'bgStage' },
    { name: 'intro-bass', start: 6, end: 16, bg: 'bgStage' },
    { name: 'intro-bass2', start: 16, end: 27, bg: 'bgStage' },
    { name: 'verse1', start: 27, end: 35, bg: 'bgUnderground' },
    { name: 'verse1-bite', start: 35, end: 41, bg: 'bgGraveyard' },
    { name: 'hook1-build', start: 41, end: 51, bg: 'bgHospital' },
    { name: 'hook1-main', start: 51, end: 57, bg: 'bgHospital' },
    { name: 'hook1-saw', start: 57, end: 68, bg: 'bgNIH' },
    { name: 'verse2', start: 68, end: 77, bg: 'bgGraveyard' },
    { name: 'verse2-decompose', start: 77, end: 86, bg: 'bgUnderground' },
    // BRAINS START HERE - after verse 2
    { name: 'hook2-inst', start: 86, end: 91, bg: 'bgBrainWorms1' },
    { name: 'hook2-main', start: 91, end: 96, bg: 'bgBrainWorms1' },
    { name: 'hook2-woodwinds', start: 96, end: 106, bg: 'bgBrainWorms2' },
    { name: 'hook2-woodwinds2', start: 106, end: 117, bg: 'bgBrainWorms3' },
    { name: 'verse3', start: 117, end: 125, bg: 'bgBrainWorms1' },
    { name: 'verse3-buried', start: 125, end: 132, bg: 'bgBrainWorms4' },
    { name: 'bridge-chaos', start: 132, end: 141, bg: 'bgChaos' },
    { name: 'climax', start: 141, end: 155, bg: 'bgBrainWorms1' },
    { name: 'climax-brain', start: 155, end: 170, bg: 'bgBrainWorms2' },
    { name: 'climax-scan', start: 170, end: 187, bg: 'bgBrainWorms4' },
    { name: 'final-refrain', start: 187, end: 195, bg: 'bgBrainWorms2' },
    { name: 'outro', start: 195, end: 208, bg: 'bgGraveyard' },
];

function getCurrentScene(time) {
    for (const scene of SCENES) {
        if (time >= scene.start && time < scene.end) {
            return scene;
        }
    }
    return SCENES[0];
}

// =============================================================================
// ANIMATION STATE
// =============================================================================

let canvas, ctx;
let audio;
let isPlaying = false;
let lastFrameTime = 0;
let frameInterval = 1000 / CONFIG.FPS;
let currentBg = null;
let bgTransition = 0;

const state = {
    rfk: {
        x: 400, y: 280, scale: 0.4,
        jawOpen: 0, bounce: 0,
        wobbleX: 0, wobbleY: 0,
        visible: false,
    },
    jay: {
        x: 650, y: 350, scale: 0.8,
        bounce: 0, wobbleX: 0, wobbleY: 0,
        visible: false, drumHit: false,
    },
    worm: {
        x: 300, y: 200, scale: 1.0,
        expression: 'neutral',
        bounce: 0, wobbleX: 0, wobbleY: 0,
        visible: false, peekAmount: 0,
    },
    worm2: {
        x: 300, y: 200, scale: 1.0,
        expression: 'happy',
        bounce: 0, wobbleX: 0, wobbleY: 0,
        visible: false, peekAmount: 0,
        separationAmount: 0,  // 0 = attached to worm1, 1 = fully separated
    },
    duneWorm: {
        x: 400, y: 800, scale: 0.8,
        visible: false, emergeAmount: 0,
    },
    realWorms: {
        visible: false,
        // Each real worm has position, rotation, which image (1-3)
        worms: [
            { x: 100, y: 500, rot: 0, img: 1, scale: 0.3 },
            { x: 700, y: 520, rot: 0.5, img: 2, scale: 0.25 },
            { x: 400, y: 550, rot: -0.3, img: 3, scale: 0.4 },
        ]
    },
    woodwindWorms: {
        visible: false,
        // Worms playing woodwind instruments (clarinet, saxophone, oboe)
        worms: [
            { x: 150, y: 350, instrument: 'clarinet', scale: 0.5 },
            { x: 400, y: 380, instrument: 'saxophone', scale: 0.5 },
            { x: 650, y: 350, instrument: 'oboe', scale: 0.5 },
        ]
    },
    screen: {
        shake: 0,
        flash: 0,
        flashColor: 'white',
    },
    sparkles: [],  // Random sparkles during climax
    floatingObjects: [],  // Flying objects (milk bottles, brains, etc.)
    musicalNotes: [],  // Notes from instruments
    blinkTimer: 0,  // For eye blinks
    isBlinking: false,
    burstParticles: [],  // Burst particles when worms appear
    worm1Burst: false,  // Track if worm1 burst has happened
    worm2Burst: false,  // Track if worm2 burst has happened
};

// End credits content
const END_CREDITS = [
    '🪱 WORMS 🪱',
    '',
    'Directed by A. Worm',
    'Produced by Brain Parasites Inc.',
    'Executive Producer: Taenia solium',
    '',
    'CAST',
    'RFK Jr .............. Himself',
    'Jay Bhattacharya .... The Drums',
    'Brain Worm .......... Kevin',
    'Brain Worm 2 ........ Kevin Jr.',
    'Dune Worm ........... Shai-Hulud Jr.',
    'Woodwind Worms ...... The Squirmettes',
    'Central Park Unit (Dead Bear) .. John',
    '',
    'MUSIC',
    '"Worms" by Viagra Boys',
    'from Cave World (2022)',
    '',
    'CATERING',
    'Raw Milk Boys Dairy',
    '(3 crew members hospitalized)',
    '(Worth it)',
    '',
    'MEDICAL ADVISORS',
    'Dr. Oz',
    'Donald Trump',
    'Donald Trump Jr.',
    '',
    'SPECIAL THANKS',
    'RFK Jr\'s Brain Worm (for the inspiration)',
    'The NIH (for the building shot)',
    'Ivermectin',
    'Beef Tallow',
    'Methylene Blue',
    'Joe Rogan',
    '',
    'SCIENTIFIC REVIEW',
    'Peer reviewed by YO MAMA',
    '',
    'DISCLAIMER',
    'No worms were harmed',
    'in the making of this film',
    '',
    'Several brains were harmed',
    '',
    'Please vaccinate your worms',
    '',
    '© 2024 Pseudoscience Pictures',
    '',
    '',
    '',
    '🪱🪱🪱 THE END 🪱🪱🪱',
    '',
    'Thanks for watching!',
    '',
    '🪱🪱🪱🪱🪱🪱🪱🪱🪱🪱',
    '',
    '(The worms will remember this)',
];

// Floating object definitions for different scenes
const FLOATING_OBJECTS = {
    hospital: [
        { text: '💊 IVERMECTIN', color: '#00ff00' },
        { text: '💙 METHYLENE BLUE', color: '#0088ff' },
        { text: '🧈 BEEF TALLOW', color: '#ffdd00' },
        { text: '🥛 RAW MILK', color: '#ffffff' },
    ],
    nih: [
        { text: '"Vaccines Cause Gas"', journal: 'The Lancet', isAcademic: true },
        { text: '"Polio Caused by Pesticides"', journal: 'Nature', isAcademic: true },
        { text: '"SSRIs Cause School Shootings"', journal: 'NEJM', isAcademic: true },
        { text: '"Poppers Cause AIDS"', journal: 'JAMA', isAcademic: true },
    ],
    chaos: [
        { text: '🥛', color: '#ffffff', isEmoji: true },
        { text: '🧠', color: '#ffaaaa', isEmoji: true },
        { text: '🪱', color: '#cc8866', isEmoji: true },
        { text: '💀', color: '#ffffff', isEmoji: true },
    ]
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function lerp(a, b, t) { return a + (b - a) * t; }
function wobble() { return (Math.random() - 0.5) * CONFIG.WOBBLE_AMOUNT * 2; }
function beatPulse(time) {
    const beatPhase = (time % BEAT_INTERVAL) / BEAT_INTERVAL;
    return Math.sin(beatPhase * Math.PI) * CONFIG.BOUNCE_AMOUNT;
}
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// =============================================================================
// DRAWING FUNCTIONS
// =============================================================================

function drawGraveyardMoon(time) {
    // Big moon with googly face watching judgmentally
    ctx.save();

    const moonX = 680;
    const moonY = 100;
    const moonRadius = 60;

    // Moon glow
    const glow = ctx.createRadialGradient(moonX, moonY, moonRadius * 0.8, moonX, moonY, moonRadius * 1.5);
    glow.addColorStop(0, 'rgba(255, 255, 200, 0.3)');
    glow.addColorStop(1, 'rgba(255, 255, 200, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonRadius * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Moon body
    ctx.fillStyle = '#ffffcc';
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ddddaa';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Moon craters
    ctx.fillStyle = '#eeeeaa';
    ctx.beginPath();
    ctx.arc(moonX - 20, moonY - 15, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(moonX + 25, moonY + 10, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(moonX - 10, moonY + 25, 10, 0, Math.PI * 2);
    ctx.fill();

    // GOOGLY EYES
    const eyeSize = 18;
    const eyeY = moonY - 10;

    // Left eye
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(moonX - 18, eyeY, eyeSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Left pupil - looking around
    const pupilX1 = Math.sin(time * 2) * eyeSize * 0.4;
    const pupilY1 = Math.cos(time * 1.7) * eyeSize * 0.4;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(moonX - 18 + pupilX1, eyeY + pupilY1, eyeSize * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Right eye
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(moonX + 18, eyeY, eyeSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Right pupil - looking around independently
    const pupilX2 = Math.sin(time * 2.3 + 0.5) * eyeSize * 0.4;
    const pupilY2 = Math.cos(time * 1.9 + 0.5) * eyeSize * 0.4;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(moonX + 18 + pupilX2, eyeY + pupilY2, eyeSize * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Judgy frown mouth
    ctx.strokeStyle = '#886644';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(moonX, moonY + 30, 20, 0.2, Math.PI - 0.2, true);  // Upside down arc = frown
    ctx.stroke();

    // Raised eyebrow (judgmental)
    ctx.strokeStyle = '#aa8866';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(moonX - 18, eyeY - 22, 15, Math.PI + 0.3, Math.PI * 2 - 0.3);
    ctx.stroke();

    ctx.restore();
}

function drawDeadBear(time) {
    // Easter egg: dead bear - more visible now
    ctx.save();
    ctx.translate(75, 520);
    ctx.rotate(-0.2 + Math.sin(time * 0.5) * 0.08);  // Wobble

    // Bigger bear emoji
    ctx.font = '50px Arial';
    ctx.fillText('🐻', -25, 0);

    // X eyes drawn over - bigger and bolder
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 4;
    // Left X
    ctx.beginPath();
    ctx.moveTo(-15, -28);
    ctx.lineTo(-3, -16);
    ctx.moveTo(-3, -28);
    ctx.lineTo(-15, -16);
    ctx.stroke();
    // Right X
    ctx.beginPath();
    ctx.moveTo(8, -28);
    ctx.lineTo(20, -16);
    ctx.moveTo(20, -28);
    ctx.lineTo(8, -16);
    ctx.stroke();

    // "RIP" text
    ctx.font = 'bold 12px "Comic Sans MS", "Chalkboard SE", "Comic Neue", cursive';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.textAlign = 'center';
    ctx.strokeText('RIP', 0, 25);
    ctx.fillText('RIP', 0, 25);

    ctx.restore();
}

function drawUndergroundExtras(time) {
    // Skulls - with rotation
    const skulls = [
        { x: 80, y: 520, baseRot: -0.3 },
        { x: 720, y: 540, baseRot: 0.4 },
        { x: 200, y: 560, baseRot: 0.2 },
        { x: 600, y: 510, baseRot: -0.5 },
    ];

    skulls.forEach((skull, i) => {
        ctx.save();
        ctx.translate(skull.x + Math.sin(time + i) * 5, skull.y + Math.cos(time * 0.8 + i) * 3);
        ctx.rotate(skull.baseRot + Math.sin(time * 0.7 + i * 1.5) * 0.2);
        ctx.font = '40px Arial';
        ctx.fillText('💀', -20, 0);
        ctx.restore();
    });

    // Rocks
    ctx.fillStyle = '#4a4a4a';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    const rocks = [
        { x: 50, y: 580, w: 60, h: 30 },
        { x: 150, y: 570, w: 40, h: 25 },
        { x: 650, y: 575, w: 55, h: 28 },
        { x: 750, y: 565, w: 45, h: 35 },
        { x: 350, y: 585, w: 35, h: 20 },
    ];

    rocks.forEach(rock => {
        ctx.beginPath();
        ctx.ellipse(rock.x, rock.y, rock.w / 2, rock.h / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    });

    // Worms crawling in dirt - with more rotation
    const worms = [
        { x: 100, y: 550, size: 0.6, baseRot: 0.5 },
        { x: 500, y: 570, size: 0.5, baseRot: -0.8 },
        { x: 300, y: 545, size: 0.7, baseRot: 0.3 },
        { x: 680, y: 555, size: 0.55, baseRot: -0.4 },
    ];

    worms.forEach((worm, i) => {
        ctx.save();
        const crawlX = worm.x + Math.sin(time * 2 + i * 2) * 25;
        const crawlY = worm.y + Math.cos(time * 1.5 + i) * 8;
        ctx.translate(crawlX, crawlY);
        ctx.scale(worm.size, worm.size);
        ctx.rotate(worm.baseRot + Math.sin(time * 1.5 + i * 1.2) * 0.5);

        // Draw simple worm shape
        ctx.strokeStyle = '#cc8866';
        ctx.fillStyle = '#ddaa88';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-30, 0);
        for (let j = 0; j < 6; j++) {
            const wx = -30 + j * 12;
            const wy = Math.sin(time * 4 + j + i) * 8;
            ctx.lineTo(wx, wy);
        }
        ctx.lineTo(40, Math.sin(time * 4 + 6 + i) * 5);
        ctx.stroke();

        // Worm body segments
        for (let j = 0; j < 5; j++) {
            const sx = -25 + j * 12;
            const sy = Math.sin(time * 4 + j + i) * 6;
            ctx.beginPath();
            ctx.ellipse(sx, sy, 8, 5, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    });

    // Bones - with animated rotation
    ctx.fillStyle = '#e8e8d8';
    ctx.strokeStyle = '#ccc';
    const bones = [
        { x: 400, y: 560, baseRot: 0.3 },
        { x: 550, y: 580, baseRot: -0.5 },
        { x: 250, y: 575, baseRot: 0.8 },
        { x: 130, y: 555, baseRot: -0.2 },
        { x: 620, y: 565, baseRot: 1.2 },
    ];

    bones.forEach((bone, i) => {
        ctx.save();
        ctx.translate(bone.x + Math.sin(time * 0.5 + i) * 4, bone.y + Math.cos(time * 0.7 + i) * 3);
        ctx.rotate(bone.baseRot + Math.sin(time * 0.6 + i * 0.8) * 0.25);
        // Simple bone shape
        ctx.beginPath();
        ctx.ellipse(-15, 0, 8, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(15, 0, 8, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(-12, -3, 24, 6);
        ctx.restore();
    });
}

function drawBackground(time, scene) {
    // Get the background image for this scene
    const bgKey = scene.bg;
    const bgImg = images[bgKey];

    if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
        // Draw background image, scaled to cover canvas
        const scale = Math.max(
            CONFIG.CANVAS_WIDTH / bgImg.width,
            CONFIG.CANVAS_HEIGHT / bgImg.height
        );
        const w = bgImg.width * scale;
        const h = bgImg.height * scale;
        const x = (CONFIG.CANVAS_WIDTH - w) / 2;
        const y = (CONFIG.CANVAS_HEIGHT - h) / 2;

        ctx.drawImage(bgImg, x, y, w, h);

        // Darken overlay for better character visibility
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    } else {
        // Fallback gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, CONFIG.CANVAS_HEIGHT);
        gradient.addColorStop(0, '#2d1b3d');
        gradient.addColorStop(1, '#1a1a2e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    }

    // Underground extras (skulls, rocks, worms)
    if (scene.bg === 'bgUnderground') {
        drawUndergroundExtras(time);
    }

    // Graveyard extras (moon with googly face, dead bear easter egg)
    if (scene.bg === 'bgGraveyard') {
        drawGraveyardMoon(time);
        drawDeadBear(time);
    }

    // Beat pulse overlay
    const pulse = beatPulse(time);
    ctx.fillStyle = `rgba(255, 107, 157, ${0.05 + pulse * 0.01})`;
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

    // Chaos effect for bridge/climax
    if (scene.name.includes('chaos') || scene.name === 'climax') {
        ctx.fillStyle = `rgba(${Math.random() * 50}, 0, ${Math.random() * 50}, 0.1)`;
        ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    }
}

function drawRFKBody(ctx, bounce, time) {
    // Simple rathergood-style body - just a basic suit shape
    const b = bounce * 0.3;

    // Simple suit torso (trapezoid)
    ctx.fillStyle = '#2a2a3a';
    ctx.beginPath();
    ctx.moveTo(-120, 100 + b);   // Left shoulder
    ctx.lineTo(120, 100 + b);    // Right shoulder
    ctx.lineTo(150, 500 + b);    // Right bottom
    ctx.lineTo(-150, 500 + b);   // Left bottom
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#1a1a2a';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Simple tie
    ctx.fillStyle = '#aa2222';
    ctx.beginPath();
    ctx.moveTo(0, 105 + b);
    ctx.lineTo(25, 130 + b);
    ctx.lineTo(15, 350 + b);
    ctx.lineTo(0, 370 + b);
    ctx.lineTo(-15, 350 + b);
    ctx.lineTo(-25, 130 + b);
    ctx.closePath();
    ctx.fill();

}

function drawRFK(time) {
    if (!state.rfk.visible) return;

    const { x, y, scale, jawOpen, bounce, wobbleX, wobbleY } = state.rfk;

    ctx.save();

    // Dancing motion - sway side to side and bob
    const danceSpeed = 3;
    const swaySide = Math.sin(time * danceSpeed) * 25;  // Side to side (bigger)
    const swayUp = Math.abs(Math.sin(time * danceSpeed * 2)) * 15;  // Bouncy up motion
    const bodyTilt = Math.sin(time * danceSpeed) * 0.1;  // Lean into the sway
    const shoulderPump = Math.sin(time * danceSpeed * 2) * 0.04;  // Shoulder pumping

    // Additional translation - figure-8 style movement
    const driftX = Math.sin(time * 1.5) * 20 + Math.cos(time * 2.3) * 15;
    const driftY = Math.cos(time * 1.8) * 18 + Math.sin(time * 2.7) * 12;

    ctx.translate(x + wobbleX + swaySide + driftX, y + bounce + wobbleY - swayUp + driftY);
    ctx.rotate(bodyTilt);
    ctx.scale(scale * (1 + shoulderPump), scale * (1 - shoulderPump * 0.5));

    // Draw body first (behind head)
    drawRFKBody(ctx, bounce, time);

    // Draw full head (scaled smaller relative to body) - moved UP 30 pixels
    if (images.rfkHead && images.rfkHead.complete) {
        const headScale = 0.65;  // Make head smaller relative to body
        const headW = images.rfkHead.width * headScale;
        const headH = images.rfkHead.height * headScale;
        ctx.drawImage(images.rfkHead, -headW / 2, -headH / 2 - 30, headW, headH);
    }

    // Draw morphing mouth overlay when singing
    if (images.rfkMouth && images.rfkMouth.complete && jawOpen > 0.05) {
        const mouthImg = images.rfkMouth;
        // Head is drawn at 0.65 scale, so use scaled head dimensions
        const headScale = 0.65;
        const headH = images.rfkHead ? images.rfkHead.height * headScale : 195;
        const headW = images.rfkHead ? images.rfkHead.width * headScale : 195;

        // Scale mouth to cover ~28% of head width (smaller to match face)
        const targetMouthW = headW * 0.28;
        const mouthScale = targetMouthW / mouthImg.width;
        const mouthW = mouthImg.width * mouthScale;
        const mouthH = mouthImg.height * mouthScale;

        // Position mouth on face - lowered to ~80% down from top of head
        // Head is centered but moved up 30px, so adjust mouth position
        const mouthX = -mouthW / 2 + 15;  // Shifted right
        const mouthY = headH * 0.30 - 30;  // Match head offset

        // Morph: scale height based on jawOpen (0 = closed, 1 = full open)
        const heightScale = 0.5 + jawOpen * 0.7;
        const morphedH = mouthH * heightScale;

        // The mouth also moves down slightly when opening
        const yOffset = jawOpen * 5;

        ctx.save();
        ctx.translate(0, mouthY + yOffset);

        // Create rounded clipping path for softer edges
        const clipRadius = Math.min(mouthW, morphedH) * 0.35;
        ctx.beginPath();
        ctx.moveTo(mouthX + clipRadius, -morphedH / 2);
        ctx.lineTo(mouthX + mouthW - clipRadius, -morphedH / 2);
        ctx.quadraticCurveTo(mouthX + mouthW, -morphedH / 2, mouthX + mouthW, -morphedH / 2 + clipRadius);
        ctx.lineTo(mouthX + mouthW, morphedH / 2 - clipRadius);
        ctx.quadraticCurveTo(mouthX + mouthW, morphedH / 2, mouthX + mouthW - clipRadius, morphedH / 2);
        ctx.lineTo(mouthX + clipRadius, morphedH / 2);
        ctx.quadraticCurveTo(mouthX, morphedH / 2, mouthX, morphedH / 2 - clipRadius);
        ctx.lineTo(mouthX, -morphedH / 2 + clipRadius);
        ctx.quadraticCurveTo(mouthX, -morphedH / 2, mouthX + clipRadius, -morphedH / 2);
        ctx.closePath();
        ctx.clip();

        // Slightly adjust color to blend with face (warmer/pinker tone)
        ctx.filter = 'saturate(0.8) brightness(1.05) sepia(0.15)';

        // Draw morphed mouth
        ctx.drawImage(
            mouthImg,
            0, 0, mouthImg.width, mouthImg.height,  // Source (full image)
            mouthX, -morphedH / 2,                   // Dest position
            mouthW, morphedH                         // Dest size (scaled + morphed)
        );

        ctx.filter = 'none';
        ctx.restore();
    }

    // Draw arm with RAW MILK bottle IN FRONT of head
    const armSwing = Math.sin(time * 3) * 0.2;
    const armBob = Math.sin(time * 6) * 8;

    ctx.save();
    ctx.translate(110, 180);  // Start from lower shoulder/torso area
    ctx.rotate(-0.6 + armSwing);  // Arm raised up and out

    // Upper arm (suit sleeve)
    ctx.fillStyle = '#2a2a3a';
    ctx.fillRect(-25, 0, 50, 80);
    ctx.strokeStyle = '#1a1a2a';
    ctx.lineWidth = 2;
    ctx.strokeRect(-25, 0, 50, 80);

    // Forearm
    ctx.translate(0, 80);
    ctx.rotate(-0.8 - armSwing * 0.5);
    ctx.fillRect(-22, 0, 44, 70);
    ctx.strokeRect(-22, 0, 44, 70);

    // Hand
    ctx.translate(0, 70 + armBob);
    ctx.fillStyle = '#e8c4a0';
    ctx.beginPath();
    ctx.ellipse(0, 20, 28, 35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#c9a080';
    ctx.stroke();

    // RAW MILK BOTTLE - BIGGER
    ctx.save();
    ctx.translate(0, 0);
    ctx.rotate(0.9);  // Counter-rotate so bottom faces downward
    ctx.scale(1.8, 1.8);  // Make bottle bigger

    // Bottle body (glass)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-15, -15);
    ctx.lineTo(-15, -30);
    ctx.lineTo(-10, -40);
    ctx.lineTo(-10, -50);
    ctx.lineTo(10, -50);
    ctx.lineTo(10, -40);
    ctx.lineTo(15, -30);
    ctx.lineTo(15, -15);
    ctx.lineTo(22, 5);
    ctx.lineTo(22, 55);
    ctx.lineTo(-22, 55);
    ctx.lineTo(-22, 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Milk inside
    ctx.fillStyle = '#f8f8f5';
    ctx.fillRect(-19, 10, 38, 42);

    // Red cap
    ctx.fillStyle = '#dd2222';
    ctx.fillRect(-12, -50, 24, 12);

    // Label background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-18, 12, 36, 38);
    ctx.strokeStyle = '#dd2222';
    ctx.lineWidth = 2;
    ctx.strokeRect(-18, 12, 36, 38);

    // Label text - BIGGER
    ctx.fillStyle = '#dd2222';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('RAW', 0, 28);
    ctx.fillText('MILK', 0, 42);

    ctx.restore();  // End bottle scale
    ctx.restore();  // End arm

    ctx.restore();
}

function drawJayBody(ctx, bounce, time, drumHit) {
    // More human-looking drummer body
    const b = bounce * 0.3;
    const armSwing = drumHit ? 15 : 0;

    // Neck
    ctx.fillStyle = '#e8c4a0';  // Skin tone
    ctx.fillRect(-25, 50 + b, 50, 40);

    // Torso/shirt - more shaped
    ctx.fillStyle = '#1a1a1a';  // Near black
    ctx.beginPath();
    ctx.moveTo(-70, 90 + b);      // Left neck
    ctx.lineTo(-110, 110 + b);    // Left shoulder point
    ctx.lineTo(-100, 130 + b);    // Left shoulder curve
    ctx.lineTo(-90, 180 + b);     // Left armpit
    ctx.lineTo(-80, 320 + b);     // Left waist
    ctx.lineTo(-70, 380 + b);     // Left hip
    ctx.lineTo(70, 380 + b);      // Right hip
    ctx.lineTo(80, 320 + b);      // Right waist
    ctx.lineTo(90, 180 + b);      // Right armpit
    ctx.lineTo(100, 130 + b);     // Right shoulder curve
    ctx.lineTo(110, 110 + b);     // Right shoulder point
    ctx.lineTo(70, 90 + b);       // Right neck
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#0a0a0a';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Collar
    ctx.fillStyle = '#2a2a2a';
    ctx.beginPath();
    ctx.moveTo(-35, 88 + b);
    ctx.lineTo(0, 115 + b);
    ctx.lineTo(35, 88 + b);
    ctx.lineTo(25, 95 + b);
    ctx.lineTo(0, 105 + b);
    ctx.lineTo(-25, 95 + b);
    ctx.closePath();
    ctx.fill();

    // Left arm (upper)
    ctx.fillStyle = '#1a1a1a';
    ctx.save();
    ctx.translate(-95, 140 + b);
    ctx.rotate(-0.4 - armSwing * 0.01);
    ctx.fillRect(-20, 0, 40, 80);
    ctx.strokeRect(-20, 0, 40, 80);
    ctx.restore();

    // Left forearm
    ctx.save();
    ctx.translate(-115, 210 + b);
    ctx.rotate(0.8 + armSwing * 0.02);
    ctx.fillRect(-15, 0, 30, 70);
    ctx.strokeRect(-15, 0, 30, 70);
    // Left hand
    ctx.fillStyle = '#e8c4a0';
    ctx.beginPath();
    ctx.arc(0, 75, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Right arm (upper)
    ctx.fillStyle = '#1a1a1a';
    ctx.save();
    ctx.translate(95, 140 + b);
    ctx.rotate(0.4 + armSwing * 0.01);
    ctx.fillRect(-20, 0, 40, 80);
    ctx.strokeRect(-20, 0, 40, 80);
    ctx.restore();

    // Right forearm
    ctx.save();
    ctx.translate(115, 210 + b);
    ctx.rotate(-0.8 - armSwing * 0.02);
    ctx.fillRect(-15, 0, 30, 70);
    ctx.strokeRect(-15, 0, 30, 70);
    // Right hand
    ctx.fillStyle = '#e8c4a0';
    ctx.beginPath();
    ctx.arc(0, 75, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function drawJay(time) {
    if (!state.jay.visible) return;

    const { x, y, scale, bounce, wobbleX, wobbleY, drumHit } = state.jay;

    ctx.save();
    ctx.translate(x + wobbleX, y + bounce + wobbleY);
    ctx.scale(scale, scale);

    // Scale factor to make Jay smaller relative to drum set
    const jayScale = 0.55;

    // === LAYER 1: Entire body (behind head) ===
    ctx.save();
    ctx.scale(jayScale, jayScale);
    drawJayBody(ctx, bounce, time, drumHit);
    ctx.restore();

    // === LAYER 2: Head (in front of body) ===
    ctx.save();
    ctx.scale(jayScale, jayScale);
    const headOffsetX = -40;  // Shift left to match body
    const headOffsetY = -20;  // Shift up
    if (images.jayHead && images.jayHead.complete) {
        const headScale = 0.9;  // Increased 50% from 0.6
        const w = images.jayHead.width * headScale;
        const h = images.jayHead.height * headScale;
        ctx.drawImage(images.jayHead, -w / 2 + headOffsetX, -h / 2 + headOffsetY, w, h);
    }

    // Baby mouth for countdown (3.5s to 6s)
    const currentTime = audio ? audio.currentTime : 0;
    if (currentTime >= 3.5 && currentTime < 6 && images.jayMouth && images.jayMouth.complete) {
        const mouthImg = images.jayMouth;
        const mouthScale = 0.216;  // Increased 80% from 0.12
        const mouthW = mouthImg.width * mouthScale;
        const mouthH = mouthImg.height * mouthScale;

        // Position centered on Jay's mouth
        // Moved 30 pixels to the left, 5 pixels down
        const mouthX = headOffsetX + 5 - 30;  // 30px more to the left
        const mouthY = headOffsetY + 75;  // Moved down 5 pixels

        // Animate mouth opening based on countdown beats
        const countTime = currentTime - 3.5;
        const isOpen = (countTime % 0.5) < 0.25;  // Open on each half-second beat
        const openScale = isOpen ? 1.3 : 0.7;

        ctx.save();
        ctx.translate(mouthX, mouthY);

        // Create more rounded clipping path for softer blending
        const clipW = mouthW * 0.85;  // Clip tighter
        const clipH = mouthH * openScale * 0.9;
        const clipRadius = Math.min(clipW, clipH) * 0.5;  // More rounded
        ctx.beginPath();
        ctx.moveTo(-clipW/2 + clipRadius, -clipH/2);
        ctx.lineTo(clipW/2 - clipRadius, -clipH/2);
        ctx.quadraticCurveTo(clipW/2, -clipH/2, clipW/2, -clipH/2 + clipRadius);
        ctx.lineTo(clipW/2, clipH/2 - clipRadius);
        ctx.quadraticCurveTo(clipW/2, clipH/2, clipW/2 - clipRadius, clipH/2);
        ctx.lineTo(-clipW/2 + clipRadius, clipH/2);
        ctx.quadraticCurveTo(-clipW/2, clipH/2, -clipW/2, clipH/2 - clipRadius);
        ctx.lineTo(-clipW/2, -clipH/2 + clipRadius);
        ctx.quadraticCurveTo(-clipW/2, -clipH/2, -clipW/2 + clipRadius, -clipH/2);
        ctx.closePath();
        ctx.clip();

        // No color filter - use original baby mouth colors
        ctx.filter = 'none';

        // Draw mouth with animation
        ctx.drawImage(
            mouthImg,
            -mouthW / 2, -mouthH * openScale / 2,
            mouthW, mouthH * openScale
        );

        ctx.filter = 'none';
        ctx.restore();
    }
    ctx.restore();

    // === LAYER 3: Drumsticks (in front of head) ===
    ctx.save();
    ctx.scale(jayScale, jayScale);
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    const stickSwing = drumHit ? 0.4 : 0;

    // Left drumstick
    ctx.save();
    ctx.translate(-130, 250 + bounce * 0.3);
    ctx.rotate(1.2 + stickSwing);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 90);
    ctx.stroke();
    ctx.fillStyle = '#654321';
    ctx.beginPath();
    ctx.ellipse(0, 90, 6, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Right drumstick
    ctx.save();
    ctx.translate(130, 250 + bounce * 0.3);
    ctx.rotate(-1.2 - stickSwing);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 90);
    ctx.stroke();
    ctx.fillStyle = '#654321';
    ctx.beginPath();
    ctx.ellipse(0, 90, 6, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.restore();  // End drumsticks scale

    // === LAYER 4: Drum kit (in front of everything) ===
    if (images.drumKit && images.drumKit.complete) {
        ctx.globalAlpha = 1;
        const drumScale = 0.7;
        const dw = images.drumKit.width * drumScale;
        const dh = images.drumKit.height * drumScale;
        ctx.drawImage(images.drumKit, -dw/2, 40, dw, dh);

        // Band logo on bass drum - rock band style
        ctx.save();

        // Bass drum center - moved down more
        const bassX = -8;
        const bassY = 40 + dh * 0.72;

        ctx.translate(bassX, bassY);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Milk bottles on sides - drawn as shapes
        // Left bottle
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-48, -8);   // Neck top left
        ctx.lineTo(-44, -8);   // Neck top right
        ctx.lineTo(-44, -4);   // Neck bottom right
        ctx.lineTo(-42, -2);   // Shoulder right
        ctx.lineTo(-42, 10);   // Body right
        ctx.lineTo(-50, 10);   // Body left
        ctx.lineTo(-50, -2);   // Shoulder left
        ctx.lineTo(-48, -4);   // Neck bottom left
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Right bottle
        ctx.beginPath();
        ctx.moveTo(44, -8);
        ctx.lineTo(48, -8);
        ctx.lineTo(48, -4);
        ctx.lineTo(50, -2);
        ctx.lineTo(50, 10);
        ctx.lineTo(42, 10);
        ctx.lineTo(42, -2);
        ctx.lineTo(44, -4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // "RAW MILK" on top - rock style with slight tilt
        ctx.save();
        ctx.rotate(-0.05);
        ctx.font = 'bold italic 18px Impact, "Arial Black", "Helvetica Bold", sans-serif';
        ctx.fillStyle = '#ff4444';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.strokeText('RAW MILK', 0, -12);
        ctx.fillText('RAW MILK', 0, -12);
        ctx.restore();

        // "BOYS" bigger, bolder - slight opposite tilt
        ctx.save();
        ctx.rotate(0.03);
        ctx.font = 'bold italic 26px Impact, "Arial Black", "Helvetica Bold", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.strokeText('BOYS', 0, 14);
        ctx.fillText('BOYS', 0, 14);
        ctx.restore();

        // Underline accent
        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-38, 28);
        ctx.lineTo(38, 28);
        ctx.stroke();

        ctx.restore();
    }

    ctx.restore();
}

function drawWorm(time) {
    if (!state.worm.visible) return;

    const { x, y, scale, expression, bounce, wobbleX, wobbleY, peekAmount } = state.worm;

    const wormImages = {
        'neutral': images.wormNeutral,
        'happy': images.wormHappy,
        'open': images.wormOpen,
        'smug': images.wormSmug,
        'chomp': images.wormChomp,
    };

    const wormImg = wormImages[expression] || images.wormNeutral;
    if (!wormImg || !wormImg.complete) return;

    ctx.save();

    if (peekAmount < 1) {
        ctx.beginPath();
        ctx.rect(0, 0, CONFIG.CANVAS_WIDTH, y + (wormImg.height * scale * peekAmount));
        ctx.clip();
    }

    ctx.translate(x + wobbleX, y + bounce + wobbleY);
    ctx.scale(scale, scale);

    // Spin during climax - full rotation every few seconds
    const scene = getCurrentScene(audio ? audio.currentTime : 0);
    if (scene.name.includes('climax')) {
        const spinPhase = (time % 3) / 3;  // Full spin every 3 seconds
        ctx.rotate(spinPhase * Math.PI * 2);
    }

    const w = wormImg.width;
    const h = wormImg.height;
    ctx.drawImage(wormImg, -w / 2, -h / 2);

    ctx.restore();
}

function drawWorm2(time) {
    if (!state.worm2.visible) return;

    const { x, y, scale, expression, bounce, wobbleX, wobbleY, peekAmount, separationAmount } = state.worm2;

    const wormImages = {
        'neutral': images.wormNeutral,
        'happy': images.wormHappy,
        'open': images.wormOpen,
        'smug': images.wormSmug,
        'chomp': images.wormChomp,
    };

    const wormImg = wormImages[expression] || images.wormHappy;
    if (!wormImg || !wormImg.complete) return;

    ctx.save();

    // Calculate position based on separation from worm1
    // Starts at worm1's position, moves away as separationAmount increases
    const baseX = state.worm.x;
    const baseY = state.worm.y;
    const separatedX = x;
    const separatedY = y;

    const currentX = baseX + (separatedX - baseX) * separationAmount;
    const currentY = baseY + (separatedY - baseY) * separationAmount;

    // Scale grows as it separates (starts small, grows to full size)
    const currentScale = scale * (0.3 + separationAmount * 0.7);

    ctx.translate(currentX + wobbleX, currentY + bounce + wobbleY);
    ctx.scale(currentScale, currentScale);

    // Slight rotation as it separates, or full spin during climax
    const scene = getCurrentScene(audio ? audio.currentTime : 0);
    if (scene.name.includes('climax')) {
        const spinPhase = ((time + 1.5) % 3) / 3;  // Offset spin from worm1
        ctx.rotate(spinPhase * Math.PI * 2);
    } else {
        ctx.rotate(Math.sin(time * 5) * 0.2 * (1 - separationAmount));
    }

    const w = wormImg.width;
    const h = wormImg.height;
    ctx.drawImage(wormImg, -w / 2, -h / 2);

    ctx.restore();
}

function drawDuneWorm(time) {
    if (!state.duneWorm.visible) return;

    const { x, scale, emergeAmount } = state.duneWorm;

    if (!images.duneWorm || !images.duneWorm.complete) return;

    ctx.save();

    const w = images.duneWorm.width * scale;
    const h = images.duneWorm.height * scale;
    const y = CONFIG.CANVAS_HEIGHT - (h * emergeAmount);

    // Screen shake during emergence
    if (emergeAmount > 0 && emergeAmount < 1) {
        ctx.translate(wobble() * 8, wobble() * 8);
        state.screen.shake = 5;
    }

    // Check if singing is happening for mouth animation
    let isSinging = false;
    for (const [start, end, lyrics, subtext, singing] of LYRICS_TIMING) {
        if (time >= start && time < end && singing) {
            isSinging = true;
            break;
        }
    }

    // Split the worm into body (bottom) and mouth (top) portions
    const mouthPortion = 0.25;  // Top 25% is the mouth area
    const imgW = images.duneWorm.width;
    const imgH = images.duneWorm.height;
    const mouthHeight = imgH * mouthPortion;
    const bodyHeight = imgH * (1 - mouthPortion);

    // Draw body portion (bottom 75%) - no animation
    ctx.drawImage(
        images.duneWorm,
        0, mouthHeight,  // Source: start below mouth
        imgW, bodyHeight,  // Source: rest of image
        x - w / 2, y + h * mouthPortion,  // Dest position
        w, h * (1 - mouthPortion)  // Dest size
    );

    // Draw mouth portion (top 25%) - with animation
    ctx.save();

    if (isSinging) {
        // Vertical pulse on just the mouth
        const mouthPulse = 0.8 + Math.abs(Math.sin(time * 12)) * 0.4;  // 0.8 to 1.2
        const mouthStretch = 1.0 + Math.sin(time * 10) * 0.1;  // Slight horizontal

        // Scale from the bottom of the mouth portion (where it meets the body)
        const mouthBottomY = y + h * mouthPortion;
        ctx.translate(x, mouthBottomY);
        ctx.scale(mouthStretch, mouthPulse);
        ctx.translate(-x, -mouthBottomY);
    }

    ctx.drawImage(
        images.duneWorm,
        0, 0,  // Source: top of image
        imgW, mouthHeight,  // Source: mouth portion
        x - w / 2, y,  // Dest position
        w, h * mouthPortion  // Dest size
    );

    ctx.restore();

    // GOOGLY EYES above the mouth
    const eyeY = y + h * 0.15;  // Position eyes near top of worm
    const eyeSpacing = w * 0.15;
    const eyeSize = 25 * scale;

    // Left eye
    ctx.save();
    ctx.translate(x - eyeSpacing, eyeY);

    // White of eye
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, eyeSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Pupil - moves around randomly
    const pupilOffsetX1 = Math.sin(time * 5) * eyeSize * 0.4;
    const pupilOffsetY1 = Math.cos(time * 4.3) * eyeSize * 0.4;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(pupilOffsetX1, pupilOffsetY1, eyeSize * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Right eye
    ctx.save();
    ctx.translate(x + eyeSpacing, eyeY);

    // White of eye
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, eyeSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Pupil - moves independently
    const pupilOffsetX2 = Math.sin(time * 4.7 + 1) * eyeSize * 0.4;
    const pupilOffsetY2 = Math.cos(time * 5.2 + 1) * eyeSize * 0.4;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(pupilOffsetX2, pupilOffsetY2, eyeSize * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore();
}

function drawRealWorms(time) {
    if (!state.realWorms.visible) return;

    const wormImgs = [images.realWorm1, images.realWorm2, images.realWorm3];

    state.realWorms.worms.forEach((worm, i) => {
        const img = wormImgs[worm.img - 1];
        if (!img || !img.complete) return;

        ctx.save();

        // Animate crawling motion
        const crawlX = worm.x + Math.sin(time * 1.5 + i * 2) * 30;
        const crawlY = worm.y + Math.cos(time * 2 + i) * 10;
        const rot = worm.rot + Math.sin(time * 0.8 + i) * 0.2;

        ctx.translate(crawlX, crawlY);
        ctx.rotate(rot);
        ctx.scale(worm.scale, worm.scale);

        const w = img.width;
        const h = img.height;
        ctx.drawImage(img, -w / 2, -h / 2);

        ctx.restore();
    });
}

function drawWoodwindWorms(time) {
    // Safety checks
    if (!state.woodwindWorms || !state.woodwindWorms.visible) return;
    if (!state.woodwindWorms.worms) return;

    const instrumentImgs = {
        clarinet: images.clarinet,
        saxophone: images.saxophone,
        oboe: images.oboe,
    };

    // Use real worm images as the worm bodies
    const wormImgs = [images.realWorm1, images.realWorm2, images.realWorm3];

    // Custom positioning for each worm-instrument combo
    // Positioned so mouthpiece/reed overlaps with worm tip
    const instrumentOffsets = [
        { x: 80, y: -70, rot: -0.6, scale: 0.35 },   // clarinet - worm1 (S-shape, tip at upper-right)
        { x: -70, y: -50, rot: 0.4, scale: 0.4 },    // saxophone - worm2 (loop, tip at upper-left)
        { x: -20, y: -90, rot: 0.1, scale: 0.25 },   // oboe - worm3 (curled, tip at top)
    ];

    // Worm3 gets a second instrument (clarinet)
    const worm3SecondInstrument = { x: 40, y: -70, rot: -0.4, scale: 0.3 };

    state.woodwindWorms.worms.forEach((worm, i) => {
        const wormImg = wormImgs[i];
        if (!wormImg || !wormImg.complete) return;  // Skip if worm image not loaded

        const instImg = instrumentImgs[worm.instrument];
        const offset = instrumentOffsets[i];

        ctx.save();

        // Animate bobbing while playing
        const bobX = worm.x + Math.sin(time * 3 + i * 2) * 15;
        const bobY = worm.y + Math.sin(time * 4 + i) * 8;
        let sway = Math.sin(time * 2 + i) * 0.1;

        // Full spin during climax
        const scene = getCurrentScene(audio ? audio.currentTime : 0);
        if (scene.name.includes('climax')) {
            const spinPhase = ((time + i * 1.2) % 4) / 4;  // Each worm spins at different offset
            sway = spinPhase * Math.PI * 2;
        }

        ctx.translate(bobX, bobY);
        ctx.rotate(sway);
        ctx.scale(worm.scale, worm.scale);

        // Draw worm body
        ctx.drawImage(wormImg, -wormImg.width / 2, -wormImg.height / 2);

        // Draw instrument (if image available)
        if (instImg && instImg.complete) {
            ctx.save();
            ctx.translate(offset.x, offset.y);
            ctx.rotate(offset.rot);
            ctx.drawImage(instImg, 0, 0, instImg.width * offset.scale, instImg.height * offset.scale);
            ctx.restore();
        }

        // Worm3 gets a second instrument - clarinet!
        if (i === 2 && images.clarinet && images.clarinet.complete) {
            ctx.save();
            ctx.translate(worm3SecondInstrument.x, worm3SecondInstrument.y);
            ctx.rotate(worm3SecondInstrument.rot);
            ctx.drawImage(images.clarinet, 0, 0, images.clarinet.width * worm3SecondInstrument.scale, images.clarinet.height * worm3SecondInstrument.scale);
            ctx.restore();
        }

        ctx.restore();
    });
}

// Lyrics timing - [start, end, lyrics, subtext, isSinging]
const LYRICS_TIMING = [
    // Verse 1
    [26, 29, 'I HAD A DREAM', '', true],
    [29, 32, 'I WAS UNDERGROUND', '', true],
    [32, 35, 'FRIENDS AND FAMILY', '', true],
    [35, 38, 'BURIED ALL AROUND', '', true],
    [38, 41, 'WORM TOOK A BITE OF ME', '', true],

    // Hook 1
    [51, 54, 'THE SAME WORMS', 'THAT EAT ME', true],
    [54, 57, 'WILL SOMEDAY', 'EAT YOU TOO', true],
    [63, 66, 'THEY GONNA', 'EAT YOU', true],

    // Verse 2
    [68, 71, 'NIBBLED ON YOUR FEET', '', true],
    [71, 74, 'NIBBLED ON YOUR TOES', '', true],
    [74, 77, 'BODIES DECOMPOSE', '', true],
    [77, 80, 'TURN INTO DIRT', 'SOMEDAY', true],

    // Worm multiplication
    [82, 86, 'LIKE ONE BECOMES A TWO', 'AND TWO BECOMES A THREE', true],

    // Hook 2
    [91, 94, 'THE SAME WORMS', 'THAT EAT ME', true],
    [94, 97, 'WILL SOMEDAY', 'EAT YOU TOO', true],

    // Verse 3 (refined from audio analysis)
    [117, 120, 'I HAD A DREAM', '', true],
    [120.6, 122.4, 'I WAS UNDER THE GROUND', '', true],
    [123.1, 126.2, 'FRIENDS AND FAMILY', '', true],
    [127.1, 128.8, 'BURIED ALL AROUND', '', true],

    // Bridge chaos
    [132, 140, '🪱 WOOOOORMS 🪱', '', true],

    // Climax - refined from audio analysis
    [142, 142.8, 'THE SAME WORMS', '', true],
    [148.4, 150.8, 'GONNA EAT YOU TOO', '', true],
    [152.8, 155.7, 'NIBBLE ON YOUR HAIR', '', true],
    [157.9, 163.4, 'THE SAME WORMS', '', true],
    [163.6, 170.9, 'GONNA EAT YOU', '', true],
    [171.1, 174.9, 'THE SAME WORMS', '', true],
    [174.9, 182.4, 'EAT YOU TOO', '', true],

    // Final refrain
    [186.3, 188.1, 'THE SAME WORMS', 'THAT EAT ME', true],
    [188.5, 193, 'WILL SOMEDAY', 'EAT YOU TOO', true],
];

function getCurrentLyrics(time) {
    for (const [start, end, lyrics, subtext, singing] of LYRICS_TIMING) {
        if (time >= start && time < end) {
            return { lyrics, subtext, singing, progress: (time - start) / (end - start) };
        }
    }
    return null;
}

function drawLyrics(time, scene) {
    const current = getCurrentLyrics(time);

    if (!current) return;

    const { lyrics, subtext } = current;

    ctx.save();
    ctx.textAlign = 'center';

    // Random bright colors for rathergood feel
    const colors = [
        '#ff6b9d', '#ffeb3b', '#4caf50', '#2196f3',
        '#ff5722', '#e91e63', '#00bcd4', '#ff9800',
        '#9c27b0', '#8bc34a', '#f44336', '#03a9f4'
    ];

    const textX = CONFIG.CANVAS_WIDTH / 2 + wobble() * 5;
    const textY = 70 + wobble() * 3;

    // Draw main lyrics letter by letter with random colors
    ctx.font = 'bold 42px "Comic Sans MS", "Chalkboard SE", "Comic Neue", cursive';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 5;
    ctx.textAlign = 'left';

    // Measure total width to center
    const totalWidth = ctx.measureText(lyrics).width;
    let currentX = textX - totalWidth / 2;

    for (let i = 0; i < lyrics.length; i++) {
        const char = lyrics[i];
        const charWidth = ctx.measureText(char).width;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const charWobbleY = wobble() * 2;

        ctx.fillStyle = color;
        ctx.strokeText(char, currentX, textY + charWobbleY);
        ctx.fillText(char, currentX, textY + charWobbleY);

        currentX += charWidth;
    }

    // Subtext with random colors too
    if (subtext) {
        ctx.font = 'bold 28px "Comic Sans MS", "Chalkboard SE", "Comic Neue", cursive';
        const subWidth = ctx.measureText(subtext).width;
        currentX = textX - subWidth / 2;

        for (let i = 0; i < subtext.length; i++) {
            const char = subtext[i];
            const charWidth = ctx.measureText(char).width;
            const color = colors[Math.floor(Math.random() * colors.length)];
            const charWobbleY = wobble() * 2;

            ctx.fillStyle = color;
            ctx.strokeText(char, currentX, textY + 40 + charWobbleY);
            ctx.fillText(char, currentX, textY + 40 + charWobbleY);

            currentX += charWidth;
        }
    }

    ctx.restore();
}

function drawSparkles(time, scene) {
    // Only during climax scenes
    if (!scene.name.includes('climax')) return;

    // Generate new sparkles randomly
    if (Math.random() < 0.3) {
        state.sparkles.push({
            x: Math.random() * CONFIG.CANVAS_WIDTH,
            y: Math.random() * CONFIG.CANVAS_HEIGHT,
            size: 10 + Math.random() * 20,
            life: 1.0,
            color: ['#ffff00', '#ff00ff', '#00ffff', '#ff6b9d', '#ffffff'][Math.floor(Math.random() * 5)],
            rotation: Math.random() * Math.PI * 2,
        });
    }

    // Draw and update sparkles
    state.sparkles = state.sparkles.filter(sparkle => {
        ctx.save();
        ctx.translate(sparkle.x, sparkle.y);
        ctx.rotate(sparkle.rotation + time * 5);
        ctx.globalAlpha = sparkle.life;

        // Draw 4-point star
        ctx.fillStyle = sparkle.color;
        ctx.beginPath();
        const s = sparkle.size * sparkle.life;
        ctx.moveTo(0, -s);
        ctx.lineTo(s * 0.3, -s * 0.3);
        ctx.lineTo(s, 0);
        ctx.lineTo(s * 0.3, s * 0.3);
        ctx.lineTo(0, s);
        ctx.lineTo(-s * 0.3, s * 0.3);
        ctx.lineTo(-s, 0);
        ctx.lineTo(-s * 0.3, -s * 0.3);
        ctx.closePath();
        ctx.fill();

        ctx.restore();

        sparkle.life -= 0.08;
        sparkle.rotation += 0.2;
        return sparkle.life > 0;
    });
}

function drawFloatingObjects(time, scene) {
    // Determine which objects to show based on scene
    let objectSet = null;
    if (scene.name.includes('hospital') || scene.name === 'hook1-build' || scene.name === 'hook1-main') {
        objectSet = 'hospital';
    } else if (scene.name === 'hook1-saw' || scene.bg === 'bgNIH') {
        objectSet = 'nih';
    } else if (scene.name.includes('climax') || scene.name === 'bridge-chaos') {
        objectSet = 'chaos';
    }

    if (!objectSet) return;

    const objects = FLOATING_OBJECTS[objectSet];

    objects.forEach((obj, i) => {
        ctx.save();

        let xOffset, yBase, yOffset, rotation;

        if (obj.isAcademic) {
            // NIH papers - position in periphery (corners and edges)
            const positions = [
                { x: 120, y: 80 },    // Top-left
                { x: 680, y: 100 },   // Top-right
                { x: 100, y: 500 },   // Bottom-left
                { x: 700, y: 480 },   // Bottom-right
            ];
            const pos = positions[i % 4];
            xOffset = pos.x + Math.sin(time * 1.5 + i) * 30;
            yBase = pos.y;
            yOffset = Math.cos(time * 2 + i * 1.5) * 20;
            rotation = Math.sin(time * 1.2 + i) * 0.2;
        } else if (objectSet === 'hospital') {
            // Hospital items - position in periphery (corners)
            const positions = [
                { x: 100, y: 90 },    // Top-left - Ivermectin
                { x: 700, y: 80 },    // Top-right - Methylene Blue
                { x: 90, y: 520 },    // Bottom-left - Beef Tallow
                { x: 710, y: 500 },   // Bottom-right - Raw Milk
            ];
            const pos = positions[i % 4];
            xOffset = pos.x + Math.sin(time * 1.8 + i) * 25;
            yBase = pos.y;
            yOffset = Math.cos(time * 2.2 + i * 1.3) * 20;
            rotation = Math.sin(time * 1.4 + i) * 0.15;
        } else {
            // Other objects - float across screen
            const speed = 0.015 + i * 0.008;
            const xRange = CONFIG.CANVAS_WIDTH - 200;
            xOffset = 100 + ((time * speed * 80 + i * 150) % xRange);
            yBase = 80 + i * 100;
            yOffset = Math.sin(time * 2 + i * 1.5) * 25;
            rotation = Math.sin(time * 1.5 + i) * 0.15;
        }

        ctx.translate(xOffset, yBase + yOffset);
        ctx.rotate(rotation);
        ctx.globalAlpha = 0.9;

        if (obj.isEmoji) {
            // Big emoji
            ctx.font = '48px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(obj.text, 0, 0);
        } else if (obj.isAcademic) {
            // Academic paper style - BIGGER and more readable
            ctx.fillStyle = '#ffffee';
            ctx.fillRect(-95, -35, 190, 70);
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.strokeRect(-95, -35, 190, 70);
            ctx.fillStyle = '#000';
            ctx.font = 'bold 13px "Times New Roman", serif';
            ctx.textAlign = 'center';
            ctx.fillText(obj.text, 0, -10);
            ctx.font = 'italic 11px "Times New Roman", serif';
            ctx.fillStyle = '#444';
            const futureYears = [2027, 2028, 2029, 2030];
            const year = futureYears[Math.floor(time * 0.5) % 4];
            ctx.fillText(obj.journal + ', ' + year, 0, 8);
            ctx.font = '8px "Times New Roman", serif';
            ctx.fillStyle = '#666';
            ctx.fillText('doi: 10.1038/retracted', 0, 22);
        } else {
            // Regular floating text
            ctx.font = 'bold 18px "Comic Sans MS", "Chalkboard SE", "Comic Neue", cursive';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 3;
            ctx.fillStyle = obj.color;
            ctx.textAlign = 'center';
            ctx.strokeText(obj.text, 0, 0);
            ctx.fillText(obj.text, 0, 0);
        }

        ctx.restore();
    });
}

function drawCountdown(time) {
    // Count UP from 3.5s to 6s (1, 2, 3, 4 like a drummer)
    if (time < 3.5 || time >= 6) return;

    const countTime = time - 3.5;
    let number = '';
    let progress = 0;

    if (countTime < 0.6) {
        number = '1';
        progress = countTime / 0.6;
    } else if (countTime < 1.2) {
        number = '2';
        progress = (countTime - 0.6) / 0.6;
    } else if (countTime < 1.8) {
        number = '3';
        progress = (countTime - 1.2) / 0.6;
    } else if (countTime < 2.4) {
        number = '4';
        progress = (countTime - 1.8) / 0.6;
    } else {
        number = '';  // Done counting
    }

    if (!number) return;

    ctx.save();
    ctx.translate(400, 200);

    // Bounce effect
    const bounce = Math.sin(progress * Math.PI) * 30;
    const scale = 1 + Math.sin(progress * Math.PI) * 0.3;

    ctx.scale(scale, scale);
    ctx.translate(0, -bounce);
    ctx.rotate(Math.sin(progress * Math.PI * 2) * 0.1);

    // Draw number with random colors
    const colors = ['#ff6b9d', '#ffeb3b', '#4caf50', '#2196f3', '#ff5722'];
    ctx.font = 'bold 120px "Comic Sans MS", "Chalkboard SE", "Comic Neue", cursive';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 8;
    ctx.fillStyle = colors[Math.floor(time * 10) % colors.length];
    ctx.strokeText(number, 0, 0);
    ctx.fillText(number, 0, 0);

    ctx.restore();
}

function createWormBurst(x, y) {
    // Create a big burst of particles
    const colors = ['#ff6b9d', '#ffeb3b', '#4caf50', '#ff5722', '#9c27b0', '#00bcd4'];
    const emojis = ['🪱', '✨', '💥', '⭐', '🧠', '😱'];

    for (let i = 0; i < 30; i++) {
        const angle = (i / 30) * Math.PI * 2 + Math.random() * 0.3;
        const speed = 5 + Math.random() * 10;
        state.burstParticles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 15 + Math.random() * 25,
            life: 1.0,
            color: colors[Math.floor(Math.random() * colors.length)],
            emoji: emojis[Math.floor(Math.random() * emojis.length)],
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.5,
            isEmoji: Math.random() > 0.5,
        });
    }
}

function drawBurstParticles(time) {
    state.burstParticles = state.burstParticles.filter(p => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.life;

        if (p.isEmoji) {
            ctx.font = `${p.size}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(p.emoji, 0, 0);
        } else {
            // Star burst shape
            ctx.fillStyle = p.color;
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
                const outerX = Math.cos(angle) * p.size;
                const outerY = Math.sin(angle) * p.size;
                const innerAngle = angle + Math.PI / 5;
                const innerX = Math.cos(innerAngle) * p.size * 0.4;
                const innerY = Math.sin(innerAngle) * p.size * 0.4;
                if (i === 0) ctx.moveTo(outerX, outerY);
                else ctx.lineTo(outerX, outerY);
                ctx.lineTo(innerX, innerY);
            }
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();

        // Update particle
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.3;  // Gravity
        p.vx *= 0.98;  // Air resistance
        p.rotation += p.rotSpeed;
        p.life -= 0.025;
        p.size *= 0.98;

        return p.life > 0;
    });

    // Trigger bursts when worms appear
    const audioTime = audio ? audio.currentTime : 0;

    // Worm 1 burst at 38 seconds
    if (audioTime >= 38 && audioTime < 38.5 && !state.worm1Burst) {
        createWormBurst(420, 280);  // RFK's ear position
        state.worm1Burst = true;
    }

    // Worm 2 burst at 82 seconds
    if (audioTime >= 82 && audioTime < 82.5 && !state.worm2Burst) {
        createWormBurst(420, 280);  // RFK's ear position
        state.worm2Burst = true;
    }

    // Reset burst flags if rewound
    if (audioTime < 38) state.worm1Burst = false;
    if (audioTime < 82) state.worm2Burst = false;
}

function drawMusicalNotes(time) {
    // Generate notes from woodwind worms when visible
    if (state.woodwindWorms.visible && Math.random() < 0.15) {
        const worm = state.woodwindWorms.worms[Math.floor(Math.random() * 3)];
        state.musicalNotes.push({
            x: worm.x + (Math.random() - 0.5) * 40,
            y: worm.y - 30,
            note: ['♪', '♫', '♬', '♩'][Math.floor(Math.random() * 4)],
            color: ['#ff6b9d', '#ffeb3b', '#4caf50', '#2196f3', '#ff5722'][Math.floor(Math.random() * 5)],
            vx: (Math.random() - 0.5) * 3,
            vy: -2 - Math.random() * 2,
            life: 1.0,
            rotation: Math.random() * 0.5 - 0.25,
            size: 24 + Math.random() * 16,
        });
    }

    // Draw and update notes
    state.musicalNotes = state.musicalNotes.filter(note => {
        ctx.save();
        ctx.translate(note.x, note.y);
        ctx.rotate(note.rotation);
        ctx.globalAlpha = note.life;
        ctx.font = `bold ${note.size}px Arial`;
        ctx.fillStyle = note.color;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.textAlign = 'center';
        ctx.strokeText(note.note, 0, 0);
        ctx.fillText(note.note, 0, 0);
        ctx.restore();

        // Update position
        note.x += note.vx;
        note.y += note.vy;
        note.vy += 0.05;  // Slight gravity
        note.rotation += 0.05;
        note.life -= 0.02;
        return note.life > 0;
    });
}

function drawEyeBlinks(time) {
    // Random blink timing - more frequent
    if (!state.isBlinking && Math.random() < 0.025) {
        state.isBlinking = true;
        state.blinkTimer = 0.12;  // Blink duration
    }

    if (state.isBlinking) {
        state.blinkTimer -= 1 / CONFIG.FPS;
        if (state.blinkTimer <= 0) {
            state.isBlinking = false;
        }
    }

    if (!state.isBlinking) return;

    // Draw closed eyes on RFK
    if (state.rfk.visible) {
        ctx.save();
        ctx.translate(state.rfk.x + state.rfk.wobbleX, state.rfk.y + state.rfk.bounce + state.rfk.wobbleY);
        ctx.scale(state.rfk.scale, state.rfk.scale);

        // Eye positions relative to head (adjusted for 0.65 head scale)
        const headScale = 0.65;
        ctx.scale(headScale, headScale);

        ctx.fillStyle = '#d4a574';  // Skin tone
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;

        // Left eye closed (arc)
        ctx.beginPath();
        ctx.arc(-35, -20, 12, 0, Math.PI, false);
        ctx.fill();
        ctx.stroke();

        // Right eye closed
        ctx.beginPath();
        ctx.arc(35, -20, 12, 0, Math.PI, false);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }

    // Draw closed eyes on Jay
    if (state.jay.visible) {
        ctx.save();
        ctx.translate(state.jay.x + state.jay.wobbleX, state.jay.y + state.jay.bounce + state.jay.wobbleY);
        ctx.scale(state.jay.scale * 0.55, state.jay.scale * 0.55);

        const headOffsetX = -40;
        const headOffsetY = -20;
        ctx.translate(headOffsetX, headOffsetY);

        ctx.fillStyle = '#e8c4a0';
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;

        // Left eye closed
        ctx.beginPath();
        ctx.arc(-25, -10, 8, 0, Math.PI, false);
        ctx.fill();
        ctx.stroke();

        // Right eye closed
        ctx.beginPath();
        ctx.arc(25, -10, 8, 0, Math.PI, false);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }
}

function drawEndCredits(time, scene) {
    if (scene.name !== 'outro') return;

    const outroStart = 195;
    const scrollStart = outroStart + 3;  // Start scrolling after 3 seconds into outro

    if (time < scrollStart) return;

    const scrollTime = time - scrollStart;
    const scrollSpeed = 55;  // pixels per second (faster)
    const lineHeight = 28;  // tighter spacing
    const startY = CONFIG.CANVAS_HEIGHT + scrollTime * scrollSpeed;

    ctx.save();
    ctx.textAlign = 'center';

    END_CREDITS.forEach((line, i) => {
        const y = startY - i * lineHeight;

        // Only draw if on screen
        if (y > -50 && y < CONFIG.CANVAS_HEIGHT + 50) {
            ctx.font = line.includes('WORMS') || line.includes('CAST') || line.includes('MUSIC') ||
                       line.includes('CATERING') || line.includes('SPECIAL') ?
                       'bold 24px "Comic Sans MS", "Chalkboard SE", "Comic Neue", cursive' : '18px "Comic Sans MS", "Chalkboard SE", "Comic Neue", cursive';

            // Random color for title and emojis
            if (line.includes('🪱')) {
                ctx.fillStyle = '#ff6b9d';
            } else if (line === line.toUpperCase() && line.length > 0) {
                ctx.fillStyle = '#ffeb3b';
            } else {
                ctx.fillStyle = '#ffffff';
            }

            ctx.strokeStyle = '#000';
            ctx.lineWidth = 3;
            ctx.strokeText(line, CONFIG.CANVAS_WIDTH / 2, y);
            ctx.fillText(line, CONFIG.CANVAS_WIDTH / 2, y);
        }
    });

    ctx.restore();
}

function drawScreenEffects(time, scene) {
    // Screen shake
    if (state.screen.shake > 0) {
        // Applied in main draw via translate
        state.screen.shake *= 0.9;
    }

    // Flash effect
    if (state.screen.flash > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${state.screen.flash})`;
        ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        state.screen.flash *= 0.8;
    }

    // Vignette
    const gradient = ctx.createRadialGradient(
        CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2, 100,
        CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2, 500
    );
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

    // rathergood.com watermark in corner
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.font = '12px "Comic Sans MS", "Chalkboard SE", "Comic Neue", cursive';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.textAlign = 'right';
    ctx.strokeText('rathergood.com', CONFIG.CANVAS_WIDTH - 10, CONFIG.CANVAS_HEIGHT - 10);
    ctx.fillText('rathergood.com', CONFIG.CANVAS_WIDTH - 10, CONFIG.CANVAS_HEIGHT - 10);
    ctx.restore();
}

// =============================================================================
// SCENE LOGIC
// =============================================================================

function updateScene(time, scene) {
    const beat = beatPulse(time);

    // Wobble all characters
    state.rfk.wobbleX = wobble();
    state.rfk.wobbleY = wobble();
    state.jay.wobbleX = wobble();
    state.jay.wobbleY = wobble();
    state.worm.wobbleX = wobble();
    state.worm.wobbleY = wobble();

    // Bounce on beat
    state.rfk.bounce = beat;
    state.jay.bounce = beat * 0.8;
    state.worm.bounce = beat * 1.2;

    // Drum hit timing
    if (time < 1.2) {
        // No hits before 1.2 seconds
        state.jay.drumHit = false;
    } else if (time >= 1.2 && time < 1.35) {
        // First quick hit at 1.2s
        state.jay.drumHit = true;
    } else if (time >= 1.8 && time < 1.95) {
        // Second quick hit at 1.8s
        state.jay.drumHit = true;
    } else if (time < 6) {
        // Pause until 6 seconds
        state.jay.drumHit = false;
    } else {
        // Normal rhythm from 6 seconds onward (faster tempo)
        state.jay.drumHit = (time * 6) % 1 < 0.2;
    }

    // Lip sync - tied to lyrics (pauses 66-67s, resumes after)
    const currentLyrics = getCurrentLyrics(time);
    const forceSinging = (time >= 82 && time < 86) || (time >= 128.8 && time < 132);  // Force mouth animation 1:22-1:26 and 2:08.8-2:12

    // Dune worm takes over singing during climax/bridge - RFK stops
    const duneWormSinging = state.duneWorm.visible && (
        scene.name.includes('climax') ||
        scene.name === 'bridge-chaos' ||
        scene.name === 'outro'
    );

    if (duneWormSinging) {
        // RFK stops singing when dune worm is the star
        state.rfk.jawOpen = Math.max(0, state.rfk.jawOpen - 0.15); // Close mouth
    } else if (time >= 67 && time < 67.5) {
        // Brief mouth pause at 1:07
        state.rfk.jawOpen = Math.max(0, state.rfk.jawOpen - 0.2); // Quick close
    } else if ((currentLyrics && currentLyrics.singing) || forceSinging) {
        // Mouth moves when singing - faster oscillation for talking effect
        const talkSpeed = 6; // cycles per second
        const talkPhase = (time * talkSpeed) % 1;
        // Open-close-open pattern
        if (talkPhase < 0.25) {
            state.rfk.jawOpen = talkPhase / 0.25; // Opening
        } else if (talkPhase < 0.5) {
            state.rfk.jawOpen = 1 - (talkPhase - 0.25) / 0.25; // Closing
        } else if (talkPhase < 0.75) {
            state.rfk.jawOpen = (talkPhase - 0.5) / 0.25 * 0.7; // Partial open
        } else {
            state.rfk.jawOpen = 0.7 - (talkPhase - 0.75) / 0.25 * 0.7; // Closing
        }
    } else {
        // Mouth closed when not singing
        state.rfk.jawOpen = Math.max(0, state.rfk.jawOpen - 0.1); // Smooth close
    }

    // Default: real worms and woodwind worms not visible
    state.realWorms.visible = false;
    state.woodwindWorms.visible = false;

    // Worm2 stays visible after it appears at 82s
    if (time >= 86) {
        state.worm2.visible = true;
        state.worm2.separationAmount = 1;  // Fully separated
        state.worm2.expression = 'happy';
        state.worm2.scale = 0.75;
        state.worm2.bounce = beat * 1.5;
        state.worm2.x = 380 + Math.sin(time * 2.5) * 60;
        state.worm2.y = 200 + Math.cos(time * 3) * 30;
    } else if (time < 82) {
        state.worm2.visible = false;
    }

    // Scene-specific logic
    switch (scene.name) {
        case 'intro-countoff':
            state.jay.visible = true;
            state.rfk.visible = false;
            state.worm.visible = false;
            state.duneWorm.visible = false;
            state.jay.x = 400;
            state.jay.y = 280;
            state.jay.scale = 1.0;
            break;

        case 'intro-bass':
        case 'intro-bass2':
            state.jay.visible = true;
            state.rfk.visible = true;
            state.worm.visible = false;  // Worm doesn't appear until 38s
            state.duneWorm.visible = false;
            state.jay.x = 620;
            state.jay.y = 320;
            state.jay.scale = 0.6;
            state.rfk.x = 300;
            state.rfk.y = 300;
            state.rfk.scale = 0.45;
            state.worm.x = 220;
            state.worm.y = 180;
            state.worm.scale = 0.5;
            state.worm.expression = scene.name === 'intro-bass2' ? 'happy' : 'neutral';
            state.worm.peekAmount = 0;
            break;

        case 'verse1':
            state.rfk.visible = true;
            state.jay.visible = true;
            state.worm.visible = false;  // Worm doesn't appear until 38s
            state.rfk.x = 350;
            state.rfk.y = 320;
            state.worm.expression = 'happy';
            state.worm.peekAmount = 0;
            state.worm.x = 250 + Math.sin(time * 2) * 40;
            state.worm.y = 160;
            state.worm.scale = 0.7;
            break;

        case 'verse1-bite':
            state.rfk.visible = true;
            state.jay.visible = true;
            state.worm.visible = time > 38;  // Worm appears at 38s
            state.rfk.x = 350;
            state.rfk.y = 320;
            state.worm.expression = 'chomp';
            state.worm.peekAmount = Math.min(1, (time - 38) / 1.5);

            // Worm emerges from RFK's ear!
            const earX = 420;  // RFK's right ear position
            const earY = 280;
            const emergeProgress1 = Math.min(1, (time - 38) / 2);  // 2 seconds to fully emerge
            const targetX1 = 250 + Math.sin(time * 2) * 40;
            const targetY1 = 160;
            state.worm.x = earX + (targetX1 - earX) * emergeProgress1;
            state.worm.y = earY + (targetY1 - earY) * emergeProgress1;
            state.worm.scale = 0.4 + emergeProgress1 * 0.5;  // Grows as it emerges
            // Flash when worm first appears
            if (time > 38 && time < 38.3) state.screen.flash = 0.5;
            break;

        case 'hook1-build':
            state.worm.expression = 'happy';
            state.worm.scale = 0.8;
            break;

        case 'hook1-main':
            state.rfk.scale = 0.55;
            state.rfk.x = 400;
            state.rfk.y = 320;
            state.worm.expression = 'smug';
            state.worm.x = 550;
            state.worm.y = 250;
            state.worm.scale = 0.8;
            state.jay.visible = false;
            break;

        case 'hook1-saw':
            state.worm.expression = 'open';
            state.jay.visible = true;
            // Screen wobble
            state.screen.shake = 2;
            break;

        case 'verse2':
            state.rfk.scale = 0.45;
            state.rfk.x = 350;
            state.jay.visible = true;
            state.worm.expression = 'happy';
            state.worm.x = 200 + Math.sin(time * 3) * 80;
            state.worm.y = 150 + Math.cos(time * 2) * 40;
            break;

        case 'verse2-decompose':
            state.rfk.scale = 0.45;
            state.rfk.x = 350;
            state.jay.visible = true;
            state.worm.expression = 'smug';
            state.worm.scale = 0.85;
            state.worm.x = 200 + Math.sin(time * 3) * 80;
            state.worm.y = 150 + Math.cos(time * 2) * 40;

            // "One becomes two" - worm2 emerges from ear and separates (82-86s)
            if (time >= 82) {
                state.worm2.visible = true;
                state.worm2.expression = 'happy';
                // Separation progresses from 0 to 1 over 4 seconds
                state.worm2.separationAmount = Math.min(1, (time - 82) / 4);

                // Worm2 emerges from RFK's ear!
                const ear2X = 420;  // RFK's right ear
                const ear2Y = 280;
                const emergeProgress2 = Math.min(1, (time - 82) / 2);  // 2 seconds to emerge
                const target2X = 350 + Math.sin(time * 2.5) * 60;
                const target2Y = 180 + Math.cos(time * 3) * 30;
                state.worm2.x = ear2X + (target2X - ear2X) * emergeProgress2;
                state.worm2.y = ear2Y + (target2Y - ear2Y) * emergeProgress2;
                state.worm2.scale = 0.3 + emergeProgress2 * 0.45;  // Grows as it emerges
                state.worm2.bounce = beat * 1.5;
                // Flash when worm2 first appears
                if (time > 82 && time < 82.3) state.screen.flash = 0.6;
            } else {
                state.worm2.visible = false;
            }
            break;

        case 'hook2-woodwinds':
        case 'hook2-woodwinds2':
            state.worm.bounce = beat * 2;
            state.worm.expression = 'open';
            state.worm.scale = 0.9;
            // Woodwind worms join in!
            state.woodwindWorms.visible = true;
            break;

        case 'verse3':
            state.worm.scale = 1.0;
            state.worm.expression = 'smug';
            state.worm.x = 280;
            state.worm.y = 180;
            break;

        case 'verse3-buried':
            state.worm.scale = 1.0;
            state.worm.expression = 'happy';
            state.worm.x = 280;
            state.worm.y = 180;
            break;

        case 'bridge-chaos':
            // THE DUNE WORM MOMENT
            state.rfk.visible = true;
            state.jay.visible = true;
            state.worm.visible = false;
            state.duneWorm.visible = true;

            const bridgeProgress = (time - scene.start) / (scene.end - scene.start);
            state.duneWorm.emergeAmount = Math.min(1, bridgeProgress * 1.5);
            state.duneWorm.x = 400;  // Center
            state.duneWorm.scale = 0.6 + bridgeProgress * 0.4;  // Grows bigger

            state.rfk.scale = 0.25;
            state.rfk.x = 100;
            state.jay.scale = 0.4;
            state.jay.x = 700;

            // Flash when fully emerged
            if (bridgeProgress > 0.6 && bridgeProgress < 0.65) {
                state.screen.flash = 0.8;
            }
            break;

        case 'climax':
        case 'climax-brain':
        case 'climax-scan':
            // CHAOS - all worms visible!
            state.duneWorm.visible = true;
            state.rfk.visible = true;
            state.jay.visible = true;
            state.worm.visible = true;  // Beetlejuice worm
            state.worm2.visible = true;  // Second worm (sprouted at 1:22)
            state.woodwindWorms.visible = true;  // Worms with instruments!

            // RFK smaller and to the side
            state.rfk.scale = 0.35;
            state.rfk.x = 150;
            state.rfk.y = 280;

            // Beetlejuice worm bouncing around - rapid expression changes
            const wormExpressions = ['open', 'happy', 'smug', 'chomp'];
            state.worm.expression = wormExpressions[Math.floor(time * 4) % 4];
            state.worm.scale = 0.8;
            state.worm.x = 600 + Math.sin(time * 4) * 80;
            state.worm.y = 120 + Math.cos(time * 3) * 40;

            // Second worm bouncing around too - offset expression changes
            state.worm2.expression = wormExpressions[Math.floor(time * 4 + 2) % 4];
            state.worm2.scale = 0.7;
            state.worm2.separationAmount = 1;
            state.worm2.x = 500 + Math.sin(time * 3.5 + 1) * 70;
            state.worm2.y = 180 + Math.cos(time * 2.8 + 1) * 35;

            // Dune worm CENTER STAGE - big and prominent
            state.duneWorm.emergeAmount = 1;
            state.duneWorm.x = 400;  // Dead center
            state.duneWorm.scale = 0.9 + Math.sin(time * 2) * 0.1;  // Much bigger, pulsing

            state.screen.shake = scene.name === 'climax' ? 1.5 : 0.8;
            break;

        case 'final-refrain':
            state.worm.expression = 'smug';
            state.rfk.scale = 0.55;
            state.worm.scale = 1.0;
            state.worm.x = 520;
            state.worm.y = 220;
            state.screen.shake = 0;
            break;

        case 'outro':
            const outroProgress = (time - scene.start) / (scene.end - scene.start);

            // Jay leaves first, then RFK, worms stay till the end
            state.jay.visible = outroProgress < 0.3;
            state.rfk.visible = outroProgress < 0.5;

            // ALL worms visible and stay to the end
            state.worm.visible = true;
            state.duneWorm.visible = true;
            state.woodwindWorms.visible = true;  // Worms with their instruments!

            // Worms take over the screen
            state.worm.expression = 'smug';
            state.worm.peekAmount = 1;
            state.worm.scale = 0.9 + outroProgress * 0.3;  // Grow slightly
            state.worm.x = 300 + Math.sin(time * 2) * 50;
            state.worm.y = 200;

            // Dune worm takes over as others leave
            state.duneWorm.emergeAmount = 0.8 + outroProgress * 0.2;
            state.duneWorm.x = 400;  // Center stage
            state.duneWorm.scale = 0.7 + outroProgress * 0.3;  // Gets bigger

            state.rfk.bounce = beat * (1 - outroProgress);
            state.jay.bounce = beat * (1 - outroProgress);
            break;
    }
}

// =============================================================================
// MAIN ANIMATION LOOP
// =============================================================================

function draw(time) {
    const scene = getCurrentScene(time);
    updateScene(time, scene);

    ctx.save();

    // Apply screen shake
    if (state.screen.shake > 0.1) {
        ctx.translate(
            (Math.random() - 0.5) * state.screen.shake * 4,
            (Math.random() - 0.5) * state.screen.shake * 4
        );
    }

    // Clear and draw
    ctx.clearRect(-10, -10, CONFIG.CANVAS_WIDTH + 20, CONFIG.CANVAS_HEIGHT + 20);
    drawBackground(time, scene);
    drawFloatingObjects(time, scene);  // Behind characters
    drawCountdown(time);  // Jay's intro countdown
    drawJay(time);
    drawRFK(time);
    drawWorm(time);
    drawWorm2(time);
    drawDuneWorm(time);
    drawRealWorms(time);
    drawWoodwindWorms(time);
    drawSparkles(time, scene);  // Climax sparkles
    drawBurstParticles(time);  // Worm appearance bursts
    drawMusicalNotes(time);  // Notes from woodwind instruments
    drawEyeBlinks(time);  // Random eye blinks
    drawLyrics(time, scene);
    drawEndCredits(time, scene);  // Outro credits scroll
    drawScreenEffects(time, scene);

    ctx.restore();

    // Update UI (if elements exist)
    const timestampEl = document.getElementById('timestamp');
    if (timestampEl) timestampEl.textContent = formatTime(time);
    const sceneEl = document.getElementById('scene');
    if (sceneEl) sceneEl.textContent = scene.name + ' [' + scene.bg.replace('bg', '') + ']';

    // Update seekbar
    const seekbar = document.getElementById('seekbar');
    if (seekbar && !seekbar.matches(':active')) {
        seekbar.value = time;
    }
    const currentTimeLabel = document.getElementById('currentTime');
    if (currentTimeLabel) {
        currentTimeLabel.textContent = formatTime(time);
    }
}

function animate(timestamp) {
    if (!isPlaying) return;

    if (timestamp - lastFrameTime >= frameInterval) {
        lastFrameTime = timestamp;
        draw(audio.currentTime);
    }

    requestAnimationFrame(animate);
}

// =============================================================================
// INITIALIZATION
// =============================================================================

function init() {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    audio = document.getElementById('audio');

    loadAssets(() => {
        document.getElementById('loading').style.display = 'none';
        console.log('All assets loaded!');
        draw(0);
    });

    document.getElementById('playBtn').addEventListener('click', () => {
        if (!isPlaying) {
            isPlaying = true;
            audio.play();
            requestAnimationFrame(animate);
        }
    });

    document.getElementById('stopBtn').addEventListener('click', () => {
        isPlaying = false;
        audio.pause();
        audio.currentTime = 0;
        draw(0);
    });

    audio.addEventListener('ended', () => {
        // Continue animation for credits after audio ends
        const audioDuration = audio.duration || 208;
        let postAudioTime = audioDuration;
        const creditsEndTime = audioDuration + 45;  // Extra 45 seconds for credits to finish

        function continueForCredits() {
            if (postAudioTime < creditsEndTime && isPlaying) {
                postAudioTime += 1 / CONFIG.FPS;
                draw(postAudioTime);
                setTimeout(continueForCredits, 1000 / CONFIG.FPS);
            } else {
                isPlaying = false;
                draw(0);
                // Show replay button
                document.getElementById('replayBtn').style.display = 'inline-block';
                document.getElementById('playBtn').style.display = 'none';
            }
        }
        continueForCredits();
    });

    // Replay button
    document.getElementById('replayBtn').addEventListener('click', () => {
        audio.currentTime = 0;
        isPlaying = true;
        audio.play();
        requestAnimationFrame(animate);
        // Hide replay, show play
        document.getElementById('replayBtn').style.display = 'none';
        document.getElementById('playBtn').style.display = 'inline-block';
        // Reset burst flags
        state.worm1Burst = false;
        state.worm2Burst = false;
    });

    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            document.getElementById(isPlaying ? 'stopBtn' : 'playBtn').click();
        }
    });

    // Seekbar controls (if seekbar exists)
    const seekbar = document.getElementById('seekbar');
    if (seekbar) {
        seekbar.addEventListener('input', (e) => {
            const seekTime = parseFloat(e.target.value);
            audio.currentTime = seekTime;
            draw(seekTime);
            const currentTimeEl = document.getElementById('currentTime');
            if (currentTimeEl) currentTimeEl.textContent = formatTime(seekTime);
        });

        // Update max value when audio loads
        audio.addEventListener('loadedmetadata', () => {
            seekbar.max = audio.duration;
            const totalTimeEl = document.getElementById('totalTime');
            if (totalTimeEl) totalTimeEl.textContent = formatTime(audio.duration);
        });
    }
}

document.addEventListener('DOMContentLoaded', init);
