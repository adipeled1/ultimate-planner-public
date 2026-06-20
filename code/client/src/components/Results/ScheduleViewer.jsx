import React from 'react';
import { Download, ChevronLeft, ChevronRight } from 'lucide-react';
import CalendarGrid from './CalendarGrid';
import { downloadHTMLReport } from '../../utils/downloadHtml';

export default function ScheduleViewer({ 
  schedules, 
  currentIndex, 
  setCurrentIndex, 
  isLoading 
}) {
  if (isLoading) {
    return (
      <div className="card w-full flex flex-col items-center justify-center py-20 text-slate-500">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <p className="font-medium animate-pulse">Generating optimal schedules...</p>
      </div>
    );
  }

  if (!schedules || schedules.length === 0) {
    return (
      <div className="card w-full flex flex-col items-center justify-center py-20 bg-slate-800 border-dashed border-2 border-slate-700 text-slate-400">
        <h2 className="text-xl font-bold mb-2 text-slate-300">No Schedule Generated</h2>
        <p>Select courses above and click "Generate Schedule"</p>
      </div>
    );
  }

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleNext = () => {
    if (currentIndex < schedules.length - 1) setCurrentIndex(currentIndex + 1);
  };

  return (
    <div className="card w-full p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="text-green-400 font-bold bg-green-900/30 px-4 py-2 rounded-xl flex items-center border border-green-800">
          🎉 Found {schedules.length} Optimal Schedule(s)
        </div>
        
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => downloadHTMLReport(schedules)}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download HTML</span>
          </button>
          
          <div className="flex items-center space-x-2 bg-slate-700 rounded-lg p-1 border border-slate-600 text-slate-200">
            <button 
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="p-1 rounded hover:bg-slate-600 disabled:opacity-50 transition-colors shadow-sm"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-medium px-2 text-sm">
              {currentIndex + 1} / {schedules.length}
            </span>
            <button 
              onClick={handleNext}
              disabled={currentIndex === schedules.length - 1}
              className="p-1 rounded hover:bg-slate-600 disabled:opacity-50 transition-colors shadow-sm"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <CalendarGrid schedule={schedules[currentIndex]} />
    </div>
  );
}
