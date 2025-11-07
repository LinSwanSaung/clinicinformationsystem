import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Pill, BookOpen, Stethoscope } from 'lucide-react';

const typeConfig = {
  visits: {
    labelKey: 'search.results.visit',
    icon: Stethoscope,
    badgeClass: 'bg-blue-100 text-blue-800',
  },
  medications: {
    labelKey: 'search.results.medication',
    icon: Pill,
    badgeClass: 'bg-emerald-100 text-emerald-800',
  },
  articles: {
    labelKey: 'search.results.article',
    icon: BookOpen,
    badgeClass: 'bg-purple-100 text-purple-800',
  },
};

const PortalSearchResults = ({ results, isActive, t }) => {
  if (!isActive) {
    return null;
  }

  const hasResults = Array.isArray(results) && results.length > 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="mt-8 space-y-4"
      aria-live="polite"
    >
      <header>
        <h2 className="text-lg font-semibold text-foreground">
          {t('search.resultsTitle', { count: results.length })}
        </h2>
        <p className="text-sm text-muted-foreground">{t('search.resultsSubtitle')}</p>
      </header>
      {hasResults ? (
        <ul className="grid gap-4 md:grid-cols-2">
          <AnimatePresence>
            {results.map((item) => {
              const config = typeConfig[item.type] ?? typeConfig.visits;
              const Icon = config.icon;
              return (
                <motion.li
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="border-border/70 h-full border shadow-sm transition-shadow focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 hover:shadow-md">
                    <CardContent className="flex h-full flex-col gap-3 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <Badge
                          className={`${config.badgeClass} flex items-center gap-1`}
                          variant="secondary"
                        >
                          <Icon className="h-3 w-3" aria-hidden="true" />
                          <span>{t(config.labelKey)}</span>
                        </Badge>
                        {item.date && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" aria-hidden="true" />
                            {new Date(item.date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
                        {item.description && (
                          <p className="line-clamp-3 text-sm text-muted-foreground">
                            {item.description}
                          </p>
                        )}
                        {item.meta && (
                          <p className="text-muted-foreground/80 font-mono text-xs">{item.meta}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        className="mt-auto rounded text-sm font-medium text-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                      >
                        {t('search.viewDetails')}
                      </button>
                    </CardContent>
                  </Card>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      ) : (
        <div className="border-muted-foreground/30 bg-muted/10 rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          {t('search.noResults')}
        </div>
      )}
    </motion.section>
  );
};

export default PortalSearchResults;
