export default function ReviewCard({ review }) {
  return (
    <div className="review-card">
      <div className="review-photo">
        <img src={review.photo} alt={`Foto de ${review.name}`} loading="lazy" decoding="async" />
      </div>
      <div className="review-body">
        <div className="review-top">
          <span className="review-name">{review.name}</span>
          <span className="review-stars">
            <i className="fas fa-star"></i> {review.rating.toFixed(1).replace('.', ',')}
          </span>
        </div>
        <p className="review-text">{review.text}</p>
      </div>
    </div>
  )
}
