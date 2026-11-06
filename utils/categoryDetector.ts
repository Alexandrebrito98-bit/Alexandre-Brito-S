import { Language, ShoppingItem } from '../types';

export interface CategoryDefinition {
  id: string;
  names: {
    pt: string;
    en: string;
  };
  icon: string; // Emoji for neat visual presentation
  keywords: string[];
  isCustom?: boolean;
}

export const CATEGORIES: CategoryDefinition[] = [
  {
    id: 'produce',
    names: {
      pt: 'Hortifruti',
      en: 'Produce & Fresh',
    },
    icon: '🍎',
    keywords: [
      // Frutas
      'maca', 'maçã', 'banana', 'laranja', 'limao', 'limão', 'uva', 'morango', 'melancia', 'melao', 'melão',
      'abacaxi', 'manga', 'pera', 'pêra', 'mamao', 'mamão', 'abacate', 'pessego', 'pêssego', 'kiwi', 'ameixa',
      'cereja', 'goiaba', 'maracuja', 'maracujá', 'tangerina', 'mexerica', 'bergamota', 'caju', 'coco', 'amora',
      'framboesa', 'mirtilo', 'blueberry', 'apple', 'orange', 'lemon', 'lime', 'grape', 'strawberry', 'watermelon',
      'melon', 'pineapple', 'mango', 'pear', 'papaya', 'avocado', 'peach', 'plum', 'cherry',
      // Legumes & Verduras
      'alface', 'tomate', 'cebola', 'alho', 'batata', 'cenoura', 'abobora', 'abóbora', 'abobrinha', 'pepino',
      'pimentao', 'pimentão', 'pimenta', 'brocolis', 'brócolis', 'couve', 'espinafre', 'repolho', 'chuchu',
      'mandioca', 'aipim', 'macaxeira', 'beterraba', 'berinjela', 'quiabo', 'vagem', 'rucula', 'rúcula',
      'agriao', 'agrião', 'cheiro verde', 'salsa', 'salsinha', 'coentro', 'cebolinha', 'hortela', 'hortelã',
      'manjericao', 'manjericão', 'alecrim', 'gengibre', 'cogumelo', 'champignon', 'shimeji', 'shitake',
      'lettuce', 'tomato', 'onion', 'garlic', 'potato', 'carrot', 'pumpkin', 'zucchini', 'cucumber', 'pepper',
      'broccoli', 'cabbage', 'spinach', 'beet', 'eggplant', 'parsley', 'cilantro', 'ginger', 'mushroom'
    ]
  },
  {
    id: 'bakery',
    names: {
      pt: 'Padaria & Confeitaria',
      en: 'Bakery & Bread',
    },
    icon: '🥖',
    keywords: [
      'pao', 'pão', 'torrada', 'croissant', 'baguete', 'bisnaga', 'bolo', 'torta', 'sonho', 'brioche',
      'rosca', 'broa', 'pao de queijo', 'pão de queijo', 'pao frances', 'pão francês', 'pao de forma', 'pão de forma',
      'bread', 'toast', 'cake', 'pie', 'bagel', 'bun', 'muffin', 'cupcake', 'donut', 'cookie'
    ]
  },
  {
    id: 'dairy_refrigerated',
    names: {
      pt: 'Laticínios & Frios',
      en: 'Dairy & Eggs',
    },
    icon: '🧀',
    keywords: [
      'leite', 'queijo', 'manteiga', 'requeijao', 'requeijão', 'iogurte', 'yogurt', 'creme de leite',
      'leite condensado', 'nata', 'ricota', 'mussarela', 'mozzarella', 'prato', 'parmesao', 'parmesão',
      'presunto', 'peito de peru', 'mortadela', 'salame', 'ovo', 'ovos', 'margarina',
      'milk', 'cheese', 'butter', 'cream', 'condensed milk', 'sour cream', 'yogurt', 'ham', 'egg', 'eggs'
    ]
  },
  {
    id: 'meat_seafood',
    names: {
      pt: 'Carnes & Peixes',
      en: 'Meat & Seafood',
    },
    icon: '🥩',
    keywords: [
      'carne', 'frango', 'bife', 'picanha', 'alcatra', 'patinho', 'contra file', 'contra-filé', 'coxao', 'coxão',
      'costela', 'peito de frango', 'coxa', 'sobrecoxa', 'asa', 'linguica', 'linguiça', 'salsicha', 'bacon',
      'carne moida', 'carne moída', 'lombo', 'porco', 'suino', 'suíno', 'peixe', 'tilapia', 'tilápia',
      'salmao', 'salmão', 'bacalhau', 'camarao', 'camarão', 'atum fresco', 'sardinha fresca', 'peru',
      'meat', 'beef', 'steak', 'chicken', 'pork', 'ribs', 'sausage', 'fish', 'salmon', 'tuna', 'shrimp', 'turkey'
    ]
  },
  {
    id: 'pantry',
    names: {
      pt: 'Mercearia',
      en: 'Pantry & Grains',
    },
    icon: '🍚',
    keywords: [
      'arroz', 'feijao', 'feijão', 'macarrao', 'macarrão', 'massa', 'espaguete', 'farinha', 'acucar', 'açúcar',
      'sal', 'oleo', 'óleo', 'azeite', 'vinagre', 'molho', 'extrato de tomate', 'milho', 'ervilha', 'grao de bico',
      'grão de bico', 'lentilha', 'aveia', 'cereal', 'maionese', 'ketchup', 'mostarda', 'shoyu', 'azeitona',
      'atum', 'sardinha', 'polvilho', 'fermento', 'farinha de trigo', 'tapioca', 'temperinho', 'caldo',
      'rice', 'bean', 'beans', 'pasta', 'spaghetti', 'flour', 'sugar', 'salt', 'oil', 'olive oil', 'vinegar',
      'sauce', 'corn', 'peas', 'oats', 'cereal', 'mayo', 'mayonnaise', 'mustard', 'olives', 'canned'
    ]
  },
  {
    id: 'drinks',
    names: {
      pt: 'Bebidas',
      en: 'Beverages',
    },
    icon: '🥤',
    keywords: [
      'agua', 'água', 'refrigerante', 'coca', 'coca-cola', 'guarana', 'guaraná', 'suco', 'nectar', 'néctar',
      'cerveja', 'vinho', 'espumante', 'vodka', 'whisky', 'gin', 'rum', 'cha', 'chá', 'cafe', 'café',
      'energetico', 'energético', 'isotônico', 'isotonico', 'gatorade',
      'water', 'soda', 'coke', 'juice', 'beer', 'wine', 'tea', 'coffee', 'drink', 'beverage', 'energy drink'
    ]
  },
  {
    id: 'snacks_sweets',
    names: {
      pt: 'Snacks & Doces',
      en: 'Snacks & Sweets',
    },
    icon: '🍫',
    keywords: [
      'chocolate', 'biscoito', 'bolacha', 'salgadinho', 'batata frita', 'chips', 'amendoim', 'castanha',
      'bala', 'doce', 'chiclete', 'bombom', 'pipoca', 'gelatina', 'sorvete', 'picolé', 'nutella', 'geleia',
      'wafer', 'snack', 'candy', 'cookies', 'ice cream', 'popcorn', 'peanut', 'nuts', 'sweets'
    ]
  },
  {
    id: 'cleaning',
    names: {
      pt: 'Limpeza & Casa',
      en: 'Cleaning & Household',
    },
    icon: '🧹',
    keywords: [
      'sabao', 'sabão', 'detergente', 'amaciante', 'desinfetante', 'agua sanitaria', 'água sanitária',
      'cloro', 'esponja', 'bombril', 'palha de aco', 'palha de aço', 'pano de prato', 'flanela',
      'vassoura', 'rodo', 'balde', 'saco de lixo', 'lixo', 'papel toalha', 'papel aluminio', 'papel alumínio',
      'filme plastico', 'plástico filme', 'guardanapo', 'inseticida', 'lustra moveis', 'limpa vidro', 'multiuso',
      'soap', 'detergent', 'softener', 'bleach', 'sponge', 'broom', 'mop', 'trash bag', 'paper towel', 'aluminum foil'
    ]
  },
  {
    id: 'personal_care',
    names: {
      pt: 'Higiene & Beleza',
      en: 'Personal Care',
    },
    icon: '🧴',
    keywords: [
      'shampoo', 'xampu', 'condicionador', 'sabonete', 'pasta de dente', 'creme dental', 'escova de dente',
      'fio dental', 'enxaguante', 'desodorante', 'papel higienico', 'papel higiênico', 'algodao', 'algodão',
      'cotonete', 'hidratante', 'protetor solar', 'absorvente', 'lamina de barbear', 'gillette', 'barbeador',
      'perfume', 'esmalte', 'lenco umedecido', 'lenço umedecido', 'fralda',
      'conditioner', 'body wash', 'toothpaste', 'toothbrush', 'floss', 'mouthwash', 'deodorant',
      'toilet paper', 'lotion', 'sunscreen', 'tampon', 'pad', 'razor', 'shaving', 'diaper', 'wipes'
    ]
  },
  {
    id: 'frozen',
    names: {
      pt: 'Congelados',
      en: 'Frozen Foods',
    },
    icon: '🧊',
    keywords: [
      'congelado', 'congelada', 'pizza congelada', 'hamburguer', 'hambúrguer', 'nuggets', 'empanado',
      'lasanha', 'batata congelada', 'legumes congelados', 'gelo',
      'frozen', 'frozen pizza', 'burger', 'patty', 'ice'
    ]
  },
  {
    id: 'other',
    names: {
      pt: 'Outros',
      en: 'Others',
    },
    icon: '📦',
    keywords: []
  }
];

export function normalizeItemName(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Returns all available categories: standard ones, any custom user-created ones, and 'other' at the end.
 */
export function getAllCategories(customCategories: CategoryDefinition[] = []): CategoryDefinition[] {
  const otherCat = CATEGORIES.find(c => c.id === 'other') || {
    id: 'other',
    names: { pt: 'Outros', en: 'Others' },
    icon: '📦',
    keywords: []
  };
  const standardWithoutOther = CATEGORIES.filter(c => c.id !== 'other');
  return [...standardWithoutOther, ...customCategories, otherCat];
}

/**
 * Finds a category by its ID.
 */
export function getCategoryById(id: string, customCategories: CategoryDefinition[] = []): CategoryDefinition | undefined {
  const all = getAllCategories(customCategories);
  return all.find(c => c.id === id);
}

/**
 * Identifies the category of an item name based on semantic keyword matching,
 * checking user overrides first, then custom categories, then standard categories.
 */
export function detectCategory(
  itemName: string,
  customCategories: CategoryDefinition[] = [],
  overrides?: Record<string, string>
): CategoryDefinition {
  const normalizedName = normalizeItemName(itemName);
  if (!normalizedName) {
    return CATEGORIES.find(c => c.id === 'other') || CATEGORIES[CATEGORIES.length - 1];
  }

  // 1. Check user override for this product name
  if (overrides && overrides[normalizedName]) {
    const overrideId = overrides[normalizedName];
    const match = getCategoryById(overrideId, customCategories);
    if (match) return match;
  }

  // 2. Check custom categories (name or keywords)
  for (const cat of customCategories) {
    const namePt = normalizeItemName(cat.names.pt);
    const nameEn = normalizeItemName(cat.names.en || cat.names.pt);
    if (normalizedName === namePt || normalizedName === nameEn || normalizedName.includes(namePt)) {
      return cat;
    }
    for (const kw of cat.keywords || []) {
      const normalizedKw = normalizeItemName(kw);
      if (normalizedName === normalizedKw || normalizedName.includes(normalizedKw)) {
        return cat;
      }
    }
  }

  // 3. Check standard categories
  const words = normalizedName.split(/[\s,./\-_+]+/).filter(Boolean);

  for (const cat of CATEGORIES) {
    if (cat.id === 'other') continue;

    for (const kw of cat.keywords) {
      const normalizedKw = normalizeItemName(kw);
      
      // Exact keyword phrase match inside the item name
      if (normalizedName === normalizedKw || normalizedName.includes(normalizedKw)) {
        return cat;
      }

      // Word-level match
      if (words.some(w => w === normalizedKw)) {
        return cat;
      }
    }
  }

  // Default fallback category
  return CATEGORIES.find(c => c.id === 'other') || CATEGORIES[CATEGORIES.length - 1];
}

/**
 * Resolves the category for a given ShoppingItem:
 * 1. If the item already has an explicit categoryId, look it up.
 * 2. If an override exists for this item name, look it up.
 * 3. Fallback to keyword detectCategory.
 */
export function resolveItemCategory(
  item: ShoppingItem,
  customCategories: CategoryDefinition[] = [],
  overrides?: Record<string, string>
): CategoryDefinition {
  if (item.categoryId) {
    const match = getCategoryById(item.categoryId, customCategories);
    if (match) return match;
  }
  return detectCategory(item.name, customCategories, overrides);
}

/**
 * Returns localized category name.
 */
export function getCategoryDisplayName(cat: CategoryDefinition, lang: 'pt' | 'en' = 'pt'): string {
  return cat.names[lang] || cat.names.pt;
}
