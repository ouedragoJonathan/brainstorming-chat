import React, { useState, useCallback, useEffect } from 'react';
import { BrainCircuit, Sparkles, AlertCircle, Loader2, Send, Wand2, CheckCircle2, XCircle } from 'lucide-react';
import PersonaSelector from './components/PersonaSelector';
import ResultView from './components/ResultView';
import PredictionCard from './components/PredictionCard';
import { generateAnalysis, predictStrategy } from './services/gemini';
import { PersonaType, StrategicPrediction } from './types';
import { PERSONAS } from './constants';

const App: React.FC = () => {
  const [idea, setIdea] = useState('');
  const [selectedPersona, setSelectedPersona] = useState<PersonaType>(PersonaType.VISIONARY);
  const [loading, setLoading] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<StrategicPrediction | null>(null);
  const [systemStatus, setSystemStatus] = useState<'checking' | 'ready' | 'error'>('checking');

  // Vérification de la configuration au montage
  useEffect(() => {
    const apiKey = process.env.API_KEY;
    // Une simple vérification de la présence et de la longueur de la clé est suffisante.
    const isValid = apiKey && apiKey.length > 30; // Les clés Gemini sont longues
    setSystemStatus(isValid ? 'ready' : 'error');
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!idea.trim()) return;
    
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const personaConfig = PERSONAS[selectedPersona];
      const analysis = await generateAnalysis(idea, personaConfig.systemPromptName);
      setResult(analysis);
    } catch (err: any) {
      setError(err.message || "An error occurred while analyzing your idea.");
    } finally {
      setLoading(false);
    }
  }, [idea, selectedPersona]);

  const handlePrediction = useCallback(async () => {
    if (!idea.trim() || idea.length < 10) return;
    
    setPredicting(true);
    setError(null);
    
    try {
      const pred = await predictStrategy(idea);
      setPrediction(pred);
      setSelectedPersona(pred.suggestedPersona);
    } catch (err: any) {
      // Si l'erreur est critique (clé leakée), on l'affiche
      if (err.message && (err.message.includes('BLOQUÉE') || err.message.includes('leaked'))) {
          setError(err.message);
      } else {
          console.warn("Prediction failed", err);
      }
    } finally {
      setPredicting(false);
    }
  }, [idea]);

  const handleReset = () => {
    setResult(null);
    setError(null);
    // We keep the idea text for easy refinement
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black text-slate-100 font-sans selection:bg-blue-500/30">
      
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/20">
              <BrainCircuit className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight">Ideation Lab <span className="text-blue-400">AI</span></h1>
              <p className="text-xs text-slate-400 font-medium">Augmented Strategic Engine</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             {/* System Status Indicator */}
            <div className={`hidden sm:flex items-center gap-2 px-3 py-1 rounded-full border ${
              systemStatus === 'ready' 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}>
              {systemStatus === 'ready' ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <span className="text-[10px] font-bold tracking-wider">SYSTEM READY</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] font-bold tracking-wider">KEY MISSING</span>
                </>
              )}
            </div>

            <div className="hidden md:flex items-center gap-2 text-xs font-mono text-slate-500 bg-slate-900 border border-slate-800 px-3 py-1 rounded-full">
              <Sparkles size={12} className="text-yellow-500" />
              POWERED BY GEMINI 3 PRO
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        
        {/* Input View */}
        {!result && (
          <div className="max-w-3xl mx-auto animate-fade-in-up">
            <div className="text-center mb-10">
              <h2 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight bg-gradient-to-r from-white via-blue-100 to-slate-400 bg-clip-text text-transparent">
                Challenge your business idea.
              </h2>
              <p className="text-slate-400 text-lg max-w-xl mx-auto">
                Select an expert persona and receive a comprehensive Lean Startup analysis generated by advanced AI.
              </p>
            </div>

            {systemStatus === 'error' && (
               <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 text-red-300">
                  <XCircle className="w-6 h-6 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <strong className="block mb-1">Action Requise : Clé API Manquante ou Invalide</strong>
                    <p className="opacity-80">
                      1. Générez une <strong>nouvelle clé API</strong> sur Google AI Studio.<br/>
                      2. Remplacez la clé existante dans le fichier <code>vite.config.ts</code> par votre nouvelle clé.<br/>
                      3. Poussez vos changements sur GitHub pour que Vercel redéploie l'application.
                    </p>
                  </div>
               </div>
            )}

            {prediction && (
              <PredictionCard 
                prediction={prediction} 
                onClose={() => setPrediction(null)} 
              />
            )}

            <PersonaSelector 
              selectedPersona={selectedPersona} 
              recommendedPersona={prediction?.suggestedPersona}
              onSelect={setSelectedPersona} 
              disabled={loading || systemStatus === 'error'}
            />

            <div className={`bg-slate-800/50 border rounded-2xl p-6 shadow-xl relative overflow-hidden group transition-all duration-300 ${
              systemStatus === 'error' ? 'border-red-900/50 opacity-75' : 'border-slate-700 focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500'
            }`}>
              <label className="block text-sm font-bold text-slate-300 mb-3 ml-1 uppercase tracking-wider">
                Describe your concept
              </label>
              <textarea
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder={systemStatus === 'ready' ? "e.g., An Uber for lawn mowers, a subscription service for artisanal coffee, a SaaS for beekeepers..." : "System Unavailable - Check API Key in vite.config.ts"}
                className="w-full bg-slate-900/50 text-white placeholder-slate-500 border border-slate-700 rounded-xl p-4 min-h-[160px] focus:outline-none focus:bg-slate-900 transition-colors resize-y text-lg leading-relaxed mb-4"
                disabled={loading || systemStatus === 'error'}
              />
              
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                 <div className="flex items-center gap-4 w-full sm:w-auto">
                   <p className="text-xs text-slate-500 whitespace-nowrap">
                     {idea.length} characters
                   </p>
                   {idea.length > 20 && !prediction && systemStatus === 'ready' && (
                     <button
                       onClick={handlePrediction}
                       disabled={predicting}
                       className="text-xs flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-full border border-blue-500/20"
                     >
                       {predicting ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                       {predicting ? 'Thinking...' : 'Smart Suggest'}
                     </button>
                   )}
                 </div>

                 <button
                  onClick={handleGenerate}
                  disabled={loading || idea.trim().length === 0 || systemStatus === 'error'}
                  className={`
                    w-full sm:w-auto flex justify-center items-center gap-2 px-8 py-3 rounded-xl font-bold text-white transition-all duration-300 shadow-lg
                    ${loading || idea.trim().length === 0 || systemStatus === 'error'
                      ? 'bg-slate-700 cursor-not-allowed text-slate-400' 
                      : 'bg-blue-600 hover:bg-blue-500 hover:scale-105 shadow-blue-600/20'
                    }
                  `}
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin w-5 h-5" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      Start Analysis <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-6 p-4 bg-red-900/20 border border-red-800 rounded-xl flex items-start gap-3 text-red-200 animate-fade-in">
                <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}
            
            <div className="mt-12 grid grid-cols-3 gap-4 text-center text-slate-600 opacity-60">
                <div>
                    <h4 className="font-bold text-slate-400">Lean Canvas</h4>
                    <p className="text-xs">Structured Business Model</p>
                </div>
                <div>
                    <h4 className="font-bold text-slate-400">3 Strategy Paths</h4>
                    <p className="text-xs">Alpha, Beta, Gamma</p>
                </div>
                <div>
                    <h4 className="font-bold text-slate-400">Action Plan</h4>
                    <p className="text-xs">30-Day Roadmap</p>
                </div>
            </div>
          </div>
        )}

        {/* Result View */}
        {result && (
          <ResultView content={result} onReset={handleReset} />
        )}

      </main>
    </div>
  );
};

export default App;