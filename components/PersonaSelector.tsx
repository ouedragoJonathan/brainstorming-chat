import React from 'react';
import { Rocket, Skull, Hammer, Sparkles } from 'lucide-react';
import { PersonaType, PersonaConfig } from '../types';
import { PERSONAS } from '../constants';

interface PersonaSelectorProps {
  selectedPersona: PersonaType;
  recommendedPersona?: PersonaType;
  onSelect: (persona: PersonaType) => void;
  disabled: boolean;
}

const PersonaSelector: React.FC<PersonaSelectorProps> = ({ 
  selectedPersona, 
  recommendedPersona,
  onSelect, 
  disabled 
}) => {
  
  const getIcon = (iconName: string, className: string) => {
    switch (iconName) {
      case 'Rocket': return <Rocket className={className} />;
      case 'Skull': return <Skull className={className} />;
      case 'Hammer': return <Hammer className={className} />;
      default: return <Rocket className={className} />;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {Object.values(PERSONAS).map((persona) => {
        const isSelected = selectedPersona === persona.id;
        const isRecommended = recommendedPersona === persona.id;
        
        return (
          <button
            key={persona.id}
            onClick={() => onSelect(persona.id)}
            disabled={disabled}
            className={`
              relative p-6 rounded-xl border-2 transition-all duration-300 flex flex-col items-center text-center group
              ${isSelected 
                ? `border-transparent ${persona.color} text-white shadow-lg scale-105 z-10` 
                : isRecommended
                  ? `border-blue-400/50 bg-slate-800/80 text-slate-300 hover:border-blue-400 hover:bg-slate-800 ring-2 ring-blue-500/20`
                  : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-500 hover:bg-slate-800'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            {isRecommended && !isSelected && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1 w-max border border-blue-400/30 animate-pulse">
                <Sparkles size={10} /> RECOMMENDED
              </div>
            )}

            <div className={`mb-3 p-3 rounded-full transition-colors ${isSelected ? 'bg-white/20' : 'bg-slate-900 group-hover:bg-slate-800'}`}>
              {getIcon(persona.icon, isSelected ? "w-8 h-8 text-white" : "w-8 h-8 text-slate-400")}
            </div>
            
            <h3 className={`font-bold text-lg mb-1 ${isSelected ? 'text-white' : 'text-slate-200'}`}>
              {persona.title}
            </h3>
            
            <span className={`text-xs uppercase tracking-wider font-semibold mb-3 ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
              {persona.subtitle}
            </span>
            
            <p className={`text-sm ${isSelected ? 'text-white/90' : 'text-slate-400'}`}>
              {persona.description}
            </p>

            {isSelected && (
              <div className="absolute -top-3 right-4 bg-white text-slate-900 text-xs font-bold px-3 py-1 rounded-full shadow-md">
                SELECTED
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default PersonaSelector;
