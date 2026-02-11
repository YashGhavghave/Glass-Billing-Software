
export type SystemType = '2-track' | '3-track' | '4-track' | '5-track' | 'casement' | 'awning' | 'fixed' | 'foldable' | 'tilt-and-turn' | 'custom';
export type ProfileType = 'standard' | 'slim' | 'heavy-duty';
export type MaterialType = 'upvc' | 'aluminum' | 'wood';
export type FrameColor = 'white' | 'charcoal' | 'bronze' | 'silver' | 'wood-effect';
export type GlassType = 'standard' | 'toughened' | 'laminated' | 'mesh' | 'double-glazed';
export type HardwareStyle = 'modern' | 'classic' | 'minimalist';
export type CasementOpeningDirection = 'left' | 'right' | 'pair';


export type DesignParameters = {
  system: SystemType;
  profile: ProfileType;
  material: MaterialType;
  color: FrameColor;
  glass: GlassType;
  hardware: HardwareStyle;
  width: number;
  height: number;
  panels: number;
  casementOpening?: CasementOpeningDirection;
};

export type Point = { x: number; y: number };
export type Rect = { x: number; y: number; width: number; height: number };
export type Line = { x1: number; y1: number; x2: number; y2: number };

export type FrameGeometry = {
  outer: Rect;
  inner: Rect;
};

export type PanelGeometry = {
  panelRect: Rect;
  glassRect: Rect;
};

export type Geometry = {
  frame: FrameGeometry;
  tracks: Line[];
  panels: PanelGeometry[];
};

export type BillOfMaterialsItem = {
    item: string;
    description: string;
    quantity: number;
    unit: string;
};

export type CutListItem = {
    part: string;
    length: number;
    angle: string;
    quantity: number;
    profile: ProfileType;
    material: MaterialType;
};

export type ProjectOutput = {
    bom: BillOfMaterialsItem[];
    cutList: CutListItem[];
};

// Custom Canvas Types
export type OpeningType = 'casement-left' | 'casement-right' | 'awning' | 'tilt' | 'fixed' | 'door-left' | 'door-right';
export type InfillType = 'glass' | 'louver' | 'panel' | 'brickwork';

export type Frame = {
  id: string;
  type: 'frame';
  x: number;
  y: number;
  width: number;
  height: number;
  thickness?: number;
  color?: string;
  material?: MaterialType;
  infill?: InfillType;
  glass?: GlassType;
  glassColor?: string;
  rotation?: number;
  opening?: OpeningType;
  openState?: 0 | 1 | 2; // 0=closed, 1=partial, 2=full
  parentId?: string;
};

export type Mullion = {
    id: string;
    type: 'mullion';
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    thickness?: number;
    color?: string;
    material?: MaterialType;
    groupId?: string;
    parentId?: string;
};

export type Dimension = {
    id: string;
    type: 'dimension';
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    text: string;
    parentId?: string;
    rotation?: number;
    rotationCenterX?: number;
    rotationCenterY?: number;
};

export type TextBox = {
    id: string;
    type: 'textbox';
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
    fontSize: number;
    color: string;
    rotation?: number;
};

export type CanvasElement = Frame | Mullion | Dimension | TextBox;
export type SelectedElement = { type: 'frame' | 'mullion' | 'dimension' | 'textbox'; id: string };

export type Design = {
  id: string;
  name: string;
  parameters: DesignParameters;
  geometry: Geometry | null;
  warnings: string[];
  outputs: ProjectOutput | null;
  panelOpenStates?: number[];
  panelOffsets?: number[];
  rate?: number;
  // Additions for custom canvas state
  frames?: Frame[];
  mullions?: Mullion[];
  dimensions?: Dimension[];
  textBoxes?: TextBox[];
};
