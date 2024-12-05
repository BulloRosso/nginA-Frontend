import './App.css'
import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MemoryTimeline from './components/common/MemoryTimeline';
import ProfileSetup from './pages/ProfileSetup';
import MemoryCapture from './pages/MemoryCapture';

const App = () => {

  const [memories, setMemories] = useState([]);

  useEffect(() => {
    // Fetch memories from backend
    const fetchMemories = async () => {
      try {
        const response = await fetch('/api/memories');
        const data = await response.json();
        setMemories(data);
      } catch (error) {
        console.error('Error fetching memories:', error);
      }
    };

    fetchMemories();
  }, []);

  const handleMemorySelect = (memory: any) => {
    // Handle memory selection (e.g., show details, scroll to memory in main view)
    console.log('Selected memory:', memory);
  };
  
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/profile" replace />} />
          <Route path="/profile" element={<ProfileSetup />} />
          <Route path="/interview" element={<MemoryCapture />} />
        </Routes>
      </BrowserRouter>
      <MemoryCapture />
      <MemoryTimeline 
        memories={memories}
        onMemorySelect={handleMemorySelect}
      />
   </>
  );
};

export default App;