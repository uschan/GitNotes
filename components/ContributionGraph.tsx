import React, { useMemo, useState, useEffect } from 'react';
import { Repository } from '../types';
import { Icons } from './Icon';

interface ContributionGraphProps {
  repos: Repository[];
  onDrawPixel?: (date: string) => Promise<void>;
}

// --- PIXEL ART TEMPLATES ---
// 1 = Pixel On, 0 = Pixel Off
// Grid is 7 rows high (0-6). Patterns are defined as columns of rows.
const PATTERNS: Record<string, number[][]> = {
  'CHINA': [
    // C
    [0,1,1,1,1,1,0],
    [0,1,0,0,0,1,0],
    [0,1,0,0,0,1,0],
    [0,1,0,0,0,1,0],
    // Space
    [0,0,0,0,0,0,0],
    // H
    [0,1,1,1,1,1,0],
    [0,0,0,1,0,0,0],
    [0,0,0,1,0,0,0],
    [0,1,1,1,1,1,0],
    // Space
    [0,0,0,0,0,0,0],
    // I
    [0,1,0,0,0,1,0],
    [0,1,1,1,1,1,0],
    [0,1,0,0,0,1,0],
    // Space
    [0,0,0,0,0,0,0],
    // N
    [0,1,1,1,1,1,0],
    [0,0,1,0,0,0,0],
    [0,0,0,1,0,0,0],
    [0,1,1,1,1,1,0],
    // Space
    [0,0,0,0,0,0,0],
    // A
    [0,1,1,1,1,1,0],
    [0,1,0,0,1,0,0],
    [0,1,0,0,1,0,0],
    [0,1,1,1,1,1,0],
  ],
  'INVADER': [
    [0,0,0,1,1,0,0],
    [0,0,1,1,1,1,0],
    [0,1,1,1,1,1,1],
    [1,1,0,1,1,0,1],
    [1,1,1,1,1,1,1],
    [0,0,1,0,0,1,0],
    [0,1,0,1,1,0,1],
    [1,0,1,0,0,1,0],
  ],
  'HEART': [
    [0,0,1,1,0,0,0],
    [0,1,1,1,1,0,0],
    [0,1,1,1,1,1,0],
    [0,0,1,1,1,0,0],
    [0,0,0,1,0,0,0],
  ],
  '404': [
    // 4
    [0,1,1,1,1,0,0],
    [0,0,0,1,0,0,0],
    [0,0,0,1,0,0,0],
    [0,1,1,1,1,1,0],
    // space
    [0,0,0,0,0,0,0],
    // 0
    [0,1,1,1,1,1,0],
    [0,1,0,0,0,1,0],
    [0,1,0,0,0,1,0],
    [0,1,1,1,1,1,0],
     // space
    [0,0,0,0,0,0,0],
    // 4
    [0,1,1,1,1,0,0],
    [0,0,0,1,0,0,0],
    [0,0,0,1,0,0,0],
    [0,1,1,1,1,1,0],
  ]
};

const ContributionGraph: React.FC<ContributionGraphProps> = ({ repos, onDrawPixel }) => {
  const [daysToGenerate, setDaysToGenerate] = useState(364);
  const [isPixelMode, setIsPixelMode] = useState(false);
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isStamping, setIsStamping] = useState(false);

  useEffect(() => {
      const calculateDays = () => {
          const width = window.innerWidth;
          if (width < 640) return 154; // ~122 weeks (Mobile)
          if (width < 1024) return 364; // 52 weeks (Tablet)
          return 364; // 52 weeks (Desktop)
      };

      const handleResize = () => setDaysToGenerate(calculateDays());
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { weeks, dateMap } = useMemo(() => {
    const map = new Map<string, number>();
    repos.forEach(repo => {
      repo.files.forEach(file => {
        const date = file.updatedAt.split('T')[0];
        map.set(date, (map.get(date) || 0) + 1);
      });
    });

    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - daysToGenerate);
    
    const startDayOfWeek = startDate.getDay(); 
    
    const gridItems: ({ date: string, count: number, intensity: number } | null)[] = [];
    const dMap: Record<string, number> = {}; // Map date string to grid index
    
    for (let i = 0; i < startDayOfWeek; i++) {
        gridItems.push(null);
    }

    for (let i = 0; i <= daysToGenerate; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        const count = map.get(dateStr) || 0;
        
        let intensity = 0;
        if (count > 0) intensity = 1;
        if (count > 2) intensity = 2;
        if (count > 5) intensity = 3;
        if (count > 8) intensity = 4;

        dMap[dateStr] = gridItems.length;
        gridItems.push({ date: dateStr, count, intensity });
    }

    return { weeks: gridItems, totalContributions: Array.from(map.values()).reduce((a, b) => a + b, 0), dateMap: dMap };
  }, [repos, daysToGenerate]);

  // --- STAMP LOGIC ---
  const getStampPreview = (targetDate: string) => {
      if (!selectedTemplate || !PATTERNS[selectedTemplate]) return [];
      
      const pattern = PATTERNS[selectedTemplate];
      const targetIndex = dateMap[targetDate];
      if (targetIndex === undefined) return [];

      const pixelsToDraw: number[] = []; // Indices in gridItems
      
      // Pattern is defined as Columns [ Row0, Row1... ]
      // The Grid flows Column by Column (Top-Down, Left-Right) if we treat every 7 items as a week?
      // CSS Grid is grid-flow-col. So index 0 is Sunday Wk1, Index 1 is Monday Wk1.
      // So pattern[col][row] maps to index + (col * 7) + row
      
      // But we need to align the top of the pattern (row 0) with the Sunday of the current week?
      // Or just map relative to the clicked cell?
      // Let's assume the clicked cell is the Top-Left corner of the pattern.
      
      // Find row of clicked cell (0-6)
      // Since we added spacers, index % 7 should give the row (0=Sun, 6=Sat)
      const clickedRow = targetIndex % 7;
      
      // If we want to align easier, let's force the pattern to start at the row defined in the pattern
      // The pattern array `[0,1,1...]` implies row 0 to 6.
      // So we should find the Sunday of the clicked week.
      const sundayIndex = targetIndex - clickedRow;

      pattern.forEach((colData, colIndex) => {
          colData.forEach((pixelActive, rowIndex) => {
              if (pixelActive === 1) {
                  const pixelIndex = sundayIndex + (colIndex * 7) + rowIndex;
                  // Boundary check
                  if (pixelIndex < weeks.length && weeks[pixelIndex] !== null) {
                      pixelsToDraw.push(pixelIndex);
                  }
              }
          });
      });
      
      return pixelsToDraw;
  };

  const handleCellClick = async (date: string) => {
      if (!isPixelMode || !onDrawPixel || isStamping) return;

      if (selectedTemplate) {
          // Stamp Mode
          const indicesToStamp = getStampPreview(date);
          if (indicesToStamp.length === 0) return;
          
          if (!confirm(`Deploy pattern "${selectedTemplate}"? This will create ${indicesToStamp.length} commits.`)) return;

          setIsStamping(true);
          try {
             // Sequential execution to avoid rate limits or browser hanging
             for (const idx of indicesToStamp) {
                 const item = weeks[idx];
                 if (item && item.date) {
                     await onDrawPixel(item.date);
                     // Small artificial delay for visual satisfaction / safety
                     await new Promise(r => setTimeout(r, 50)); 
                 }
             }
          } catch (e) {
              console.error(e);
              alert("Stamp sequence interrupted.");
          } finally {
              setIsStamping(false);
              setSelectedTemplate(null); // Reset after stamp
          }

      } else {
          // Single Pixel Mode
          await onDrawPixel(date);
      }
  };

  // Preview Logic
  const previewIndices = useMemo(() => {
      if (!isPixelMode || !selectedTemplate || !hoverDate) return new Set<number>();
      return new Set(getStampPreview(hoverDate));
  }, [isPixelMode, selectedTemplate, hoverDate, dateMap]);

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
                        {isPixelMode ? (isStamping ? 'STAMPING SEQUENCE...' : 'PIXEL ART // EDIT MODE') : 'Activity Matrix'}
                    </div>
                </div>
                <div className="text-white font-bold font-mono text-sm uppercase tracking-tight flex items-center gap-4">
                     {isPixelMode && !isStamping ? (
                         <div className="flex gap-2">
                             {Object.keys(PATTERNS).map(key => (
                                 <button
                                    key={key}
                                    onClick={() => setSelectedTemplate(selectedTemplate === key ? null : key)}
                                    className={`text-[10px] px-2 py-0.5 border transition-colors ${selectedTemplate === key ? 'bg-zenith-orange text-black border-zenith-orange' : 'border-zenith-border text-zenith-muted hover:text-white'}`}
                                 >
                                     {key}
                                 </button>
                             ))}
                         </div>
                     ) : (
                        <span>{weeks.filter(x => x && x.count > 0).reduce((acc, curr) => acc + (curr?.count || 0), 0)} Operations</span>
                     )}
                </div>
             </div>
             
             <div className="flex items-center gap-4">
                 {/* Pixel Mode Toggle */}
                 {onDrawPixel && (
                     <button 
                        disabled={isStamping}
                        onClick={() => {
                            setIsPixelMode(!isPixelMode);
                            setSelectedTemplate(null);
                        }}
                        className={`text-[10px] font-mono font-bold uppercase px-3 py-1.5 border transition-all ${isPixelMode ? 'bg-zenith-orange text-black border-zenith-orange' : 'border-zenith-border text-zenith-muted hover:text-white hover:border-white'} ${isStamping ? 'opacity-50 cursor-wait' : ''}`}
                     >
                         {isStamping ? 'Printing...' : (isPixelMode ? 'Exit Art Mode' : 'Draw')}
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
                    
                    const isPreview = previewIndices.has(idx);

                    return (
                        <div 
                            key={day.date}
                            onClick={() => handleCellClick(day.date)}
                            onMouseEnter={() => setHoverDate(day.date)}
                            onMouseLeave={() => setHoverDate(null)}
                            title={isPixelMode ? (selectedTemplate ? `Stamp ${selectedTemplate}` : `Draw Pixel ${day.date}`) : `${day.count} updates`}
                            className={`w-2.5 h-2.5 rounded-[1px] transition-all duration-100 border border-transparent 
                                ${isPixelMode && !isStamping ? 'cursor-pointer' : ''}
                                ${isPreview ? 'bg-zenith-orange animate-pulse scale-110 z-10 shadow-[0_0_5px_#FF4D00]' : ''}
                                ${
                                !isPreview && day.intensity === 0 ? 'bg-zenith-border/20' : 
                                !isPreview && day.intensity === 1 ? 'bg-zenith-orange/20' :
                                !isPreview && day.intensity === 2 ? 'bg-zenith-orange/40' :
                                !isPreview && day.intensity === 3 ? 'bg-zenith-orange/70' :
                                !isPreview && day.intensity === 4 ? 'bg-zenith-orange shadow-[0_0_8px_rgba(255,77,0,0.4)]' : ''
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