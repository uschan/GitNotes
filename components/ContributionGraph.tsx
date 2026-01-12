import React, { useMemo, useState, useEffect } from 'react';
import { Repository } from '../types';
import { Icons } from './Icon';

interface ContributionGraphProps {
  repos: Repository[];
  onDrawPixel?: (date: string) => void;
}

const ContributionGraph: React.FC<ContributionGraphProps> = ({ repos, onDrawPixel }) => {
  const [daysToGenerate, setDaysToGenerate] = useState(364);
  const [isPixelMode, setIsPixelMode] = useState(false);
  const [hoverDate, setHoverDate] = useState<string | null>(null);

  useEffect(() => {
      const calculateDays = () => {
          const width = window.innerWidth;
          if (width < 640) return 154; // ~122 weeks (Mobile)
          if (width < 1024) return 364; // 52 weeks (Tablet)
          return 364; // 52 weeks (Desktop)
      };

      const handleResize = () => setDaysToGenerate(calculateDays());
      
      // Set initial
      handleResize();

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Logic to calculate contributions
  const { weeks, totalContributions, maxCount } = useMemo(() => {
    const map = new Map<string, number>();
    repos.forEach(repo => {
      repo.files.forEach(file => {
        const date = file.updatedAt.split('T')[0];
        map.set(date, (map.get(date) || 0) + 1);
      });
    });

    const total = Array.from(map.values()).reduce((a, b) => a + b, 0);
    const max = Math.max(...Array.from(map.values()), 0);

    // We want to show roughly a year or less depending on screen size
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - daysToGenerate);
    
    const startDayOfWeek = startDate.getDay(); // 0 (Sun) to 6 (Sat)
    
    const gridItems = [];
    
    // Add empty spacers for previous days in the first week
    for (let i = 0; i < startDayOfWeek; i++) {
        gridItems.push(null);
    }

    // Add actual days
    for (let i = 0; i <= daysToGenerate; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        const count = map.get(dateStr) || 0;
        
        // Intensity logic based on standard GH thresholds or relative to max
        let intensity = 0;
        if (count > 0) intensity = 1;
        if (count > 2) intensity = 2;
        if (count > 5) intensity = 3;
        if (count > 8) intensity = 4;

        gridItems.push({ date: dateStr, count, intensity });
    }

    return { weeks: gridItems, totalContributions: total, maxCount: max };
  }, [repos, daysToGenerate]);

  const handleCellClick = (date: string) => {
      if (isPixelMode && onDrawPixel) {
          onDrawPixel(date);
      }
  };

  return (
    <div className={`w-full border transition-all duration-300 relative overflow-hidden group ${isPixelMode ? 'bg-black border-zenith-orange shadow-[0_0_20px_rgba(255,77,0,0.15)]' : 'bg-zenith-surface/20 border-zenith-border'}`}>
        
        {/* Background Decorative Grid */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" 
             style={{backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '10px 10px'}}>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 relative z-10 gap-4 p-6 pb-0">
             <div>
                <div className="flex items-center gap-2 mb-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${isPixelMode ? 'bg-zenith-orange animate-ping' : 'bg-zenith-orange animate-pulse'}`}></div>
                    <div className="font-mono text-[10px] text-zenith-muted tracking-widest uppercase">
                        {isPixelMode ? 'PIXEL ART // EDIT MODE' : 'Activity Matrix'}
                    </div>
                </div>
                <div className="text-white font-bold font-mono text-sm uppercase tracking-tight">
                    {totalContributions} Operations {isPixelMode && hoverDate && <span className="text-zenith-orange ml-2">[{hoverDate}]</span>}
                </div>
             </div>
             
             <div className="flex items-center gap-4">
                 {/* Pixel Mode Toggle */}
                 {onDrawPixel && (
                     <button 
                        onClick={() => setIsPixelMode(!isPixelMode)}
                        className={`text-[10px] font-mono font-bold uppercase px-3 py-1.5 border transition-all ${isPixelMode ? 'bg-zenith-orange text-black border-zenith-orange' : 'border-zenith-border text-zenith-muted hover:text-white hover:border-white'}`}
                     >
                         {isPixelMode ? 'Save Art' : 'Draw'}
                     </button>
                 )}

                 {/* Legend */}
                 {!isPixelMode && (
                    <div className="flex items-center gap-2 text-[10px] font-mono text-zenith-muted uppercase">
                        <span>Idle</span>
                        <div className="flex gap-1">
                            <div className="w-2.5 h-2.5 bg-zenith-border/30 rounded-[1px]"></div>
                            <div className="w-2.5 h-2.5 bg-zenith-orange/20 rounded-[1px]"></div>
                            <div className="w-2.5 h-2.5 bg-zenith-orange/50 rounded-[1px]"></div>
                            <div className="w-2.5 h-2.5 bg-zenith-orange rounded-[1px] shadow-[0_0_5px_rgba(255,77,0,0.5)]"></div>
                        </div>
                        <span>Active</span>
                    </div>
                 )}
             </div>
        </div>

        {/* The Grid */}
        <div className="overflow-x-auto pb-6 px-6 scrollbar-hide relative z-10">
            <div className="inline-grid grid-rows-7 grid-flow-col gap-[3px] min-w-max">
                {weeks.map((day, idx) => {
                    if (!day) {
                        return <div key={`spacer-${idx}`} className="w-2.5 h-2.5 bg-transparent"></div>;
                    }
                    return (
                        <div 
                            key={day.date}
                            onClick={() => handleCellClick(day.date)}
                            onMouseEnter={() => setHoverDate(day.date)}
                            onMouseLeave={() => setHoverDate(null)}
                            title={isPixelMode ? `Click to paint ${day.date}` : `${day.count} updates on ${day.date}`}
                            className={`w-2.5 h-2.5 rounded-[1px] transition-all duration-100 border border-transparent 
                                ${isPixelMode ? 'cursor-pointer hover:scale-125 hover:z-10 hover:border-white' : ''}
                                ${
                                day.intensity === 0 ? 'bg-zenith-border/20' : 
                                day.intensity === 1 ? 'bg-zenith-orange/20' :
                                day.intensity === 2 ? 'bg-zenith-orange/40' :
                                day.intensity === 3 ? 'bg-zenith-orange/70' :
                                'bg-zenith-orange shadow-[0_0_8px_rgba(255,77,0,0.4)]'
                            }`}
                        ></div>
                    );
                })}
            </div>
        </div>
        
        {/* Decorative Corner */}
        <div className="absolute top-0 right-0 p-2 opacity-50">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-zenith-orange">
                <path d="M0 0H20V20" stroke="currentColor" strokeWidth="1"/>
            </svg>
        </div>
    </div>
  )
}

export default ContributionGraph;