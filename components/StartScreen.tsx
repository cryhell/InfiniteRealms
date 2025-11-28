import React, { useState } from 'react';
import { Genre, GENRE_DESCRIPTIONS, GameState, PlayerPersona } from '../types';
import { Scroll, Sword, Cpu, Radiation, Ghost, Search, Edit3, Save, Play, ChevronRight, Coffee, UserPlus, UserCheck } from 'lucide-react';
import { PersonaModal } from './PersonaModal';

interface StartScreenProps {
  onStart: (genre: string, customPrompt?: string, persona?: PlayerPersona) => void;
  onResume: () => void;
  savedGameState: GameState | null;
  isLoading: boolean;
  activeGameState?: GameState | null;
  onContinue?: () => void;
}

const ICONS: Record<Genre, React.ElementType> = {
  [Genre.Fantasy]: Sword,
  [Genre.SciFi]: Cpu,
  [Genre.PostApocalyptic]: Radiation,
  [Genre.Wuxia]: Scroll,
  [Genre.SliceOfLife]: Coffee,
  [Genre.Mystery]: Search,
  [Genre.Horror]: Ghost,
  [Genre.Custom]: Edit3,
};

export const StartScreen: React.FC<StartScreenProps> = ({ 
  onStart, 
  onResume, 
  savedGameState, 
  isLoading,
  activeGameState,
  onContinue 
}) => {
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [persona, setPersona] = useState<PlayerPersona | null>(null);
  const [showPersonaModal, setShowPersonaModal] = useState(false);

  const handleStart = () => {
    if (selectedGenre) {
      onStart(selectedGenre, selectedGenre === Genre.Custom ? customPrompt : undefined, persona || undefined);
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto custom-scrollbar p-4 flex flex-col items-center justify-center">
      <div className="max-w-5xl w-full flex flex-col h-full md:h-auto justify-center">
        
        {/* Header - Compact */}
        <div className="text-center mb-6 shrink-0">
          <h2 className="text-3xl md:text-4xl font-display text-white mb-2">Choose Your Destiny</h2>
          <p className="text-gray-400 text-sm">Select a realm to begin your infinite adventure.</p>
        </div>

        <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-y-auto md:overflow-visible pr-1 md:pr-0">
            {/* Action Buttons (Continue / Load) */}
            {(activeGameState || savedGameState) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">
                {activeGameState && onContinue && (
                  <button 
                    onClick={onContinue}
                    className="p-4 rounded-xl border border-blue-500/50 bg-blue-900/20 hover:bg-blue-900/30 flex items-center justify-between group transition-all"
                  >
                      <div className="text-left overflow-hidden">
                        <div className="flex items-center gap-2 text-blue-400 mb-1">
                            <Play size={14} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Continue</span>
                        </div>
                        <h3 className="text-lg font-display text-white truncate">{activeGameState.genre}</h3>
                        <p className="text-blue-200/70 text-xs font-mono truncate">
                          Turn {activeGameState.turnCount} • {activeGameState.location}
                        </p>
                      </div>
                      <ChevronRight size={20} className="text-blue-400" />
                  </button>
                )}

                {savedGameState && (
                  <button 
                    onClick={onResume}
                    className="p-4 rounded-xl border border-emerald-500/50 bg-emerald-900/20 hover:bg-emerald-900/30 flex items-center justify-between group transition-all"
                  >
                      <div className="text-left overflow-hidden">
                        <div className="flex items-center gap-2 text-emerald-400 mb-1">
                            <Save size={14} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Load Save</span>
                        </div>
                        <h3 className="text-lg font-display text-white truncate">{savedGameState.genre}</h3>
                        <p className="text-emerald-200/70 text-xs font-mono truncate">
                          Turn {savedGameState.turnCount} • {savedGameState.location}
                        </p>
                      </div>
                      <Play size={20} className="text-emerald-400" />
                  </button>
                )}
              </div>
            )}

            {/* Separator if needed */}
            {(activeGameState || savedGameState) && (
                <div className="flex items-center gap-4 shrink-0 opacity-50">
                    <div className="h-px bg-gray-700 flex-1"></div>
                    <span className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">New Adventure</span>
                    <div className="h-px bg-gray-700 flex-1"></div>
                </div>
            )}

            {/* Genre Grid - Optimized for space */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(Object.keys(Genre) as Array<keyof typeof Genre>).map((key) => {
                const genre = Genre[key];
                const Icon = ICONS[genre];
                const isSelected = selectedGenre === genre;

                return (
                <button
                    key={genre}
                    onClick={() => setSelectedGenre(genre)}
                    disabled={isLoading}
                    className={`
                    relative p-3 rounded-lg border text-left transition-all duration-300 group flex flex-col h-full
                    ${isSelected 
                        ? 'border-indigo-500 bg-indigo-900/20 shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
                        : 'border-gray-800 bg-gray-900/40 hover:border-gray-600 hover:bg-gray-800/60'
                    }
                    `}
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`
                            p-2 rounded-lg transition-colors shrink-0
                            ${isSelected ? 'bg-indigo-500 text-white' : 'bg-gray-800 text-gray-400 group-hover:text-white group-hover:bg-gray-700'}
                        `}>
                            <Icon size={18} />
                        </div>
                        <h3 className={`text-sm font-bold leading-tight ${isSelected ? 'text-white' : 'text-gray-200'}`}>
                            {genre}
                        </h3>
                    </div>
                    
                    <p className="text-xs text-gray-400 leading-relaxed opacity-80 line-clamp-2">
                        {GENRE_DESCRIPTIONS[genre]}
                    </p>
                </button>
                );
            })}
            </div>

            {/* Custom Prompt Input */}
            {selectedGenre === Genre.Custom && (
            <div className="w-full animate-fade-in shrink-0">
                <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Describe your custom world..."
                className="w-full h-20 bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none transition-all"
                />
            </div>
            )}
        </div>

        {/* Start Button - Footer */}
        <div className="flex flex-col md:flex-row gap-3 justify-center pt-6 shrink-0">
          
          <button
            onClick={() => setShowPersonaModal(true)}
            className={`
              flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold text-sm tracking-wide transition-all duration-300 border
              ${persona 
                 ? 'bg-indigo-900/30 border-indigo-500 text-indigo-200 hover:bg-indigo-900/50' 
                 : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white hover:border-gray-500'
              }
            `}
          >
             {persona ? <UserCheck size={18} /> : <UserPlus size={18} />}
             {persona ? `Playing as ${persona.name}` : 'Create Character'}
          </button>

          <button
            onClick={handleStart}
            disabled={!selectedGenre || isLoading || (selectedGenre === Genre.Custom && !customPrompt.trim())}
            className={`
              w-full md:w-auto px-12 py-3 rounded-full font-bold text-base tracking-wide transition-all duration-300
              ${(!selectedGenre || isLoading) 
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:scale-105 active:scale-95'
              }
            `}
          >
            {isLoading ? 'Weaving Reality...' : 'Begin Adventure'}
          </button>
        </div>
      </div>

      {showPersonaModal && (
          <PersonaModal 
            initialPersona={persona} 
            genre={selectedGenre}
            onSave={(p) => { setPersona(p); setShowPersonaModal(false); }}
            onClose={() => setShowPersonaModal(false)}
          />
      )}
    </div>
  );
};