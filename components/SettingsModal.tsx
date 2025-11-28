import React, { useState, useEffect } from 'react';
import { GameSettings, AIProvider } from '../types';
import { X, Key, Cpu, Save, Globe, Server, Info } from 'lucide-react';

interface SettingsModalProps {
  currentSettings: GameSettings;
  onSave: (settings: GameSettings) => void;
  onClose: () => void;
}

const GEMINI_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite' },
  { id: 'gemini-3-pro-preview', name: 'Gemini 3.0 Pro' },
];

const NVIDIA_DEFAULTS = {
    baseUrl: "https://integrate.api.nvidia.com/v1",
    model: "meta/llama-3.1-70b-instruct"
};

export const SettingsModal: React.FC<SettingsModalProps> = ({ currentSettings, onSave, onClose }) => {
  const [provider, setProvider] = useState<AIProvider>(currentSettings.provider || 'gemini');
  const [apiKey, setApiKey] = useState(currentSettings.apiKey || "");
  const [model, setModel] = useState(currentSettings.model);
  const [baseUrl, setBaseUrl] = useState(currentSettings.baseUrl || "");
  const [customModel, setCustomModel] = useState("");
  const [isCustomModel, setIsCustomModel] = useState(false);

  // Sync state when opening
  useEffect(() => {
    setProvider(currentSettings.provider || 'gemini');
    setApiKey(currentSettings.apiKey || "");
    setBaseUrl(currentSettings.baseUrl || "");

    const currentProvider = currentSettings.provider || 'gemini';

    if (currentProvider === 'gemini') {
        const isPreset = GEMINI_MODELS.some(m => m.id === currentSettings.model);
        if (isPreset) {
            setModel(currentSettings.model);
            setIsCustomModel(false);
        } else {
            setModel('custom');
            setCustomModel(currentSettings.model);
            setIsCustomModel(true);
        }
    } else {
        // OpenAI / Nvidia mode
        setIsCustomModel(true);
        setCustomModel(currentSettings.model || NVIDIA_DEFAULTS.model);
        if (!currentSettings.baseUrl) {
            setBaseUrl(NVIDIA_DEFAULTS.baseUrl);
        }
    }
  }, [currentSettings]);

  const handleProviderChange = (newProvider: AIProvider) => {
      setProvider(newProvider);
      if (newProvider === 'openai') {
          setIsCustomModel(true);
          // Only set defaults if fields are essentially empty or default
          if (!customModel || customModel === GEMINI_MODELS[0].id) {
            setCustomModel(NVIDIA_DEFAULTS.model);
          }
          if (!baseUrl) {
            setBaseUrl(NVIDIA_DEFAULTS.baseUrl);
          }
      } else {
          // Switch back to defaults if moving to Gemini
          setModel(GEMINI_MODELS[0].id);
          setIsCustomModel(false);
          setBaseUrl("");
      }
  };

  const handleSave = () => {
    let finalModel = model;
    if (provider === 'openai' || isCustomModel) {
        finalModel = customModel;
    }

    onSave({ 
      apiKey, 
      model: finalModel, 
      baseUrl,
      provider
    });
    onClose();
  };

  const handleAiStudioAuth = async () => {
    if (window.aistudio?.openSelectKey) {
      try {
        await window.aistudio.openSelectKey();
      } catch (e) {
        console.error("Failed to open key selector", e);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-gray-900 border border-gray-800 rounded-xl shadow-2xl animate-fade-in flex flex-col max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900 sticky top-0 z-10">
          <h2 className="text-xl font-display font-bold text-white">Game Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Provider Selection */}
          <div className="space-y-3">
             <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <Server size={16} className="text-indigo-400" />
                AI Provider
             </label>
             <div className="flex p-1 bg-gray-950 border border-gray-700 rounded-lg">
                <button 
                  onClick={() => handleProviderChange('gemini')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${provider === 'gemini' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  Google Gemini
                </button>
                <button 
                  onClick={() => handleProviderChange('openai')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${provider === 'openai' ? 'bg-green-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  Nvidia / OpenAI
                </button>
             </div>
          </div>

          {/* API Key Section */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
              <Key size={16} className="text-indigo-400" />
              {provider === 'gemini' ? 'Gemini API Key' : 'Provider API Key'}
            </label>
            
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={provider === 'gemini' ? "Starts with AIza..." : "nvapi-..."}
              className="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none animate-fade-in placeholder:text-gray-600"
            />

            {provider === 'gemini' && window.aistudio && (
              <button 
                onClick={handleAiStudioAuth}
                className="w-full mb-2 flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 rounded-lg transition-all text-sm"
              >
                <img src="https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg" className="w-4 h-4" alt="Gemini" />
                Select Paid Project Key
              </button>
            )}
          </div>

          {/* Model Selection */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
              <Cpu size={16} className="text-indigo-400" />
              AI Model
            </label>
            
            {provider === 'gemini' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {GEMINI_MODELS.map((m) => (
                    <button
                    key={m.id}
                    onClick={() => { setModel(m.id); setIsCustomModel(false); }}
                    className={`
                        text-left px-3 py-2 rounded-lg border transition-all text-sm truncate
                        ${!isCustomModel && model === m.id 
                        ? 'bg-indigo-900/30 border-indigo-500 text-white' 
                        : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:bg-gray-800'
                        }
                    `}
                    title={m.name}
                    >
                    <div className="font-medium truncate">{m.name}</div>
                    </button>
                ))}
                <button
                    onClick={() => setIsCustomModel(true)}
                    className={`
                    text-left px-3 py-2 rounded-lg border transition-all text-sm
                    ${isCustomModel 
                        ? 'bg-indigo-900/30 border-indigo-500 text-white' 
                        : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:bg-gray-800'
                    }
                    `}
                >
                    <div className="font-medium">Custom ID</div>
                </button>
                </div>
            ) : (
                // Nvidia / OpenAI Mode
                <div className="text-xs text-gray-500 mb-2">
                   Enter the Model ID for the selected provider (e.g. meta/llama-3.1-70b-instruct)
                </div>
            )}
            
            {(isCustomModel || provider === 'openai') && (
              <input
                type="text"
                value={customModel}
                onChange={(e) => setCustomModel(e.target.value)}
                placeholder={provider === 'openai' ? "e.g. meta/llama-3.1-70b-instruct" : "e.g. gemini-2.0-flash-exp"}
                className="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none animate-fade-in"
              />
            )}
          </div>

          {/* Advanced: Base URL */}
          <div className={`space-y-3 pt-4 border-t border-gray-800 ${provider === 'openai' ? 'block' : ''}`}>
             <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-400">
                  <Globe size={16} className="text-gray-500" />
                  {provider === 'openai' ? 'API Endpoint (Base URL)' : 'Advanced Connectivity'}
                </label>
             </div>

            <div className="grid grid-cols-1 gap-3">
              <div>
                 {provider === 'openai' && (
                    <div className="flex items-start gap-2 mb-2 p-2 bg-blue-900/20 border border-blue-900/50 rounded text-xs text-blue-200">
                        <Info size={14} className="shrink-0 mt-0.5" />
                        <span>Use the provider's v1 base URL. We automatically append <code>/chat/completions</code> if missing.</span>
                    </div>
                 )}
                 <input
                    type="text"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder={provider === 'openai' ? "https://integrate.api.nvidia.com/v1" : "https://generativelanguage.googleapis.com"}
                    className="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-gray-700"
                  />
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-800 flex justify-end bg-gray-900 sticky bottom-0">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-indigo-900/20"
          >
            <Save size={16} />
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};