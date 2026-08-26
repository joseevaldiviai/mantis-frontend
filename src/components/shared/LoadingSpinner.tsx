import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Cargando...',
  className = ''
}) => {
  return (
    <div className={`flex items-center justify-center py-12 ${className}`}>
      <Loader2 className="w-6 h-6 text-[#3D848C] animate-spin mr-2" />
      <p className="text-xs font-medium text-slate-600">{message}</p>
    </div>
  );
};
