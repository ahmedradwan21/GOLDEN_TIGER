'use client';

import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/context/I18nContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, X, Loader as Loader2, Save, Briefcase, MapPin, Clock, Building2, Mail, Phone, FileText, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
  requirements: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Application {
  id: string;
  job_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  cover_letter: string | null;
  resume_url: string | null;
  created_at: string;
}

const emptyForm = {
  title: '',
  department: '',
  location: '',
  type: 'Full-time',
  description: '',
  requirements: '',
  isActive: true,
};

export default function AdminCareersPage() {
  const { t, dir } = useI18n();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [showApps, setShowApps] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/jobs');
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const loadApplications = useCallback(async (jobId: string) => {
    const res = await fetch(`/api/admin/careers?jobId=${jobId}`);
    if (res.ok) {
      const data = await res.json();
      setApplications(data.applications ?? []);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  function openNewJob() {
    setEditingJob(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEditJob(job: Job) {
    setEditingJob(job);
    setForm({
      title: job.title,
      department: job.department,
      location: job.location,
      type: job.type,
      description: job.description,
      requirements: job.requirements ?? '',
      isActive: job.is_active,
    });
    setShowForm(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        department: form.department,
        location: form.location,
        type: form.type,
        description: form.description,
        requirements: form.requirements || undefined,
        isActive: form.isActive,
      };

      if (editingJob) {
        await fetch('/api/jobs', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId: editingJob.id, ...payload }),
        });
      } else {
        await fetch('/api/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      setShowForm(false);
      loadJobs();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(jobId: string) {
    if (!confirm(t('admin.careers.deleteConfirm'))) return;
    await fetch('/api/jobs', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId }),
    });
    loadJobs();
  }

  async function toggleActive(job: Job) {
    await fetch('/api/jobs', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId: job.id, isActive: !job.is_active }),
    });
    loadJobs();
  }

  function viewApplications(jobId: string) {
    if (showApps === jobId) {
      setShowApps(null);
      return;
    }
    setShowApps(jobId);
    loadApplications(jobId);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">{t('admin.careers.title')}</h1>
          <p className="text-muted mt-1">{t('admin.careers.subtitle')}</p>
        </div>
        <Button onClick={openNewJob} className="gold-button">
          <Plus className="w-4 h-4 mr-2" />
          {t('admin.careers.addJob')}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gold" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-20 text-muted">
          <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>{t('admin.careers.noJobs')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <Card key={job.id} className="bg-surface border-border overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-text">{job.title}</h3>
                      <Badge variant={job.is_active ? 'default' : 'secondary'} className={job.is_active ? 'bg-green-500/20 text-green-400' : ''}>
                        {job.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted mb-2">
                      <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{job.department}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.location}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{job.type}</span>
                    </div>
                    <p className="text-sm text-muted line-clamp-2">{job.description}</p>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => openEditJob(job)}>
                      <Pencil className="w-3.5 h-3.5 mr-1" />{t('common.edit')}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => toggleActive(job)}>
                      {job.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => viewApplications(job.id)}>
                      <FileText className="w-3.5 h-3.5 mr-1" />
                      {t('admin.careers.applications')}
                    </Button>
                    <Button size="sm" variant="outline" className="text-danger hover:bg-danger/10" onClick={() => handleDelete(job.id)}>
                      <Trash2 className="w-3.5 h-3.5 mr-1" />{t('common.delete')}
                    </Button>
                  </div>
                </div>
              </div>

              {showApps === job.id && (
                <div className="border-t border-border bg-background p-5">
                  {applications.length === 0 ? (
                    <p className="text-sm text-muted text-center py-6">{t('admin.careers.noApplications')}</p>
                  ) : (
                    <div className="space-y-3">
                      {applications.map((app) => (
                        <div key={app.id} className="bg-surface rounded-lg border border-border p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h4 className="text-sm font-semibold text-text">{app.full_name}</h4>
                              <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted">
                                <a href={`mailto:${app.email}`} className="flex items-center gap-1 hover:text-gold">
                                  <Mail className="w-3 h-3" />{app.email}
                                </a>
                                {app.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{app.phone}</span>}
                                <span>{new Date(app.created_at).toLocaleDateString()}</span>
                              </div>
                              {app.cover_letter && (
                                <p className="text-xs text-muted mt-2 leading-relaxed line-clamp-3">{app.cover_letter}</p>
                              )}
                            </div>
                            {app.resume_url && (
                              <a
                                href={app.resume_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-gold hover:underline shrink-0"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                Resume
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setShowForm(false)}>
          <div
            className="bg-surface rounded-2xl border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={cn('flex items-center justify-between mb-6', dir === 'rtl' && 'flex-row-reverse')}>
              <h2 className="text-xl font-bold text-text">
                {editingJob ? t('admin.careers.editJob') : t('admin.careers.newJob')}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-muted hover:text-text p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">{t('admin.careers.field.title')}</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg bg-background border border-border text-sm text-text focus-ring"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">{t('admin.careers.field.department')}</label>
                  <input
                    type="text"
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg bg-background border border-border text-sm text-text focus-ring"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">{t('admin.careers.field.location')}</label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg bg-background border border-border text-sm text-text focus-ring"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">{t('admin.careers.field.type')}</label>
                  <input
                    type="text"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg bg-background border border-border text-sm text-text focus-ring"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">{t('admin.careers.field.description')}</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={5}
                  className="w-full p-3 rounded-lg bg-background border border-border text-sm text-text focus-ring resize-y"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">{t('admin.careers.field.requirements')}</label>
                <textarea
                  value={form.requirements}
                  onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                  rows={3}
                  className="w-full p-3 rounded-lg bg-background border border-border text-sm text-text focus-ring resize-y"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-text">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="w-4 h-4 accent-gold"
                />
                {t('admin.careers.field.active')}
              </label>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>
                  {t('common.cancel')}
                </Button>
                <Button className="flex-1 gold-button" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  {t('common.save')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
