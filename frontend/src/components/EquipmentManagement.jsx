import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/useAuth';
import apiClient from '../services/api';

export default function EquipmentManagement() {
  const { hasRole } = useAuth();
  const canManage = hasRole('owner') || hasRole('admin');
  const canInspect = hasRole('owner') || hasRole('admin') || hasRole('receptionist');

  const [equipmentList, setEquipmentList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  // Modals
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isInspectOpen, setIsInspectOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Register Form
  const [registerForm, setRegisterForm] = useState({
    name: '',
    category: 'strength',
    brand: 'Life Fitness',
    model_number: 'Pro2 Seated Leg Press',
    status: 'operational',
    location_area: 'Main Floor (Strength Bay)',
    purchase_cost: 85000,
    next_maintenance_due: '',
    maintenance_notes: 'Initial inspection passed. Cable tension and bearing lubricants verified.',
  });

  // Inspect / Update Form
  const [inspectForm, setInspectForm] = useState({
    status: 'operational',
    location_area: '',
    maintenance_notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load Equipment
  const loadEquipment = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.getEquipment({
        category: categoryFilter,
        status: statusFilter,
        search,
      });
      setEquipmentList(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load equipment assets.');
    } finally {
      setIsLoading(false);
    }
  }, [categoryFilter, statusFilter, search]);

  useEffect(() => {
    let ignore = false;
    apiClient.getEquipment({ category: categoryFilter, status: statusFilter, search })
      .then((res) => {
        if (!ignore) {
          setEquipmentList(res.data || []);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message || 'Failed to load equipment assets.');
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [categoryFilter, statusFilter, search]);

  // Handle Register Equipment
  const handleRegister = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await apiClient.createEquipment(registerForm);
      setSuccessMessage(res.message || 'Equipment asset registered successfully.');
      setIsRegisterOpen(false);
      setRegisterForm({
        name: '',
        category: 'strength',
        brand: 'Life Fitness',
        model_number: '',
        status: 'operational',
        location_area: 'Main Floor (Strength Bay)',
        purchase_cost: 0,
        next_maintenance_due: '',
        maintenance_notes: '',
      });
      loadEquipment();
    } catch (err) {
      setError(err.message || 'Failed to register equipment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Inspect & Update
  const handleInspectUpdate = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await apiClient.updateEquipment(selectedItem.id, {
        ...inspectForm,
        last_inspected_at: new Date().toISOString().split('T')[0],
      });
      setSuccessMessage(res.message || 'Equipment record updated.');
      setIsInspectOpen(false);
      loadEquipment();
    } catch (err) {
      setError(err.message || 'Failed to update equipment inspection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Status badge styling helper
  const getStatusBadge = (status) => {
    switch (status) {
      case 'operational':
        return <span className="status-pill status-active">Operational</span>;
      case 'needs_maintenance':
        return <span className="status-pill status-frozen" style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#eab308' }}>Needs Maintenance</span>;
      case 'under_repair':
        return <span className="status-pill status-pending" style={{ background: 'rgba(249, 115, 22, 0.15)', color: '#f97316' }}>Under Repair</span>;
      case 'out_of_service':
      case 'decommissioned':
        return <span className="status-pill status-inactive">Out of Service</span>;
      default:
        return <span className="status-pill">{status}</span>;
    }
  };

  // Category counts summary
  const totalAssets = equipmentList.length;
  const operationalCount = equipmentList.filter((e) => e.status === 'operational').length;
  const attentionCount = equipmentList.filter((e) => e.status === 'needs_maintenance' || e.status === 'under_repair').length;

  return (
    <div className="module-container">
      {/* Top Asset Summary Metric Cards */}
      <div className="dashboard-metrics-grid" style={{ marginBottom: 20 }}>
        <div className="metric-card">
          <span className="metric-title">Total Equipment Assets</span>
          <span className="metric-value">{totalAssets}</span>
          <span className="metric-subtext">Registered gym inventory</span>
        </div>
        <div className="metric-card">
          <span className="metric-title">Operational & Available</span>
          <span className="metric-value text-success">{operationalCount}</span>
          <span className="metric-subtext">Active on gym floor</span>
        </div>
        <div className="metric-card">
          <span className="metric-title">Maintenance Attention</span>
          <span className="metric-value text-orange">{attentionCount}</span>
          <span className="metric-subtext">Needs inspection or repair</span>
        </div>
      </div>

      {/* Action and Filter Toolbar */}
      <div className="section-header-bar">
        <div className="filter-group-inline">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Categories</option>
            <option value="strength">Strength Machines</option>
            <option value="free_weights">Free Weights & Barbells</option>
            <option value="cardio">Cardio (Treadmills / Cycles)</option>
            <option value="accessories">Accessories & Bands</option>
            <option value="recovery">Recovery & Mobility</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Statuses</option>
            <option value="operational">Operational</option>
            <option value="needs_maintenance">Needs Maintenance</option>
            <option value="under_repair">Under Repair</option>
            <option value="out_of_service">Out of Service</option>
          </select>

          <input
            type="text"
            placeholder="Search equipment code, brand, model..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input-compact"
            style={{ minWidth: 260 }}
          />
        </div>

        <div className="section-actions">
          {canManage && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setIsRegisterOpen(true)}
            >
              + Register New Asset
            </button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {successMessage && (
        <div className="alert alert-success" style={{ marginBottom: 16 }}>
          <span>✓ {successMessage}</span>
          <button type="button" className="close-btn" onClick={() => setSuccessMessage(null)}>×</button>
        </div>
      )}

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: 16 }}>
          <span>⚠️ {error}</span>
          <button type="button" className="close-btn" onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Equipment Table */}
      {isLoading ? (
        <div className="loading-state">
          <span className="spinner"></span>
          <p>Loading gym assets and inspection log...</p>
        </div>
      ) : equipmentList.length === 0 ? (
        <div className="empty-state-box">
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚙️</div>
          <h4>No Equipment Found</h4>
          <p>No machinery or inventory matches the current search filters.</p>
          {canManage && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              style={{ marginTop: 12 }}
              onClick={() => setIsRegisterOpen(true)}
            >
              + Register First Asset
            </button>
          )}
        </div>
      ) : (
        <div className="table-responsive">
          <table className="gym-table">
            <thead>
              <tr>
                <th>Asset Code</th>
                <th>Equipment Name & Brand</th>
                <th>Category</th>
                <th>Location Area</th>
                <th>Status</th>
                <th>Next Service Due</th>
                <th>Inspection Notes</th>
                {canInspect && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {equipmentList.map((item) => (
                <tr key={item.id}>
                  <td>
                    <span className="font-mono text-orange">{item.equipment_code}</span>
                  </td>
                  <td>
                    <div>
                      <strong>{item.name}</strong>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>
                        {item.brand} {item.model_number ? `• ${item.model_number}` : ''}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge" style={{ textTransform: 'capitalize' }}>
                      {item.category?.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: 13, color: '#cbd5e1' }}>
                      📍 {item.location_area || 'Main Floor'}
                    </span>
                  </td>
                  <td>
                    {getStatusBadge(item.status)}
                  </td>
                  <td>
                    <span style={{ fontSize: 12, color: item.next_maintenance_due ? '#e2e8f0' : '#64748b' }}>
                      {item.next_maintenance_due || 'Not scheduled'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: 12, color: '#94a3b8', maxWidth: 200, display: 'inline-block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {item.maintenance_notes || 'No issues reported'}
                    </span>
                  </td>
                  {canInspect && (
                    <td>
                      <button
                        type="button"
                        className="btn btn-secondary btn-xs"
                        onClick={() => {
                          setSelectedItem(item);
                          setInspectForm({
                            status: item.status,
                            location_area: item.location_area || '',
                            maintenance_notes: item.maintenance_notes || '',
                          });
                          setIsInspectOpen(true);
                        }}
                      >
                        🔍 Inspect / Update
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal 1: Register Asset */}
      {isRegisterOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Register Gym Asset / Machine</h3>
              <button type="button" className="close-btn" onClick={() => setIsRegisterOpen(false)}>×</button>
            </div>
            <form onSubmit={handleRegister}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Equipment Name *</label>
                  <input
                    type="text"
                    required
                    value={registerForm.name}
                    onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                    placeholder="e.g. Olympic Incline Bench, Commercial Cable Crossover"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Category *</label>
                    <select
                      value={registerForm.category}
                      onChange={(e) => setRegisterForm({ ...registerForm, category: e.target.value })}
                    >
                      <option value="strength">Strength Machine</option>
                      <option value="free_weights">Free Weights & Barbells</option>
                      <option value="cardio">Cardio Equipment</option>
                      <option value="machines">Cable / Plate Loaded</option>
                      <option value="accessories">Accessories / Bands</option>
                      <option value="recovery">Recovery & Sauna</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Operational Status</label>
                    <select
                      value={registerForm.status}
                      onChange={(e) => setRegisterForm({ ...registerForm, status: e.target.value })}
                    >
                      <option value="operational">Operational</option>
                      <option value="needs_maintenance">Needs Maintenance</option>
                      <option value="under_repair">Under Repair</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Manufacturer / Brand</label>
                    <input
                      type="text"
                      value={registerForm.brand}
                      onChange={(e) => setRegisterForm({ ...registerForm, brand: e.target.value })}
                      placeholder="Life Fitness, Hammer Strength, Technogym"
                    />
                  </div>
                  <div className="form-group">
                    <label>Model / Serial #</label>
                    <input
                      type="text"
                      value={registerForm.model_number}
                      onChange={(e) => setRegisterForm({ ...registerForm, model_number: e.target.value })}
                      placeholder="HS-LP-2024"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Location Floor Area</label>
                    <input
                      type="text"
                      value={registerForm.location_area}
                      onChange={(e) => setRegisterForm({ ...registerForm, location_area: e.target.value })}
                      placeholder="Main Strength Bay, Cardio Loft"
                    />
                  </div>
                  <div className="form-group">
                    <label>Purchase Cost (ETB)</label>
                    <input
                      type="number"
                      min="0"
                      value={registerForm.purchase_cost}
                      onChange={(e) => setRegisterForm({ ...registerForm, purchase_cost: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Next Scheduled Maintenance</label>
                  <input
                    type="date"
                    value={registerForm.next_maintenance_due}
                    onChange={(e) => setRegisterForm({ ...registerForm, next_maintenance_due: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Inspection & Setup Notes</label>
                  <textarea
                    rows="2"
                    value={registerForm.maintenance_notes}
                    onChange={(e) => setRegisterForm({ ...registerForm, maintenance_notes: e.target.value })}
                    placeholder="Pulleys lubricated, safety pins checked, upholstery verified."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsRegisterOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Registering...' : 'Register Equipment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Inspect & Update Status */}
      {isInspectOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Equipment Inspection: {selectedItem?.name}</h3>
              <button type="button" className="close-btn" onClick={() => setIsInspectOpen(false)}>×</button>
            </div>
            <form onSubmit={handleInspectUpdate}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Asset Identification</label>
                  <div className="code-pill font-mono" style={{ padding: '8px 12px', background: '#0a0d14', borderRadius: 6 }}>
                    {selectedItem?.equipment_code} — {selectedItem?.brand} ({selectedItem?.category})
                  </div>
                </div>
                <div className="form-group">
                  <label>Operational Condition *</label>
                  <select
                    required
                    value={inspectForm.status}
                    onChange={(e) => setInspectForm({ ...inspectForm, status: e.target.value })}
                  >
                    <option value="operational">Operational & Safe</option>
                    <option value="needs_maintenance">Needs Maintenance (Cable wear, squeak, loose bolt)</option>
                    <option value="under_repair">Under Repair (Technician dispatched)</option>
                    <option value="out_of_service">Out of Service (Safety Hazard - Locked)</option>
                    <option value="decommissioned">Decommissioned</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Location Area</label>
                  <input
                    type="text"
                    value={inspectForm.location_area}
                    onChange={(e) => setInspectForm({ ...inspectForm, location_area: e.target.value })}
                    placeholder="Main Floor, Cardio Section"
                  />
                </div>
                <div className="form-group">
                  <label>Inspection Findings & Technician Notes</label>
                  <textarea
                    rows="3"
                    value={inspectForm.maintenance_notes}
                    onChange={(e) => setInspectForm({ ...inspectForm, maintenance_notes: e.target.value })}
                    placeholder="Tightened mounting bolts. Tested hydraulic resistance."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsInspectOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving Inspection...' : 'Record Inspection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
