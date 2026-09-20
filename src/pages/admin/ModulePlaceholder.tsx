import React from 'react';
import { Construction } from 'lucide-react';

interface ModulePlaceholderProps {
  title: string;
  phase: string;
  description: string;
}

export const ModulePlaceholder: React.FC<ModulePlaceholderProps> = ({
  title,
  phase,
  description,
}) => {
  return (
    <div className="p-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center space-y-4 max-w-lg mx-auto my-8">
      <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 mx-auto flex items-center justify-center text-blue-600 dark:text-blue-400">
        <Construction className="w-6 h-6" />
      </div>
      <div>
        <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded">
          {phase}
        </span>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-2">
          {title}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {description}
        </p>
      </div>
      <div className="pt-2 text-[11px] font-mono text-slate-400 border-t border-slate-100 dark:border-slate-800">
        Módulo programado según roadmap de fases.
      </div>
    </div>
  );
};
