
'use server';

import type { DesignParameters, Geometry, Rect, BillOfMaterialsItem, CutListItem, ProjectOutput } from "@/lib/types";

const PROFILE_THICKNESS = {
  'slim': 30,
  'standard': 40,
  'heavy-duty': 60,
};

const SASH_SIZE = {
    'slim': 35,
    'standard': 45,
    'heavy-duty': 55,
};

// This is a simplified engine. A real app would have much more complex calculations.
export const runDesignEngine = async (params: DesignParameters): Promise<{ geometry: Geometry; warnings: string[]; outputs: ProjectOutput }> => {
  const warnings: string[] = [];
  const isHinged = params.system === 'casement' || params.system === 'awning' || params.system === 'tilt-and-turn';

  if (params.height > 3200) {
    warnings.push("Height over 3200mm may require special engineering review.");
  }
  if (params.width / params.panels > 1800) {
    warnings.push("Panel width is very large. Consider adding more panels for stability.");
  }
  if (params.panels > 6 && params.system === '3-track') {
    warnings.push("More than 6 panels on a 3-track system is not recommended.");
  }
  if (isHinged && params.panels > 2) {
    warnings.push("Multi-panel hinged systems require specialized hardware. Please verify support.");
  }
  if (params.profile === 'slim' && (params.height > 2800 || params.width > 5000)) {
      warnings.push("Slim profiles are not recommended for very large dimensions.");
  }
  if (params.system === 'foldable' && params.panels % 2 !== 0) {
    warnings.push("Foldable systems typically look best with an even number of panels.");
  }
  if (params.system === 'fixed' && params.panels !== 1) {
    warnings.push("Fixed systems must have exactly one panel.");
    params.panels = 1;
  }

  // --- Geometry Calculation ---
  const frameThickness = PROFILE_THICKNESS[params.profile];
  const sashVertical = SASH_SIZE[params.profile];
  const sashHorizontal = SASH_SIZE[params.profile];

  const frame: Geometry['frame'] = {
    outer: { x: 0, y: 0, width: params.width, height: params.height },
    inner: { 
      x: frameThickness, 
      y: frameThickness, 
      width: params.width - 2 * frameThickness, 
      height: params.height - 2 * frameThickness 
    },
  };
  
  const isSliding = params.system.includes('track');
  const isFixed = params.system === 'fixed';
  const isFoldable = params.system === 'foldable';

  const tracks: Geometry['tracks'] = [];
  if (isSliding) {
    const numTracks = parseInt(params.system.charAt(0), 10);
    if(numTracks > 1) {
      const trackSpacing = frame.inner.width / numTracks;
      for (let i = 1; i < numTracks; i++) {
        tracks.push({
          x1: frameThickness + i * trackSpacing,
          y1: frameThickness,
          x2: frameThickness + i * trackSpacing,
          y2: params.height - frameThickness,
        });
      }
    }
  }

  const panels: Geometry['panels'] = [];
  let totalGlassArea = 0;
  let totalFrameLength = 0;
  let totalSealingLength = 0;
  
  const cutList: CutListItem[] = [];
  const bom: BillOfMaterialsItem[] = [];

  // Main Frame
  cutList.push({ part: 'Outer Frame (Top/Bottom)', length: params.width, angle: '45° Mitre', quantity: 2, profile: params.profile, material: params.material });
  cutList.push({ part: 'Outer Frame (Left/Right)', length: params.height, angle: '45° Mitre', quantity: 2, profile: params.profile, material: params.material });
  totalFrameLength += 2 * params.width + 2 * params.height;


  if (isFixed) {
    const panelRect: Rect = {
        x: frameThickness, 
        y: frameThickness, 
        width: frame.inner.width, 
        height: frame.inner.height 
    };
    // For fixed windows, the "sash" is just the glazing bead holding the glass in the main frame.
    const glassRect: Rect = {
        x: panelRect.x + sashVertical,
        y: panelRect.y + sashHorizontal,
        width: panelRect.width - 2 * sashVertical,
        height: panelRect.height - 2 * sashHorizontal,
    };
    panels.push({ panelRect, glassRect });

    if (glassRect.width > 0 && glassRect.height > 0) {
        totalGlassArea += (glassRect.width * glassRect.height) / 1_000_000; // to m²
    }
    // Sealing for fixed glass is around the glass perimeter
    totalSealingLength += 2 * (glassRect.width + glassRect.height);

  } else if (isSliding) {
    const panelOverlap = 50;
    const availableWidth = frame.inner.width + (params.panels - 1) * panelOverlap;
    const panelWidth = Math.round(availableWidth / params.panels);
    const panelHeight = frame.inner.height;

    for (let i = 0; i < params.panels; i++) {
      const panelRect: Rect = {
        x: frameThickness + i * (panelWidth - panelOverlap),
        y: frameThickness,
        width: panelWidth,
        height: panelHeight,
      };
      const glassRect: Rect = {
        x: panelRect.x + sashVertical,
        y: panelRect.y + sashHorizontal,
        width: panelRect.width - 2 * sashVertical,
        height: panelRect.height - 2 * sashHorizontal,
      };
      panels.push({ panelRect, glassRect });

      cutList.push({ part: `Panel ${i+1} Sash (Top/Bottom)`, length: panelWidth, angle: '45° Mitre', quantity: 2, profile: params.profile, material: params.material });
      cutList.push({ part: `Panel ${i+1} Sash (Left/Right)`, length: panelHeight, angle: '45° Mitre', quantity: 2, profile: params.profile, material: params.material });
      totalFrameLength += 2 * panelWidth + 2 * panelHeight;
      totalSealingLength += 2 * (panelWidth + 2 * panelHeight); // Seal around the sash
      if (glassRect.width > 0 && glassRect.height > 0) {
        totalGlassArea += (glassRect.width * glassRect.height) / 1_000_000; // to m²
      }
    }
  } else { // Casement, Awning, Foldable, Tilt & Turn
     const panelWidth = Math.round(frame.inner.width / params.panels);
     const panelHeight = frame.inner.height;
     for (let i = 0; i < params.panels; i++) {
        const panelRect: Rect = {
            x: frameThickness + i * panelWidth,
            y: frameThickness,
            width: panelWidth,
            height: panelHeight,
        };
        const glassRect: Rect = {
            x: panelRect.x + sashVertical,
            y: panelRect.y + sashHorizontal,
            width: panelRect.width - 2 * sashVertical,
            height: panelRect.height - 2 * sashHorizontal,
        };
        panels.push({ panelRect, glassRect });
        
        cutList.push({ part: `Panel ${i+1} Sash (Top/Bottom)`, length: panelWidth, angle: '45° Mitre', quantity: 2, profile: params.profile, material: params.material });
        cutList.push({ part: `Panel ${i+1} Sash (Left/Right)`, length: panelHeight, angle: '45° Mitre', quantity: 2, profile: params.profile, material: params.material });
        totalFrameLength += 2 * panelWidth + 2 * panelHeight;
        totalSealingLength += 2 * (panelWidth + 2 * panelHeight);
        if (glassRect.width > 0 && glassRect.height > 0) {
            totalGlassArea += (glassRect.width * glassRect.height) / 1_000_000; // to m²
        }
     }
  }

  // --- Output Generation ---
  const materialName = params.material.charAt(0).toUpperCase() + params.material.slice(1);
  bom.push({ item: 'Frame Profile', description: `${materialName} Profile (${params.profile})`, quantity: parseFloat((totalFrameLength / 1000).toFixed(2)), unit: 'm' });
  bom.push({ item: 'Glass Panel', description: `${params.glass}`, quantity: parseFloat(totalGlassArea.toFixed(2)), unit: 'm²' });
  
  if (!isFixed) {
    let hardwareDescription = `${params.hardware} style`;
    if (isFoldable) {
      hardwareDescription = 'Foldable System Kit';
    } else if (isSliding) {
      hardwareDescription = 'Sliding System Kit';
    } else if (isHinged) {
      hardwareDescription = `${params.system === 'tilt-and-turn' ? 'Tilt & Turn' : 'Hinge'} Kit (${params.hardware})`;
    }
    bom.push({ item: 'Hardware Kit', description: hardwareDescription, quantity: params.panels, unit: 'sets' });
  }

  bom.push({ item: 'Weather Stripping', description: 'EPDM Seal', quantity: parseFloat((totalSealingLength / 1000).toFixed(2)), unit: 'm' });
  
  const geometry: Geometry = { frame, tracks, panels };
  const outputs: ProjectOutput = { bom, cutList };

  return { geometry, warnings, outputs };
};
