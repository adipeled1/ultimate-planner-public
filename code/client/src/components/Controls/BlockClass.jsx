import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';

const DAYS = [
  { value: 'SUNDAY', label: 'Sunday' },
  { value: 'MONDAY', label: 'Monday' },
  { value: 'TUESDAY', label: 'Tuesday' },
  { value: 'WEDNESDAY', label: 'Wednesday' },
  { value: 'THURSDAY', label: 'Thursday' },
  { value: 'FRIDAY', label: 'Friday' },
];

export default function BlockClass({ 
  courses, 
  selectedCourses, 
  coursesMetadata, 
  activeBlocks, 
  setActiveBlocks 
}) {
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedDay, setSelectedDay] = useState('SUNDAY');
  const [selectedTime, setSelectedTime] = useState('');

  const availableCourses = courses.filter(c => selectedCourses.includes(c.id));
  const availableTypes = selectedCourse && coursesMetadata[selectedCourse] 
    ? coursesMetadata[selectedCourse].component_types 
    : [];

  const handleAddBlock = () => {
    if (!selectedCourse || !selectedType || !selectedDay || !selectedTime) {
      alert("Please fill all fields.");
      return;
    }

    const [h, m] = selectedTime.split(':').map(Number);
    const startMinutes = h * 60 + m;
    const courseObj = courses.find(c => c.id === selectedCourse);
    const dayObj = DAYS.find(d => d.value === selectedDay);

    const newBlock = {
      id: Date.now(),
      course_id: selectedCourse,
      course_name: courseObj ? courseObj.name : selectedCourse,
      component_type: selectedType,
      day: selectedDay,
      day_label: dayObj.label,
      start_time: startMinutes,
      start_time_str: selectedTime
    };

    setActiveBlocks([...activeBlocks, newBlock]);
  };

  const handleRemoveBlock = (id) => {
    setActiveBlocks(activeBlocks.filter(b => b.id !== id));
  };

  return (
    <div className="card h-full flex flex-col">
      <label className="card-title">3. Block Specific Class:</label>
      
      <div className="space-y-3 mt-4">
        <div className="flex space-x-3">
          <select 
            className="input-field flex-1"
            value={selectedCourse}
            onChange={(e) => {
              setSelectedCourse(e.target.value);
              setSelectedType('');
            }}
          >
            <option value="" disabled>Select Course...</option>
            {availableCourses.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select 
            className="input-field flex-1"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            disabled={!selectedCourse || availableTypes.length === 0}
          >
            <option value="" disabled>Type...</option>
            {availableTypes.length === 0 && selectedCourse && <option value="Unknown">Unknown</option>}
            {availableTypes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="flex space-x-3">
          <select 
            className="input-field flex-1"
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
          >
            {DAYS.map(d => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>

          <input 
            type="time" 
            className="input-field flex-1" 
            required 
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
          />

          <button 
            onClick={handleAddBlock}
            className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg flex items-center justify-center transition-colors shadow-sm"
            title="Add Block"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="mt-4 flex-1 overflow-y-auto max-h-32 space-y-2 pr-2">
        {activeBlocks.map(block => (
          <div key={block.id} className="flex justify-between items-center bg-red-900/40 text-red-300 px-3 py-2 rounded-lg text-sm border border-red-800">
            <span className="truncate pr-2">
              ⛔ {block.course_name} ({block.component_type}) - {block.day_label} {block.start_time_str}
            </span>
            <button 
              onClick={() => handleRemoveBlock(block.id)} 
              className="text-red-400 hover:text-red-300 flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
