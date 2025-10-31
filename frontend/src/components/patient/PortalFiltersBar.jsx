import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue
} from '@/components/ui/select';

const PortalFiltersBar = ({ filters, onChange, onClear, t }) => {
  const handleTypeChange = (value) => {
    onChange({ ...filters, type: value });
  };

  const handleDateChange = (field, value) => {
    onChange({ ...filters, [field]: value });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="mt-6 rounded-xl border border-border/70 bg-muted/40 p-4 shadow-inner"
      role="region"
      aria-label={t('filters.ariaLabel')}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 flex-1">
          <div className="flex flex-col gap-1">
            <label htmlFor="filter-from" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t('filters.from')}
            </label>
            <Input
              id="filter-from"
              type="date"
              value={filters.from}
              onChange={(event) => handleDateChange('from', event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="filter-to" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t('filters.to')}
            </label>
            <Input
              id="filter-to"
              type="date"
              value={filters.to}
              onChange={(event) => handleDateChange('to', event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t('filters.type')}
            </span>
            <Select value={filters.type} onValueChange={handleTypeChange}>
              <SelectTrigger className="capitalize" aria-label={t('filters.type')}>
                <SelectValue placeholder={t('filters.typePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.types.all')}</SelectItem>
                <SelectItem value="visits">{t('filters.types.visits')}</SelectItem>
                <SelectItem value="medications">{t('filters.types.medications')}</SelectItem>
                <SelectItem value="articles">{t('filters.types.articles')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClear}>
            {t('filters.clear')}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default PortalFiltersBar;
