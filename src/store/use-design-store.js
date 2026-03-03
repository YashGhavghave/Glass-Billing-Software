import { createWithEqualityFn } from 'zustand/traditional';
import { persist } from 'zustand/middleware';
import { runDesignEngine } from '@/lib/design-engine';
import { shallow } from 'zustand/shallow';
import { indexedDBStorage } from '@/lib/indexeddb-storage';
const createNewDesign = () => {
    const id = `design_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const defaultParams = {
        system: '3-track',
        profile: 'standard',
        material: 'aluminum',
        color: 'charcoal',
        glass: 'standard',
        hardware: 'modern',
        width: 3000,
        height: 2400,
        panels: 3,
        casementOpening: 'pair',
    };
    return {
        id,
        name: `Window ${id.substring(id.length - 4)}`,
        parameters: defaultParams,
        geometry: null,
        warnings: [],
        outputs: null,
        rate: 360,
        panelOpenStates: Array(defaultParams.panels).fill(0),
        panelOffsets: Array(defaultParams.panels).fill(0),
        // Additions for custom canvas state
        frames: [],
        mullions: [],
        dimensions: [],
        textBoxes: [],
    };
};
export const useDesignStore = createWithEqualityFn()(persist((set, get) => ({
    designs: [],
    activeDesignId: null,
    isProcessing: true,
    customCanvas: {
        panOffset: { x: 0, y: 0 },
        zoom: 1,
    },
    initialize: () => {
        // Zustand's persist middleware handles rehydration.
        // This logic ensures that if the persisted state is empty, we start with a fresh design.
        setTimeout(() => {
            if (get().designs.length === 0) {
                const initialDesign = createNewDesign();
                set({ designs: [initialDesign], activeDesignId: initialDesign.id });
            }
        }, 1);
    },
    addDesign: () => {
        const newDesign = createNewDesign();
        set(state => ({ designs: [...state.designs, newDesign], activeDesignId: newDesign.id }));
    },
    removeDesign: (id) => {
        set(state => {
            const newDesigns = state.designs.filter(d => d.id !== id);
            let newActiveDesignId = state.activeDesignId;
            if (state.activeDesignId === id) {
                newActiveDesignId = newDesigns.length > 0 ? newDesigns[0].id : null;
            }
            return { designs: newDesigns, activeDesignId: newActiveDesignId };
        });
    },
    selectDesign: (id) => {
        set({ activeDesignId: id });
    },
    updateDesignName: (id, name) => {
        set(state => ({
            designs: state.designs.map(d => d.id === id ? { ...d, name } : d)
        }));
    },
    updateParameters: (newParams) => {
        set(state => {
            if (!state.activeDesignId)
                return state;
            return {
                designs: state.designs.map(d => {
                    if (d.id === state.activeDesignId) {
                        let updatedParams = { ...d.parameters, ...newParams };
                        const isFixed = updatedParams.system === 'fixed';
                        const isHinged = updatedParams.system === 'casement' || updatedParams.system === 'awning' || updatedParams.system === 'tilt-and-turn';
                        const isMultiPanel = updatedParams.system.includes('track') || updatedParams.system === 'foldable';
                        if (isFixed) {
                            updatedParams.panels = 1;
                        }
                        else if (isHinged) {
                            updatedParams.panels = Math.max(1, Math.min(4, updatedParams.panels));
                        }
                        else if (isMultiPanel) {
                            updatedParams.panels = Math.max(2, Math.min(8, updatedParams.panels));
                        }
                        else {
                            updatedParams.panels = Math.max(1, updatedParams.panels);
                        }
                        const customDataToClear = { frames: [], mullions: [], dimensions: [], textBoxes: [] };
                        const parametricDataToClear = { geometry: null, outputs: null, panelOpenStates: [], panelOffsets: [] };
                        if (d.parameters.system !== 'custom' && updatedParams.system === 'custom') {
                            return { ...d, parameters: updatedParams, ...parametricDataToClear };
                        }
                        if (d.parameters.system === 'custom' && updatedParams.system !== 'custom') {
                            return { ...d, parameters: updatedParams, ...customDataToClear };
                        }
                        return { ...d, parameters: updatedParams };
                    }
                    return d;
                })
            };
        });
    },
    setCustomDesignOutput: (id, outputs) => {
        set(state => ({
            designs: state.designs.map(d => {
                if (d.id === id) {
                    return { ...d, outputs };
                }
                return d;
            })
        }));
    },
    setCustomElements: (elements) => {
        set(state => {
            if (!state.activeDesignId)
                return state;
            return {
                designs: state.designs.map(d => {
                    if (d.id === state.activeDesignId) {
                        return {
                            ...d,
                            frames: elements.frames ?? d.frames,
                            mullions: elements.mullions ?? d.mullions,
                            dimensions: elements.dimensions ?? d.dimensions,
                            textBoxes: elements.textBoxes ?? d.textBoxes,
                        };
                    }
                    return d;
                })
            };
        });
    },
    updateDesignOutput: (id, output) => {
        set(state => ({
            designs: state.designs.map(d => d.id === id ? { ...d, ...output } : d)
        }));
    },
    setIsProcessing: (isProcessing) => set({ isProcessing }),
    processDesign: async (design) => {
        const { setIsProcessing, updateDesignOutput } = get();
        if (design.parameters.width > 0 && design.parameters.height > 0) {
            setIsProcessing(true);
            const { geometry, warnings, outputs } = await runDesignEngine(design.parameters);
            const panelCount = geometry.panels.length;
            const currentOpenStates = design.panelOpenStates || [];
            const panelOpenStates = currentOpenStates.length === panelCount
                ? currentOpenStates
                : Array(panelCount).fill(0);
            const currentOffsets = design.panelOffsets || [];
            const panelOffsets = currentOffsets.length === panelCount
                ? currentOffsets
                : Array(panelCount).fill(0);
            updateDesignOutput(design.id, { geometry, warnings, outputs, panelOpenStates, panelOffsets });
            setIsProcessing(false);
        }
    },
    setCustomCanvasView: (updater) => {
        set(state => ({
            customCanvas: updater(state.customCanvas)
        }));
    },
    togglePanelOpenState: (panelIndex) => {
        set(state => {
            if (!state.activeDesignId)
                return state;
            const activeDesign = state.designs.find(d => d.id === state.activeDesignId);
            if (!activeDesign)
                return state;
            const isFoldable = activeDesign.parameters.system === 'foldable';
            return {
                designs: state.designs.map(d => {
                    if (d.id === state.activeDesignId) {
                        const newStates = [...(d.panelOpenStates || Array(d.parameters.panels).fill(0))];
                        if (isFoldable) {
                            const pairIndex = Math.floor(panelIndex / 2);
                            const firstPanelInPairIndex = pairIndex * 2;
                            const secondPanelInPairIndex = firstPanelInPairIndex + 1;
                            const currentState = newStates[panelIndex] ?? 0;
                            const nextState = (currentState + 1) % 3;
                            newStates[firstPanelInPairIndex] = nextState;
                            if (secondPanelInPairIndex < newStates.length) {
                                newStates[secondPanelInPairIndex] = nextState;
                            }
                        }
                        else {
                            newStates[panelIndex] = ((newStates[panelIndex] || 0) + 1) % 3;
                        }
                        return { ...d, panelOpenStates: newStates };
                    }
                    return d;
                })
            };
        });
    },
    updatePanelOffsets: (offsets) => {
        set(state => {
            if (!state.activeDesignId)
                return state;
            return {
                designs: state.designs.map(d => {
                    if (d.id === state.activeDesignId) {
                        return { ...d, panelOffsets: offsets };
                    }
                    return d;
                })
            };
        });
    },
    toggleCustomFrameOpenState: (frameId) => {
        set(state => {
            if (!state.activeDesignId)
                return state;
            return {
                designs: state.designs.map(design => {
                    if (design.id === state.activeDesignId) {
                        const newFrames = design.frames?.map(frame => {
                            if (frame.id === frameId && frame.opening && frame.opening !== 'fixed') {
                                const current = frame.openState ?? 0;
                                const nextState = ((current + 1) % 3);
                                return { ...frame, openState: nextState };
                            }
                            return frame;
                        });
                        return { ...design, frames: newFrames };
                    }
                    return design;
                })
            };
        });
    },
}), {
    name: 'windoor-design-storage',
    storage: indexedDBStorage,
    partialize: (state) => ({
        designs: state.designs,
        activeDesignId: state.activeDesignId,
        customCanvas: state.customCanvas,
    }),
}), shallow);
