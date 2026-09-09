'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message }: LoadingScreenProps) {
  return (
    <div className="min-h-screen bg-[#F8FAFC]/80 backdrop-blur-md flex flex-col items-center justify-center p-4">
      <Loader2 className="w-9 h-9 text-[#006B3F] animate-spin" />
      {message && (
        <p className="mt-3 text-xs font-semibold text-slate-600 tracking-wide">
          {message}
        </p>
      )}
    </div>
  );
}
