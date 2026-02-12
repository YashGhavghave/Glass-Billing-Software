
"use client";

import { useState, useRef, MouseEvent, useMemo, useEffect, WheelEvent, useCallback } from "react";
import { CustomDesignToolbar, Tool } from "./custom-design-toolbar";
import { cn } from "@/lib/utils";
import type { 
    MaterialType, 
    GlassType, 
    ProfileType, 
    BillOfMaterialsItem, 
    CutListItem, 
    ProjectOutput,
    Frame,
    Mullion,
    Dimension,
    TextBox,
    CanvasElement,
    SelectedElement,
    OpeningType,
    InfillType
} from "@/lib/types";
import { useDesignStore } from "@/store/use-design-store";

type ResizeHandle = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top' | 'bottom' | 'left' | 'right' | 'rotate';
type LineResizeHandle = 'start' | 'end';
type Mode = 'idle' | 'drawing' | 'panning' | 'selecting' | 'dragging' | 'resizing' | 'rotating';

type DragInfo = {
  element: CanvasElement;
  startX: number;
  startY: number;
  elementStartX: number;
  elementStartY: number;
  elementEndX?: number;
  elementEndY?: number;
  elementStartWidth?: number;
  elementStartHeight?: number;
  handle?: ResizeHandle | LineResizeHandle;
  childElements?: {
    id: string;
    type: 'mullion' | 'dimension';
    startX1: number;
    startY1: number;
    startX2: number;
    startY2: number;
  }[];
  elementCenterX?: number;
  elementCenterY?: number;
};

const DEFAULT_FRAME_THICKNESS = 40;
const DEFAULT_MULLION_THICKNESS = 40;
const SELECTION_OUTLINE_WIDTH = 3;
const GRID_SIZE = 40;
const SNAP_THRESHOLD = 8;
const HANDLE_SIZE = 8;
const ROTATION_HANDLE_DISTANCE = 30;
const DEFAULT_STROKE_COLOR = "#343434"; // Charcoal color from parametric view
const SELECTED_ELEMENT_COLOR = "hsl(var(--primary))";
const DIMENSION_COLOR = "hsl(var(--destructive))";
const DEFAULT_MATERIAL: MaterialType = 'aluminum';
const DEFAULT_GLASS: GlassType = 'standard';
const DEFAULT_INFILL: InfillType = 'glass';

export function CustomDesignCanvas({ fullscreenContainerRef }: { fullscreenContainerRef?: React.RefObject<HTMLDivElement> }) {
  const { activeDesign, setCustomElements, setCustomDesignOutput, panOffset, zoom, setCustomCanvasView } = useDesignStore(state => ({
    activeDesign: state.designs.find(d => d.id === state.activeDesignId),
    setCustomElements: state.setCustomElements,
    setCustomDesignOutput: state.setCustomDesignOutput,
    panOffset: state.customCanvas.panOffset,
    zoom: state.customCanvas.zoom,
    setCustomCanvasView: state.setCustomCanvasView,
  }));

  const frames = activeDesign?.frames || [];
  const mullions = activeDesign?.mullions || [];
  const dimensions = activeDesign?.dimensions || [];
  const textBoxes = activeDesign?.textBoxes || [];

  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
  const [mode, setMode] = useState<Mode>('idle');
  const [paintColor, setPaintColor] = useState<string>(DEFAULT_STROKE_COLOR);
  const [paintTarget, setPaintTarget] = useState<'frame' | 'glass' | 'line'>('frame');
  const [editingText, setEditingText] = useState<TextBox | null>(null);
  const [rotationIndicator, setRotationIndicator] = useState<{ angle: number; x: number; y: number } | null>(null);
  
  const dragInfo = useRef<DragInfo | null>(null);
  const panStart = useRef<{ x: number, y: number }>({ x: 0, y: 0 });
  const drawingElement = useRef<Frame | Mullion | Dimension | TextBox | null>(null);
  const lastDrawnElement = useRef<CanvasElement | null>(null);
  
  const canvasRef = useRef<HTMLDivElement>(null);

  // --- Undo/Redo ---
  const history = useRef<{ frames: Frame[]; mullions: Mullion[]; dimensions: Dimension[], textBoxes: TextBox[] }[]>([{ frames: [], mullions: [], dimensions: [], textBoxes: [] }]);
  const historyIndex = useRef(0);
  const isOperationInProgress = useRef(false);
  const [undoRedoState, setUndoRedoState] = useState({ canUndo: false, canRedo: false });

  const selectedElementData = useMemo(() => {
    if (!selectedElement) return null;
    if (selectedElement.type === 'frame') {
        return frames.find(f => f.id === selectedElement.id) ?? null;
    }
    if (selectedElement.type === 'mullion') {
        return mullions.find(m => m.id === selectedElement.id) ?? null;
    }
    if (selectedElement.type === 'textbox') {
        return textBoxes.find(tb => tb.id === selectedElement.id) ?? null;
    }
    return null;
  }, [selectedElement, frames, mullions, textBoxes]);

  const updateElements = useCallback((newElements: { frames?: Frame[], mullions?: Mullion[], dimensions?: Dimension[], textBoxes?: TextBox[] }) => {
    setCustomElements(newElements);
  }, [setCustomElements]);

  useEffect(() => {
    const bom: BillOfMaterialsItem[] = [];
    const cutList: CutListItem[] = [];
    let totalSealingLength = 0;
    
    frames.forEach(frame => {
        const frameMaterial = frame.material || 'aluminum';
        const frameProfile: ProfileType = 'standard'; // Assumption for now
        const frameWidth = frame.width;
        const frameHeight = frame.height;
        const frameThickness = frame.thickness || DEFAULT_FRAME_THICKNESS;

        const outerFrameLength = 2 * (frameWidth + frameHeight);
        bom.push({
            item: 'Frame Profile',
            description: `${frameMaterial.charAt(0).toUpperCase() + frameMaterial.slice(1)} Profile (${frameProfile})`,
            quantity: parseFloat((outerFrameLength / 1000).toFixed(2)),
            unit: 'm'
        });

        cutList.push({ part: `Frame: ${frame.id} (Top/Bottom)`, length: frameWidth, angle: '45° Mitre', quantity: 2, profile: frameProfile, material: frameMaterial });
        cutList.push({ part: `Frame: ${frame.id} (Left/Right)`, length: frameHeight, angle: '45° Mitre', quantity: 2, profile: frameProfile, material: frameMaterial });
        
        const infill = frame.infill || 'glass';
        const glassWidth = frameWidth - 2 * frameThickness;
        const glassHeight = frameHeight - 2 * frameThickness;

        if (glassWidth > 0 && glassHeight > 0) {
            const glassArea = (glassWidth * glassHeight) / 1_000_000;
            if (infill === 'glass') {
                const glass = frame.glass || 'standard';
                bom.push({ item: 'Glass Panel', description: `${glass}`, quantity: parseFloat(glassArea.toFixed(2)), unit: 'm²' });
                totalSealingLength += 2 * (glassWidth + glassHeight);
            } else if (infill === 'panel') {
                bom.push({ item: 'Solid Panel', description: 'Insulated Panel', quantity: parseFloat(glassArea.toFixed(2)), unit: 'm²' });
                totalSealingLength += 2 * (glassWidth + glassHeight);
            } else if (infill === 'louver') {
                const louverBlades = Math.floor(glassHeight / 20); // assuming 20mm per louver
                bom.push({ item: 'Louver Blades', description: 'Aluminum Louver', quantity: louverBlades * glassWidth / 1000, unit: 'm' });
            }
        }
    });

    mullions.forEach(mullion => {
        const mullionMaterial = mullion.material || 'aluminum';
        const mullionProfile: ProfileType = 'standard'; // Assumption
        const length = Math.hypot(mullion.x2 - mullion.x1, mullion.y2 - mullion.y1);
        
        const existingBomItem = bom.find(item => item.item === 'Mullion Profile' && item.description.includes(mullionMaterial));
        if (existingBomItem) {
            existingBomItem.quantity += length / 1000;
        } else {
             bom.push({ item: 'Mullion Profile', description: `${mullionMaterial.charAt(0).toUpperCase() + mullionMaterial.slice(1)} Profile (${mullionProfile})`, quantity: length / 1000, unit: 'm' });
        }
        
        cutList.push({ part: `Mullion: ${mullion.id}`, length: parseFloat(length.toFixed(1)), angle: '90°', quantity: 1, profile: mullionProfile, material: mullionMaterial });
        
        totalSealingLength += length * 2;
    });

    const consolidatedBom = bom.reduce<BillOfMaterialsItem[]>((acc, item) => {
        const existing = acc.find(i => i.item === item.item && i.description === item.description);
        if (existing) {
            existing.quantity = parseFloat((existing.quantity + item.quantity).toFixed(2));
        } else {
            acc.push({ ...item, quantity: parseFloat(item.quantity.toFixed(2)) });
        }
        return acc;
    }, []);

     if (totalSealingLength > 0) {
        consolidatedBom.push({ item: 'Weather Stripping', description: 'EPDM Seal', quantity: parseFloat((totalSealingLength / 1000).toFixed(2)), unit: 'm' });
    }

    const newOutputs = (frames.length > 0 || mullions.length > 0) 
      ? { bom: consolidatedBom, cutList } 
      : null;
      
    if (activeDesign?.id) {
      setCustomDesignOutput(activeDesign.id, newOutputs);
    }
  }, [frames, mullions, activeDesign?.id, setCustomDesignOutput]);
  
  const recordHistory = useCallback((force = false) => {
    if (isOperationInProgress.current && !force) {
      return;
    }
  
    history.current.splice(historyIndex.current + 1);
  
    const currentState = { frames, mullions, dimensions, textBoxes };
    
    if (history.current.length > 0) {
      const lastState = history.current[history.current.length - 1];
      if (JSON.stringify(lastState) === JSON.stringify(currentState)) {
        return; // Don't add duplicate states
      }
    }

    history.current.push(currentState);
    historyIndex.current = history.current.length - 1;
  
    setUndoRedoState({
      canUndo: historyIndex.current > 0,
      canRedo: false,
    });
  }, [frames, mullions, dimensions, textBoxes]);
  
  
  const handleUndo = useCallback(() => {
    if (historyIndex.current > 0) {
      isOperationInProgress.current = true; // Prevent re-recording
      historyIndex.current--;
      const state = history.current[historyIndex.current];
      updateElements({
        frames: state.frames,
        mullions: state.mullions,
        dimensions: state.dimensions,
        textBoxes: state.textBoxes,
      });
      setSelectedElement(null);
      setUndoRedoState({
        canUndo: historyIndex.current > 0,
        canRedo: true,
      });
      requestAnimationFrame(() => {
        isOperationInProgress.current = false;
      });
    }
  }, [updateElements]);
  
  const handleRedo = useCallback(() => {
    if (historyIndex.current < history.current.length - 1) {
      isOperationInProgress.current = true; // Prevent re-recording
      historyIndex.current++;
      const state = history.current[historyIndex.current];
      updateElements({
        frames: state.frames,
        mullions: state.mullions,
        dimensions: state.dimensions,
        textBoxes: state.textBoxes,
      });
      setSelectedElement(null);
      setUndoRedoState({
        canUndo: true,
        canRedo: historyIndex.current < history.current.length - 1,
      });
      requestAnimationFrame(() => {
        isOperationInProgress.current = false;
      });
    }
  }, [updateElements]);

  const updateAndRecord = (updateAction: () => void) => {
    updateAction();
    requestAnimationFrame(() => recordHistory(true));
  };

  const handleDeleteSelected = useCallback(() => {
    if (selectedElement) {
        updateAndRecord(() => {
            const elementId = selectedElement.id;
            const newElements: { frames?: Frame[], mullions?: Mullion[], dimensions?: Dimension[], textBoxes?: TextBox[] } = {};
            if (selectedElement.type === 'frame') {
                newElements.frames = frames.filter(s => s.id !== elementId);
                newElements.mullions = mullions.filter(m => m.parentId !== elementId);
                newElements.dimensions = dimensions.filter(d => d.parentId !== elementId);
            } else if (selectedElement.type === 'mullion') {
                const mullionToDelete = mullions.find(m => m.id === elementId);
                if (mullionToDelete?.groupId) {
                    newElements.mullions = mullions.filter(m => m.groupId !== mullionToDelete.groupId);
                } else {
                    newElements.mullions = mullions.filter(m => m.id !== elementId);
                }
            } else if (selectedElement.type === 'dimension') {
                newElements.dimensions = dimensions.filter(d => d.id !== elementId);
            } else if (selectedElement.type === 'textbox') {
                newElements.textBoxes = textBoxes.filter(tb => tb.id !== elementId);
            }
            updateElements(newElements);
            setSelectedElement(null);
        });
    }
  }, [selectedElement, frames, mullions, dimensions, textBoxes, updateElements, recordHistory]);

  const handleIncreaseThickness = () => {
    if (!selectedElement) return;
    updateAndRecord(() => {
        const increment = 5;
        if (selectedElement.type === 'frame') {
            updateElements({ frames: frames.map(f => {
                if (f.id === selectedElement.id) {
                    const currentThickness = f.thickness || DEFAULT_FRAME_THICKNESS;
                    return {...f, thickness: Math.min(currentThickness + increment, 100)};
                }
                return f;
            })});
        } else if (selectedElement.type === 'mullion') {
            updateElements({ mullions: mullions.map(m => {
                if (m.id === selectedElement.id) {
                    const currentThickness = m.thickness || DEFAULT_MULLION_THICKNESS;
                    return {...m, thickness: Math.min(currentThickness + increment, 100)};
                }
                return m;
            })});
        }
    });
  };

  const handleDecreaseThickness = () => {
    if (!selectedElement) return;
    updateAndRecord(() => {
        const decrement = 5;
        if (selectedElement.type === 'frame') {
            updateElements({ frames: frames.map(f => {
                if (f.id === selectedElement.id) {
                    const currentThickness = f.thickness || DEFAULT_FRAME_THICKNESS;
                    return {...f, thickness: Math.max(currentThickness - decrement, 5)};
                }
                return f;
            })});
        } else if (selectedElement.type === 'mullion') {
            updateElements({ mullions: mullions.map(m => {
                if (m.id === selectedElement.id) {
                    const currentThickness = m.thickness || DEFAULT_MULLION_THICKNESS;
                    return {...m, thickness: Math.max(currentThickness - decrement, 5)};
                }
                return m;
            })});
        }
    });
  };

    const updateSelectedElementMaterial = (material: MaterialType) => {
        if (!selectedElement) return;
        updateAndRecord(() => {
            const newColor = material === 'wood' 
                ? 'linear-gradient(to right, #C6A686, #8B6B4E)' // Natural Oak
                : material === 'aluminum'
                ? '#C0C0C0' // Silver
                : '#EBEBEB'; // White for uPVC

            if (selectedElement.type === 'frame') {
                updateElements({ frames: frames.map(f => f.id === selectedElement.id ? { ...f, material, color: newColor } : f)});
            } else if (selectedElement.type === 'mullion') {
                updateElements({ mullions: mullions.map(m => m.id === selectedElement.id ? { ...m, material, color: newColor } : m)});
            }
        });
    };

    const updateSelectedElementInfillType = (infill: InfillType) => {
        if (!selectedElement || selectedElement.type !== 'frame') return;
        updateAndRecord(() => {
            updateElements({ frames: frames.map(f => f.id === selectedElement.id ? { ...f, infill } : f)});
        });
    };

    const updateSelectedElementGlass = (glass: GlassType) => {
        if (!selectedElement || selectedElement.type !== 'frame') return;
        updateAndRecord(() => {
            updateElements({ frames: frames.map(f => f.id === selectedElement.id ? { ...f, glass } : f)});
        });
    };

    const updateSelectedElementOpeningType = (opening: OpeningType) => {
        if (!selectedElement || selectedElement.type !== 'frame') return;
        updateAndRecord(() => {
            updateElements({
                frames: frames.map(f =>
                    f.id === selectedElement.id ? { ...f, opening, openState: 0 } : f
                )
            });
        });
    };

    const handleAddShape = (shapeType: string) => {
        const centerX = -panOffset.x / zoom + (canvasRef.current?.clientWidth ?? 0) / (2 * zoom);
        const centerY = -panOffset.y / zoom + (canvasRef.current?.clientHeight ?? 0) / (2 * zoom);
        const size = 300;
        const groupId = `group_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        if (shapeType === 'rectangle') {
            const newFrame: Frame = {
                id: `frame_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                type: 'frame',
                x: centerX - size / 2,
                y: centerY - size / 2,
                width: size,
                height: size,
                material: DEFAULT_MATERIAL,
                infill: DEFAULT_INFILL,
                glass: DEFAULT_GLASS,
                color: DEFAULT_STROKE_COLOR, 
                opening: 'fixed',
                openState: 0,
            };
            const newFrames = [...frames, newFrame];
            const offset = 20;
            const widthDim: Dimension = { id: `dim_${Date.now()}_w`, type: 'dimension', x1: newFrame.x, y1: newFrame.y - offset, x2: newFrame.x + newFrame.width, y2: newFrame.y - offset, text: `${Math.round(newFrame.width)}mm`, parentId: newFrame.id };
            const heightDim: Dimension = { id: `dim_${Date.now()}_h`, type: 'dimension', x1: newFrame.x - offset, y1: newFrame.y, x2: newFrame.x - offset, y2: newFrame.y + newFrame.height, text: `${Math.round(newFrame.height)}mm`, parentId: newFrame.id };
            updateElements({ frames: newFrames, dimensions: [...dimensions, widthDim, heightDim] });
            return;
        }

        const newMullions: Mullion[] = [];
        let points: {x: number, y: number}[] = [];

        if (shapeType === 'triangle') {
            points = [
                { x: centerX, y: centerY - size * Math.sqrt(3) / 4 },
                { x: centerX - size / 2, y: centerY + size * Math.sqrt(3) / 4 },
                { x: centerX + size / 2, y: centerY + size * Math.sqrt(3) / 4 },
            ];
        } else if (shapeType === 'pentagon') {
            const numSides = 5;
            for (let i = 0; i < numSides; i++) {
                points.push({
                    x: centerX + (size/2) * Math.cos((i * (360/numSides) - 90) * Math.PI / 180),
                    y: centerY + (size/2) * Math.sin((i * (360/numSides) - 90) * Math.PI / 180)
                });
            }
        } else if (shapeType === 'hexagon') {
            const numSides = 6;
            for (let i = 0; i < numSides; i++) {
                points.push({
                    x: centerX + (size/2) * Math.cos((i * (360/numSides) - 90) * Math.PI / 180),
                    y: centerY + (size/2) * Math.sin((i * (360/numSides) - 90) * Math.PI / 180)
                });
            }
        } else if (shapeType === 'octagon') {
            const numSides = 8;
            for (let i = 0; i < numSides; i++) {
                points.push({
                    x: centerX + (size/2) * Math.cos((i * (360/numSides) - 90) * Math.PI / 180),
                    y: centerY + (size/2) * Math.sin((i * (360/numSides) - 90) * Math.PI / 180)
                });
            }
        } else if (shapeType === 'circle') {
            const sides = 24;
            for (let i = 0; i < sides; i++) {
                points.push({
                    x: centerX + (size/2) * Math.cos(i * (360/sides) * Math.PI / 180),
                    y: centerY + (size/2) * Math.sin(i * (360/sides) * Math.PI / 180)
                });
            }
        } else if (shapeType === 'arch') {
            const rectWidth = size;
            const rectHeight = size / 1.5;
            const radius = rectWidth / 2;
            const totalHeight = rectHeight + radius;
            const startX = centerX - radius;
            const startY = centerY - totalHeight / 2;

            const archMullions: Mullion[] = [];
            
            // Left vertical side
            archMullions.push({ id: `mullion_${Date.now()}_${Math.random().toString(36).substring(2, 9)}_L`, type: 'mullion', x1: startX, y1: startY + radius, x2: startX, y2: startY + totalHeight, material: DEFAULT_MATERIAL, color: DEFAULT_STROKE_COLOR, groupId });

            // Right vertical side
            archMullions.push({ id: `mullion_${Date.now()}_${Math.random().toString(36).substring(2, 9)}_R`, type: 'mullion', x1: startX + rectWidth, y1: startY + radius, x2: startX + rectWidth, y2: startY + totalHeight, material: DEFAULT_MATERIAL, color: DEFAULT_STROKE_COLOR, groupId });

            // Bottom horizontal side
            archMullions.push({ id: `mullion_${Date.now()}_${Math.random().toString(36).substring(2, 9)}_B`, type: 'mullion', x1: startX, y1: startY + totalHeight, x2: startX + rectWidth, y2: startY + totalHeight, material: DEFAULT_MATERIAL, color: DEFAULT_STROKE_COLOR, groupId });
            
            // Arch part
            const archSegments = 12;
            const archCenterX = startX + radius;
            const archCenterY = startY + radius;
            let p1 = { x: startX, y: startY + radius };
            for(let i=1; i <= archSegments; i++) {
                const angle = Math.PI + (i * Math.PI / archSegments);
                const p2 = {
                    x: archCenterX + radius * Math.cos(angle),
                    y: archCenterY + radius * Math.sin(angle),
                };
                archMullions.push({
                    id: `mullion_${Date.now()}_${Math.random().toString(36).substring(2, 9)}_A${i}`,
                    type: 'mullion',
                    x1: p1.x, y1: p1.y,
                    x2: p2.x, y2: p2.y,
                    material: DEFAULT_MATERIAL, color: DEFAULT_STROKE_COLOR,
                    groupId
                });
                p1 = p2;
            }
            updateElements({ mullions: [...mullions, ...archMullions] });
            return;
        }

        if (points.length > 0) {
            for (let i = 0; i < points.length; i++) {
                const p1 = points[i];
                const p2 = points[(i + 1) % points.length];
                const newMullion: Mullion = {
                    id: `mullion_${Date.now()}_${Math.random().toString(36).substring(2, 9)}_${i}`,
                    type: 'mullion',
                    x1: p1.x, y1: p1.y,
                    x2: p2.x, y2: p2.y,
                    material: DEFAULT_MATERIAL,
                    color: DEFAULT_STROKE_COLOR,
                    groupId,
                };
                newMullions.push(newMullion);
            }
            updateElements({ mullions: [...mullions, ...newMullions] });
        }
    };


  const getCanvasPoint = (e: MouseEvent | WheelEvent): {x: number, y: number} => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const getWorldPoint = (e: MouseEvent | WheelEvent): {x: number, y: number} => {
    const canvasPoint = getCanvasPoint(e);
    return {
        x: (canvasPoint.x - panOffset.x) / zoom,
        y: (canvasPoint.y - panOffset.y) / zoom,
    };
  }

  const isPointOnLine = (line: { x1: number, y1: number, x2: number, y2: number }, point: {x: number, y: number}, threshold: number) => {
    const { x1, y1, x2, y2 } = line;
    const { x, y } = point;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return false;
    
    let t = ((x - x1) * dx + (y - y1) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    
    const nearestX = x1 + t * dx;
    const nearestY = y1 + t * dy;
    
    return Math.hypot(x - nearestX, y - nearestY) < threshold;
  }

  const getHandlesForRect = (rect: { x: number, y: number, width: number, height: number }) => {
    const handleSize = HANDLE_SIZE / zoom;
    const halfHandle = handleSize / 2;
    return {
        'top-left': { x: rect.x - halfHandle, y: rect.y - halfHandle, cursor: 'nwse-resize' },
        'top-right': { x: rect.x + rect.width - halfHandle, y: rect.y - halfHandle, cursor: 'nesw-resize' },
        'bottom-left': { x: rect.x - halfHandle, y: rect.y + rect.height - halfHandle, cursor: 'nesw-resize' },
        'bottom-right': { x: rect.x + rect.width - halfHandle, y: rect.y + rect.height - halfHandle, cursor: 'nwse-resize' },
        'top': { x: rect.x + rect.width / 2 - halfHandle, y: rect.y - halfHandle, cursor: 'ns-resize' },
        'bottom': { x: rect.x + rect.width / 2 - halfHandle, y: rect.y + rect.height - halfHandle, cursor: 'ns-resize' },
        'left': { x: rect.x - halfHandle, y: rect.y + rect.height / 2 - halfHandle, cursor: 'ew-resize' },
        'right': { x: rect.x + rect.width - halfHandle, y: rect.y + rect.height / 2 - halfHandle, cursor: 'ew-resize' },
        'rotate': { x: rect.x + rect.width / 2, y: rect.y + rect.height + (ROTATION_HANDLE_DISTANCE / zoom), cursor: 'alias' }
    };
  };

  const getHandleAtPoint = (point: {x: number, y: number}, rect: { x: number, y: number, width: number, height: number }): ResizeHandle | null => {
      const handles = getHandlesForRect(rect);
      const handleSize = HANDLE_SIZE / zoom;
      for (const key in handles) {
          const handle = handles[key as ResizeHandle];
          if(key === 'rotate') {
              const rotationHandleRadius = handleSize;
              if (Math.hypot(point.x - handle.x, point.y - handle.y) < rotationHandleRadius) {
                return 'rotate';
              }
          } else if (point.x >= handle.x && point.x <= handle.x + handleSize && point.y >= handle.y && point.y <= handle.y + handleSize) {
              return key as ResizeHandle;
          }
      }
      return null;
  }

  const getHandlesForLine = (line: Mullion | Dimension) => {
    const handleSize = HANDLE_SIZE / zoom;
    const halfHandle = handleSize / 2;
    return {
        'start': { x: line.x1 - halfHandle, y: line.y1 - halfHandle, cursor: 'pointer' },
        'end': { x: line.x2 - halfHandle, y: line.y2 - halfHandle, cursor: 'pointer' },
    };
  };

  const getLineHandleAtPoint = (point: {x: number, y: number}, line: Mullion | Dimension): LineResizeHandle | null => {
      const handles = getHandlesForLine(line);
      const handleSize = HANDLE_SIZE / zoom;
      for (const key in handles) {
          const handle = handles[key as LineResizeHandle];
          if (point.x >= handle.x && point.x <= handle.x + handleSize && point.y >= handle.y && point.y <= handle.y + handleSize) {
              return key as LineResizeHandle;
          }
      }
      return null;
  }
  
  const handleTextDoubleClick = (e: MouseEvent, box: TextBox) => {
      e.stopPropagation();
      if (activeTool !== 'select') return;
      setEditingText(box);
  };
  
  const handleTextareaBlur = () => {
    if (editingText) {
        updateAndRecord(() => {
            updateElements({ textBoxes: textBoxes.map(tb => tb.id === editingText.id ? editingText : tb) });
        });
        setEditingText(null);
    }
  };

  const handleMouseDown = (e: MouseEvent) => {
    if (e.button === 1) { // Middle mouse button
      setMode('panning');
      panStart.current = getCanvasPoint(e);
      e.preventDefault();
      return;
    }
    if (e.button !== 0) return; // Only left clicks
    if (editingText) return;
    
    isOperationInProgress.current = true;

    const worldPoint = getWorldPoint(e);
    
    const tool = activeTool; // Capture active tool at the start of the interaction.

    if (tool === 'pan') {
      setMode('panning');
      panStart.current = getCanvasPoint(e);
      return;
    }

    if (tool === 'paint') {
      e.stopPropagation();
      updateAndRecord(() => {
        // Try to paint a line if that's the target
        if (paintTarget === 'line') {
            for (const mullion of [...mullions].reverse()) {
                const thickness = mullion.thickness || DEFAULT_MULLION_THICKNESS;
                if (isPointOnLine(mullion, worldPoint, thickness / 2)) {
                    updateElements({ mullions: mullions.map(m => m.id === mullion.id ? { ...m, color: paintColor } : m) });
                    return; // Painted a line, done.
                }
            }
            // If target is line but we didn't hit one, we shouldn't paint anything else.
            return;
        }
    
        // Try to paint a frame border or glass if that's the target
        if (paintTarget === 'frame' || paintTarget === 'glass') {
            for (const frame of [...frames].reverse()) {
                const center = getElementCenter(frame);
                const unrotatedWorldPoint = getUnrotatedPoint(worldPoint, frame, center);

                if (unrotatedWorldPoint.x >= frame.x && unrotatedWorldPoint.x <= frame.x + frame.width &&
                    unrotatedWorldPoint.y >= frame.y && unrotatedWorldPoint.y <= frame.y + frame.height) {
                    
                    const thickness = frame.thickness || DEFAULT_FRAME_THICKNESS;
                    const isClickOnFrameBorder = unrotatedWorldPoint.x < frame.x + thickness || unrotatedWorldPoint.x > frame.x + frame.width - thickness ||
                                                    unrotatedWorldPoint.y < frame.y + thickness || unrotatedWorldPoint.y > frame.y + frame.height - thickness;
    
                    if (paintTarget === 'frame' && isClickOnFrameBorder) {
                            updateElements({ frames: frames.map(f => f.id === frame.id ? { ...f, color: paintColor } : f) });
                            return; // Painted a frame border, done.
                    }
                    if (paintTarget === 'glass' && !isClickOnFrameBorder) {
                            updateElements({ frames: frames.map(f => f.id === frame.id ? { ...f, glassColor: paintColor } : f) });
                            return; // Painted glass, done.
                    }
                    
                    // Click was inside a frame, but not on the right part for the current target
                    // We should stop to avoid accidentally painting something else.
                    return; 
                }
            }
        }
      });
      return;
    }
    
    if (tool === 'select') {
        // Check for resize/rotate handle click first
        if (selectedElement) {
             let element: Frame | Mullion | Dimension | TextBox | undefined;
             
             const allElements = [...frames, ...textBoxes, ...mullions, ...dimensions];
             element = allElements.find(e => e.id === selectedElement.id);

             if (element) {
                 const center = getElementCenter(element as CanvasElement);
                 const unrotatedWorldPoint = (element.type === 'frame' || element.type === 'textbox') ? getUnrotatedPoint(worldPoint, element, center) : worldPoint;
                 
                 let handle: ResizeHandle | LineResizeHandle | null = null;
                 if (element.type === 'frame' || element.type === 'textbox') {
                    handle = getHandleAtPoint(unrotatedWorldPoint, element);
                 } else if (element.type === 'mullion' || element.type === 'dimension') {
                    handle = getLineHandleAtPoint(unrotatedWorldPoint, element);
                 }

                 if (handle) {
                    if (handle === 'rotate') {
                        setMode('rotating');
                        dragInfo.current = {
                            element: element,
                            startX: worldPoint.x,
                            startY: worldPoint.y,
                            elementCenterX: center.x,
                            elementCenterY: center.y
                        };
                        return;
                    }
                    setMode('resizing');
                    const dragInfoBase: Partial<DragInfo> = {
                        element: element,
                        startX: unrotatedWorldPoint.x,
                        startY: unrotatedWorldPoint.y,
                        handle: handle,
                    }
                    if (element.type === 'frame' || element.type === 'textbox') {
                        dragInfo.current = {
                            ...dragInfoBase,
                            elementStartX: element.x,
                            elementStartY: element.y,
                            elementStartWidth: element.width,
                            elementStartHeight: element.height,
                        } as DragInfo;
                    } else { // Mullion or Dimension
                         dragInfo.current = {
                            ...dragInfoBase,
                            elementStartX: element.x1,
                            elementStartY: element.y1,
                            elementEndX: element.x2,
                            elementEndY: element.y2,
                        } as DragInfo;
                    }
                    return;
                }
             }
        }
        
        // Check dimensions
        for (let i = dimensions.length - 1; i >= 0; i--) {
            const dim = dimensions[i];

            let pointToCheck = worldPoint;
            if (dim.rotation && dim.rotationCenterX !== undefined && dim.rotationCenterY !== undefined) {
                const center = { x: dim.rotationCenterX, y: dim.rotationCenterY };
                const angleRad = -dim.rotation * (Math.PI / 180);
                const cos = Math.cos(angleRad);
                const sin = Math.sin(angleRad);
                const dx = worldPoint.x - center.x;
                const dy = worldPoint.y - center.y;
                pointToCheck = {
                    x: dx * cos - dy * sin + center.x,
                    y: dx * sin + dy * cos + center.y
                };
            }

            if (isPointOnLine(dim, pointToCheck, SNAP_THRESHOLD / zoom)) {
                setSelectedElement({ type: 'dimension', id: dim.id });
                setMode('selecting');
                dragInfo.current = {
                    element: dim,
                    startX: worldPoint.x,
                    startY: worldPoint.y,
                    elementStartX: dim.x1,
                    elementStartY: dim.y1,
                    elementEndX: dim.x2,
                    elementEndY: dim.y2,
                };
                return;
            }
        }

        // Check mullions 
        for (let i = mullions.length - 1; i >= 0; i--) {
            const mullion = mullions[i];
            const thickness = mullion.thickness || DEFAULT_MULLION_THICKNESS;
            if (isPointOnLine(mullion, worldPoint, thickness / 2)) {
                setSelectedElement({ type: 'mullion', id: mullion.id });
                setMode('selecting');
                const childDimensions = dimensions.filter(d => d.parentId === mullion.id)
                    .map(d => ({
                        id: d.id, type: 'dimension' as const,
                        startX1: d.x1, startY1: d.y1,
                        startX2: d.x2, startY2: d.y2,
                    }));
                
                const dragPayload: DragInfo = {
                    element: mullion,
                    startX: worldPoint.x,
                    startY: worldPoint.y,
                    elementStartX: mullion.x1,
                    elementStartY: mullion.y1,
                    elementEndX: mullion.x2,
                    elementEndY: mullion.y2,
                    childElements: childDimensions,
                };

                if (mullion.groupId) {
                    const groupedMullions = mullions
                        .filter(m => m.groupId === mullion.groupId && m.id !== mullion.id)
                        .map(m => ({
                            id: m.id,
                            type: 'mullion' as const,
                            startX1: m.x1, startY1: m.y1,
                            startX2: m.x2, startY2: m.y2,
                        }));
                    dragPayload.childElements?.push(...groupedMullions);
                }
                dragInfo.current = dragPayload;
                return;
            }
        }
        
        // Then check frames
        for (let i = frames.length - 1; i >= 0; i--) {
            const frame = frames[i];
            const center = getElementCenter(frame);
            const unrotatedWorldPoint = getUnrotatedPoint(worldPoint, frame, center);

            if (unrotatedWorldPoint.x >= frame.x && unrotatedWorldPoint.x <= frame.x + frame.width &&
                unrotatedWorldPoint.y >= frame.y && unrotatedWorldPoint.y <= frame.y + frame.height) {
                
                setSelectedElement({type: 'frame', id: frame.id});
                setMode('selecting');

                const childDimensions = dimensions
                    .filter(d => d.parentId === frame.id)
                    .map(d => ({
                        id: d.id, type: 'dimension' as const,
                        startX1: d.x1, startY1: d.y1,
                        startX2: d.x2, startY2: d.y2,
                    }));
                
                const childMullions = mullions
                    .filter(m => m.parentId === frame.id)
                    .map(m => ({
                        id: m.id, type: 'mullion' as const,
                        startX1: m.x1, startY1: m.y1,
                        startX2: m.x2, startY2: m.y2,
                    }));

                dragInfo.current = {
                    element: frame,
                    startX: worldPoint.x,
                    startY: worldPoint.y,
                    elementStartX: frame.x,
                    elementStartY: frame.y,
                    childElements: [...childDimensions, ...childMullions],
                };
                return;
            }
        }

        // Then check text boxes
        for (let i = textBoxes.length - 1; i >= 0; i--) {
            const box = textBoxes[i];
            const center = getElementCenter(box);
            const unrotatedWorldPoint = getUnrotatedPoint(worldPoint, box, center);

            if (unrotatedWorldPoint.x >= box.x && unrotatedWorldPoint.x <= box.x + box.width &&
              unrotatedWorldPoint.y >= box.y && unrotatedWorldPoint.y <= box.y + box.height) {
                
                setSelectedElement({type: 'textbox', id: box.id});
                setMode('selecting');

                dragInfo.current = {
                    element: box,
                    startX: worldPoint.x,
                    startY: worldPoint.y,
                    elementStartX: box.x,
                    elementStartY: box.y,
                };
                return;
            }
        }

        setSelectedElement(null);
        setMode('idle');
    }

    if (tool === 'draw-frame' || tool === 'draw-mullion' || tool === 'dimension' || tool === 'draw-text') {
        setMode('drawing');
        setSelectedElement(null);
        if (tool === 'draw-frame') {
            const newFrame: Frame = {
                id: `frame_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                type: 'frame',
                x: worldPoint.x,
                y: worldPoint.y,
                width: 0,
                height: 0,
                material: DEFAULT_MATERIAL,
                infill: DEFAULT_INFILL,
                glass: DEFAULT_GLASS,
                color: DEFAULT_STROKE_COLOR, 
                opening: 'fixed',
                openState: 0,
            };
            drawingElement.current = newFrame;
            updateElements({ frames: [...frames, newFrame] });
        } else if (tool === 'draw-mullion') {
             const newMullion: Mullion = {
                id: `mullion_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                type: 'mullion',
                x1: worldPoint.x,
                y1: worldPoint.y,
                x2: worldPoint.x,
                y2: worldPoint.y,
                material: DEFAULT_MATERIAL,
                color: DEFAULT_STROKE_COLOR,
            };
            drawingElement.current = newMullion;
            updateElements({ mullions: [...mullions, newMullion] });
        } else if (tool === 'dimension') {
            const newDimension: Dimension = {
                id: `dim_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                type: 'dimension',
                x1: worldPoint.x,
                y1: worldPoint.y,
                x2: worldPoint.x,
                y2: worldPoint.y,
                text: '0mm'
            };
            drawingElement.current = newDimension;
            updateElements({ dimensions: [...dimensions, newDimension] });
        } else if (tool === 'draw-text') {
            const newTextBox: TextBox = {
                id: `text_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                type: 'textbox',
                x: worldPoint.x,
                y: worldPoint.y,
                width: 0,
                height: 0,
                text: 'Text',
                fontSize: 16,
                color: 'hsl(var(--foreground))',
            };
            drawingElement.current = newTextBox;
            updateElements({ textBoxes: [...textBoxes, newTextBox] });
        }
        return;
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (mode === 'idle') return;
    if (editingText) return;

    if (mode === 'selecting') {
      setMode('dragging');
    }
    
    if (mode === 'panning') {
      e.preventDefault();
      const canvasPoint = getCanvasPoint(e);
      const dx = canvasPoint.x - panStart.current.x;
      const dy = canvasPoint.y - panStart.current.y;
      setCustomCanvasView(prevView => ({
        ...prevView,
        panOffset: {
          x: prevView.panOffset.x + dx,
          y: prevView.panOffset.y + dy,
        }
      }));
      panStart.current = canvasPoint;
      return;
    }

    const worldPoint = getWorldPoint(e);

    if (mode === 'drawing' && drawingElement.current) {
        e.preventDefault();
        
        const currentDrawingElement = drawingElement.current;
        if (currentDrawingElement.type === 'frame') {
            let targetPoint = { ...worldPoint };
            const snapThreshold = SNAP_THRESHOLD / zoom;

            const snappedX = Math.round(targetPoint.x / GRID_SIZE) * GRID_SIZE;
            const snappedY = Math.round(targetPoint.y / GRID_SIZE) * GRID_SIZE;

            if (Math.abs(targetPoint.x - snappedX) < snapThreshold) targetPoint.x = snappedX;
            if (Math.abs(targetPoint.y - snappedY) < snapThreshold) targetPoint.y = snappedY;

            const startX = (drawingElement.current as Frame).x;
            const startY = (drawingElement.current as Frame).y;
            const newX = Math.min(startX, targetPoint.x);
            const newY = Math.min(startY, targetPoint.y);
            const newWidth = Math.abs(startX - targetPoint.x);
            const newHeight = Math.abs(startY - targetPoint.y);
            const id = currentDrawingElement.id;
            const newFrames = frames.map(s => {
                if (s.id === id) {
                    const updatedFrame = {...s, x: newX, y: newY, width: newWidth, height: newHeight};
                    lastDrawnElement.current = updatedFrame;
                    return updatedFrame;
                }
                return s
            });
            updateElements({ frames: newFrames });
        } else if (currentDrawingElement.type === 'mullion') {
            const startX = (drawingElement.current as Mullion).x1;
            const startY = (drawingElement.current as Mullion).y1;
            let endX = worldPoint.x;
            let endY = worldPoint.y;

            if (e.shiftKey) { // Snap to H/V if shift is pressed
                if (Math.abs(endX - startX) > Math.abs(endY - startY)) {
                    endY = startY;
                } else {
                    endX = startX;
                }
            }
            
            const id = currentDrawingElement.id;
            const newMullions = mullions.map(m => {
                if (m.id === id) {
                    const updatedMullion = {...m, x2: endX, y2: endY};
                    lastDrawnElement.current = updatedMullion;
                    return updatedMullion;
                }
                return m;
            });
            updateElements({ mullions: newMullions });
        } else if (currentDrawingElement.type === 'dimension') {
            const id = currentDrawingElement.id;
            const newDimensions = dimensions.map(d => {
                if (d.id === id) {
                    const length = Math.hypot(worldPoint.x - d.x1, worldPoint.y - d.y1);
                    const updatedDimension = {...d, x2: worldPoint.x, y2: worldPoint.y, text: `${Math.round(length)}mm` };
                    lastDrawnElement.current = updatedDimension;
                    return updatedDimension;
                }
                return d;
            });
            updateElements({ dimensions: newDimensions });
        } else if (currentDrawingElement.type === 'textbox') {
            const startX = (drawingElement.current as TextBox).x;
            const startY = (drawingElement.current as TextBox).y;
            const newX = Math.min(startX, worldPoint.x);
            const newY = Math.min(startY, worldPoint.y);
            const newWidth = Math.abs(startX - worldPoint.x);
            const newHeight = Math.abs(startY - worldPoint.y);
            const id = currentDrawingElement.id;
            const newTextBoxes = textBoxes.map(tb => {
                if (tb.id === id) {
                    const updated = {...tb, x: newX, y: newY, width: newWidth, height: newHeight};
                    lastDrawnElement.current = updated;
                    return updated;
                }
                return tb
            });
            updateElements({ textBoxes: newTextBoxes });
        }
    }

    if (mode === 'dragging' && dragInfo.current) {
        e.preventDefault();
        const { element, startX, startY } = dragInfo.current;
        
        const dx_world = worldPoint.x - startX;
        const dy_world = worldPoint.y - startY;

        if (element.type === 'frame' || element.type === 'textbox') {
            const { elementStartX, elementStartY } = dragInfo.current;
            let newX = elementStartX! + dx_world;
            let newY = elementStartY! + dy_world;
            const snapThreshold = SNAP_THRESHOLD / zoom;

            const snappedX = Math.round(newX / GRID_SIZE) * GRID_SIZE;
            const snappedY = Math.round(newY / GRID_SIZE) * GRID_SIZE;
            
            if (Math.abs(newX - snappedX) < snapThreshold) newX = snappedX;
            if (Math.abs(newY - snappedY) < snapThreshold) newY = snappedY;
            
            const newElements: { frames?: Frame[], textBoxes?: TextBox[], dimensions?: Dimension[], mullions?: Mullion[] } = {};

            if (element.type === 'frame') {
                newElements.frames = frames.map(s => 
                    s.id === element.id ? { ...s, x: newX, y: newY } : s
                );
            } else {
                newElements.textBoxes = textBoxes.map(tb => tb.id === element.id ? {...tb, x: newX, y: newY} : tb);
            }
            
            if (dragInfo.current.childElements) {
                newElements.dimensions = dimensions.map(dim => {
                    const initialChild = dragInfo.current!.childElements!.find(c => c.id === dim.id && c.type === 'dimension');
                    if (initialChild) {
                        return {
                            ...dim,
                            x1: initialChild.startX1 + dx_world,
                            y1: initialChild.startY1 + dy_world,
                            x2: initialChild.startX2 + dx_world,
                            y2: initialChild.startY2 + dy_world,
                            rotationCenterX: (element as Frame).x + (element as Frame).width / 2,
                            rotationCenterY: (element as Frame).y + (element as Frame).height / 2
                        };
                    }
                    return dim;
                });
                 newElements.mullions = mullions.map(mullion => {
                    const initialChild = dragInfo.current!.childElements!.find(c => c.id === mullion.id && c.type === 'mullion');
                    if (initialChild) {
                        return {
                            ...mullion,
                            x1: initialChild.startX1 + dx_world,
                            y1: initialChild.startY1 + dy_world,
                            x2: initialChild.startX2 + dx_world,
                            y2: initialChild.startY2 + dy_world,
                        };
                    }
                    return mullion;
                });
            }
            updateElements(newElements);
        } else if (element.type === 'mullion') {
             const newMullions = mullions.map(mullion => {
                if (mullion.id === element.id) {
                    const { elementStartX, elementStartY, elementEndX, elementEndY } = dragInfo.current!;
                    return {
                        ...mullion,
                        x1: elementStartX! + dx_world,
                        y1: elementStartY! + dy_world,
                        x2: elementEndX! + dx_world,
                        y2: elementEndY! + dy_world,
                    };
                }
                
                const initialChild = dragInfo.current!.childElements?.find(c => c.id === mullion.id && c.type === 'mullion');
                if (initialChild) {
                     return {
                        ...mullion,
                        x1: initialChild.startX1 + dx_world,
                        y1: initialChild.startY1 + dy_world,
                        x2: initialChild.startX2 + dx_world,
                        y2: initialChild.startY2 + dy_world,
                    };
                }
        
                return mullion;
            });
            const newElements: { mullions: Mullion[], dimensions?: Dimension[] } = { mullions: newMullions };
            
            if (dragInfo.current.childElements) {
                newElements.dimensions = dimensions.map(dim => {
                    const initialChild = dragInfo.current!.childElements!.find(c => c.id === dim.id && c.type === 'dimension');
                    if (initialChild) {
                        const newDim = {
                            ...dim,
                            x1: initialChild.startX1 + dx_world,
                            y1: initialChild.startY1 + dy_world,
                            x2: initialChild.startX2 + dx_world,
                            y2: initialChild.startY2 + dy_world,
                        };
                        const length = Math.hypot(newDim.x2 - newDim.x1, newDim.y2 - newDim.y1);
                        newDim.text = `${Math.round(length)}mm`;
                        return newDim;
                    }
                    return dim;
                });
            }
            updateElements(newElements);
        } else if (element.type === 'dimension') {
            const { elementStartX, elementStartY, elementEndX, elementEndY } = dragInfo.current;
            let newX1 = elementStartX! + dx_world;
            let newY1 = elementStartY! + dy_world;
            let newX2 = elementEndX! + dx_world;
            let newY2 = elementEndY! + dy_world;
            
            updateElements({ dimensions: dimensions.map(d =>
                d.id === element.id ? { ...d, x1: newX1, y1: newY1, x2: newX2, y2: newY2 } : d
            )});
        }
    }

    if (mode === 'resizing' && dragInfo.current) {
        e.preventDefault();
        const { element, startX, startY, handle } = dragInfo.current;

        const dx_unrotated = worldPoint.x - startX;
        const dy_unrotated = worldPoint.y - startY;
        
        if (element.type === 'frame' || element.type === 'textbox') {
            const rotation = element.rotation || 0;
            const angleRad = -rotation * (Math.PI / 180);
            const cos = Math.cos(angleRad);
            const sin = Math.sin(angleRad);
            
            const dx_world = dx_unrotated * cos + dy_unrotated * sin;
            const dy_world = -dx_unrotated * sin + dy_unrotated * cos;


            const { elementStartX, elementStartY, elementStartWidth, elementStartHeight } = dragInfo.current;
            let newX = elementStartX!;
            let newY = elementStartY!;
            let newWidth = elementStartWidth!;
            let newHeight = elementStartHeight!;

            if (handle?.includes('right')) {
                newWidth = elementStartWidth! + dx_world;
            }
            if (handle?.includes('left')) {
                newWidth = elementStartWidth! - dx_world;
                newX = elementStartX! + dx_world;
            }
            if (handle?.includes('bottom')) {
                newHeight = elementStartHeight! + dy_world;
            }
            if (handle?.includes('top')) {
                newHeight = elementStartHeight! - dy_world;
                newY = elementStartY! + dy_world;
            }

            if(element.type === 'frame') {
                 const updatedFrame = { ...element, x: newX, y: newY, width: Math.max(10, newWidth), height: Math.max(10, newHeight) };
                 const originalFrame = frames.find(f => f.id === element.id);
                 if (!originalFrame) {
                     updateElements({ frames: frames.map(s => s.id === element.id ? updatedFrame : s) });
                 } else {
                     const updatedDimensions = dimensions.map(d => {
                         if (d.parentId === element.id) {
                             const isWidthDim = Math.abs(d.y1 - d.y2) < 1;
                             const isHeightDim = Math.abs(d.x1 - d.x2) < 1;

                             if (isWidthDim) {
                                 const yOffset = d.y1 - originalFrame.y;
                                 return {
                                     ...d,
                                     x1: updatedFrame.x,
                                     y1: updatedFrame.y + yOffset,
                                     x2: updatedFrame.x + updatedFrame.width,
                                     y2: updatedFrame.y + yOffset,
                                     text: `${Math.round(updatedFrame.width)}mm`,
                                     rotationCenterX: updatedFrame.x + updatedFrame.width / 2,
                                     rotationCenterY: updatedFrame.y + updatedFrame.height / 2,
                                 };
                             }
                             if (isHeightDim) {
                                 const xOffset = d.x1 - originalFrame.x;
                                 return {
                                     ...d,
                                     x1: updatedFrame.x + xOffset,
                                     y1: updatedFrame.y,
                                     x2: updatedFrame.x + xOffset,
                                     y2: updatedFrame.y + updatedFrame.height,
                                     text: `${Math.round(updatedFrame.height)}mm`,
                                     rotationCenterX: updatedFrame.x + updatedFrame.width / 2,
                                     rotationCenterY: updatedFrame.y + updatedFrame.height / 2,
                                 };
                             }
                         }
                         return d;
                     });
                     updateElements({ 
                        frames: frames.map(s => s.id === element.id ? updatedFrame : s),
                        dimensions: updatedDimensions,
                    });
                 }
            } else { // textbox
                updateElements({ textBoxes: textBoxes.map(s => 
                    s.id === element.id ? { ...s, x: newX, y: newY, width: Math.max(10, newWidth), height: Math.max(10, newHeight) } : s
                )});
            }
           
        } else if (element.type === 'mullion' || element.type === 'dimension') {
            const { elementStartX, elementStartY, elementEndX, elementEndY } = dragInfo.current;
            
            let finalX1 = elementStartX!, finalY1 = elementStartY!, finalX2 = elementEndX!, finalY2 = elementEndY!;

            if (handle === 'start') {
                const newX1 = elementStartX! + dx_unrotated;
                const newY1 = elementStartY! + dy_unrotated;
                finalX1 = newX1;
                finalY1 = newY1;

                if (element.type === 'mullion' && e.shiftKey) {
                    if (Math.abs(newX1 - finalX2) > Math.abs(newY1 - finalY2)) {
                        finalY1 = finalY2;
                    } else {
                        finalX1 = finalX2;
                    }
                }
            } else { // 'end'
                const newX2 = elementEndX! + dx_unrotated;
                const newY2 = elementEndY! + dy_unrotated;
                finalX2 = newX2;
                finalY2 = newY2;
                 if (element.type === 'mullion' && e.shiftKey) {
                    if (Math.abs(newX2 - finalX1) > Math.abs(newY2 - finalY1)) {
                        finalY2 = finalY1;
                    } else {
                        finalX2 = finalX1;
                    }
                }
            }

            if (element.type === 'mullion') {
                updateElements({ mullions: mullions.map(m =>
                    m.id === element.id ? { ...m, x1: finalX1, y1: finalY1, x2: finalX2, y2: finalY2 } : m
                )});
            } else { // dimension
                 const length = Math.hypot(finalX2 - finalX1, finalY2 - finalY1);
                 updateElements({ dimensions: dimensions.map(d =>
                    d.id === element.id ? { ...d, x1: finalX1, y1: finalY1, x2: finalX2, y2: finalY2, text: `${Math.round(length)}mm` } : d
                )});
            }
        }
    }

    if (mode === 'rotating' && dragInfo.current) {
        e.preventDefault();
        const { element, elementCenterX, elementCenterY } = dragInfo.current;
        const angleRad = Math.atan2(worldPoint.y - elementCenterY!, worldPoint.x - elementCenterX!);
        let angleDeg = (angleRad * 180) / Math.PI + 90;

        if (angleDeg < 0) {
            angleDeg += 360;
        }
        
        if (e.shiftKey) {
            angleDeg = Math.round(angleDeg / 15) * 15;
        }

        const canvasPoint = getCanvasPoint(e);
        setRotationIndicator({ angle: angleDeg, x: canvasPoint.x, y: canvasPoint.y });
        
        const newElements: { frames?: Frame[], textBoxes?: TextBox[], dimensions?: Dimension[] } = {};

        if (element.type === 'frame') {
            newElements.frames = frames.map(f => f.id === element.id ? { ...f, rotation: angleDeg } : f);
            newElements.dimensions = dimensions.map(d => {
                if (d.parentId === element.id) {
                    return { ...d, rotation: angleDeg, rotationCenterX: elementCenterX, rotationCenterY: elementCenterY };
                }
                return d;
            });
        } else if (element.type === 'textbox') {
            newElements.textBoxes = textBoxes.map(tb => tb.id === element.id ? { ...tb, rotation: angleDeg } : tb);
        }
        updateElements(newElements);
    }
  };

  const handleMouseUp = () => {
    setRotationIndicator(null);

    if (mode === 'drawing' && drawingElement.current) {
      if (lastDrawnElement.current) {
        const finalElement = lastDrawnElement.current;
        let shouldCleanup = false;

        if (finalElement.type === 'frame' && (finalElement.width < 5 || finalElement.height < 5)) {
            updateElements({ frames: frames.filter(f => f.id !== finalElement.id) });
            shouldCleanup = true;
        }
        if (finalElement.type === 'mullion' && Math.hypot(finalElement.x2 - finalElement.x1, finalElement.y2 - finalElement.y1) < 5) {
            updateElements({ mullions: mullions.filter(m => m.id !== finalElement.id) });
            shouldCleanup = true;
        }
        if (finalElement.type === 'dimension' && Math.hypot(finalElement.x2 - finalElement.x1, finalElement.y2 - finalElement.y1) < 5) {
            updateElements({ dimensions: dimensions.filter(d => d.id !== finalElement.id) });
            shouldCleanup = true;
        }
        if (finalElement.type === 'textbox' && (finalElement.width < 10 || finalElement.height < 10)) {
            updateElements({ textBoxes: textBoxes.filter(tb => tb.id !== finalElement.id) });
            shouldCleanup = true;
        }

        if (!shouldCleanup) {
          if (finalElement.type === 'frame') {
              const offset = 20;
              const widthDim: Dimension = {
                  id: `dim_${Date.now()}_w`, type: 'dimension',
                  x1: finalElement.x, y1: finalElement.y - offset,
                  x2: finalElement.x + finalElement.width, y2: finalElement.y - offset,
                  text: `${Math.round(finalElement.width)}mm`, parentId: finalElement.id
              };
              const heightDim: Dimension = {
                  id: `dim_${Date.now()}_h`, type: 'dimension',
                  x1: finalElement.x - offset, y1: finalElement.y,
                  x2: finalElement.x - offset, y2: finalElement.y + finalElement.height,
                  text: `${Math.round(finalElement.height)}mm`, parentId: finalElement.id
              };
              updateElements({ dimensions: [...dimensions, widthDim, heightDim] });
          } else if (finalElement.type === 'mullion') {
              const midX = (finalElement.x1 + finalElement.x2) / 2;
              const midY = (finalElement.y1 + finalElement.y2) / 2;
              let parentFrameId: string | undefined = undefined;

              for (const frame of [...frames].reverse()) {
                  const center = getElementCenter(frame);
                  const unrotatedPoint = getUnrotatedPoint({x: midX, y: midY}, frame, center);

                  if (unrotatedPoint.x >= frame.x && unrotatedPoint.x <= frame.x + frame.width && unrotatedPoint.y >= frame.y && unrotatedPoint.y <= frame.y + frame.height) {
                      parentFrameId = frame.id;
                      break;
                  }
              }
              if (parentFrameId) {
                  updateElements({ mullions: mullions.map(m => m.id === finalElement.id ? { ...m, parentId: parentFrameId } : m) });
              }
          } else if (finalElement.type === 'textbox') {
            setActiveTool('select');
            setSelectedElement({ type: 'textbox', id: finalElement.id });
            setEditingText(finalElement);
          }
        }
      } else {
        const id = drawingElement.current.id;
        const type = drawingElement.current.type;
        if (type === 'frame') updateElements({ frames: frames.filter(f => f.id !== id) });
        if (type === 'mullion') updateElements({ mullions: mullions.filter(m => m.id !== id) });
        if (type === 'dimension') updateElements({ dimensions: dimensions.filter(d => d.id !== id) });
        if (type === 'textbox') updateElements({ textBoxes: textBoxes.filter(tb => tb.id !== id) });
      }
      
      if (drawingElement.current?.type !== 'textbox') {
        setActiveTool('select');
      }
    }
    
    if (isOperationInProgress.current) {
      isOperationInProgress.current = false;
      recordHistory(true);
    }
    
    setMode('idle');
    drawingElement.current = null;
    dragInfo.current = null;
    lastDrawnElement.current = null;
  };
  
  const handleClear = () => {
    updateElements({ frames: [], mullions: [], dimensions: [], textBoxes: [] });
    setSelectedElement(null);
  };
  
  const handleZoomIn = useCallback(() => {
    setCustomCanvasView(prev => {
      const zoomFactor = 1.2;
      const newZoom = Math.min(prev.zoom * zoomFactor, 10);
      
      if (!canvasRef.current) return prev;
      
      const rect = canvasRef.current.getBoundingClientRect();
      const viewportCenterX = rect.width / 2;
      const viewportCenterY = rect.height / 2;

      // World point under the viewport center
      const worldX = (viewportCenterX - prev.panOffset.x) / prev.zoom;
      const worldY = (viewportCenterY - prev.panOffset.y) / prev.zoom;
      
      // New pan offset to keep the world point under the viewport center
      const newPanX = viewportCenterX - worldX * newZoom;
      const newPanY = viewportCenterY - worldY * newZoom;

      return { zoom: newZoom, panOffset: { x: newPanX, y: newPanY } };
    });
  }, [setCustomCanvasView]);

  const handleZoomOut = useCallback(() => {
    setCustomCanvasView(prev => {
      const zoomFactor = 1.2;
      const newZoom = Math.max(prev.zoom / zoomFactor, 0.1);
      
      if (!canvasRef.current) return prev;
      
      const rect = canvasRef.current.getBoundingClientRect();
      const viewportCenterX = rect.width / 2;
      const viewportCenterY = rect.height / 2;
      
      // World point under the viewport center
      const worldX = (viewportCenterX - prev.panOffset.x) / prev.zoom;
      const worldY = (viewportCenterY - prev.panOffset.y) / prev.zoom;
      
      // New pan offset to keep the world point under the viewport center
      const newPanX = viewportCenterX - worldX * newZoom;
      const newPanY = viewportCenterY - worldY * newZoom;

      return { zoom: newZoom, panOffset: { x: newPanX, y: newPanY } };
    });
  }, [setCustomCanvasView]);

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const canvasPoint = getCanvasPoint(e);

    setCustomCanvasView(prevView => {
      const zoomFactor = 1.1;
      const newZoom = e.deltaY < 0 
        ? Math.min(prevView.zoom * zoomFactor, 10)
        : Math.max(prevView.zoom / zoomFactor, 0.1);

      if (newZoom === prevView.zoom) return prevView;
      
      const newPanOffset = {
          x: canvasPoint.x - (canvasPoint.x - prevView.panOffset.x) * newZoom / prevView.zoom,
          y: canvasPoint.y - (canvasPoint.y - prevView.panOffset.y) * newZoom / prevView.zoom,
      };

      return { zoom: newZoom, panOffset: newPanOffset };
    });
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        if (e.key === "z") {
          e.preventDefault();
          handleUndo();
        } else if (e.key === "y") {
          e.preventDefault();
          handleRedo();
        }
        return;
      }

      if ((e.key === "Backspace" || e.key === "Delete")) {
        e.preventDefault();
        handleDeleteSelected();
      }
      
      const toolShortcuts: { [key: string]: Tool } = {
        v: "select",
        f: "draw-frame",
        m: "draw-mullion",
        d: "dimension",
        p: "paint",
        h: "pan",
        t: "draw-text",
      };

      const tool = toolShortcuts[e.key.toLowerCase()];
      if (tool) {
        // This is a list of tools that are currently disabled.
        const disabledTools: Tool[] = ["merge"];
        if (!disabledTools.includes(tool)) {
          setActiveTool(tool);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleDeleteSelected, handleUndo, handleRedo]);


  const cursorClass = useMemo(() => {
    if (mode === 'panning' || mode === 'dragging') return 'cursor-grabbing';
    if (mode === 'selecting') return 'cursor-move';
    if (mode === 'rotating') return 'cursor-alias';
    if (mode === 'resizing') return '';
    switch (activeTool) {
        case 'draw-frame':
        case 'draw-mullion': 
        case 'dimension':
        case 'draw-text':
            return 'cursor-crosshair';
        case 'select': return 'cursor-default';
        case 'pan': return 'cursor-grab';
        case 'paint': return 'cursor-copy';
        default: return 'cursor-default';
    }
  }, [activeTool, mode]);

  const renderedHandles = useMemo(() => {
    if (activeTool !== 'select' || !selectedElement) return null;
    if (selectedElement.type !== 'mullion' && selectedElement.type !== 'dimension') return null;

    const handleSize = HANDLE_SIZE / zoom;
    let handles: { [key: string]: { x: number, y: number, cursor: string } } | null = null;
    
    const element = [...mullions, ...dimensions].find(el => el.id === selectedElement.id);
    if (element) handles = getHandlesForLine(element as Mullion | Dimension);
    
    if (!handles) return null;

    return Object.entries(handles).map(([key, handle]) => (
      <rect
        key={key}
        x={handle.x}
        y={handle.y}
        width={handleSize}
        height={handleSize}
        fill={SELECTED_ELEMENT_COLOR}
        stroke="hsl(var(--card))"
        strokeWidth={1 / zoom}
        className="cursor-pointer"
        style={{ cursor: handle.cursor }}
        onMouseDown={(e) => {
            e.stopPropagation(); // prevent canvas mousedown
            handleMouseDown(e);
        }}
      />
    ));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTool, selectedElement, mullions, dimensions, zoom]);

  const getElementCenter = (element: Frame | Mullion | TextBox | Dimension): { x: number, y: number } => {
    if (element.type === 'frame' || element.type === 'textbox') {
        return { x: element.x + element.width / 2, y: element.y + element.height / 2 };
    }
    return { x: (element.x1 + element.x2) / 2, y: (element.y1 + element.y2) / 2 };
  };
  
  const getUnrotatedPoint = (point: { x: number, y: number }, element: Frame | TextBox, center: { x: number, y: number }) => {
    if (!element.rotation) return point;
    const angleRad = -element.rotation * (Math.PI / 180);
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    const newX = dx * cos - dy * sin + center.x;
    const newY = dx * sin + dy * cos + center.y;
    return { x: newX, y: newY };
  };

  return (
    <div className="relative w-full h-full bg-card rounded-lg border-2 border-dashed border-muted-foreground/30 shadow-sm flex flex-col items-center justify-center p-0 text-center overflow-hidden">
      <CustomDesignToolbar 
        activeTool={activeTool} 
        setActiveTool={setActiveTool} 
        onClear={handleClear}
        onDeleteSelected={handleDeleteSelected}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={undoRedoState.canUndo}
        canRedo={undoRedoState.canRedo}
        onIncreaseThickness={handleIncreaseThickness}
        onDecreaseThickness={handleDecreaseThickness}
        isElementSelected={!!selectedElement}
        onSetPaintColor={setPaintColor}
        paintTarget={paintTarget}
        onPaintTargetChange={setPaintTarget}
        onUpdateMaterial={updateSelectedElementMaterial}
        onUpdateInfillType={updateSelectedElementInfillType}
        onUpdateGlass={updateSelectedElementGlass}
        onUpdateOpeningType={updateSelectedElementOpeningType}
        selectedElementData={selectedElementData}
        onAddShape={handleAddShape}
        portalContainer={fullscreenContainerRef?.current}
      />

      {rotationIndicator && (
          <div 
              className="absolute pointer-events-none z-20 flex items-center justify-center bg-card border rounded-md p-1 px-2 text-xs font-mono shadow-lg"
              style={{
                  left: rotationIndicator.x + 20,
                  top: rotationIndicator.y + 20,
              }}
          >
              {`${rotationIndicator.angle.toFixed(0)}°`}
          </div>
      )}

      <div
        ref={canvasRef}
        className={cn("w-full h-full", cursorClass)}
        style={{
            backgroundSize: `${GRID_SIZE * zoom}px ${GRID_SIZE * zoom}px`,
            backgroundPosition: `${panOffset.x}px ${panOffset.y}px`,
            backgroundImage: 'linear-gradient(to right, hsl(var(--border) / 0.5) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border) / 0.5) 1px, transparent 1px)',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <svg width="100%" height="100%" className="relative z-0">
            <defs>
                <marker id="dim-arrow" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10" fill="none" stroke="currentColor" strokeWidth={1.5 / zoom} />
                </marker>
                <pattern id="brick-pattern" width={80 / zoom} height={40 / zoom} patternUnits="userSpaceOnUse">
                    <rect width={80 / zoom} height={40 / zoom} fill="hsl(var(--muted))"/>
                    <path d={`M 0 ${10/zoom} H ${80/zoom} M 0 ${30/zoom} H ${80/zoom} M ${40/zoom} 0 V ${10/zoom} M 0 ${10/zoom} V ${20/zoom} M ${40/zoom} ${20/zoom} V ${30/zoom} M 0 ${30/zoom} V ${40/zoom}`} stroke="hsl(var(--border))" strokeWidth={1 / zoom}/>
                </pattern>
                {[...frames, ...mullions].map(el => {
                    if (el.color && el.color.startsWith('linear-gradient')) {
                        const gradientId = `grad-${el.id}`;
                        const matches = el.color.matchAll(/#([0-9a-f]{6}|[0-9a-f]{3})/gi);
                        const colors = Array.from(matches, m => m[0]);
                        
                        if (colors.length >= 2) {
                            const gradientProps: any = { id: gradientId };
                            if (el.type === 'mullion') {
                                Object.assign(gradientProps, {
                                    gradientUnits: "userSpaceOnUse",
                                    x1: el.x1, y1: el.y1,
                                    x2: el.x2, y2: el.y2,
                                });
                            } else {
                                Object.assign(gradientProps, {
                                    x1: "0%", y1: "0%", x2: "100%", y2: "0%",
                                });
                            }

                            return (
                                <linearGradient key={gradientId} {...gradientProps}>
                                    <stop offset="0%" style={{ stopColor: colors[0] }} />
                                    <stop offset="100%" style={{ stopColor: colors[colors.length - 1] }} />
                                </linearGradient>
                            )
                        }
                    }
                    return null;
                })}
            </defs>
            <g transform={`translate(${panOffset.x} ${panOffset.y}) scale(${zoom})`}>
                {frames.map(shape => {
                    const isSelected = selectedElement?.type === 'frame' && selectedElement?.id === shape.id;
                    const thickness = shape.thickness || DEFAULT_FRAME_THICKNESS;

                    const fill = shape.color && shape.color.startsWith('linear-gradient')
                        ? `url(#grad-${shape.id})`
                        : shape.color || DEFAULT_STROKE_COLOR;
                    
                    const glassX = shape.x + thickness;
                    const glassY = shape.y + thickness;
                    const glassWidth = Math.max(0, shape.width - 2 * thickness);
                    const glassHeight = Math.max(0, shape.height - 2 * thickness);
                    const center = getElementCenter(shape);
                    const infill = shape.infill || 'glass';

                    return (
                        <g key={shape.id} transform={`rotate(${shape.rotation || 0} ${center.x} ${center.y})`}>
                            <rect
                                x={shape.x}
                                y={shape.y}
                                width={shape.width}
                                height={shape.height}
                                fill={fill}
                                strokeLinecap="round"
                            />
                            {glassWidth > 0 && glassHeight > 0 && (
                                <>
                                    <defs>
                                        <clipPath id={`clip-${shape.id}`}>
                                            <rect x={glassX} y={glassY} width={glassWidth} height={glassHeight} />
                                        </clipPath>
                                    </defs>
                                    {infill === 'glass' && (
                                        <>
                                        <rect
                                            x={glassX}
                                            y={glassY}
                                            width={glassWidth}
                                            height={glassHeight}
                                            fill={shape.glassColor || "hsla(var(--secondary), 0.5)"}
                                            stroke="hsl(var(--foreground))"
                                            strokeWidth={1 / zoom}
                                            strokeOpacity={0.2}
                                        />
                                        <text
                                            x={glassX + glassWidth / 2}
                                            y={glassY + glassHeight / 2}
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                            fill="hsl(var(--foreground))"
                                            opacity="0.2"
                                            fontSize={40 / zoom}
                                            fontWeight="bold"
                                            className="pointer-events-none uppercase tracking-wider"
                                        >
                                            {shape.glass?.replace('-', ' ')}
                                        </text>
                                        </>
                                    )}
                                    {infill === 'panel' && (
                                        <rect
                                            x={glassX}
                                            y={glassY}
                                            width={glassWidth}
                                            height={glassHeight}
                                            fill="hsl(var(--muted))"
                                            stroke="hsl(var(--border))"
                                            strokeWidth={1.5 / zoom}
                                        />
                                    )}
                                    {infill === 'louver' && (
                                        <g clipPath={`url(#clip-${shape.id})`}>
                                            <rect x={glassX} y={glassY} width={glassWidth} height={glassHeight} fill="hsl(var(--muted))" />
                                            {Array.from({ length: Math.floor(glassHeight / (20)) }).map((_, i) => (
                                                <line
                                                    key={i}
                                                    x1={glassX}
                                                    y1={glassY + (i + 0.5) * 20}
                                                    x2={glassX + glassWidth}
                                                    y2={glassY + (i + 0.5) * 20}
                                                    stroke="hsl(var(--border))"
                                                    strokeWidth={2 / zoom}
                                                />
                                            ))}
                                        </g>
                                    )}
                                    {infill === 'brickwork' && (
                                        <rect 
                                            x={glassX} y={glassY} width={glassWidth} height={glassHeight} 
                                            fill="url(#brick-pattern)" 
                                        />
                                    )}
                                </>
                            )}
                            {isSelected && (
                                 <rect
                                    x={shape.x}
                                    y={shape.y}
                                    width={shape.width}
                                    height={shape.height}
                                    fill="none"
                                    stroke={SELECTED_ELEMENT_COLOR}
                                    strokeWidth={SELECTION_OUTLINE_WIDTH / zoom}
                                    className="pointer-events-none"
                                 />
                            )}
                            {isSelected && Object.entries(getHandlesForRect(shape)).map(([key, handle]) => {
                                const handleSize = HANDLE_SIZE / zoom;
                                const isRotationHandle = key === 'rotate';

                                if (isRotationHandle) {
                                    return (
                                      <g key={key}>
                                        <line 
                                            x1={center.x}
                                            y1={center.y + shape.height / 2}
                                            x2={handle.x}
                                            y2={handle.y}
                                            stroke={SELECTED_ELEMENT_COLOR}
                                            strokeWidth={1.5 / zoom}
                                        />
                                        <circle 
                                            cx={handle.x}
                                            cy={handle.y}
                                            r={handleSize}
                                            fill='white'
                                            stroke={SELECTED_ELEMENT_COLOR}
                                            strokeWidth={1.5 / zoom}
                                            className="cursor-pointer"
                                            style={{ cursor: handle.cursor }}
                                            onMouseDown={(e) => {
                                                e.stopPropagation();
                                                handleMouseDown(e);
                                            }}
                                        />
                                      </g>  
                                    )
                                }
                                return (
                                    <rect
                                        key={key}
                                        x={handle.x}
                                        y={handle.y}
                                        width={handleSize}
                                        height={handleSize}
                                        fill={SELECTED_ELEMENT_COLOR}
                                        stroke={'white'}
                                        strokeWidth={1.5 / zoom}
                                        className="cursor-pointer"
                                        style={{ cursor: handle.cursor }}
                                        onMouseDown={(e) => {
                                            e.stopPropagation();
                                            handleMouseDown(e);
                                        }}
                                    />
                                )
                            })}
                        </g>
                    );
                })}
                {mullions.map(mullion => {
                    const isSelected = selectedElement?.type === 'mullion' && selectedElement?.id === mullion.id;
                    const thickness = mullion.thickness || DEFAULT_MULLION_THICKNESS;
                    
                    const stroke = mullion.color && mullion.color.startsWith('linear-gradient')
                        ? `url(#grad-${mullion.id})`
                        : mullion.color || DEFAULT_STROKE_COLOR;

                    return (
                        <g key={mullion.id}>
                            <line
                                x1={mullion.x1} y1={mullion.y1}
                                x2={mullion.x2} y2={mullion.y2}
                                stroke={stroke}
                                strokeWidth={thickness}
                                strokeLinecap="round"
                            />
                            {isSelected && (
                                 <line
                                    x1={mullion.x1} y1={mullion.y1}
                                    x2={mullion.x2} y2={mullion.y2}
                                    stroke={SELECTED_ELEMENT_COLOR}
                                    strokeWidth={SELECTION_OUTLINE_WIDTH / zoom}
                                    strokeLinecap="round"
                                    className="pointer-events-none"
                                 />
                            )}
                        </g>
                    );
                })}
                {dimensions.map(dim => {
                    const midX = (dim.x1 + dim.x2) / 2;
                    const midY = (dim.y1 + dim.y2) / 2;
                    const angle = Math.atan2(dim.y2 - dim.y1, dim.x2 - dim.x1) * 180 / Math.PI;

                    const isSelected = selectedElement?.type === 'dimension' && dim.id === selectedElement.id;
                    const strokeColor = isSelected ? SELECTED_ELEMENT_COLOR : DIMENSION_COLOR;
                    const strokeWidth = (isSelected ? SELECTION_OUTLINE_WIDTH : 1.5) / zoom;
                    
                    const offset = 12 / zoom;
                    const perpAngle = angle + (angle > 90 || angle < -90 ? -90 : 90);
                    const perpRad = perpAngle * Math.PI / 180;
                    
                    const textX = midX + Math.cos(perpRad) * offset;
                    const textY = midY + Math.sin(perpRad) * offset;

                    return (
                        <g 
                            key={dim.id}
                            className="pointer-events-none"
                            color={strokeColor}
                            transform={`rotate(${dim.rotation || 0}, ${dim.rotationCenterX || 0}, ${dim.rotationCenterY || 0})`}
                        >
                            <line
                                x1={dim.x1} y1={dim.y1}
                                x2={dim.x2} y2={dim.y2}
                                stroke={strokeColor}
                                strokeWidth={strokeWidth}
                                markerStart="url(#dim-arrow)"
                                markerEnd="url(#dim-arrow)"
                                className="pointer-events-auto"
                            />
                            <text
                                x={textX}
                                y={textY}
                                fill={strokeColor}
                                fontSize={14 / zoom}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                transform={`rotate(${angle > 90 || angle < -90 ? angle + 180 : angle} ${textX} ${textY})`}
                            >
                                {dim.text}
                            </text>
                        </g>
                    )
                })}
                {textBoxes.map(box => {
                    const isSelected = selectedElement?.type === 'textbox' && selectedElement?.id === box.id;
                    const center = getElementCenter(box);
                    const rotation = box.rotation || 0;
                    return (
                        <g key={box.id} onDoubleClick={(e) => handleTextDoubleClick(e, box)} transform={`rotate(${rotation} ${center.x} ${center.y})`}>
                            <foreignObject x={box.x} y={box.y} width={box.width} height={box.height}>
                                <div
                                    xmlns="http://www.w3.org/1999/xhtml"
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        padding: `${2 / zoom}px`,
                                        color: box.color,
                                        fontSize: box.fontSize / zoom,
                                        fontFamily: 'Inter, sans-serif',
                                        lineHeight: 1.2,
                                        wordBreak: 'break-word',
                                        pointerEvents: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        textAlign: 'center',
                                    }}
                                >
                                    {box.text}
                                </div>
                            </foreignObject>
                            {isSelected && (
                                 <rect
                                    x={box.x}
                                    y={box.y}
                                    width={box.width}
                                    height={box.height}
                                    fill="none"
                                    stroke={SELECTED_ELEMENT_COLOR}
                                    strokeWidth={SELECTION_OUTLINE_WIDTH / zoom}
                                    className="pointer-events-none"
                                 />
                            )}
                            {isSelected && Object.entries(getHandlesForRect(box)).map(([key, handle]) => {
                                const handleSize = HANDLE_SIZE / zoom;
                                const isRotationHandle = key === 'rotate';

                                if (isRotationHandle) {
                                    return (
                                      <g key={key}>
                                        <line 
                                            x1={center.x}
                                            y1={center.y + box.height / 2}
                                            x2={handle.x}
                                            y2={handle.y}
                                            stroke={SELECTED_ELEMENT_COLOR}
                                            strokeWidth={1.5 / zoom}
                                        />
                                        <circle 
                                            cx={handle.x}
                                            cy={handle.y}
                                            r={handleSize}
                                            fill='white'
                                            stroke={SELECTED_ELEMENT_COLOR}
                                            strokeWidth={1.5 / zoom}
                                            className="cursor-pointer"
                                            style={{ cursor: handle.cursor }}
                                            onMouseDown={(e) => {
                                                e.stopPropagation();
                                                handleMouseDown(e);
                                            }}
                                        />
                                      </g>  
                                    )
                                }
                                return (
                                    <rect
                                        key={key}
                                        x={handle.x}
                                        y={handle.y}
                                        width={handleSize}
                                        height={handleSize}
                                        fill={SELECTED_ELEMENT_COLOR}
                                        stroke={'white'}
                                        strokeWidth={1.5 / zoom}
                                        className="cursor-pointer"
                                        style={{ cursor: handle.cursor }}
                                        onMouseDown={(e) => {
                                            e.stopPropagation();
                                            handleMouseDown(e);
                                        }}
                                    />
                                )
                            })}
                        </g>
                    )
                })}
                {renderedHandles}
            </g>
        </svg>
      </div>
       {editingText && (
            <textarea
                value={editingText.text}
                onChange={(e) => setEditingText(prev => prev ? {...prev, text: e.target.value} : null)}
                onBlur={handleTextareaBlur}
                autoFocus
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleTextareaBlur();
                    }
                    if (e.key === 'Escape') {
                        setEditingText(null);
                    }
                }}
                style={{
                    position: 'absolute',
                    left: panOffset.x + editingText.x * zoom,
                    top: panOffset.y + editingText.y * zoom,
                    width: editingText.width * zoom,
                    height: editingText.height * zoom,
                    fontSize: editingText.fontSize,
                    border: `1px solid ${SELECTED_ELEMENT_COLOR}`,
                    background: 'hsla(var(--card), 0.9)',
                    color: editingText.color,
                    zIndex: 20,
                    outline: 'none',
                    resize: 'none',
                    fontFamily: 'Inter, sans-serif',
                    lineHeight: 1.2,
                    padding: `${2}px`,
                    textAlign: 'center',
                }}
            />
        )}
    </div>
  );
}
