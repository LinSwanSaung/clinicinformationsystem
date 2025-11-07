import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

const PortalSearchBar = ({ initialQuery = '', onSubmit, t }) => {
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(query.trim());
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="mx-auto flex w-full max-w-2xl items-center gap-2 rounded-full border border-border/70 bg-background px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
      role="search"
      aria-label={t('search.ariaLabel')}
    >
      <Search className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t('search.placeholder')}
        className="border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
        aria-label={t('search.inputAria')}
      />
      <Button type="submit" variant="default" className="whitespace-nowrap">
        {t('search.submit')}
      </Button>
    </motion.form>
  );
};

export default PortalSearchBar;
