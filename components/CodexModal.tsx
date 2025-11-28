import React, { useState } from 'react';
import { GameState, CodexEntry } from '../types';
import { X, Book, User, MapPin, Scroll, Clock, Search } from 'lucide-react';

interface CodexModalProps {
  gameState: GameState;
  onClose: () => void;
}

type Category = 'All' | 'Lore' | 'Person' | 'Location' | 'History' | 'Item';

export const CodexModal: React.FC<CodexModalProps> = ({ gameState, onClose }) => {
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEntries = gameState.codex.filter(entry => {
    const matchesCategory = activeCategory === 'All' || entry.category === activeCategory;
    const matchesSearch = entry.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          entry.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const selectedEntry = gameState.codex.find(e => e.id === selectedEntryId) || filteredEntries[0];

  const getCategoryIcon = (cat: string) => {
    switch(cat) {
        case 'Person': return User;
        case 'Location': return MapPin;
        case 'History': return Clock;
        case 'Item': return Scroll;
        default: return Book;
    }
  };

  const categories: Category[] = ['All', 'Lore', 'Person', 'Location', 'History', 'Item'];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm">
      <div className="w-full max-w-5xl bg-gray-900 border border-gray-800 rounded-xl shadow-2xl animate-fade-in flex flex-col h-[85vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-950">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-indigo-900/30 rounded-lg border border-indigo-500/30">
                <Book size={24} className="text-indigo-400" />
             </div>
             <div>
                <h2 className="text-2xl font-display font-bold text-white">Codex & Journal</h2>
                <p className="text-xs text-gray-500 font-mono uppercase tracking-widest">
                   {gameState.codex.length} Entries Discovered
                </p>
             </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
            {/* Sidebar List */}
            <div className="w-1/3 md:w-80 border-r border-gray-800 bg-gray-900/50 flex flex-col min-w-[250px]">
                
                {/* Filters */}
                <div className="p-4 space-y-4 border-b border-gray-800">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                        <input 
                            type="text" 
                            placeholder="Search archives..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-gray-950 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`text-[10px] px-2 py-1 rounded border transition-colors uppercase tracking-wider font-bold ${activeCategory === cat ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Entry List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                    {filteredEntries.length === 0 ? (
                        <div className="text-center p-8 text-gray-600 italic text-sm">
                            No records found.
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {filteredEntries.map(entry => {
                                const Icon = getCategoryIcon(entry.category);
                                const isSelected = selectedEntry?.id === entry.id;
                                return (
                                    <button
                                        key={entry.id}
                                        onClick={() => setSelectedEntryId(entry.id)}
                                        className={`w-full text-left p-3 rounded-lg border transition-all duration-200 group relative ${isSelected ? 'bg-indigo-900/20 border-indigo-500/50' : 'bg-transparent border-transparent hover:bg-gray-800'}`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <Icon size={16} className={`mt-0.5 ${isSelected ? 'text-indigo-400' : 'text-gray-600 group-hover:text-gray-400'}`} />
                                            <div>
                                                <h4 className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>{entry.title}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] bg-gray-950 px-1.5 py-0.5 rounded text-gray-500 border border-gray-800">
                                                        {entry.category}
                                                    </span>
                                                    {entry.isNew && (
                                                        <span className="text-[10px] text-emerald-400 font-bold animate-pulse">NEW</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 bg-gray-950/30 overflow-y-auto custom-scrollbar relative p-8 md:p-12">
                {selectedEntry ? (
                    <div className="max-w-3xl mx-auto animate-fade-in">
                        <div className="flex items-center gap-2 mb-6 text-indigo-400 opacity-60">
                            {React.createElement(getCategoryIcon(selectedEntry.category), { size: 20 })}
                            <span className="text-sm font-mono uppercase tracking-widest">{selectedEntry.category} Archive</span>
                        </div>
                        
                        <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-8 border-b border-gray-800 pb-6">
                            {selectedEntry.title}
                        </h1>
                        
                        <div className="prose prose-invert prose-lg max-w-none text-gray-300 leading-relaxed font-serif">
                            {selectedEntry.content.split('\n').map((para, idx) => (
                                <p key={idx} className="mb-4">{para}</p>
                            ))}
                        </div>

                        <div className="mt-12 pt-6 border-t border-gray-800 flex justify-between items-center text-xs text-gray-600 font-mono">
                            <span>ID: {selectedEntry.id}</span>
                            <span>Discovered Turn {selectedEntry.turnUnlocked}</span>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-600">
                        <Book size={64} className="mb-4 opacity-20" />
                        <p>Select an entry to read.</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};