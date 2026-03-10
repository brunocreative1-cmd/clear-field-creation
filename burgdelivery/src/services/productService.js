import { products as localProducts, productList as localProductList } from '../data/products'

/**
 * Retorna todos os produtos (dados locais).
 */
export async function fetchProducts() {
  return localProductList
}

/**
 * Busca um produto pelo ID (dados locais).
 */
export async function fetchProductById(id) {
  return localProducts[id] || null
}
