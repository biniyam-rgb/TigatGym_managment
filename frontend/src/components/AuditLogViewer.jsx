import { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/api';

export default function AuditLogViewer() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      const res = await apiClient.getAuditLogs({
        action: actionFilter,
        page,
      });

      if (res?.data) {
        setLogs(res.data);
        setTotalPages(res.last_page || 1);
        setTotalCount(res.total || 0);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [actionFilter, page]);

  useEffect(() => {
    let ignore = false;
    apiClient.getAuditLogs({ action: actionFilter, page })
      .then((res) => {
        if (!ignore && res?.data) {
          setLogs(res.data);
          setTotalPages(res.last_page || 1);
          setTotalCount(res.total || 0);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error('Failed to load audit logs:', err);
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [actionFilter, page]);

  return (
    <div className="audit-log-section">
      <div className="section-toolbar">
        <div>
          <h3>System Security & Audit Trail</h3>
          <span className="text-muted">Owner-exclusive immutable ledger ({totalCount} entries logged)</span>
        </div>
        <button type="button" className="btn btn-secondary btn-sm" onClick={fetchLogs}>
          ↻ Refresh Logs
        </button>
      </div>

      <div className="filter-bar">
        <input
          type="text"
          className="form-control search-input"
          placeholder="Filter by action (e.g. auth.login, user.created, user.role_assigned)..."
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <div className="table-wrapper">
        <table className="gym-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Action</th>
              <th>Actor</th>
              <th>Target Model</th>
              <th>IP Address</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="6" className="text-center py-4">
                  <span className="spinner"></span> Loading audit logs...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-4 text-muted">
                  No audit logs recorded yet.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id}>
                  <td className="text-sm font-mono text-muted">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td>
                    <span className="badge badge-action font-mono">{log.action}</span>
                  </td>
                  <td>
                    {log.user ? (
                      <div>
                        <strong>{log.user.name}</strong>
                        <div className="text-sm text-muted">{log.user.email}</div>
                      </div>
                    ) : (
                      <span className="text-muted">System / Anonymous</span>
                    )}
                  </td>
                  <td className="text-sm">
                    {log.auditable_type ? (
                      <span>
                        {log.auditable_type.split('\\').pop()} #{log.auditable_id}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="font-mono text-sm">{log.ip_address || '—'}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-secondary btn-xs"
                      onClick={() => setSelectedLog(log)}
                    >
                      View Diff
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination-controls">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ← Previous
          </button>
          <span>Page {page} of {totalPages}</span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next →
          </button>
        </div>
      )}

      {/* Log Detail Inspector Modal */}
      {selectedLog && (
        <div className="modal-backdrop">
          <div className="modal-card modal-card-wide">
            <div className="modal-header">
              <h3>Audit Event Details: {selectedLog.action}</h3>
              <button
                type="button"
                className="btn-close"
                onClick={() => setSelectedLog(null)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="meta-grid">
                <div><strong>Event ID:</strong> #{selectedLog.id}</div>
                <div><strong>Timestamp:</strong> {new Date(selectedLog.created_at).toLocaleString()}</div>
                <div><strong>IP Address:</strong> {selectedLog.ip_address}</div>
                <div><strong>User Agent:</strong> {selectedLog.user_agent || 'Unknown'}</div>
                {selectedLog.notes && <div className="col-span-2"><strong>Notes:</strong> {selectedLog.notes}</div>}
              </div>

              {selectedLog.old_values && (
                <div className="diff-box">
                  <h4>Old Values (Before Change):</h4>
                  <pre>{JSON.stringify(selectedLog.old_values, null, 2)}</pre>
                </div>
              )}

              {selectedLog.new_values && (
                <div className="diff-box">
                  <h4>New Values (After Change):</h4>
                  <pre>{JSON.stringify(selectedLog.new_values, null, 2)}</pre>
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedLog(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
