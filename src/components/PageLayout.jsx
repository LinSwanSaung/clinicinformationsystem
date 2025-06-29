import React from 'react';
import Navbar from '@/components/Navbar';

const PageLayout = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <main className="flex-1 py-6">
        <div className="container max-w-5xl mx-auto px-4">
          {(title || subtitle) && (
            <div className="mb-6 text-center">
              {title && <h1 className="text-2xl font-bold text-gray-900">{title}</h1>}
              {subtitle && <p className="text-gray-600">{subtitle}</p>}
            </div>
          )}
          
          <div className="flex flex-col items-center">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PageLayout;
