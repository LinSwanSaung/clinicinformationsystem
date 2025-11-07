import { useState, useEffect } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Filter } from 'lucide-react';
import { auditLogService } from '@/features/admin';
import { DataTable, StatusBadge } from '@/components/library';
import logger from '@/utils/logger';

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
    offset: 0,
  });
  const [filterOptions, setFilterOptions] = useState({ actions: [], entities: [] });

  useEffect(() => {
    loadFilterOptions();
  }, []);

  useEffect(() => {
    loadLogs();
  }, [filters]);

  const loadFilterOptions = async () => {
    try {
      const options = await auditLogService.getFilterOptions();
      setFilterOptions(options);
    } catch (error) {
      logger.error('Failed to load filter options:', error);
    }
  };

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.action) {
        params.action = filters.action;
      }
      if (filters.entity) {
        params.entity = filters.entity;
      }
      if (filters.start_date) {
        params.start_date = filters.start_date;
      }
      if (filters.end_date) {
        params.end_date = filters.end_date;
      }
      params.limit = filters.limit;
      params.offset = filters.offset;

      const response = await auditLogService.getAuditLogs(params);
      setLogs(response?.data || []);
      setTotal(response?.total || 0);
    } catch (error) {
      logger.error('Failed to load audit logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, offset: 0 }));
  };

  const handleApplyFilters = () => {
    loadLogs();
  };

  const handleClearFilters = () => {
    setFilters({ action: '', entity: '', start_date: '', end_date: '', limit: 50, offset: 0 });
    setTimeout(() => loadLogs(), 100);
  };

  const handlePageChange = (newPage) => {
    const newOffset = (newPage - 1) * filters.limit;
    setFilters((prev) => ({ ...prev, offset: newOffset }));
    setTimeout(() => loadLogs(), 100);
  };

  const getActionBadgeVariant = (action) => {
    if (action?.includes('LOGIN')) {
      return 'secondary';
    }
    if (action === 'CREATE') {
      return 'default';
    }
    if (action === 'UPDATE') {
      return 'outline';
    }
    if (action === 'DELETE' || action === 'CANCEL') {
      return 'destructive';
    }
    return 'outline';
  };

  const getStatusBadgeVariant = (status) => {
    if (status === 'success') {
      return 'secondary';
    }
    if (status === 'failed') {
      return 'destructive';
    }
    if (status === 'denied' || status === 'warning') {
      return 'outline';
    }
    return 'outline';
  };

  const currentPage = Math.floor(filters.offset / filters.limit) + 1;

  return (
    <PageLayout
      title="System Audit Logs"
      subtitle="Monitor system activities and user actions"
      fullWidth
    >
      <div className="space-y-6">
        {/* Filters */}
        <Card className="p-6">
          <div className="mb-4 flex items-center space-x-3">
            <Filter size={20} className="text-gray-600" />
            <h3 className="text-lg font-bold">Filters</h3>
          </div>
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Action</label>
              <select
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
              >
                <option value="">All Actions</option>
                {filterOptions.actions.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Entity</label>
              <select
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                value={filters.entity}
                onChange={(e) => handleFilterChange('entity', e.target.value)}
              >
                <option value="">All Entities</option>
                {filterOptions.entities.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                value={filters.start_date}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date"
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                value={filters.end_date}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
              />
            </div>
          </div>
          <div className="flex space-x-2">
            <Button size="sm" onClick={handleApplyFilters}>
              Apply Filters
            </Button>
            <Button size="sm" variant="outline" onClick={handleClearFilters}>
              Clear
            </Button>
          </div>
        </Card>

        {/* Logs Table */}
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold">Audit Logs ({total} total)</h3>
          </div>

          <DataTable
            columns={[
              {
                key: 'timestamp',
                label: 'Timestamp',
                render: (_, row) =>
                  new Date(row.created_at).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
              },
              {
                key: 'user',
                label: 'User',
                render: (_, row) => (
                  <div>
                    <p className="font-medium text-gray-900">
                      {row.user ? `${row.user.first_name} ${row.user.last_name}` : 'System'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {row.new_values?.role || row.user?.role || 'N/A'}
                    </p>
                  </div>
                ),
              },
              {
                key: 'action',
                label: 'Action',
                render: (_, row) => (
                  <StatusBadge status={row.action} variant={getActionBadgeVariant(row.action)}>
                    {row.action}
                  </StatusBadge>
                ),
              },
              {
                key: 'entity',
                label: 'Entity',
                render: (_, row) => <span className="text-gray-700">{row.table_name || '—'}</span>,
              },
              {
                key: 'result',
                label: 'Result',
                render: (_, row) => (
                  <StatusBadge
                    status={row.status || 'N/A'}
                    variant={getStatusBadgeVariant(row.status)}
                  >
                    {row.status || 'N/A'}
                  </StatusBadge>
                ),
              },
              {
                key: 'ip',
                label: 'IP',
                render: (_, row) => (
                  <span className="text-xs text-gray-600">{row.ip_address || '—'}</span>
                ),
              },
            ]}
            data={logs}
            isLoading={loading}
            emptyText="No audit logs found."
            page={currentPage}
            pageSize={filters.limit}
            total={total}
            onPageChange={handlePageChange}
          />
        </Card>
      </div>
    </PageLayout>
  );
};

export default AuditLogs;
