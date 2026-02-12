
"use client";

import { useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Box, Center } from '@react-three/drei';
import type { Geometry, DesignParameters, Frame, Mullion } from '@/lib/types';
import * as THREE from 'three';
import { cn } from '@/lib/utils';

interface ThreeDVisualizationProps {
  geometry: Geometry | null;
  parameters: DesignParameters | null;
  customFrames?: Frame[];
  customMullions?: Mullion[];
  panelOpenStates?: number[];
  panelOffsets?: number[];
  togglePanelOpenState?: (index: number) => void;
  updatePanelOffsets?: (offsets: number[]) => void;
  toggleCustomFrameOpenState?: (frameId: string) => void;
}

const FRAME_COLORS: Record<string, string> = {
    white: '#EBEBEB',
    charcoal: '#343434',
    bronze: '#5C4033',
    silver: '#C0C0C0',
    'wood-effect': '#8B4513'
};

const PROFILE_DEPTH = 80; // Depth of the window frame/profiles in mm
const SASH_DEPTH = 70; // Depth of the sash profiles in mm
const DEFAULT_FRAME_THICKNESS = 40;
const DEFAULT_MULLION_THICKNESS = 40;
const scale = 0.001; // mm to m

// Helper to create a Box mesh
const FramePiece = ({ position, args, color }: { position: [number, number, number], args: [number, number, number], color: string }) => (
  <Box position={position} args={args}>
    <meshStandardMaterial color={color} />
  </Box>
);

const Custom3DView = ({ frames = [], mullions = [], toggleCustomFrameOpenState }: { frames?: Frame[], mullions?: Mullion[], toggleCustomFrameOpenState?: (frameId: string) => void; }) => {
    const frameColor = '#343434'; // Default color for custom for now

    if (frames.length === 0 && mullions.length === 0) {
        return (
            <div className="flex items-center justify-center w-full h-full text-muted-foreground">
                <p>Draw a design on the 2D canvas to see it in 3D.</p>
            </div>
        );
    }
    
    return (
        <Canvas
            camera={{ position: [0, 0, 1.5], fov: 50 }}
            className="bg-background"
        >
            <ambientLight intensity={Math.PI / 2} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} decay={0} intensity={Math.PI} />
            <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />

            <Center>
                {frames.map(frame => {
                    const thickness = (frame.thickness || DEFAULT_FRAME_THICKNESS) * scale;
                    const frameWidth = frame.width * scale;
                    const frameHeight = frame.height * scale;
                    const glassColor = frame.glassColor || "#cceeff";
                    const frameColorStr = frame.color && !frame.color.startsWith('linear-gradient') ? frame.color : frameColor;

                    const centerX = (frame.x + frame.width / 2) * scale;
                    const centerY = -(frame.y + frame.height / 2) * scale;
                    
                    const glassWidth = frameWidth - 2 * thickness;
                    const glassHeight = frameHeight - 2 * thickness;
                    const infill = frame.infill || 'glass';

                    const openState = frame.openState ?? 0;
                    const isOperable = frame.opening && frame.opening !== 'fixed';

                    let rotationAngle = 0;
                    let rotationPivot: [number, number, number] = [0, 0, 0];
                    let rotationAxis: "x" | "y" = "y";

                    if (isOperable && openState > 0) {
                        const openRatio = openState === 1 ? 0.5 : 1.0;
                        const maxAngle = 90;
                        const angle = (maxAngle * openRatio * Math.PI) / 180;
                        
                        switch (frame.opening) {
                            case 'awning': // hinge top
                                rotationAxis = 'x';
                                rotationAngle = angle;
                                rotationPivot = [0, frameHeight / 2, 0];
                                break;
                            case 'tilt': // hinge bottom
                                rotationAxis = 'x';
                                rotationAngle = -angle;
                                rotationPivot = [0, -frameHeight / 2, 0];
                                break;
                            case 'casement-left':
                            case 'door-left': // hinge left
                                rotationAxis = 'y';
                                rotationAngle = angle;
                                rotationPivot = [-frameWidth / 2, 0, 0];
                                break;
                            case 'casement-right':
                            case 'door-right': // hinge right
                                rotationAxis = 'y';
                                rotationAngle = -angle;
                                rotationPivot = [frameWidth / 2, 0, 0];
                                break;
                        }
                    }

                    const SashAndGlass = (
                        <>
                            {/* Top */}
                            <FramePiece position={[0, frameHeight / 2 - thickness / 2, 0]} args={[frameWidth, thickness, SASH_DEPTH * scale]} color={frameColorStr} />
                            {/* Bottom */}
                            <FramePiece position={[0, -frameHeight / 2 + thickness / 2, 0]} args={[frameWidth, thickness, SASH_DEPTH * scale]} color={frameColorStr} />
                            {/* Left */}
                            <FramePiece position={[-frameWidth / 2 + thickness / 2, 0, 0]} args={[thickness, frameHeight - 2 * thickness, SASH_DEPTH * scale]} color={frameColorStr} />
                            {/* Right */}
                            <FramePiece position={[frameWidth / 2 - thickness / 2, 0, 0]} args={[thickness, frameHeight - 2 * thickness, SASH_DEPTH * scale]} color={frameColorStr} />
                            
                            {/* Infill */}
                            {glassWidth > 0 && glassHeight > 0 && (
                                <>
                                {infill === 'glass' && (
                                    <Box position={[0,0,0]} args={[glassWidth, glassHeight, 0.01]}>
                                        <meshStandardMaterial color={glassColor} transparent opacity={0.6} side={THREE.DoubleSide} />
                                    </Box>
                                )}
                                {infill === 'panel' && (
                                    <Box position={[0,0,0]} args={[glassWidth, glassHeight, 0.02]}>
                                        <meshStandardMaterial color={'#D3D3D3'} side={THREE.DoubleSide} />
                                    </Box>
                                )}
                                {infill === 'louver' && (
                                    <group>
                                    {Array.from({ length: Math.floor(glassHeight / (0.025)) }).map((_, i) => (
                                        <Box key={i} position={[0, (glassHeight/2) - (i + 0.5) * 0.025, 0]} rotation={[-Math.PI / 6, 0, 0]} args={[glassWidth, 0.005, 0.025]}>
                                            <meshStandardMaterial color={'#A9A9A9'} />
                                        </Box>
                                    ))}
                                    </group>
                                )}
                                {infill === 'brickwork' && (
                                    <Box position={[0,0,0]} args={[glassWidth, glassHeight, PROFILE_DEPTH * scale]}>
                                        <meshStandardMaterial color={'#8B4513'} />
                                    </Box>
                                )}
                                </>
                            )}
                        </>
                    );

                    return (
                        <group 
                            key={frame.id} 
                            rotation={[0,0, -(frame.rotation || 0) * (Math.PI / 180)]} 
                            position={[centerX, centerY, 0]}
                            onClick={(e) => {
                                if (isOperable) {
                                    e.stopPropagation();
                                    toggleCustomFrameOpenState?.(frame.id);
                                }
                            }}
                            onPointerOver={(e) => isOperable && e.nativeEvent.target && ((e.nativeEvent.target as HTMLElement).style.cursor = 'pointer')}
                            onPointerOut={(e) => isOperable && e.nativeEvent.target && ((e.nativeEvent.target as HTMLElement).style.cursor = 'auto')}
                        >
                            <group position={rotationPivot} rotation={[rotationAxis === 'x' ? rotationAngle : 0, rotationAxis === 'y' ? rotationAngle : 0, 0]}>
                                <group position={[-rotationPivot[0], -rotationPivot[1], -rotationPivot[2]]}>
                                    {SashAndGlass}
                                </group>
                            </group>
                        </group>
                    )
                })}
                {mullions.map(mullion => {
                    const thickness = (mullion.thickness || DEFAULT_MULLION_THICKNESS) * scale;
                    const start = new THREE.Vector3(mullion.x1 * scale, -mullion.y1 * scale, 0);
                    const end = new THREE.Vector3(mullion.x2 * scale, -mullion.y2 * scale, 0);
                    const length = start.distanceTo(end);
                    const center = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
                    const rotationZ = Math.atan2(end.y - start.y, end.x - start.x);
                    const mullionColor = mullion.color && !mullion.color.startsWith('linear-gradient') ? mullion.color : frameColor;


                    return (
                        <Box key={mullion.id} position={[center.x, center.y, center.z]} rotation={[0,0,rotationZ]} args={[length, thickness, PROFILE_DEPTH * scale]}>
                            <meshStandardMaterial color={mullionColor} />
                        </Box>
                    )
                })}
            </Center>
            
            <OrbitControls />
        </Canvas>
    );
};


export function ThreeDVisualization({ geometry, parameters, customFrames, customMullions, panelOpenStates, panelOffsets, togglePanelOpenState, updatePanelOffsets, toggleCustomFrameOpenState }: ThreeDVisualizationProps) {
  const [draggedPanel, setDraggedPanel] = useState<{ index: number; startOffset: number; startWorldX: number } | null>(null);
    
  if (customFrames || customMullions) {
      return <Custom3DView frames={customFrames} mullions={customMullions} toggleCustomFrameOpenState={toggleCustomFrameOpenState} />;
  }

  if (!geometry || !parameters) {
    return (
      <div className="flex items-center justify-center w-full h-full text-muted-foreground">
        <p>No design available for 3D view.</p>
      </div>
    );
  }

  const frameColor = FRAME_COLORS[parameters.color] || '#343434';
  const { frame, panels } = geometry;
  const frameWidth = frame.outer.width * scale;
  const frameHeight = frame.outer.height * scale;
  const frameThickness = (frame.outer.width - frame.inner.width) / 2 * scale;
  const glassThickness = 0.01; // 1cm thick glass
  
  const isSliding = parameters.system.includes('track');
  const isCasement = parameters.system === 'casement';
  const isFoldable = parameters.system === 'foldable';
  const isOperableUpDown = parameters.system === 'awning' || parameters.system === 'tilt-and-turn';
  
  const handlePanelClick = (index: number) => (event: any) => {
    if (isSliding) return;
    event.stopPropagation();
    if (!isOperableUpDown && !isCasement && !isFoldable) return;
    togglePanelOpenState?.(index);
  };

  const handlePointerDown = (index: number) => (event: any) => {
    if (!isSliding) return;
    event.stopPropagation();
    
    // The event point is in world coordinates (meters)
    setDraggedPanel({
        index,
        startOffset: panelOffsets?.[index] ?? 0,
        startWorldX: event.point.x / scale // convert from meters to design space (mm)
    });
    
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: any) => {
      if (!draggedPanel || !isSliding || !geometry || !updatePanelOffsets || !event.point) return;
      event.stopPropagation();
      
      const currentWorldX = event.point.x / scale; // convert from meters to design space (mm)
      const dx = currentWorldX - draggedPanel.startWorldX;
      
      let newOffset = draggedPanel.startOffset + dx;
      
      // clamp logic
      const panel = geometry.panels[draggedPanel.index];
      const frame = geometry.frame;
      const minOffset = -panel.panelRect.x;
      const maxOffset = frame.outer.width - panel.panelRect.x - panel.panelRect.width;
      
      newOffset = Math.max(minOffset, Math.min(newOffset, maxOffset));

      const newOffsets = [...(panelOffsets ?? [])];
      newOffsets[draggedPanel.index] = newOffset;
      updatePanelOffsets(newOffsets);
  };

  const handlePointerUp = (event: any) => {
      if (!draggedPanel) return;
      event.stopPropagation();
      setDraggedPanel(null);
      (event.target as HTMLElement).releasePointerCapture(event.pointerId);
  };

  return (
    <Canvas
      camera={{ position: [0, 0, frameWidth * 1.5], fov: 50 }}
      className="bg-background"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <ambientLight intensity={Math.PI / 2} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} decay={0} intensity={Math.PI} />
      <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />
      
      <group>
        {/* Main Frame */}
        <FramePiece
          position={[0, (frameHeight - frameThickness) / 2, 0]}
          args={[frameWidth, frameThickness, PROFILE_DEPTH * scale]}
          color={frameColor}
        />
        <FramePiece
          position={[0, (-frameHeight + frameThickness) / 2, 0]}
          args={[frameWidth, frameThickness, PROFILE_DEPTH * scale]}
          color={frameColor}
        />
        <FramePiece
          position={[(-frameWidth + frameThickness) / 2, 0, 0]}
          args={[frameThickness, frameHeight - 2 * frameThickness, PROFILE_DEPTH * scale]}
          color={frameColor}
        />
        <FramePiece
          position={[(frameWidth - frameThickness) / 2, 0, 0]}
          args={[frameThickness, frameHeight - 2 * frameThickness, PROFILE_DEPTH * scale]}
          color={frameColor}
        />

        {/* Panels */}
        {panels.map((panel, index) => {
          const panelWidth = panel.panelRect.width * scale;
          const panelHeight = panel.panelRect.height * scale;
          const panelX = (panel.panelRect.x - frame.outer.width / 2) * scale + panelWidth / 2;
          const panelY = -(panel.panelRect.y - frame.outer.height / 2) * scale - panelHeight / 2;

          const panelSashThickness = (panel.panelRect.width - panel.glassRect.width) / 2 * scale;
          
          const glassWidth = panel.glassRect.width * scale;
          const glassHeight = panel.glassRect.height * scale;
          
          const openState = panelOpenStates?.[index] ?? 0;

          const baseZOffset = (PROFILE_DEPTH - SASH_DEPTH) / 2 * scale;
          let panelGroupPosition: [number, number, number] = [panelX, panelY, baseZOffset];

          if (isSliding) {
              const offsetX = (panelOffsets?.[index] ?? 0) * scale;
              const numTracks = parseInt(parameters.system.charAt(0), 10) || 2;
              const trackIndex = index % numTracks;
              const trackDepthSeparation = SASH_DEPTH; // mm
              
              const totalTrackDepth = (numTracks - 1) * trackDepthSeparation;
              const firstTrackZ = -totalTrackDepth / 2;
              const trackZ = (firstTrackZ + trackIndex * trackDepthSeparation) * scale;

              panelGroupPosition = [panelX + offsetX, panelY, trackZ];
          }

          let rotationAngle = 0;
          let rotationPivot: [number, number, number] = [0, 0, 0];
          let rotationAxis: "x" | "y" | "z" = "y";

          if (openState > 0) {
              const openRatio = openState === 1 ? 0.5 : 1.0;
              const maxAngle = 90;
              
              if (isOperableUpDown) {
                  rotationAngle = (maxAngle * openRatio * Math.PI) / 180;
                  rotationAxis = "x";
                  rotationPivot = [0, panelHeight / 2, 0];
              } else if (isCasement) {
                  const direction = parameters.casementOpening || 'pair';
                  let hingeIsLeft;
                  if (direction === 'left') hingeIsLeft = true;
                  else if (direction === 'right') hingeIsLeft = false;
                  else hingeIsLeft = index % 2 === 0;

                  rotationAngle = hingeIsLeft ? (maxAngle * openRatio * Math.PI) / 180 : (-maxAngle * openRatio * Math.PI) / 180;
                  rotationPivot = [hingeIsLeft ? -panelWidth / 2 : panelWidth / 2, 0, 0];
              } else if (isFoldable) {
                  const isFirstInPair = index % 2 === 0;
                  rotationAngle = isFirstInPair ? (-maxAngle * openRatio * Math.PI) / 180 : (maxAngle * openRatio * Math.PI) / 180;
                  rotationPivot = [isFirstInPair ? panelWidth/2 : -panelWidth/2, 0, 0];
              }
          }
          const rotationProp = rotationAxis === 'y' ? { rotationY: rotationAngle } : { rotationX: rotationAngle };

          return (
            <group 
              key={index} 
              position={panelGroupPosition} 
              onClick={handlePanelClick(index)}
              onPointerDown={handlePointerDown(index)}
            >
              <group position={rotationPivot} rotation={[rotationAxis === 'x' ? rotationAngle : 0, rotationAxis === 'y' ? rotationAngle : 0, 0]}>
                <group position={[-rotationPivot[0], -rotationPivot[1], -rotationPivot[2]]}>
                  {/* Panel Sash */}
                  <FramePiece position={[0, (panelHeight - panelSashThickness)/2, 0]} args={[panelWidth, panelSashThickness, SASH_DEPTH * scale]} color={frameColor} />
                  <FramePiece position={[0, (-panelHeight + panelSashThickness)/2, 0]} args={[panelWidth, panelSashThickness, SASH_DEPTH * scale]} color={frameColor} />
                  <FramePiece position={[(-panelWidth + panelSashThickness)/2, 0, 0]} args={[panelSashThickness, panelHeight - 2*panelSashThickness, SASH_DEPTH * scale]} color={frameColor} />
                  <FramePiece position={[(panelWidth - panelSashThickness)/2, 0, 0]} args={[panelSashThickness, panelHeight - 2*panelSashThickness, SASH_DEPTH * scale]} color={frameColor} />
                  
                  {/* Glass */}
                  <Box position={[0, 0, 0]} args={[glassWidth, glassHeight, glassThickness]}>
                        <meshStandardMaterial color="#cceeff" transparent opacity={0.6} side={THREE.DoubleSide} />
                  </Box>
                </group>
              </group>
            </group>
          );
        })}
      </group>
      
      <OrbitControls />
    </Canvas>
  );
}
