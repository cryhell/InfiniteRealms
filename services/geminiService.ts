import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AdventureNode, GameState, GameSettings, SKILL_TREE, PlayerPersona } from "../types";

// Cache for generating turns to save tokens on identical requests
const responseCache = new Map<string, AdventureNode>();
const CACHE_LIMIT = 50;

const adventureSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    storySegment: {
      type: Type.STRING,
      description: "Narrative (100-200 words). Vivid. If Slice of Life: focus on dialogue, emotions, and atmosphere.",
    },
    choices: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "3-4 options. Use tags like '[Charm]', '[Intimidate]', '[Flirt]', '[Challenge]' based on stats/relationships.",
    },
    inventory: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Updated item list.",
    },
    currentQuest: {
      type: Type.STRING,
      description: "Current objective.",
    },
    locationName: {
      type: Type.STRING,
      description: "Location name.",
    },
    summary: {
      type: Type.STRING,
      description: "1-sentence summary of this turn.",
    },
    statsUpdate: {
      type: Type.OBJECT,
      description: "Stat/Health changes. If Slice of Life, 'Health' represents Social Battery/Energy.",
      properties: {
        health: { type: Type.INTEGER },
        strength: { type: Type.INTEGER },
        agility: { type: Type.INTEGER },
        intelligence: { type: Type.INTEGER },
        charisma: { type: Type.INTEGER },
      }
    },
    worldUpdates: {
      type: Type.ARRAY,
      description: "New/Updated flags (e.g. [{'id': 'guild_ban', 'value': 'true'}]).",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          value: { type: Type.STRING }
        },
        required: ["id", "value"]
      }
    },
    isCombat: {
      type: Type.BOOLEAN,
      description: "True if physical fight OR intense social conflict (argument/debate).",
    },
    enemyName: {
      type: Type.STRING,
      description: "Name of opponent (or person arguing with).",
    },
    enemyHealth: {
      type: Type.INTEGER,
      description: "Opponent HP or Resolve.",
    },
    enemyMaxHealth: {
      type: Type.INTEGER,
    },
    enemyAbilities: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List 2-3 abilities/arguments.",
    },
    xpAward: {
      type: Type.INTEGER,
      description: "XP gained this turn.",
    },
    newCodexEntries: {
      type: Type.ARRAY,
      description: "Generate ONLY if player discovers SIGNIFICANT lore, history, or meets a major NPC.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          title: { type: Type.STRING },
          category: { type: Type.STRING, enum: ['Lore', 'Person', 'Location', 'History', 'Item'] },
          content: { type: Type.STRING, description: "Detailed journal entry about the subject (50-100 words)." }
        },
        required: ["id", "title", "category", "content"]
      }
    },
    relationshipUpdates: {
      type: Type.ARRAY,
      description: "Changes in relationships. Explicitly use 'newStatus' for 'Rival', 'Crush', 'Nemesis', 'Complicated'.",
      items: {
        type: Type.OBJECT,
        properties: {
          npcId: { type: Type.STRING, description: "Unique ID for the NPC (e.g., 'sarah_jones')" },
          npcName: { type: Type.STRING },
          npcDescription: { type: Type.STRING, description: "Brief role (e.g. 'Childhood Friend', 'School Rival')" },
          affinityChange: { type: Type.INTEGER, description: "Positive or negative change (e.g. +5, -10)." },
          newStatus: { type: Type.STRING, description: "Optional. Set status: 'Confidant', 'Mentor', 'Protege', 'Rival', 'Crush', 'Partner', 'Nemesis', 'Complicated', 'Ally', 'Friend'." }
        },
        required: ["npcId", "npcName", "affinityChange"]
      }
    },
    events: {
      type: Type.ARRAY,
      description: "Major dynamic occurrences (e.g., 'Sudden Storm', 'Traveling Merchant', 'Ambush').",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          type: { type: Type.STRING, enum: ['danger', 'opportunity', 'flavor'] },
          title: { type: Type.STRING, description: "Headline (e.g. 'MERCHANT ARRIVAL')"},
          description: { type: Type.STRING, description: "Short description of the event."}
        },
        required: ["id", "type", "title", "description"]
      }
    }
  },
  required: ["storySegment", "choices", "inventory", "currentQuest", "locationName", "summary", "isCombat", "xpAward"],
};

// Use valid JSON values in template to prevent syntax errors if model copies literally
const JSON_TEMPLATE = `
REQUIRED JSON STRUCTURE:
{
  "storySegment": "Narrative text (100-200 words)",
  "choices": ["Action 1", "[Crush] Action 2", "[Rival] Action 3"],
  "inventory": ["Item 1", "Item 2"],
  "currentQuest": "Current Objective",
  "locationName": "Current Location",
  "summary": "One sentence summary of this turn",
  "statsUpdate": { "health": 0, "strength": 0, "agility": 0, "intelligence": 0, "charisma": 0 },
  "worldUpdates": [{"id": "flag_id", "value": "true"}],
  "isCombat": false,
  "enemyName": null,
  "enemyHealth": null,
  "enemyMaxHealth": null,
  "enemyAbilities": null,
  "xpAward": 10,
  "newCodexEntries": [],
  "relationshipUpdates": [{"npcId": "npc_1", "npcName": "Name", "npcDescription": "Role", "affinityChange": 5, "newStatus": "Rival"}],
  "events": [{"id": "evt_storm", "type": "danger", "title": "Sudden Storm", "description": "Rain lashes down."}]
}
`;

const getClient = (settings?: GameSettings) => {
  const key = settings?.apiKey || process.env.API_KEY || '';
  
  if (!key) {
    throw new Error("API_KEY_MISSING");
  }

  const options: any = { apiKey: key };
  if (settings?.baseUrl) {
    options.baseUrl = settings.baseUrl;
  }

  return new GoogleGenAI(options);
};

const getModelName = (settings?: GameSettings) => {
  return settings?.model || "gemini-2.5-flash";
};

// Helper for OpenAI/Nvidia compatible fetch
const generateOpenAI = async (settings: GameSettings, systemInstruction: string, prompt: string) => {
  if (!settings.apiKey) throw new Error("API Key is missing for Custom/Nvidia provider.");
  
  let baseUrl = settings.baseUrl || "https://integrate.api.nvidia.com/v1"; 
  const model = settings.model || "meta/llama-3.1-70b-instruct";
  
  // Robust URL handling
  baseUrl = baseUrl.trim().replace(/\/+$/, '');
  
  // Ensure we append /chat/completions if not present
  let fetchUrl = baseUrl;
  if (!fetchUrl.endsWith('/chat/completions')) {
      fetchUrl = `${baseUrl}/chat/completions`;
  }

  const body = {
    model: model,
    messages: [
      { role: "system", content: systemInstruction + "\n" + JSON_TEMPLATE + "\nIMPORTANT: Output strict JSON only. Do not use markdown code blocks." },
      { role: "user", content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 4096, // Increased to 4096 to prevent JSON truncation
    stream: false
  };

  try {
    const response = await fetch(fetchUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Provider API Error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    return data?.choices?.[0]?.message?.content || "{}";
  } catch (e: any) {
    console.error("OpenAI/Nvidia request failed", e);
    
    // Explicit warning for CORS issues which manifest as "Failed to fetch" in browsers
    if (e.name === 'TypeError' && e.message === 'Failed to fetch') {
         throw new Error("Network Error: Failed to fetch. If using Nvidia/Custom API directly from the browser, this is likely a CORS issue. Please use a local proxy or a browser extension to unblock CORS.");
    }

    throw new Error(e.message || "Failed to connect to AI Provider");
  }
};

const parseVal = (val: any) => {
    if (val === 'true') return true;
    if (val === 'false') return false;
    if (!isNaN(Number(val)) && typeof val !== 'boolean' && val !== '' && val !== null) return Number(val);
    return val;
}

const parseWorldUpdates = (updatesData: any): Record<string, string | boolean | number> => {
  const updates: Record<string, string | boolean | number> = {};
  
  // Handle Array format (Schema standard)
  if (Array.isArray(updatesData)) {
    updatesData.forEach((item: any) => {
      if (item.id && item.value !== undefined) {
        updates[item.id] = parseVal(item.value);
      }
    });
  } 
  // Handle Object format (Potential OpenAI hallucination fallback)
  else if (typeof updatesData === 'object' && updatesData !== null) {
      Object.keys(updatesData).forEach(key => {
          updates[key] = parseVal(updatesData[key]);
      });
  }
  return updates;
};

const cleanAndParseJson = (text: string) => {
  if (!text) return {};
  try {
    // 1. Clean Markdown
    let clean = text.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
    clean = clean.trim();
    
    // 2. Locate outer brackets
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      clean = clean.substring(firstBrace, lastBrace + 1);
    }

    return JSON.parse(clean);
  } catch (e) {
    // 3. Fallback: Try to repair common JSON errors (e.g. trailing commas)
    try {
        let clean = text.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
        const firstBrace = clean.indexOf('{');
        const lastBrace = clean.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace > firstBrace) {
             clean = clean.substring(firstBrace, lastBrace + 1);
        }
        // Remove trailing commas before closing braces/brackets
        clean = clean.replace(/,(\s*[}\]])/g, '$1');
        return JSON.parse(clean);
    } catch (e2) {
        console.error("JSON Parse Error. Cleaned text:", text);
        throw new Error("AI response error: Failed to parse valid JSON. The model output might be malformed.");
    }
  }
}

// Token-saving formatting helpers
const formatStats = (s: any) => `STR:${s.strength} AGI:${s.agility} INT:${s.intelligence} CHA:${s.charisma}`;
const formatFlags = (f: any) => {
  const keys = Object.keys(f);
  if (keys.length === 0) return "None";
  return keys.map(k => `${k}=${f[k]}`).join(", ");
};

const getSkillDescription = (skillIds: string[]) => {
  if (!skillIds || skillIds.length === 0) return "None";
  return skillIds.map(id => {
    const skill = SKILL_TREE.find(s => s.id === id);
    return skill ? `${skill.name} (${skill.description})` : id;
  }).join(", ");
};

const formatRelationships = (gameState: GameState) => {
    if (!gameState.relationships || gameState.relationships.length === 0) return "None";
    return gameState.relationships.map(r => `${r.name} (${r.description || 'Unknown'}): ${r.status} [${r.affinity}/100]`).join(", ");
}

export const startGame = async (genre: string, customPrompt?: string, settings?: GameSettings, persona?: PlayerPersona): Promise<AdventureNode & { initialStats: any }> => {
  try {
    const isSliceOfLife = genre.includes("Slice of Life");
    
    let personaPrompt = "";
    if (persona) {
        personaPrompt = `PLAYER PERSONA:
        Name: ${persona.name}
        Gender: ${persona.gender}
        Appearance: ${persona.appearance}
        Background: ${persona.backstory}
        Personality: ${persona.personality}
        IMPORTANT: Incorporate this character's identity into the opening scene and story.`;
    }

    const prompt = `Start RPG. Genre: ${genre}. ${customPrompt ? `Scenario: ${customPrompt}` : ''}
    ${personaPrompt}
    1. Vivid opening (max 200 words).
    2. Init inventory, quest, choices.
    3. Set stats (1-10) & Health/Energy (100).
    4. Init World Flags.
    5. Optionally add initial CODEX ENTRIES or RELATIONSHIPS (NPCs).
    ${isSliceOfLife ? "NOTE: In this genre, 'Combat' is social conflict. 'Health' is Social Energy. Focus on interactions." : ""}
    Output JSON.`;
    
    let responseText = "{}";

    if (settings?.provider === 'openai') {
        responseText = await generateOpenAI(
            settings, 
            "You are a concise Dungeon Master. Output strict JSON.", 
            prompt
        );
    } else {
        // Default Gemini
        const ai = getClient(settings);
        const modelName = getModelName(settings);
        const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: adventureSchema,
            maxOutputTokens: 2000,
            systemInstruction: "You are a concise Dungeon Master. Output strict JSON.",
        },
        });
        responseText = response.text || "{}";
    }

    const data = cleanAndParseJson(responseText);
    
    return { 
      ...data, 
      worldUpdates: parseWorldUpdates(data.worldUpdates),
      initialStats: data.statsUpdate,
      isCombat: false,
      enemyName: null,
      enemyHealth: null,
      enemyMaxHealth: null,
      enemyAbilities: null,
      xpAward: 0, // Start with 0 XP
      newCodexEntries: data.newCodexEntries || [],
      relationshipUpdates: data.relationshipUpdates || [],
      events: []
    };
  } catch (error: any) {
    console.error("Error starting game:", error);
    if (error.message === 'API_KEY_MISSING') {
      throw new Error("API Key is missing. Please check your settings.");
    }
    throw error;
  }
};

export const generateAdventureNode = async (
  history: AdventureNode[],
  choice: string,
  currentState: GameState,
  settings?: GameSettings
): Promise<AdventureNode> => {
  try {
    // Minimize history tokens: only last 3 summaries
    const recentHistory = history.slice(-3);
    const historyContext = recentHistory.map((node) => `> ${node.summary}`).join("\n");
    const lastNode = history[history.length - 1];
    
    // Compact State Dump
    const stateDump = `
Genre: ${currentState.genre} | Loc: ${currentState.location}
Player: ${currentState.persona?.name || "Hero"} [${currentState.persona?.gender || "?"}] (${currentState.persona?.appearance || "Unknown"})
HP: ${currentState.health}/${currentState.maxHealth} | ${formatStats(currentState.stats)}
Lvl: ${currentState.level} | XP: ${currentState.xp}
Skills: ${getSkillDescription(currentState.unlockedSkills)}
Inv: ${currentState.inventory.join(", ") || "Empty"}
Quest: ${currentState.quest}
Flags: ${formatFlags(currentState.worldState)}
Combat: ${currentState.inCombat ? `VS ${currentState.enemyName} (${currentState.enemyHealth}/${currentState.enemyMaxHealth} HP)` : "Safe"}
Turn: ${currentState.turnCount}
Known Lore: ${currentState.codex.map(c => c.title).join(", ") || "None"}
Relationships: ${formatRelationships(currentState)}
`.trim();

    const modelName = settings?.provider === 'openai' ? settings.model : getModelName(settings);

    // Cache Key Generation
    const cacheKey = JSON.stringify({
      provider: settings?.provider || 'gemini',
      model: modelName,
      state: stateDump,
      last: lastNode?.storySegment?.substring(0, 100) || "start",
      summary: lastNode?.summary || "",
      choice: choice.trim().toLowerCase()
    });

    // Check Cache
    if (responseCache.has(cacheKey)) {
      return responseCache.get(cacheKey)!;
    }

    const isSliceOfLife = currentState.genre.includes("Slice of Life");

    const prompt = `
=== STATE ===
${stateDump}

=== HISTORY ===
${historyContext}
LAST: "${lastNode.storySegment}"

=== ACTION ===
"${choice}"

=== RULES ===
1. FLAGS: Respect 'Flags'. Set new 'worldUpdates'.
2. EFFECT: Narrate action/consequence. Use Skills/Stats.
3. COMBAT: If hostile, set isCombat=true. ${isSliceOfLife ? "In this genre, combat is intense argument, debate, or public humiliation. 'HP' is Social Standing/Energy." : "Narrate seq: Player -> Enemy -> Result."}
4. XP: Award 'xpAward'.
5. CODEX: If player finds NEW lore, history, or major NPC, add to 'newCodexEntries'.
6. RELATIONSHIPS: Track NPC dynamics. Use 'relationshipUpdates'. IMPORTANT: utilize nuanced statuses via 'newStatus' like 'Rival', 'Crush', 'Mentor', 'Protege', 'Confidant', or 'Nemesis' when narrative appropriate. Do not rely solely on affinity math.
7. CHOICES: Generate unique choices based on stats & relationships.
   - Syntax: "[Tag] Action..."
   - EXAMPLES:
     - High CHA + Crush -> "[Flirt] Whisper a compliment..."
     - High STR + Rival -> "[Taunt] Flex and challenge..."
     - Confidant -> "[Confide] Reveal your fears..."
     - Enemy -> "[Threaten] Promise retribution..."
8. EVENTS: Occasionally introduce dynamic 'events'.

Output VALID JSON. Concise.
    `;

    let responseText = "{}";

    if (settings?.provider === 'openai') {
        responseText = await generateOpenAI(
            settings,
            "Infinite RPG Engine. Choices alter world state. Use complex NPC relationships.",
            prompt
        );
    } else {
        const ai = getClient(settings);
        const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: adventureSchema,
            maxOutputTokens: 2000,
            systemInstruction: "Infinite RPG Engine. Choices alter world state. Use complex NPC relationships.",
        },
        });
        responseText = response.text || "{}";
    }

    const data = cleanAndParseJson(responseText);
    const resultNode = {
      ...data,
      worldUpdates: parseWorldUpdates(data.worldUpdates),
      events: data.events || []
    } as AdventureNode;

    // Save to Cache
    if (responseCache.size >= CACHE_LIMIT) {
      const firstKey = responseCache.keys().next().value;
      if (firstKey) responseCache.delete(firstKey);
    }
    responseCache.set(cacheKey, resultNode);

    return resultNode;
  } catch (error: any) {
    console.error("Error generating turn:", error);
    if (error.message === 'API_KEY_MISSING') {
      throw new Error("API Key is missing. Please check your settings.");
    }
    throw error;
  }
};