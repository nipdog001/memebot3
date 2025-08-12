import { useState, useEffect, useCallback } from 'react';

interface DashboardCard {
  id: string;
  title: string;
  component: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  visible: boolean;
  order: number;
}

const DEFAULT_CARDS: DashboardCard[] = [
  {
    id: 'trading-controls', 
    title: 'Trading Controls',
    component: 'TradingControls',
    position: { x: 0, y: 0 },
    size: { width: 12, height: 1 },
    visible: true,
    order: 0
  },
  {
    id: 'hot-pairs-ticker', 
    title: 'Hot Pairs Ticker',
    component: 'HotPairsTicker',
    position: { x: 0, y: 1 },
    size: { width: 12, height: 1 },
    visible: true,
    order: 1
  },
  {
    id: 'pl-cards', 
    title: "Performance Statistics",
    component: 'PLCards',
    position: { x: 0, y: 2 },
    size: { width: 12, height: 1 },
    visible: true,
    order: 2
  },
  {
    id: 'recent-trades',
    title: 'Recent Trading Activity',
    component: 'RecentTrades',
    position: { x: 0, y: 4 },
    size: { width: 8, height: 2 },
    visible: true,
    order: 3
  },
  {
    id: 'social-signals',
    title: 'Social Signal Integration',
    component: 'SocialSignalIntegration',
    position: { x: 8, y: 4 },
    size: { width: 4, height: 2 },
    visible: true,
    order: 4
  }
];

export function useDraggableDashboard() {
  const [cards, setCards] = useState<DashboardCard[]>(DEFAULT_CARDS);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedCard, setDraggedCard] = useState<string | null>(null);
  const [isCustomizing, setIsCustomizing] = useState(false);

  // Load saved layout on mount
  useEffect(() => {
    loadLayout();
  }, []);

  // Auto-save when layout changes
  useEffect(() => {
    saveLayout();
  }, [cards]);

  const loadLayout = () => {
    try {
      const savedLayout = localStorage.getItem('memebot_dashboard_layout');
      if (savedLayout) {
        const parsed = JSON.parse(savedLayout);
        // Merge with default cards to ensure new cards are included
        const mergedCards = DEFAULT_CARDS.map(defaultCard => {
          const savedCard = parsed.find((c: DashboardCard) => c.id === defaultCard.id);
          return savedCard ? { ...defaultCard, ...savedCard } : defaultCard;
        });
        
        // Add any new cards that weren't in the saved layout
        const newCards = DEFAULT_CARDS.filter(defaultCard => 
          !parsed.find((c: DashboardCard) => c.id === defaultCard.id)
        );
        
        setCards([...mergedCards, ...newCards]);
      }
    } catch (error) {
      console.error('Error loading dashboard layout:', error);
      setCards(DEFAULT_CARDS);
    }
  };

  const saveLayout = () => {
    try {
      localStorage.setItem('memebot_dashboard_layout', JSON.stringify(cards));
    } catch (error) {
      console.error('Error saving dashboard layout:', error);
    }
  };

  const updateCardPosition = useCallback((cardId: string, newPosition: { x: number; y: number }) => {
    setCards(prevCards => 
      prevCards.map(card => 
        card.id === cardId ? { ...card, position: newPosition } : card
      )
    );
  }, []);

  const updateCardSize = useCallback((cardId: string, newSize: { width: number; height: number }) => {
    setCards(prevCards => 
      prevCards.map(card => 
        card.id === cardId ? { ...card, size: newSize } : card
      )
    );
  }, []);

  const toggleCardVisibility = useCallback((cardId: string) => {
    setCards(prevCards => 
      prevCards.map(card => 
        card.id === cardId ? { ...card, visible: !card.visible } : card
      )
    );
  }, []);

  const reorderCards = useCallback((cardId: string, newOrder: number) => {
    setCards(prevCards => {
      const cardToMove = prevCards.find(card => card.id === cardId);
      if (!cardToMove) return prevCards;

      const otherCards = prevCards.filter(card => card.id !== cardId);
      
      // Adjust order of other cards
      const adjustedCards = otherCards.map(card => {
        if (card.order >= newOrder) {
          return { ...card, order: card.order + 1 };
        }
        return card;
      });

      return [...adjustedCards, { ...cardToMove, order: newOrder }]
        .sort((a, b) => a.order - b.order);
    });
  }, []);

  const resetLayout = useCallback(() => {
    setCards(DEFAULT_CARDS);
    localStorage.removeItem('memebot_dashboard_layout');
  }, []);

  const getVisibleCards = useCallback(() => {
    return cards.filter(card => card.visible).sort((a, b) => a.order - b.order);
  }, [cards]);

  const getCardById = useCallback((cardId: string) => {
    return cards.find(card => card.id === cardId);
  }, [cards]);

  const startDragging = useCallback((cardId: string) => {
    setIsDragging(true);
    setDraggedCard(cardId);
  }, []);

  const stopDragging = useCallback(() => {
    setIsDragging(false);
    setDraggedCard(null);
  }, []);

  const toggleCustomization = useCallback(() => {
    setIsCustomizing(prev => !prev);
    if (isDragging) {
      stopDragging();
    }
  }, [isDragging, stopDragging]);

  return {
    cards,
    isDragging,
    draggedCard,
    isCustomizing,
    updateCardPosition,
    updateCardSize,
    toggleCardVisibility,
    reorderCards,
    resetLayout,
    getVisibleCards,
    getCardById,
    startDragging,
    stopDragging,
    toggleCustomization
  };
}