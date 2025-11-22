import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Settings, Upload, Image as ImageIcon, Save } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import clinicSettingsService from '@/services/clinicSettingsService';
import { useFeedback } from '@/contexts/FeedbackContext';
import { clearCurrencyCache } from '@/utils/currency';
import logger from '@/utils/logger';

const ClinicSettings = () => {
  const { showSuccess, showError } = useFeedback();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingQRCode, setUploadingQRCode] = useState(false);
  const [settings, setSettings] = useState({
    clinic_name: '',
    clinic_logo_url: '',
    clinic_phone: '',
    clinic_email: '',
    clinic_address: '',
    late_threshold_minutes: 7,
    consult_expected_minutes: 15,
    currency_code: 'USD',
    currency_symbol: '$',
    payment_qr_code_url: '',
  });
  const [logoPreview, setLogoPreview] = useState('');
  const [qrCodePreview, setQrCodePreview] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const result = await clinicSettingsService.getSettings();
      if (result.success && result.data) {
        const data = result.data.data || result.data;
        setSettings({
          clinic_name: data.clinic_name || '',
          clinic_logo_url: data.clinic_logo_url || '',
          clinic_phone: data.clinic_phone || '',
          clinic_email: data.clinic_email || '',
          clinic_address: data.clinic_address || '',
          late_threshold_minutes: data.late_threshold_minutes || 7,
          consult_expected_minutes: data.consult_expected_minutes || 15,
          currency_code: data.currency_code || 'USD',
          currency_symbol: data.currency_symbol || '$',
          payment_qr_code_url: data.payment_qr_code_url || '',
        });
        if (data.clinic_logo_url) {
          setLogoPreview(data.clinic_logo_url);
        }
        if (data.payment_qr_code_url) {
          setQrCodePreview(data.payment_qr_code_url);
        }
      }
    } catch (error) {
      logger.error('Failed to load clinic settings:', error);
      showError('Failed to load clinic settings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLogoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showError('Invalid file type. Please upload an image (JPEG, PNG, GIF, or WebP).');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError('File size too large. Please upload an image smaller than 5MB.');
      return;
    }

    try {
      setUploadingLogo(true);
      const result = await clinicSettingsService.uploadLogo(file);
      if (result.success && result.data) {
        const publicUrl = result.data.data?.publicUrl || result.data.publicUrl;
        setSettings((prev) => ({
          ...prev,
          clinic_logo_url: publicUrl,
        }));
        setLogoPreview(publicUrl);
        showSuccess('Logo uploaded successfully');
      } else {
        showError(result.error || 'Failed to upload logo');
      }
    } catch (error) {
      logger.error('Error uploading logo:', error);
      showError('Failed to upload logo. Please try again.');
    } finally {
      setUploadingLogo(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleQRCodeUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showError('Invalid file type. Please upload an image (JPEG, PNG, GIF, or WebP).');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError('File size too large. Please upload an image smaller than 5MB.');
      return;
    }

    try {
      setUploadingQRCode(true);
      const result = await clinicSettingsService.uploadQRCode(file);
      if (result.success && result.data) {
        const publicUrl = result.data.data?.publicUrl || result.data.publicUrl;
        setSettings((prev) => ({
          ...prev,
          payment_qr_code_url: publicUrl,
        }));
        setQrCodePreview(publicUrl);
        showSuccess('QR code uploaded successfully');
      } else {
        showError(result.error || 'Failed to upload QR code');
      }
    } catch (error) {
      logger.error('Error uploading QR code:', error);
      showError('Failed to upload QR code. Please try again.');
    } finally {
      setUploadingQRCode(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const result = await clinicSettingsService.updateSettings(settings);
      if (result.success) {
        // Clear currency cache so new settings are used immediately
        clearCurrencyCache();
        showSuccess('Clinic settings updated successfully');
      } else {
        showError(result.error || 'Failed to update settings');
      }
    } catch (error) {
      logger.error('Error updating clinic settings:', error);
      showError('Failed to update settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageLayout title="Clinic Settings" subtitle="Configure clinic information and operational settings">
        <div className="flex items-center justify-center p-8">
          <div className="text-muted-foreground">Loading settings...</div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Clinic Settings" subtitle="Configure clinic information and operational settings">
      <div className="space-y-6 p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Clinic Information Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Clinic Information
              </CardTitle>
              <CardDescription>Basic information about your clinic</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Clinic Name */}
              <div className="space-y-2">
                <Label htmlFor="clinic_name">Clinic Name</Label>
                <Input
                  id="clinic_name"
                  type="text"
                  placeholder="Enter clinic name"
                  value={settings.clinic_name}
                  onChange={(e) => handleInputChange('clinic_name', e.target.value)}
                  maxLength={200}
                />
              </div>

              {/* Logo Upload */}
              <div className="space-y-2">
                <Label htmlFor="clinic_logo">Clinic Logo</Label>
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Input
                        id="clinic_logo"
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={handleLogoUpload}
                        disabled={uploadingLogo}
                        className="cursor-pointer"
                      />
                      {uploadingLogo && (
                        <span className="text-sm text-muted-foreground">Uploading...</span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Upload a logo image (JPEG, PNG, GIF, or WebP). Max size: 5MB
                    </p>
                  </div>
                  {logoPreview && (
                    <div className="flex-shrink-0">
                      <div className="relative h-20 w-20 overflow-hidden rounded-lg border-2 border-gray-300 bg-gray-50">
                        <img
                          src={logoPreview}
                          alt="Clinic logo preview"
                          className="h-full w-full object-contain"
                          onError={() => {
                            setLogoPreview('');
                            showError('Failed to load logo image');
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="clinic_phone">Phone Number</Label>
                <Input
                  id="clinic_phone"
                  type="tel"
                  placeholder="Enter phone number"
                  value={settings.clinic_phone}
                  onChange={(e) => handleInputChange('clinic_phone', e.target.value)}
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="clinic_email">Email Address</Label>
                <Input
                  id="clinic_email"
                  type="email"
                  placeholder="Enter email address"
                  value={settings.clinic_email}
                  onChange={(e) => handleInputChange('clinic_email', e.target.value)}
                />
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="clinic_address">Address</Label>
                <Textarea
                  id="clinic_address"
                  placeholder="Enter clinic address"
                  value={settings.clinic_address}
                  onChange={(e) => handleInputChange('clinic_address', e.target.value)}
                  rows={3}
                />
              </div>

              {/* Payment QR Code Upload */}
              <div className="space-y-2">
                <Label htmlFor="payment_qr_code">Payment QR Code</Label>
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Input
                        id="payment_qr_code"
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={handleQRCodeUpload}
                        disabled={uploadingQRCode}
                        className="cursor-pointer"
                      />
                      {uploadingQRCode && (
                        <span className="text-sm text-muted-foreground">Uploading...</span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Upload QR code image for online payments (JPEG, PNG, GIF, or WebP). Max size: 5MB
                    </p>
                  </div>
                  {qrCodePreview && (
                    <div className="flex-shrink-0">
                      <div className="relative h-20 w-20 overflow-hidden rounded-lg border-2 border-gray-300 bg-gray-50">
                        <img
                          src={qrCodePreview}
                          alt="QR code preview"
                          className="h-full w-full object-contain"
                          onError={() => {
                            setQrCodePreview('');
                            showError('Failed to load QR code image');
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Operational Settings Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Operational Settings
              </CardTitle>
              <CardDescription>Configure queue and consultation parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Consultation Duration */}
              <div className="space-y-2">
                <Label htmlFor="consult_expected_minutes">
                  Expected Consultation Duration (minutes)
                </Label>
                <Input
                  id="consult_expected_minutes"
                  type="number"
                  min="5"
                  max="60"
                  placeholder="15"
                  value={settings.consult_expected_minutes}
                  onChange={(e) =>
                    handleInputChange('consult_expected_minutes', parseInt(e.target.value) || 15)
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Expected duration for a consultation (5-60 minutes)
                </p>
              </div>

              {/* Late Threshold */}
              <div className="space-y-2">
                <Label htmlFor="late_threshold_minutes">Late Threshold (minutes)</Label>
                <Input
                  id="late_threshold_minutes"
                  type="number"
                  min="1"
                  max="30"
                  placeholder="7"
                  value={settings.late_threshold_minutes}
                  onChange={(e) =>
                    handleInputChange('late_threshold_minutes', parseInt(e.target.value) || 7)
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Minutes before a patient is marked as late (1-30 minutes)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Currency Settings Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Currency Settings
              </CardTitle>
              <CardDescription>Configure the currency used for billing and invoices</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Currency Code */}
              <div className="space-y-2">
                <Label htmlFor="currency_code">Currency Code (ISO)</Label>
                <Input
                  id="currency_code"
                  type="text"
                  placeholder="USD, MMK, etc."
                  value={settings.currency_code}
                  onChange={(e) => handleInputChange('currency_code', e.target.value.toUpperCase())}
                  maxLength={3}
                />
                <p className="text-xs text-muted-foreground">
                  ISO 4217 currency code (e.g., USD, MMK, EUR)
                </p>
              </div>

              {/* Currency Symbol */}
              <div className="space-y-2">
                <Label htmlFor="currency_symbol">Currency Symbol</Label>
                <Input
                  id="currency_symbol"
                  type="text"
                  placeholder="$"
                  value={settings.currency_symbol}
                  onChange={(e) => handleInputChange('currency_symbol', e.target.value)}
                  maxLength={10}
                />
                <p className="text-xs text-muted-foreground">
                  Symbol to display before amounts (e.g., $, K, €)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={loadSettings}
              disabled={saving || uploadingLogo}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving || uploadingLogo}>
              {saving ? (
                <>
                  <span className="mr-2">Saving...</span>
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </PageLayout>
  );
};

export default ClinicSettings;

