"use client";

import { useEffect } from 'react';
import { useDesignStore } from '@/store/use-design-store';

export const useDesignEngine = () => {
  const { 
    designs, 
    activeDesignId, 
    initialize, 
    processDesign, 
    updateDesignOutput, 
    setIsProcessing 
  } = useDesignStore(
    (state) => ({
      designs: state.designs,
      activeDesignId: state.activeDesignId,
      initialize: state.initialize,
      processDesign: state.processDesign,
      updateDesignOutput: state.updateDesignOutput,
      setIsProcessing: state.setIsProcessing,
    })
  );

  useEffect(() => {
    initialize();
  }, [initialize]);

  const activeDesign = designs.find(d => d.id === activeDesignId);

  useEffect(() => {
    if (!activeDesign) {
      if(designs.length === 0) {
        setIsProcessing(false);
      }
      return;
    };

    if (activeDesign.parameters.system === 'custom') {
        setIsProcessing(false);
        // For custom designs, outputs are calculated in the canvas component
        // and passed up. We only need to clear the parametric geometry.
        if (activeDesign.geometry !== null || activeDesign.warnings.length === 0) {
          updateDesignOutput(activeDesign.id, { 
            geometry: null, 
            warnings: ["Custom design mode is active. Use the canvas to create your design."],
            outputs: activeDesign.outputs,
          });
        }
        return;
    }

    setIsProcessing(true);
    const timer = setTimeout(() => {
      processDesign(activeDesign);
    }, 300);

    return () => clearTimeout(timer);
  }, [activeDesign, processDesign, setIsProcessing, updateDesignOutput, designs.length]);
};
