import React from 'react';

interface SubsectionProps {
  title: string;
  children: React.ReactNode;
}

export default function Subsection({ title, children }: SubsectionProps) {
  return (
    <div className="mt-8 first:mt-0">
      <div className="flex items-center gap-3 mb-5">
        <div className="h-px flex-1 bg-gradient-to-r from-blue-500/50 to-transparent" />
        <h3 className="text-sm font-semibold tracking-widest text-blue-400 uppercase whitespace-nowrap">
          {title}
        </h3>
        <div className="h-px flex-1 bg-gradient-to-l from-blue-500/50 to-transparent" />
      </div>
      <div className="space-y-4 pl-1">
        {children}
      </div>
    </div>
  );
}
