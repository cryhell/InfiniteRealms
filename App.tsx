import React, { useState, useEffect } from 'react';
import { GameState, AdventureNode, PlayerStats, GameSettings, GameEffect, SKILL_TREE, CodexEntry, NPC, WorldEvent, PlayerPersona } from './types';
import { generateAdventureNode, startGame } from './services/geminiService';
import { StartScreen } from './components/StartScreen';
import { GameInterface } from './components/GameInterface';
import { SettingsModal } from './components/SettingsModal';
import { SkillTreeModal } from './components/SkillTreeModal';
import { CodexModal } from './components/CodexModal';
import { Loader, Save, Settings, AlertTriangle } from 'lucide-react';

const SAVE_KEY = 'infinite_realms_save';
const SETTINGS_KEY = 'infinite_realms_settings';

const DEFAULT_SETTINGS: GameSettings = {
  apiKey: '',
  model: 'gemini-2.5-flash',
  baseUrl: '',
  provider: 'gemini'
};

const App: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [history, setHistory] = useState<AdventureNode[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [currentEffect, setCurrentEffect] = useState<GameEffect>(null);
  const [startParams, setStartParams] = useState<{genre: string, prompt?: string, persona?: PlayerPersona} | null>(null);
  const [activeEvent, setActiveEvent] = useState<WorldEvent | null>(null);
  
  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [gameSettings, setGameSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  
  // Modals State
  const [showSkills, setShowSkills] = useState(false);
  const [showCodex, setShowCodex] = useState(false);

  // Save Data State
  const [savedGame, setSavedGame] = useState<{gameState: GameState, history: AdventureNode[]} | null>(null);

  // Load save metadata and settings on mount
  useEffect(() => {
    // Load Settings
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setGameSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }

    // Load Game
    if (!isPlaying) {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.gameState && parsed.history) {
            setSavedGame(parsed);
          }
        } catch (e) {
          console.error("Failed to parse save file", e);
        }
      }
    }
  }, [isPlaying]);

  const handleSaveSettings = (newSettings: GameSettings) => {
    setGameSettings(newSettings);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    setNotification("Settings Saved");
    setTimeout(() => setNotification(null), 2000);
    setError(null); // Clear error if settings update potentially fixes it
  };

  const triggerEffect = (effect: GameEffect) => {
    setCurrentEffect(effect);
    setTimeout(() => setCurrentEffect(null), 1000); // Reset after animation duration
  };

  // Base calculation for standard progression. 
  // Special statuses like Rival, Crush, Mentor are handled via direct AI assignment or sticky logic.
  const calculateRelationshipStatus = (affinity: number): NPC['status'] => {
     if (affinity < 10) return 'Enemy';
     if (affinity < 25) return 'Stranger';
     if (affinity < 45) return 'Acquaintance';
     if (affinity < 65) return 'Friend';
     if (affinity < 85) return 'Confidant';
     return 'Close Friend';
  };

  const handleStartGame = async (genre: string, customPrompt?: string, persona?: PlayerPersona) => {
    setLoading(true);
    setError(null);
    setStartParams({ genre, prompt: customPrompt, persona });
    try {
      const initialNode = await startGame(genre, customPrompt, gameSettings, persona);
      
      const initialStats: PlayerStats = {
        strength: initialNode.statsUpdate?.strength || 5,
        agility: initialNode.statsUpdate?.agility || 5,
        intelligence: initialNode.statsUpdate?.intelligence || 5,
        charisma: initialNode.statsUpdate?.charisma || 5,
      };

      // Handle Initial Codex Entries
      const initialCodex: CodexEntry[] = (initialNode.newCodexEntries || []).map(entry => ({
         ...entry,
         turnUnlocked: 1,
         isNew: true
      }));

      // Handle Initial Relationships (if any generated)
      const initialRelationships: NPC[] = [];
      if (initialNode.relationshipUpdates) {
          initialNode.relationshipUpdates.forEach(u => {
              const baseStatus = u.newStatus as NPC['status'] | undefined;
              initialRelationships.push({
                  id: u.npcId,
                  name: u.npcName,
                  description: u.npcDescription || 'Unknown',
                  affinity: 50 + u.affinityChange,
                  status: baseStatus || calculateRelationshipStatus(50 + u.affinityChange)
              });
          });
      }

      const newState: GameState = {
        inventory: initialNode.inventory,
        quest: initialNode.currentQuest,
        location: initialNode.locationName,
        genre: genre,
        health: initialNode.statsUpdate?.health || 100,
        maxHealth: 100,
        turnCount: 1,
        stats: initialStats,
        worldState: initialNode.worldUpdates || {},
        inCombat: false,
        enemyName: null,
        enemyHealth: null,
        enemyMaxHealth: null,
        enemyAbilities: null,
        // Progression Defaults
        xp: 0,
        level: 1,
        skillPoints: 0,
        unlockedSkills: [],
        codex: initialCodex,
        relationships: initialRelationships,
        persona: persona || { name: "Traveler", gender: "Unknown", appearance: "Unknown", backstory: "Unknown", personality: "Neutral" }
      };

      setGameState(newState);
      setHistory([initialNode]);
      setIsPlaying(true);
      if (initialCodex.length > 0) {
        setNotification(`${initialCodex.length} Codex Entries Added`);
        setTimeout(() => setNotification(null), 3000);
      }

    } catch (err: any) {
      console.error(err);
      const msg = err.message || "Failed to start adventure";
      // Auto-open settings for configuration errors
      if (msg.includes("API Key") || msg.includes("Provider")) {
        setError(msg);
        setShowSettings(true);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUnlockSkill = (skillId: string) => {
    if (!gameState) return;
    
    setGameState(prev => {
      if (!prev) return null;
      
      const skill = SKILL_TREE.find(s => s.id === skillId);
      if (!skill) return prev;
      
      if (prev.skillPoints >= skill.cost && !prev.unlockedSkills.includes(skillId)) {
        return {
          ...prev,
          skillPoints: prev.skillPoints - skill.cost,
          unlockedSkills: [...prev.unlockedSkills, skillId]
        };
      }
      return prev;
    });
  };

  const handleOpenCodex = () => {
      setShowCodex(true);
      // Mark entries as seen
      setGameState(prev => {
          if (!prev) return null;
          return {
              ...prev,
              codex: prev.codex.map(c => ({...c, isNew: false}))
          }
      });
  };

  const handleInspectItem = (item: string) => {
    handleChoice(`Inspect ${item}`);
  };

  const handleChoice = async (choice: string) => {
    if (!gameState) return;
    
    // 1. Immediate Visual Feedback (Player Intent)
    const lowerChoice = choice.toLowerCase();
    if (lowerChoice.match(/attack|fight|strike|slash|shoot|blast|cast|punch|kick|thrust|swing|charge|destroy|crush/)) {
      triggerEffect('attack');
    } else if (lowerChoice.match(/defend|block|dodge|parry|guard|shield|cover|avoid|duck/)) {
      triggerEffect('defend');
    } else if (lowerChoice.match(/kiss|hug|flirt|compliment|date|gift/)) {
      triggerEffect('heart');
    }

    setLoading(true);
    setError(null);
    setActiveEvent(null);
    
    try {
      // 2. AI Processing
      const newNode = await generateAdventureNode(history, choice, gameState, gameSettings);
      
      // 3. Logic Processing (Sequential Game Loop)
      
      // --- Step A: Stats Calculation ---
      const newStats = {
        strength: (gameState.stats.strength || 0) + (newNode.statsUpdate?.strength || 0),
        agility: (gameState.stats.agility || 0) + (newNode.statsUpdate?.agility || 0),
        intelligence: (gameState.stats.intelligence || 0) + (newNode.statsUpdate?.intelligence || 0),
        charisma: (gameState.stats.charisma || 0) + (newNode.statsUpdate?.charisma || 0),
      };

      // --- Step B: Combat & Enemy State Management ---
      let nextInCombat = gameState.inCombat;
      let nextEnemyName = gameState.enemyName;
      let nextEnemyHealth = gameState.enemyHealth;
      let nextEnemyMaxHealth = gameState.enemyMaxHealth;
      let nextEnemyAbilities = gameState.enemyAbilities;

      if (newNode.isCombat) {
        if (!gameState.inCombat || (newNode.enemyName && newNode.enemyName !== gameState.enemyName)) {
           nextInCombat = true;
           nextEnemyName = newNode.enemyName || "Unknown Enemy";
           nextEnemyMaxHealth = newNode.enemyMaxHealth || 100;
           nextEnemyHealth = newNode.enemyHealth !== undefined ? newNode.enemyHealth : nextEnemyMaxHealth;
           nextEnemyAbilities = newNode.enemyAbilities || [];
        } else {
           if (newNode.enemyHealth !== undefined) {
             nextEnemyHealth = newNode.enemyHealth;
           }
           if (newNode.enemyAbilities && newNode.enemyAbilities.length > 0) {
             nextEnemyAbilities = newNode.enemyAbilities;
           }
        }
      } else {
        nextInCombat = false;
        nextEnemyName = null;
        nextEnemyHealth = null;
        nextEnemyMaxHealth = null;
        nextEnemyAbilities = null;
      }

      // --- Step C: Health & Damage Resolution ---
      const healthChange = newNode.statsUpdate?.health || 0;
      let newHealth = gameState.health + healthChange;
      let newMaxHealth = gameState.maxHealth;

      if (newHealth > newMaxHealth) newHealth = newMaxHealth;
      if (newHealth < 0) newHealth = 0;

      // --- Step D: XP & Leveling ---
      const xpAward = newNode.xpAward || 0;
      let currentXP = (gameState.xp || 0) + xpAward;
      let currentLevel = gameState.level || 1;
      let currentSkillPoints = gameState.skillPoints || 0;
      let leveledUp = false;

      const xpThreshold = currentLevel * 100;

      if (currentXP >= xpThreshold) {
        currentLevel += 1;
        currentSkillPoints += 1;
        currentXP = currentXP - xpThreshold; 
        
        newMaxHealth += 10;
        newHealth += 10;
        leveledUp = true;
      }

      // --- Step E: Codex Updates ---
      const currentCodex = gameState.codex || [];
      const newEntries = newNode.newCodexEntries || [];
      const validNewEntries: CodexEntry[] = [];
      
      newEntries.forEach(entry => {
         // Deduplicate based on ID or exact Title match
         const exists = currentCodex.some(c => c.id === entry.id || c.title === entry.title);
         if (!exists) {
             validNewEntries.push({
                 ...entry,
                 turnUnlocked: gameState.turnCount + 1,
                 isNew: true
             });
         }
      });
      
      const nextCodex = [...currentCodex, ...validNewEntries];

      // --- Step F: Relationship Updates ---
      let nextRelationships = [...(gameState.relationships || [])];
      let socialSuccess = false;

      if (newNode.relationshipUpdates && newNode.relationshipUpdates.length > 0) {
          newNode.relationshipUpdates.forEach(update => {
              const index = nextRelationships.findIndex(r => r.id === update.npcId || r.name === update.npcName);
              
              if (index !== -1) {
                  // Update existing
                  const npc = nextRelationships[index];
                  let newAffinity = npc.affinity + update.affinityChange;
                  newAffinity = Math.max(0, Math.min(100, newAffinity));
                  
                  if (update.affinityChange > 5) socialSuccess = true;

                  // Determine status change with preference for explicit AI override or sticky special statuses
                  let newStatus = update.newStatus as NPC['status'] | undefined;
                  
                  if (!newStatus) {
                      // If no explicit new status, check if we should preserve a special status
                      // Added Ally, Confidant to sticky list to avoid overwriting them with math immediately
                      const stickyStatuses = ['Rival', 'Crush', 'Partner', 'Nemesis', 'Complicated', 'Mentor', 'Protege', 'Ally', 'Confidant'];
                      
                      // If it's already a sticky status, only change if affinity drops radically (e.g. Crush -> Enemy)
                      if (stickyStatuses.includes(npc.status)) {
                          if (newAffinity < 10 && npc.status !== 'Nemesis' && npc.status !== 'Enemy') {
                             newStatus = 'Enemy';
                          } else {
                             newStatus = npc.status; // Keep existing special status
                          }
                      } else {
                          // Otherwise use standard math
                          newStatus = calculateRelationshipStatus(newAffinity);
                      }
                  }

                  nextRelationships[index] = {
                      ...npc,
                      affinity: newAffinity,
                      status: newStatus || calculateRelationshipStatus(newAffinity),
                      description: update.npcDescription || npc.description
                  };
              } else {
                  // New NPC
                  const newAffinity = Math.max(0, Math.min(100, 50 + update.affinityChange));
                  if (update.affinityChange > 0) socialSuccess = true;
                  
                  const baseStatus = update.newStatus as NPC['status'] | undefined;

                  nextRelationships.push({
                      id: update.npcId,
                      name: update.npcName,
                      description: update.npcDescription || "Newly met",
                      affinity: newAffinity,
                      status: baseStatus || calculateRelationshipStatus(newAffinity)
                  });
              }
          });
      }

      // --- Step G: Dynamic Events ---
      if (newNode.events && newNode.events.length > 0) {
        const evt = newNode.events[0]; // Take the primary event
        setActiveEvent(evt);
        setTimeout(() => triggerEffect('event'), 200);
      }

      // --- Step H: Visual Sequencing ---
      
      if (healthChange < 0) {
        setTimeout(() => triggerEffect('hit'), 100); 
      } else if (healthChange > 0) {
        setTimeout(() => triggerEffect('heal'), 100);
      } else if (socialSuccess) {
        setTimeout(() => triggerEffect('heart'), 100);
      }

      if (leveledUp) {
        setTimeout(() => {
          triggerEffect('levelUp');
          setNotification("LEVEL UP!");
          setTimeout(() => setNotification(null), 3000);
        }, 600);
      } else if (validNewEntries.length > 0) {
          setTimeout(() => {
              setNotification(`Codex Updated: ${validNewEntries[0].title}`);
              setTimeout(() => setNotification(null), 3000);
          }, 800);
      } else if (newNode.relationshipUpdates && newNode.relationshipUpdates.length > 0) {
         setTimeout(() => {
             const u = newNode.relationshipUpdates![0];
             const sign = u.affinityChange > 0 ? "+" : "";
             const statusChange = u.newStatus ? ` (${u.newStatus})` : "";
             setNotification(`${u.npcName}: ${sign}${u.affinityChange}${statusChange}`);
             setTimeout(() => setNotification(null), 2000);
         }, 800);
      }

      // --- Step I: Update State ---
      const nextGameState: GameState = {
        ...gameState,
        inventory: newNode.inventory,
        quest: newNode.currentQuest,
        location: newNode.locationName,
        turnCount: gameState.turnCount + 1,
        stats: newStats,
        health: newHealth,
        maxHealth: newMaxHealth,
        worldState: { ...gameState.worldState, ...newNode.worldUpdates },
        inCombat: nextInCombat,
        enemyName: nextEnemyName,
        enemyHealth: nextEnemyHealth,
        enemyMaxHealth: nextEnemyMaxHealth,
        enemyAbilities: nextEnemyAbilities,
        xp: currentXP,
        level: currentLevel,
        skillPoints: currentSkillPoints,
        unlockedSkills: gameState.unlockedSkills,
        codex: nextCodex,
        relationships: nextRelationships
      };

      setGameState(nextGameState);
      setHistory(prev => [...prev, newNode]);

    } catch (err: any) {
      console.error(err);
      const msg = err.message || "AI Error";
      if (msg.includes("API Key") || msg.includes("Provider")) {
         setError(msg);
         setShowSettings(true);
      } else {
         setError(`The threads of fate are tangled. (${msg})`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGame = () => {
    if (!gameState) return;
    try {
      const dataToSave = { gameState, history };
      localStorage.setItem(SAVE_KEY, JSON.stringify(dataToSave));
      setSavedGame(dataToSave);
      setNotification("Progress Saved");
      setTimeout(() => setNotification(null), 2000);
    } catch (err) {
      setError("Could not save game to local storage.");
    }
  };

  const handleLoadGame = () => {
    if (savedGame) {
      const loadedState = {
        ...savedGame.gameState,
        xp: savedGame.gameState.xp || 0,
        level: savedGame.gameState.level || 1,
        skillPoints: savedGame.gameState.skillPoints || 0,
        unlockedSkills: savedGame.gameState.unlockedSkills || [],
        codex: savedGame.gameState.codex || [],
        relationships: savedGame.gameState.relationships || [],
        // Ensure persona exists for old saves
        persona: savedGame.gameState.persona || { name: "Traveler", gender: "Unknown", appearance: "Unknown", backstory: "Unknown", personality: "Neutral" }
      };
      
      setGameState(loadedState);
      setHistory(savedGame.history);
      setIsPlaying(true);
      setStartParams({ genre: savedGame.gameState.genre });
    }
  };

  const handleShowMenu = () => {
    setIsPlaying(false);
  };

  const handleContinue = () => {
    setIsPlaying(true);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setGameState(null);
    setHistory([]);
    setError(null);
  };

  const handleRestart = () => {
    if (startParams) {
      handleStartGame(startParams.genre, startParams.prompt, startParams.persona);
    } else if (gameState) {
      handleStartGame(gameState.genre, undefined, gameState.persona);
    } else {
      handleReset();
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-7xl mx-auto p-3 sm:p-4">
      <header className="flex-none mb-2 flex justify-between items-center py-1">
        <div className="flex flex-row items-baseline gap-3">
          <h1 className="text-xl sm:text-2xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 leading-none">
            Infinite Realms
          </h1>
          <p className="text-gray-500 text-[10px] hidden sm:block">Powered by Gemini & NVIDIA AI</p>
        </div>
        <div className="flex gap-2">
          {!isPlaying && (
             <button
               onClick={() => setShowSettings(true)}
               className="flex items-center gap-2 text-xs sm:text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-3 py-2 rounded transition-colors"
               title="Settings"
             >
               <Settings size={16} />
             </button>
          )}

          {isPlaying && (
             <>
               <button 
                 onClick={handleSaveGame}
                 disabled={loading || (gameState?.health || 0) <= 0}
                 className="flex items-center gap-2 text-xs sm:text-sm text-emerald-400 hover:text-emerald-300 border border-emerald-900/50 hover:border-emerald-500/50 px-3 py-1 rounded transition-colors disabled:opacity-50"
               >
                 <Save size={14} />
                 <span className="hidden sm:inline">Save</span>
               </button>
               <button 
                 onClick={handleShowMenu}
                 disabled={loading}
                 className="text-xs sm:text-sm text-red-400 hover:text-red-300 border border-red-900/50 hover:border-red-500/50 px-3 py-1 rounded transition-colors disabled:opacity-50"
               >
                 Menu
               </button>
             </>
          )}
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden min-h-0 relative rounded-xl border border-gray-800 bg-gray-900/50 backdrop-blur-sm shadow-2xl">
        {loading && !isPlaying && (
           <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gray-950/80 backdrop-blur-sm">
              <Loader className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
              <p className="text-indigo-300 font-serif text-lg animate-pulse">Weaving the threads of destiny...</p>
           </div>
        )}

        {error && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-red-900/90 text-white px-6 py-3 rounded-full shadow-lg border border-red-500 flex items-center gap-2 animate-fade-in max-w-xl text-center">
            <AlertTriangle size={18} className="shrink-0" />
            <span className="text-sm">{error}</span>
            <button onClick={() => setError(null)} className="ml-2 hover:text-red-200 shrink-0">✕</button>
          </div>
        )}

        {notification && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-900/90 text-white px-6 py-3 rounded-full shadow-lg border border-emerald-500 flex items-center gap-2 animate-fade-in">
            <span>{notification.includes("LEVEL") ? "✨" : notification.includes("Codex") ? "📖" : notification.includes("Affinity") ? "❤️" : "💾"} {notification}</span>
          </div>
        )}

        {!isPlaying ? (
          <StartScreen 
            onStart={handleStartGame} 
            onResume={handleLoadGame}
            savedGameState={savedGame?.gameState || null}
            isLoading={loading} 
            activeGameState={gameState}
            onContinue={handleContinue}
          />
        ) : (
          gameState && (
            <GameInterface 
              gameState={gameState} 
              history={history} 
              onChoice={handleChoice} 
              loading={loading}
              effect={currentEffect}
              onRestart={handleRestart}
              onMainMenu={handleReset}
              onOpenSkills={() => setShowSkills(true)}
              onOpenCodex={handleOpenCodex}
              onInspectItem={handleInspectItem}
              activeEvent={activeEvent}
            />
          )
        )}
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal 
          currentSettings={gameSettings} 
          onSave={handleSaveSettings} 
          onClose={() => setShowSettings(false)} 
        />
      )}

      {/* Skill Tree Modal */}
      {showSkills && gameState && (
        <SkillTreeModal
          gameState={gameState}
          onUnlock={handleUnlockSkill}
          onClose={() => setShowSkills(false)}
        />
      )}

      {/* Codex Modal */}
      {showCodex && gameState && (
        <CodexModal
          gameState={gameState}
          onClose={() => setShowCodex(false)}
        />
      )}
    </div>
  );
};

export default App;