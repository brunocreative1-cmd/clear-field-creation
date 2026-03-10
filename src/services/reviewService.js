import { reviews as localReviews, reviewSummary as localSummary } from '../data/reviews'

/**
 * Retorna todas as reviews (dados locais).
 */
export async function fetchReviews() {
  return { reviews: localReviews, summary: localSummary }
}
