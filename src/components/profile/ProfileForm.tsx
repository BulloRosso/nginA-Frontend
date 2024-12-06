// src/components/profile/ProfileForm.tsx
import { useNavigate } from 'react-router-dom';
import { Button } from '@mui/material';

export const ProfileForm = () => {
  const navigate = useNavigate();

  const handleSubmit = async (event:any) => {
    event.preventDefault();
    // ... save profile logic ...
    navigate('/interview'); // Add this line
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* ... form fields ... */}
      <Button type="submit">Continue to Interview &gt;</Button>
    </form>
  );
};