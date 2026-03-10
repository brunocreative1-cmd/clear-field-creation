import { useState, useEffect } from 'react'
import ReviewCard from '../ReviewCard/ReviewCard'
import { reviews as localReviews, reviewSummary as localSummary } from '../../data/reviews'
import { fetchReviews } from '../../services/reviewService'

export default function ReviewsSection() {
  const [reviews, setReviews] = useState(localReviews)
  const [summary, setSummary] = useState(localSummary)

  useEffect(() => {
    fetchReviews()
      .then(({ reviews: r, summary: s }) => {
        setReviews(r)
        setSummary(s)
      })
      .catch(() => {})
  }, [])

  return (
    <section className="reviews-section">
      <div className="reviews-header">
        <h2 className="section-title">O que nossos clientes dizem</h2>
        <div className="reviews-rating-summary">
          <span className="reviews-score">{summary.score}</span>
          <div className="reviews-stars">
            <i className="fas fa-star"></i>
            <i className="fas fa-star"></i>
            <i className="fas fa-star"></i>
            <i className="fas fa-star"></i>
            <i className="fas fa-star-half-alt"></i>
          </div>
          <span className="reviews-count">{summary.totalReviews}</span>
        </div>
      </div>

      <div className="reviews-scroll">
        {reviews.map(review => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </section>
  )
}
