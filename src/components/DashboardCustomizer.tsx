import React from 'react';
import { Settings, Eye, EyeOff, RotateCcw, Save, Grid, Layout } from 'lucide-react';

interface DashboardCard {
  id: string;
  title: string;
  component: string;
  visible: boolean;
  order: number;
}

interface DashboardCustomizerProps {
  cards: DashboardCard[];
  isCustomizing: boolean;
  onToggleCustomization: () => void;
  onToggleCardVisibility: (cardId: string) => void;
  onResetLayout: () => void;
}

export default function DashboardCustomizer({
  cards,
  isCustomizing,
  onToggleCustomization,
  onToggleCardVisibility,
  onResetLayout
}: DashboardCustomizerProps) {
  const visibleCards = cards.filter(card => card.visible);
  const hiddenCards = cards.filter(card => !card.visible);

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Layout className="h-5 w-5 text-blue-400" />
          <h3 className="text-lg font-bold text-white">Dashboard Customization</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onResetLayout}
            className="flex items-center space-x-1 px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-all"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset</span>
          </button>
          <button
            onClick={onToggleCustomization}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-all ${
              isCustomizing 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isCustomizing ? (
              <>
                <Save className="h-4 w-4" />
                <span>Save Layout</span>
              </>
            ) : (
              <>
                <Settings className="h-4 w-4" />
                <span>Customize</span>
              </>
            )}
          </button>
        </div>
      </div>

      {isCustomizing && (
        <div className="space-y-4">
          <div className="bg-blue-600/20 border border-blue-600/30 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <Grid className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-400">Customization Mode Active</span>
            </div>
            <p className="text-xs text-gray-300">
              Drag cards to reposition them, toggle visibility, or reset to default layout. 
              Click "Save Layout" when you're done customizing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Visible Cards */}
            <div>
              <h4 className="font-semibold text-white mb-3">Visible Cards ({visibleCards.length})</h4>
              <div className="space-y-2">
                {visibleCards.map(card => (
                  <div key={card.id} className="flex items-center justify-between bg-slate-700 rounded-lg p-3">
                    <span className="text-white font-medium">{card.title}</span>
                    <button
                      onClick={() => onToggleCardVisibility(card.id)}
                      className="text-green-400 hover:text-green-300"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Hidden Cards */}
            <div>
              <h4 className="font-semibold text-white mb-3">Hidden Cards ({hiddenCards.length})</h4>
              <div className="space-y-2">
                {hiddenCards.length === 0 ? (
                  <div className="text-gray-400 text-sm italic">All cards are visible</div>
                ) : (
                  hiddenCards.map(card => (
                    <div key={card.id} className="flex items-center justify-between bg-slate-700/50 rounded-lg p-3">
                      <span className="text-gray-400 font-medium">{card.title}</span>
                      <button
                        onClick={() => onToggleCardVisibility(card.id)}
                        className="text-gray-400 hover:text-white"
                      >
                        <EyeOff className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {!isCustomizing && (
        <div className="text-center py-4">
          <p className="text-gray-400 mb-3">
            Customize your dashboard layout by showing/hiding cards and rearranging them to your preference.
          </p>
          <div className="text-sm text-gray-500">
            Currently showing {visibleCards.length} of {cards.length} available cards
          </div>
        </div>
      )}
    </div>
  );
}