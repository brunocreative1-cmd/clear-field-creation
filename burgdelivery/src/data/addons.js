export const addonSections = {
  burguer_rodizio: {
    title: 'ESCOLHA SEUS HAMBÚRGUERES',
    subtitle: 'Escolha até 6 unidades',
    max: 6,
    items: [
      { id: 'rod-costela', name: 'Grill Costela', description: 'Hambúrguer artesanal 200g, Costela Bovina Desfiada, Cheddar Cremoso, Maionese Artesanal, Pão Brioche Tostado.', price: 0, image: '/img/burger-costela.webp' },
      { id: 'rod-smash', name: 'Grill Smash', description: '2x Smash 100g grelhado na chapa, Cheddar Derretido, Cebola Dourada, Bacon Defumado, Maionese Temperada, Pão Brioche.', price: 0, image: '/img/burger-smash-sel.webp' },
      { id: 'rod-salada', name: 'Grill Salada Fresca', description: 'Hambúrguer artesanal 200g, Queijo Cheddar, Bacon Crocante, Alface Fresca, Tomate Maduro, Cebola Roxa, Pão Brioche.', price: 0, image: '/img/burger-salada.webp' },
      { id: 'rod-cheddar', name: 'Grill Cheddar Cremoso', description: 'Hambúrguer artesanal 200g, Creme de Cheddar Premium, Bacon Crocante, Cebola Caramelizada no Azeite, Pão Australiano Tostado.', price: 0, image: '/img/burger-cheddar.webp' }
    ]
  },
  burguer_familia: {
    title: 'ESCOLHA SEUS HAMBÚRGUERES',
    subtitle: 'Escolha até 5 unidades',
    max: 5,
    items: [
      { id: 'fam-costela', name: 'Grill Costela', description: 'Hambúrguer artesanal 200g, Costela Bovina Desfiada, Cheddar Cremoso, Maionese Artesanal, Pão Brioche Tostado.', price: 0, image: '/img/burger-costela.webp' },
      { id: 'fam-smash', name: 'Grill Smash', description: '2x Smash 100g grelhado na chapa, Cheddar Derretido, Cebola Dourada, Bacon Defumado, Maionese Temperada, Pão Brioche.', price: 0, image: '/img/burger-smash-sel.webp' },
      { id: 'fam-salada', name: 'Grill Salada Fresca', description: 'Hambúrguer artesanal 200g, Queijo Cheddar, Bacon Crocante, Alface Fresca, Tomate Maduro, Cebola Roxa, Pão Brioche.', price: 0, image: '/img/burger-salada.webp' },
      { id: 'fam-cheddar', name: 'Grill Cheddar Cremoso', description: 'Hambúrguer artesanal 200g, Creme de Cheddar Premium, Bacon Crocante, Cebola Caramelizada no Azeite, Pão Australiano Tostado.', price: 0, image: '/img/burger-cheddar.webp' }
    ]
  },
  burguer_smash3: {
    title: 'ESCOLHA SEU HAMBÚRGUER',
    subtitle: '3 unidades inclusas',
    max: 3,
    items: [
      { id: 'smash3', name: 'Grill Smash Artesanal', description: '3x Hambúrguer Smash 100g grelhado, Cheddar Cremoso Derretido, Cebola Dourada Picada, Bacon Defumado, Maionese Temperada da Casa, Pão Brioche com Gergelim.', price: 0, image: '/img/burger-smash-sel.webp' }
    ]
  },
  burguer_crispy: {
    title: 'ESCOLHA SEU HAMBÚRGUER',
    subtitle: 'Escolha 2 opções',
    max: 2,
    items: [
      { id: 'crispy-bacon', name: 'Grill Duplo Bacon Crocante', description: 'Hambúrguer grelhado 120g, Crispy de Cebola, Queijo Cheddar Cremoso, Barbecue Defumado, Alface Fresca, Tomate e molho especial da casa.', price: 0, image: '/img/produto1.webp' }
    ]
  },
  sobremesa: {
    title: 'ESCOLHA SUA BATATA',
    subtitle: 'Escolha até 1 opção',
    max: 1,
    items: [
      { id: 'batata-classica', name: 'Batata Clássica', description: 'Batata frita crocante temperada.', price: 12.90, promo: 'Grátis no 1º pedido', image: '/img/batata-classica.webp' },
      { id: 'batata-cheddar', name: 'Batata Cheddar e Bacon', description: 'Batata com creme de cheddar e bacon crocante.', price: 16.90, promo: 'Grátis no 1º pedido', image: '/img/batata-cheddar.webp' },
      { id: 'batata-paprica', name: 'Batata com Páprica Picante', description: 'Batata temperada com páprica defumada.', price: 14.90, promo: 'Grátis no 1º pedido', image: '/img/batata-classica.webp' }
    ]
  },
  fritas: {
    title: 'ESCOLHA SUAS FRITAS',
    subtitle: 'Escolha até 1 opção',
    max: 1,
    items: [
      { id: 'fritas-classica', name: 'Batata Clássica', description: 'Batata frita crocante temperada.', price: 12.90, promo: 'Grátis no 1º pedido', image: '/img/batata-classica.webp' },
      { id: 'fritas-cheddar', name: 'Batata Cheddar e Bacon', description: 'Batata com creme de cheddar e bacon crocante.', price: 16.90, promo: 'Grátis no 1º pedido', image: '/img/batata-cheddar.webp' },
      { id: 'fritas-paprica', name: 'Batata com Páprica Picante', description: 'Batata temperada com páprica defumada.', price: 14.90, promo: 'Grátis no 1º pedido', image: '/img/batata-classica.webp' }
    ]
  },
  bebida: {
    title: 'ESCOLHA SUA BEBIDA',
    subtitle: '1 bebida lata grátis · Adicione quantas quiser',
    max: 10,
    freeQty: 1,
    items: [
      { id: 'coca-cola', name: 'Coca-Cola Original', description: 'Lata 350ml', price: 7.90, promo: 'Grátis no combo', image: '/img/coca-cola.webp' },
      { id: 'coca-zero', name: 'Coca-Cola Sem Açúcar', description: 'Lata 350ml', price: 7.90, promo: 'Grátis no combo', image: '/img/coca-zero.webp' },
      { id: 'guarana', name: 'Guaraná Antarctica', description: 'Lata 350ml', price: 7.90, promo: 'Grátis no combo', image: '/img/guarana.webp' },
      { id: 'fanta', name: 'Fanta Laranja', description: 'Lata 350ml', price: 7.90, promo: 'Grátis no combo', image: '/img/fanta.webp' },
      { id: 'la-fruit', name: 'Néctar La Fruit Uva', description: 'Lata 350ml', price: 7.90, promo: 'Grátis no combo', image: '/img/la-fruit.webp' },
      { id: 'agua-mineral', name: 'Água Mineral Indaiá', description: 'Garrafa 500ml', price: 5.90, image: '/img/agua-mineral.webp' },
      { id: 'coca-2l', name: 'Coca-Cola Original', description: 'Garrafa 2 Litros', price: 12.90, image: '/img/coca-2l.webp' },
      { id: 'coca-2l-zero', name: 'Coca-Cola Sem Açúcar', description: 'Garrafa 2 Litros', price: 12.90, image: '/img/coca-2l-zero.webp' },
      { id: 'heineken', name: 'Heineken', description: 'Lata 350ml · Puro Malte', price: 7.90, image: '/img/heineken.webp' },
      { id: 'budweiser', name: 'Budweiser', description: 'Lata 350ml · American Lager', price: 6.90, image: '/img/budweiser.webp' }
    ]
  },
  refri2l_1: {
    title: 'ESCOLHA SEU REFRIGERANTE 2L',
    subtitle: '1 refrigerante 2L grátis no combo',
    max: 10,
    freeQty: 1,
    items: [
      { id: 'r2l1-coca', name: 'Coca-Cola Original', description: 'Garrafa 2 Litros', price: 12.90, promo: 'Grátis no combo', image: '/img/coca-2l.webp' },
      { id: 'r2l1-coca-zero', name: 'Coca-Cola Sem Açúcar', description: 'Garrafa 2 Litros', price: 12.90, promo: 'Grátis no combo', image: '/img/coca-2l-zero.webp' },
      { id: 'r2l1-guarana', name: 'Guaraná Antarctica', description: 'Garrafa 2 Litros', price: 10.90, promo: 'Grátis no combo', image: '/img/guarana-2l.webp' }
    ]
  },
  refri2l: {
    title: 'ESCOLHA SEUS 2 REFRIGERANTES 2L',
    subtitle: 'Escolha até 2 opções',
    max: 2,
    items: [
      { id: 'r2l-coca', name: 'Coca-Cola Original', description: 'Garrafa 2 Litros', price: 12.90, promo: 'Grátis no combo', image: '/img/coca-2l.webp' },
      { id: 'r2l-coca-zero', name: 'Coca-Cola Sem Açúcar', description: 'Garrafa 2 Litros', price: 12.90, promo: 'Grátis no combo', image: '/img/coca-2l-zero.webp' },
      { id: 'r2l-guarana', name: 'Guaraná Antarctica', description: 'Garrafa 2 Litros', price: 10.90, promo: 'Grátis no combo', image: '/img/guarana-2l.webp' }
    ]
  },
  bebida_extra: {
    title: 'BEBIDAS ADICIONAIS',
    subtitle: 'Opcional · Escolha até 3',
    max: 3,
    optional: true,
    items: [
      { id: 'ex-coca', name: 'Coca-Cola Original', description: 'Lata 350ml', price: 7.90, image: '/img/coca-cola.webp' },
      { id: 'ex-coca-zero', name: 'Coca-Cola Sem Açúcar', description: 'Lata 350ml', price: 7.90, image: '/img/coca-zero.webp' },
      { id: 'ex-guarana', name: 'Guaraná Antarctica', description: 'Lata 350ml', price: 7.90, image: '/img/guarana.webp' },
      { id: 'ex-fanta', name: 'Fanta Laranja', description: 'Lata 350ml', price: 7.90, image: '/img/fanta.webp' },
      { id: 'ex-heineken', name: 'Heineken', description: 'Lata 350ml · Puro Malte', price: 7.90, image: '/img/heineken.webp' },
      { id: 'ex-budweiser', name: 'Budweiser', description: 'Lata 350ml · American Lager', price: 6.90, image: '/img/budweiser.webp' },
      { id: 'ex-agua', name: 'Água Mineral Indaiá', description: 'Garrafa 500ml', price: 5.90, image: '/img/agua-mineral.webp' }
    ]
  },
  sobremesa_extra: {
    title: 'ADICIONE UMA SOBREMESA',
    subtitle: 'Opcional · Escolha até 2',
    max: 2,
    optional: true,
    items: [
      { id: 'sob-maracuja', name: 'Taça de Maracujá com Chocolate Belga', description: 'Ganache de chocolate belga, creme de maracujá e calda artesanal da fruta. Peso: 110g.', price: 6.90, image: '/img/sobremesa-maracuja.webp' },
      { id: 'sob-morango', name: 'Taça de Morango com Chocolate Belga', description: 'Ganache de chocolate belga, creme de morango e geleia artesanal de morangos frescos. Peso: 110g.', price: 6.90, image: '/img/sobremesa-morango.webp' }
    ]
  }
}

export function getAddonsByKeys(keys) {
  return keys.map(key => addonSections[key]).filter(Boolean)
}
