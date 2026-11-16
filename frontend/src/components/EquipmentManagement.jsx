import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '../context/useAuth';
import apiClient from '../services/api';

const Icons = {
  Camera: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
      <circle cx="12" cy="13" r="3"/>
    </svg>
  ),
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

// Safe ISO Date Formatter
const formatIsoDate = (val, fallback = 'On Schedule') => {
  if (!val) return fallback;
  try {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    }
  } catch {
    // fallback
  }
  return String(val);
};

// Category Icon Helper for Template Header
const getCategoryIcon = (category = '') => {
  switch ((category || '').toLowerCase()) {
    case 'strength':
      return '💪';
    case 'cardio':
      return '🏃';
    case 'free_weights':
      return '⚖️';
    case 'recovery':
    case 'accessories':
      return '🧘';
    case 'audio_visual':
      return '📺';
    default:
      return '💪';
  }
};

// Condition Name Formatter
const formatConditionName = (cond = '') => {
  const c = (cond || '').toLowerCase();
  if (c === 'poor') return 'Poor';
  if (c === 'fair') return 'Fair';
  return 'Good';
};

// Status Name Formatter
const formatStatusName = (status = '') => {
  const s = (status || '').toLowerCase();
  if (s === 'out_of_service') return 'Out of Service';
  if (s === 'needs_maintenance') return 'Maintenance';
  return 'Active';
};

// Pinterest Anatomical Visuals & Real Professional Equipment Asset Mapping
const getEquipmentVisual = (name = '', category = '', allowFallback = false) => {
  const n = (name || '').toLowerCase();
  const c = (category || '').toLowerCase();

  // 1. Olympic Weight Plate Set (Check before lat so 'plate' never triggers 'lat')
  if (n.includes('plate')) {
    return {
      thumb: '/equipment/weight_plates.png',
      hero: '/equipment/weight_plates.png',
      badge: 'Standard Unit',
      contain: true,
      slides: [
        '/equipment/weight_plates.png',
        '/equipment/barbell_set.png',
        '/equipment/power_rack.png',
      ],
    };
  }

  // 2. Glute Kickback / Hip Abduction / Adduction
  if (n.includes('glute') || n.includes('kickback') || n.includes('hip abduction') || n.includes('abduction') || n.includes('adduction') || n.includes('hip thrust')) {
    return {
      thumb: '/equipment/glute_kickback.jpg',
      hero: '/equipment/glute_kickback.jpg',
      badge: 'Standard Unit',
      contain: false,
      slides: [
        '/equipment/glute_kickback.jpg',
        '/equipment/anatomy_figure_3d.jpg',
        '/equipment/leg_press.png',
      ],
    };
  }

  // 3. Ab Crunch Machine (Exact Pinterest anatomy diagram)
  if (n.includes('crunch') || n.includes('ab machine')) {
    return {
      thumb: '/equipment/ab_crunch_machine.png',
      hero: '/equipment/ab_crunch_machine.png',
      badge: 'Standard Unit',
      contain: true,
      slides: [
        '/equipment/ab_crunch_machine.png',
        '/equipment/glute_kickback.jpg',
        '/equipment/anatomy_figure_3d.jpg',
      ],
    };
  }

  // 4. Commercial Treadmill
  if (n.includes('treadmill')) {
    return {
      thumb: '/equipment/treadmill.png',
      hero: '/equipment/treadmill.png',
      badge: 'Standard Unit',
      contain: true,
      slides: [
        '/equipment/treadmill.png',
        '/equipment/elliptical.png',
        '/equipment/exercise_bike.png',
      ],
    };
  }

  // 5. Elliptical Cross Trainer
  if (n.includes('elliptical')) {
    return {
      thumb: '/equipment/elliptical.png',
      hero: '/equipment/elliptical.png',
      badge: 'Standard Unit',
      contain: true,
      slides: [
        '/equipment/elliptical.png',
        '/equipment/treadmill.png',
        '/equipment/stair_climber.png',
      ],
    };
  }

  // 6. Stair Climber / StepMill
  if (n.includes('stair') || n.includes('stepmill') || n.includes('climber')) {
    return {
      thumb: '/equipment/stair_climber.png',
      hero: '/equipment/stair_climber.png',
      badge: 'Standard Unit',
      contain: true,
      slides: [
        '/equipment/stair_climber.png',
        '/equipment/treadmill.png',
        '/equipment/elliptical.png',
      ],
    };
  }

  // 7. Ski Erg
  if (n.includes('ski erg')) {
    return {
      thumb: '/equipment/ski_erg.png',
      hero: '/equipment/ski_erg.png',
      badge: 'Standard Unit',
      contain: true,
      slides: [
        '/equipment/ski_erg.png',
        '/equipment/rowing_machine.png',
        '/equipment/exercise_bike.png',
      ],
    };
  }

  // 8. Rowing Machine Concept2
  if (n.includes('rowing')) {
    return {
      thumb: '/equipment/rowing_machine.png',
      hero: '/equipment/rowing_machine.png',
      badge: 'Standard Unit',
      contain: true,
      slides: [
        '/equipment/rowing_machine.png',
        '/equipment/ski_erg.png',
        '/equipment/exercise_bike.png',
      ],
    };
  }

  // 9. Exercise Bike / Assault Air Bike / Spin Bike
  if (n.includes('air bike') || n.includes('assault') || n.includes('spin') || n.includes('bike') || n.includes('cycle')) {
    return {
      thumb: '/equipment/exercise_bike.png',
      hero: '/equipment/exercise_bike.png',
      badge: 'Standard Unit',
      contain: true,
      slides: [
        '/equipment/exercise_bike.png',
        '/equipment/treadmill.png',
        '/equipment/elliptical.png',
      ],
    };
  }

  // 10. Smith Machine
  if (n.includes('smith')) {
    return {
      thumb: '/equipment/smith_machine.png',
      hero: '/equipment/smith_machine.png',
      badge: 'Standard Unit',
      contain: true,
      slides: [
        '/equipment/smith_machine.png',
        '/equipment/power_rack.png',
        '/equipment/bench_press.png',
      ],
    };
  }

  // 11. Olympic Power Rack
  if (n.includes('power rack')) {
    return {
      thumb: '/equipment/power_rack.png',
      hero: '/equipment/power_rack.png',
      badge: 'Standard Unit',
      contain: true,
      slides: [
        '/equipment/power_rack.png',
        '/equipment/smith_machine.png',
        '/equipment/barbell_set.png',
      ],
    };
  }

  // 12. Adjustable Incline Bench
  if (n.includes('incline bench') || n.includes('incline')) {
    return {
      thumb: '/equipment/incline_bench.png',
      hero: '/equipment/incline_bench.png',
      badge: 'Standard Unit',
      contain: true,
      slides: [
        '/equipment/incline_bench.png',
        '/equipment/bench_press.png',
        '/equipment/bench_press_anatomy.png',
      ],
    };
  }

  // 13. Flat Utility Bench / Bench Press
  if (n.includes('flat utility') || n.includes('flat bench') || n.includes('bench')) {
    return {
      thumb: '/equipment/bench_press.png',
      hero: '/equipment/bench_press.png',
      badge: 'Standard Unit',
      contain: true,
      slides: [
        '/equipment/bench_press.png',
        '/equipment/bench_press_anatomy.png',
        '/equipment/incline_bench.png',
      ],
    };
  }

  // 14. Pec Deck / Butterfly Machine
  if (n.includes('pec deck') || n.includes('butterfly')) {
    return {
      thumb: '/equipment/pec_deck.png',
      hero: '/equipment/pec_deck.png',
      badge: 'Standard Unit',
      contain: true,
      slides: [
        '/equipment/pec_deck.png',
        '/equipment/cable_crossover.png',
        '/equipment/bench_press_anatomy.png',
      ],
    };
  }

  // 15. Cable Crossover Station
  if (n.includes('cable') || n.includes('crossover')) {
    return {
      thumb: '/equipment/cable_crossover.png',
      hero: '/equipment/cable_crossover.png',
      badge: 'Standard Unit',
      contain: true,
      slides: [
        '/equipment/cable_crossover.png',
        '/equipment/lat_pulldown_anatomy.png',
        '/equipment/lat_pulldown.png',
      ],
    };
  }

  // 16. Shoulder Press Machine
  if (n.includes('shoulder') || n.includes('overhead')) {
    return {
      thumb: '/equipment/shoulder_press.png',
      hero: '/equipment/shoulder_press.png',
      badge: 'Standard Unit',
      contain: true,
      slides: [
        '/equipment/shoulder_press.png',
        '/equipment/cable_crossover.png',
        '/equipment/dumbbell_set.png',
      ],
    };
  }

  // 17. Assisted Pull-Up / Dip Machine
  if (n.includes('assisted pull-up') || n.includes('dip machine') || (n.includes('pull-up') && n.includes('machine'))) {
    return {
      thumb: '/equipment/pull_up_station.png',
      hero: '/equipment/pull_up_station.png',
      badge: 'Standard Unit',
      contain: true,
      slides: [
        '/equipment/pull_up_station.png',
        '/equipment/lat_pulldown.png',
        '/equipment/lat_pulldown_anatomy.png',
      ],
    };
  }

  // 18. Lat Pulldown & Seated Row Machine
  if (n.includes('pulldown') || /\blat\b|\blats\b/.test(n) || (n.includes('row') && !n.includes('rowing') && !n.includes('rope'))) {
    return {
      thumb: '/equipment/lat_pulldown.png',
      hero: '/equipment/lat_pulldown.png',
      badge: 'Standard Unit',
      contain: true,
      slides: [
        '/equipment/lat_pulldown.png',
        '/equipment/lat_pulldown_anatomy.png',
        '/equipment/pull_up_station.png',
      ],
    };
  }

  // 19. Back Extension / Roman Chair
  if (n.includes('back extension') || n.includes('roman chair') || n.includes('hyperextension')) {
    return {
      thumb: '/equipment/back_extension.png',
      hero: '/equipment/back_extension.png',
      badge: 'Standard Unit',
      contain: true,
      slides: [
        '/equipment/back_extension.png',
        '/equipment/anatomy_figure_3d.jpg',
        '/equipment/ab_crunch_machine.png',
      ],
    };
  }

  // 20. Leg Press / Hack Squat / Leg Curl / Leg Extension / Calf Raise
  if (n.includes('leg press') || n.includes('hack squat') || n.includes('leg curl') || n.includes('leg extension') || n.includes('calf raise') || n.includes('squat')) {
    return {
      thumb: '/equipment/leg_press.png',
      hero: '/equipment/leg_press.png',
      badge: 'Standard Unit',
      contain: true,
      slides: [
        '/equipment/leg_press.png',
        '/equipment/glute_kickback.jpg',
        '/equipment/anatomy_figure_3d.jpg',
      ],
    };
  }

  // 21. Olympic Barbell & EZ Curl Bar
  if (n.includes('barbell') || n.includes('ez curl')) {
    return {
      thumb: '/equipment/barbell_set.png',
      hero: '/equipment/barbell_set.png',
      badge: 'Standard Unit',
      contain: true,
      slides: [
        '/equipment/barbell_set.png',
        '/equipment/weight_plates.png',
        '/equipment/dumbbell_set.png',
      ],
    };
  }

  // 22. Dumbbell Rack Set
  if (n.includes('dumbbell') || (n.includes('curl') && !n.includes('leg'))) {
    return {
      thumb: '/equipment/dumbbell_set.png',
      hero: '/equipment/dumbbell_set.png',
      badge: 'Standard Unit',
      contain: true,
      slides: [
        '/equipment/dumbbell_set.png',
        '/equipment/bicep_curl_anatomy.png',
        '/equipment/kettlebell.png',
      ],
    };
  }

  // 23. Kettlebells
  if (n.includes('kettlebell')) {
    return {
      thumb: '/equipment/kettlebell.png',
      hero: '/equipment/kettlebell.png',
      badge: 'Standard Unit',
      contain: true,
      slides: [
        '/equipment/kettlebell.png',
        '/equipment/dumbbell_set.png',
        '/equipment/battle_ropes.png',
      ],
    };
  }

  // 24. Battle Ropes
  if (n.includes('battle rope') || (n.includes('rope') && !n.includes('rowing'))) {
    return {
      thumb: '/equipment/battle_ropes.png',
      hero: '/equipment/battle_ropes.png',
      badge: 'Standard Unit',
      contain: true,
      slides: [
        '/equipment/battle_ropes.png',
        '/equipment/plyo_box.png',
        '/equipment/trx_trainer.png',
      ],
    };
  }

  // 25. Plyo Box Set
  if (n.includes('plyo') || n.includes('box set')) {
    return {
      thumb: '/equipment/plyo_box.png',
      hero: '/equipment/plyo_box.png',
      badge: 'Standard Unit',
      contain: true,
      slides: [
        '/equipment/plyo_box.png',
        '/equipment/battle_ropes.png',
        '/equipment/medicine_ball.png',
      ],
    };
  }

  // 26. Resistance Bands
  if (n.includes('resistance band') || (n.includes('band') && !n.includes('brand'))) {
    return {
      thumb: '/equipment/resistance_bands.png',
      hero: '/equipment/resistance_bands.png',
      badge: 'Standard Unit',
      contain: true,
      slides: [
        '/equipment/resistance_bands.png',
        '/equipment/trx_trainer.png',
        '/equipment/yoga_mat.png',
      ],
    };
  }

  // 27. TRX Suspension Trainer
  if (n.includes('trx') || n.includes('suspension')) {
    return {
      thumb: '/equipment/trx_trainer.png',
      hero: '/equipment/trx_trainer.png',
      badge: 'Standard Unit',
      contain: true,
      slides: [
        '/equipment/trx_trainer.png',
        '/equipment/pull_up_station.png',
        '/equipment/resistance_bands.png',
      ],
    };
  }

  // 28. Medicine Ball Set
  if (n.includes('medicine ball') || n.includes('slam ball') || (n.includes('ball') && !n.includes('barbell'))) {
    return {
      thumb: '/equipment/medicine_ball.png',
      hero: '/equipment/medicine_ball.png',
      badge: 'Standard Unit',
      contain: true,
      slides: [
        '/equipment/medicine_ball.png',
        '/equipment/kettlebell.png',
        '/equipment/plyo_box.png',
      ],
    };
  }

  // 29. Foam Roller Set
  if (n.includes('foam roller') || n.includes('roller')) {
    return {
      thumb: '/equipment/foam_roller.png',
      hero: '/equipment/foam_roller.png',
      badge: 'Standard Unit',
      contain: true,
      slides: [
        '/equipment/foam_roller.png',
        '/equipment/massage_gun.png',
        '/equipment/yoga_mat.png',
      ],
    };
  }

  // 30. Pull-Up Bar Wall Mount & Stretch Rack
  if (n.includes('pull-up') || n.includes('stretch rack') || n.includes('chin-up')) {
    return {
      thumb: '/equipment/pull_up_station.png',
      hero: '/equipment/pull_up_station.png',
      badge: 'Standard Unit',
      contain: true,
      slides: [
        '/equipment/pull_up_station.png',
        '/equipment/lat_pulldown.png',
        '/equipment/back_extension.png',
      ],
    };
  }

  // 31. Massage Gun Percussive Therapy
  if (n.includes('massage') || n.includes('percussive')) {
    return {
      thumb: '/equipment/massage_gun.png',
      hero: '/equipment/massage_gun.png',
      badge: 'Standard Unit',
      contain: true,
      slides: [
        '/equipment/massage_gun.png',
        '/equipment/foam_roller.png',
        '/equipment/yoga_mat.png',
      ],
    };
  }

  // 32. Yoga / Stretching Mats
  if (n.includes('yoga') || n.includes('mat') || (n.includes('stretch') && !n.includes('rack'))) {
    return {
      thumb: '/equipment/yoga_mat.png',
      hero: '/equipment/yoga_mat.png',
      badge: 'Standard Unit',
      contain: true,
      slides: [
        '/equipment/yoga_mat.png',
        '/equipment/foam_roller.png',
        '/equipment/resistance_bands.png',
      ],
    };
  }

  // 33. Commercial Sound System
  if (n.includes('sound') || n.includes('audio') || n.includes('speaker') || n.includes('jbl')) {
    return {
      thumb: '/equipment/sound_system.png',
      hero: '/equipment/sound_system.png',
      badge: 'Standard Unit',
      contain: true,
      slides: [
        '/equipment/sound_system.png',
        '/equipment/smart_tv.png',
      ],
    };
  }

  // 34. 75" Smart TV
  if (n.includes('tv') || n.includes('smart') || n.includes('television') || c === 'audio_visual') {
    return {
      thumb: '/equipment/smart_tv.png',
      hero: '/equipment/smart_tv.png',
      badge: 'Standard Unit',
      contain: true,
      slides: [
        '/equipment/smart_tv.png',
        '/equipment/sound_system.png',
      ],
    };
  }

  // Default fallback - only if explicitly allowed (never assign random photos by default)
  if (!allowFallback) {
    return null;
  }

  return {
    thumb: '/equipment/ab_crunch_machine.png',
    hero: '/equipment/ab_crunch_machine.png',
    badge: 'Standard Unit',
    contain: true,
    slides: [
      '/equipment/ab_crunch_machine.png',
      '/equipment/glute_kickback.jpg',
      '/equipment/anatomy_figure_3d.jpg',
    ],
  };
};

// Thumbnail & Equipment Icon Component
const EquipmentIllustration = ({ name = '', category = '', imageUrl = null }) => {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        loading="lazy"
        decoding="async"
        className="equip-thumb-img"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          borderRadius: 8,
          filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.08))',
        }}
        onError={(e) => {
          e.target.style.display = 'none';
        }}
      />
    );
  }

  // Check matching visual preset - never force random photo
  const visual = getEquipmentVisual(name, category, false);
  if (visual && visual.thumb) {
    return (
      <img
        src={visual.thumb}
        alt={name}
        loading="lazy"
        decoding="async"
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
  }

  // Clean, neutral placeholder icon if no photo is attached
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f1f5f9',
        borderRadius: 8,
        color: '#94a3b8',
      }}
      title="No photo provided (Optional)"
    >
      <Icons.Dumbbell size={18} color="#94a3b8" />
    </div>
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
  const isGlutes = region === 'glutes';
  const isFullBody = region === 'full_body' || region === 'recovery';
  const isFacility = region === 'facility';

  if (isGlutes) {
    return (
      <img
        src="/equipment/anatomy_figure_3d.jpg"
        alt="Glute Muscles 3D Anatomy"
        style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 8 }}
      />
    );
  }

  if (isFacility) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#ff7a00' }}>
        <span style={{ fontSize: 32 }}>🔊</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--gym-anatomy-stroke, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Audio / Visual</span>
      </div>
    );
  }

  const defaultFill = 'var(--gym-anatomy-fill, #e2e8f0)';
  const defaultStroke = 'var(--gym-anatomy-stroke, #94a3b8)';
  const targetFill = 'url(#muscleOrangeGrad)';
  const targetStroke = '#ff7a00';

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
      <path d="M52 41 L30 47 L27 64 L41 64 L50 45 Z" fill={isShoulders || isBack || isFullBody ? targetFill : defaultFill} stroke={isShoulders || isBack || isFullBody ? targetStroke : defaultStroke} strokeWidth="1.2" />
      <path d="M68 41 L90 47 L93 64 L79 64 L70 45 Z" fill={isShoulders || isBack || isFullBody ? targetFill : defaultFill} stroke={isShoulders || isBack || isFullBody ? targetStroke : defaultStroke} strokeWidth="1.2" />

      {/* Chest / Pectorals */}
      <path d="M50 45 L41 64 L59 64 L59 45 Z" fill={isChest || isFullBody ? targetFill : defaultFill} stroke={isChest || isFullBody ? targetStroke : defaultStroke} strokeWidth="1.2" />
      <path d="M70 45 L79 64 L61 64 L61 45 Z" fill={isChest || isFullBody ? targetFill : defaultFill} stroke={isChest || isFullBody ? targetStroke : defaultStroke} strokeWidth="1.2" />

      {/* Arms (Biceps & Forearms) */}
      <path d="M27 64 L23 92 L33 92 L37 64 Z" fill={isArms || isFullBody ? targetFill : defaultFill} stroke={isArms || isFullBody ? targetStroke : defaultStroke} strokeWidth="1.2" />
      <path d="M93 64 L97 92 L87 92 L83 64 Z" fill={isArms || isFullBody ? targetFill : defaultFill} stroke={isArms || isFullBody ? targetStroke : defaultStroke} strokeWidth="1.2" />
      <path d="M23 92 L19 120 L27 120 L33 92 Z" fill={isArms || isFullBody ? targetFill : defaultFill} stroke={isArms || isFullBody ? targetStroke : defaultStroke} strokeWidth="1.2" />
      <path d="M97 92 L101 120 L93 120 L87 92 Z" fill={isArms || isFullBody ? targetFill : defaultFill} stroke={isArms || isFullBody ? targetStroke : defaultStroke} strokeWidth="1.2" />

      {/* Abdominals / Core Section */}
      <rect x="47" y="66" width="11" height="9" rx="1.5" fill={isAbs || isFullBody ? targetFill : defaultFill} stroke={isAbs || isFullBody ? targetStroke : defaultStroke} strokeWidth={isAbs || isFullBody ? 1.5 : 1} />
      <rect x="62" y="66" width="11" height="9" rx="1.5" fill={isAbs || isFullBody ? targetFill : defaultFill} stroke={isAbs || isFullBody ? targetStroke : defaultStroke} strokeWidth={isAbs || isFullBody ? 1.5 : 1} />
      <rect x="47" y="77" width="11" height="9" rx="1.5" fill={isAbs || isFullBody ? targetFill : defaultFill} stroke={isAbs || isFullBody ? targetStroke : defaultStroke} strokeWidth={isAbs || isFullBody ? 1.5 : 1} />
      <rect x="62" y="77" width="11" height="9" rx="1.5" fill={isAbs || isFullBody ? targetFill : defaultFill} stroke={isAbs || isFullBody ? targetStroke : defaultStroke} strokeWidth={isAbs || isFullBody ? 1.5 : 1} />
      <rect x="48" y="88" width="10" height="9" rx="1.5" fill={isAbs || isFullBody ? targetFill : defaultFill} stroke={isAbs || isFullBody ? targetStroke : defaultStroke} strokeWidth={isAbs || isFullBody ? 1.5 : 1} />
      <rect x="62" y="88" width="10" height="9" rx="1.5" fill={isAbs || isFullBody ? targetFill : defaultFill} stroke={isAbs || isFullBody ? targetStroke : defaultStroke} strokeWidth={isAbs || isFullBody ? 1.5 : 1} />
      <path d="M39 68 L45 68 L46 98 L36 94 Z" fill={isAbs || isFullBody ? targetFill : defaultFill} stroke={isAbs || isFullBody ? targetStroke : defaultStroke} strokeWidth="1" />
      <path d="M81 68 L75 68 L74 98 L84 94 Z" fill={isAbs || isFullBody ? targetFill : defaultFill} stroke={isAbs || isFullBody ? targetStroke : defaultStroke} strokeWidth="1" />

      {/* Pelvis & Hips */}
      <path d="M36 98 L84 98 L76 116 L44 116 Z" fill={defaultFill} stroke={defaultStroke} strokeWidth="1" />

      {/* Quads, Hamstrings & Thighs */}
      <path d="M44 116 L35 162 L48 162 L57 116 Z" fill={isQuads || isHamstrings || isCardio || isFullBody ? targetFill : defaultFill} stroke={isQuads || isHamstrings || isCardio || isFullBody ? targetStroke : defaultStroke} strokeWidth="1.2" />
      <path d="M76 116 L85 162 L72 162 L63 116 Z" fill={isQuads || isHamstrings || isCardio || isFullBody ? targetFill : defaultFill} stroke={isQuads || isHamstrings || isCardio || isFullBody ? targetStroke : defaultStroke} strokeWidth="1.2" />

      {/* Calves & Lower Legs */}
      <path d="M36 164 L40 204 L48 204 L48 164 Z" fill={isCalves || isCardio || isFullBody ? targetFill : defaultFill} stroke={isCalves || isCardio || isFullBody ? targetStroke : defaultStroke} strokeWidth="1.2" />
      <path d="M84 164 L80 204 L72 204 L72 164 Z" fill={isCalves || isCardio || isFullBody ? targetFill : defaultFill} stroke={isCalves || isCardio || isFullBody ? targetStroke : defaultStroke} strokeWidth="1.2" />

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

  // 1. Glutes & Hip Complex (Glute Kickback, Hip Abduction/Adduction)
  if (n.includes('glute') || n.includes('kickback') || n.includes('hip abduction') || n.includes('abduction') || n.includes('adduction') || n.includes('hip thrust')) {
    return {
      region: 'glutes',
      regionName: 'Glutes & Hip Complex',
      primary: 'Glute Muscles (Maximus, Medius)',
      secondary: 'Hamstrings, Hip Abductors, Piriformis',
      movementType: 'Isolation & Hip Extension',
      tagline: 'Build stronger glutes and hips',
      coachingTip: 'Keep torso braced and hips squared. Drive foot back using glutes, pausing at peak contraction.',
    };
  }

  // 2. Ab Crunch & Core
  if (n.includes('crunch') || n.includes('ab machine')) {
    return {
      region: 'abs',
      regionName: 'Core & Abdominals',
      primary: 'Rectus Abdominis (Upper & Lower Abs)',
      secondary: 'Internal & External Obliques, Transverse Abdominis',
      movementType: 'Isolation • Torso Spinal Flexion',
      tagline: 'Build stronger core and abdominals',
      coachingTip: 'Anchor feet under pads. Inhale to brace, exhale as you contract your abs to curl your torso forward. Squeeze at full flexion.',
    };
  }

  // 3. Back Extension / Roman Chair
  if (n.includes('back extension') || n.includes('roman chair') || n.includes('hyperextension')) {
    return {
      region: 'back',
      regionName: 'Lower Back & Posterior Chain',
      primary: 'Erector Spinae (Lower Back), Gluteus Maximus',
      secondary: 'Hamstrings, Core Stabilizers',
      movementType: 'Compound • Hip & Spinal Extension',
      tagline: 'Reinforce lower back posture and spinal erectors',
      coachingTip: 'Hinge from hips keeping spine neutral. Extend until torso aligns with legs, squeeze glutes at the top.',
    };
  }

  // 4. Seated Leg Curl
  if (n.includes('leg curl')) {
    return {
      region: 'hamstrings',
      regionName: 'Posterior Thigh (Hamstrings)',
      primary: 'Hamstrings (Biceps Femoris, Semitendinosus)',
      secondary: 'Gastrocnemius (Calves), Gracilis',
      movementType: 'Isolation • Knee Flexion',
      tagline: 'Strengthen hamstrings and posterior knee stability',
      coachingTip: 'Keep thighs flat against pad. Flex knees to curl heels toward glutes without lifting hips off the seat.',
    };
  }

  // 5. Leg Extension
  if (n.includes('leg extension')) {
    return {
      region: 'quads',
      regionName: 'Quadriceps Isolation',
      primary: 'Rectus Femoris, Vastus Lateralis, Vastus Medialis',
      secondary: 'Patellar Tendon Stabilizers',
      movementType: 'Isolation • Knee Extension',
      tagline: 'Isolate and develop knee extension power',
      coachingTip: 'Align knee joint with machine pivot axis. Extend legs fully, hold 1 second at peak contraction, control descent.',
    };
  }

  // 6. Seated Calf Raise
  if (n.includes('calf') || n.includes('calves')) {
    return {
      region: 'calves',
      regionName: 'Lower Leg (Calves)',
      primary: 'Soleus, Gastrocnemius',
      secondary: 'Achilles Tendon, Tibialis Posterior',
      movementType: 'Isolation • Ankle Plantar Flexion',
      tagline: 'Isolate gastrocnemius and soleus lower leg power',
      coachingTip: 'Lower heels below platform for full stretch, drive through balls of feet and hold at peak contraction.',
    };
  }

  // 7. Leg Press / Hack Squat
  if (n.includes('leg press') || n.includes('hack squat') || n.includes('squat')) {
    return {
      region: 'quads',
      regionName: 'Lower Body (Quads & Glutes)',
      primary: 'Quadriceps Femoris, Gluteus Maximus',
      secondary: 'Hamstrings, Adductors, Calves',
      movementType: 'Compound • Lower Body Push',
      tagline: 'Build powerful quadriceps and lower body drive',
      coachingTip: 'Keep lower back firmly against pad. Lower sled until knees reach 90 degrees; do not lock knees at the peak.',
    };
  }

  // 8. Incline Bench Press / Flat Bench Press / Pec Deck / Chest
  if (n.includes('incline bench') || n.includes('incline')) {
    return {
      region: 'chest',
      regionName: 'Upper Pectorals (Clavicular Head)',
      primary: 'Pectoralis Major (Clavicular Head)',
      secondary: 'Anterior Deltoids, Triceps Brachii',
      movementType: 'Compound • Incline Push',
      tagline: 'Target upper chest shelf and pressing power',
      coachingTip: 'Retract scapulae and press upward at a 30–45 degree incline without flaring elbows excessively.',
    };
  }

  if (n.includes('pec deck') || n.includes('butterfly')) {
    return {
      region: 'chest',
      regionName: 'Pectoral Isolation (Flies)',
      primary: 'Pectoralis Major (Sternal & Costal Fibers)',
      secondary: 'Anterior Deltoids, Coracobrachialis',
      movementType: 'Isolation • Horizontal Adduction',
      tagline: 'Direct pectoral squeeze and chest isolation',
      coachingTip: 'Keep elbows slightly bent and shoulders pinned back. Squeeze chest together at center, feeling deep stretch on return.',
    };
  }

  if (n.includes('bench') || n.includes('chest')) {
    return {
      region: 'chest',
      regionName: 'Pectorals (Chest)',
      primary: 'Pectoralis Major (Sternal & Clavicular Heads)',
      secondary: 'Anterior Deltoids, Triceps Brachii',
      movementType: 'Compound • Horizontal Push',
      tagline: 'Develop maximum pectoral and pushing power',
      coachingTip: 'Retract shoulder blades, keep chest proud. Lower bar/handles with elbows at 45–60 degrees, press with control.',
    };
  }

  // 9. Cable Crossover Station
  if (n.includes('cable') || n.includes('crossover')) {
    return {
      region: 'chest',
      regionName: 'Chest Adduction & Arm Isolation',
      primary: 'Pectoralis Major, Anterior Deltoids',
      secondary: 'Biceps Brachii, Triceps, Serratus Anterior',
      movementType: 'Cable Isolation • Multi-Angle Fly',
      tagline: 'Constant muscular tension cable isolation and flies',
      coachingTip: 'Step forward for stability. Keep elbows slightly bent, sweep hands together across chest with continuous cable tension.',
    };
  }

  // 10. Shoulder Press Machine
  if (n.includes('shoulder') || n.includes('overhead')) {
    return {
      region: 'shoulders',
      regionName: 'Shoulders (Deltoids)',
      primary: 'Anterior Deltoid, Lateral Deltoid',
      secondary: 'Triceps Brachii, Upper Trapezius',
      movementType: 'Compound • Vertical Push',
      tagline: 'Sculpt strong shoulders and overhead stability',
      coachingTip: 'Keep core tight and rib cage down. Press directly overhead without arching your lower back excessively.',
    };
  }

  // 11. Assisted Pull-Up / Dip Machine
  if (n.includes('assisted pull-up') || n.includes('dip machine') || (n.includes('pull-up') && n.includes('dip'))) {
    return {
      region: 'back',
      regionName: 'Upper Body Pull & Push Complex',
      primary: 'Latissimus Dorsi, Pectoralis Major, Triceps',
      secondary: 'Biceps Brachii, Rhomboids, Rear Deltoids',
      movementType: 'Compound • Counterbalanced Vertical Pull/Push',
      tagline: 'Progressive counterbalanced upper body pulling & pressing',
      coachingTip: 'Select counterweight assist pad. Depress shoulder blades before pulling up; lower with control to full extension.',
    };
  }

  // 12. Lat Pulldown & Seated Row Machine
  if (n.includes('pulldown') || /\blat\b|\blats\b/.test(n)) {
    return {
      region: 'back',
      regionName: 'Upper & Mid Back (Lats)',
      primary: 'Latissimus Dorsi, Rhomboids, Trapezius',
      secondary: 'Biceps Brachii, Rear Deltoids, Forearms',
      movementType: 'Compound • Vertical Pull',
      tagline: 'Build a wider back and pulling strength',
      coachingTip: 'Drive elbows down and back toward your ribs. Lead with chest up, avoiding torso momentum.',
    };
  }

  if (n.includes('row') && !n.includes('rowing') && !n.includes('rope')) {
    return {
      region: 'back',
      regionName: 'Mid-Back & Rhomboids',
      primary: 'Rhomboids, Latissimus Dorsi, Middle Trapezius',
      secondary: 'Biceps Brachii, Rear Deltoids, Forearm Flexors',
      movementType: 'Compound • Horizontal Pull',
      tagline: 'Mid-back thickness, rhomboids, and rear delts',
      coachingTip: 'Pull handles directly to lower sternum. Squeeze shoulder blades together for 1 second at full contraction.',
    };
  }

  // 13. Olympic Power Rack & Smith Machine
  if (n.includes('power rack') || n.includes('smith')) {
    return {
      region: 'quads',
      regionName: 'Full Body Heavy Compound Loading',
      primary: 'Quadriceps, Glutes, Erector Spinae',
      secondary: 'Hamstrings, Calves, Trapezius, Core',
      movementType: 'Compound • Multi-Joint Free Weight',
      tagline: 'Foundational heavy compound lifting station',
      coachingTip: 'Set safety pins to proper depth. Maintain neutral spine and brace abdominal wall with valsalva maneuver.',
    };
  }

  // 14. Free Weights: Dumbbells, Barbell, Plates, EZ Curl
  if (n.includes('plate')) {
    return {
      region: 'full_body',
      regionName: 'Free Weight Resistance Loading',
      primary: 'Full Body Progressive Resistance',
      secondary: 'Grip Endurance, Kinetic Chain Loading',
      movementType: 'Progressive Overload Calibrated Resistance',
      tagline: 'Calibrated bumper plates for Olympic and power lifts',
      coachingTip: 'Always secure collars on barbell sleeves before executing heavy compound sets.',
    };
  }

  if (n.includes('dumbbell') || n.includes('barbell') || n.includes('ez curl') || (n.includes('curl') && !n.includes('leg'))) {
    return {
      region: 'arms',
      regionName: 'Biceps, Triceps & Forearms',
      primary: 'Biceps Brachii (Long & Short Heads), Triceps',
      secondary: 'Brachialis, Brachioradialis, Forearm Grip',
      movementType: 'Free Weight / Isolation • Elbow Flexion & Extension',
      tagline: 'Isolate arm flexors, triceps, and grip endurance',
      coachingTip: 'Keep elbows tucked at your sides. Control the eccentric lowering phase to maximize muscle fiber recruitment.',
    };
  }

  // 15. Kettlebells
  if (n.includes('kettlebell')) {
    return {
      region: 'full_body',
      regionName: 'Posterior Chain & Explosive Hinge',
      primary: 'Glutes, Hamstrings, Erector Spinae',
      secondary: 'Core Stabilizers, Shoulders, Grip Endurance',
      movementType: 'Functional Ballistic • Hip Hinge',
      tagline: 'Build functional explosive power and posterior chain',
      coachingTip: 'Snap hips forward forcefully on swings; power comes from the glutes, not lifting with arms.',
    };
  }

  // 16. Cardio Equipment (Treadmill, Bike, Rower, Climber, Ski Erg, Elliptical)
  if (c === 'cardio' || n.includes('treadmill') || n.includes('bike') || n.includes('climber') || n.includes('elliptical') || n.includes('rowing') || n.includes('ski erg')) {
    return {
      region: 'cardio',
      regionName: 'Cardiovascular & Aerobic Engine',
      primary: 'Cardiovascular Endurance, Heart & Lungs',
      secondary: 'Quadriceps, Calves, Glutes, Hamstrings',
      movementType: 'Metabolic Conditioning & Caloric Burn',
      tagline: 'Cardiovascular endurance and high-intensity stamina',
      coachingTip: 'Maintain upright posture with relaxed shoulders. Regulate breathing rhythm and maintain cadence within target heart rate zone.',
    };
  }

  // 17. Functional Accessories: Battle Ropes, Plyo Box, TRX, Medicine Ball
  if (n.includes('battle rope') || n.includes('plyo') || n.includes('trx') || n.includes('medicine ball') || n.includes('pull-up')) {
    return {
      region: 'core',
      regionName: 'Functional Agility & Explosive Power',
      primary: 'Core Stabilizers, Full Body Kinematics',
      secondary: 'Deltoids, Forearms, Glutes, Calves',
      movementType: 'Dynamic Plyometric & Rotational Power',
      tagline: 'Build explosive power, agility, and rotational core',
      coachingTip: 'Brace core dynamically and land softly on plyometrics with knees tracking toes.',
    };
  }

  // 18. Recovery & Yoga (Mats, Foam Roller, Massage Gun, Resistance Bands)
  if (c === 'recovery' || c === 'accessories' || n.includes('mat') || n.includes('massage') || n.includes('roller') || n.includes('band') || n.includes('stretch')) {
    return {
      region: 'recovery',
      regionName: 'Mobility & Myofascial Recovery',
      primary: 'Fascial Release, Joint Mobility & Flexibility',
      secondary: 'Parasympathetic Nervous System Decompression',
      movementType: 'Active Recovery & Postural Reset',
      tagline: 'Enhance mobility, flexibility, and physical recovery',
      coachingTip: 'Breathe deeply and hold stretches for 20–30 seconds. On foam roller, pause on tender trigger points until tension dissipates.',
    };
  }

  // 19. Audio Visual & Facility Hardware
  if (c === 'audio_visual' || n.includes('tv') || n.includes('sound') || n.includes('audio')) {
    return {
      region: 'facility',
      regionName: 'Gym Floor Audio-Visual System',
      primary: 'Member Entertainment & Workout Atmosphere',
      secondary: 'Class Music Pacing, Telemetry Display',
      movementType: 'Commercial Facility Hardware Feed',
      tagline: 'Commercial high-definition gym audio & visual system',
      coachingTip: 'Commercial display and acoustic system supporting high-energy gym floor motivation.',
    };
  }

  // Default fallback
  return {
    region: 'core',
    regionName: 'General Gym Conditioning',
    primary: 'Target Musculoskeletal Groups',
    secondary: 'Stabilizing Core Muscles',
    movementType: 'Strength & Conditioning',
    tagline: 'Build functional strength and conditioning',
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

  // Pagination State (10 items per page)
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewModalSlide, setViewModalSlide] = useState(0);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [deleteConfirmAsset, setDeleteConfirmAsset] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const addFileInputRef = useRef(null);
  const editFileInputRef = useRef(null);

  // Prevent page scroll when any modal is open
  useEffect(() => {
    const isAnyModalOpen = isAddOpen || isEditOpen || isViewOpen || isScheduleOpen || Boolean(deleteConfirmAsset);
    if (isAnyModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isAddOpen, isEditOpen, isViewOpen, isScheduleOpen, deleteConfirmAsset]);

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
    image: null,
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
    image: null,
    image_url: null,
    remove_image: false,
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
    setViewModalSlide(0);
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
      if (addFileInputRef.current) addFileInputRef.current.value = '';
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
      if (editFileInputRef.current) editFileInputRef.current.value = '';
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
                        <EquipmentIllustration name={item.name} category={item.category} imageUrl={item.image_url} />
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
                          ? formatIsoDate(item.last_inspected_at, 'Recently Verified')
                          : (item.next_maintenance_due ? `Due: ${formatIsoDate(item.next_maintenance_due)}` : 'Scheduled')}
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
                                image: null,
                                image_url: item.image_url || null,
                                remove_image: false,
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

      {/* Modal 1: Add New Equipment Asset (Strictly Non-Scrollable & 2-Column Responsive) */}
      {isAddOpen && (
        <div className="modal-backdrop equip-modal-backdrop-noscroll" onClick={() => !isSubmitting && setIsAddOpen(false)}>
          <div className="modal-card equip-add-modal" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="equip-modal-compact-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="equip-modal-icon-badge">
                  <Icons.Plus size={18} color="#ff7a00" />
                </div>
                <div>
                  <h3 className="equip-modal-heading">Add New Equipment</h3>
                  <span className="equip-modal-subheading">Register gym machine or equipment asset</span>
                </div>
              </div>
              <button
                type="button"
                className="equip-modal-close-btn"
                onClick={() => setIsAddOpen(false)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} style={{ marginTop: 12 }}>
              <div className="equip-add-form-grid">
                {/* Left Column: Asset Identity & Image */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="equip-form-label">Equipment Name <span style={{ color: '#ea580c' }}>*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Commercial Treadmill Pro 5000"
                      value={addForm.name}
                      onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                      className="form-control equip-compact-input"
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="equip-form-label">Category <span style={{ color: '#ea580c' }}>*</span></label>
                      <select
                        value={addForm.category}
                        onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}
                        className="form-control equip-compact-input"
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
                      <label className="equip-form-label">Initial Status</label>
                      <select
                        value={addForm.status}
                        onChange={(e) => setAddForm({ ...addForm, status: e.target.value })}
                        className="form-control equip-compact-input"
                      >
                        <option value="operational">Active / Operational</option>
                        <option value="needs_maintenance">Needs Maintenance</option>
                        <option value="under_repair">Under Repair</option>
                      </select>
                    </div>
                  </div>

                  {/* Photo Upload Area */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                      <label className="equip-form-label" style={{ margin: 0 }}>
                        Equipment Photo <span style={{ fontWeight: 400, color: '#94a3b8' }}>(Optional)</span>
                      </label>
                      {addForm.image && (
                        <button
                          type="button"
                          onClick={() => {
                            setAddForm((prev) => ({ ...prev, image: null }));
                            if (addFileInputRef.current) addFileInputRef.current.value = '';
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                            padding: 0,
                          }}
                        >
                          ✕ Remove
                        </button>
                      )}
                    </div>

                    {addForm.image ? (
                      <div className="equip-photo-preview-box">
                        <img
                          src={addForm.image}
                          alt="Equipment preview"
                          style={{
                            width: 36,
                            height: 36,
                            objectFit: 'cover',
                            borderRadius: 6,
                            border: '1px solid #fdba74',
                          }}
                        />
                        <div style={{ flex: 1, minWidth: 0, fontSize: 11 }}>
                          <div style={{ fontWeight: 700, color: '#ea580c' }}>Custom photo attached</div>
                          <div style={{ fontSize: 10, color: '#94a3b8' }}>Saved with this asset record</div>
                        </div>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: 11, padding: '2px 8px', height: 26 }}
                          onClick={() => addFileInputRef.current?.click()}
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => addFileInputRef.current?.click()}
                        className="equip-photo-upload-placeholder"
                      >
                        <div className="equip-camera-icon-wrap">
                          <Icons.Camera size={14} color="#ea580c" />
                        </div>
                        <div style={{ textAlign: 'left', minWidth: 0 }}>
                          <div style={{ fontSize: 11.5, fontWeight: 700 }} className="equip-photo-title">
                            Upload equipment photo <span style={{ fontWeight: 400, color: '#94a3b8' }}>(Optional)</span>
                          </div>
                          <div style={{ fontSize: 10, color: '#94a3b8' }}>PNG, JPG or WEBP up to 5MB</div>
                        </div>
                      </div>
                    )}

                    <input
                      ref={addFileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 5 * 1024 * 1024) {
                          setNotification({ type: 'warning', message: 'Photo must be under 5MB.' });
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = () => {
                          setAddForm((prev) => ({ ...prev, image: reader.result }));
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </div>
                </div>

                {/* Right Column: Specs, Location, Valuation, Maintenance */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="equip-form-label">Brand / Manufacturer</label>
                      <input
                        type="text"
                        placeholder="e.g. Life Fitness, Eleiko"
                        value={addForm.brand}
                        onChange={(e) => setAddForm({ ...addForm, brand: e.target.value })}
                        className="form-control equip-compact-input"
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="equip-form-label">Model / Serial No.</label>
                      <input
                        type="text"
                        placeholder="e.g. T5-GO-0105"
                        value={addForm.model_number}
                        onChange={(e) => setAddForm({ ...addForm, model_number: e.target.value })}
                        className="form-control equip-compact-input"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="equip-form-label">Gym Floor Location</label>
                      <input
                        type="text"
                        placeholder="e.g. Main Cardio Zone"
                        value={addForm.location_area}
                        onChange={(e) => setAddForm({ ...addForm, location_area: e.target.value })}
                        className="form-control equip-compact-input"
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="equip-form-label">Purchase Cost (ETB)</label>
                      <input
                        type="number"
                        placeholder="e.g. 185000"
                        value={addForm.purchase_cost}
                        onChange={(e) => setAddForm({ ...addForm, purchase_cost: e.target.value })}
                        className="form-control equip-compact-input"
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="equip-form-label">Next Maintenance Due Date</label>
                    <input
                      type="date"
                      value={addForm.next_maintenance_due}
                      onChange={(e) => setAddForm({ ...addForm, next_maintenance_due: e.target.value })}
                      className="form-control equip-compact-input"
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="equip-form-label">Maintenance / Setup Notes</label>
                    <input
                      type="text"
                      placeholder="e.g. Initial inspection passed. Tension calibrated."
                      value={addForm.maintenance_notes}
                      onChange={(e) => setAddForm({ ...addForm, maintenance_notes: e.target.value })}
                      className="form-control equip-compact-input"
                    />
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="equip-modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsAddOpen(false)}
                  disabled={isSubmitting}
                  style={{ minWidth: 90, height: 34, fontSize: 12.5 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={isSubmitting}
                  style={{ minWidth: 160, height: 34, fontSize: 12.5 }}
                >
                  {isSubmitting ? 'Registering...' : 'Save & Register Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Edit & Inspect Asset */}
      {isEditOpen && selectedAsset && (
        <div className="modal-backdrop equip-modal-backdrop-noscroll" onClick={() => !isSubmitting && setIsEditOpen(false)}>
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

                {/* Optional Photo Edit/Upload */}
                <div className="form-group" style={{ margin: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, margin: 0 }}>Equipment Photo (Optional)</label>
                    {(editForm.image || editForm.image_url) && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditForm((prev) => ({ ...prev, image: null, image_url: null, remove_image: true }));
                          if (editFileInputRef.current) editFileInputRef.current.value = '';
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        ✕ Remove Photo
                      </button>
                    )}
                  </div>

                  {(editForm.image || editForm.image_url) ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '8px 12px',
                      border: '1px solid #fed7aa',
                      borderRadius: 8,
                      background: '#fff7ed',
                    }}>
                      <img
                        src={editForm.image || editForm.image_url}
                        alt="Preview"
                        style={{
                          width: 48,
                          height: 48,
                          objectFit: 'cover',
                          borderRadius: 6,
                          border: '1px solid #fdba74',
                        }}
                      />
                      <div style={{ flex: 1, fontSize: 12 }}>
                        <div style={{ fontWeight: 700, color: '#9a3412' }}>{editForm.image ? 'New photo attached' : 'Current photo'}</div>
                        <div style={{ fontSize: 11, color: '#c2410c' }}>Will be displayed for this equipment</div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: 11, padding: '4px 10px', height: 28 }}
                        onClick={() => editFileInputRef.current?.click()}
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => editFileInputRef.current?.click()}
                      style={{
                        border: '1.5px dashed #cbd5e1',
                        borderRadius: 8,
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 10,
                        cursor: 'pointer',
                        background: '#f8fafc',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#ff7a00'; e.currentTarget.style.background = '#fff7ed'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = '#f8fafc'; }}
                    >
                      <div style={{ width: 28, height: 28, borderRadius: 6, background: '#ffedd5', color: '#ff7a00', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icons.Camera size={15} color="#ea580c" />
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>
                          Upload / replace photo <span style={{ fontWeight: 400, color: '#94a3b8' }}>(Optional)</span>
                        </div>
                        <div style={{ fontSize: 10.5, color: '#94a3b8' }}>PNG, JPG or WEBP up to 5MB</div>
                      </div>
                    </div>
                  )}

                  <input
                    ref={editFileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 5 * 1024 * 1024) {
                        setNotification({ type: 'warning', message: 'Photo must be under 5MB.' });
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = () => {
                        setEditForm((prev) => ({ ...prev, image: reader.result, remove_image: false }));
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
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

      {/* Modal 3: View Equipment Details - Glute Kickback Inspired Precision Template */}
      {isViewOpen && selectedAsset && (() => {
        const visual = getEquipmentVisual(selectedAsset.name, selectedAsset.category, false);
        const muscleData = getEquipmentMuscleData(selectedAsset.name, selectedAsset.category);
        const customImage = selectedAsset.image_url;
        const slides = customImage
          ? [customImage]
          : (visual && visual.slides && visual.slides.length > 0
              ? visual.slides
              : (visual ? [visual.hero, visual.thumb].filter(Boolean) : []));
        const activeImg = customImage || (slides.length > 0 ? (slides[viewModalSlide] || slides[0]) : null);
        const isContain = visual?.contain || (activeImg && (activeImg.endsWith('.png') || activeImg.startsWith('/storage/')));

        const conditionLabel = formatConditionName(
          selectedAsset.condition || (selectedAsset.status === 'out_of_service' ? 'poor' : selectedAsset.status === 'needs_maintenance' ? 'fair' : 'good')
        );
        const statusLabel = formatStatusName(selectedAsset.status);

        return (
          <div className="modal-backdrop equip-modal-backdrop-noscroll" onClick={() => setIsViewOpen(false)}>
            <div className="modal-card equip-template-modal" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="equip-template-header">
                <div className="equip-template-title-wrap">
                  <div className="equip-template-icon-box">
                    <Icons.Dumbbell size={24} color="#ff7a00" />
                  </div>
                  <div>
                    <h2 className="equip-template-title">Equipment Details</h2>
                    <p className="equip-template-subtitle">View and manage equipment information</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="equip-template-close-btn"
                  onClick={() => setIsViewOpen(false)}
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>

              {/* 2-Column Main Template Grid */}
              <div className="equip-template-grid">
                {/* Left Column: Image Showcase & Muscles Worked Card */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Equipment Image Showcase Box */}
                  <div className="equip-template-showcase">
                    {/* Badge top-left */}
                    <div className="equip-template-showcase-badge">
                      <span style={{ fontSize: 13 }}>⭐</span>
                      <span>{customImage ? 'Facility Asset' : (visual?.badge || 'Standard Unit')}</span>
                    </div>

                    {/* Image Area */}
                    <div className="equip-template-img-holder">
                      {activeImg ? (
                        <img
                          src={activeImg}
                          alt={selectedAsset.name}
                          className={`equip-template-main-img ${isContain ? 'contain-mode' : ''}`}
                        />
                      ) : (
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: '100%',
                          minHeight: 200,
                          background: '#f8fafc',
                          color: '#94a3b8',
                          gap: 8,
                          padding: 20,
                          textAlign: 'center',
                        }}>
                          <Icons.Dumbbell size={38} color="#cbd5e1" />
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>No Photo Provided</span>
                          <span style={{ fontSize: 11, color: '#94a3b8' }}>Optional photo was not attached</span>
                        </div>
                      )}
                    </div>

                    {/* Carousel Dots bottom-left (only shown if multiple slides) */}
                    {slides.length > 1 && (
                      <div className="equip-template-carousel-dots">
                        {slides.slice(0, 3).map((_, idx) => (
                          <span
                            key={idx}
                            className={`equip-template-dot ${viewModalSlide === idx ? 'active' : ''}`}
                            onClick={() => setViewModalSlide(idx)}
                            title={`Angle / Diagram ${idx + 1}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Muscles Worked Card */}
                  <div className="equip-template-muscles-card">
                    <div className="equip-template-muscles-header">
                      <span className="equip-template-muscles-icon">🏋️</span>
                      <span>Muscles Worked</span>
                    </div>

                    <div className="equip-template-muscles-body">
                      <div className="equip-template-figure-wrap">
                        <MuscleAnatomyFigure region={muscleData.region} />
                      </div>

                      <div className="equip-template-muscles-info">
                        <div>
                          <div className="equip-template-info-label">
                            <span style={{ color: '#ff7a00', marginRight: 5 }}>🎯</span>
                            <span>Primary Focus:</span>
                          </div>
                          <div className="equip-template-pill-primary">
                            <span>🔥</span>
                            <span>{muscleData.primary}</span>
                          </div>
                        </div>

                        <div>
                          <div className="equip-template-info-label">
                            <span style={{ color: '#ff7a00', marginRight: 5 }}>🔗</span>
                            <span>Secondary Synergists:</span>
                          </div>
                          <div className="equip-template-pill-secondary">
                            {muscleData.secondary}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Title, Badges, Hardware Specs, Operational Banner & Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 14 }}>
                  <div>
                    {/* Machine Title & Category Pill */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                      <div>
                        <h3 className="equip-template-machine-title">
                          {selectedAsset.name}
                        </h3>
                        <p className="equip-template-machine-tagline">
                          {muscleData.tagline || 'Build functional strength and conditioning'}
                        </p>
                      </div>

                      <div className="equip-template-category-pill">
                        <span>{getCategoryIcon(selectedAsset.category)}</span>
                        <span>{formatCategoryName(selectedAsset.category)}</span>
                      </div>
                    </div>

                    {/* Condition & Status Badges */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
                      <div className={`equip-template-status-pill ${conditionLabel === 'Poor' ? 'danger' : conditionLabel === 'Fair' ? 'warning' : ''}`}>
                        <span className="equip-template-status-dot">●</span>
                        <span>{conditionLabel}</span>
                      </div>
                      <div className={`equip-template-status-pill ${statusLabel === 'Out of Service' ? 'danger' : statusLabel === 'Maintenance' ? 'warning' : ''}`}>
                        <span className="equip-template-status-dot">●</span>
                        <span>{statusLabel}</span>
                      </div>
                    </div>

                    {/* Hardware Specs List */}
                    <div className="equip-template-specs-list">
                      <div className="equip-template-spec-row">
                        <div className="equip-template-spec-left">
                          <span className="equip-template-spec-icon">🏷️</span>
                          <span>Brand / Manufacturer:</span>
                        </div>
                        <strong className="equip-template-spec-val-white">
                          {selectedAsset.brand || 'Inspire Fitness'}
                        </strong>
                      </div>

                      <div className="equip-template-spec-row">
                        <div className="equip-template-spec-left">
                          <span className="equip-template-spec-icon">⚙️</span>
                          <span>Model / Serial Number:</span>
                        </div>
                        <strong className="equip-template-spec-val-mono">
                          {selectedAsset.model_number || selectedAsset.equipment_code}
                        </strong>
                      </div>

                      <div className="equip-template-spec-row">
                        <div className="equip-template-spec-left">
                          <span className="equip-template-spec-icon">🔄</span>
                          <span>Movement Mechanics:</span>
                        </div>
                        <strong className="equip-template-spec-val-orange">
                          {muscleData.movementType}
                        </strong>
                      </div>

                      <div className="equip-template-spec-row">
                        <div className="equip-template-spec-left">
                          <span className="equip-template-spec-icon">📍</span>
                          <span>Gym Floor Location:</span>
                        </div>
                        <strong className="equip-template-spec-val-location">
                          <span style={{ color: '#ff7a00', marginRight: 4 }}>📍</span>
                          {selectedAsset.location_area || 'Glute & Hip Bay'}
                        </strong>
                      </div>

                      <div className="equip-template-spec-row">
                        <div className="equip-template-spec-left">
                          <span className="equip-template-spec-icon">🛒</span>
                          <span>Purchase Valuation:</span>
                        </div>
                        <strong className="equip-template-spec-val-price">
                          {selectedAsset.purchase_cost ? `${Number(selectedAsset.purchase_cost).toLocaleString()} ETB` : '115,000 ETB'}
                        </strong>
                      </div>

                      <div className="equip-template-spec-row">
                        <div className="equip-template-spec-left">
                          <span className="equip-template-spec-icon">📅</span>
                          <span>Last Inspection Date:</span>
                        </div>
                        <strong className="equip-template-spec-val-white">
                          {formatIsoDate(selectedAsset.last_inspected_at, 'Oct 18, 2026')}
                        </strong>
                      </div>

                      <div className="equip-template-spec-row">
                        <div className="equip-template-spec-left">
                          <span className="equip-template-spec-icon">🔁</span>
                          <span>Next Maintenance Due:</span>
                        </div>
                        <strong className="equip-template-spec-val-orange">
                          {formatIsoDate(selectedAsset.next_maintenance_due, 'May 25, 2026')}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Operational Status Box & Action Buttons */}
                  <div>
                    {selectedAsset.status === 'out_of_service' || selectedAsset.status === 'needs_maintenance' ? (
                      <div className="equip-template-alert-box">
                        <div className="equip-template-alert-circle">⚠️</div>
                        <div style={{ flex: 1 }}>
                          <strong style={{ color: '#f59e0b', fontSize: 13 }}>Maintenance Inspection Required</strong>
                          <div className="equip-template-alert-notes">
                            {selectedAsset.maintenance_notes || 'Scheduled for technical inspection and servicing.'}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="equip-template-certified-box">
                        <div className="equip-template-check-circle">✓</div>
                        <span className="equip-template-certified-text">
                          Machine is fully certified and operational with zero pending defect reports.
                        </span>
                      </div>
                    )}

                    <div className="equip-template-actions-row">
                      {canManage && (
                        <button
                          type="button"
                          className="btn-equip-template-edit"
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
                              image: null,
                              image_url: selectedAsset.image_url || null,
                              remove_image: false,
                            });
                            setIsEditOpen(true);
                          }}
                        >
                          <Icons.Edit size={16} />
                          <span>Edit Asset Details</span>
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn-equip-template-close"
                        onClick={() => setIsViewOpen(false)}
                      >
                        <span style={{ fontSize: 14 }}>✕</span>
                        <span>Close</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal 4: Schedule Maintenance */}
      {isScheduleOpen && (
        <div className="modal-backdrop equip-modal-backdrop-noscroll" onClick={() => !isSubmitting && setIsScheduleOpen(false)}>
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
        <div className="modal-backdrop equip-modal-backdrop-noscroll" onClick={() => !isDeleting && setDeleteConfirmAsset(null)}>
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
