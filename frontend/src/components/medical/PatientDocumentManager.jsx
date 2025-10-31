import React from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Upload, Download, Eye, FileText, Calendar } from 'lucide-react';

const PatientDocumentManager = ({ 
  files = [], 
  onUploadFile,
  onViewFile,
  onDownloadFile,
  showUploadButton = true,
  className = ""
}) => {
  return (
    <div className="space-y-6">
      {/* Upload Section */}
      {showUploadButton && onUploadFile && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Upload size={24} className="text-blue-600" />
              <h3 className="text-lg font-bold">Upload New Files</h3>
            </div>
          </div>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
            <Upload size={32} className="mx-auto text-gray-400 mb-4" />
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Upload Patient Documents
            </h4>
            <p className="text-sm text-gray-500 mb-4">
              Drag and drop files here, or click to select files
            </p>
            <Button 
              size="sm" 
              className="text-sm px-4 py-2"
              onClick={onUploadFile}
            >
              <Upload size={16} className="mr-2" />
              Choose Files
            </Button>
          </div>
        </Card>
      )}
      
      {/* Existing Files */}
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center space-x-3 mb-6">
          <FileText size={24} className="text-green-600" />
          <h3 className="text-lg font-bold">Patient Documents</h3>
        </div>
        
        {files.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded flex items-center justify-center">
                    <FileText size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      <span className="capitalize">{file.type?.replace('_', ' ')}</span> • {file.size}
                    </p>
                    {file.uploadDate && (
                      <div className="flex items-center mt-1">
                        <Calendar size={12} className="text-gray-400 mr-1" />
                        <span className="text-xs text-gray-400">{file.uploadDate}</span>
                      </div>
                    )}
                    {file.uploadedBy && (
                      <p className="text-xs text-gray-400 mt-1">
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
                      className="text-xs px-3 py-1"
                      onClick={() => onViewFile(file)}
                    >
                      <Eye size={14} className="mr-1" />
                      View
                    </Button>
                  )}
                  {onDownloadFile && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs px-3 py-1"
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
          <div className="text-center py-8">
            <FileText size={32} className="mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500 text-sm">No documents available</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default PatientDocumentManager;
