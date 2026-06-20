import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Rocket } from 'lucide-react';

import Header from './components/Header';
import CourseSelect from './components/Controls/CourseSelect';
import DaysOff from './components/Controls/DaysOff';
import BlockClass from './components/Controls/BlockClass';
import ScheduleViewer from './components/Results/ScheduleViewer';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

function App() {
  const [courses, setCourses] = useState([]);
  const [coursesMetadata, setCoursesMetadata] = useState({});
  const [selectedCourses, setSelectedCourses] = useState([]);
  
  const [blockedDays, setBlockedDays] = useState([]);
  const [activeBlocks, setActiveBlocks] = useState([]);
  
  const [schedules, setSchedules] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    async function fetchCourses() {
      try {
        const response = await axios.get(`${API_BASE}/api/courses`);
        setCourses(response.data.courses);
        setCoursesMetadata(response.data.metadata);
      } catch (error) {
        console.error("Failed to load courses:", error);
        alert("Error loading courses. Is the backend server running on port 8000?");
      }
    }
    fetchCourses();
  }, []);

  const handleGenerate = async () => {
    if (selectedCourses.length === 0) {
      alert("Please select at least one course.");
      return;
    }

    const blockedTimeSlots = blockedDays.map(day => ({
      day, start: 0, end: 24 * 60
    }));

    const unwantedSpecificGroups = activeBlocks.map(b => ({
      course_id: b.course_id,
      component_type: b.component_type,
      day: b.day,
      start_time: b.start_time
    }));

    const payload = {
      selected_courses: selectedCourses,
      blocked_time_slots: blockedTimeSlots,
      unwanted_specific_groups: unwantedSpecificGroups,
      preferred_lecturers: {}
    };

    setIsGenerating(true);
    setSchedules([]);
    
    try {
      const response = await axios.post(`${API_BASE}/api/generate`, payload);
      const data = response.data;
      
      if (data.status === 'impossible') {
        alert("⚠️ No solution found:\n" + data.message);
      } else if (data.status === 'success') {
        setSchedules(data.schedules);
        setCurrentIndex(0);
        // Scroll to results
        setTimeout(() => {
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }, 100);
      }
    } catch (error) {
      console.error(error);
      alert("Server error.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-6xl mx-auto px-4 pt-10">
        
        <Header />

        <div className="space-y-6 mb-12">
          
          <CourseSelect 
            courses={courses} 
            selectedCourses={selectedCourses} 
            onChange={setSelectedCourses} 
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DaysOff 
              blockedDays={blockedDays} 
              setBlockedDays={setBlockedDays} 
            />
            <BlockClass 
              courses={courses}
              selectedCourses={selectedCourses}
              coursesMetadata={coursesMetadata}
              activeBlocks={activeBlocks}
              setActiveBlocks={setActiveBlocks}
            />
          </div>

          <div className="pt-4">
            <button 
              onClick={handleGenerate}
              disabled={isGenerating || selectedCourses.length === 0}
              className="btn-primary flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <Rocket className="w-5 h-5" />
              <span className="text-lg">Generate Schedule</span>
            </button>
          </div>

        </div>

        {(schedules.length > 0 || isGenerating) && (
          <ScheduleViewer 
            schedules={schedules} 
            currentIndex={currentIndex}
            setCurrentIndex={setCurrentIndex}
            isLoading={isGenerating}
          />
        )}

      </div>
    </div>
  );
}

export default App;
