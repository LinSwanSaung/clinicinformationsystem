import React, { useState, useEffect } from 'react';
import PageLayout from '@/components/PageLayout';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Filter, Activity } from 'lucide-react';
import auditLogService from '../../services/auditLogService';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    action: '',
    entity: '',
    start_date: '',
    end_date: '',
    limit: 50,
    offset: 0
  });
  const [filterOptions, setFilterOptions] = useState({ actions: [], entities: [] });

  useEffect(() => {
    loadFilterOptions();
    loadLogs();
  }, []);

  const loadFilterOptions = async () => {
    try {
      const options = await auditLogService.getFilterOptions();
      setFilterOptions(options);
    } catch (error) {
      console.error('Failed to load filter options:', error);
    }
  };

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.action) params.action = filters.action;
      if (filters.entity) params.entity = filters.entity;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
      params.limit = filters.limit;
      params.offset = filters.offset;

      const response = await auditLogService.getAuditLogs(params);
      setLogs(response?.data || []);
      setTotal(response?.total || 0);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, offset: 0 }));
  };

  const handleApplyFilters = () => {
    loadLogs();
  };

  const handleClearFilters = () => {
    setFilters({ action: '', entity: '', start_date: '', end_date: '', limit: 50, offset: 0 });
    setTimeout(() => loadLogs(), 100);
  };

  const handleNextPage = () => {
    setFilters(prev => ({ ...prev, offset: prev.offset + prev.limit }));
    setTimeout(() => loadLogs(), 100);
  };

  const handlePrevPage = () => {
    setFilters(prev => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }));
    setTimeout(() => loadLogs(), 100);
  };

  const getActionBadgeColor = (action) => {
    if (action?.includes('LOGIN')) return 'bg-green-100 text-green-700';
    if (action === 'LOGOUT') return 'bg-gray-100 text-gray-700';
    if (action === 'CREATE') return 'bg-blue-100 text-blue-700';
    if (action === 'UPDATE') return 'bg-yellow-100 text-yellow-700';
    if (action === 'DELETE' || action === 'CANCEL') return 'bg-red-100 text-red-700';
    if (action === 'VIEW') return 'bg-purple-100 text-purple-700';
    if (action === 'UPLOAD' || action === 'DOWNLOAD') return 'bg-indigo-100 text-indigo-700';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <PageLayout
      title="System Audit Logs"
      subtitle="Monitor system activities and user actions"
      fullWidth
    >
      <div className="space-y-6">
      {/* Filters */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Filter size={20} className="text-gray-600" />
          <h3 className="text-lg font-bold">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
            <select
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
            >
              <option value="">All Actions</option>
              {filterOptions.actions.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Entity</label>
            <select
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              value={filters.entity}
              onChange={(e) => handleFilterChange('entity', e.target.value)}
            >
              <option value="">All Entities</option>
              {filterOptions.entities.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              value={filters.start_date}
              onChange={(e) => handleFilterChange('start_date', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              value={filters.end_date}
              onChange={(e) => handleFilterChange('end_date', e.target.value)}
            />
          </div>
        </div>
        <div className="flex space-x-2">
          <Button size="sm" onClick={handleApplyFilters}>Apply Filters</Button>
          <Button size="sm" variant="outline" onClick={handleClearFilters}>Clear</Button>
        </div>
      </Card>

      {/* Logs Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">
            Audit Logs ({total} total)
          </h3>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading audit logs...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No audit logs found.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-3 font-semibold">Timestamp</th>
                    <th className="text-left p-3 font-semibold">User</th>
                    <th className="text-left p-3 font-semibold">Action</th>
                    <th className="text-left p-3 font-semibold">Entity</th>
                    <th className="text-left p-3 font-semibold">Result</th>
                    <th className="text-left p-3 font-semibold">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, idx) => (
                    <tr key={log.id || idx} className="border-b hover:bg-gray-50">
                      <td className="p-3 text-gray-700">
                        {new Date(log.created_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="p-3">
                        <div>
                          <p className="font-medium text-gray-900">
                            {log.user ? `${log.user.first_name} ${log.user.last_name}` : 'System'}
                          </p>
                          <p className="text-xs text-gray-500">{log.new_values?.role || log.user?.role || 'N/A'}</p>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getActionBadgeColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3 text-gray-700">{log.table_name || '—'}</td>
                      <td className="p-3">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          log.new_values?.result === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {log.new_values?.result || 'N/A'}
                        </span>
                      </td>
                      <td className="p-3 text-gray-600 text-xs">{log.ip_address || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600">
                Showing {filters.offset + 1} to {Math.min(filters.offset + filters.limit, total)} of {total}
              </p>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handlePrevPage}
                  disabled={filters.offset === 0}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleNextPage}
                  disabled={filters.offset + filters.limit >= total}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
      </div>
    </PageLayout>
  );
};

export default AuditLogs;
