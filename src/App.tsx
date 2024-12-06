import './App.css'
import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MemoryTimeline from './components/common/MemoryTimeline';
import ProfileSetup from './pages/ProfileSetup';
import MemoryCapture from './pages/MemoryCapture';
import { Memory } from './types/memory';

const App = () => {
  const [memories, setMemories] = useState<Memory[]>([]);

  useEffect(() => {
    const fetchMemories = async () => {
      try {
        const profileId = localStorage.getItem('profileId');
        if (!profileId) return;

        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/memories/${profileId}`);
        if (!response.ok) throw new Error('Failed to fetch memories');

        const data = await response.json();
        setMemories(data.map((memory: any) => ({
          ...memory,
          timePeriod: new Date(memory.time_period)
        })));
      } catch (error) {
        console.error('Error fetching memories:', error);
      }
    };

    fetchMemories();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/profile" replace />} />
        <Route path="/profile" element={<ProfileSetup />} />
        <Route path="/interview" element={<MemoryCapture />} />
        <Route path="/timeline" element={
          <MemoryTimeline 
            memories={memories}
            onMemorySelect={(memory) => console.log('Selected memory:', memory)}
          />
        } />
      </Routes>
    </BrowserRouter>
  );
};

export default App;