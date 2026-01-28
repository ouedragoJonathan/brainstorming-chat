import React from 'react';
import { Sparkles, Target, Lightbulb, X } from 'lucide-react';
import { StrategicPrediction } from '../types';

interface PredictionCardProps {
  prediction: StrategicPrediction;
  onClose: () => void;
}

const PredictionCard: React.FC<PredictionCardProps> = ({ prediction, onClose }) => {
  return (
    <div className="mb-8 animate-fade-in-up">
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-blue-500/30 rounded-xl p-0.5 shadow-xl shadow-blue-900/10 overflow-hidden">
        <div className="bg-slate-900/90 backdrop-blur-sm rounded-[11px] p-5 relative">
          <button 
            onClick={onClose}
            className="absolute top-3 right-3 text-slate-500 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
          
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20 shrink-0">
              <Sparkles className="w-5 h-5 text-blue-400" />
            </div>
            
            <div className="flex-1">
              <h4 className="font-bold text-blue-100 mb-1 flex items-center gap-2">
                AI Strategic Insight
                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/20 uppercase tracking-wide">
                  Analysis
                </span>
              </h4>
              
              <p className="text-slate-300 text-sm leading-relaxed mb-4">
                {prediction.reasoning}
              </p>
              
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-md border border-emerald-500/20">
                  <Target size={14} />
                  <span>Suggested Focus: <strong className="text-emerald-300">{prediction.focusArea}</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictionCard;
