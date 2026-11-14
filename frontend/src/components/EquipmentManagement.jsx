import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/useAuth';
import apiClient from '../services/api';

const Icons = {
  Dumbbell: ({ size = 18, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6.5 6.5 11 11" />
      <path d="m21 21-1-1a2 2 0 0 0-2.83 0l-1.17 1.17a2 2 0 0 1-2.83 0L3 11a2 2 0 0 1 0-2.83L4.17 7a2 2 0 0 0 0-2.83L3.17 3.17a2 2 0 0 1 2.83 0L7 4.17a2 2 0 0 0 2.83 0L21 15.34a2 2 0 0 1 0 2.83L19.83 19.34a2 2 0 0 0 0 2.83l1.17 1.17a2 2 0 0 0 2.83-2.83l-1.17-1.17a2 2 0 0 1 0-2.83" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
    </svg>
  ),
  CheckCircle: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  Wrench: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  ),
  AlertTriangle: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  Search: ({ size = 15 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Eye: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  Edit: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  ),
  Trash: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" x2="10" y1="11" y2="17" />
      <line x1="14" x2="14" y1="11" y2="17" />
    </svg>
  ),
  Plus: ({ size = 15 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  PieChart: ({ size = 16, color = '#ff7a00' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  ),
  Calendar: ({ size = 16, color = '#ff7a00' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  ),
  List: ({ size = 16, color = '#ff7a00' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" x2="21" y1="6" y2="6" />
      <line x1="8" x2="21" y1="12" y2="12" />
      <line x1="8" x2="21" y1="18" y2="18" />
      <line x1="3" x2="3.01" y1="6" y2="6" />
      <line x1="3" x2="3.01" y1="12" y2="12" />
      <line x1="3" x2="3.01" y1="18" y2="18" />
    </svg>
  ),
  Zap: ({ size = 16, color = '#ff7a00' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  Clock: ({ size = 16, color = '#64748b' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  FileText: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 9H8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </svg>
  ),
  ChevronLeft: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  ChevronRight: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
};

// Formatter for clean category labels
const formatCategoryName = (category) => {
  switch (category?.toLowerCase()) {
    case 'cardio':
      return 'Cardio';
    case 'strength':
      return 'Strength';
    case 'free_weights':
      return 'Free Weights';
    case 'accessories':
      return 'Accessories';
    case 'recovery':
      return 'Recovery';
    case 'audio_visual':
      return 'Audio & Visual';
    default:
      return category ? category.replace('_', ' ') : 'Equipment';
  }
};

// Pinterest Anatomical Visuals & Real Professional Equipment Asset Mapping
const getEquipmentVisual = (name = '', category = '') => {
  const n = (name || '').toLowerCase();
  const c = (category || '').toLowerCase();

  // 1. Ab Crunch Machine (Exact Pinterest anatomy diagram from user)
  if (n.includes('crunch') || n.includes('ab machine')) {
    return {
      thumb: '/equipment/ab_crunch_machine.png',
      hero: '/equipment/ab_crunch_machine.png',
      badge: 'Pinterest Core Anatomy',
    };
  }

  // 2. Commercial Treadmill
  if (n.includes('treadmill')) {
    return {
      thumb: '/equipment/treadmill.png',
      hero: '/equipment/treadmill.png',
      badge: 'Cardio Engine',
    };
  }

  // 3. Exercise Bike / Assault Air Bike / Spin Bike
  if (n.includes('bike') || n.includes('cycle') || n.includes('spin')) {
    return {
      thumb: '/equipment/exercise_bike.png',
      hero: '/equipment/exercise_bike.png',
      badge: 'Metabolic Conditioning',
    };
  }

  // 4. Bench Press & Utility Benches
  if (n.includes('bench') || n.includes('incline bench') || n.includes('flat utility') || n.includes('power rack')) {
    return {
      thumb: '/equipment/bench_press.png',
      hero: '/equipment/bench_press_anatomy.png', // Pinterest anatomy diagram
      badge: 'Pinterest Pectoral Anatomy',
    };
  }

  // 5. Dumbbells / Barbell / Curls
  if (n.includes('dumbbell') || n.includes('barbell') || n.includes('curl') || n.includes('plate')) {
    return {
      thumb: '/equipment/dumbbell_set.png',
      hero: '/equipment/bicep_curl_anatomy.png', // Pinterest anatomy diagram
      badge: 'Pinterest Biceps Anatomy',
    };
  }

  // 6. Leg Press / Squat / Leg Curl / Extension
  if (n.includes('leg press') || n.includes('hack squat') || n.includes('leg curl') || n.includes('leg extension') || n.includes('calf raise')) {
    return {
      thumb: '/equipment/leg_press.png',
      hero: '/equipment/leg_press.png',
      badge: 'Lower Body Kinetic Chain',
    };
  }

  // 7. Lat Pulldown & Seated Rows
  if (n.includes('lat') || n.includes('pulldown') || n.includes('row')) {
    return {
      thumb: '/equipment/lat_pulldown.png',
      hero: '/equipment/lat_pulldown_anatomy.png', // Pinterest anatomy diagram
      badge: 'Pinterest Latissimus Anatomy',
    };
  }

  // 8. Rowing Machine / Concept2 / Ski Erg
  if (n.includes('rowing') || n.includes('ski erg')) {
    return {
      thumb: '/equipment/rowing_machine.png',
      hero: '/equipment/rowing_machine.png',
      badge: 'Full Body Aerobic Ergometer',
    };
  }

  // 9. Cable Crossover / Functional Trainer
  if (n.includes('cable') || n.includes('crossover') || n.includes('functional trainer') || n.includes('pec deck') || n.includes('butterfly')) {
    return {
      thumb: '/equipment/cable_crossover.png',
      hero: '/equipment/cable_crossover.png',
      badge: 'Multi-Vector Tension Station',
    };
  }

  // 10. Kettlebells
  if (n.includes('kettlebell')) {
    return {
      thumb: '/equipment/kettlebell.png',
      hero: '/equipment/kettlebell.png',
      badge: 'Dynamic Posterior Chain',
    };
  }

  // 11. Yoga Mat / Foam Roller / Recovery
  if (n.includes('mat') || n.includes('yoga') || n.includes('roller') || n.includes('massage') || n.includes('stretch') || c === 'recovery' || c === 'accessories') {
    return {
      thumb: '/equipment/yoga_mat.png',
      hero: '/equipment/yoga_mat.png',
      badge: 'Myofascial & Mobility Floor',
    };
  }

  // 12. 75" Smart TV / Sound System (Audio Visual)
  if (n.includes('tv') || n.includes('smart') || n.includes('sound') || c === 'audio_visual') {
    return {
      thumb: '/equipment/smart_tv.png',
      hero: '/equipment/smart_tv.png',
      badge: 'Commercial 4K Display',
    };
  }

  // Default fallback
  return {
    thumb: '/equipment/ab_crunch_machine.png',
    hero: '/equipment/ab_crunch_machine.png',
    badge: 'Standard Inventory Unit',
  };
};

// Thumbnail & Equipment Icon Component
const EquipmentIllustration = ({ name = '', category = '' }) => {
  const visual = getEquipmentVisual(name, category);
  return (
    <img
      src={visual.thumb}
      alt={name}
      className="equip-thumb-img"
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        borderRadius: 8,
        filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.08))',
      }}
      onError={(e) => {
        e.target.style.display = 'none';
      }}
    />
  );
};

// Anatomical Muscle Map SVG highlighting targeted body regions
const MuscleAnatomyFigure = ({ region = 'abs' }) => {
  const isAbs = region === 'abs' || region === 'core';
  const isChest = region === 'chest';
  const isQuads = region === 'quads';
  const isHamstrings = region === 'hamstrings';
  const isShoulders = region === 'shoulders';
  const isArms = region === 'arms';
  const isBack = region === 'back';
  const isCalves = region === 'calves';
  const isCardio = region === 'cardio';

  const defaultFill = 'var(--gym-anatomy-base, #e2e8f0)';
  const defaultStroke = 'var(--gym-anatomy-stroke, #94a3b8)';
  const targetFill = 'url(#muscleOrangeGrad)';
  const targetStroke = '#ea580c';

  return (
    <svg width="78" height="136" viewBox="0 0 120 220" fill="none">
      <defs>
        <linearGradient id="muscleOrangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff7a00" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
      </defs>

      {/* Head */}
      <circle cx="60" cy="20" r="13" fill={defaultFill} stroke={defaultStroke} strokeWidth="1.2" />

      {/* Neck */}
      <path d="M54 33 H66 L68 41 H52 Z" fill={defaultFill} stroke={defaultStroke} strokeWidth="1" />

      {/* Shoulders / Deltoids & Upper Back */}
      <path d="M52 41 L30 47 L27 64 L41 64 L50 45 Z" fill={isShoulders || isBack ? targetFill : defaultFill} stroke={isShoulders || isBack ? targetStroke : defaultStroke} strokeWidth="1.2" />
      <path d="M68 41 L90 47 L93 64 L79 64 L70 45 Z" fill={isShoulders || isBack ? targetFill : defaultFill} stroke={isShoulders || isBack ? targetStroke : defaultStroke} strokeWidth="1.2" />

      {/* Chest / Pectorals */}
      <path d="M50 45 L41 64 L59 64 L59 45 Z" fill={isChest ? targetFill : defaultFill} stroke={isChest ? targetStroke : defaultStroke} strokeWidth="1.2" />
      <path d="M70 45 L79 64 L61 64 L61 45 Z" fill={isChest ? targetFill : defaultFill} stroke={isChest ? targetStroke : defaultStroke} strokeWidth="1.2" />

      {/* Arms (Biceps & Forearms) */}
      <path d="M27 64 L23 92 L33 92 L37 64 Z" fill={isArms ? targetFill : defaultFill} stroke={isArms ? targetStroke : defaultStroke} strokeWidth="1.2" />
      <path d="M93 64 L97 92 L87 92 L83 64 Z" fill={isArms ? targetFill : defaultFill} stroke={isArms ? targetStroke : defaultStroke} strokeWidth="1.2" />
      <path d="M23 92 L19 120 L27 120 L33 92 Z" fill={isArms ? targetFill : defaultFill} stroke={isArms ? targetStroke : defaultStroke} strokeWidth="1.2" />
      <path d="M97 92 L101 120 L93 120 L87 92 Z" fill={isArms ? targetFill : defaultFill} stroke={isArms ? targetStroke : defaultStroke} strokeWidth="1.2" />

      {/* Abdominals / Core Section */}
      <rect x="47" y="66" width="11" height="9" rx="1.5" fill={isAbs ? targetFill : defaultFill} stroke={isAbs ? targetStroke : defaultStroke} strokeWidth={isAbs ? 1.5 : 1} />
      <rect x="62" y="66" width="11" height="9" rx="1.5" fill={isAbs ? targetFill : defaultFill} stroke={isAbs ? targetStroke : defaultStroke} strokeWidth={isAbs ? 1.5 : 1} />
      <rect x="47" y="77" width="11" height="9" rx="1.5" fill={isAbs ? targetFill : defaultFill} stroke={isAbs ? targetStroke : defaultStroke} strokeWidth={isAbs ? 1.5 : 1} />
      <rect x="62" y="77" width="11" height="9" rx="1.5" fill={isAbs ? targetFill : defaultFill} stroke={isAbs ? targetStroke : defaultStroke} strokeWidth={isAbs ? 1.5 : 1} />
      <rect x="48" y="88" width="10" height="9" rx="1.5" fill={isAbs ? targetFill : defaultFill} stroke={isAbs ? targetStroke : defaultStroke} strokeWidth={isAbs ? 1.5 : 1} />
      <rect x="62" y="88" width="10" height="9" rx="1.5" fill={isAbs ? targetFill : defaultFill} stroke={isAbs ? targetStroke : defaultStroke} strokeWidth={isAbs ? 1.5 : 1} />
      <path d="M39 68 L45 68 L46 98 L36 94 Z" fill={isAbs ? targetFill : defaultFill} stroke={isAbs ? targetStroke : defaultStroke} strokeWidth="1" />
      <path d="M81 68 L75 68 L74 98 L84 94 Z" fill={isAbs ? targetFill : defaultFill} stroke={isAbs ? targetStroke : defaultStroke} strokeWidth="1" />

      {/* Pelvis & Hips */}
      <path d="M36 98 L84 98 L76 116 L44 116 Z" fill={defaultFill} stroke={defaultStroke} strokeWidth="1" />

      {/* Quads, Hamstrings & Thighs */}
      <path d="M44 116 L35 162 L48 162 L57 116 Z" fill={isQuads || isHamstrings || isCardio ? targetFill : defaultFill} stroke={isQuads || isHamstrings || isCardio ? targetStroke : defaultStroke} strokeWidth="1.2" />
      <path d="M76 116 L85 162 L72 162 L63 116 Z" fill={isQuads || isHamstrings || isCardio ? targetFill : defaultFill} stroke={isQuads || isHamstrings || isCardio ? targetStroke : defaultStroke} strokeWidth="1.2" />

      {/* Calves & Lower Legs */}
      <path d="M36 164 L40 204 L48 204 L48 164 Z" fill={isCalves || isCardio ? targetFill : defaultFill} stroke={isCalves || isCardio ? targetStroke : defaultStroke} strokeWidth="1.2" />
      <path d="M84 164 L80 204 L72 204 L72 164 Z" fill={isCalves || isCardio ? targetFill : defaultFill} stroke={isCalves || isCardio ? targetStroke : defaultStroke} strokeWidth="1.2" />

      {/* Heart indicator for Cardio */}
      {isCardio && (
        <circle cx="60" cy="54" r="5" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5">
          <animate attributeName="r" values="4;6;4" dur="1s" repeatCount="indefinite" />
        </circle>
      )}
    </svg>
  );
};

// Target Muscle Data & Biomechanics Mapping for Gym Equipment
const getEquipmentMuscleData = (name = '', category = '') => {
  const n = (name || '').toLowerCase();
  const c = (category || '').toLowerCase();

  // 1. Ab Crunch Machine
  if (n.includes('crunch') || n.includes('ab machine')) {
    return {
      region: 'abs',
      regionName: 'Core & Abdominals',
      primary: 'Rectus Abdominis (Upper & Lower Abs)',
      secondary: 'Internal & External Obliques, Transverse Abdominis',
      movementType: 'Isolation • Torso Spinal Flexion',
      coachingTip: 'Anchor feet under pads. Inhale to brace, exhale as you contract your abs to curl your torso forward. Squeeze at full flexion.',
    };
  }

  // 2. Leg Press / Hack Squat / Leg Extension / Leg Curl
  if (n.includes('leg press') || n.includes('hack squat')) {
    return {
      region: 'quads',
      regionName: 'Lower Body (Quads & Glutes)',
      primary: 'Quadriceps Femoris, Gluteus Maximus',
      secondary: 'Hamstrings, Adductors, Calves',
      movementType: 'Compound • Lower Body Push',
      coachingTip: 'Keep lower back firmly against pad. Lower sled until knees reach 90 degrees; do not lock knees at the peak.',
    };
  }

  if (n.includes('leg extension')) {
    return {
      region: 'quads',
      regionName: 'Quadriceps Isolation',
      primary: 'Rectus Femoris, Vastus Lateralis, Vastus Medialis',
      secondary: 'Patellar Tendon Stabilizers',
      movementType: 'Isolation • Knee Extension',
      coachingTip: 'Align knee joint with machine pivot axis. Extend legs fully, hold 1 second at peak contraction, control descent.',
    };
  }

  if (n.includes('leg curl')) {
    return {
      region: 'hamstrings',
      regionName: 'Posterior Thigh (Hamstrings)',
      primary: 'Hamstrings (Biceps Femoris, Semitendinosus)',
      secondary: 'Gastrocnemius (Calves), Gracilis',
      movementType: 'Isolation • Knee Flexion',
      coachingTip: 'Keep thighs flat against pad. Flex knees to curl heels toward glutes without lifting hips off the seat.',
    };
  }

  // 3. Bench Press / Chest Press / Pec Deck
  if (n.includes('bench') || n.includes('pec deck') || n.includes('butterfly') || n.includes('chest')) {
    return {
      region: 'chest',
      regionName: 'Pectorals (Chest)',
      primary: 'Pectoralis Major (Sternal & Clavicular Heads)',
      secondary: 'Anterior Deltoids, Triceps Brachii',
      movementType: 'Compound • Horizontal Push',
      coachingTip: 'Retract shoulder blades, keep chest proud. Lower bar/handles with elbows at 45–60 degrees, press with control.',
    };
  }

  // 4. Lat Pulldown / Row / Pull-Up
  if (n.includes('lat') || n.includes('pulldown') || n.includes('row') || n.includes('pull-up')) {
    return {
      region: 'back',
      regionName: 'Upper & Mid Back (Lats)',
      primary: 'Latissimus Dorsi, Rhomboids, Trapezius',
      secondary: 'Biceps Brachii, Rear Deltoids, Forearms',
      movementType: 'Compound • Vertical / Horizontal Pull',
      coachingTip: 'Drive elbows down and back toward your ribs. Lead with the chest up, avoiding torso momentum.',
    };
  }

  // 5. Shoulder Press / Overhead
  if (n.includes('shoulder') || n.includes('overhead')) {
    return {
      region: 'shoulders',
      regionName: 'Shoulders (Deltoids)',
      primary: 'Anterior Deltoid, Lateral Deltoid',
      secondary: 'Triceps Brachii, Upper Trapezius',
      movementType: 'Compound • Vertical Push',
      coachingTip: 'Keep core tight and rib cage down. Press directly overhead without arching your lower back excessively.',
    };
  }

  // 6. Dumbbells / Curls / Free Weights
  if (n.includes('curl') || n.includes('bicep') || n.includes('dumbbell') || n.includes('barbell')) {
    return {
      region: 'arms',
      regionName: 'Biceps & Forearms',
      primary: 'Biceps Brachii (Long & Short Heads)',
      secondary: 'Brachialis, Brachioradialis, Forearm Grip',
      movementType: 'Free Weight / Isolation • Elbow Flexion',
      coachingTip: 'Keep elbows tucked at your sides. Supinate wrists as you curl upward, controlling both lift and lowering phases.',
    };
  }

  // 7. Cardio (Treadmill, Bike, Rower, Climber)
  if (c === 'cardio' || n.includes('treadmill') || n.includes('bike') || n.includes('climber') || n.includes('elliptical') || n.includes('rowing')) {
    return {
      region: 'cardio',
      regionName: 'Cardiovascular & Aerobic Engine',
      primary: 'Cardiovascular Endurance, Heart & Lungs',
      secondary: 'Quadriceps, Calves, Glutes, Hamstrings',
      movementType: 'Metabolic Conditioning & Caloric Burn',
      coachingTip: 'Maintain upright posture with relaxed shoulders. Regulate breathing rhythm and maintain cadence within target heart rate zone.',
    };
  }

  // 8. Recovery & Yoga
  if (c === 'recovery' || c === 'accessories' || n.includes('mat') || n.includes('massage') || n.includes('roller')) {
    return {
      region: 'recovery',
      regionName: 'Mobility & Myofascial Recovery',
      primary: 'Fascial Release, Joint Mobility & Flexibility',
      secondary: 'Parasympathetic Nervous System Decompression',
      movementType: 'Active Recovery & Postural Reset',
      coachingTip: 'Breathe deeply and hold stretches for 20–30 seconds. On foam roller, pause on tender trigger points until tension dissipates.',
    };
  }

  // 9. Audio Visual & Facility Hardware
  if (c === 'audio_visual' || n.includes('tv') || n.includes('sound')) {
    return {
      region: 'facility',
      regionName: 'Gym Floor Audio-Visual System',
      primary: 'Member Entertainment & Workout Atmosphere',
      secondary: 'Class Music Pacing, Telemetry Display',
      movementType: 'Commercial Facility Hardware Feed',
      coachingTip: 'Samsung commercial display and acoustic system supporting high-energy gym floor motivation.',
    };
  }

  // Default fallback
  return {
    region: 'core',
    regionName: 'General Gym Conditioning',
    primary: 'Target Musculoskeletal Groups',
    secondary: 'Stabilizing Core Muscles',
    movementType: 'Strength & Conditioning',
    coachingTip: 'Adjust seat and pads to your body dimensions before beginning exercise. Control both lifting and lowering phases.',
  };
};

export default function EquipmentManagement() {
  const { hasRole } = useAuth();
  const canManage = hasRole('owner') || hasRole('admin');

  const [equipmentList, setEquipmentList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Auto-dismiss floating toast notification
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 4500);
    return () => clearTimeout(timer);
  }, [notification]);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Pagination State (5 items per page for clean, compact display)
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 5;

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [deleteConfirmAsset, setDeleteConfirmAsset] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add Asset Form
  const initialAddForm = {
    name: '',
    category: 'strength',
    brand: '',
    model_number: '',
    location_area: 'Main Floor (Strength Bay)',
    purchase_cost: '',
    status: 'operational',
    condition: 'good',
    next_maintenance_due: '',
    maintenance_notes: '',
  };
  const [addForm, setAddForm] = useState(initialAddForm);

  // Edit / Inspection Form
  const [editForm, setEditForm] = useState({
    name: '',
    category: 'strength',
    brand: '',
    model_number: '',
    status: 'operational',
    condition: 'good',
    location_area: '',
    last_inspected_at: new Date().toISOString().split('T')[0],
    next_maintenance_due: '',
    maintenance_notes: '',
  });

  // Schedule Maintenance Form
  const [scheduleForm, setScheduleForm] = useState({
    equipment_id: '',
    maintenance_date: new Date().toISOString().split('T')[0],
    service_type: 'Routine Inspection & Lubrication',
    technician_name: 'Tigat Technical Services',
    notes: '',
  });

  // Load Equipment Assets
  const loadEquipment = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.getEquipment({
        category: categoryFilter,
        status: statusFilter,
        search,
      });
      setEquipmentList(res.data || []);
      setCurrentPage(1);
    } catch (err) {
      setNotification({ type: 'danger', message: err.message || 'Failed to load equipment assets.' });
    } finally {
      setIsLoading(false);
    }
  }, [categoryFilter, statusFilter, search]);

  useEffect(() => {
    setTimeout(() => {
      loadEquipment();
    }, 0);
  }, [loadEquipment]);

  // Derived KPI metrics
  const metrics = useMemo(() => {
    const total = equipmentList.length;
    let good = 0;
    let needsMaint = 0;
    let outOfService = 0;

    equipmentList.forEach((e) => {
      if (e.status === 'out_of_service' || e.status === 'decommissioned') {
        outOfService++;
      } else if (e.status === 'needs_maintenance' || e.status === 'under_repair') {
        needsMaint++;
      } else {
        good++;
      }
    });

    return { total, good, needsMaint, outOfService };
  }, [equipmentList]);

  // Category Distribution for Donut Chart
  const categoryStats = useMemo(() => {
    const counts = {
      strength: 0,
      cardio: 0,
      free_weights: 0,
      accessories: 0,
      other: 0,
    };

    equipmentList.forEach((e) => {
      const cat = e.category?.toLowerCase() || 'other';
      if (counts[cat] !== undefined) {
        counts[cat]++;
      } else {
        counts.other++;
      }
    });

    const total = equipmentList.length || 1;
    return [
      { id: 'strength', name: 'Strength Equipment', count: counts.strength, pct: ((counts.strength / total) * 100).toFixed(1), color: '#ff7a00' },
      { id: 'cardio', name: 'Cardio Equipment', count: counts.cardio, pct: ((counts.cardio / total) * 100).toFixed(1), color: '#0ea5e9' },
      { id: 'free_weights', name: 'Free Weights', count: counts.free_weights, pct: ((counts.free_weights / total) * 100).toFixed(1), color: '#10b981' },
      { id: 'accessories', name: 'Accessories', count: counts.accessories + counts.other, pct: (((counts.accessories + counts.other) / total) * 100).toFixed(1), color: '#8b5cf6' },
    ];
  }, [equipmentList]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(equipmentList.length / PAGE_SIZE));
  const paginatedEquipment = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return equipmentList.slice(start, start + PAGE_SIZE);
  }, [equipmentList, currentPage]);

  // Open Details Modal
  const handleOpenViewModal = (item) => {
    setSelectedAsset(item);
    setIsViewOpen(true);
  };

  // Handle Add Equipment
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiClient.createEquipment(addForm);
      setNotification({ type: 'success', message: `Equipment asset "${addForm.name}" registered successfully!` });
      setIsAddOpen(false);
      setAddForm(initialAddForm);
      loadEquipment();
    } catch (err) {
      setNotification({ type: 'danger', message: err.message || 'Failed to register equipment asset.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Edit / Inspect Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAsset) return;
    setIsSubmitting(true);
    try {
      await apiClient.updateEquipment(selectedAsset.id, editForm);
      setNotification({ type: 'success', message: `Equipment record "${selectedAsset.name}" updated successfully.` });
      setIsEditOpen(false);
      loadEquipment();
    } catch (err) {
      setNotification({ type: 'danger', message: err.message || 'Failed to update equipment.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Schedule Maintenance Submit
  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!scheduleForm.equipment_id) return;
    setIsSubmitting(true);
    try {
      await apiClient.updateEquipment(scheduleForm.equipment_id, {
        status: 'needs_maintenance',
        next_maintenance_due: scheduleForm.maintenance_date,
        maintenance_notes: `[Scheduled: ${scheduleForm.maintenance_date}] ${scheduleForm.service_type} (${scheduleForm.technician_name}) - ${scheduleForm.notes}`,
      });
      setNotification({ type: 'success', message: 'Maintenance service successfully scheduled on asset schedule!' });
      setIsScheduleOpen(false);
      loadEquipment();
    } catch (err) {
      setNotification({ type: 'danger', message: err.message || 'Failed to schedule maintenance.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Confirmation
  const handleConfirmDelete = async () => {
    if (!deleteConfirmAsset) return;
    setIsDeleting(true);
    try {
      await apiClient.deleteEquipment(deleteConfirmAsset.id);
      setNotification({ type: 'success', message: `Equipment "${deleteConfirmAsset.name}" removed from inventory.` });
      setDeleteConfirmAsset(null);
      loadEquipment();
    } catch (err) {
      setNotification({ type: 'danger', message: err.message || 'Failed to delete equipment record.' });
    } finally {
      setIsDeleting(false);
    }
  };

  // Format Condition Badge
  const renderConditionBadge = (item) => {
    if (item.status === 'out_of_service' || item.status === 'decommissioned') {
      return <span className="equip-pill equip-pill-poor"><span className="equip-pill-dot"></span>Poor</span>;
    }
    if (item.status === 'needs_maintenance' || item.status === 'under_repair') {
      return <span className="equip-pill equip-pill-fair"><span className="equip-pill-dot"></span>Fair</span>;
    }
    return <span className="equip-pill equip-pill-good"><span className="equip-pill-dot"></span>Good</span>;
  };

  // Format Status Badge
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'operational':
        return <span className="equip-pill equip-pill-active"><span className="equip-pill-dot"></span>Active</span>;
      case 'needs_maintenance':
      case 'under_repair':
        return <span className="equip-pill equip-pill-maintenance"><span className="equip-pill-dot"></span>Maintenance</span>;
      case 'out_of_service':
      case 'decommissioned':
        return <span className="equip-pill equip-pill-out"><span className="equip-pill-dot"></span>Out of Service</span>;
      default:
        return <span className="equip-pill equip-pill-active"><span className="equip-pill-dot"></span>Active</span>;
    }
  };

  // Monthly Maintenance Bar Data
  const maintenanceBars = [
    { month: 'Jan', val: 8, heightPct: (8 / 15) * 100 },
    { month: 'Feb', val: 6, heightPct: (6 / 15) * 100 },
    { month: 'Mar', val: 10, heightPct: (10 / 15) * 100 },
    { month: 'Apr', val: 7, heightPct: (7 / 15) * 100 },
    { month: 'May', val: 9, heightPct: (9 / 15) * 100 },
  ];

  return (
    <div className="equipment-module-container gymflow-view">
      {/* Floating Notification Toast */}
      {notification && (
        <div className={`gymflow-floating-toast toast-${notification.type}`} role="alert">
          {notification.type === 'danger' ? (
            <Icons.AlertTriangle size={18} style={{ color: '#ef4444', flexShrink: 0 }} />
          ) : (
            <Icons.CheckCircle size={18} style={{ color: '#10b981', flexShrink: 0 }} />
          )}
          <span style={{ flex: 1, lineHeight: 1.35 }}>{notification.message}</span>
          <button
            type="button"
            className="btn-dismiss"
            onClick={() => setNotification(null)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 2px', opacity: 0.7 }}
          >
            ×
          </button>
        </div>
      )}

      {/* Header Banner matching Template */}
      <section className="clean-dash-header-row" style={{ marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: 'rgba(255, 122, 0, 0.12)',
            color: '#ff7a00',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Icons.Dumbbell size={22} color="#ff7a00" />
          </div>
          <div>
            <h1 className="clean-dash-title" style={{ margin: 0, fontSize: 19 }}>Equipment Management</h1>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
              Manage gym equipment, track condition and maintenance.
            </p>
          </div>
        </div>

        {canManage && (
          <div className="clean-dash-actions">
            <button
              type="button"
              className="btn-clean-add-member"
              onClick={() => {
                setAddForm(initialAddForm);
                setIsAddOpen(true);
              }}
              title="Register new gym equipment"
            >
              <Icons.Plus size={16} />
              <span>+ Add Equipment</span>
            </button>
          </div>
        )}
      </section>

      {/* Row 1: Top 4 KPI Cards */}
      <div className="clean-kpi-grid">
        {/* Card 1: Total Equipment */}
        <div className="clean-kpi-card">
          <div className="clean-kpi-top">
            <span className="kpi-label">Total Equipment</span>
            <div className="clean-kpi-icon" title="Total Assets" style={{ background: 'rgba(255, 122, 0, 0.12)', color: '#ff7a00' }}>
              <Icons.Dumbbell size={16} color="#ff7a00" />
            </div>
          </div>
          <div className="kpi-value">{metrics.total}</div>
          <span className="kpi-trend" style={{ color: '#64748b' }}>Active inventory count</span>
        </div>

        {/* Card 2: In Good Condition */}
        <div className="clean-kpi-card">
          <div className="clean-kpi-top">
            <span className="kpi-label">In Good Condition</span>
            <div className="clean-kpi-icon" title="Good Condition" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <Icons.CheckCircle size={16} color="#10b981" />
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#10b981' }}>{metrics.good}</div>
          <span className="kpi-trend trend-positive">100% Floor operational</span>
        </div>

        {/* Card 3: Needs Maintenance */}
        <div className="clean-kpi-card">
          <div className="clean-kpi-top">
            <span className="kpi-label">Needs Maintenance</span>
            <div className="clean-kpi-icon" title="Needs Maintenance" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <Icons.Wrench size={16} color="#f59e0b" />
            </div>
          </div>
          <div className="kpi-value" style={{ color: metrics.needsMaint > 0 ? '#f59e0b' : '#64748b' }}>
            {metrics.needsMaint}
          </div>
          <span className="kpi-trend" style={{ color: '#f59e0b' }}>Inspection or tune-up due</span>
        </div>

        {/* Card 4: Out of Service */}
        <div className="clean-kpi-card">
          <div className="clean-kpi-top">
            <span className="kpi-label">Out of Service</span>
            <div className="clean-kpi-icon" title="Out of Service" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>
              <Icons.AlertTriangle size={16} color="#ef4444" />
            </div>
          </div>
          <div className="kpi-value" style={{ color: metrics.outOfService > 0 ? '#ef4444' : '#64748b' }}>
            {metrics.outOfService}
          </div>
          <span className="kpi-trend" style={{ color: '#ef4444' }}>Offline / under repair</span>
        </div>
      </div>

      {/* Row 2: Middle Analytics Cards (Donut Chart & Maintenance Overview) */}
      <div className="clean-charts-grid" style={{ marginBottom: 4 }}>
        {/* Left: Equipment by Category (Donut Chart) */}
        <div className="clean-chart-card">
          <div className="chart-card-header" style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Icons.PieChart size={16} color="#ff7a00" />
              <span className="chart-title">Equipment by Category</span>
            </div>
          </div>

          <div className="equipment-donut-layout">
            <div className="equipment-donut-svg-wrap">
              <svg width="150" height="150" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#f1f5f9" strokeWidth="15" />
                {(() => {
                  let accumulated = 0;
                  const circumference = 2 * Math.PI * 38;
                  return categoryStats.map((cat) => {
                    const strokeLength = (cat.count / (metrics.total || 1)) * circumference;
                    const strokeDasharray = `${strokeLength} ${circumference - strokeLength}`;
                    const strokeDashoffset = -accumulated;
                    accumulated += strokeLength;

                    return (
                      <circle
                        key={cat.id}
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke={cat.color}
                        strokeWidth="15"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        style={{ transition: 'stroke-dasharray 0.5s ease' }}
                      />
                    );
                  });
                })()}
              </svg>
              <div className="equipment-donut-center-text">
                <span className="equipment-donut-center-num">{metrics.total}</span>
                <span className="equipment-donut-center-label">Total</span>
              </div>
            </div>

            {/* Category Legend */}
            <div className="equipment-legend-list">
              {categoryStats.map((cat) => (
                <div key={cat.id} className="equipment-legend-row">
                  <div className="equipment-legend-label-wrap">
                    <span className="equipment-legend-dot" style={{ backgroundColor: cat.color }}></span>
                    <span className="equipment-legend-name">{cat.name}</span>
                  </div>
                  <span className="equipment-legend-val">
                    {cat.count} ({cat.pct}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Maintenance Overview (Monthly Bar Chart) */}
        <div className="clean-chart-card">
          <div className="chart-card-header" style={{ marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Icons.Calendar size={16} color="#ff7a00" />
              <span className="chart-title">Maintenance Overview</span>
            </div>
          </div>

          <div className="equipment-bar-chart-wrap">
            <div className="equipment-bars-flex">
              {maintenanceBars.map((bar) => (
                <div key={bar.month} className="equipment-bar-col">
                  <span className="equipment-bar-val">{bar.val}</span>
                  <div
                    className="equipment-bar-pillar"
                    style={{ height: `${Math.max(18, bar.heightPct)}%` }}
                    title={`${bar.month}: ${bar.val} services completed`}
                  ></div>
                  <span className="equipment-bar-month">{bar.month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Modern Quick Actions & Recent Activity in Two Columns BELOW Category & Maintenance */}
      <div className="equipment-actions-activity-grid">
        {/* Column 1: Quick Actions */}
        <div className="equipment-modern-card">
          <div className="modern-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="modern-header-icon orange-icon">
                <Icons.Zap size={17} color="#ff7a00" />
              </div>
              <div>
                <h3 className="modern-card-title">Quick Actions</h3>
                <p className="modern-card-sub">Immediate inventory controls & maintenance operations</p>
              </div>
            </div>
          </div>

          <div className="quick-actions-modern-list">
            {canManage && (
              <button
                type="button"
                className="quick-action-modern-row"
                onClick={() => {
                  setAddForm(initialAddForm);
                  setIsAddOpen(true);
                }}
              >
                <div className="quick-action-icon-box orange-box">
                  <Icons.Plus size={18} />
                </div>
                <div className="quick-action-content">
                  <div className="quick-action-name">Add New Equipment</div>
                  <div className="quick-action-desc">Register new strength, cardio, or studio gear into inventory</div>
                </div>
                <span className="quick-action-arrow">→</span>
              </button>
            )}

            {canManage && (
              <button
                type="button"
                className="quick-action-modern-row"
                onClick={() => {
                  setScheduleForm({
                    equipment_id: equipmentList[0]?.id || '',
                    maintenance_date: new Date().toISOString().split('T')[0],
                    service_type: 'Routine Inspection & Lubrication',
                    technician_name: 'Tigat Technical Services',
                    notes: '',
                  });
                  setIsScheduleOpen(true);
                }}
              >
                <div className="quick-action-icon-box amber-box">
                  <Icons.Wrench size={17} color="#d97706" />
                </div>
                <div className="quick-action-content">
                  <div className="quick-action-name">Schedule Maintenance</div>
                  <div className="quick-action-desc">Assign technician, due date, and tune-up service notes</div>
                </div>
                <span className="quick-action-arrow">→</span>
              </button>
            )}

            <button
              type="button"
              className="quick-action-modern-row"
              onClick={() => {
                setStatusFilter('needs_maintenance');
              }}
            >
              <div className="quick-action-icon-box blue-box">
                <Icons.FileText size={17} color="#0284c7" />
              </div>
              <div className="quick-action-content">
                <div className="quick-action-name">View Maintenance Log</div>
                <div className="quick-action-desc">Filter table directly to assets needing inspection or repair</div>
              </div>
              <span className="quick-action-arrow">→</span>
            </button>
          </div>
        </div>

        {/* Column 2: Recent Activity */}
        <div className="equipment-modern-card">
          <div className="modern-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="modern-header-icon orange-icon">
                <Icons.Clock size={17} color="#ff7a00" />
              </div>
              <div>
                <h3 className="modern-card-title">Recent Activity</h3>
                <p className="modern-card-sub">Real-time equipment logs & service timeline</p>
              </div>
            </div>
            <span className="modern-live-badge"><span className="live-dot"></span> Live Log</span>
          </div>

          <div className="recent-activity-modern-list">
            <div className="recent-activity-modern-item">
              <div className="activity-icon-container amber-bg">
                <Icons.Wrench size={15} color="#d97706" />
              </div>
              <div className="activity-body">
                <div className="activity-top-line">
                  <span className="activity-title-text">Maintenance scheduled for Exercise Bike</span>
                  <span className="activity-time-tag">2 hours ago</span>
                </div>
                <div className="activity-meta-tags">
                  <span className="activity-tag">📍 Cardio Zone</span>
                  <span className="activity-tag">EQ-003</span>
                  <span className="activity-tag-status">Under Review</span>
                </div>
              </div>
            </div>

            <div className="recent-activity-modern-item">
              <div className="activity-icon-container orange-bg">
                <Icons.Plus size={15} color="#ea580c" />
              </div>
              <div className="activity-body">
                <div className="activity-top-line">
                  <span className="activity-title-text">New equipment registered: Rowing Machine</span>
                  <span className="activity-time-tag">1 day ago</span>
                </div>
                <div className="activity-meta-tags">
                  <span className="activity-tag">📍 Cardio Zone</span>
                  <span className="activity-tag">Concept2 RowErg</span>
                  <span className="activity-tag-status success">Active</span>
                </div>
              </div>
            </div>

            <div className="recent-activity-modern-item">
              <div className="activity-icon-container green-bg">
                <Icons.CheckCircle size={15} color="#059669" />
              </div>
              <div className="activity-body">
                <div className="activity-top-line">
                  <span className="activity-title-text">Equipment status updated (Dumbbell Set)</span>
                  <span className="activity-time-tag">2 days ago</span>
                </div>
                <div className="activity-meta-tags">
                  <span className="activity-tag">📍 Free Weights</span>
                  <span className="activity-tag">5–50kg Rack</span>
                  <span className="activity-tag-status success">Operational</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Full-Width Equipment List Table */}
      <div className="equipment-table-panel" style={{ width: '100%' }}>
        {/* Header Controls Bar */}
        <div className="equipment-panel-header">
          <div className="equipment-panel-title-wrap">
            <Icons.List size={16} color="#ff7a00" />
            <h3 className="equipment-panel-title">Equipment List</h3>
            <span className="equipment-count-chip">{equipmentList.length} Units</span>
          </div>

          <div className="equipment-panel-filters">
            {/* Search Bar */}
            <div className="equip-search-box">
              <Icons.Search size={13} color="#94a3b8" />
              <input
                type="text"
                placeholder="Search equipment..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="equip-search-input"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="equip-search-clear"
                  title="Clear search"
                >
                  ×
                </button>
              )}
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="equip-filter-select"
            >
              <option value="">All Categories</option>
              <option value="cardio">Cardio</option>
              <option value="strength">Strength</option>
              <option value="free_weights">Free Weights</option>
              <option value="accessories">Accessories</option>
              <option value="recovery">Recovery</option>
              <option value="audio_visual">Audio & Visual</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="equip-filter-select"
            >
              <option value="">All Status</option>
              <option value="operational">Active</option>
              <option value="needs_maintenance">Maintenance</option>
              <option value="out_of_service">Out of Service</option>
            </select>
          </div>
        </div>

        {/* Table Container */}
        <div className="table-responsive" style={{ margin: 0, overflowX: 'auto' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
              <span className="spinner"></span>
              <p style={{ marginTop: 8, fontSize: 13 }}>Loading equipment assets...</p>
            </div>
          ) : equipmentList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>⚙️</div>
              <h4 style={{ margin: 0, fontSize: 15, color: 'var(--gym-text-primary, #0f172a)' }}>No Equipment Matches</h4>
              <p style={{ fontSize: 12.5, margin: '4px 0 12px' }}>Try adjusting your search query or category filters.</p>
              {canManage && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setAddForm(initialAddForm);
                    setIsAddOpen(true);
                  }}
                >
                  + Add New Asset
                </button>
              )}
            </div>
          ) : (
            <table className="gym-table equipment-table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th style={{ width: 60, textAlign: 'center' }}>Image</th>
                  <th style={{ minWidth: 170 }}>Name</th>
                  <th style={{ minWidth: 110 }}>Category</th>
                  <th style={{ minWidth: 95 }}>Condition</th>
                  <th style={{ minWidth: 95 }}>Status</th>
                  <th style={{ minWidth: 110 }}>Last Maintenance</th>
                  <th style={{ minWidth: 115, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedEquipment.map((item) => (
                  <tr key={item.id}>
                    <td style={{ textAlign: 'center' }}>
                      <div className="equipment-thumb-box" style={{ margin: 'auto' }} title={item.name}>
                        <EquipmentIllustration name={item.name} category={item.category} />
                      </div>
                    </td>
                    <td>
                      <div className="equip-name-cell">
                        <div className="equip-row-name" title={item.name}>{item.name}</div>
                        <div className="equip-row-meta">
                          <span className="equip-row-code">{item.equipment_code}</span>
                          {item.brand && <span className="equip-row-brand">· {item.brand}</span>}
                          {item.location_area && <span className="equip-row-brand" title={item.location_area}>· {item.location_area}</span>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="equip-category-cell">
                        {formatCategoryName(item.category)}
                      </span>
                    </td>
                    <td>
                      {renderConditionBadge(item)}
                    </td>
                    <td>
                      {renderStatusBadge(item.status)}
                    </td>
                    <td>
                      <span style={{ fontSize: 12, whiteSpace: 'nowrap', color: item.last_inspected_at ? 'var(--gym-text-primary, #334155)' : '#94a3b8' }}>
                        {item.last_inspected_at
                          ? new Date(item.last_inspected_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
                          : (item.next_maintenance_due ? `Due: ${item.next_maintenance_due}` : 'Scheduled')}
                      </span>
                    </td>
                    <td className="equip-actions-cell">
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        {/* View details eye button */}
                        <button
                          type="button"
                          className="btn-action-icon"
                          onClick={() => handleOpenViewModal(item)}
                          title="View Asset Details & Machine Breakdown"
                          aria-label="View Details"
                        >
                          <Icons.Eye size={13} />
                        </button>

                        {/* Edit / Inspect pencil button */}
                        {canManage && (
                          <button
                            type="button"
                            className="btn-action-icon"
                            onClick={() => {
                              setSelectedAsset(item);
                              setEditForm({
                                name: item.name || '',
                                category: item.category || 'strength',
                                brand: item.brand || '',
                                model_number: item.model_number || '',
                                status: item.status || 'operational',
                                condition: item.status === 'out_of_service' ? 'poor' : item.status === 'needs_maintenance' ? 'fair' : 'good',
                                location_area: item.location_area || '',
                                last_inspected_at: item.last_inspected_at || new Date().toISOString().split('T')[0],
                                next_maintenance_due: item.next_maintenance_due || '',
                                maintenance_notes: item.maintenance_notes || '',
                              });
                              setIsEditOpen(true);
                            }}
                            title="Inspect / Edit Equipment"
                            aria-label="Edit Equipment"
                          >
                            <Icons.Edit size={13} />
                          </button>
                        )}

                        {/* Delete trash button */}
                        {canManage && (
                          <button
                            type="button"
                            className="btn-action-icon btn-danger-icon"
                            onClick={() => setDeleteConfirmAsset(item)}
                            title="Delete Equipment Record"
                            aria-label="Delete Asset"
                          >
                            <Icons.Trash size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Clean, Well-Structured Pagination Bar */}
        <div className="equip-pagination-bar">
          <span className="equip-pagination-info">
            Showing {equipmentList.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, equipmentList.length)} of {equipmentList.length} assets
          </span>
          <div className="equip-pagination-controls">
            <button
              type="button"
              className="btn-equip-page"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              title="Previous Page"
            >
              <Icons.ChevronLeft size={13} />
              <span>Prev</span>
            </button>
            <span className="equip-page-indicator">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              className="btn-equip-page"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              title="Next Page"
            >
              <span>Next</span>
              <Icons.ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MODALS
          ========================================================================= */}

      {/* Modal 1: Add New Equipment Asset */}
      {isAddOpen && (
        <div className="modal-backdrop" onClick={() => !isSubmitting && setIsAddOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: '#fff7ed', color: '#ff7a00', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icons.Dumbbell size={18} color="#ff7a00" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Add New Equipment</h3>
                  <span style={{ fontSize: 11, color: '#64748b' }}>Register gym machine or equipment asset</span>
                </div>
              </div>
              <button type="button" className="btn-close" onClick={() => setIsAddOpen(false)}>×</button>
            </div>

            <form onSubmit={handleAddSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: 12, fontWeight: 700 }}>Equipment Name <span style={{ color: '#ea580c' }}>*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Commercial Treadmill Pro 5000"
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    className="form-control"
                    style={{ height: 36, fontSize: 13 }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: 12, fontWeight: 700 }}>Category <span style={{ color: '#ea580c' }}>*</span></label>
                    <select
                      value={addForm.category}
                      onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}
                      className="form-control"
                      style={{ height: 36, fontSize: 12.5 }}
                    >
                      <option value="cardio">Cardio Equipment</option>
                      <option value="strength">Strength Machine</option>
                      <option value="free_weights">Free Weights</option>
                      <option value="accessories">Accessories & Bands</option>
                      <option value="recovery">Recovery & Sauna</option>
                      <option value="audio_visual">Audio & Visual</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: 12, fontWeight: 700 }}>Initial Status</label>
                    <select
                      value={addForm.status}
                      onChange={(e) => setAddForm({ ...addForm, status: e.target.value })}
                      className="form-control"
                      style={{ height: 36, fontSize: 12.5 }}
                    >
                      <option value="operational">Active / Operational</option>
                      <option value="needs_maintenance">Needs Maintenance</option>
                      <option value="under_repair">Under Repair</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: 12, fontWeight: 700 }}>Brand / Manufacturer</label>
                    <input
                      type="text"
                      placeholder="e.g. Life Fitness, Hammer Strength"
                      value={addForm.brand}
                      onChange={(e) => setAddForm({ ...addForm, brand: e.target.value })}
                      className="form-control"
                      style={{ height: 36, fontSize: 12.5 }}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: 12, fontWeight: 700 }}>Model / Serial Number</label>
                    <input
                      type="text"
                      placeholder="e.g. T5-GO-0105"
                      value={addForm.model_number}
                      onChange={(e) => setAddForm({ ...addForm, model_number: e.target.value })}
                      className="form-control"
                      style={{ height: 36, fontSize: 12.5 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: 12, fontWeight: 700 }}>Floor Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Main Cardio Zone, Strength Bay"
                      value={addForm.location_area}
                      onChange={(e) => setAddForm({ ...addForm, location_area: e.target.value })}
                      className="form-control"
                      style={{ height: 36, fontSize: 12.5 }}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: 12, fontWeight: 700 }}>Purchase Cost (ETB)</label>
                    <input
                      type="number"
                      placeholder="e.g. 185000"
                      value={addForm.purchase_cost}
                      onChange={(e) => setAddForm({ ...addForm, purchase_cost: e.target.value })}
                      className="form-control"
                      style={{ height: 36, fontSize: 12.5 }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: 12, fontWeight: 700 }}>Next Maintenance Date</label>
                  <input
                    type="date"
                    value={addForm.next_maintenance_due}
                    onChange={(e) => setAddForm({ ...addForm, next_maintenance_due: e.target.value })}
                    className="form-control"
                    style={{ height: 36, fontSize: 12.5 }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: 12, fontWeight: 700 }}>Maintenance / Setup Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Initial inspection passed. Tension calibrated and cables lubricated."
                    value={addForm.maintenance_notes}
                    onChange={(e) => setAddForm({ ...addForm, maintenance_notes: e.target.value })}
                    className="form-control"
                    style={{ fontSize: 12.5 }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18, paddingTop: 12, borderTop: '1px solid #e2e8f0' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsAddOpen(false)} disabled={isSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={isSubmitting}>
                  {isSubmitting ? 'Registering...' : 'Save & Register Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Edit & Inspect Asset */}
      {isEditOpen && selectedAsset && (
        <div className="modal-backdrop" onClick={() => !isSubmitting && setIsEditOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Inspect / Edit Asset</h3>
                <span style={{ fontSize: 11, color: '#ea580c', fontWeight: 700 }}>
                  {selectedAsset.equipment_code} • {selectedAsset.name}
                </span>
              </div>
              <button type="button" className="btn-close" onClick={() => setIsEditOpen(false)}>×</button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: 12, fontWeight: 700 }}>Operational Status</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      className="form-control"
                      style={{ height: 36, fontSize: 12.5 }}
                    >
                      <option value="operational">Active / Operational</option>
                      <option value="needs_maintenance">Needs Maintenance</option>
                      <option value="under_repair">Under Repair</option>
                      <option value="out_of_service">Out of Service</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: 12, fontWeight: 700 }}>Condition</label>
                    <select
                      value={editForm.condition}
                      onChange={(e) => setEditForm({ ...editForm, condition: e.target.value })}
                      className="form-control"
                      style={{ height: 36, fontSize: 12.5 }}
                    >
                      <option value="good">Good (100% Operational)</option>
                      <option value="fair">Fair (Wear & Tear)</option>
                      <option value="poor">Poor (Needs Urgent Care)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: 12, fontWeight: 700 }}>Floor Location Area</label>
                  <input
                    type="text"
                    value={editForm.location_area}
                    onChange={(e) => setEditForm({ ...editForm, location_area: e.target.value })}
                    className="form-control"
                    style={{ height: 36, fontSize: 12.5 }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: 12, fontWeight: 700 }}>Last Inspected Date</label>
                    <input
                      type="date"
                      value={editForm.last_inspected_at}
                      onChange={(e) => setEditForm({ ...editForm, last_inspected_at: e.target.value })}
                      className="form-control"
                      style={{ height: 36, fontSize: 12.5 }}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: 12, fontWeight: 700 }}>Next Maintenance Due</label>
                    <input
                      type="date"
                      value={editForm.next_maintenance_due}
                      onChange={(e) => setEditForm({ ...editForm, next_maintenance_due: e.target.value })}
                      className="form-control"
                      style={{ height: 36, fontSize: 12.5 }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: 12, fontWeight: 700 }}>Inspection Log & Service Notes</label>
                  <textarea
                    rows={3}
                    value={editForm.maintenance_notes}
                    onChange={(e) => setEditForm({ ...editForm, maintenance_notes: e.target.value })}
                    placeholder="Enter technician notes, parts replaced, or service details..."
                    className="form-control"
                    style={{ fontSize: 12.5 }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16, paddingTop: 12, borderTop: '1px solid #e2e8f0' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsEditOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={isSubmitting}>
                  {isSubmitting ? 'Updating...' : 'Save Inspection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: View Equipment Details with Large Real Machine / Pinterest Image, Muscle Anatomy, & Structured Details (No Video) */}
      {isViewOpen && selectedAsset && (() => {
        const visual = getEquipmentVisual(selectedAsset.name, selectedAsset.category);
        const muscleData = getEquipmentMuscleData(selectedAsset.name, selectedAsset.category);

        return (
          <div className="modal-backdrop" onClick={() => setIsViewOpen(false)}>
            <div className="modal-card equip-modal-card-wide" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="equipment-thumb-box" style={{ width: 44, height: 44 }}>
                    <EquipmentIllustration name={selectedAsset.name} category={selectedAsset.category} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--gym-text-primary, #0f172a)' }}>
                      {selectedAsset.name}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <span className="equip-row-code">{selectedAsset.equipment_code}</span>
                      {selectedAsset.brand && <span style={{ fontSize: 11.5, color: '#64748b' }}>· {selectedAsset.brand}</span>}
                      <span style={{ fontSize: 11.5, color: '#64748b' }}>· 📍 {selectedAsset.location_area || 'Main Floor'}</span>
                    </div>
                  </div>
                </div>
                <button type="button" className="btn-close" onClick={() => setIsViewOpen(false)} aria-label="Close modal">×</button>
              </div>

              {/* 2-Column Wide Grid: Left Visual Exercise & Anatomy, Right Structured Hardware Specs */}
              <div className="equip-modal-grid">
                {/* Left Column: Large Hero Machine Image & Muscle Anatomy */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Large Visible Image Frame */}
                  <div className="equip-hero-frame">
                    <span className="equip-hero-badge">
                      📌 {visual.badge}
                    </span>
                    <img
                      src={visual.hero}
                      alt={selectedAsset.name}
                      className="equip-hero-image"
                      title={`${selectedAsset.name} - Machine View`}
                    />
                  </div>

                  {/* Muscle Anatomy Card (The Body That Machine Worked) */}
                  <div className="equip-anatomy-card">
                    <div className="equip-anatomy-fig-wrap">
                      <MuscleAnatomyFigure region={muscleData.region} />
                    </div>
                    <div className="equip-anatomy-details">
                      <div className="equip-anatomy-title">
                        <span>💪 Muscles Worked</span>
                        <span style={{ fontSize: 11, color: '#ea580c', fontWeight: 700 }}>({muscleData.regionName})</span>
                      </div>
                      <div>
                        <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>
                          Primary Focus:
                        </div>
                        <span className="equip-muscle-pill-primary">
                          🔥 {muscleData.primary}
                        </span>
                      </div>
                      <div>
                        <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>
                          Secondary Synergists:
                        </div>
                        <div className="equip-muscle-pill-secondary">
                          {muscleData.secondary}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Biomechanics & Coaching Form Tip */}
                  <div className="equip-coaching-box">
                    <div style={{ fontWeight: 800, color: '#ea580c', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                      <span>💡 Machine Biomechanics & Form Tip:</span>
                    </div>
                    <div>{muscleData.coachingTip}</div>
                  </div>
                </div>

                {/* Right Column: Hardware Details, Status & Structured History */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Status & Condition Bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {renderConditionBadge(selectedAsset)}
                    {renderStatusBadge(selectedAsset.status)}
                    <span className="equip-category-cell" style={{ marginLeft: 'auto', fontSize: 12 }}>
                      📂 {formatCategoryName(selectedAsset.category)}
                    </span>
                  </div>

                  {/* Hardware Specs Grid */}
                  <div style={{
                    background: 'var(--gym-card-bg-subtle, #f8fafc)',
                    border: '1px solid var(--gym-card-border, #e2e8f0)',
                    borderRadius: 10,
                    padding: '14px 16px',
                    fontSize: 12.5,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#64748b' }}>Brand / Manufacturer:</span>
                      <strong style={{ color: 'var(--gym-text-primary, #0f172a)' }}>{selectedAsset.brand || 'Tigat Gym Certified'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#64748b' }}>Model / Serial Number:</span>
                      <strong style={{ color: 'var(--gym-text-primary, #0f172a)', fontFamily: 'monospace' }}>
                        {selectedAsset.model_number || selectedAsset.equipment_code}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#64748b' }}>Movement Mechanics:</span>
                      <strong style={{ color: '#ea580c' }}>{muscleData.movementType}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#64748b' }}>Gym Floor Location:</span>
                      <strong style={{ color: 'var(--gym-text-primary, #0f172a)' }}>
                        📍 {selectedAsset.location_area || 'Main Floor'}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#64748b' }}>Purchase Valuation:</span>
                      <strong style={{ color: '#ea580c', fontWeight: 800 }}>
                        {selectedAsset.purchase_cost ? `${Number(selectedAsset.purchase_cost).toLocaleString()} ETB` : 'Capital Asset Record'}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#64748b' }}>Last Inspection Date:</span>
                      <strong style={{ color: 'var(--gym-text-primary, #0f172a)' }}>
                        {selectedAsset.last_inspected_at
                          ? new Date(selectedAsset.last_inspected_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
                          : 'Recently Verified'}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#64748b' }}>Next Maintenance Due:</span>
                      <strong style={{ color: selectedAsset.next_maintenance_due ? '#ea580c' : '#10b981' }}>
                        {selectedAsset.next_maintenance_due || 'On Schedule'}
                      </strong>
                    </div>
                  </div>

                  {/* Maintenance Log Notes */}
                  {selectedAsset.maintenance_notes ? (
                    <div style={{
                      background: 'rgba(234, 88, 12, 0.08)',
                      border: '1px solid rgba(234, 88, 12, 0.25)',
                      borderRadius: 9,
                      padding: '12px 14px',
                      fontSize: 12,
                      color: 'var(--gym-text-primary, #0f172a)',
                      lineHeight: 1.45
                    }}>
                      <strong style={{ color: '#ea580c' }}>🔧 Maintenance Service History:</strong>
                      <div style={{ marginTop: 4, color: 'inherit' }}>{selectedAsset.maintenance_notes}</div>
                    </div>
                  ) : (
                    <div style={{
                      background: 'rgba(16, 185, 129, 0.08)',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      borderRadius: 9,
                      padding: '10px 14px',
                      fontSize: 12,
                      color: '#059669',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 7
                    }}>
                      <span>✓</span>
                      <span>Machine is fully certified and operational with zero pending defect reports.</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 'auto', paddingTop: 14, borderTop: '1px solid var(--gym-card-border, #e2e8f0)' }}>
                    {canManage && (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          setIsViewOpen(false);
                          setEditForm({
                            name: selectedAsset.name || '',
                            category: selectedAsset.category || 'strength',
                            brand: selectedAsset.brand || '',
                            model_number: selectedAsset.model_number || '',
                            status: selectedAsset.status || 'operational',
                            condition: selectedAsset.status === 'out_of_service' ? 'poor' : selectedAsset.status === 'needs_maintenance' ? 'fair' : 'good',
                            location_area: selectedAsset.location_area || '',
                            last_inspected_at: selectedAsset.last_inspected_at || new Date().toISOString().split('T')[0],
                            next_maintenance_due: selectedAsset.next_maintenance_due || '',
                            maintenance_notes: selectedAsset.maintenance_notes || '',
                          });
                          setIsEditOpen(true);
                        }}
                      >
                        <Icons.Edit size={13} />
                        <span>Edit Asset Details</span>
                      </button>
                    )}
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsViewOpen(false)}>
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal 4: Schedule Maintenance */}
      {isScheduleOpen && (
        <div className="modal-backdrop" onClick={() => !isSubmitting && setIsScheduleOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(245, 158, 11, 0.15)', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icons.Wrench size={18} color="#d97706" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Schedule Maintenance</h3>
                  <span style={{ fontSize: 11, color: '#64748b' }}>Book technical service or inspection</span>
                </div>
              </div>
              <button type="button" className="btn-close" onClick={() => setIsScheduleOpen(false)}>×</button>
            </div>

            <form onSubmit={handleScheduleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: 12, fontWeight: 700 }}>Select Equipment Asset *</label>
                  <select
                    required
                    value={scheduleForm.equipment_id}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, equipment_id: e.target.value })}
                    className="form-control"
                    style={{ height: 36, fontSize: 12.5 }}
                  >
                    <option value="">-- Choose Equipment --</option>
                    {equipmentList.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.equipment_code} — {item.name} ({item.brand || item.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: 12, fontWeight: 700 }}>Maintenance Date *</label>
                  <input
                    type="date"
                    required
                    value={scheduleForm.maintenance_date}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, maintenance_date: e.target.value })}
                    className="form-control"
                    style={{ height: 36, fontSize: 12.5 }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: 12, fontWeight: 700 }}>Service Type</label>
                  <select
                    value={scheduleForm.service_type}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, service_type: e.target.value })}
                    className="form-control"
                    style={{ height: 36, fontSize: 12.5 }}
                  >
                    <option value="Routine Inspection & Lubrication">Routine Inspection & Lubrication</option>
                    <option value="Belt & Cable Replacement">Belt & Cable Replacement</option>
                    <option value="Motor Calibration & Electronics">Motor Calibration & Electronics</option>
                    <option value="Upholstery & Frame Repair">Upholstery & Frame Repair</option>
                    <option value="Weight Stack Pin Service">Weight Stack Pin Service</option>
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: 12, fontWeight: 700 }}>Technician / Service Provider</label>
                  <input
                    type="text"
                    value={scheduleForm.technician_name}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, technician_name: e.target.value })}
                    className="form-control"
                    style={{ height: 36, fontSize: 12.5 }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: 12, fontWeight: 700 }}>Service Instructions / Notes</label>
                  <textarea
                    rows={2}
                    value={scheduleForm.notes}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
                    placeholder="Specific items to check or replace during service..."
                    className="form-control"
                    style={{ fontSize: 12.5 }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16, paddingTop: 12, borderTop: '1px solid #e2e8f0' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsScheduleOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={isSubmitting}>
                  {isSubmitting ? 'Scheduling...' : 'Confirm Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 5: Delete Confirmation Modal */}
      {deleteConfirmAsset && (
        <div className="modal-backdrop" onClick={() => !isDeleting && setDeleteConfirmAsset(null)}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 440,
              width: '100%',
              borderRadius: 16,
              padding: 0,
              overflow: 'hidden',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              margin: 'auto',
              boxShadow: '0 24px 48px rgba(0, 0, 0, 0.25)',
            }}
          >
            <div style={{
              background: '#fef2f2',
              borderBottom: '1px solid #fee2e2',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: '#fee2e2',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #fca5a5',
                  flexShrink: 0,
                }}>
                  <Icons.Trash size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 800, color: '#991b1b' }}>
                    Delete Equipment Asset
                  </h3>
                  <div style={{ fontSize: 11.5, color: '#b91c1c', marginTop: 1 }}>
                    Decommissioning confirmation
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="btn-close"
                disabled={isDeleting}
                onClick={() => setDeleteConfirmAsset(null)}
                style={{ background: 'transparent', border: 'none', fontSize: 20, color: '#991b1b', cursor: 'pointer', lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--gym-text-primary, #334155)', lineHeight: 1.5 }}>
                Are you sure you want to permanently remove <strong style={{ color: '#0f172a' }}>"{deleteConfirmAsset.name}"</strong>?
              </p>

              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                padding: '10px 14px',
                marginBottom: 14,
                fontSize: 12,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ color: '#64748b' }}>Asset Code:</span>
                  <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{deleteConfirmAsset.equipment_code}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ color: '#64748b' }}>Category:</span>
                  <strong style={{ color: '#0f172a', textTransform: 'capitalize' }}>{deleteConfirmAsset.category?.replace('_', ' ')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Current Status:</span>
                  <strong style={{ textTransform: 'capitalize', color: deleteConfirmAsset.status === 'operational' ? '#16a34a' : '#ea580c' }}>
                    {deleteConfirmAsset.status?.replace('_', ' ')}
                  </strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={isDeleting}
                  onClick={() => setDeleteConfirmAsset(null)}
                  style={{ minWidth: 85, height: 34, fontSize: 12.5 }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  style={{
                    minWidth: 125,
                    height: 34,
                    fontSize: 12.5,
                    fontWeight: 700,
                    background: '#dc2626',
                    borderColor: '#dc2626',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  {isDeleting ? 'Removing...' : (
                    <>
                      <Icons.Trash size={14} />
                      <span>Delete Asset</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
