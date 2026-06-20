import React from 'react';
import { GraduationCap } from 'lucide-react';

export default function Header() {
  return (
    <header className="text-center mb-8 pt-4">
      <div className="inline-flex items-center justify-center space-x-3 bg-slate-800 px-6 py-3 rounded-2xl shadow-lg border border-slate-700">
        <GraduationCap className="w-8 h-8 text-blue-500" />
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
          Ultimate Planner
        </h1>
      </div>
      <p className="mt-4 text-slate-400 font-medium">Automatic Schedule Generator</p>
    </header>
  );
}
