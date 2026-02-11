
"use client";

import { useState, useEffect, useRef } from "react";
import type { Geometry, DesignParameters } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VisualizationProps {
  geometry: Geometry | null;
  isProcessing: boolean;
  parameters: DesignParameters;
  panelOpenStates: number[];
  panelOffsets: number[];
  togglePanelOpenState: (index: number) => void;
  updatePanelOffsets: (offsets: number[]) => void;
}

const FRAME_COLORS: Record<DesignParameters['color'], string> = {
    white: '#EBEBEB',
    charcoal: '#343434',
    bronze: '#5C4033',
    silver: '#C0C0C0',
    'wood-effect': '#8B4513'
};

const PADDING = 100;

export function Visualization({ geometry, isProcessing, parameters, panelOpenStates, panelOffsets, togglePanelOpenState, updatePanelOffsets }: VisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [draggedPanel, setDraggedPanel] = useState<{ index: number; startX: number } | null>(null);

  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 3200, height: 2600 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStartPoint, setDragStartPoint] = useState({ x: 0, y: 0 });
  const viewGeomRef = useRef({ width: 0, height: 0 });

  const zoom = !geometry ? 1 : (geometry.frame.outer.width + PADDING * 2) / viewBox.width;


  useEffect(() => {
    if (geometry) {
      if (
        geometry.frame.outer.width !== viewGeomRef.current.width ||
        geometry.frame.outer.height !== viewGeomRef.current.height
      ) {
        resetView();
        viewGeomRef.current = {
          width: geometry.frame.outer.width,
          height: geometry.frame.outer.height,
        };
      }
    } else {
        setViewBox({ x: 0, y: 0, width: 3200, height: 2600 });
        viewGeomRef.current = { width: 0, height: 0 };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geometry]);

  const frameColor = FRAME_COLORS[parameters.color] ?? '#343434';

  const getSvgPoint = (e: React.MouseEvent | React.WheelEvent | MouseEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const pt = svgRef.current.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svgRef.current.getScreenCTM()?.inverse());
    return { x: svgP.x, y: svgP.y };
  };

  const isOperableUpDown = parameters.system === 'awning' || parameters.system === 'tilt-and-turn';
  const isCasement = parameters.system === 'casement';
  const isFoldable = parameters.system === 'foldable';
  const isSliding = parameters.system.includes('track');
  
  const handlePanelClick = (e: React.MouseEvent, index: number) => {
    if (isSliding) return;
    if (!isOperableUpDown && !isCasement && !isFoldable) return;
    
    e.stopPropagation();
    togglePanelOpenState(index);
  };

  const handlePanelMouseDown = (e: React.MouseEvent, index: number) => {
    if (!isSliding) return;
    e.stopPropagation();
    const svgPoint = getSvgPoint(e);
    setDraggedPanel({ index, startX: svgPoint.x - (panelOffsets[index] || 0) });
    if (svgRef.current) {
      svgRef.current.style.cursor = 'grabbing';
    }
  };


  const handleMouseUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDraggingCanvas) {
      setIsDraggingCanvas(false);
      if (svgRef.current) {
        svgRef.current.style.cursor = 'grab';
      }
    }
    if (draggedPanel) {
      setDraggedPanel(null);
      if (svgRef.current) {
        svgRef.current.style.cursor = 'grab';
      }
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    setIsDraggingCanvas(true);
    setDragStartPoint({ x: e.clientX, y: e.clientY });
    if (svgRef.current) {
      svgRef.current.style.cursor = 'grabbing';
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
     if (draggedPanel && isSliding && geometry) {
        const svgPoint = getSvgPoint(e);
        let newOffset = svgPoint.x - draggedPanel.startX;

        const panel = geometry.panels[draggedPanel.index];
        const frame = geometry.frame;

        const minOffset = -panel.panelRect.x;
        const maxOffset = frame.outer.width - panel.panelRect.width - panel.panelRect.x;
        
        newOffset = Math.max(minOffset, Math.min(newOffset, maxOffset));

        const newOffsets = [...panelOffsets];
        newOffsets[draggedPanel.index] = newOffset;
        updatePanelOffsets(newOffsets);
        return;
    }

    if (!isDraggingCanvas || !svgRef.current || !geometry) return;
    
    const scaleX = viewBox.width / svgRef.current.clientWidth;
    const scaleY = viewBox.height / svgRef.current.clientHeight;

    const dx = (e.clientX - dragStartPoint.x) * scaleX;
    const dy = (e.clientY - dragStartPoint.y) * scaleY;
    
    setViewBox(prev => ({ ...prev, x: prev.x - dx, y: prev.y - dy }));
    setDragStartPoint({ x: e.clientX, y: e.clientY });
  };
  

  const handleWheel = (e: React.WheelEvent) => {
    if (!svgRef.current || !geometry) return;
    e.preventDefault();
    e.stopPropagation();
  
    const cursorPoint = getSvgPoint(e);
  
    const zoomFactor = 1.1;
    const { deltaY } = e;
    
    const { x, y, width, height } = viewBox;
  
    const contentWidth = geometry.frame.outer.width + PADDING * 2;
  
    let newWidth;
  
    if (deltaY < 0) { // Zoom in
      newWidth = Math.max(width / zoomFactor, contentWidth * 0.05); // Max zoom in (20x)
    } else { // Zoom out
      newWidth = Math.min(width * zoomFactor, contentWidth * 10);   // Max zoom out (0.1x)
    }

    if (newWidth === width) return; // No change

    const newHeight = newWidth * (height / width);
  
    const dx = cursorPoint.x - x;
    const dy = cursorPoint.y - y;
  
    const newX = x + dx * (1 - newWidth / width);
    const newY = y + dy * (1 - newHeight / height);
    
    setViewBox({ x: newX, y: newY, width: newWidth, height: newHeight });
  };

  const resetView = () => {
    if (geometry) {
      setViewBox({
        x: 0,
        y: 0,
        width: geometry.frame.outer.width + PADDING * 2,
        height: geometry.frame.outer.height + PADDING * 2,
      });
    }
  };

  return (
    <div
      className="relative w-full h-full bg-card rounded-lg border shadow-sm flex items-center justify-center overflow-hidden"
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      {(isProcessing || !geometry) && (
        <Skeleton className="absolute w-full h-full" />
      )}
      {geometry && (
         <Button
          onClick={resetView}
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 z-10 h-9 w-9 bg-background/50 backdrop-blur-sm hover:bg-background/80"
          title="Reset View"
        >
          <Maximize className="h-5 w-5" />
        </Button>
      )}
      {geometry && (
        <svg
          ref={svgRef}
          className={cn("w-full h-full transition-opacity duration-300", isProcessing ? "opacity-50" : "opacity-100", isDraggingCanvas || draggedPanel ? 'cursor-grabbing' : 'cursor-grab')}
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth={6 / zoom} markerHeight={6 / zoom} orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="hsl(var(--foreground))" opacity="0.7" />
            </marker>
          </defs>

          <g transform={`translate(${PADDING}, ${PADDING})`}>
            {/* Frame */}
            <rect {...geometry.frame.outer} fill={frameColor} stroke="hsl(var(--border))" strokeWidth={2 / zoom} strokeLinecap="round" />
            
            {/* Panels */}
            {geometry.panels.map((panel, index) => {
              const openState = panelOpenStates[index] ?? 0;
              let transformString = ``;
              const rect = panel.panelRect;

              if(isSliding) {
                  const offsetX = panelOffsets[index] ?? 0;
                  transformString += ` translate(${offsetX}, 0)`;
              }
              
              if (openState > 0) {
                const openRatio = openState === 1 ? 0.5 : 1.0;
                const angleRad = (45 * openRatio) * (Math.PI / 180);
                const perspectiveFactor = 0.1; // How much perspective effect

                if (isOperableUpDown) {
                  const scaleY = Math.cos(angleRad);
                  const scaleX = 1 - Math.sin(angleRad) * perspectiveFactor;
                  
                  const originX = rect.x + rect.width / 2;
                  const originY = rect.y; // Hinge at the top

                  transformString += `
                    translate(${originX}, ${originY})
                    scale(${scaleX}, ${scaleY})
                    translate(${-originX}, ${-originY})
                  `;
                } else if (isCasement || isFoldable) {
                  const scaleX = Math.cos(angleRad);
                  const scaleY = 1 - Math.sin(angleRad) * perspectiveFactor;

                  if (isCasement) {
                      const direction = parameters.casementOpening || 'pair';
                      let hingeIsLeft;
                      if (direction === 'left') {
                          hingeIsLeft = true;
                      } else if (direction === 'right') {
                          hingeIsLeft = false;
                      } else { // pair
                          hingeIsLeft = index % 2 === 0;
                      }

                      if (hingeIsLeft) {
                          const originX = rect.x;
                          const originY = rect.y + rect.height / 2;
                          transformString += `
                              translate(${originX}, ${originY})
                              scale(${scaleX}, ${scaleY})
                              translate(${-originX}, ${-originY})
                          `;
                      } else { // Hinge is right
                          const originX = rect.x + rect.width;
                          const originY = rect.y + rect.height / 2;
                          
                          transformString += `
                              translate(${originX}, ${originY})
                              scale(${scaleX}, ${scaleY})
                              translate(${-originX}, ${-originY})
                          `;
                      }
                  } else { // for isFoldable
                      const pairIndex = Math.floor(index / 2);
                      const isFirstInPair = index % 2 === 0;
                      
                      const firstPanelInPairRect = geometry.panels[pairIndex * 2].panelRect;
                      const hingeX = firstPanelInPairRect.x + firstPanelInPairRect.width;
                      const hingeY = firstPanelInPairRect.y + firstPanelInPairRect.height / 2;

                      if (isFirstInPair) { // Panel 0, 2... rotates "backwards" around the hinge
                          const foldAngleRad = -angleRad;
                          const foldScaleX = Math.cos(foldAngleRad);
                          const foldScaleY = 1 - Math.sin(Math.abs(foldAngleRad)) * perspectiveFactor;
                          transformString += `
                              translate(${hingeX}, ${hingeY})
                              scale(${foldScaleX}, ${foldScaleY})
                              translate(${-hingeX}, ${-hingeY})
                          `;

                      } else { // Panel 1, 3... rotates "forwards"
                          transformString += `
                              translate(${hingeX}, ${hingeY})
                              scale(${scaleX}, ${scaleY})
                              translate(${-hingeX}, ${-hingeY})
                          `;
                      }
                  }
                }
              }

              return (
                <g 
                  key={index}
                  transform={transformString}
                  onMouseDown={(e) => handlePanelMouseDown(e, index)}
                  onClick={(e) => handlePanelClick(e, index)}
                  style={{ transitionDuration: draggedPanel?.index === index ? '0ms' : '300ms' }}
                  className={cn(
                    'transition-transform',
                    ((isOperableUpDown || isCasement || isFoldable) && !isSliding) && 'cursor-pointer',
                    isSliding && 'cursor-grab'
                  )}
                >
                  <rect {...panel.panelRect} fill={frameColor} stroke="hsl(var(--foreground))" strokeWidth={1 / zoom} />
                  <rect {...panel.glassRect} fill="hsl(var(--secondary))" opacity="0.5" />
                  <text
                    x={panel.glassRect.x + panel.glassRect.width / 2}
                    y={panel.glassRect.y + panel.glassRect.height / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="hsl(var(--foreground))"
                    opacity="0.2"
                    fontSize={40 / zoom}
                    fontWeight="bold"
                    className="pointer-events-none uppercase tracking-wider"
                  >
                    {parameters.glass.replace('-', ' ')}
                  </text>
                </g>
              )
            })}

             {/* Tracks */}
            {geometry.tracks.map((track, index) => (
              <line key={index} {...track} stroke="hsl(var(--border))" strokeWidth={1 / zoom} strokeDasharray={`${4 / zoom} ${2 / zoom}`} />
            ))}

            {/* Dimensions */}
            <g className="text-muted-foreground" style={{ userSelect: "none" }}>
              {/* Width */}
              <path d={`M 0 -45 L ${geometry.frame.outer.width} -45`} stroke="hsl(var(--foreground))" strokeWidth={1 / zoom} opacity="0.7" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
              <line x1="0" y1="-50" x2="0" y2="0" stroke="hsl(var(--foreground))" strokeWidth={1 / zoom} opacity="0.7" />
              <line x1={geometry.frame.outer.width} y1="-50" x2={geometry.frame.outer.width} y2="0" stroke="hsl(var(--foreground))" strokeWidth={1 / zoom} opacity="0.7" />
              
              <text 
                x={geometry.frame.outer.width / 2} 
                y={-60} 
                textAnchor="middle" 
                fill="hsl(var(--foreground))"
                fontSize={40 / zoom}
                className="font-semibold"
              >
                  {geometry.frame.outer.width} mm
              </text>
              
              {/* Height */}
              <path d={`M ${geometry.frame.outer.width + 45} 0 L ${geometry.frame.outer.width + 45} ${geometry.frame.outer.height}`} stroke="hsl(var(--foreground))" strokeWidth={1 / zoom} opacity="0.7" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
              <line x1={geometry.frame.outer.width} y1="0" x2={geometry.frame.outer.width + 50} y2="0" stroke="hsl(var(--foreground))" strokeWidth={1 / zoom} opacity="0.7" />
              <line x1={geometry.frame.outer.width} y1={geometry.frame.outer.height} x2={geometry.frame.outer.width + 50} y2={geometry.frame.outer.height} stroke="hsl(var(--foreground))" strokeWidth={1 / zoom} opacity="0.7" />
              
              <text 
                x={geometry.frame.outer.width + 60} 
                y={geometry.frame.outer.height / 2} 
                textAnchor="middle" 
                fill="hsl(var(--foreground))" 
                transform={`rotate(-90 ${geometry.frame.outer.width + 60},${geometry.frame.outer.height / 2})`} 
                fontSize={40 / zoom}
                className="font-semibold"
              >
                  {geometry.frame.outer.height} mm
              </text>
            </g>
          </g>
        </svg>
      )}
    </div>
  );
}
