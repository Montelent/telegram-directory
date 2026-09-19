'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Review {
  id: string
  rating: number
  comment: string | null
  createdAt: string
  user: { name: string | null; email: string }
}

export default function ReviewSection({
  entityId,
  reviews: initialReviews,
  isLoggedIn,
  avgRating,
}: {
  entityId: string
  reviews: Review[]
  isLoggedIn: boolean
  avgRating: number | null
}) {
  const [reviews, setReviews] = useState(initialReviews)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityId, rating, comment: comment || null }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to submit review')
        setLoading(false)
        return
      }

      setReviews((prev) => [data, ...prev.filter((r) => r.id !== data.id)])
      setComment('')
      setSuccess(true)
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mt-8 bg-white rounded-xl border p-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-1">Reviews & Ratings</h2>
      {avgRating != null && (
        <p className="text-sm text-slate-500 mb-4">
          Average: ★ {avgRating.toFixed(1)} · {reviews.length} review{reviews.length !== 1 ? 's' : ''}
        </p>
      )}

      {isLoggedIn ? (
        <form onSubmit={handleSubmit} className="mb-8 border-b pb-6">
          <p className="text-sm font-medium mb-2">Your rating</p>
          <div className="flex gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                className={`text-2xl ${n <= rating ? 'text-yellow-400' : 'text-slate-300'}`}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write a comment (optional)..."
            rows={3}
            className="w-full rounded-lg border px-3 py-2 text-sm mb-3"
          />
          {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
          {success && <p className="text-sm text-green-600 mb-2">Review saved!</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit review'}
          </button>
        </form>
      ) : (
        <p className="text-sm text-slate-500 mb-6">
          <Link href="/login" className="text-blue-600 hover:underline">
            Log in
          </Link>{' '}
          to leave a review.
        </p>
      )}

      <div className="space-y-4">
        {reviews.length === 0 ? (
          <p className="text-sm text-slate-400">No reviews yet. Be the first!</p>
        ) : (
          reviews.map((r) => (
            <div key={r.id} className="border-b last:border-0 pb-4 last:pb-0">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">
                  {r.user.name || r.user.email.split('@')[0]}
                </span>
                <span className="text-yellow-400">
                  {'★'.repeat(r.rating)}
                  {'☆'.repeat(5 - r.rating)}
                </span>
                <span className="text-slate-400 text-xs">
                  {new Date(r.createdAt).toLocaleDateString()}
                </span>
              </div>
              {r.comment && (
                <p className="text-sm text-slate-600 mt-1">{r.comment}</p>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  )
}
