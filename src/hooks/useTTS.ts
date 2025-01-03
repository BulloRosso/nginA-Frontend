// src/hooks/useTTS.ts
import { useRef, useState, useCallback } from 'react';

export const useTTS = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const chunksRef = useRef<Array<Blob>>([]);

  const getWebSocketUrl = (text: string): string => {
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    if (!apiUrl) {
      throw new Error('API URL not configured');
    }
    const baseUrl = apiUrl.replace(/\/api\/v1\/?$/, '');
    const wsUrl = baseUrl.replace(/^http/, 'ws').replace(/^https/, 'wss');
    const encodedText = encodeURIComponent(text);
    return `${wsUrl}/api/v1/interviews/tts/${encodedText}`;
  };

  const disconnect = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log('Disconnecting WebSocket');
      wsRef.current.close();
    }
    wsRef.current = null;
    setIsConnected(false);
  }, []);

  const playAudioChunks = async () => {
    if (chunksRef.current.length === 0) {
      console.log('No audio chunks to play');
      disconnect();
      return;
    }

    const audioBlob = new Blob(chunksRef.current, { type: 'audio/mp3' });
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);

    try {
      audio.onended = () => {
        console.log('Audio playback finished');
        URL.revokeObjectURL(audioUrl);
        disconnect();
        setIsPlaying(false);
      };

      await audio.play();
    } catch (err) {
      console.error('Error playing audio:', err);
      URL.revokeObjectURL(audioUrl);
      setError('Error playing audio');
      disconnect();
    }
  };

  const speak = useCallback(async (text: string) => {
    try {
      // Clean up any existing connection
      disconnect();

      if (!text.trim()) {
        throw new Error('No text provided');
      }

      const wsUrl = getWebSocketUrl(text);
      console.log('Connecting to WebSocket for TTS');

      return new Promise((resolve, reject) => {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        const timeout = setTimeout(() => {
          disconnect();
          reject(new Error('WebSocket connection timeout'));
        }, 5000);

        ws.onopen = () => {
          clearTimeout(timeout);
          console.log('WebSocket connected');
          setIsConnected(true);
        };

        ws.onclose = () => {
          console.log('WebSocket closed');
          setIsConnected(false);
        };

        ws.onerror = (event) => {
          console.error('WebSocket error:', event);
          setError('WebSocket error occurred');
          reject(new Error('WebSocket error'));
        };

        ws.onmessage = async (event) => {
          if (event.data === '|AUDIO_START|') {
            console.log('Starting to receive audio chunks');
            chunksRef.current = [];
            setIsPlaying(true);
          } else if (event.data === '|AUDIO_END|') {
            console.log('Finished receiving audio chunks');
            await playAudioChunks();
            resolve();
          } else if (event.data instanceof Blob) {
            chunksRef.current.push(event.data);
          } else if (typeof event.data === 'string' && event.data.startsWith('Error:')) {
            console.error('Server error:', event.data);
            setError(event.data);
            disconnect();
            reject(new Error(event.data));
          }
        };
      });
    } catch (err) {
      console.error('Error in speak:', err);
      setError(err instanceof Error ? err.message : 'Failed to start TTS');
      throw err;
    }
  }, [disconnect]);

  return {
    isConnected,
    isPlaying,
    error,
    speak
  };
};