import React, { useState, useEffect } from 'react';
import { 
  X, 
  HelpCircle, 
  PlusCircle, 
  DollarSign, 
  CheckCircle2, 
  MoveHorizontal, 
  ShoppingBag, 
  Star, 
  Trophy, 
  PieChart, 
  History, 
  PiggyBank, 
  Palette, 
  ChevronDown 
} from 'lucide-react';
import { AppThemeConfig } from '../utils/appThemes';
import { getTranslation } from '../i18n';

interface AppGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'pt' | 'en';
  themeConfig: AppThemeConfig;
}

interface GuideSection {
  id: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: {
    pt: string;
    en: string;
  };
  summary: {
    pt: string;
    en: string;
  };
  points: {
    pt: string[];
    en: string[];
  };
}

const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'add_products',
    icon: PlusCircle,
    title: {
      pt: 'Adicionar Produtos',
      en: 'Adding Products'
    },
    summary: {
      pt: 'Texto, voz e detecção de categorias',
      en: 'Text, voice and auto-category detection'
    },
    points: {
      pt: [
        'Digite o nome no campo no topo e toque em "+" ou aperte Enter no teclado.',
        'Toque no microfone para ditar itens por voz de forma rápida.',
        'O app detecta e organiza automaticamente a categoria do produto (Hortifrúti, Padaria, Limpeza, etc.).'
      ],
      en: [
        'Type the item name at the top and tap "+" or press Enter on your keyboard.',
        'Tap the microphone icon to quickly dictate products using your voice.',
        'The app automatically detects and assigns the product category (Produce, Bakery, Cleaning, etc.).'
      ]
    }
  },
  {
    id: 'qty_price',
    icon: DollarSign,
    title: {
      pt: 'Quantidade e Preço',
      en: 'Quantity & Price'
    },
    summary: {
      pt: 'Cálculo de subtotal e edição por toque longo',
      en: 'Subtotal calculation and hold-to-rename'
    },
    points: {
      pt: [
        'Ajuste as unidades com os botões "+" e "−" diretamente em cada item.',
        'Informe o preço unitário para ver o subtotal multiplicado em tempo real.',
        'Pressione e segure o card por 1 segundo se desejar renomear o produto.'
      ],
      en: [
        'Adjust units with the "+" and "−" buttons directly on each item card.',
        'Enter the unit price to see the subtotal calculated in real time.',
        'Press and hold the card for 1 second whenever you wish to rename the product.'
      ]
    }
  },
  {
    id: 'mark_purchased',
    icon: CheckCircle2,
    title: {
      pt: 'Marcar como Comprado',
      en: 'Mark as Purchased'
    },
    summary: {
      pt: 'Carrinho, itens riscados e indisponíveis',
      en: 'Cart check, strikethrough and unavailable status'
    },
    points: {
      pt: [
        'Toque no círculo de seleção para marcar o item como comprado no carrinho.',
        'Itens comprados ficam riscados e atualizam a barra de progresso no rodapé.',
        'Pelo menu de opções (⋯) de cada item, você também pode marcá-lo como "Indisponível" se não encontrar na prateleira.'
      ],
      en: [
        'Tap the circular checkbox to mark an item as purchased in your shopping cart.',
        'Purchased items are crossed out and update the footer progress bar.',
        'From the item options menu (⋯), you can also mark an item as "Unavailable" if not found in store.'
      ]
    }
  },
  {
    id: 'swipe_gestures',
    icon: MoveHorizontal,
    title: {
      pt: 'Gestos ao Deslizar',
      en: 'Swipe Gestures'
    },
    summary: {
      pt: 'Ações rápidas arrastando para os lados',
      en: 'Quick actions by swiping left or right'
    },
    points: {
      pt: [
        'Arraste o card do produto para a direita ou esquerda para executar ações instantâneas.',
        'Pode comprar, marcar como indisponível ou excluir sem precisar abrir menus.',
        'Você pode personalizar o que cada direção faz ou desativar os gestos nas Configurações.'
      ],
      en: [
        'Swipe an item card to the left or right to trigger instant actions.',
        'Quickly buy, mark as unavailable, or delete without opening any menus.',
        'Customize what each swipe direction does or disable swipe gestures entirely in Settings.'
      ]
    }
  },
  {
    id: 'multiple_lists',
    icon: ShoppingBag,
    title: {
      pt: 'Várias Listas',
      en: 'Multiple Lists'
    },
    summary: {
      pt: 'Separe compras de mercado, farmácia e casa',
      en: 'Separate grocery, pharmacy and home lists'
    },
    points: {
      pt: [
        'Toque no botão com o nome da lista ativa no topo para abrir o gerenciador.',
        'Crie quantas listas quiser (ex.: Supermercado, Farmácia, Feira, Churrasco).',
        'Personalize cada lista com um ícone emoji e alterne entre elas com um toque.'
      ],
      en: [
        'Tap the active list badge next to the title to open the list manager.',
        'Create as many lists as you need (e.g. Supermarket, Pharmacy, Farmer Market, BBQ).',
        'Customize each list with an emoji icon and switch between them in one tap.'
      ]
    }
  },
  {
    id: 'favorites',
    icon: Star,
    title: {
      pt: 'Produtos Favoritos',
      en: 'Favorite Products'
    },
    summary: {
      pt: 'Produtos frequentes prontos para reusar',
      en: 'Frequent items ready to re-add in seconds'
    },
    points: {
      pt: [
        'Cadastre seus produtos mais comuns com a quantidade padrão na seção "Favoritos".',
        'Adicione itens individuais com um toque no "+" ou todos de uma vez em "Adicionar Todos".',
        'Poupa tempo na montagem da sua lista semanal recorrente.'
      ],
      en: [
        'Register your frequent grocery items with default quantities in the "Favorites" section.',
        'Add items individually with "+" or all at once using "Add All to List".',
        'Saves time when preparing your recurring weekly shopping list.'
      ]
    }
  },
  {
    id: 'most_purchased',
    icon: Trophy,
    title: {
      pt: 'Mais Comprados',
      en: 'Most Purchased'
    },
    summary: {
      pt: 'Ranking automático dos itens mais comprados',
      en: 'Automatic ranking of your most-bought items'
    },
    points: {
      pt: [
        'O app analisa automaticamente os itens marcados como comprado no seu histórico.',
        'Gera o ranking Top 5 e Top 10 com a quantidade total adquirida ao longo do tempo.',
        'Permite adicionar esses produtos direto para a lista atual com apenas um toque.'
      ],
      en: [
        'The app automatically analyzes all items marked as purchased in your history.',
        'Generates Top 5 and Top 10 rankings showing how many times you bought each item.',
        'Add those items straight back into your current shopping list with a single tap.'
      ]
    }
  },
  {
    id: 'category_summary',
    icon: PieChart,
    title: {
      pt: 'Resumo por Categorias',
      en: 'Category Summary'
    },
    summary: {
      pt: 'Visão de gastos, proporções e filtros',
      en: 'Spending breakdown, ratios and status filters'
    },
    points: {
      pt: [
        'Abra o painel "Resumo por Categoria" para ver quanto está gastando em cada setor.',
        'Toque em uma categoria para expandir os produtos que a compõem.',
        'Use os chips de filtro (Todos, Disponíveis, Comprados, Indisponíveis) para focar no que precisa.'
      ],
      en: [
        'Open the "Category Summary" panel to view your spending distributed by sector.',
        'Tap on any category to view individual products and their percentage.',
        'Use status filter chips (All, To Buy, Purchased, Unavailable) to focus on what you need.'
      ]
    }
  },
  {
    id: 'purchase_history',
    icon: History,
    title: {
      pt: 'Histórico de Compras',
      en: 'Purchase History'
    },
    summary: {
      pt: 'Salvar listas, exportar PDF e reutilizar itens',
      en: 'Save trips, export PDF and re-add past items'
    },
    points: {
      pt: [
        'No botão de exportação (topo), você pode salvar a lista finalizada no histórico ou baixar em PDF.',
        'Consulte compras anteriores com data, quantidade de itens e valor total.',
        'Adicione produtos passados de volta à lista com (+) e remova com o botão vermelho se mudar de ideia.',
        'Excluir um histórico exige confirmação para evitar perdas acidentais.'
      ],
      en: [
        'From the export button at top, save your completed shopping list to history or download a PDF.',
        'Review past shopping trips with dates, item counts, and total spent.',
        'Add past items back to your current list with (+) and easily revert with the red button if needed.',
        'Deleting a history entry requires confirmation to prevent accidental loss.'
      ]
    }
  },
  {
    id: 'budget_mode',
    icon: PiggyBank,
    title: {
      pt: 'Modo de Orçamento',
      en: 'Budget Mode'
    },
    summary: {
      pt: 'Defina um teto máximo de gastos e acompanhe',
      en: 'Set a spending ceiling and monitor live'
    },
    points: {
      pt: [
        'Ative o "Modo de Orçamento" nas Configurações e estipule o valor máximo que planeja gastar.',
        'O card no rodapé passa a exibir o teto estipulado e o valor restante.',
        'Se o total ultrapassar o limite, o app exibe um aviso visual em vermelho informando o excesso.'
      ],
      en: [
        'Enable "Budget Mode" in Settings and define the maximum amount you plan to spend.',
        'The footer card displays your budget ceiling and tracks remaining funds in real time.',
        'If your total exceeds the budget, a clear visual warning in red informs the amount over limit.'
      ]
    }
  },
  {
    id: 'theme_currency',
    icon: Palette,
    title: {
      pt: 'Tema e Moeda',
      en: 'Theme & Currency'
    },
    summary: {
      pt: 'Clássico ou Floresta, símbolos de moeda e idioma',
      en: 'Classic or Forest, currency symbols and language'
    },
    points: {
      pt: [
        'Alterne entre os temas "Clássico" (com azul-aço sóbrio) e "Floresta" (verde natural).',
        'Escolha sua moeda preferida (€, $, R$, £) com formatação de valores no padrão adequado.',
        'Troque o idioma entre Português e Inglês com atualização imediata de todos os textos.'
      ],
      en: [
        'Switch between "Classic" (steel blue tones) and "Forest" (natural emerald greens).',
        'Choose your preferred currency (€, $, R$, £) with localized number formatting.',
        'Switch between Portuguese and English instantly for all screens and menus.'
      ]
    }
  }
];

export const AppGuideModal: React.FC<AppGuideModalProps> = ({
  isOpen,
  onClose,
  lang,
  themeConfig
}) => {
  const t = getTranslation(lang);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({
    add_products: true // Primeira seção aberta por padrão para guiar o usuário
  });

  // Trava a rolagem de fundo enquanto o guia estiver aberto
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleSection = (id: string) => {
    setExpandedIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const allExpanded = GUIDE_SECTIONS.every(s => expandedIds[s.id]);

  const toggleExpandAll = () => {
    if (allExpanded) {
      setExpandedIds({});
    } else {
      const all: Record<string, boolean> = {};
      GUIDE_SECTIONS.forEach(s => {
        all[s.id] = true;
      });
      setExpandedIds(all);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[110] flex items-start justify-center pt-[max(env(safe-area-inset-top,16px),16px)] pb-[max(env(safe-area-inset-bottom,16px),16px)] px-3 sm:px-4 animate-in fade-in duration-200 overflow-hidden"
      onClick={onClose}
    >
      {/* Backdrop com blur escurecido: toque fora fecha a janela */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Janela ancorada no topo com altura máxima adaptada (90dvh) e rolagem interna suave */}
      <div 
        className="relative w-full max-w-md rounded-[2rem] border-0 shadow-2xl flex flex-col max-h-[90dvh] animate-in slide-in-from-top duration-300 z-10 overflow-hidden"
        style={{
          maxHeight: '90dvh',
          backgroundColor: themeConfig.colors.card,
          color: themeConfig.colors.text
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        {/* 1. Cabeçalho fixo da janela */}
        <div className="p-5 sm:p-6 pb-3 sm:pb-4 border-b border-black/5 dark:border-white/5 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
              style={{
                backgroundColor: themeConfig.colors.inputBg,
                color: themeConfig.colors.primary
              }}
            >
              <HelpCircle className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <h2 
                style={{ color: themeConfig.colors.text }}
                className="text-base sm:text-lg font-bold leading-tight truncate"
              >
                {t.guideTitle || 'Como usar o app'}
              </h2>
              <p 
                style={{ color: themeConfig.colors.textSecondary }}
                className="text-[10px] font-medium truncate mt-0.5"
              >
                {t.guideSubtitle || 'Guia visual e rápido de todas as funções'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Botão de Fechar com área de toque mínima de 44px */}
            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: themeConfig.colors.inputBg,
                color: themeConfig.colors.textSecondary
              }}
              className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl transition-colors active:scale-95 shrink-0 border-0 cursor-pointer"
              aria-label={t.close}
              title={t.close}
            >
              <X className="w-5 h-5" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Barra superior de ações auxiliares: Contagem e Alternador de Expandir/Recolher */}
        <div className="flex items-center justify-between py-2 px-5 sm:px-6 text-[11px] font-bold shrink-0 border-b border-black/5 dark:border-white/5">
          <span 
            style={{ color: themeConfig.colors.sectionTitle }}
            className="uppercase tracking-wider text-[10px] font-extrabold"
          >
            {GUIDE_SECTIONS.length} {lang === 'en' ? 'Topics' : 'Tópicos'}
          </span>
          <button
            type="button"
            onClick={toggleExpandAll}
            style={{
              color: themeConfig.colors.primary
            }}
            className="text-[11px] font-bold hover:underline border-0 bg-transparent cursor-pointer transition-colors active:opacity-75"
          >
            {allExpanded ? (t.collapseAll || 'Recolher todos') : (t.expandAll || 'Expandir todos')}
          </button>
        </div>

        {/* 2. Conteúdo no meio com rolagem vertical própria */}
        <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 p-5 sm:p-6 py-3 pr-3 custom-scrollbar">
          {GUIDE_SECTIONS.map((section) => {
            const isExpanded = !!expandedIds[section.id];
            const SectionIcon = section.icon;

            return (
              <div 
                key={section.id}
                style={{
                  backgroundColor: themeConfig.colors.inputBg
                }}
                className="rounded-2xl transition-all overflow-hidden border-0 shadow-none"
              >
                {/* Linha de cabeçalho da seção clicável */}
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  className="w-full p-3.5 flex items-center justify-between gap-3 text-left border-0 bg-transparent cursor-pointer transition-all active:scale-[0.99]"
                  aria-expanded={isExpanded}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div 
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform"
                      style={{
                        backgroundColor: themeConfig.colors.card,
                        color: themeConfig.colors.primary
                      }}
                    >
                      <SectionIcon className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <div className="min-w-0">
                      <h3 
                        style={{ color: themeConfig.colors.text }}
                        className="text-xs font-bold truncate leading-snug"
                      >
                        {section.title[lang]}
                      </h3>
                      <p 
                        style={{ color: themeConfig.colors.textSecondary }}
                        className="text-[10px] font-medium truncate mt-0.5"
                      >
                        {section.summary[lang]}
                      </p>
                    </div>
                  </div>

                  <div 
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200"
                    style={{
                      color: themeConfig.colors.textSecondary
                    }}
                  >
                    <ChevronDown 
                      className={`w-4 h-4 transition-transform duration-300 ease-out ${
                        isExpanded ? 'rotate-180' : 'rotate-0'
                      }`} 
                      strokeWidth={2.5}
                    />
                  </div>
                </button>

                {/* Conteúdo expandido com detalhes e marcadores */}
                {isExpanded && (
                  <div className="px-3.5 pb-3.5 pt-0 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div 
                      className="p-3 rounded-xl space-y-2 border-0"
                      style={{
                        backgroundColor: themeConfig.colors.card
                      }}
                    >
                      {section.points[lang].map((point, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs leading-relaxed">
                          <span 
                            className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5"
                            style={{
                              backgroundColor: themeConfig.colors.primary
                            }}
                            aria-hidden="true"
                          />
                          <p 
                            style={{ color: themeConfig.colors.text }}
                            className="font-medium text-[11px] sm:text-xs"
                          >
                            {point}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 3. Rodapé fixo com botão Entendido / Fechar */}
        <div className="p-5 sm:p-6 pt-3 sm:pt-4 border-t border-black/5 dark:border-white/5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: themeConfig.colors.primary,
              color: '#FFFFFF'
            }}
            className="w-full py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider border-0 cursor-pointer active:scale-95 transition-transform shadow-none"
          >
            {lang === 'en' ? 'Got it' : 'Entendido'}
          </button>
        </div>
      </div>
    </div>
  );
};
