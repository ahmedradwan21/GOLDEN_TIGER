'use client';

import { useState, useMemo } from 'react';
import { useI18n } from '@/context/I18nContext';
import { Briefcase, MapPin, Clock, X, Send, Loader as Loader2, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface JobPosting {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
  requirements: string | null;
  is_active: boolean;
  created_at: string;
}

export function CareersClient({ jobs }: { jobs: JobPosting[] }) {
  const { t, dir } = useI18n();
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [applyJob, setApplyJob] = useState<JobPosting | null>(null);

  const departments = useMemo(() => {
    const set = new Set(jobs.map((j) => j.department));
    return Array.from(set);
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    if (departmentFilter === 'all') return jobs;
    return jobs.filter((j) => j.department === departmentFilter);
  }, [jobs, departmentFilter]);

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold/10 mb-6">
          <Briefcase className="w-8 h-8 text-gold" />
        </div>
        <h1 className="font-heading text-4xl sm:text-5xl font-bold text-text mb-4">{t('careers.title')}</h1>
        <p className="text-lg text-muted">{t('careers.subtitle')}</p>
      </div>

      {departments.length > 0 && (
        <div className={cn('flex flex-wrap gap-2 mb-8 justify-center', dir === 'rtl' && 'flex-row-reverse')}>
          <button
            onClick={() => setDepartmentFilter('all')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              departmentFilter === 'all'
                ? 'bg-gold/10 text-gold border border-gold/30'
                : 'text-muted hover:text-text border border-border'
            )}
          >
            {t('careers.filterAll')}
          </button>
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => setDepartmentFilter(dept)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                departmentFilter === dept
                  ? 'bg-gold/10 text-gold border border-gold/30'
                  : 'text-muted hover:text-text border border-border'
              )}
            >
              {dept}
            </button>
          ))}
        </div>
      )}

      {filteredJobs.length === 0 ? (
        <div className="text-center py-20 text-muted">
          <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>{t('careers.noPositions')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredJobs.map((job) => (
            <div key={job.id} className="bg-surface rounded-xl border border-border p-6 card-glow flex flex-col">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-text mb-1">{job.title}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                    <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{job.department}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.location}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{job.type}</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted leading-relaxed mb-4 flex-1 line-clamp-3">{job.description}</p>
              {job.requirements && (
                <div className="mb-4 p-3 rounded-lg bg-surface-elevated border border-border">
                  <p className="text-xs font-semibold text-gold mb-1">{t('careers.viewRequirements')}</p>
                  <p className="text-xs text-muted leading-relaxed line-clamp-2">{job.requirements}</p>
                </div>
              )}
              <button
                onClick={() => setApplyJob(job)}
                className="h-11 px-6 gold-button rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                {t('careers.applyNow')}
              </button>
            </div>
          ))}
        </div>
      )}

      {applyJob && <ApplicationModal job={applyJob} onClose={() => setApplyJob(null)} />}
    </div>
  );
}

function ApplicationModal({ job, onClose }: { job: JobPosting; onClose: () => void }) {
  const { t, dir } = useI18n();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!fullName.trim() || !email.trim()) {
      setError(t('careers.error'));
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/jobs/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.id,
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          coverLetter: coverLetter.trim() || undefined,
          resumeUrl: resumeUrl.trim() || undefined,
        }),
      });
      if (!res.ok) {
        setError(t('careers.error'));
        setSubmitting(false);
        return;
      }
      setSuccess(true);
      setTimeout(() => onClose(), 3000);
    } catch {
      setError(t('careers.error'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div
        className="bg-surface rounded-2xl border border-border max-w-lg w-full max-h-[90vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={cn('flex items-center justify-between mb-6', dir === 'rtl' && 'flex-row-reverse')}>
          <div>
            <h2 className="text-xl font-bold text-text">{t('careers.applicationForm')}</h2>
            <p className="text-sm text-muted mt-1">{job.title}</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-text p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-success/10 mb-4">
              <Send className="w-6 h-6 text-success" />
            </div>
            <p className="text-text font-medium">{t('careers.success')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">{t('careers.fullName')}</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-surface-elevated border border-border text-sm text-text focus-ring"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">{t('careers.email')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-surface-elevated border border-border text-sm text-text focus-ring"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">{t('careers.phone')}</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-surface-elevated border border-border text-sm text-text focus-ring"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">{t('careers.resumeUrl')}</label>
              <input
                type="url"
                value={resumeUrl}
                onChange={(e) => setResumeUrl(e.target.value)}
                placeholder={t('careers.resumeUrlPlaceholder')}
                className="w-full h-10 px-3 rounded-lg bg-surface-elevated border border-border text-sm text-text placeholder:text-muted focus-ring"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">{t('careers.coverLetter')}</label>
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                rows={4}
                placeholder={t('careers.coverLetterPlaceholder')}
                className="w-full p-3 rounded-lg bg-surface-elevated border border-border text-sm text-text placeholder:text-muted focus-ring resize-none"
              />
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-11 px-6 rounded-lg text-sm font-medium border border-border text-muted hover:text-text transition-colors"
              >
                {t('careers.cancel')}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 h-11 px-6 gold-button rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {submitting ? t('careers.submitting') : t('careers.submit')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
