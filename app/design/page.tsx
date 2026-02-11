
"use client";

import { useDesignEngine } from '@/hooks/use-design-engine';
import { AppHeader } from '@/components/layout/app-header';
import { DesignControlPanel } from '@/components/design/design-control-panel';
import { Visualization } from '@/components/design/visualization';
import { OutputPanel } from '@/components/design/output-panel';
import { CustomDesignCanvas } from '@/components/design/custom-design-canvas';
import { SidebarProvider, Sidebar, SidebarInset, SidebarContent } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Box, Eye, Wind, Maximize, Minimize } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { useDesignStore } from '@/store/use-design-store';
import { cn } from '@/lib/utils';
import { ThreeDVisualization } from '@/components/design/3d-visualization';
import { Button } from '@/components/ui/button';

export default function DesignPage() {
  // useDesignEngine hook now primarily manages effects and initialization
  useDesignEngine();

  // Select state and actions from the store
  const designs = useDesignStore(state => state.designs);
  const activeDesignId = useDesignStore(state => state.activeDesignId);
  const addDesign = useDesignStore(state => state.addDesign);
  const removeDesign = useDesignStore(state => state.removeDesign);
  const selectDesign = useDesignStore(state => state.selectDesign);
  const updateDesignName = useDesignStore(state => state.updateDesignName);
  const updateParameters = useDesignStore(state => state.updateParameters);
  const isProcessing = useDesignStore(state => state.isProcessing);
  const togglePanelOpenState = useDesignStore(state => state.togglePanelOpenState);
  const updatePanelOffsets = useDesignStore(state => state.updatePanelOffsets);
  const toggleCustomFrameOpenState = useDesignStore(state => state.toggleCustomFrameOpenState);

  const activeDesign = useMemo(() => designs.find(d => d.id === activeDesignId), [designs, activeDesignId]);
  const isCustomMode = activeDesign?.parameters.system === 'custom';

  const [fullscreenView, setFullscreenView] = useState<'2d' | '3d' | null>(null);
  const view2dRef = useRef<HTMLDivElement>(null);
  const view3dRef = useRef<HTMLDivElement>(null);

  const handleFullscreen = useCallback((view: '2d' | '3d' | null) => {
    const isCurrentlyFullscreen = !!document.fullscreenElement;

    if (isCurrentlyFullscreen) {
      document.exitFullscreen();
    }
    
    if (view && fullscreenView !== view) {
      const element = view === '2d' ? view2dRef.current : view3dRef.current;
      if (element) {
        element.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
      }
    }
  }, [fullscreenView]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setFullscreenView(null);
      } else if (document.fullscreenElement === view2dRef.current) {
        setFullscreenView('2d');
      } else if (document.fullscreenElement === view3dRef.current) {
        setFullscreenView('3d');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <SidebarProvider>
      <div className={cn("flex h-screen w-full bg-background", fullscreenView && 'bg-card')}>
        <div className={cn(fullscreenView && 'hidden')}>
          <Sidebar className="flex flex-col">
            <SidebarContent className="flex-1">
              <DesignControlPanel
                designs={designs}
                activeDesign={activeDesign}
                addDesign={addDesign}
                removeDesign={removeDesign}
                selectDesign={selectDesign}
                updateDesignName={updateDesignName}
                updateParameters={updateParameters}
              />
            </SidebarContent>
          </Sidebar>
        </div>
        <SidebarInset className={cn("flex flex-col", fullscreenView && 'p-0 m-0 rounded-none min-h-screen')}>
          <div className={cn(fullscreenView && 'hidden')}>
            <AppHeader />
          </div>
          <main className={cn("flex-1 overflow-auto p-4 md:p-6", fullscreenView && 'p-0')}>
            {activeDesign ? (
              <div className={cn("grid h-full grid-rows-[1fr_auto] gap-4", fullscreenView && 'gap-0')}>
                <div
                  className={cn(
                    "grid grid-cols-1 gap-4 lg:grid-cols-2",
                    fullscreenView && 'grid-cols-1 grid-rows-1 h-full gap-0'
                  )}
                >
                  <Card ref={view2dRef} className={cn("flex flex-col", (fullscreenView && fullscreenView !== '2d') && 'hidden', fullscreenView === '2d' && 'border-0 rounded-none shadow-none')}>
                    <CardHeader className="flex-row items-center gap-2 p-4">
                      <Eye className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-lg">
                        {isCustomMode ? '2D Designer' : '2D View'}
                      </CardTitle>
                       <Button variant="ghost" size="icon" className="ml-auto h-7 w-7" onClick={() => handleFullscreen(fullscreenView === '2d' ? null : '2d')}>
                        {fullscreenView === '2d' ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                      </Button>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-hidden p-0">
                      <div className={cn('h-full w-full', !isCustomMode && 'hidden')}>
                        <CustomDesignCanvas fullscreenContainerRef={view2dRef} />
                      </div>
                      <div className={cn('h-full w-full', isCustomMode && 'hidden')}>
                        <Visualization
                          key={activeDesign.id}
                          geometry={activeDesign.geometry}
                          isProcessing={isProcessing}
                          parameters={activeDesign.parameters}
                          panelOpenStates={activeDesign.panelOpenStates || []}
                          panelOffsets={activeDesign.panelOffsets || []}
                          togglePanelOpenState={togglePanelOpenState}
                          updatePanelOffsets={updatePanelOffsets}
                        />
                      </div>
                    </CardContent>
                  </Card>
                  <Card ref={view3dRef} className={cn("flex flex-col", (fullscreenView && fullscreenView !== '3d') && 'hidden', fullscreenView === '3d' && 'border-0 rounded-none shadow-none')}>
                    <CardHeader className="flex-row items-center gap-2 p-4">
                      <Box className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-lg">3D View</CardTitle>
                       <Button variant="ghost" size="icon" className="ml-auto h-7 w-7" onClick={() => handleFullscreen(fullscreenView === '3d' ? null : '3d')}>
                        {fullscreenView === '3d' ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                      </Button>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-hidden p-0">
                      <ThreeDVisualization
                        geometry={activeDesign.geometry}
                        parameters={activeDesign.parameters}
                        customFrames={isCustomMode ? activeDesign.frames : undefined}
                        customMullions={isCustomMode ? activeDesign.mullions : undefined}
                        panelOpenStates={activeDesign.panelOpenStates}
                        panelOffsets={activeDesign.panelOffsets}
                        togglePanelOpenState={togglePanelOpenState}
                        updatePanelOffsets={updatePanelOffsets}
                        toggleCustomFrameOpenState={toggleCustomFrameOpenState}
                      />
                    </CardContent>
                  </Card>
                </div>
                <div className={cn(fullscreenView && 'hidden')}>
                  <OutputPanel outputs={activeDesign.outputs} />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                {isProcessing ? (
                  <div className="flex flex-col items-center gap-4">
                    <Skeleton className="w-16 h-16 rounded-full" />
                    <Skeleton className="w-48 h-8" />
                    <Skeleton className="w-64 h-6" />
                  </div>
                ) : (
                  <>
                    <Wind className="w-16 h-16 mb-4" />
                    <h2 className="text-2xl font-semibold">No Designs Yet</h2>
                    <p className="mt-2">Click "Add New Window" in the sidebar to get started.</p>
                  </>
                )}
              </div>
            )}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
