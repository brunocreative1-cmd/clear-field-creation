/**
 * Registra um pedido (log local).
 * Quando um backend for integrado, basta substituir esta função.
 */
export async function createOrder(orderData) {
  console.info('[OrderService] Pedido registrado:', {
    nome: orderData.nome,
    items: orderData.items,
    total: orderData.totalPrice
  })
  return { id: Date.now(), status: 'pending' }
}

/**
 * Busca pedidos (placeholder para futuro painel admin).
 */
export async function fetchOrders() {
  return []
}
