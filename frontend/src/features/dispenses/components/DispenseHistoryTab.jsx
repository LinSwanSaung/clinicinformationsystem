import { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchBar, LoadingSpinner } from '@/components/library';
import DataTable from '@/components/library/DataTable/DataTable';
import { useDispenses } from '../hooks/useDispenses';
import dispenseService from '../services/dispenseService';

function toISOStartOfDay(dateStr) {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function toISOEndOfDay(dateStr) {
  const d = new Date(dateStr);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

export default function DispenseHistoryTab() {
  const today = useMemo(() => new Date(), []);
  const [fromDate, setFromDate] = useState(() => today.toISOString().slice(0, 10));
  const [toDate, setToDate] = useState(() => today.toISOString().slice(0, 10));
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [sort, setSort] = useState({ key: 'dispensedAt', direction: 'desc' });
  const [exporting, setExporting] = useState(false);

  const params = {
    from: toISOStartOfDay(fromDate),
    to: toISOEndOfDay(toDate),
    search: search || undefined,
    page,
    pageSize,
    sortBy: sort.key,
    sortDir: sort.direction,
  };

  const { data, isLoading, error, refetch } = useDispenses(params);

  const columns = [
    { key: 'dispensedAt', label: 'Time', render: (v) => (v ? new Date(v).toLocaleString() : '-') },
    { key: 'medicineName', label: 'Medicine' },
    { key: 'patientName', label: 'Patient' },
    { key: 'quantity', label: 'Qty' },
    {
      key: 'dispensedBy',
      label: 'Dispensed By',
      render: (_, row) => row.dispensedBy?.name || '-',
    },
    { key: 'totalPrice', label: 'Amount', render: (v) => (v != null ? Number(v).toFixed(2) : '0.00') },
  ];

  const onExport = async () => {
    try {
      setExporting(true);
      const blob = await dispenseService.exportCsv({
        from: params.from,
        to: params.to,
        search: params.search,
        sortBy: params.sortBy,
        sortDir: params.sortDir,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dispenses_${fromDate}_${toDate}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const toolbar = (
    <div className="w-full flex flex-col gap-3 md:flex-row md:items-center">
      <div className="flex-1 min-w-[200px]">
        <SearchBar
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search medicine name..."
          variant="flat"
        />
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">From</label>
          <Input
            type="date"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">To</label>
          <Input
            type="date"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
          Refresh
        </Button>
        <Button onClick={onExport} disabled={exporting || isLoading}>
          {exporting ? 'Exporting…' : 'Export CSV'}
        </Button>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dispense History</CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-sm text-red-600">Failed to load data</div>
        ) : isLoading && !data?.items?.length ? (
          <div className="py-12">
            <LoadingSpinner label="Loading dispenses..." />
          </div>
        ) : (
          <div>
            <div className="mb-3 text-sm text-muted-foreground">
              Total records: {data.total} • Total units: {data.summary?.totalUnits || 0}
            </div>
            <DataTable
              columns={columns}
              data={data.items || []}
              isLoading={isLoading}
              emptyText="No dispenses found for selected range"
              page={page}
              pageSize={pageSize}
              total={data.total}
              onPageChange={setPage}
              onSortChange={(cfg) => setSort({ key: cfg.key, direction: cfg.direction })}
              toolbarSlot={toolbar}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}


