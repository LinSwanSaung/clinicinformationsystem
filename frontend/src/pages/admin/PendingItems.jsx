import { useEffect, useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Textarea } from '../../components/ui/textarea';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  RefreshCw,
  AlertCircle,
  Calendar,
  User,
  Stethoscope,
  DollarSign,
} from 'lucide-react';
import PageLayout from '@/components/PageLayout';
import adminService from '@/services/Admin.service';
import { StatusBadge, DataTable } from '@/components/library';

const PendingItems = () => {
  const [pendingItems, setPendingItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters
  const [moduleFilter, setModuleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ageFilter, setAgeFilter] = useState('all');

  // Override modal
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [overrideForm, setOverrideForm] = useState({
    newStatus: '',
    reason: '',
  });
  const [overrideSubmitting, setOverrideSubmitting] = useState(false);

  const loadPendingItems = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminService.getPendingItems();
      console.log('[FRONTEND] Received pending items:', data);
      setPendingItems(data || []);
    } catch (err) {
      console.error('Failed to load pending items:', err);
      setError(err.message || 'Failed to load pending items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingItems();
  }, []);

  const filteredItems = useMemo(() => {
    const filtered = pendingItems.filter((item) => {
      // Module filter
      if (moduleFilter !== 'all' && item.entityType !== moduleFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all' && item.currentStatus !== statusFilter) {
        return false;
      }

      // Age filter
      if (ageFilter !== 'all') {
        const itemAge = new Date() - new Date(item.lastUpdated);
        const ageHours = itemAge / (1000 * 60 * 60);

        switch (ageFilter) {
          case '1h':
            if (ageHours < 1) {
              return false;
            }
            break;
          case '24h':
            if (ageHours < 24) {
              return false;
            }
            break;
          case '7d':
            if (ageHours < 168) {
              return false;
            } // 7 * 24
            break;
          case '30d':
            if (ageHours < 720) {
              return false;
            } // 30 * 24
            break;
        }
      }

      return true;
    });

    console.log('[FRONTEND] Filtered items:', filtered.length, 'from', pendingItems.length);
    return filtered;
  }, [pendingItems, moduleFilter, statusFilter, ageFilter]);

  const getModuleIcon = (moduleType) => {
    switch (moduleType) {
      case 'visit':
        return <Stethoscope className="h-4 w-4" />;
      case 'appointment':
        return <Calendar className="h-4 w-4" />;
      case 'queue':
        return <Clock className="h-4 w-4" />;
      case 'billing':
        return <DollarSign className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'pending':
        return 'default';
      case 'completed':
      case 'closed':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const openOverrideModal = (item) => {
    setSelectedItem(item);
    setOverrideForm({
      newStatus: '',
      reason: '',
    });
    setOverrideModalOpen(true);
  };

  const closeOverrideModal = () => {
    setOverrideModalOpen(false);
    setSelectedItem(null);
    setOverrideForm({
      newStatus: '',
      reason: '',
    });
  };

  const handleOverrideSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem || !overrideForm.newStatus || !overrideForm.reason.trim()) {
      return;
    }

    setOverrideSubmitting(true);
    try {
      await adminService.overrideRecord({
        entityType: selectedItem.entityType,
        entityId: selectedItem.entityId,
        newStatus: overrideForm.newStatus,
        reason: overrideForm.reason,
      });

      setSuccess(`Successfully resolved ${selectedItem.entityType} record`);
      closeOverrideModal();
      loadPendingItems(); // Refresh the list
    } catch (err) {
      console.error('Failed to override record:', err);
      setError(err.message || 'Failed to resolve record');
    } finally {
      setOverrideSubmitting(false);
    }
  };

  const getAvailableStatuses = (entityType) => {
    switch (entityType) {
      case 'visit':
        return ['completed', 'cancelled']; // completed = visit happened, cancelled = visit didn't happen
      case 'appointment':
        return ['completed', 'cancelled', 'no_show'];
      case 'queue':
        return ['completed', 'cancelled'];
      case 'billing':
        return ['paid', 'cancelled', 'written_off'];
      default:
        return ['completed', 'cancelled'];
    }
  };

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Pending Items</h1>
            <p className="text-muted-foreground">
              Review and resolve incomplete records across the system
            </p>
          </div>
          <Button onClick={loadPendingItems} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            <CheckCircle2 className="mt-0.5 h-5 w-5" />
            <span>{success}</span>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="module-filter">Module</Label>
                <Select value={moduleFilter} onValueChange={setModuleFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All modules" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Modules</SelectItem>
                    <SelectItem value="visit">Visits</SelectItem>
                    <SelectItem value="appointment">Appointments</SelectItem>
                    <SelectItem value="queue">Queue</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status-filter">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="incomplete">Incomplete</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="age-filter">Age</Label>
                <Select value={ageFilter} onValueChange={setAgeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any age" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Age</SelectItem>
                    <SelectItem value="1h">Older than 1 hour</SelectItem>
                    <SelectItem value="24h">Older than 24 hours</SelectItem>
                    <SelectItem value="7d">Older than 7 days</SelectItem>
                    <SelectItem value="30d">Older than 30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Items Table */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Records ({filteredItems.length})</CardTitle>
            <CardDescription>Records that may need administrative attention</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                {
                  key: 'module',
                  label: 'Module',
                  render: (_, row) => (
                    <div className="flex items-center gap-2">
                      {getModuleIcon(row.entityType)}
                      <span className="capitalize">{row.entityType}</span>
                    </div>
                  ),
                },
                {
                  key: 'patient',
                  label: 'Patient',
                  render: (_, row) => (
                    <div>
                      <div className="font-medium">{row.patientName}</div>
                      <div className="text-sm text-muted-foreground">{row.patientNumber}</div>
                    </div>
                  ),
                },
                {
                  key: 'doctor',
                  label: 'Doctor',
                  render: (_, row) =>
                    row.doctorName ? (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {row.doctorName}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    ),
                },
                {
                  key: 'status',
                  label: 'Status',
                  render: (_, row) => (
                    <StatusBadge
                      status={row.currentStatus}
                      variant={getStatusBadgeVariant(row.currentStatus)}
                    />
                  ),
                },
                {
                  key: 'lastUpdated',
                  label: 'Last Updated',
                  render: (_, row) => (
                    <span className="text-sm text-muted-foreground">
                      {new Date(row.lastUpdated).toLocaleString()}
                    </span>
                  ),
                },
                {
                  key: 'action',
                  label: 'Action',
                  className: 'w-[100px]',
                  render: (_, row) => (
                    <Button size="sm" onClick={() => openOverrideModal(row)}>
                      Resolve
                    </Button>
                  ),
                },
              ]}
              data={filteredItems}
              isLoading={loading}
              emptyText="No pending items found."
            />
          </CardContent>
        </Card>

        {/* Override Modal */}
        <Dialog
          open={overrideModalOpen}
          onOpenChange={(open) => {
            if (!open) {
              closeOverrideModal();
            }
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Resolve Pending Record</DialogTitle>
              <DialogDescription>
                Override the status of this {selectedItem?.entityType} record. This action is
                irreversible and will be logged.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleOverrideSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-status">New Status</Label>
                <Select
                  value={overrideForm.newStatus}
                  onValueChange={(value) =>
                    setOverrideForm((prev) => ({ ...prev, newStatus: value }))
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedItem &&
                      getAvailableStatuses(selectedItem.entityType).map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason (Required)</Label>
                <Textarea
                  id="reason"
                  value={overrideForm.reason}
                  onChange={(e) => setOverrideForm((prev) => ({ ...prev, reason: e.target.value }))}
                  placeholder="Explain why this record needs to be resolved..."
                  required
                  rows={3}
                />
              </div>

              {selectedItem && (
                <div className="rounded-md bg-muted p-3 text-sm">
                  <div className="mb-1 font-medium">Record Details:</div>
                  <div>Module: {selectedItem.entityType}</div>
                  <div>Patient: {selectedItem.patientName}</div>
                  <div>Current Status: {selectedItem.currentStatus}</div>
                </div>
              )}

              <DialogFooter className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={closeOverrideModal}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    overrideSubmitting || !overrideForm.newStatus || !overrideForm.reason.trim()
                  }
                >
                  {overrideSubmitting ? 'Resolving...' : 'Resolve Record'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  );
};

export default PendingItems;
