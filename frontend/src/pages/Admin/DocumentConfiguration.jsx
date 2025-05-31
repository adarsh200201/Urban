import React from 'react';
import DocumentConfigPanel from '../../components/Admin/DocumentConfigPanel';

const DocumentConfiguration = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Driver Document Requirements</h1>
        <p className="text-gray-600">Configure which documents drivers need to submit during registration.</p>
      </div>
      
      <DocumentConfigPanel />
    </div>
  );
};

export default DocumentConfiguration;
