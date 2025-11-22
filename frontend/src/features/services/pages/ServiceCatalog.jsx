import { useMemo, useState } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  SearchBar,
  LoadingSpinner,
  EmptyState,
  FormModal,
  ConfirmDialog,
} from '@/components/library';
import DataTable from '@/components/library/DataTable/DataTable';
import { useServices, useServiceMutations } from '../hooks/useServices';

const CATEGORIES = [
  { value: 'consultation', label: 'Consultation' },
  { value: 'procedure', label: 'Procedure' },
  { value: 'laboratory', label: 'Laboratory' },
  { value: 'imaging', label: 'Imaging' },
  { value: 'pharmacy', label: 'Pharmacy' },
  { value: 'other', label: 'Other' },
];

export default function ServiceCatalog() {
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('active'); // active | inactive | all
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const { data, isLoading, error } = useServices({ q, category: category || undefined, status });
  const { create, update, remove } = useServiceMutations();

  const filtered = useMemo(() => {
    if (!data) return [];
    let rows = data;
    if (category) {
      rows = rows.filter((r) => r.category === category);
    }
    return rows;
  }, [data]);

  const columns = [
    { key: 'service_code', label: 'Code' },
    { key: 'service_name', label: 'Service' },
    { key: 'category', label: 'Category' },
    {
      key: 'default_price',
      label: 'Default Price',
      render: (v) => (v != null ? Number(v).toFixed(2) : '0.00'),
    },
    {
      key: 'is_active',
      label: 'Active',
      render: (v) => (v ? 'Yes' : 'No'),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelected(row);
              setEditOpen(true);
            }}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant={row.is_active ? 'destructive' : 'default'}
            onClick={() => {
              setSelected(row);
              setConfirmOpen(true);
            }}
          >
            {row.is_active ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      ),
    },
  ];

  const handleCreate = async (values) => {
    await create.mutateAsync(values);
    setCreateOpen(false);
  };

  const handleUpdate = async (values) => {
    await update.mutateAsync({ id: selected.id, updates: values });
    setEditOpen(false);
    setSelected(null);
  };

  const handleToggleActive = async () => {
    if (!selected) return;
    await update.mutateAsync({ id: selected.id, updates: { is_active: !selected.is_active } });
    setConfirmOpen(false);
    setSelected(null);
  };

  const [createCategory, setCreateCategory] = useState('');
  const createForm = (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="service_code">Code</Label>
          <Input id="service_code" name="service_code" required placeholder="e.g., CONS001" />
        </div>
        <div>
          <Label htmlFor="service_name">Service Name</Label>
          <Input
            id="service_name"
            name="service_name"
            required
            placeholder="e.g., General Consultation"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label>Category</Label>
          <Select value={createCategory} onValueChange={setCreateCategory} required>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input type="hidden" name="category" value={createCategory} required />
        </div>
        <div>
          <Label htmlFor="default_price">Default Price</Label>
          <Input
            id="default_price"
            name="default_price"
            type="number"
            min="0"
            step="0.01"
            required
          />
        </div>
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Input id="description" name="description" placeholder="Optional" />
      </div>
      <div className="flex items-center gap-2">
        <input id="is_active" name="is_active" type="checkbox" defaultChecked />
        <Label htmlFor="is_active">Active</Label>
      </div>
    </div>
  );

  const [editCategory, setEditCategory] = useState('');
  const editForm = selected && (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="service_name">Service Name</Label>
          <Input
            id="service_name"
            name="service_name"
            defaultValue={selected.service_name}
            required
          />
        </div>
        <div>
          <Label>Category</Label>
          <Select
            value={editCategory || selected.category}
            onValueChange={setEditCategory}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input type="hidden" name="category" value={editCategory || selected.category} required />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="default_price">Default Price</Label>
          <Input
            id="default_price"
            name="default_price"
            type="number"
            min="0"
            step="0.01"
            defaultValue={selected.default_price}
            required
          />
        </div>
        <div>
          <Label htmlFor="service_code">Code</Label>
          <Input id="service_code" name="service_code" defaultValue={selected.service_code} />
        </div>
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Input id="description" name="description" defaultValue={selected.description || ''} />
      </div>
      <div className="flex items-center gap-2">
        <input
          id="is_active"
          name="is_active"
          type="checkbox"
          defaultChecked={!!selected.is_active}
        />
        <Label htmlFor="is_active">Active</Label>
      </div>
    </div>
  );

  const toolbar = (
    <div className="flex flex-col gap-3 md:flex-row md:items-center">
      <div className="flex-1">
        <SearchBar
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder="Search by name or code"
          variant="flat"
          inputProps={{
            onKeyDown: (e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
              }
            },
          }}
        />
      </div>
      <div className="flex items-center gap-3">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
        <Select value={category} onValueChange={(v) => setCategory(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => setCreateOpen(true)}>New Service</Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <PageLayout title="Services" subtitle="Manage billable services" fullWidth>
        <div className="space-y-6 p-8">
          <Card>
            <CardHeader>
              <CardTitle>Service Catalog</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Always show toolbar so search/filters are available even when empty */}
              <div className="mb-4">{toolbar}</div>
              {error ? (
                <div className="py-12 text-sm text-red-600">Failed to load services</div>
              ) : isLoading ? (
                <div className="py-12">
                  <LoadingSpinner label="Loading services..." />
                </div>
              ) : filtered.length === 0 ? (
                <EmptyState
                  title={status === 'inactive' ? 'No inactive services' : 'No services'}
                  description={
                    status === 'inactive'
                      ? 'There are no inactive services. Change filters or search to try again.'
                      : 'Create your first service to get started.'
                  }
                />
              ) : (
                <DataTable
                  columns={columns}
                  data={filtered}
                  isLoading={create.isPending || update.isPending || remove.isPending}
                  page={page}
                  pageSize={pageSize}
                  onPageChange={setPage}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </PageLayout>

      {/* Create modal */}
      <FormModal
        isOpen={createOpen}
        onOpenChange={setCreateOpen}
        title="New Service"
        description="Add a ready-made service for doctors to select."
        onSubmit={async (e) => {
          const formEl =
            e?.currentTarget?.form || e?.target?.form || document.querySelector('form');
          if (!formEl) return;
          if (typeof formEl.reportValidity === 'function' && !formEl.reportValidity()) {
            return;
          }
          const fd = new FormData(formEl);
          const payload = {
            service_code: String(fd.get('service_code') || '').trim(),
            service_name: String(fd.get('service_name') || '').trim(),
            category: String(fd.get('category') || '').trim(),
            default_price: Number(fd.get('default_price') || 0),
            description: String(fd.get('description') || '').trim(),
            is_active: fd.get('is_active') ? true : false,
          };
          await handleCreate(payload);
          setCreateCategory('');
        }}
        submitText="Create"
        isLoading={create.isPending}
      >
        {createForm}
      </FormModal>

      {/* Edit modal */}
      <FormModal
        isOpen={editOpen}
        onOpenChange={(v) => {
          setEditOpen(v);
          if (!v) setSelected(null);
        }}
        title="Edit Service"
        description="Update service details."
        onSubmit={async (e) => {
          const formEl =
            e?.currentTarget?.form || e?.target?.form || document.querySelector('form');
          if (!formEl) return;
          if (typeof formEl.reportValidity === 'function' && !formEl.reportValidity()) {
            return;
          }
          const fd = new FormData(formEl);
          const updates = {
            service_code: String(fd.get('service_code') || '').trim(),
            service_name: String(fd.get('service_name') || '').trim(),
            category: String(fd.get('category') || '').trim(),
            default_price: Number(fd.get('default_price') || 0),
            description: String(fd.get('description') || '').trim(),
            is_active: fd.get('is_active') ? true : false,
          };
          await handleUpdate(updates);
        }}
        submitText="Save"
        isLoading={update.isPending}
      >
        {editForm}
      </FormModal>

      {/* Toggle active confirm */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onOpenChange={(v) => {
          setConfirmOpen(v);
          if (!v) setSelected(null);
        }}
        title={selected?.is_active ? 'Deactivate Service' : 'Activate Service'}
        description={
          selected?.is_active
            ? `This will hide "${selected?.service_name}" from selection.`
            : `This will make "${selected?.service_name}" available for selection.`
        }
        confirmText={selected?.is_active ? 'Deactivate' : 'Activate'}
        variant={selected?.is_active ? 'destructive' : 'default'}
        onConfirm={handleToggleActive}
        isLoading={update.isPending}
      />
    </div>
  );
}
