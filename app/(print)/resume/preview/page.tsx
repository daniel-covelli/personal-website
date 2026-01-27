'use client';

import { useState } from 'react';

export default function PreviewPage() {
  const [refreshKey, setRefreshKey] = useState(Date.now());

  const handleRefresh = () => {
    setRefreshKey(Date.now());
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h1 className="text-sm font-medium text-gray-700">Resume PDF Preview</h1>
        <button
          onClick={handleRefresh}
          className="px-3 py-1.5 text-sm font-medium text-white bg-sky-600 rounded hover:bg-sky-700 transition-colors"
        >
          Refresh PDF
        </button>
      </div>
      <div className="flex-1">
        <iframe
          key={refreshKey}
          src={`/api/pdf?preview=1&t=${refreshKey}`}
          className="w-full h-full"
          style={{ minHeight: 'calc(100vh - 57px)' }}
        />
      </div>
    </div>
  );
}
