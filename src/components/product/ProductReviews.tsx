'use client';

import { useState, useEffect, useCallback } from 'react';
import { Star, Shield, Loader as Loader2, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Review {
  id: string;
  author_name: string;
  rating: number;
  comment: string;
  admin_reply: string | null;
  admin_replied_at: string | null;
  created_at: string;
}

export function ProductReviews({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const [authorName, setAuthorName] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const loadReviews = useCallback(async () => {
    try {
      const res = await fetch(`/api/reviews?productId=${productId}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews ?? []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (selectedRating < 1) {
      setError('Please select a star rating.');
      return;
    }
    if (!authorName.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!comment.trim()) {
      setError('Please write a comment.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          authorName: authorName.trim(),
          rating: selectedRating,
          comment: comment.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Failed to submit review.');
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      setSelectedRating(0);
      setAuthorName('');
      setComment('');
      loadReviews();
      setTimeout(() => setSuccess(false), 4000);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <h3 className="font-heading text-2xl font-bold text-text">Customer Reviews</h3>
        {avgRating && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={cn('w-4 h-4', s <= Math.round(Number(avgRating)) ? 'fill-gold text-gold' : 'text-muted')}
                />
              ))}
            </div>
            <span className="text-sm text-muted">{avgRating} ({reviews.length})</span>
          </div>
        )}
      </div>

      {/* Review form */}
      <div className="bg-surface rounded-xl border border-border p-5 sm:p-6">
        <h4 className="text-sm font-semibold text-text mb-4">Write a Review</h4>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Star selector */}
          <div>
            <label className="block text-xs font-medium text-muted mb-2">Your Rating</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSelectedRating(s)}
                  onMouseEnter={() => setHoverRating(s)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                  aria-label={`Rate ${s} stars`}
                >
                  <Star
                    className={cn(
                      'w-7 h-7 transition-colors',
                      s <= (hoverRating || selectedRating)
                        ? 'fill-gold text-gold'
                        : 'text-muted fill-none'
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">Your Name</label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              maxLength={100}
              className="w-full h-10 px-3 rounded-lg bg-surface-elevated border border-border text-sm text-text placeholder:text-muted focus-ring"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">Your Review</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={2000}
              rows={4}
              className="w-full p-3 rounded-lg bg-surface-elevated border border-border text-sm text-text placeholder:text-muted focus-ring resize-none"
              placeholder="Share your experience with this product..."
            />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}
          {success && <p className="text-sm text-success">Review submitted successfully!</p>}

          <button
            type="submit"
            disabled={submitting}
            className="h-11 px-6 gold-button rounded-lg text-sm font-semibold flex items-center gap-2"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Submit Review
          </button>
        </form>
      </div>

      {/* Reviews list */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-gold animate-spin" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-8 text-muted">
            <p className="text-sm">No reviews yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="bg-surface rounded-xl border border-border p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={cn('w-4 h-4', s <= review.rating ? 'fill-gold text-gold' : 'text-muted')}
                    />
                  ))}
                </div>
                <span className="text-sm font-semibold text-text">{review.author_name}</span>
                <span className="text-xs text-muted">
                  {new Date(review.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <p className="text-sm text-text leading-relaxed">{review.comment}</p>

              {review.admin_reply && (
                <div className="mt-4 p-4 rounded-lg bg-gold/5 border border-gold/20 flex items-start gap-3">
                  <Shield className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-gold mb-1">Golden Tiger Shield Reply</p>
                    <p className="text-sm text-text leading-relaxed">{review.admin_reply}</p>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
