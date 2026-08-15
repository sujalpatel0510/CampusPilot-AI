"use client";

import { useEffect, useState } from "react";

interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function useCountdown(targetDate: string): CountdownParts | null {
  const [parts, setParts] = useState<CountdownParts | null>(null);

  useEffect(() => {
    const target = new Date(targetDate).getTime();
    if (isNaN(target)) return;

    function compute() {
      const diff = Math.max(0, target - Date.now());
      setParts({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff / 3600000) % 24),
        minutes: Math.floor((diff / 60000) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    }

    compute();
    const timer = setInterval(compute, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return parts;
}
