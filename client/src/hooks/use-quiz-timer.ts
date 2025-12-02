import { useRef, useCallback } from 'react';

interface UseQuizTimerProps {
  initialTime: number;
  onTick: (timeRemaining: number) => void;
  onTimeUp: () => void;
}

export function useQuizTimer({ initialTime, onTick, onTimeUp }: UseQuizTimerProps) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeRef = useRef(initialTime);

  const startTimer = useCallback(() => {
    // Clear any existing timer
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    timeRef.current = initialTime;
    onTick(timeRef.current);

    intervalRef.current = setInterval(() => {
      timeRef.current -= 1;
      onTick(timeRef.current);

      if (timeRef.current <= 0) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        onTimeUp();
      }
    }, 1000);
  }, [initialTime, onTick, onTimeUp]);

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const resetTimer = useCallback(() => {
    stopTimer();
    timeRef.current = initialTime;
    onTick(timeRef.current);
  }, [initialTime, onTick, stopTimer]);

  return {
    startTimer,
    stopTimer,
    resetTimer
  };
}
