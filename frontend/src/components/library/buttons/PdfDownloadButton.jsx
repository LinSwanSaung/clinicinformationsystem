import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import api from '@/services/api';

/**
 * PdfDownloadButton
 * Small primitive to download a PDF via api.getBlob with loading state.
 * Props:
 * - endpoint: string (required)
 * - fileName: string (required)
 * - label?: string (default: 'Download')
 * - params?: object (optional query params)
 * - headers?: object (extra headers)
 * - size, variant, className: forwarded to Button
 * - icon?: React component (defaults to Download)
 */
export function PdfDownloadButton({
  endpoint,
  fileName,
  label = 'Download',
  params,
  headers,
  size = 'sm',
  variant = 'outline',
  className,
  icon: Icon = Download,
}) {
  const [downloading, setDownloading] = useState(false);

  const handleClick = async () => {
    if (!endpoint || !fileName) return;
    try {
      setDownloading(true);
      const blob = await api.getBlob(endpoint, {
        params,
        headers: { Accept: 'application/pdf', ...headers },
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to download PDF:', error);
      alert('Failed to download file. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Button onClick={handleClick} size={size} variant={variant} className={className} disabled={downloading}>
      <Icon className="mr-1 h-4 w-4" />
      {downloading ? 'Downloading…' : label}
    </Button>
  );
}

export default PdfDownloadButton;


