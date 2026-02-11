
"use client";

import {
  MousePointer,
  PenSquare,
  Spline,
  Combine,
  Ruler,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Move,
  Trash2,
  Plus,
  Minus,
  Frame as FrameIcon,
  GlassWater,
  LayoutGrid,
  Shapes,
  Palette,
  Droplet,
  Type,
  BookOpenCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { SelectedElement } from "./custom-design-canvas";
import type { MaterialType, GlassType, OpeningType, Frame, InfillType } from "@/lib/types";
import { Input } from "@/components/ui/input";


export type Tool =
  | "select"
  | "draw-frame"
  | "draw-mullion"
  | "paint"
  | "merge"
  | "dimension"
  | "draw-text"
  | "zoom-in"
  | "zoom-out"
  | "pan"
  | "undo"
  | "redo"
  | "clear";

const tools = [
  { id: "select", icon: MousePointer, label: "Select & Move (V)" },
  { id: "draw-frame", icon: PenSquare, label: "Draw Frame (F)" },
  { id: "draw-mullion", icon: Spline, label: "Add Mullion (M)" },
  { id: "dimension", icon: Ruler, label: "Add Dimension (D)" },
  { id: "draw-text", icon: Type, label: "Add Text (T)" },
  { id: "paint", icon: Palette, label: "Paint (P)"},
  { id: "merge", icon: Combine, label: "Merge Profiles (J)" },
] as const;

const actions = [
    { id: "undo", icon: Undo, label: "Undo (Ctrl+Z)" },
    { id: "redo", icon: Redo, label: "Redo (Ctrl+Y)" },
    { id: "clear", icon: Trash2, label: "Clear Canvas" },
] as const;

const navigation = [
    { id: "pan", icon: Move, label: "Pan Tool (H)" },
    { id: "zoom-in", icon: ZoomIn, label: "Zoom In (+)" },
    { id: "zoom-out", icon: ZoomOut, label: "Zoom Out (-)" },
] as const;

const thicknessActions = [
    { id: "thicker", icon: Plus, label: "Increase Thickness" },
    { id: "thinner", icon: Minus, label: "Decrease Thickness" },
] as const;

const materialColors = [
    "#EBEBEB", // White
    "#343434", // Charcoal
    "#5C4033", // Bronze
    "#C0C0C0", // Silver
    "hsl(var(--primary))",
    "hsl(var(--destructive))",
];

const materialPresets = [
    { name: 'Brushed Aluminum', value: 'linear-gradient(to right, #D6D6D6, #A9A9A9)'},
    { name: 'Natural Oak', value: 'linear-gradient(to right, #C6A686, #8B6B4E)'},
    { name: 'Dark Walnut', value: 'linear-gradient(to right, #5C4033, #432E23)'},
    { name: 'Polished Bronze', value: 'linear-gradient(to right, #CD7F32, #A96628)'},
];

const materialTypes: {value: MaterialType, label: string}[] = [
    { value: 'aluminum', label: 'Aluminum' },
    { value: 'upvc', label: 'uPVC' },
    { value: 'wood', label: 'Wood' },
];

const infillTypes: {value: InfillType, label: string}[] = [
    { value: 'glass', label: 'Glass' },
    { value: 'louver', label: 'Louver' },
    { value: 'panel', label: 'Solid Panel' },
    { value: 'brickwork', label: 'Brickwork' },
];

const glassTypes: {value: GlassType, label: string}[] = [
    { value: 'standard', label: 'Standard' },
    { value: 'toughened', label: 'Toughened' },
    { value: 'laminated', label: 'Laminated' },
    { value: 'double-glazed', label: 'Double Glazed' },
    { value: 'mesh', label: 'Security Mesh' },
];

const openingTypes: {value: OpeningType, label: string}[] = [
    { value: 'fixed', label: 'Fixed' },
    { value: 'casement-left', label: 'Casement (L)' },
    { value: 'casement-right', label: 'Casement (R)' },
    { value: 'door-left', label: 'Door (L)' },
    { value: 'door-right', label: 'Door (R)' },
    { value: 'awning', label: 'Awning' },
    { value: 'tilt', label: 'Hopper/Tilt' },
];


const disabledTools: Tool[] = [
  "merge",
];

interface CustomDesignToolbarProps {
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;
  onClear: () => void;
  onDeleteSelected: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onIncreaseThickness: () => void;
  onDecreaseThickness: () => void;
  isElementSelected: boolean;
  onSetPaintColor: (color: string) => void;
  paintTarget: 'frame' | 'glass' | 'line';
  onPaintTargetChange: (target: 'frame' | 'glass' | 'line') => void;
  onUpdateMaterial: (material: MaterialType) => void;
  onUpdateInfillType: (infill: InfillType) => void;
  onUpdateGlass: (glass: GlassType) => void;
  onUpdateOpeningType: (opening: OpeningType) => void;
  selectedElementData: Partial<Frame> | null;
  onAddShape: (shapeType: string) => void;
  portalContainer?: HTMLElement | null;
}

export function CustomDesignToolbar({ 
    activeTool, 
    setActiveTool, 
    onClear,
    onDeleteSelected,
    onZoomIn, 
    onZoomOut,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    onIncreaseThickness,
    onDecreaseThickness,
    isElementSelected,
    onSetPaintColor,
    paintTarget,
    onPaintTargetChange,
    onUpdateMaterial,
    onUpdateInfillType,
    onUpdateGlass,
    onUpdateOpeningType,
    selectedElementData,
    onAddShape,
    portalContainer,
}: CustomDesignToolbarProps) {
  return (
    <TooltipProvider>
      <div className="absolute top-4 left-2 right-2 sm:w-auto sm:left-1/2 sm:-translate-x-1/2 z-10">
        <div className="flex items-center justify-center flex-wrap gap-1 p-1.5 bg-card border rounded-lg shadow-lg">
            {tools.map(tool => (
                <Tooltip key={tool.id}>
                    <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "h-9 w-9",
                            activeTool === tool.id && "bg-primary/10 text-primary"
                        )}
                        onClick={() => setActiveTool(tool.id as Tool)}
                        disabled={disabledTools.includes(tool.id as Tool)}
                    >
                        <tool.icon className="h-5 w-5" />
                    </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                    <p>{tool.label}</p>
                    </TooltipContent>
                </Tooltip>
            ))}

            <Separator orientation="vertical" className="h-6 mx-1" />

            <Popover>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9">
                                <Shapes className="h-5 w-5" />
                            </Button>
                        </PopoverTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                        <p>Add Shape</p>
                    </TooltipContent>
                </Tooltip>
                <PopoverContent className="w-48 p-2" container={portalContainer}>
                    <div className="grid gap-1">
                        <Button variant="ghost" className="justify-start" onClick={() => onAddShape('rectangle')}>Rectangle Frame</Button>
                        <Button variant="ghost" className="justify-start" onClick={() => onAddShape('triangle')}>Triangle</Button>
                        <Button variant="ghost" className="justify-start" onClick={() => onAddShape('pentagon')}>Pentagon</Button>
                        <Button variant="ghost" className="justify-start" onClick={() => onAddShape('hexagon')}>Hexagon</Button>
                        <Button variant="ghost" className="justify-start" onClick={() => onAddShape('octagon')}>Octagon</Button>
                        <Button variant="ghost" className="justify-start" onClick={() => onAddShape('circle')}>Circle</Button>
                        <Button variant="ghost" className="justify-start" onClick={() => onAddShape('arch')}>Arch</Button>
                    </div>
                </PopoverContent>
            </Popover>

            <Separator orientation="vertical" className="h-6 mx-1" />


            <Popover>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9">
                                <Palette className="h-5 w-5" />
                            </Button>
                        </PopoverTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                        <p>Select Paint Color</p>
                    </TooltipContent>
                </Tooltip>
                <PopoverContent className="w-56 p-4" container={portalContainer}>
                     <div className="space-y-4">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground mb-2">Solid Colors</p>
                            <div className="grid grid-cols-6 gap-2">
                                {materialColors.map(color => (
                                    <Button
                                        key={color}
                                        variant="outline"
                                        size="icon"
                                        className="h-7 w-7 rounded-md border-muted-foreground/20 p-0"
                                        onClick={() => onSetPaintColor(color)}
                                    >
                                      <div className="h-full w-full rounded-md" style={{ backgroundColor: color }} />
                                    </Button>
                                ))}
                            </div>
                        </div>
                        <Separator />
                        <div>
                            <p className="text-xs font-medium text-muted-foreground mb-2">Materials</p>
                            <div className="grid grid-cols-2 gap-2">
                                {materialPresets.map((material, index) => (
                                  <Tooltip key={index}>
                                    <TooltipTrigger asChild>
                                      <Button
                                          variant="outline"
                                          className="h-7 w-full rounded-md p-0 border-muted-foreground/20"
                                          style={{ background: material.value }}
                                          onClick={() => onSetPaintColor(material.value)}
                                      />
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="p-1 px-2 text-xs">
                                        <p>{material.name}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                ))}
                            </div>
                        </div>
                        <Separator />
                        <div>
                            <p className="text-xs font-medium text-muted-foreground mb-2">Custom Color</p>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="color"
                                    className="h-8 w-8 p-1 cursor-pointer"
                                    onChange={(e) => onSetPaintColor(e.target.value)}
                                    defaultValue="#343434"
                                />
                                <Input
                                    type="text"
                                    placeholder="#RRGGBB"
                                    className="h-8"
                                    onChange={(e) => {
                                        if (/^#([0-9A-F]{3}){1,2}$/i.test(e.target.value)) {
                                            onSetPaintColor(e.target.value);
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>

            <Tooltip>
                <TooltipTrigger asChild>
                    <div>
                        <Select value={paintTarget} onValueChange={onPaintTargetChange as (value: string) => void}>
                            <SelectTrigger className="h-9 w-auto sm:w-36" aria-label="Paint target">
                                <div className="flex items-center gap-2">
                                    <Droplet className="h-4 w-4" />
                                    <SelectValue className="hidden sm:inline-block" placeholder="Paint Target" />
                                </div>
                            </SelectTrigger>
                            <SelectContent container={portalContainer}>
                                <SelectItem value="frame">Frame</SelectItem>
                                <SelectItem value="glass">Glass</SelectItem>
                                <SelectItem value="line">Line/Mullion</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </TooltipTrigger>
                <TooltipContent side="bottom"><p>Paint Target</p></TooltipContent>
            </Tooltip>


            <Separator orientation="vertical" className="h-6 mx-1" />

             {thicknessActions.map(tool => (
                <Tooltip key={tool.id}>
                    <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                        onClick={tool.id === 'thicker' ? onIncreaseThickness : onDecreaseThickness}
                        disabled={!isElementSelected}
                    >
                        <tool.icon className="h-5 w-5" />
                    </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                    <p>{tool.label}</p>
                    </TooltipContent>
                </Tooltip>
            ))}

            <Separator orientation="vertical" className="h-6 mx-1 hidden sm:block" />
            
            <div className="hidden sm:flex items-center gap-1">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div>
                            <Select
                                value={selectedElementData?.material}
                                onValueChange={onUpdateMaterial}
                                disabled={!selectedElementData || !('material' in selectedElementData)}
                            >
                                <SelectTrigger className="h-9 w-32" disabled={!selectedElementData || !('material' in selectedElementData)}>
                                    <div className="flex items-center gap-2">
                                        <FrameIcon className="h-4 w-4" />
                                        <SelectValue placeholder="Material" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent container={portalContainer}>
                                    {materialTypes.map(m => (
                                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom"><p>Element Material</p></TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <div>
                            <Select
                                value={selectedElementData?.infill}
                                onValueChange={onUpdateInfillType}
                                disabled={!selectedElementData || !('infill' in selectedElementData)}
                            >
                                <SelectTrigger className="h-9 w-36" disabled={!selectedElementData || !('infill' in selectedElementData)}>
                                    <div className="flex items-center gap-2">
                                        <LayoutGrid className="h-4 w-4" />
                                        <SelectValue placeholder="Infill Type" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent container={portalContainer}>
                                    {infillTypes.map(i => (
                                        <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom"><p>Infill Type</p></TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <div>
                            <Select
                                value={selectedElementData?.glass}
                                onValueChange={onUpdateGlass}
                                disabled={!selectedElementData || !('glass' in selectedElementData) || selectedElementData.infill !== 'glass'}
                            >
                                <SelectTrigger className="h-9 w-36" disabled={!selectedElementData || !('glass' in selectedElementData) || selectedElementData.infill !== 'glass'}>
                                    <div className="flex items-center gap-2">
                                        <GlassWater className="h-4 w-4" />
                                        <SelectValue placeholder="Glass Type" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent container={portalContainer}>
                                    {glassTypes.map(g => (
                                        <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom"><p>Glass / Infill Type</p></TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <div>
                            <Select
                                value={selectedElementData?.opening}
                                onValueChange={onUpdateOpeningType}
                                disabled={!selectedElementData || !('opening' in selectedElementData)}
                            >
                                <SelectTrigger className="h-9 w-36" disabled={!selectedElementData || !('opening' in selectedElementData)}>
                                    <div className="flex items-center gap-2">
                                        <BookOpenCheck className="h-4 w-4" />
                                        <SelectValue placeholder="Opening Type" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent container={portalContainer}>
                                    {openingTypes.map(o => (
                                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom"><p>Opening Type</p></TooltipContent>
                </Tooltip>
            </div>


            <Separator orientation="vertical" className="h-6 mx-1" />

            {navigation.map(tool => (
                <Tooltip key={tool.id}>
                    <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "h-9 w-9",
                             activeTool === tool.id && "bg-primary/10 text-primary"
                        )}
                         onClick={() => {
                            if (tool.id === 'pan') {
                                setActiveTool(tool.id);
                            } else if (tool.id === 'zoom-in') {
                                onZoomIn();
                            } else if (tool.id === 'zoom-out') {
                                onZoomOut();
                            }
                         }}
                         disabled={disabledTools.includes(tool.id as Tool)}
                    >
                        <tool.icon className="h-5 w-5" />
                    </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                    <p>{tool.label}</p>
                    </TooltipContent>
                </Tooltip>
            ))}

            <Separator orientation="vertical" className="h-6 mx-1" />

            {actions.map(action => {
                 let isDisabled = false;
                 let actionFunc = () => {};
                 let label = action.label;

                 if (action.id === 'clear') {
                    if (isElementSelected) {
                        actionFunc = onDeleteSelected;
                        label = "Delete Selected (Del)";
                    } else {
                        actionFunc = onClear;
                    }
                 } else if (action.id === 'undo') {
                    isDisabled = !canUndo;
                    actionFunc = onUndo;
                 } else if (action.id === 'redo') {
                    isDisabled = !canRedo;
                    actionFunc = onRedo;
                 }

                return (
                    <Tooltip key={action.id}>
                        <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "h-9 w-9",
                                action.id === 'clear' && 'text-destructive/80 hover:text-destructive hover:bg-destructive/10'
                            )}
                            onClick={actionFunc}
                            disabled={isDisabled}
                        >
                            <action.icon className="h-5 w-5" />
                        </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                        <p>{label}</p>
                        </TooltipContent>
                    </Tooltip>
                );
            })}
        </div>
      </div>
    </TooltipProvider>
  );
}
