import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Download, TrendingUp, Users, DollarSign } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import analyticsService from '../services/analyticsService';
import logger from '@/utils/logger';
import { formatCurrencySync } from '@/utils/currency';

// Utility to get CSS variable value and convert oklch to hex if needed
const getCSSVariable = (varName, fallback) => {
  if (typeof window === 'undefined') {
    return fallback;
  }

  const root = document.documentElement;
  const value = getComputedStyle(root).getPropertyValue(varName).trim();

  if (!value) {
    return fallback;
  }

  // Handle oklch color format
  if (value.startsWith('oklch')) {
    // Create a temporary element to get the computed RGB value
    const tempEl = document.createElement('div');
    tempEl.style.color = value;
    tempEl.style.position = 'absolute';
    tempEl.style.visibility = 'hidden';
    document.body.appendChild(tempEl);
    const computedColor = getComputedStyle(tempEl).color;
    document.body.removeChild(tempEl);

    // Convert rgb(r, g, b) to hex
    const rgb = computedColor.match(/\d+/g);
    if (rgb && rgb.length === 3) {
      return (
        '#' +
        rgb
          .map((x) => {
            const hex = parseInt(x).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
          })
          .join('')
      );
    }
    return fallback;
  }

  return value;
};

// Get chart colors from CSS variables (Supabase theme)
// Using distinct colors from the theme for better variety
const getChartColors = () => {
  return [
    getCSSVariable('--chart-1', '#3ECF8E'), // Primary green
    getCSSVariable('--chart-2', '#6231BF'), // Purple/blue from chart-2
    getCSSVariable('--chart-3', '#9B2C9B'), // Purple from chart-3
    getCSSVariable('--chart-4', '#F59E0B'), // Orange/amber from chart-4
    getCSSVariable('--chart-5', '#10B981'), // Emerald green from chart-5
  ];
};

const getPrimaryColor = () => {
  return getCSSVariable('--primary', '#3ECF8E');
};

const AnalyticsDashboard = () => {
  // Get chart colors from CSS variables
  const COLORS = useMemo(() => getChartColors(), []);
  const primaryColor = useMemo(() => getPrimaryColor(), []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [dateRange, setDateRange] = useState('30'); // days
  const [exportMonth, setExportMonth] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });

  // Data states
  const [revenueTrends, setRevenueTrends] = useState([]);
  const [visitStatus, setVisitStatus] = useState([]);
  const [topDoctors, setTopDoctors] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);

  // Calculate date range
  const getDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(dateRange));
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
  };

  // Load analytics data
  const loadAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const { startDate, endDate } = getDateRange();

      const [revenueRes, visitRes, doctorsRes, paymentRes] = await Promise.all([
        analyticsService.getRevenueTrends({ startDate, endDate }),
        analyticsService.getVisitStatusBreakdown({ startDate, endDate }),
        analyticsService.getTopDoctors({ limit: 5, startDate, endDate }),
        analyticsService.getPaymentMethodsBreakdown({ startDate, endDate }),
      ]);

      // Handle both response formats: { success: true, data: [...] } or direct array
      const revenueData = Array.isArray(revenueRes) ? revenueRes : revenueRes?.data || [];
      const visitData = Array.isArray(visitRes) ? visitRes : visitRes?.data || [];
      const doctorsData = Array.isArray(doctorsRes) ? doctorsRes : doctorsRes?.data || [];
      const paymentData = Array.isArray(paymentRes) ? paymentRes : paymentRes?.data || [];

      setRevenueTrends(revenueData);
      setVisitStatus(visitData);
      setTopDoctors(doctorsData);
      setPaymentMethods(paymentData);

      // Log for debugging
      console.log('Analytics data loaded:', {
        revenueRes,
        visitRes,
        doctorsRes,
        paymentRes,
        revenueData: revenueData.length,
        visitData: visitData.length,
        doctorsData: doctorsData.length,
        paymentData: paymentData.length,
      });
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError(err.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  // Export DHIS2 CSV
  const handleExportCSV = async () => {
    if (exporting) {
      return;
    } // Prevent multiple clicks

    try {
      setExporting(true);
      setError('');

      logger.info('Starting CSV export', { year: exportMonth.year, month: exportMonth.month });

      const result = await analyticsService.exportDHIS2CSV({
        year: exportMonth.year,
        month: exportMonth.month,
      });

      // Log for debugging
      logger.debug('Export result:', result);

      // Handle both response formats: { success: true, data: {...} } or direct { data: {...} }
      const csvData = result?.data || result;

      if (!csvData || typeof csvData !== 'object') {
        throw new Error(
          'Invalid data format received from server. Expected an object with CSV data.'
        );
      }

      // Convert object to CSV format properly
      const headers = Object.keys(csvData);
      const values = headers.map((header) => {
        const value = csvData[header];
        // Escape commas and quotes in values, wrap in quotes if needed
        if (value === null || value === undefined) {
          return '';
        }
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      });

      const csvContent = [headers.join(','), values.join(',')].join('\n');

      // Create download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `DHIS2_Export_${exportMonth.year}_${String(exportMonth.month).padStart(2, '0')}.csv`
      );
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      logger.info('CSV export successful', { year: exportMonth.year, month: exportMonth.month });
    } catch (err) {
      logger.error('Failed to export CSV:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Unknown error occurred';
      setError(`Failed to export CSV: ${errorMessage}`);
      alert(`Failed to export CSV: ${errorMessage}`);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <PageLayout title="Analytics Dashboard" subtitle="System analytics and insights" fullWidth>
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Loading analytics...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Analytics Dashboard" subtitle="System analytics and insights" fullWidth>
      <div className="space-y-8 p-8">
        {error && (
          <div className="border-destructive/20 bg-destructive/10 rounded-lg border px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Date Range Selector */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Date Range</CardTitle>
                <CardDescription>Select the time period for analytics</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                </select>
                <Button onClick={loadAnalytics} variant="outline" size="sm">
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Section 1: Revenue Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Revenue Trends
            </CardTitle>
            <CardDescription>Daily revenue over the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            {revenueTrends.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                No revenue data available for the selected period
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getMonth() + 1}/${date.getDate()}`;
                    }}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [formatCurrencySync(value), 'Revenue']}
                    labelFormatter={(value) => `Date: ${value}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke={primaryColor}
                    strokeWidth={2}
                    name="Revenue"
                    dot={{ fill: primaryColor, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Section 2: Visit Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Visit Status Breakdown
            </CardTitle>
            <CardDescription>Distribution of visits by status</CardDescription>
          </CardHeader>
          <CardContent>
            {visitStatus.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                No visit data available for the selected period
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={visitStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status, count, percent }) =>
                      `${status}: ${count} (${(percent * 100).toFixed(0)}%)`
                    }
                    outerRadius={80}
                    fill={COLORS[0]}
                    dataKey="count"
                  >
                    {visitStatus.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length] || COLORS[0]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Section 3: Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Payment Methods
            </CardTitle>
            <CardDescription>Revenue breakdown by payment method</CardDescription>
          </CardHeader>
          <CardContent>
            {paymentMethods.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                No payment data available for the selected period
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={paymentMethods}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="method" />
                  <YAxis />
                  <Tooltip formatter={(value) => [formatCurrencySync(value), 'Amount']} />
                  <Legend />
                  <Bar dataKey="amount" name="Revenue">
                    {paymentMethods.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length] || COLORS[0]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Section 4: Top Doctors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Top 5 Doctors
            </CardTitle>
            <CardDescription>Doctors ranked by number of visits and revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="p-2 text-left">Doctor Name</th>
                    <th className="p-2 text-right">Visits</th>
                    <th className="p-2 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {topDoctors.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-4 text-center text-muted-foreground">
                        No data available
                      </td>
                    </tr>
                  ) : (
                    topDoctors.map((doctor) => (
                      <tr key={doctor.doctorId} className="border-b">
                        <td className="p-2">
                          <span className="font-medium">{doctor.doctorName}</span>
                        </td>
                        <td className="p-2 text-right">{doctor.visits}</td>
                        <td className="p-2 text-right">{formatCurrencySync(doctor.revenue)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* DHIS2 CSV Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              DHIS2 CSV Export
            </CardTitle>
            <CardDescription>Export monthly data in DHIS2 format</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Year:</label>
                <input
                  type="number"
                  value={exportMonth.year}
                  onChange={(e) =>
                    setExportMonth({ ...exportMonth, year: parseInt(e.target.value) })
                  }
                  className="w-24 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  min="2020"
                  max="2100"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Month:</label>
                <select
                  value={exportMonth.month}
                  onChange={(e) =>
                    setExportMonth({ ...exportMonth, month: parseInt(e.target.value) })
                  }
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <option key={month} value={month}>
                      {new Date(2000, month - 1).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
              <Button onClick={handleExportCSV} className="gap-2" disabled={exporting}>
                <Download className="h-4 w-4" />
                {exporting ? 'Exporting...' : 'Export CSV'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default AnalyticsDashboard;
