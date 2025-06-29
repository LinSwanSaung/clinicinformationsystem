import React from 'react';
import Navbar from '@/components/Navbar';

const PageLayout = ({ children, title, subtitle, fullWidth = false }) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 py-8">
        <div className={`mx-auto px-6 ${fullWidth ? 'container-fluid w-full' : 'container max-w-5xl'}`}>
          {(title || subtitle) && (
            <div className="mb-8">
              {title && <h1 className={`${fullWidth ? 'text-4xl' : 'text-2xl'} font-bold text-foreground mb-2`}>{title}</h1>}
              {subtitle && <p className={`${fullWidth ? 'text-xl' : 'text-base'} text-muted-foreground`}>{subtitle}</p>}
            </div>
          )}
          
          <div className={`${fullWidth ? '' : 'flex flex-col items-center'}`}>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PageLayout;
