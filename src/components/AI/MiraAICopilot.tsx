import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Mic, 
  Volume2, 
  VolumeX, 
  X,
  Key,
  Maximize2,
  Minimize2,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import { AIMessage, CopilotAction, ParsedCoordinate, queryGeminiOrScientificEngine } from '../../services/miraAiService';
import { MarsCoordinates, CameraTelemetry } from '../../types';
import { MiraHeaderBotIcon, AiSparklesIcon } from '../UI/Thumbnails';
import { normalizeSpeechText, selectNaturalFemaleVoice } from '../../services/speechNormalizer';

interface MiraAICopilotProps {
  isOpen: boolean;
  onClose?: () => void;
  coordinates: MarsCoordinates | null;
  telemetry: CameraTelemetry;
  onNavigateToCoordinates: (lat: number, lon: number, altitudeMeters?: number) => void;
  onExecuteCopilotAction?: (action: CopilotAction) => void;
}

export const MiraAICopilot: React.FC<MiraAICopilotProps> = ({
  isOpen,
  onClose,
  coordinates,
  telemetry,
  onNavigateToCoordinates,
  onExecuteCopilotAction,
}) => {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Explore Mars, ask anything...\n“Fly to Jezero Crater”',
      timestamp: new Date(),
      sourceTier: 'TIER_1_MIRA_DATASET',
      sourceLabel: 'TIER 1: MIRA Active Telemetry & Datasets',
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState<boolean>(() => {
    return localStorage.getItem('mira_copilot_voice_enabled') === 'true';
  });
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [lastTarget, setLastTarget] = useState<ParsedCoordinate | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('mira_gemini_api_key') || '';
    setApiKeyInput(saved);
  }, []);

  // Initialize and dynamically track available speech synthesis voices
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      if (v && v.length > 0) {
        setAvailableVoices(v);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Quick inquiry chips matching the exact reference layout & design
  const QUICK_PROMPTS = [
    { 
      label: 'Explain Jezero', 
      query: 'Explain Jezero Crater delta deposits, crater rim, and Perseverance rover mission findings',
      navCoords: { lat: 18.38, lon: 77.58, alt: 180000 },
      icon: (
        <img 
          src="/assets/mars_jezero_precise.png" 
          alt="Jezero" 
          className="w-4 h-4 rounded-full object-cover shrink-0 shadow-sm" 
        />
      ),
    },
    { 
      label: 'Why is Mars Red?', 
      query: 'Why is Mars red? Explain ferric oxide (rust) in the Martian regolith and atmospheric dust',
      icon: (
        <img 
          src="/assets/ringed_planet_precise.png" 
          alt="Why is Mars Red" 
          className="w-4 h-4 object-contain shrink-0 drop-shadow-sm" 
        />
      ),
    },
    { 
      label: 'Olympus Mons', 
      query: 'Explain Olympus Mons shield volcano elevation, caldera, and geological comparison with Earth volcanoes',
      navCoords: { lat: 18.65, lon: 226.2, alt: 350000 },
      icon: (
        <img 
          src="/assets/olympus_mons_precise.png" 
          alt="Olympus Mons" 
          className="w-4 h-4 object-contain shrink-0 drop-shadow-sm" 
        />
      ),
    },
    { 
      label: 'Keplerian Orbits', 
      query: 'Explain Keplerian orbits of Phobos and Deimos satellites, revolution periods, and tidal decay',
      icon: (
        <img 
          src="/assets/satellite_precise.png" 
          alt="Keplerian Orbits" 
          className="w-4 h-4 object-contain shrink-0 drop-shadow-sm" 
        />
      ),
    },
  ];

  // Stop speaking immediately
  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Toggle voice and persist in localStorage
  const toggleVoice = () => {
    const next = !isVoiceEnabled;
    setIsVoiceEnabled(next);
    localStorage.setItem('mira_copilot_voice_enabled', String(next));
    if (!next) {
      stopSpeaking();
    }
  };

  // Text to Speech playback with dedicated female voice selection and speech normalization
  const speakText = (text: string) => {
    if (!isVoiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const clean = normalizeSpeechText(text);
      if (!clean) return;

      const utterance = new SpeechSynthesisUtterance(clean);
      const femaleVoice = selectNaturalFemaleVoice(
        availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices()
      );
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }
      utterance.rate = 1.0;
      utterance.pitch = 1.05;
      utterance.volume = 1.0;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch {
      setIsSpeaking(false);
    }
  };

  const handleSendMessage = async (queryText?: string, navCoords?: { lat: number; lon: number; alt?: number }) => {
    const textToSend = (queryText || inputQuery).trim();
    if (!textToSend || isLoading) return;

    // Immediately stop any currently playing speech to prevent overlap
    stopSpeaking();

    if (navCoords) {
      onNavigateToCoordinates(navCoords.lat, navCoords.lon, navCoords.alt || 300000);
    }

    setInputQuery('');
    const userMsg: AIMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await queryGeminiOrScientificEngine(
        textToSend,
        apiKeyInput || undefined,
        telemetry,
        coordinates,
        lastTarget,
        messages
      );
      setMessages((prev) => [...prev, response]);

      if (response.navigationTarget) {
        setLastTarget(response.navigationTarget);
      }

      // Execute application action (e.g., Solar System Earth perspective, Moon focus, View toggle)
      if (response.action) {
        onExecuteCopilotAction?.(response.action);
      }

      if (response.navigationTarget && !navCoords && !response.action) {
        onNavigateToCoordinates(
          response.navigationTarget.latitude,
          response.navigationTarget.longitude,
          response.navigationTarget.altitudeMeters
        );
      }

      speakText(response.spokenText || response.content);
    } catch {
      const fallbackMsg: AIMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: 'Telemetry connection stable. Awaiting exploration query.',
        timestamp: new Date(),
        sourceTier: 'TIER_1_MIRA_DATASET',
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle Web Speech recognition if supported
  const toggleSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsVoiceEnabled((v) => !v);
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          handleSendMessage(transcript);
        }
      };
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const renderParagraphWithLinks = (text: string) => {
    const parts = [];
    const regex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      const label = match[1];
      const url = match[2];
      parts.push(
        <a
          key={match.index}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-0.5 text-cyan-400 hover:text-cyan-200 underline font-semibold transition-colors mx-0.5"
        >
          <span>{label}</span>
          <ExternalLink className="w-2.5 h-2.5 inline" />
        </a>
      );
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }
    return parts.length > 0 ? parts : text;
  };

  if (!isOpen) return null;

  const latestAssistantMsg = messages.filter((m) => m.role === 'assistant').slice(-1)[0];
  const isDefaultWelcome = latestAssistantMsg?.id === 'welcome';

  return (
    <div className="w-[calc(100vw-32px)] max-w-[340px] sm:w-[365px] pointer-events-auto select-none transition-all duration-300">
      {/* Sleek Dark Glass Card with electric cyan illuminated border */}
      <div className="bg-gradient-to-b from-[#081629]/95 via-[#050D1B]/95 to-[#040914]/95 backdrop-blur-2xl border border-[#00D9FF]/40 rounded-2xl p-3.5 sm:p-4.5 shadow-[0_0_24px_rgba(0,217,255,0.18)] relative space-y-3 text-white font-sans overflow-hidden">
        
        {/* HEADER: [Robot Icon] | MIRA AI COPILOT                      ● Online [Tools] [X] */}
        <div className="flex items-center justify-between pb-1 border-b border-white/5 gap-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <MiraHeaderBotIcon className="w-4 h-4 text-[#00D9FF] shrink-0 drop-shadow-[0_0_8px_rgba(0,217,255,0.8)]" />
            
            {/* Divider */}
            <div className="w-[1px] h-3.5 bg-white/15 shrink-0" />
            
            {/* Title */}
            <div className="flex items-baseline gap-1 font-title-sci whitespace-nowrap">
              <span className="text-white font-bold text-[12px] tracking-wide">MIRA</span>
              <span className="text-[#00D9FF] font-bold text-[12px] tracking-wide">AI COPILOT</span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Status indicator: ● Online */}
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-[#4ade80] text-[9px] font-sans font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] shadow-[0_0_6px_#22c55e] animate-pulse" />
              <span>Online</span>
            </div>

            {/* Optional Gemini API Key Drawer Toggle */}
            <button
              onClick={() => setShowKeyModal((k) => !k)}
              title="Configure Optional Gemini API Key"
              className={`p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-white/10 transition-colors cursor-pointer ${
                apiKeyInput ? 'text-amber-400' : ''
              }`}
            >
              <Key className="w-3.5 h-3.5" />
            </button>

            {/* Expand / Minimize Full Response Reader */}
            <button
              onClick={() => setIsExpanded((e) => !e)}
              title={isExpanded ? 'Minimize View' : 'Expand Detailed Report'}
              className="p-1 rounded text-slate-400 hover:text-[#00D9FF] hover:bg-white/10 transition-colors cursor-pointer"
            >
              {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            {/* Voice Mute / Unmute & Live Speech Stop */}
            {typeof window !== 'undefined' && 'speechSynthesis' in window && (
              <div className="flex items-center gap-1">
                {isSpeaking && (
                  <button
                    onClick={stopSpeaking}
                    title="Stop speaking"
                    className="px-1.5 py-0.5 rounded bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 text-[9px] font-mono-sci flex items-center gap-1 transition-all cursor-pointer animate-pulse"
                  >
                    <span className="w-1.5 h-1.5 rounded-sm bg-red-400" />
                    <span>STOP</span>
                  </button>
                )}
                <button
                  onClick={toggleVoice}
                  title={isVoiceEnabled ? 'Voice Enabled (Click to Mute)' : 'Voice Muted (Click to Enable)'}
                  className={`p-1 rounded transition-colors cursor-pointer ${
                    isVoiceEnabled ? 'text-[#00D9FF] bg-sky-950/40 hover:bg-sky-900/50' : 'text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {isVoiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}

            {/* Close Button with dedicated touch padding so it doesn't touch the edge */}
            {onClose && (
              <button 
                onClick={() => {
                  stopSpeaking();
                  onClose();
                }}
                className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                title="Close AI Copilot"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Optional Gemini Key Input Drawer */}
        {showKeyModal && (
          <div className="p-2.5 rounded-xl bg-slate-900/95 border border-amber-500/40 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-mono-sci text-amber-300">
              <span>Google Gemini API Key:</span>
              <button onClick={() => setShowKeyModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="flex gap-1.5">
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy... (or offline engine)"
                className="flex-1 bg-black/60 border border-white/15 focus:border-amber-400 rounded-lg px-2 py-1 text-[10px] font-mono-sci text-white focus:outline-none"
              />
              <button
                onClick={() => {
                  if (apiKeyInput) {
                    localStorage.setItem('mira_gemini_api_key', apiKeyInput);
                  } else {
                    localStorage.removeItem('mira_gemini_api_key');
                  }
                  setShowKeyModal(false);
                }}
                className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold font-mono-sci cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        )}

        {/* MAIN BODY: 3D Robot Avatar on Left + Speech Bubble & 2x2 Grid on Right */}
        <div className="grid grid-cols-[82px_1fr] sm:grid-cols-[96px_1fr] gap-2 sm:gap-2.5 items-center">
          
          {/* Left: 3D Robot Avatar Bust */}
          <div className="relative w-[82px] sm:w-[96px] h-[126px] sm:h-[138px] rounded-xl overflow-hidden flex items-center justify-center bg-[#050D1B] border border-cyan-400/30 shadow-[0_0_12px_rgba(0,217,255,0.2)] group shrink-0">
            <img 
              src="/assets/mira_robot_avatar_perfect.png" 
              alt="MIRA AI Copilot Robot" 
              className="w-full h-full object-cover select-none pointer-events-none transform group-hover:scale-105 transition-transform duration-500"
            />
          </div>

          {/* Right Section: Thought / Speech Bubble & 2x2 Question Chips */}
          <div className="flex flex-col gap-2 min-w-0">
            
            {/* Dark Speech Bubble with Pointer Tail */}
            <div 
              onClick={() => setIsExpanded((e) => !e)}
              className="relative bg-[#061120]/85 border border-[#00D9FF]/25 rounded-xl p-2.5 shadow-inner cursor-pointer hover:border-[#00D9FF]/50 transition-colors"
            >
              {/* Speech bubble pointer tail */}
              <div className="absolute -left-1.5 top-3.5 w-0 h-0 border-t-[5px] border-t-transparent border-r-[6px] border-r-[#00D9FF]/25 border-b-[5px] border-b-transparent pointer-events-none">
                <div className="absolute -top-[4px] left-[1px] w-0 h-0 border-t-[4px] border-t-transparent border-r-[5px] border-r-[#061120] border-b-[4px] border-b-transparent" />
              </div>

              <div className="flex items-start gap-1.5">
                <AiSparklesIcon className="w-3.5 h-3.5 text-[#00D9FF] shrink-0 mt-0.5 drop-shadow-[0_0_6px_rgba(0,217,255,0.7)]" />
                
                <div className="min-w-0 flex-1">
                  {isLoading ? (
                    <div className="flex items-center gap-1.5 py-0.5 text-[#00D9FF] text-[10px] font-sans">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00D9FF] animate-ping" />
                      <span>Searching...</span>
                    </div>
                  ) : !isDefaultWelcome && latestAssistantMsg ? (
                    <div>
                      {/* Tier Badge */}
                      {latestAssistantMsg.sourceTier && (
                        <div className="mb-0.5 flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            latestAssistantMsg.sourceTier === 'TIER_1_MIRA_DATASET'
                              ? 'bg-cyan-400 shadow-[0_0_6px_#00D9FF]'
                              : latestAssistantMsg.sourceTier === 'TIER_2_NASA_PDS_ARCHIVE'
                              ? 'bg-amber-400 shadow-[0_0_6px_#f59e0b]'
                              : 'bg-purple-400 shadow-[0_0_6px_#c084fc]'
                          }`} />
                          <span className="text-[7.5px] font-mono-sci font-bold uppercase tracking-wider text-cyan-300">
                            {latestAssistantMsg.sourceTier === 'TIER_1_MIRA_DATASET'
                              ? 'Tier 1'
                              : latestAssistantMsg.sourceTier === 'TIER_2_NASA_PDS_ARCHIVE'
                              ? 'Tier 2'
                              : 'Tier 3'}
                          </span>
                        </div>
                      )}

                      {/* Content view */}
                      {isExpanded ? (
                        <div className="max-h-48 overflow-y-auto text-[10.5px] text-slate-200 leading-snug space-y-1 pr-1 font-sans [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-cyan-500/40">
                          {latestAssistantMsg.content.split('\n\n').map((para, i) => (
                            <p key={i} className={i === 0 ? 'font-bold text-white text-[11px]' : 'text-slate-300'}>
                              {renderParagraphWithLinks(para)}
                            </p>
                          ))}

                          {latestAssistantMsg.action && (
                            <div className="mt-1.5 flex items-center gap-1 text-[8.5px] font-mono-sci text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                              <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate">
                                {latestAssistantMsg.action.type === 'COMBINED_ACTION_SEQUENCE'
                                   ? latestAssistantMsg.action.payload?.description || 'Executed Action Sequence'
                                  : latestAssistantMsg.action.type === 'NAVIGATE_MARS'
                                  ? `Navigated to ${latestAssistantMsg.navigationTarget?.name || 'Mars Coordinates'}`
                                  : latestAssistantMsg.action.type === 'OPEN_SOLAR_SYSTEM'
                                  ? `Solar System: ${latestAssistantMsg.action.payload?.planetId || 'Overview'}`
                                  : latestAssistantMsg.action.type}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="max-h-20 overflow-y-auto text-[10px] text-slate-200 leading-tight space-y-0.5 pr-1 font-sans [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-cyan-500/40">
                          <p className="font-semibold text-white truncate">
                            {renderParagraphWithLinks(latestAssistantMsg.content.split('\n')[0])}
                          </p>
                          {latestAssistantMsg.content.includes('\n') && (
                            <p className="text-slate-300 text-[9px] line-clamp-2">
                              {renderParagraphWithLinks(latestAssistantMsg.content.split('\n').slice(1).join(' ').trim())}
                            </p>
                          )}
                          {latestAssistantMsg.action && (
                            <div className="mt-1 flex items-center gap-1 text-[8px] font-mono-sci text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                              <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate">
                                {latestAssistantMsg.action.type === 'COMBINED_ACTION_SEQUENCE'
                                  ? latestAssistantMsg.action.payload?.description || 'Action Sequence'
                                  : latestAssistantMsg.action.type === 'NAVIGATE_MARS'
                                  ? `Navigated: ${latestAssistantMsg.navigationTarget?.name || 'Mars'}`
                                  : latestAssistantMsg.action.type === 'OPEN_SOLAR_SYSTEM'
                                  ? `Solar: ${latestAssistantMsg.action.payload?.planetId || 'Overview'}`
                                  : latestAssistantMsg.action.type}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p className="text-[10px] sm:text-[10.5px] font-medium text-white leading-tight">
                        Explore Mars, ask anything...
                      </p>
                      <p className="text-[9px] sm:text-[9.5px] italic text-[#00D9FF] mt-0.5">
                        “Fly to Jezero Crater”
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 2x2 Quick Question Buttons */}
            <div className="grid grid-cols-2 gap-1.5">
              {QUICK_PROMPTS.map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(qp.query, qp.navCoords)}
                  className="bg-[#081629]/80 hover:bg-[#0c1f38] active:bg-[#102a4d] border border-white/10 hover:border-[#00D9FF]/50 rounded-xl px-2 py-1.5 flex items-center gap-1.5 transition-all cursor-pointer group shadow-sm min-w-0"
                >
                  {qp.icon}
                  <span className="text-[9px] sm:text-[9.5px] font-medium text-slate-200 group-hover:text-white flex-1 text-left truncate leading-tight tracking-tight">
                    {qp.label}
                  </span>
                  <span className="text-slate-500 group-hover:text-[#00D9FF] text-[8.5px] sm:text-[9px] font-semibold shrink-0">
                    &gt;
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* BOTTOM INPUT ROW: (Mic) | Ask MIRA anything...             [Send Button] */}
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
          className="flex items-center gap-2 bg-[#061120]/90 border border-white/10 rounded-xl px-2.5 py-1.5 shadow-inner"
        >
          {/* Mic Button */}
          <button
            type="button"
            onClick={toggleSpeechRecognition}
            title={isListening ? 'Listening...' : 'Voice Input'}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 ${
              isListening
                ? 'bg-red-500/20 border border-red-500 text-red-400 animate-pulse'
                : 'bg-[#081629] hover:bg-[#0c1f38] text-[#00D9FF]'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
          </button>

          {/* Vertical Divider */}
          <div className="w-[1px] h-3.5 bg-white/15 shrink-0" />

          {/* Text Input */}
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask MIRA anything..."
            className="flex-1 bg-transparent text-white text-[11.5px] placeholder:text-slate-500 focus:outline-none px-1 font-sans min-w-0"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputQuery.trim() || isLoading}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-[#008FFF] to-[#00D9FF] hover:brightness-110 active:scale-95 flex items-center justify-center text-white disabled:opacity-40 transition-all cursor-pointer shadow-[0_0_12px_rgba(0,217,255,0.6)] shrink-0"
          >
            <Send className="w-3 h-3 -rotate-12 translate-x-[0.5px]" />
          </button>
        </form>

      </div>
    </div>
  );
};
