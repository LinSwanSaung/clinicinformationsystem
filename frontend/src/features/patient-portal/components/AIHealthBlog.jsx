import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, RefreshCw, AlertCircle, Heart, PartyPopper } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import api from '@/services/api';
import logger from '@/utils/logger';

const TYPE_EMOJI = {
  'diagnosis-based': '🩺',
  wellness: '🌿',
  nutrition: '🥗',
  movement: '🏃',
  default: '✨',
};

const typeKey = (type) => {
  switch (type) {
    case 'diagnosis-based':
      return 'diagnosis';
    case 'nutrition':
      return 'nutrition';
    case 'movement':
      return 'movement';
    case 'wellness':
      return 'wellness';
    default:
      return 'default';
  }
};

const AIHealthBlog = ({ patientId, language }) => {
  const { t, i18n } = useTranslation();
  const activeLanguage = (language || i18n.language || 'en').toLowerCase();
  const locale = activeLanguage === 'my' ? 'my-MM' : undefined;

  const [healthAdvice, setHealthAdvice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHealthAdvice = useCallback(
    async (showRefreshing = false) => {
      if (!patientId) {
        return;
      }
      try {
        if (showRefreshing) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);

        logger.debug('[AIHealthBlog] Fetching health advice with language:', activeLanguage);
        const result = await api.get(`/ai/health-advice/${patientId}`, {
          params: { lang: activeLanguage },
        });
        logger.debug('[AIHealthBlog] Received health advice:', {
          type: result?.data?.type,
          hasContent: !!result?.data?.content,
        });

        if (!result?.success) {
          throw new Error(result?.message || 'Failed to fetch health advice');
        }

        setHealthAdvice(result.data);
      } catch (err) {
        setError(err.message || 'Unable to load health tips right now.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [patientId, activeLanguage]
  );

  useEffect(() => {
    if (patientId) {
      setHealthAdvice(null);
      fetchHealthAdvice(false);
    }
  }, [patientId, activeLanguage, fetchHealthAdvice]);

  const meta = useMemo(() => {
    if (!healthAdvice) {
      return {
        emoji: TYPE_EMOJI.default,
        label: t('patient.aiHealth.meta.default'),
      };
    }
    const key = typeKey(healthAdvice.type);
    return {
      emoji: TYPE_EMOJI[healthAdvice.type] || TYPE_EMOJI.default,
      label: t(`patient.aiHealth.meta.${key}`),
    };
  }, [healthAdvice, t]);

  const handleRefresh = () => fetchHealthAdvice(true);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="mb-4 flex items-center space-x-3">
          <Sparkles className="h-6 w-6 animate-pulse text-purple-500" />
          <h2 className="text-xl font-bold">{t('patient.aiHealth.title')}</h2>
        </div>
        <div className="space-y-3">
          <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-4 w-full animate-pulse rounded bg-muted" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
          <div className="h-4 w-full animate-pulse rounded bg-muted" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        </div>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {t('patient.aiHealth.loading')}
        </p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50 p-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="mt-1 h-6 w-6 flex-shrink-0 text-red-500" />
          <div className="flex-1">
            <h2 className="mb-2 text-xl font-bold text-red-900">
              {t('patient.aiHealth.errorTitle')}
            </h2>
            <p className="mb-4 text-red-700">{error}</p>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              {t('patient.aiHealth.errorCta')}
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (!healthAdvice) {
    return null;
  }

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 p-6 dark:border-purple-900/50 dark:from-purple-950/20 dark:to-blue-950/20">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900/30">
            <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
              {t('patient.aiHealth.title')}
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-1 text-xs font-semibold text-purple-700 dark:bg-purple-900/30 dark:text-purple-200">
                {meta.emoji} {meta.label}
              </span>
            </h2>
            {healthAdvice.type === 'diagnosis-based' && healthAdvice.diagnosis && (
              <p className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
                {t('patient.aiHealth.diagnosisPrefix')}{' '}
                <span className="font-semibold text-foreground">{healthAdvice.diagnosis}</span>
                {healthAdvice.diagnosedDate && (
                  <>
                    <span className="text-muted-foreground/50">•</span>
                    <span className="text-muted-foreground">
                      {new Date(healthAdvice.diagnosedDate).toLocaleDateString(locale)}
                    </span>
                  </>
                )}
              </p>
            )}
            {healthAdvice.type === 'wellness' && (
              <p className="flex items-center text-sm text-muted-foreground">
                <Heart className="mr-1 h-4 w-4 text-pink-500" />
                {meta.label}
              </p>
            )}
          </div>
        </div>
        <Button
          onClick={handleRefresh}
          variant="ghost"
          size="sm"
          disabled={refreshing}
          className="text-purple-600 hover:bg-purple-100 hover:text-purple-700 dark:text-purple-400 dark:hover:bg-purple-900/30 dark:hover:text-purple-300"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="prose prose-sm max-w-none">
        <div className="space-y-4 rounded-lg border border-purple-100 bg-card p-5 shadow-sm dark:border-purple-900/50">
          <div className="flex items-start gap-3">
            <PartyPopper className="mt-0.5 h-5 w-5 text-amber-500" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                {t('patient.aiHealth.introTitle')}
              </p>
              <p className="text-sm text-muted-foreground">{t('patient.aiHealth.introBody')}</p>
            </div>
          </div>

          <ReactMarkdown
            components={{
              h1: (props) => (
                <h1 className="mb-2 mt-4 text-lg font-bold text-foreground first:mt-0" {...props} />
              ),
              h2: (props) => (
                <h2 className="mb-2 mt-3 text-base font-semibold text-foreground" {...props} />
              ),
              h3: (props) => (
                <h3 className="mb-1 mt-2 text-sm font-semibold text-foreground" {...props} />
              ),
              p: (props) => (
                <p className="mb-2 text-sm leading-relaxed text-foreground" {...props} />
              ),
              ul: (props) => (
                <ul
                  className="mb-2 list-inside list-disc space-y-1 text-sm text-foreground"
                  {...props}
                />
              ),
              ol: (props) => (
                <ol
                  className="mb-2 list-inside list-decimal space-y-1 text-sm text-foreground"
                  {...props}
                />
              ),
              li: (props) => <li className="ml-2" {...props} />,
              strong: (props) => <strong className="font-semibold text-foreground" {...props} />,
              em: (props) => <em className="italic text-muted-foreground" {...props} />,
            }}
          >
            {healthAdvice.content}
          </ReactMarkdown>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-950/30">
        <p className="text-xs leading-relaxed text-yellow-800 dark:text-yellow-200">
          {t('patient.aiHealth.disclaimer')}
        </p>
      </div>

      {healthAdvice.generatedAt && (
        <p className="mt-3 text-right text-xs text-muted-foreground">
          {t('patient.aiHealth.generatedAt')}:{' '}
          {new Date(healthAdvice.generatedAt).toLocaleString(locale)}
        </p>
      )}
    </Card>
  );
};

export default AIHealthBlog;
