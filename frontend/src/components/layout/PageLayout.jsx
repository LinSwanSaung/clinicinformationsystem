import React from 'react';
import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Breadcrumbs from './Breadcrumbs';

const PageLayout = ({ children, title, subtitle, fullWidth = false, customBreadcrumbs = null }) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={`p-8 ${fullWidth ? 'max-w-[2000px] w-full mx-auto' : 'container max-w-5xl mx-auto'}`}
        >
          {customBreadcrumbs ? customBreadcrumbs : <Breadcrumbs />}
          
          {(title || subtitle) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="mb-8"
            >
              {title && <h1 className="text-3xl font-bold text-foreground mb-2">{title}</h1>}
              {subtitle && <p className="text-lg text-muted-foreground">{subtitle}</p>}
            </motion.div>
          )}
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className={`${fullWidth ? 'w-full' : 'max-w-5xl mx-auto'}`}
          >
            {children}
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
};

export default PageLayout;
