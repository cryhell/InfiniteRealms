import React, { useEffect, useRef, useState } from 'react';
import { GameState, AdventureNode, GameEffect, WorldEvent } from '../types';
import { Sidebar } from './Sidebar';
import { ChevronRight, Loader2, Sword, Shield, Swords, Zap, Footprints, Backpack, Menu, X, Plus, Skull, RefreshCw, Home, Sparkles, Book, Heart, AlertOctagon, Coins, CloudLightning } from 'lucide-react';
import { MarkdownText } from './MarkdownText';

interface GameInterfaceProps {
  gameState: GameState;
  history: AdventureNode[];
  onChoice: (choice: string) => void;
  loading: boolean;
  effect?: GameEffect;
  onRestart: () => void;
  onMainMenu: () => void;
  onOpenSkills: () => void;
  onOpenCodex: () => void;
  onInspectItem?: (item: string) => void;
  activeEvent?: WorldEvent | null;
}

export const GameInterface: React.FC<GameInterfaceProps> = ({ gameState, history, onChoice, loading, effect, onRestart, onMainMenu, onOpenSkills, onOpenCodex, onInspectItem, activeEvent }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // Auto-scroll to bottom of story when history updates
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [history, loading]);

  const lastNode = history[history.length - 1];
  const isCombat = gameState.inCombat;
  const isGameOver = gameState.health <= 0;
  const isSliceOfLife = gameState.genre.includes("Slice of Life");
  
  // Enemy Health Calculation
  const enemyHealth = gameState.enemyHealth || 0;
  const enemyMax = gameState.enemyMaxHealth || 100;
  const enemyPercent = Math.max(0, Math.min(100, (enemyHealth / enemyMax) * 100));

  const newCodexCount = gameState.codex?.filter(c => c.isNew).length || 0;

  const getActionType = (text: string) => {
    const t = text.toLowerCase();
    // Attack Verbs
    if (t.match(/attack|strike|fight|shoot|slash|blast|cast|punch|kick|thrust|swing|charge|destroy|crush/)) return 'ATTACK';
    // Defend Verbs
    if (t.match(/defend|block|dodge|parry|guard|shield|cover|avoid|duck/)) return 'DEFEND';
    // Item Verbs
    if (t.match(/item|potion|use|drink|equip|consume|read|throw|apply/)) return 'ITEM';
    // Flee Verbs
    if (t.match(/flee|run|retreat|escape|leave|withdraw|scramble/)) return 'FLEE';
    // Social Verbs (Slice of Life)
    if (t.match(/talk|ask|date|kiss|hug|flirt|compliment|gift|comfort/)) return 'SOCIAL';
    return null;
  };

  const getEventIcon = (type: string) => {
    switch(type) {
      case 'danger': return <AlertOctagon size={24} className="text-red-500" />;
      case 'opportunity': return <Coins size={24} className="text-yellow-500" />;
      default: return <CloudLightning size={24} className="text-blue-400" />;
    }
  };

  const getEventColor = (type: string) => {
    switch(type) {
      case 'danger': return 'border-red-900 bg-red-950/80 text-red-100 shadow-[0_0_20px_rgba(220,38,38,0.3)]';
      case 'opportunity': return 'border-yellow-900 bg-yellow-950/80 text-yellow-100 shadow-[0_0_20px_rgba(234,179,8,0.3)]';
      default: return 'border-blue-900 bg-blue-950/80 text-blue-100 shadow-[0_0_20px_rgba(59,130,246,0.3)]';
    }
  };

  return (
    <div className={`flex flex-col md:flex-row w-full h-full overflow-hidden transition-colors duration-500 relative ${isGameOver ? 'grayscale-[50%]' : ''} ${isCombat ? 'shadow-[inset_0_0_50px_rgba(220,38,38,0.2)] border-red-900/30' : ''} ${effect === 'hit' ? 'animate-shake' : ''}`}>
      
      {/* Visual Effects Overlays */}
      {effect === 'attack' && (
        <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center overflow-hidden">
          <svg className="w-full h-full absolute" viewBox="0 0 100 100" preserveAspectRatio="none">
            <filter id="glow">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <path 
              d="M-10,110 L110,-10" 
              stroke="white" 
              strokeWidth="1.5" 
              fill="none" 
              filter="url(#glow)"
              className="animate-slash opacity-90" 
            />
          </svg>
        </div>
      )}

      {effect === 'hit' && (
        <div className="absolute inset-0 z-50 pointer-events-none">
          <div className="absolute inset-0 bg-red-600/20 mix-blend-overlay animate-pulse"></div>
          <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(220,38,38,0.5)]"></div>
        </div>
      )}

      {effect === 'defend' && (
        <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center">
            <div className="animate-ping opacity-75">
               <Shield size={120} className="text-blue-400/30" />
            </div>
            <div className="absolute inset-0 bg-blue-500/10 animate-pulse transition-opacity duration-300"></div>
        </div>
      )}

      {effect === 'heal' && (
        <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center">
           <div className="absolute inset-0 bg-emerald-500/10 animate-pulse transition-opacity duration-1000"></div>
           <div className="animate-bounce">
              <Plus size={80} className="text-emerald-400/50 drop-shadow-[0_0_15px_rgba(16,185,129,0.8)]" />
           </div>
        </div>
      )}

      {effect === 'heart' && (
        <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center">
           <div className="absolute inset-0 bg-pink-500/10 animate-pulse transition-opacity duration-1000"></div>
           <div className="animate-bounce">
              <Heart size={80} fill="currentColor" className="text-pink-400/80 drop-shadow-[0_0_15px_rgba(236,72,153,0.8)]" />
           </div>
        </div>
      )}
      
      {effect === 'levelUp' && (
        <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center">
           <div className="absolute inset-0 bg-indigo-500/10 animate-pulse transition-opacity duration-1000"></div>
           <div className="flex flex-col items-center animate-bounce">
              <Sparkles size={80} className="text-indigo-400/80 drop-shadow-[0_0_20px_rgba(99,102,241,1)] mb-2" />
              <div className="text-3xl font-display font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">LEVEL UP</div>
           </div>
        </div>
      )}

      {effect === 'event' && (
        <div className="absolute inset-0 z-40 pointer-events-none bg-white/5 animate-pulse"></div>
      )}

      {/* Mobile Character Menu Toggle */}
      <button 
        onClick={() => setSidebarOpen(!isSidebarOpen)}
        className="md:hidden absolute top-4 right-4 z-40 bg-gray-900/90 text-indigo-400 p-2 rounded-full border border-gray-700 shadow-lg"
      >
        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Main Story Area */}
      <div className="flex-1 flex flex-col h-full relative min-w-0">
        
        {/* Scrollable Story Log */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto relative scroll-smooth px-4 sm:px-6 md:px-8 py-4">
          
          {/* EVENT BANNER - Shows when a dynamic event triggers */}
          {activeEvent && !loading && (
            <div className={`
              mx-auto max-w-2xl mb-8 p-4 rounded-xl border-l-4 animate-fade-in flex items-start gap-4 relative overflow-hidden backdrop-blur-md
              ${getEventColor(activeEvent.type)}
            `}>
               <div className="absolute right-0 top-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
                 {getEventIcon(activeEvent.type)}
               </div>
               <div className="shrink-0 p-2 bg-black/20 rounded-full">
                  {getEventIcon(activeEvent.type)}
               </div>
               <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">World Event</div>
                  <h3 className="text-lg font-display font-bold leading-none mb-2">{activeEvent.title}</h3>
                  <p className="text-sm opacity-90 leading-relaxed font-serif">{activeEvent.description}</p>
               </div>
            </div>
          )}

          {/* Sticky Combat Header - Compact Version */}
          {isCombat && !isGameOver && (
            <div className="sticky top-0 z-30 w-full mb-4 mx-auto max-w-lg">
              <div className="bg-gradient-to-r from-red-950/95 via-red-900/95 to-red-950/95 border border-red-500/30 rounded-lg p-2 shadow-xl backdrop-blur-md flex flex-col items-center justify-between animate-fade-in relative overflow-hidden">
                 
                 {/* Top Row: Name, VS, Status */}
                 <div className="flex items-center justify-between w-full mb-1.5">
                    <div className="text-left w-2/5 pl-1 relative z-10">
                        <div className="flex items-center justify-between mb-0.5">
                          <div className="font-display font-bold text-white text-sm leading-none truncate pr-2">{gameState.enemyName}</div>
                          <div className="text-[10px] text-red-300 font-mono">{enemyHealth}/{enemyMax}</div>
                        </div>
                        {/* Enemy Health Bar */}
                        <div className="w-full h-1 bg-red-950 border border-red-900 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-red-500 transition-all duration-500 ease-out" 
                            style={{ width: `${enemyPercent}%` }}
                          ></div>
                        </div>
                    </div>
                    
                    <div className="font-black text-lg text-red-500 italic px-2 relative z-10">VS</div>
                    
                    <div className="text-right w-2/5 pr-1 relative z-10">
                        <div className="text-[9px] text-red-300 font-bold uppercase tracking-wider">Status</div>
                        <div className="font-display font-bold text-red-100 text-xs leading-none">
                            {isSliceOfLife ? "ARGUMENT" : "ENGAGED"}
                        </div>
                    </div>
                 </div>

                 {/* Bottom Row: Enemy Abilities */}
                 {gameState.enemyAbilities && gameState.enemyAbilities.length > 0 && (
                   <div className="w-full border-t border-red-900/30 pt-1.5 mt-0.5 flex flex-wrap justify-center gap-1.5 relative z-10">
                     {gameState.enemyAbilities.map((ability, i) => (
                       <span key={i} className="text-[9px] font-medium px-1.5 py-0.5 rounded-sm bg-red-950/60 text-red-300 border border-red-800/40 tracking-tight flex items-center">
                         <Zap size={8} className="mr-0.5 text-red-400" />
                         {ability}
                       </span>
                     ))}
                   </div>
                 )}
                 
                 {/* Background decoration */}
                 <div className="absolute -right-4 -top-4 w-16 h-16 bg-red-500/10 rounded-full blur-xl"></div>
                 <div className="absolute -left-4 -bottom-4 w-16 h-16 bg-orange-500/10 rounded-full blur-xl"></div>
              </div>
            </div>
          )}

          <div className="space-y-6 pb-4 max-w-3xl mx-auto">
            {history.map((node, index) => (
              <div key={index} className={`animate-fade-in ${index === history.length - 1 ? 'mb-2' : 'opacity-70 hover:opacity-100 transition-opacity'}`}>
                <div className="prose prose-invert prose-indigo max-w-none">
                   <MarkdownText content={node.storySegment} />
                </div>
              </div>
            ))}
            
            {loading && (
               <div className="flex items-center gap-3 text-gray-500 animate-pulse py-4">
                  <Loader2 className="animate-spin" size={18} />
                  <span className="font-serif italic text-sm">Fate is weaving...</span>
               </div>
            )}

            {isGameOver && (
               <div className="mt-8 p-6 bg-red-950/30 border border-red-900/50 rounded-xl flex flex-col items-center justify-center animate-fade-in text-center">
                   <Skull className="w-16 h-16 text-red-500 mb-4 animate-pulse" />
                   <h2 className="text-3xl font-display font-bold text-white mb-2">
                      {isSliceOfLife ? "Socially Ruined" : "Fate has Fallen"}
                   </h2>
                   <p className="text-red-300 max-w-md">
                      {isSliceOfLife ? "Your reputation is in tatters and your social battery is drained." : "Your journey has come to a tragic end in this timeline."}
                   </p>
               </div>
            )}
          </div>
        </div>

        {/* Input / Choices Area - Compact Grid */}
        <div className={`flex-none p-3 sm:p-4 border-t shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20 relative transition-colors duration-300 ${isGameOver ? 'bg-red-950/10 border-red-900/50' : isCombat ? 'bg-red-950/20 border-red-900/30' : 'bg-gray-950 border-gray-800'}`}>
          <div className="max-w-4xl mx-auto w-full">
            {isGameOver ? (
               <div className="flex flex-col sm:flex-row gap-4 justify-center items-center py-2 animate-fade-in">
                  <button
                    onClick={onRestart}
                    className="flex items-center gap-2 px-6 py-3 bg-red-700 hover:bg-red-600 text-white rounded-lg font-bold transition-all hover:scale-105 shadow-lg shadow-red-900/40"
                  >
                    <RefreshCw size={18} />
                    Try Again
                  </button>
                  <button
                    onClick={onMainMenu}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg font-medium transition-all"
                  >
                    <Home size={18} />
                    Main Menu
                  </button>
               </div>
            ) : (
              <div className="flex gap-2">
                 {/* Skill Tree Button */}
                 <button
                   onClick={onOpenSkills}
                   className="hidden sm:flex flex-col items-center justify-center p-2 w-12 rounded-md border border-gray-700 hover:border-indigo-500/50 bg-gray-900 hover:bg-gray-800 transition-all text-gray-400 hover:text-white relative group shrink-0"
                   title="Character Skills"
                 >
                    <Sparkles size={20} />
                    {gameState.skillPoints > 0 && (
                       <span className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full animate-pulse shadow-lg shadow-indigo-500/50"></span>
                    )}
                 </button>
                 
                 {/* Codex Button */}
                 <button
                   onClick={onOpenCodex}
                   className="hidden sm:flex flex-col items-center justify-center p-2 w-12 rounded-md border border-gray-700 hover:border-indigo-500/50 bg-gray-900 hover:bg-gray-800 transition-all text-gray-400 hover:text-white relative group shrink-0"
                   title="Codex & Journal"
                 >
                    <Book size={20} />
                    {newCodexCount > 0 && (
                       <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 text-[9px] bg-emerald-500 text-black font-bold rounded-full animate-bounce shadow-lg">
                          {newCodexCount}
                       </span>
                    )}
                 </button>

                 <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
                    {lastNode?.choices.map((choice, idx) => {
                    const actionType = getActionType(choice);
                    const isAttack = actionType === 'ATTACK';
                    const isDefend = actionType === 'DEFEND';
                    const isItem = actionType === 'ITEM';
                    const isFlee = actionType === 'FLEE';
                    const isSocial = actionType === 'SOCIAL';
                    
                    let buttonClass = "bg-gray-800/60 border-gray-700/50 hover:bg-indigo-900/40 hover:border-indigo-500/50 text-gray-200";
                    
                    if (isCombat) {
                        if (isAttack) buttonClass = "bg-red-900/20 border-red-800/50 hover:bg-red-900/40 hover:border-red-500 text-red-100";
                        else if (isDefend) buttonClass = "bg-blue-900/20 border-blue-800/50 hover:bg-blue-900/40 hover:border-blue-500 text-blue-100";
                        else if (isItem) buttonClass = "bg-emerald-900/20 border-emerald-800/50 hover:bg-emerald-900/40 hover:border-emerald-500 text-emerald-100";
                        else if (isFlee) buttonClass = "bg-yellow-900/20 border-yellow-800/50 hover:bg-yellow-900/40 hover:border-yellow-500 text-yellow-100";
                    } else if (isSocial) {
                        buttonClass = "bg-pink-900/20 border-pink-800/50 hover:bg-pink-900/40 hover:border-pink-500 text-pink-100";
                    }

                    return (
                        <button
                        key={idx}
                        onClick={() => onChoice(choice)}
                        disabled={loading}
                        className={`
                            group relative flex items-start w-full p-2.5 rounded-md 
                            border shadow-sm
                            disabled:opacity-50 disabled:cursor-not-allowed
                            transition-all duration-200 text-left
                            ${buttonClass}
                        `}
                        >
                        {/* Hover Indicator Line */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 bg-transparent rounded-l-md transition-colors 
                            ${isCombat && isAttack ? 'group-hover:bg-red-500' : 
                            isCombat && isDefend ? 'group-hover:bg-blue-500' :
                            isCombat && isItem ? 'group-hover:bg-emerald-500' :
                            isCombat && isFlee ? 'group-hover:bg-yellow-500' :
                            isSocial ? 'group-hover:bg-pink-500' :
                            'group-hover:bg-indigo-500'
                            }`}></div>
                        
                        {/* Compact Icon */}
                        {isCombat && isAttack && <Sword size={14} className="mr-2 mt-[3px] text-red-500 shrink-0" />}
                        {isCombat && isDefend && <Shield size={14} className="mr-2 mt-[3px] text-blue-500 shrink-0" />}
                        {isCombat && isItem && <Backpack size={14} className="mr-2 mt-[3px] text-emerald-500 shrink-0" />}
                        {isCombat && isFlee && <Footprints size={14} className="mr-2 mt-[3px] text-yellow-500 shrink-0" />}
                        {isSocial && <Heart size={14} className="mr-2 mt-[3px] text-pink-500 shrink-0" />}
                        {!isCombat && !isSocial && <ChevronRight className="mr-2 mt-[3px] text-indigo-500/50 group-hover:text-indigo-400 shrink-0" size={14} />}
                        
                        <span className="flex-1 font-sans text-sm font-medium group-hover:text-white transition-colors">
                            {choice}
                        </span>
                        </button>
                    )
                    })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar Drawer (Mobile) / Column (Desktop) */}
      <div className={`
        fixed inset-0 z-30 md:static md:inset-auto md:z-auto
        md:w-72 lg:w-80 border-l border-gray-800 bg-gray-950/95 md:bg-gray-950/50
        transition-transform duration-300 transform
        ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
      `}>
        {/* Scrollable Container for Sidebar Content */}
        <div className="h-full overflow-y-auto p-4 md:p-6 pt-16 md:pt-6 custom-scrollbar relative">
          <Sidebar gameState={gameState} onInspect={onInspectItem} loading={loading} />
          
           {/* Mobile Buttons in Sidebar */}
           <div className="mt-4 md:hidden space-y-2">
             <button
                onClick={onOpenSkills}
                className="w-full flex items-center justify-center gap-2 p-3 bg-indigo-900/20 border border-indigo-500/50 rounded-lg text-indigo-300 hover:bg-indigo-900/40 transition-colors"
             >
                <Sparkles size={16} />
                <span>Skills & Abilities</span>
                {gameState.skillPoints > 0 && (
                   <span className="ml-1 px-2 py-0.5 text-xs bg-indigo-600 text-white rounded-full">
                     {gameState.skillPoints}
                   </span>
                )}
             </button>
             <button
                onClick={onOpenCodex}
                className="w-full flex items-center justify-center gap-2 p-3 bg-indigo-900/20 border border-indigo-500/50 rounded-lg text-indigo-300 hover:bg-indigo-900/40 transition-colors"
             >
                <Book size={16} />
                <span>Codex & Journal</span>
                {newCodexCount > 0 && (
                   <span className="ml-1 px-2 py-0.5 text-xs bg-emerald-500 text-gray-900 font-bold rounded-full">
                     {newCodexCount}
                   </span>
                )}
             </button>
           </div>
        </div>
      </div>

      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-20 md:hidden"
        ></div>
      )}

    </div>
  );
};