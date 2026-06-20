import React from 'react';
import Select from 'react-select';

export default function CourseSelect({ courses, selectedCourses, onChange }) {
  const options = courses.map(c => ({ value: c.id, label: c.name }));
  
  const customStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: '#334155',
      borderRadius: '0.5rem',
      borderColor: state.isFocused ? '#3b82f6' : '#475569',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.5)' : 'none',
      '&:hover': {
        borderColor: '#3b82f6'
      },
      padding: '2px',
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: '#334155',
      border: '1px solid #475569',
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused ? '#1e293b' : 'transparent',
      color: '#f8fafc',
      '&:active': {
        backgroundColor: '#0f172a'
      }
    }),
    singleValue: (base) => ({ ...base, color: '#f8fafc' }),
    input: (base) => ({ ...base, color: '#f8fafc' }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: '#1e3a8a',
      borderRadius: '0.375rem',
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: '#bfdbfe',
      fontWeight: '500',
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: '#93c5fd',
      ':hover': {
        backgroundColor: '#1e40af',
        color: '#eff6ff',
        borderRadius: '0 0.375rem 0.375rem 0',
      },
    }),
  };

  return (
    <div className="card w-full mb-6">
      <label className="card-title">1. Select Courses:</label>
      <Select
        isMulti
        name="courses"
        options={options}
        className="basic-multi-select"
        classNamePrefix="select"
        placeholder={courses.length === 0 ? "Loading courses..." : "Search and select courses..."}
        isDisabled={courses.length === 0}
        value={options.filter(opt => selectedCourses.includes(opt.value))}
        onChange={(selected) => onChange(selected ? selected.map(s => s.value) : [])}
        styles={customStyles}
        closeMenuOnSelect={false}
      />
    </div>
  );
}
