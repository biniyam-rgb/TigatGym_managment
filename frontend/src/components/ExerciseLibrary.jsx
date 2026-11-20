import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/useAuth';
import apiClient from '../services/api';
import './TrainerDashboard.css';

const Icons = {
  Search: ({ size = 15 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Plus: ({ size = 15 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Dumbbell: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6.5 6.5 11 11" />
      <path d="m21 21-1-1a2 2 0 0 0-2.83 0l-1.41 1.41a2 2 0 0 1-2.83 0l-1.41-1.41a2 2 0 0 0-2.83 0L7 22.5" />
      <path d="m3 3 1 1a2 2 0 0 0 2.83 0l1.41-1.41a2 2 0 0 1 2.83 0l1.41 1.41a2 2 0 0 0 2.83 0L17 1.5" />
    </svg>
  ),
  X: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  ArrowRight: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  Activity: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  Award: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="7" />
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    </svg>
  ),
  Check: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  AlertTriangle: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  Settings: ({ size = 13, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
};

function ExerciseLibrarySkeleton() {
  return (
    <div className="clean-reception-dashboard" style={{ opacity: 0.95 }}>
      {/* Top Header Action Row Skeleton */}
      <section className="clean-dash-header-row" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="trainer-skeleton-pulse" style={{ width: 220, height: 26, borderRadius: 6 }} />
          <div className="trainer-skeleton-pulse" style={{ width: 340, height: 14, borderRadius: 4 }} />
        </div>
        <div className="clean-dash-actions" style={{ gap: 10 }}>
          <div className="trainer-skeleton-pulse" style={{ width: 130, height: 36, borderRadius: 8 }} />
          <div className="trainer-skeleton-pulse" style={{ width: 140, height: 36, borderRadius: 8 }} />
        </div>
      </section>

      {/* 4 KPI Cards Skeleton */}
      <section className="clean-kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: 16 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="clean-kpi-card" style={{ gap: 10 }}>
            <div className="clean-kpi-top">
              <div className="trainer-skeleton-pulse" style={{ width: '55%', height: 14, borderRadius: 4 }} />
              <div className="trainer-skeleton-pulse" style={{ width: 32, height: 32, borderRadius: 8 }} />
            </div>
            <div className="trainer-skeleton-pulse" style={{ width: '40%', height: 28, borderRadius: 6, margin: '4px 0' }} />
            <div className="trainer-skeleton-pulse" style={{ width: '65%', height: 12, borderRadius: 4 }} />
          </div>
        ))}
      </section>

      {/* Toolbar Skeleton */}
      <div className="coach-tab-panel" style={{ padding: '16px 20px', marginBottom: 18 }}>
        <div className="trainer-skeleton-pulse" style={{ width: '100%', height: 38, borderRadius: 8, marginBottom: 12 }} />
        <div style={{ display: 'flex', gap: 10 }}>
          <div className="trainer-skeleton-pulse" style={{ width: 140, height: 32, borderRadius: 6 }} />
          <div className="trainer-skeleton-pulse" style={{ width: 140, height: 32, borderRadius: 6 }} />
        </div>
      </div>

      {/* Cards Grid Skeleton */}
      <div className="exercises-grid">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="exercise-card" style={{ minHeight: 180, gap: 12 }}>
            <div className="exercise-top">
              <div className="trainer-skeleton-pulse" style={{ width: 60, height: 18, borderRadius: 6 }} />
              <div className="trainer-skeleton-pulse" style={{ width: 75, height: 18, borderRadius: 6 }} />
            </div>
            <div className="trainer-skeleton-pulse" style={{ width: '70%', height: 20, borderRadius: 6 }} />
            <div className="trainer-skeleton-pulse" style={{ width: '50%', height: 14, borderRadius: 4 }} />
            <div className="trainer-skeleton-pulse" style={{ width: '90%', height: 36, borderRadius: 6 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

const MUSCLE_GROUPS = [
  'All',
  'Chest',
  'Back',
  'Legs',
  'Shoulders',
  'Arms',
  'Core',
  'Cardio',
  'Full Body',
];

const CATEGORIES = [
  'All Categories',
  'Barbell',
  'Dumbbell',
  'Machine',
  'Bodyweight',
  'Cable',
  'Kettlebell',
  'Cardio',
];

const EQUIPMENT_CATEGORY_LABELS = {
  free_weights: 'Free Weights & Dumbbells',
  strength: 'Strength & Resistance Machines',
  cardio: 'Cardio Equipment',
  accessories: 'Functional & Accessories',
  recovery: 'Recovery & Mobility',
  machines: 'Selectorized Machines',
  audio_visual: 'Audio / Visual Equipment',
  other: 'General Facility Equipment',
};

export default function ExerciseLibrary({ onNavigate }) {
  const { hasRole } = useAuth();
  const canManage = hasRole('trainer') || hasRole('owner') || hasRole('admin');

  const [exercises, setExercises] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Filters
  const [muscleFilter, setMuscleFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [equipmentFilter, setEquipmentFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('table');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Gym Equipment Inventory (loaded live from Admin Equipment Management)
  const [equipmentList, setEquipmentList] = useState([]);
  const [isLoadingEquipment, setIsLoadingEquipment] = useState(false);
  const [isCustomEquipment, setIsCustomEquipment] = useState(false);
  const [customEquipmentName, setCustomEquipmentName] = useState('');

  useEffect(() => {
    const handleOutsideClick = () => setShowExportMenu(false);
    if (showExportMenu) {
      window.addEventListener('click', handleOutsideClick);
    }
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [showExportMenu]);

  // Load gym assets registered by Admin in Equipment Management
  const loadEquipment = useCallback(async () => {
    setIsLoadingEquipment(true);
    try {
      const res = await apiClient.getEquipment();
      const items = res?.data || res || [];
      if (Array.isArray(items)) {
        setEquipmentList(items);
      }
    } catch (err) {
      console.error('Failed to load gym equipment inventory:', err);
    } finally {
      setIsLoadingEquipment(false);
    }
  }, []);

  useEffect(() => {
    loadEquipment();
  }, [loadEquipment]);

  // Group equipment by category for organized optgroups
  const groupedEquipment = useMemo(() => {
    const groups = {};
    equipmentList.forEach((eq) => {
      const cat = eq.category || 'other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(eq);
    });
    return groups;
  }, [equipmentList]);

  // Add Exercise Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [exerciseForm, setExerciseForm] = useState({
    name: '',
    category: 'Barbell',
    muscle_group: 'Chest',
    equipment_needed: 'Bodyweight / No Equipment',
    difficulty: 'intermediate',
    instructions: '',
  });

  const openAddMovementModal = () => {
    setIsAddModalOpen(true);
    setIsCustomEquipment(false);
    setCustomEquipmentName('');
    setExerciseForm((prev) => ({
      ...prev,
      equipment_needed: prev.equipment_needed || (equipmentList[0]?.name ? equipmentList[0].name : 'Bodyweight / No Equipment'),
    }));
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadExercises = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.getExercises({
        muscle_group: muscleFilter,
        category: categoryFilter && categoryFilter !== 'All Categories' ? categoryFilter : '',
        search,
      });
      setExercises(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load exercises.');
    } finally {
      setIsLoading(false);
    }
  }, [muscleFilter, categoryFilter, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadExercises();
    }, 150);
    return () => clearTimeout(timer);
  }, [loadExercises]);

  const handleExportData = async (format = 'excel') => {
    setIsExporting(true);
    setShowExportMenu(false);
    try {
      const dateStamp = new Date().toISOString().slice(0, 10);
      const rows = filteredExercises.map((ex) => ({
        'Exercise Name': ex.name || '',
        'Target Muscle': ex.muscle_group || '',
        'Category': ex.category || '',
        'Difficulty': ex.difficulty || '',
        'Equipment Needed': ex.equipment_needed || '',
        'Instructions': ex.instructions || '',
      }));

      if (format === 'excel') {
        const XLSX = await import('xlsx');
        const worksheet = XLSX.utils.json_to_sheet(rows);
        worksheet['!cols'] = [
          { wch: 25 }, // Exercise Name
          { wch: 18 }, // Target Muscle
          { wch: 18 }, // Category
          { wch: 15 }, // Difficulty
          { wch: 25 }, // Equipment Needed
          { wch: 45 }, // Instructions
        ];
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Exercise Library');
        XLSX.writeFile(workbook, `exercise_library_${dateStamp}.xlsx`);
        showToast(`Successfully exported ${filteredExercises.length} movements to Microsoft Excel (.xlsx)!`);
      } else {
        const headers = ['Exercise Name', 'Target Muscle', 'Category', 'Difficulty', 'Equipment Needed', 'Instructions'];
        const csvContent = [
          headers.join(','),
          ...rows.map((r) =>
            headers
              .map((h) => {
                const val = (r[h] ?? '').toString().replace(/"/g, '""');
                return `"${val}"`;
              })
              .join(',')
          ),
        ].join('\r\n');

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `exercise_library_${dateStamp}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast(`Successfully exported ${filteredExercises.length} movements to CSV!`);
      }
    } catch (err) {
      console.error('Export failed:', err);
      showToast('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCreateExercise = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    try {
      await apiClient.createExercise(exerciseForm);
      showToast(`Movement "${exerciseForm.name}" added to Exercise Library.`);
      setIsAddModalOpen(false);
      setIsCustomEquipment(false);
      setCustomEquipmentName('');
      setExerciseForm({
        name: '',
        category: 'Barbell',
        muscle_group: 'Chest',
        equipment_needed: equipmentList[0]?.name || 'Bodyweight / No Equipment',
        difficulty: 'intermediate',
        instructions: '',
      });
      loadExercises();
    } catch (err) {
      setFormError(err.message || 'Failed to add exercise.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered view by difficulty and equipment in memory if selected
  const filteredExercises = useMemo(() => {
    return exercises.filter((ex) => {
      if (difficultyFilter && ex.difficulty !== difficultyFilter) return false;
      if (equipmentFilter) {
        const needed = (ex.equipment_needed || '').toLowerCase();
        const target = equipmentFilter.toLowerCase();
        if (!needed.includes(target)) return false;
      }
      return true;
    });
  }, [exercises, difficultyFilter, equipmentFilter]);

  const muscleGroupsCount = useMemo(() => {
    return new Set(exercises.map((e) => e.muscle_group).filter(Boolean)).size || 6;
  }, [exercises]);

  const equipmentTypesCount = useMemo(() => {
    return new Set(exercises.map((e) => e.category).filter(Boolean)).size || 5;
  }, [exercises]);

  if (isLoading && exercises.length === 0) {
    return <ExerciseLibrarySkeleton />;
  }

  return (
    <div className="clean-reception-dashboard" style={{ animation: 'trainerHubFadeIn 0.2s ease-out' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 99999,
            background: '#10b981',
            color: '#ffffff',
            padding: '10px 18px',
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 13,
            boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Icons.Check size={15} color="#10b981" />
            {toastMessage}
          </span>
        </div>
      )}

      {/* Top Header Action Row */}
      <section className="clean-dash-header-row" style={{ marginBottom: 16 }}>
        <div>
          <h1 className="clean-dash-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icons.Dumbbell size={24} color="#ff7a00" />
            <span>Exercise Library</span>
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--gym-text-muted, #64748b)' }}>
            Comprehensive movement directory and technique catalog for workout programming
          </p>
        </div>
        <div className="clean-dash-actions">
          {canManage && (
            <button
              type="button"
              className="btn-clean-add-member"
              onClick={openAddMovementModal}
            >
              <Icons.Plus size={15} />
              <span>+ Add Movement</span>
            </button>
          )}
        </div>
      </section>

      {/* 4 Clean KPI Metric Cards */}
      <section className="clean-kpi-grid" style={{ marginBottom: 18 }}>
        {/* Card 1: Total Movements */}
        <div className="clean-kpi-card">
          <div className="clean-kpi-top">
            <span className="kpi-label">Total Movements</span>
            <div className="clean-kpi-icon" title="Total Movements" style={{ color: '#ff7a00', background: 'rgba(255, 122, 0, 0.1)' }}>
              <Icons.Dumbbell size={16} />
            </div>
          </div>
          <div className="kpi-value">{exercises.length}</div>
          <span className="kpi-trend trend-positive">{filteredExercises.length} in current view</span>
        </div>

        {/* Card 2: Target Muscle Groups */}
        <div className="clean-kpi-card">
          <div className="clean-kpi-top">
            <span className="kpi-label">Muscle Target Groups</span>
            <div className="clean-kpi-icon" title="Muscle Groups" style={{ color: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)' }}>
              <Icons.Activity size={16} />
            </div>
          </div>
          <div className="kpi-value">{muscleGroupsCount}</div>
          <span className="kpi-trend">Chest, Back, Legs & Core</span>
        </div>

        {/* Card 3: Equipment Categories */}
        <div className="clean-kpi-card">
          <div className="clean-kpi-top">
            <span className="kpi-label">Equipment Types</span>
            <div className="clean-kpi-icon" title="Equipment Types" style={{ color: '#a855f7', background: 'rgba(168, 85, 247, 0.1)' }}>
              <Icons.Award size={16} />
            </div>
          </div>
          <div className="kpi-value">{equipmentTypesCount}</div>
          <span className="kpi-trend">Barbell, Machine, Free-Weight</span>
        </div>

        {/* Card 4: Skill Difficulties */}
        <div className="clean-kpi-card">
          <div className="clean-kpi-top">
            <span className="kpi-label">Movement Levels</span>
            <div className="clean-kpi-icon" title="Movement Levels" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}>
              <Icons.Award size={16} />
            </div>
          </div>
          <div className="kpi-value">3 Tiers</div>
          <span className="kpi-trend">Beginner to Advanced</span>
        </div>
      </section>

      {/* Error Banner */}
      {error && (
        <div className="alert alert-danger" style={{ marginBottom: 16 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Icons.AlertTriangle size={15} color="#ea580c" />
            {error}
          </span>
          <button type="button" className="close-btn" onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Search & Filter Controls Toolbar matching Member Directory */}
      <div className="gymflow-controls-bar">
        {/* Search Input matching Member Directory and Membership */}
        <div className="search-bar-wrapper" style={{ flex: 1, position: 'relative' }}>
          <input
            type="text"
            className="form-input search-input-field"
            placeholder="Search exercises by name, muscle, equipment, or technique..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              paddingLeft: 36,
              paddingRight: search ? 34 : 14,
              width: '100%',
              height: 42,
              minHeight: 42,
              boxSizing: 'border-box',
              fontSize: 13.5,
              borderRadius: 8,
            }}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--gym-text-muted, #94a3b8)',
                fontSize: 15,
                padding: '4px 6px',
                borderRadius: 4,
                lineHeight: 1,
              }}
              title="Clear search"
            >
              <Icons.X size={14} />
            </button>
          )}
          <span
            className="search-bar-icon"
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
            }}
          >
            <Icons.Search size={15} />
          </span>
        </div>

        {/* Filter Toggle Button */}
        <button
          type="button"
          className={`gymflow-filter-btn ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
          title="Toggle category, difficulty and target muscle filters"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          <span>FILTERS</span>
          {(categoryFilter || difficultyFilter || muscleFilter || equipmentFilter) && (
            <span
              style={{
                background: '#ff7a00',
                color: '#ffffff',
                fontSize: 10,
                fontWeight: 800,
                padding: '1px 6px',
                borderRadius: 10,
                marginLeft: 4,
              }}
            >
              {[categoryFilter, difficultyFilter, muscleFilter, equipmentFilter].filter(Boolean).length}
            </span>
          )}
        </button>

        {/* Modern Interactive Export Pill & Popover */}
        <div style={{ position: 'relative' }}>
          <div className={`gymflow-export-pill ${showExportMenu ? 'active' : ''}`}>
            {/* Primary Action Button: Immediately downloads Excel (.xlsx) */}
            <button
              type="button"
              className="gymflow-export-action-btn"
              onClick={() => handleExportData('excel')}
              disabled={isExporting}
              title="Download all exercises in Microsoft Excel (.xlsx)"
            >
              <svg width="13.5" height="13.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: isExporting ? 'spin 1s linear infinite' : 'none' }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>{isExporting ? 'EXPORTING...' : 'EXPORT'}</span>
              <span className="gymflow-export-format-tag">XLSX</span>
            </button>

            {/* Toggle Dropdown Arrow */}
            <button
              type="button"
              className="gymflow-export-toggle-btn"
              onClick={(e) => {
                e.stopPropagation();
                setShowExportMenu((prev) => !prev);
              }}
              disabled={isExporting}
              title="Choose download format: Excel (.xlsx) or CSV"
            >
              <svg className={`export-chevron-icon ${showExportMenu ? 'open' : ''}`} width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>

          {/* Luxury Floating Popover */}
          {showExportMenu && (
            <div className="gymflow-export-popover" onClick={(e) => e.stopPropagation()}>
              <div className="export-popover-header">
                <span>EXPORT MOVEMENTS</span>
                <span className="export-count-pill">{filteredExercises.length} exercises</span>
              </div>

              {/* Option 1: Microsoft Excel */}
              <button
                type="button"
                className="export-format-tile tile-excel"
                onClick={() => handleExportData('excel')}
              >
                <div className="export-tile-icon icon-excel">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="8" y1="13" x2="16" y2="13" />
                    <line x1="8" y1="17" x2="16" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </div>
                <div className="export-tile-meta">
                  <div className="export-tile-title-row">
                    <span className="export-tile-title">Microsoft Excel</span>
                    <span className="export-badge-recommended">RECOMMENDED</span>
                  </div>
                  <div className="export-tile-desc">Formatted .xlsx workbook with auto-fitted columns</div>
                </div>
                <svg className="export-tile-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>

              {/* Option 2: CSV Spreadsheet */}
              <button
                type="button"
                className="export-format-tile tile-csv"
                onClick={() => handleExportData('csv')}
              >
                <div className="export-tile-icon icon-csv">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <line x1="10" y1="9" x2="8" y2="9" />
                  </svg>
                </div>
                <div className="export-tile-meta">
                  <div className="export-tile-title-row">
                    <span className="export-tile-title">CSV Document</span>
                    <span className="export-badge-universal">UNIVERSAL</span>
                  </div>
                  <div className="export-tile-desc">UTF-8 BOM comma-separated spreadsheet (.csv)</div>
                </div>
                <svg className="export-tile-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>

              <div className="export-popover-footer">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ff7a00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                <span>Exports all active filter results in one file</span>
              </div>
            </div>
          )}
        </div>

        {/* Table / Cards View Mode Switcher */}
        <div className="gymflow-view-switcher">
          <button
            type="button"
            className={`view-mode-btn ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
            title="Table View"
          >
            TABLE
          </button>
          <button
            type="button"
            className={`view-mode-btn ${viewMode === 'cards' ? 'active' : ''}`}
            onClick={() => setViewMode('cards')}
            title="Cards View"
          >
            CARDS
          </button>
        </div>
      </div>

      {/* Collapsible Filter Dropdowns matching Member Directory */}
      {showFilters && (
        <div className="gymflow-expanded-filters" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', marginBottom: 20 }}>
          <div className="filter-group">
            <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--gym-text-muted, #64748b)' }}>Muscle Group:</label>
            <select
              className="gymflow-select"
              value={muscleFilter}
              onChange={(e) => setMuscleFilter(e.target.value)}
            >
              {MUSCLE_GROUPS.map((m) => (
                <option key={m} value={m === 'All' ? '' : m}>
                  {m === 'All' ? 'All Muscle Groups' : m}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--gym-text-muted, #64748b)' }}>Category:</label>
            <select
              className="gymflow-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat === 'All Categories' ? '' : cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--gym-text-muted, #64748b)' }}>Difficulty:</label>
            <select
              className="gymflow-select"
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
            >
              <option value="">All Difficulties</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div className="filter-group">
            <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--gym-text-muted, #64748b)' }}>Equipment:</label>
            <select
              className="gymflow-select"
              value={equipmentFilter}
              onChange={(e) => setEquipmentFilter(e.target.value)}
            >
              <option value="">All Equipment</option>
              <option value="Bodyweight">Bodyweight / No Equipment</option>
              {equipmentList.map((eq) => (
                <option key={eq.id} value={eq.name}>
                  {eq.name}
                </option>
              ))}
            </select>
          </div>

          {(categoryFilter || difficultyFilter || muscleFilter || equipmentFilter || search) && (
            <button
              type="button"
              className="btn btn-secondary btn-xs"
              onClick={() => {
                setCategoryFilter('');
                setDifficultyFilter('');
                setMuscleFilter('');
                setEquipmentFilter('');
                setSearch('');
              }}
              style={{ marginLeft: 'auto', padding: '6px 12px', fontSize: 12 }}
            >
              Reset Filters
            </button>
          )}
        </div>
      )}

      {/* Main Content Area: Exercises in Table or Cards view */}
      {isLoading ? (
        <div className="exercises-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="exercise-card" style={{ gap: 12, minHeight: 180 }}>
              <div className="exercise-top">
                <div className="trainer-skeleton-pulse" style={{ width: 60, height: 18, borderRadius: 6 }} />
                <div className="trainer-skeleton-pulse" style={{ width: 75, height: 18, borderRadius: 6 }} />
              </div>
              <div className="trainer-skeleton-pulse" style={{ width: '70%', height: 20, borderRadius: 6 }} />
              <div className="trainer-skeleton-pulse" style={{ width: '50%', height: 14, borderRadius: 4 }} />
              <div className="trainer-skeleton-pulse" style={{ width: '90%', height: 36, borderRadius: 6 }} />
              <div className="exercise-footer" style={{ marginTop: 'auto' }}>
                <div className="trainer-skeleton-pulse" style={{ width: 90, height: 14, borderRadius: 4 }} />
                <div className="trainer-skeleton-pulse" style={{ width: 60, height: 24, borderRadius: 6 }} />
              </div>
            </div>
          ))}
        </div>
      ) : filteredExercises.length === 0 ? (
        <div className="coach-empty-box" style={{ padding: '60px 20px' }}>
          <div className="coach-empty-icon">
            <Icons.Dumbbell size={28} />
          </div>
          <strong style={{ fontSize: 16, color: 'var(--gym-text-primary, #0f172a)' }}>
            No Exercises Found
          </strong>
          <p style={{ margin: '6px 0 14px', fontSize: 13, color: 'var(--gym-text-muted, #64748b)', maxWidth: 360 }}>
            No movement matching your filter criteria was found. Try clearing filters or add a new exercise.
          </p>
          {canManage && (
            <button
              type="button"
              className="coach-btn-primary"
              onClick={openAddMovementModal}
              style={{ height: 34, fontSize: 12.5 }}
            >
              <Icons.Plus size={14} />
              <span>+ Add Movement Now</span>
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="gymflow-table-wrapper" style={{ overflowX: 'auto', marginBottom: 24 }}>
          <table className="gymflow-table">
            <thead>
              <tr>
                <th style={{ minWidth: 220 }}>MOVEMENT / EXERCISE</th>
                <th>TARGET MUSCLE</th>
                <th>CATEGORY</th>
                <th>DIFFICULTY</th>
                <th>EQUIPMENT</th>
                <th style={{ minWidth: 220 }}>INSTRUCTIONS / TECHNIQUE</th>
                <th style={{ textAlign: 'right', minWidth: 100 }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredExercises.map((ex) => (
                <tr key={ex.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 9,
                          background: 'rgba(255, 122, 0, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ff7a00',
                          flexShrink: 0,
                        }}
                      >
                        <Icons.Dumbbell size={17} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--gym-text-primary, #0f172a)' }}>
                          {ex.name}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'var(--gym-text-muted, #64748b)' }}>
                          Movement #{ex.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="muscle-tag" style={{ display: 'inline-block' }}>
                      {ex.muscle_group}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gym-text-primary, #1e293b)' }}>
                      {ex.category || 'General'}
                    </span>
                  </td>
                  <td>
                    <span className={`difficulty-badge difficulty-${ex.difficulty}`}>
                      {ex.difficulty}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--gym-text-muted, #64748b)' }}>
                      <Icons.Settings size={13} color="#64748b" />
                      <span>{ex.equipment_needed || 'Standard Gear'}</span>
                    </div>
                  </td>
                  <td style={{ maxWidth: 280 }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 12,
                        color: 'var(--gym-text-muted, #64748b)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={ex.instructions}
                    >
                      {ex.instructions || 'Standard form and repetition tempo'}
                    </p>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="gymflow-table-actions" style={{ justifyContent: 'flex-end' }}>
                      {onNavigate && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-xs"
                          onClick={() => onNavigate('progress', { exercise_id: ex.id })}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          title="Log sets with this exercise in Member Progress"
                        >
                          <span>Track</span>
                          <Icons.ArrowRight size={12} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* CARDS VIEW */
        <div className="exercises-grid">
          {filteredExercises.map((ex) => (
            <div key={ex.id} className="exercise-card">
              <div className="exercise-top">
                <span className="muscle-tag">{ex.muscle_group}</span>
                <span className={`difficulty-badge difficulty-${ex.difficulty}`}>
                  {ex.difficulty}
                </span>
              </div>

              <h4 className="exercise-name">{ex.name}</h4>

              <div className="exercise-equipment" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Icons.Settings size={13} color="#64748b" />
                <span>{ex.equipment_needed || 'Standard Gear'}</span>
              </div>

              {ex.instructions && (
                <p className="exercise-instructions">
                  {ex.instructions}
                </p>
              )}

              <div className="exercise-footer">
                <span className="category-label">Category: {ex.category}</span>
                {onNavigate && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-xs"
                    onClick={() => onNavigate('progress', { exercise_id: ex.id })}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    title="Log sets with this exercise in Member Progress"
                  >
                    <span>Track</span>
                    <Icons.ArrowRight size={12} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── MODAL: Add Movement ─────────────────────────────────────── */}
      {isAddModalOpen && (
        <div
          className="gym-modal-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.78)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: 16,
          }}
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="gym-modal-card"
            style={{
              maxWidth: 520,
              width: '100%',
              background: 'var(--gym-card-bg, #ffffff)',
              color: 'var(--gym-text-primary, #0f172a)',
              borderRadius: 16,
              border: '1px solid var(--gym-card-border, #e2e8f0)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.35)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="gym-modal-header">
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icons.Dumbbell size={18} color="#ff7a00" />
                <span>Add Movement to Exercise Library</span>
              </h3>
              <button
                type="button"
                className="btn-clean-schedule"
                onClick={() => setIsAddModalOpen(false)}
                style={{ width: 28, height: 28, padding: 0 }}
              >
                <Icons.X size={14} />
              </button>
            </div>

            <form onSubmit={handleCreateExercise}>
              <div className="gym-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {formError && (
                  <div className="alert alert-danger" style={{ padding: '8px 12px', fontSize: 12 }}>
                    {formError}
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
                    Movement Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="filter-input-search"
                    style={{ width: '100%', height: 38, borderRadius: 8, fontSize: 13 }}
                    value={exerciseForm.name}
                    onChange={(e) => setExerciseForm({ ...exerciseForm, name: e.target.value })}
                    placeholder="e.g. Romanian Deadlift, Incline Dumbbell Press"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
                      Target Muscle Group *
                    </label>
                    <select
                      className="filter-input-search"
                      style={{ width: '100%', height: 38, borderRadius: 8, fontSize: 13 }}
                      value={exerciseForm.muscle_group}
                      onChange={(e) => setExerciseForm({ ...exerciseForm, muscle_group: e.target.value })}
                    >
                      {MUSCLE_GROUPS.filter((m) => m !== 'All').map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
                      Category / Equipment Type
                    </label>
                    <select
                      className="filter-input-search"
                      style={{ width: '100%', height: 38, borderRadius: 8, fontSize: 13 }}
                      value={exerciseForm.category}
                      onChange={(e) => setExerciseForm({ ...exerciseForm, category: e.target.value })}
                    >
                      {CATEGORIES.filter((c) => c !== 'All Categories').map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                      <label style={{ fontSize: 12, fontWeight: 700, margin: 0 }}>
                        Equipment Needed *
                      </label>
                      {equipmentList.length > 0 && (
                        <span style={{ fontSize: 10.5, color: '#ff7a00', fontWeight: 600 }}>
                          {equipmentList.length} in Gym Inventory
                        </span>
                      )}
                    </div>
                    <select
                      className="filter-input-search"
                      style={{ width: '100%', height: 38, borderRadius: 8, fontSize: 13 }}
                      value={isCustomEquipment ? '__custom__' : (exerciseForm.equipment_needed || 'Bodyweight / No Equipment')}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '__custom__') {
                          setIsCustomEquipment(true);
                          setExerciseForm({ ...exerciseForm, equipment_needed: customEquipmentName || '' });
                        } else {
                          setIsCustomEquipment(false);
                          setExerciseForm({ ...exerciseForm, equipment_needed: val });
                        }
                      }}
                    >
                      <option value="Bodyweight / No Equipment">Bodyweight / No Equipment (None)</option>

                      {isLoadingEquipment ? (
                        <option disabled>Loading gym equipment inventory...</option>
                      ) : (
                        Object.entries(groupedEquipment).map(([catKey, items]) => (
                          <optgroup
                            key={catKey}
                            label={EQUIPMENT_CATEGORY_LABELS[catKey] || catKey.replace('_', ' ').toUpperCase()}
                          >
                            {items.map((eq) => (
                              <option key={eq.id} value={eq.name}>
                                {eq.name} {eq.brand ? `(${eq.brand})` : ''}
                              </option>
                            ))}
                          </optgroup>
                        ))
                      )}

                      <option value="__custom__">+ Other / Custom Equipment...</option>
                    </select>

                    {isCustomEquipment && (
                      <input
                        type="text"
                        className="filter-input-search"
                        style={{ width: '100%', height: 36, borderRadius: 8, fontSize: 13, marginTop: 8 }}
                        placeholder="Type custom equipment name..."
                        value={customEquipmentName}
                        onChange={(e) => {
                          setCustomEquipmentName(e.target.value);
                          setExerciseForm({ ...exerciseForm, equipment_needed: e.target.value });
                        }}
                        autoFocus
                      />
                    )}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
                      Difficulty Level
                    </label>
                    <select
                      className="filter-input-search"
                      style={{ width: '100%', height: 38, borderRadius: 8, fontSize: 13 }}
                      value={exerciseForm.difficulty}
                      onChange={(e) => setExerciseForm({ ...exerciseForm, difficulty: e.target.value })}
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 5 }}>
                    Execution Technique & Instructions
                  </label>
                  <textarea
                    rows={3}
                    className="filter-input-search"
                    style={{ width: '100%', borderRadius: 8, fontSize: 13, padding: 10 }}
                    value={exerciseForm.instructions}
                    onChange={(e) => setExerciseForm({ ...exerciseForm, instructions: e.target.value })}
                    placeholder="Describe setup, grip, breathing, tempo cues..."
                  />
                </div>
              </div>

              <div className="gym-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  className="coach-btn-secondary"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="coach-btn-primary"
                  disabled={isSubmitting || !exerciseForm.name.trim()}
                  style={{ height: 36, padding: '0 18px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Icons.Plus size={14} />
                  <span>{isSubmitting ? 'Saving...' : 'Add Exercise'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
