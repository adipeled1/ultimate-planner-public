import React from 'react';

const DAYS = [
  { value: 'SUNDAY', label: 'Sunday' },
  { value: 'MONDAY', label: 'Monday' },
  { value: 'TUESDAY', label: 'Tuesday' },
  { value: 'WEDNESDAY', label: 'Wednesday' },
  { value: 'THURSDAY', label: 'Thursday' },
  { value: 'FRIDAY', label: 'Friday' },
];

export default function DaysOff({ blockedDays, setBlockedDays }) {
  const toggleDay = (day) => {
    if (blockedDays.includes(day)) {
      setBlockedDays(blockedDays.filter(d => d !== day));
    } else {
      setBlockedDays([...blockedDays, day]);
    }
  };

  return (
    <div className="card h-full">
      <label className="card-title">2. Days Off (No Classes):</label>
      <div className="grid grid-cols-2 gap-3 mt-4">
        {DAYS.map((day) => (
          <label 
            key={day.value} 
            className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${
              blockedDays.includes(day.value) 
                ? 'border-blue-500 bg-blue-900/40 text-blue-300' 
                : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <input 
              type="checkbox" 
              className="w-4 h-4 text-blue-500 rounded border-slate-600 focus:ring-blue-500 bg-slate-800"
              value={day.value}
              checked={blockedDays.includes(day.value)}
              onChange={() => toggleDay(day.value)}
            />
            <span className="font-medium text-sm">{day.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
