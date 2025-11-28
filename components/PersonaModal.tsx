import React, { useState, useEffect } from 'react';
import { PlayerPersona, Genre } from '../types';
import { X, User, Sparkles, Dna, History, Dice5, Save, Trash2, Download } from 'lucide-react';

interface PersonaModalProps {
  initialPersona?: PlayerPersona | null;
  genre: Genre | null;
  onSave: (persona: PlayerPersona) => void;
  onClose: () => void;
}

const STORAGE_KEY_PERSONAS = 'infinite_realms_saved_personas';

const RANDOM_NAMES = [
  "Kaelen", "Lyra", "Jace", "Elena", "Thorne", "Nova", "Rian", "Sara", "Vane", "Zara"
];

const RANDOM_GENDERS = [
  "Male", "Female", "Non-Binary", "Androgynous", "Fluid", "Unknown"
];

const RANDOM_APPEARANCES = [
  "Rugged scar on left cheek, piercing blue eyes.",
  "Neon-dyed hair, cybernetic arm.",
  "Flowing robes, glowing runes on skin.",
  "Worn leather jacket, tired eyes.",
  "Sharp business suit, calculating gaze."
];

const RANDOM_BACKSTORIES = [
  "A former soldier looking for redemption.",
  "An exiled noble seeking to reclaim their birthright.",
  "A street rat who stole the wrong artifact.",
  "A scholar obsessed with forbidden knowledge.",
  "Just a regular person caught in extraordinary events."
];

export const PersonaModal: React.FC<PersonaModalProps> = ({ initialPersona, genre, onSave, onClose }) => {
  const [name, setName] = useState(initialPersona?.name || "");
  const [gender, setGender] = useState(initialPersona?.gender || "");
  const [appearance, setAppearance] = useState(initialPersona?.appearance || "");
  const [backstory, setBackstory] = useState(initialPersona?.backstory || "");
  const [personality, setPersonality] = useState(initialPersona?.personality || "");
  const [savedPersonas, setSavedPersonas] = useState<PlayerPersona[]>([]);

  useEffect(() => {
    const loaded = localStorage.getItem(STORAGE_KEY_PERSONAS);
    if (loaded) {
        try {
            setSavedPersonas(JSON.parse(loaded));
        } catch (e) {
            console.error("Failed to load saved personas", e);
        }
    }
  }, []);

  const handleRandomize = () => {
    setName(RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)]);
    setGender(RANDOM_GENDERS[Math.floor(Math.random() * RANDOM_GENDERS.length)]);
    setAppearance(RANDOM_APPEARANCES[Math.floor(Math.random() * RANDOM_APPEARANCES.length)]);
    setBackstory(RANDOM_BACKSTORIES[Math.floor(Math.random() * RANDOM_BACKSTORIES.length)]);
    setPersonality("Determined and resourceful.");
  };

  const handleSaveToLibrary = () => {
      if (!name) return;
      
      const newPersona: PlayerPersona = {
          id: Date.now().toString(),
          name: name || "Unknown",
          gender: gender || "Unknown",
          appearance: appearance || "Unknown",
          backstory: backstory || "Unknown",
          personality: personality || "Unknown"
      };

      const updated = [...savedPersonas, newPersona];
      setSavedPersonas(updated);
      localStorage.setItem(STORAGE_KEY_PERSONAS, JSON.stringify(updated));
  };

  const handleDeleteFromLibrary = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const updated = savedPersonas.filter(p => p.id !== id);
      setSavedPersonas(updated);
      localStorage.setItem(STORAGE_KEY_PERSONAS, JSON.stringify(updated));
  };

  const handleLoadPersona = (p: PlayerPersona) => {
      setName(p.name);
      setGender(p.gender);
      setAppearance(p.appearance);
      setBackstory(p.backstory);
      setPersonality(p.personality);
  };

  const handleStart = () => {
    onSave({
      name: name || "The Stranger",
      gender: gender || "Unknown",
      appearance: appearance || "Cloaked in mystery",
      backstory: backstory || "Memories hazy...",
      personality: personality || "Stoic"
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-xl shadow-2xl animate-fade-in flex flex-col max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-800 bg-gray-900 sticky top-0 z-10">
          <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
            <User className="text-indigo-500" />
            Create Your Persona
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
            
            {/* Saved Personas Library */}
            {savedPersonas.length > 0 && (
                <div className="mb-2">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Saved Personas</h3>
                    <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                        {savedPersonas.map(p => (
                            <div 
                                key={p.id}
                                onClick={() => handleLoadPersona(p)}
                                className="shrink-0 w-40 p-2 rounded-lg bg-gray-800 border border-gray-700 hover:border-indigo-500 cursor-pointer group relative transition-all"
                            >
                                <div className="font-bold text-sm text-gray-200 truncate">{p.name}</div>
                                <div className="text-[10px] text-gray-500 truncate">{p.gender}</div>
                                <button 
                                    onClick={(e) => handleDeleteFromLibrary(p.id!, e)}
                                    className="absolute top-1 right-1 p-1 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500 italic">
                    Define who you are in this world...
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={handleRandomize}
                        className="flex items-center gap-2 text-xs text-indigo-400 hover:text-indigo-300 border border-indigo-900 bg-indigo-900/20 px-3 py-1.5 rounded-full transition-colors"
                    >
                        <Dice5 size={14} />
                        Randomize
                    </button>
                    <button 
                        onClick={handleSaveToLibrary}
                        className="flex items-center gap-2 text-xs text-emerald-400 hover:text-emerald-300 border border-emerald-900 bg-emerald-900/20 px-3 py-1.5 rounded-full transition-colors"
                    >
                        <Download size={14} />
                        Save to Library
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                        <User size={16} className="text-gray-500" />
                        Name
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter character name..."
                        className="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-gray-700"
                    />
                </div>

                {/* Gender */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                        <User size={16} className="text-gray-500" />
                        Gender
                    </label>
                    <input
                        type="text"
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        placeholder="e.g. Female, Male, Non-Binary..."
                        className="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-gray-700"
                    />
                </div>
            </div>

            {/* Appearance */}
            <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                    <Sparkles size={16} className="text-gray-500" />
                    Appearance
                </label>
                <textarea
                    value={appearance}
                    onChange={(e) => setAppearance(e.target.value)}
                    placeholder="Describe how you look (hair, eyes, clothing)..."
                    rows={2}
                    className="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none placeholder:text-gray-700"
                />
            </div>

            {/* Backstory */}
            <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                    <History size={16} className="text-gray-500" />
                    Backstory & Origin
                </label>
                <textarea
                    value={backstory}
                    onChange={(e) => setBackstory(e.target.value)}
                    placeholder="Where do you come from? What is your goal?..."
                    rows={3}
                    className="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none placeholder:text-gray-700"
                />
            </div>

            {/* Personality */}
            <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                    <Dna size={16} className="text-gray-500" />
                    Personality Traits
                </label>
                <input
                    type="text"
                    value={personality}
                    onChange={(e) => setPersonality(e.target.value)}
                    placeholder="Brave, Cunning, Charming, etc."
                    className="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-gray-700"
                />
            </div>
        </div>

        <div className="p-4 border-t border-gray-800 flex justify-end gap-3 bg-gray-900 sticky bottom-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleStart}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-indigo-900/20"
          >
            Start Adventure
          </button>
        </div>
      </div>
    </div>
  );
};