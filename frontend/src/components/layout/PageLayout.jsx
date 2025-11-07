import { motion } from 'framer-motion';
import Navbar from './Navbar';
import Breadcrumbs from './Breadcrumbs';

const PageLayout = ({ children, title, subtitle, fullWidth = false, customBreadcrumbs = null }) => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={`p-8 ${fullWidth ? 'mx-auto w-full max-w-[2000px]' : 'container mx-auto max-w-5xl'}`}
        >
          {customBreadcrumbs ? customBreadcrumbs : <Breadcrumbs />}

          {(title || subtitle) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="mb-8"
            >
              {title && <h1 className="mb-2 text-3xl font-bold text-foreground">{title}</h1>}
              {subtitle && <p className="text-lg text-muted-foreground">{subtitle}</p>}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className={`${fullWidth ? 'w-full' : 'mx-auto max-w-5xl'}`}
          >
            {children}
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
};

export default PageLayout;
