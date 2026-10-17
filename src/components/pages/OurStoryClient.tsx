'use client';

import { useI18n } from '@/context/I18nContext';
import { Sparkles, Crown, Globe as Globe2, Rocket, Shield, Heart, Gem } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContentData {
  title_en: string;
  title_ar: string;
  body_en: string;
  body_ar: string;
}

const milestones = [
  { icon: Sparkles, key: 'milestone1' },
  { icon: Crown, key: 'milestone2' },
  { icon: Globe2, key: 'milestone3' },
  { icon: Rocket, key: 'milestone4' },
];

const values = [
  { icon: Gem, key: 'value1' },
  { icon: Heart, key: 'value2' },
  { icon: Shield, key: 'value3' },
];

export function OurStoryClient({ content }: { content: ContentData | null }) {
  const { t, locale, dir } = useI18n();
  const isAr = locale === 'ar';
  const title = content ? (isAr ? content.title_ar : content.title_en) : t('story.title');
  const body = content ? (isAr ? content.body_ar : content.body_en) : '';

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-16">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold/10 mb-6">
          <Crown className="w-8 h-8 text-gold" />
        </div>
        <h1 className="font-heading text-4xl sm:text-5xl font-bold text-text mb-4">{title}</h1>
        <p className="text-lg text-muted max-w-2xl mx-auto">{t('story.subtitle')}</p>
      </div>

      {body && (
        <div className={cn('max-w-3xl mx-auto mb-20', dir === 'rtl' && 'text-right')}>
          <p className="text-base text-text leading-relaxed whitespace-pre-line">{body}</p>
        </div>
      )}

      <div className="mb-20">
        <h2 className="font-heading text-3xl font-bold text-text text-center mb-12">
          {t('story.timelineTitle')}
        </h2>
        <div className="relative">
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gold/20 hidden md:block -translate-x-1/2" />
          <div className="space-y-12">
            {milestones.map((m, idx) => {
              const Icon = m.icon;
              const isLeft = idx % 2 === 0;
              return (
                <div
                  key={m.key}
                  className={cn(
                    'flex items-center gap-8',
                    isLeft ? 'md:flex-row' : 'md:flex-row-reverse',
                    dir === 'rtl' && 'md:flex-row-reverse'
                  )}
                >
                  <div className="hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-gold/10 border-2 border-gold/30 shrink-0 z-10">
                    <Icon className="w-5 h-5 text-gold" />
                  </div>
                  <div className="flex-1 bg-surface rounded-xl border border-border p-6 card-glow">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="md:hidden flex items-center justify-center w-10 h-10 rounded-full bg-gold/10">
                        <Icon className="w-4 h-4 text-gold" />
                      </div>
                      <h3 className="text-lg font-semibold text-text">{t(`story.${m.key}Title`)}</h3>
                    </div>
                    <p className="text-sm text-muted leading-relaxed">{t(`story.${m.key}Desc`)}</p>
                  </div>
                  <div className="hidden md:block flex-1" />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div>
        <h2 className="font-heading text-3xl font-bold text-text text-center mb-12">
          {t('story.valuesTitle')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {values.map((v) => {
            const Icon = v.icon;
            return (
              <div key={v.key} className="bg-surface rounded-xl border border-border p-8 text-center card-glow">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gold/10 mb-4">
                  <Icon className="w-6 h-6 text-gold" />
                </div>
                <h3 className="text-lg font-semibold text-text mb-2">{t(`story.${v.key}Title`)}</h3>
                <p className="text-sm text-muted leading-relaxed">{t(`story.${v.key}Desc`)}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
