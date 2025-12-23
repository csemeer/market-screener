import { useState, useRef } from 'react';
import { Upload, Download, FileText } from 'lucide-react';
import { csvAPI, ScreenerCriteria } from '../api/client';

interface CSVUploadDownloadProps {
  criteria?: ScreenerCriteria;
  results?: any[];
  onUploadResults?: (results: any[]) => void;
}

export default function CSVUploadDownload({ criteria, results, onUploadResults }: CSVUploadDownloadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setUploadError(null);

      const response = await csvAPI.uploadCSV(file, criteria);

      if (onUploadResults && response.data.results) {
        onUploadResults(response.data.results);
      }

      // Show success message
      alert(`Successfully analyzed ${response.data.count} stocks from ${response.data.uploadedCount} uploaded`);
    } catch (error: any) {
      console.error('CSV upload error:', error);
      setUploadError(error.response?.data?.error || 'Failed to upload CSV file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleExportCSV = async () => {
    if (!results || results.length === 0) {
      alert('No results to export');
      return;
    }

    try {
      const response = await csvAPI.exportCSV(results);

      // Create download link
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `screening-results-${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('CSV export error:', error);
      alert('Failed to export CSV file');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await csvAPI.downloadTemplate();

      // Create download link
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'stock-upload-template.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Template download error:', error);
      alert('Failed to download template');
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
        <FileText className="w-5 h-5 mr-2 text-blue-600" />
        CSV Import/Export
      </h3>

      <div className="space-y-3">
        {/* Upload Section */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
            id="csv-upload"
          />
          <label
            htmlFor="csv-upload"
            className={`flex items-center justify-center px-4 py-2 border border-blue-300 rounded-lg cursor-pointer transition-colors ${
              uploading
                ? 'bg-gray-200 cursor-not-allowed'
                : 'bg-white hover:bg-blue-50 hover:border-blue-400'
            }`}
          >
            <Upload className="w-4 h-4 mr-2 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">
              {uploading ? 'Uploading...' : 'Upload Stock List (CSV)'}
            </span>
          </label>
          {uploadError && (
            <p className="mt-1 text-xs text-red-600">{uploadError}</p>
          )}
          <p className="mt-1 text-xs text-gray-600">
            Upload CSV with columns: symbol, exchange
          </p>
        </div>

        {/* Download Template */}
        <button
          onClick={handleDownloadTemplate}
          className="flex items-center justify-center w-full px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
        >
          <Download className="w-4 h-4 mr-2 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Download CSV Template</span>
        </button>

        {/* Export Results */}
        {results && results.length > 0 && (
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center w-full px-4 py-2 bg-green-600 border border-green-700 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2 text-white" />
            <span className="text-sm font-medium text-white">
              Export Results ({results.length} stocks)
            </span>
          </button>
        )}
      </div>

      {/* Info */}
      <div className="mt-3 p-3 bg-blue-100 rounded-lg">
        <p className="text-xs text-blue-900 leading-relaxed">
          <strong>How to use:</strong><br />
          1. Download the CSV template<br />
          2. Add your stock symbols and exchanges<br />
          3. Upload the CSV to analyze<br />
          4. Export results to CSV for further analysis
        </p>
      </div>
    </div>
  );
}
