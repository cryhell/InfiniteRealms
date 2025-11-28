import React from 'react';
import { GameState, SKILL_TREE, Skill } from '../types';
import { X, Lock, Check, Zap, Shield, Brain, Sparkles } from 'lucide-react';

interface SkillTreeModalProps {
  gameState: GameState;
  onUnlock: (skillId: string) => void;
  onClose: () => void;
}

const STAT_COLORS = {
  strength: "text-red-400 bg-red-900/20 border-red-800",
  agility: "text-green-400 bg-green-900/20 border-green-800",
  intelligence: "text-blue-400 bg-blue-900/20 border-blue-800",
  charisma: "text-purple-400 bg-purple-900/20 border-purple-800"
};

const STAT_ICONS = {
  strength: Shield,
  agility: Zap,
  intelligence: Brain,
  charisma: Sparkles
};

export const SkillTreeModal: React.FC<SkillTreeModalProps> = ({ gameState, onUnlock, onClose }) => {
  const categories = ['strength', 'agility', 'intelligence', 'charisma'] as const;

  const getStatus = (skill: Skill) => {
    const isUnlocked = gameState.unlockedSkills.includes(skill.id);
    const canAfford = gameState.skillPoints >= skill.cost;
    const meetsReq = gameState.stats[skill.stat] >= skill.minVal;
    
    if (isUnlocked) return 'unlocked';
    if (canAfford && meetsReq) return 'available';
    return 'locked';
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm">
      <div className="w-full max-w-4xl bg-gray-900 border border-gray-800 rounded-xl shadow-2xl animate-fade-in flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800 bg-gray-900/90 backdrop-blur sticky top-0 z-10">
          <div>
             <h2 className="text-2xl font-display font-bold text-white mb-1">Character Growth</h2>
             <div className="flex items-center gap-4 text-sm">
                <span className="text-indigo-400 font-bold">Level {gameState.level}</span>
                <span className={`px-2 py-0.5 rounded ${gameState.skillPoints > 0 ? 'bg-indigo-600 text-white animate-pulse' : 'bg-gray-800 text-gray-500'}`}>
                  {gameState.skillPoints} Skill Points Available
                </span>
             </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar bg-gradient-to-br from-gray-900 to-gray-950">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {categories.map(stat => {
              const skills = SKILL_TREE.filter(s => s.stat === stat);
              const Icon = STAT_ICONS[stat];
              const colorClass = STAT_COLORS[stat];

              return (
                <div key={stat} className="bg-gray-950/50 rounded-xl border border-gray-800 p-4">
                  <div className={`flex items-center gap-2 mb-4 font-display font-bold uppercase tracking-wider ${colorClass.split(' ')[0]}`}>
                    <Icon size={18} />
                    {stat} ({gameState.stats[stat]})
                  </div>
                  
                  <div className="space-y-3">
                    {skills.map(skill => {
                      const status = getStatus(skill);
                      
                      return (
                        <div 
                          key={skill.id}
                          className={`
                            relative p-4 rounded-lg border transition-all duration-200
                            ${status === 'unlocked' ? 'bg-gray-900 border-indigo-500/50 shadow-[0_0_10px_rgba(99,102,241,0.1)]' : 
                              status === 'available' ? 'bg-gray-900 border-gray-700 hover:border-gray-500' : 
                              'bg-gray-950/30 border-gray-800 opacity-70'}
                          `}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <h4 className={`font-bold ${status === 'unlocked' ? 'text-white' : 'text-gray-300'}`}>
                              {skill.name}
                            </h4>
                            {status === 'unlocked' && <Check size={16} className="text-indigo-400" />}
                            {status === 'locked' && <Lock size={16} className="text-gray-600" />}
                            {status === 'available' && (
                               <button
                                 onClick={() => onUnlock(skill.id)}
                                 className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded shadow-lg transition-colors"
                               >
                                 Unlock
                               </button>
                            )}
                          </div>
                          
                          <p className="text-xs text-gray-400 mb-2">{skill.description}</p>
                          
                          <div className="flex gap-3 text-[10px] uppercase font-bold tracking-wider">
                            <span className={`${gameState.stats[stat] >= skill.minVal ? 'text-gray-500' : 'text-red-500'}`}>
                               Req: {stat.substring(0,3).toUpperCase()} {skill.minVal}
                            </span>
                            <span className="text-gray-600">Cost: {skill.cost}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};