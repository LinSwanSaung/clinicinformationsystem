import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Download, Eye, FileText, Calendar } from 'lucide-react';

const PatientDocumentManager = ({
  files = [],
  onUploadFile,
  onViewFile,
  onDownloadFile,
  showUploadButton = true,
  className = '',
  renderDownloadButton,
}) => {
  return (
    <div className="space-y-6">
      {/* Upload Section */}
      {showUploadButton && onUploadFile && (
        <Card className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Upload size={24} className="text-blue-600" />
              <h3 className="text-lg font-bold">Upload New Files</h3>
            </div>
          </div>

          <div className="hover:border-primary/50 rounded-lg border-2 border-dashed border-border p-8 text-center transition-colors">
            <Upload size={32} className="mx-auto mb-4 text-muted-foreground" />
            <h4 className="mb-2 text-sm font-medium text-foreground">Upload Patient Documents</h4>
            <p className="mb-4 text-sm text-muted-foreground">
              Drag and drop files here, or click to select files
            </p>
            <Button size="sm" className="px-4 py-2 text-sm" onClick={onUploadFile}>
              <Upload size={16} className="mr-2" />
              Choose Files
            </Button>
          </div>
        </Card>
      )}

      {/* Existing Files */}
      <Card className={`p-6 ${className}`}>
        <div className="mb-6 flex items-center space-x-3">
          <FileText size={24} className="text-green-600" />
          <h3 className="text-lg font-bold">Patient Documents</h3>
        </div>

        {files.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="bg-muted/50 flex items-center justify-between rounded-lg border p-4 transition-shadow hover:shadow-md"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded bg-blue-100 dark:bg-blue-900/30">
                    <FileText size={20} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      <span className="capitalize">{file.type?.replace('_', ' ')}</span> •{' '}
                      {file.size}
                    </p>
                    {file.uploadDate && (
                      <div className="mt-1 flex items-center">
                        <Calendar size={12} className="mr-1 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{file.uploadDate}</span>
                      </div>
                    )}
                    {file.uploadedBy && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Uploaded by: {file.uploadedBy}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  {onViewFile && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="px-3 py-1 text-xs"
                      onClick={() => onViewFile(file)}
                    >
                      <Eye size={14} className="mr-1" />
                      View
                    </Button>
                  )}
                  {renderDownloadButton
                    ? renderDownloadButton(file)
                    : onDownloadFile && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="px-3 py-1 text-xs"
                          onClick={() => onDownloadFile(file)}
                        >
                          <Download size={14} className="mr-1" />
                          Download
                        </Button>
                      )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <FileText size={32} className="mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No documents available</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default PatientDocumentManager;
