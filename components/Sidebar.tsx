import React, { useState } from 'react';
import { GameState } from '../types';
import { Backpack, MapPin, Compass, Globe, Flag, ChevronDown, User, Sparkles, Search, Heart, Users, Swords, Skull, MessageCircle, Award, Star } from 'lucide-react';

interface SidebarProps {
  gameState: GameState;
  className?: string;
  onInspect?: (item: string) => void;
  loading?: boolean;
}

const Section: React.FC<{
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  colorClass: string;
  defaultOpen?: boolean;
}> = ({ title, icon: Icon, children, colorClass, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`rounded-lg border border-gray-800 bg-gray-900/40 overflow-hidden mb-3 transition-all duration-300 ${isOpen ? 'shadow-md' : ''}`}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 hover:bg-gray-800/50 transition-colors"
      >
        <div className={`flex items-center gap-2 ${colorClass}`}>
          <Icon size={16} />
          <span className="text-xs font-bold uppercase tracking-wider">{title}</span>
        </div>
        <ChevronDown 
          size={14} 
          className={`text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>
      
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="p-3 pt-0 border-t border-gray-800/30">
          {children}
        </div>
      </div>
    </div>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ gameState, className, onInspect, loading }) => {
  const healthPercent = Math.max(0, Math.min(100, (gameState.health / gameState.maxHealth) * 100));
  
  // XP Calculation
  const currentXP = gameState.xp || 0;
  const xpThreshold = (gameState.level || 1) * 100;
  const xpPercent = Math.min(100, (currentXP / xpThreshold) * 100);

  const isSliceOfLife = gameState.genre.includes("Slice of Life");

  const getHealthColor = (p: number) => {
    if (p > 60) return isSliceOfLife ? 'bg-pink-500' : 'bg-emerald-500';
    if (p > 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getRelationshipStyle = (status: string, affinity: number) => {
      switch(status) {
          case 'Rival': return { text: 'text-orange-400', bar: 'bg-orange-500', icon: Swords };
          case 'Nemesis': return { text: 'text-red-500', bar: 'bg-red-600', icon: Skull };
          case 'Enemy': return { text: 'text-red-400', bar: 'bg-red-500', icon: Skull };
          case 'Crush': return { text: 'text-pink-400 font-bold', bar: 'bg-pink-500', icon: Heart };
          case 'Partner': return { text: 'text-purple-400 font-bold', bar: 'bg-purple-500', icon: Heart };
          case 'Confidant': return { text: 'text-teal-400', bar: 'bg-teal-500', icon: MessageCircle };
          case 'Mentor': return { text: 'text-yellow-400', bar: 'bg-yellow-500', icon: Star };
          case 'Protege': return { text: 'text-blue-300', bar: 'bg-blue-400', icon: Award };
          case 'Ally': return { text: 'text-emerald-300', bar: 'bg-emerald-400', icon: User };
          case 'Complicated': return { text: 'text-indigo-300 italic', bar: 'bg-indigo-400', icon: Users };
          default:
             if (affinity > 80) return { text: 'text-emerald-400', bar: 'bg-emerald-500', icon: User };
             if (affinity < 25) return { text: 'text-gray-400', bar: 'bg-gray-500', icon: User };
             return { text: 'text-blue-300', bar: 'bg-blue-400', icon: User };
      }
  };

  const getVisibleFlags = () => {
    const flags = gameState.worldState;
    return Object.entries(flags)
      .filter(([_, value]) => value !== false && value !== null)
      .map(([key, value]) => {
        const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        const displayValue = value === true ? '' : `: ${value}`;
        return { label, displayValue, key };
      });
  };

  const visibleFlags = getVisibleFlags();
  const hasInventory = gameState.inventory.length > 0;
  const hasRelationships = gameState.relationships && gameState.relationships.length > 0;
  const characterName = gameState.persona?.name || `Level ${gameState.level || 1} Character`;

  return (
    <div className={`flex flex-col text-gray-200 ${className}`}>
      
      {/* Location - Always Visible */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 text-indigo-400">
                <MapPin size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Location</span>
            </div>
            <div className="text-[10px] text-gray-500 font-mono">Turn {gameState.turnCount}</div>
        </div>
        <p className="font-display text-base text-white leading-tight">{gameState.location}</p>
      </div>

      {/* Character Status Accordion */}
      <Section title={characterName} icon={User} colorClass={isSliceOfLife ? "text-pink-400" : "text-red-400"} defaultOpen={true}>
        {/* XP Bar */}
        <div className="mb-3">
             <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-indigo-300 flex items-center gap-1"><Sparkles size={8} /> XP (Lvl {gameState.level || 1})</span>
                <span className="text-[10px] font-mono text-gray-400">{currentXP}/{xpThreshold}</span>
             </div>
             <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)] transition-all duration-500" style={{ width: `${xpPercent}%` }}></div>
             </div>
        </div>

        {/* Health */}
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-gray-400">{isSliceOfLife ? "Social Energy" : "HP"}</span>
          <span className="text-xs font-mono text-gray-300">{gameState.health}/{gameState.maxHealth}</span>
        </div>
        <div className="w-full h-1.5 bg-gray-800 rounded-full mb-3 overflow-hidden">
          <div className={`h-full transition-all duration-500 ${getHealthColor(healthPercent)}`} style={{ width: `${healthPercent}%` }}></div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
           <StatBox label="STR" value={gameState.stats.strength} />
           <StatBox label="AGI" value={gameState.stats.agility} />
           <StatBox label="INT" value={gameState.stats.intelligence} />
           <StatBox label="CHA" value={gameState.stats.charisma} />
        </div>
      </Section>

      {/* Relationships Accordion */}
      {hasRelationships && (
         <Section title="Relationships" icon={Users} colorClass="text-pink-400" defaultOpen={isSliceOfLife}>
             <div className="space-y-3">
                {gameState.relationships.map(npc => {
                   const style = getRelationshipStyle(npc.status, npc.affinity);
                   return (
                    <div key={npc.id} className="text-xs">
                        <div className="flex justify-between items-end mb-1">
                            <span className="font-bold text-gray-200">{npc.name}</span>
                            <div className="flex items-center gap-1">
                                {npc.status === 'Rival' && <Swords size={10} className="text-orange-400" />}
                                {npc.status === 'Crush' && <Heart size={10} className="text-pink-400" />}
                                {npc.status === 'Confidant' && <MessageCircle size={10} className="text-teal-400" />}
                                {npc.status === 'Mentor' && <Star size={10} className="text-yellow-400" />}
                                <span className={`text-[10px] uppercase tracking-wider ${style.text}`}>
                                    {npc.status}
                                </span>
                            </div>
                        </div>
                        <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden mb-1">
                            <div 
                                className={`h-full transition-all duration-500 ${style.bar}`} 
                                style={{ width: `${npc.affinity}%` }}
                            ></div>
                        </div>
                        <div className="text-[10px] text-gray-500 truncate">{npc.description}</div>
                    </div>
                   );
                })}
             </div>
         </Section>
      )}

      {/* Quest Accordion */}
      <Section title="Current Quest" icon={Compass} colorClass="text-yellow-500" defaultOpen={!hasRelationships}>
        <p className="text-sm font-serif italic text-gray-300 leading-relaxed border-l-2 border-yellow-500/30 pl-3">
          "{gameState.quest}"
        </p>
      </Section>

      {/* Inventory Accordion */}
      <Section title={`Inventory (${gameState.inventory.length})`} icon={Backpack} colorClass="text-emerald-400" defaultOpen={hasInventory && !hasRelationships}>
        {gameState.inventory.length === 0 ? (
          <p className="text-gray-600 text-xs italic">Empty</p>
        ) : (
          <ul className="space-y-1">
            {gameState.inventory.map((item, index) => (
              <li key={index}>
                <button
                  onClick={() => onInspect && !loading && onInspect(item)}
                  disabled={loading}
                  className="w-full text-left flex items-start gap-2 p-1.5 rounded hover:bg-gray-800/80 transition-all text-xs text-gray-300 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                   <div className="mt-1 w-1 h-1 rounded-full bg-emerald-500/50 shrink-0 group-hover:bg-emerald-400"></div>
                   <span className="leading-tight flex-1">{item}</span>
                   <Search size={12} className="opacity-0 group-hover:opacity-100 text-emerald-400 transition-opacity" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* World State Accordion */}
      {visibleFlags.length > 0 && (
        <Section title="World State" icon={Globe} colorClass="text-purple-400" defaultOpen={false}>
           <div className="space-y-1.5">
              {visibleFlags.map((flag) => (
                <div key={flag.key} className="flex items-start gap-2 text-xs">
                  <Flag size={10} className="mt-0.5 text-purple-500/50 shrink-0" />
                  <span className="text-gray-400">
                    <span className="text-purple-200">{flag.label}</span>
                    <span className="text-purple-300/60">{flag.displayValue}</span>
                  </span>
                </div>
              ))}
           </div>
        </Section>
      )}

    </div>
  );
};

const StatBox: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="bg-gray-950/50 rounded px-2 py-1 flex justify-between items-center border border-gray-800">
    <span className="text-[10px] font-bold text-gray-500">{label}</span>
    <span className="text-xs font-mono text-white">{value}</span>
  </div>
);