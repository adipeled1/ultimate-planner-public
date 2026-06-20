import React from 'react';

const COLORS = [
  "#FFADAD", "#FFD6A5", "#FDFFB6", "#CAFFBF", "#9BF6FF", 
  "#A0C4FF", "#BDB2FF", "#FFC6FF", "#FFFFFC", "#D4C1EC",
  "#F49AC2", "#87CEFA"
];

const DAYS = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];

export default function CalendarGrid({ schedule }) {
  const startHour = 8;
  const endHour = 22;
  const totalMinutes = (endHour - startHour) * 60;
  
  const hours = [];
  for (let h = startHour; h <= endHour; h++) {
    hours.push(h);
  }

  // Assign colors to courses
  const courseColorMap = {};
  let colorIdx = 0;
  if (schedule) {
    schedule.forEach(group => {
      if (!courseColorMap[group.course_name]) {
        courseColorMap[group.course_name] = COLORS[colorIdx % COLORS.length];
        colorIdx++;
      }
    });
  }

  const formatTime = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative w-full h-[950px] bg-slate-900 border border-slate-700 rounded-xl flex flex-col text-slate-100 shadow-inner">
      
      {/* Headers Row */}
      <div className="flex h-10 border-b border-slate-700 bg-slate-800 flex-shrink-0 z-20 sticky top-0 shadow-sm">
        <div className="w-16 flex-shrink-0 border-r border-slate-700 flex items-center justify-center text-xs font-semibold text-slate-400">
          Time
        </div>
        {DAY_LABELS.map((label, i) => (
          <div key={i} className="flex-1 border-r border-slate-700 last:border-r-0 flex items-center justify-center text-sm font-semibold">
            {label}
          </div>
        ))}
      </div>

      {/* Grid Body */}
      <div className="flex-1 flex relative">
        
        {/* Time Column */}
        <div className="w-16 flex-shrink-0 bg-slate-800 border-r border-slate-700 relative z-10">
          {hours.map(h => (
            <div 
              key={h} 
              className="absolute w-full text-right pr-2 text-[10px] text-slate-400 -mt-2"
              style={{ top: `${((h - startHour) * 60 / totalMinutes) * 100}%` }}
            >
              {h}:00
            </div>
          ))}
        </div>

        {/* Horizontal Grid Lines */}
        <div className="absolute inset-0 left-16 right-0 pointer-events-none z-0">
          {hours.map(h => (
            <div 
              key={h}
              className="absolute w-full border-t border-slate-700 opacity-50"
              style={{ top: `${((h - startHour) * 60 / totalMinutes) * 100}%` }}
            />
          ))}
        </div>

        {/* Day Columns */}
        <div className="flex-1 flex relative z-10">
          {DAYS.map((day) => (
            <div key={day} className="flex-1 border-r border-slate-700 relative last:border-r-0">
              {/* Events for this day */}
              {schedule && schedule.map((group, groupIdx) => {
                const color = courseColorMap[group.course_name] || '#ccc';
                
                return group.slots.filter(s => s.day === day).map((slot, slotIdx) => {
                  const startOffset = slot.start - (startHour * 60);
                  const duration = slot.end - slot.start;
                  const topPct = (startOffset / totalMinutes) * 100;
                  const heightPct = (duration / totalMinutes) * 100;
                  const context = `${group.course_name} (${group.component_type || '?'})`;

                  return (
                    <div 
                      key={`${groupIdx}-${slotIdx}`}
                      className="absolute inset-x-1 rounded-md p-1.5 shadow-sm border border-black/10 overflow-hidden hover:shadow-md transition-shadow hover:z-30 cursor-default group"
                      style={{ 
                        top: `${topPct}%`, 
                        height: `${heightPct}%`, 
                        backgroundColor: color 
                      }}
                    >
                      <div className="text-slate-900 leading-tight">
                        <div className="font-bold text-[10px] mb-0.5 opacity-80">
                          {formatTime(slot.start)} - {formatTime(slot.end)}
                        </div>
                        <div className="font-bold text-[11px] mb-0.5 line-clamp-2">
                          {context}
                        </div>
                        <div className="text-[10px] opacity-80 truncate">{group.teacher}</div>
                        <div className="text-[10px] opacity-80 truncate">{slot.location}</div>
                      </div>
                    </div>
                  );
                });
              })}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
