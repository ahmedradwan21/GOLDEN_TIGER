'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Shield, Loader as Loader2, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';

interface Review {
  id: string;
  product_id: string;
  product_title: string;
  product_slug: string;
  author_name: string;
  rating: number;
  comment: string;
  is_approved: boolean;
  admin_reply: string | null;
  admin_replied_at: string | null;
  created_at: string;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [saving, setSaving] = useState(false);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reviews?page=${page}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      }
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  function startReply(review: Review) {
    setReplyingId(review.id);
    setReplyText(review.admin_reply ?? '');
  }

  async function submitReply(reviewId: string) {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, adminReply: replyText }),
      });
      if (res.ok) {
        setReplyingId(null);
        setReplyText('');
        loadReviews();
      }
    } finally {
      setSaving(false);
    }
  }

  async function toggleApproval(review: Review) {
    try {
      await fetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId: review.id, isApproved: !review.is_approved }),
      });
      loadReviews();
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold">Reviews Manager</h1>
        <p className="text-muted mt-1">{total} total reviews</p>
      </div>

      <Card className="bg-surface border-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gold" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted">
            <MessageSquare className="w-12 h-12 mb-3" />
            <p>No reviews yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {reviews.map((review) => (
              <div key={review.id} className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-text">{review.author_name}</span>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${s <= review.rating ? 'fill-gold text-gold' : 'text-muted'}`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-muted">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-gold mb-2">
                      on <a href={`/product/${review.product_slug}`} className="hover:underline">{review.product_title}</a>
                    </p>
                    <p className="text-sm text-text">{review.comment}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <Badge variant={review.is_approved ? 'default' : 'secondary'} className={review.is_approved ? 'bg-green-500/20 text-green-400' : ''}>
                      {review.is_approved ? 'Approved' : 'Pending'}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleApproval(review)}
                    >
                      {review.is_approved ? 'Unpublish' : 'Approve'}
                    </Button>
                  </div>
                </div>

                {review.admin_reply && replyingId !== review.id && (
                  <div className="ml-6 p-3 rounded-lg bg-gold/5 border border-gold/20 flex items-start gap-2">
                    <Shield className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-gold mb-1">Golden Tiger Shield Reply</p>
                      <p className="text-sm text-text">{review.admin_reply}</p>
                    </div>
                  </div>
                )}

                {replyingId === review.id ? (
                  <div className="ml-6 space-y-2">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={3}
                      placeholder="Write a reply as the Golden Tiger team..."
                      className="w-full p-3 rounded-lg bg-background border border-border text-sm text-text placeholder:text-muted focus-ring resize-none"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => submitReply(review.id)}
                        disabled={saving}
                        className="gold-button"
                      >
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Submit Reply'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setReplyingId(null); setReplyText(''); }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="ml-6">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startReply(review)}
                    >
                      <Shield className="w-3.5 h-3.5 mr-1.5" />
                      {review.admin_reply ? 'Edit Reply' : 'Reply as Admin'}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border">
            <span className="text-xs text-muted">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
