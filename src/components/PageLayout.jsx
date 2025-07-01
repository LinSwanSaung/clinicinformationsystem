import React from 'react';
import Navbar from '@/components/Navbar';

const PageLayout = ({ children, title, subtitle, fullWidth = false }) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        <div className={`p-8 ${fullWidth ? 'max-w-[2000px] w-full mx-auto' : 'container max-w-5xl mx-auto'}`}>
          {(title || subtitle) && (
            <div className="mb-8">
              {title && <h1 className="text-3xl font-bold text-foreground mb-2">{title}</h1>}
              {subtitle && <p className="text-lg text-muted-foreground">{subtitle}</p>}
            </div>
          )}
          
          <div className={`${fullWidth ? 'w-full' : 'max-w-5xl mx-auto'}`}>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PageLayout;
