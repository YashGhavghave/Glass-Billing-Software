
"use client";

import type { Design, DesignParameters, SystemType, ProfileType, FrameColor, GlassType, HardwareStyle, MaterialType, CasementOpeningDirection } from "@/lib/types";
import { AlertTriangle, SlidersHorizontal, Frame, Paintbrush, Ruler, PenTool } from "lucide-react";
import { DesignManager } from "@/components/design/design-manager";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

interface DesignControlPanelProps {
  designs: Design[];
  activeDesign: Design | undefined;
  addDesign: () => void;
  removeDesign: (id: string) => void;
  selectDesign: (id: string) => void;
  updateDesignName: (id: string, name: string) => void;
  updateParameters: (newParams: Partial<DesignParameters>) => void;
}

export function DesignControlPanel({ designs, activeDesign, addDesign, removeDesign, selectDesign, updateDesignName, updateParameters }: DesignControlPanelProps) {
  
  const parameters = activeDesign?.parameters;
  const warnings = activeDesign?.warnings ?? [];

  if (!parameters) {
      return (
          <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground p-4 gap-6 overflow-y-auto">
                <h2 className="font-headline text-2xl font-semibold text-sidebar-foreground tracking-tight">
                    Design Controls
                </h2>
                <DesignManager 
                    designs={designs}
                    activeDesign={activeDesign}
                    addDesign={addDesign}
                    removeDesign={removeDesign}
                    selectDesign={selectDesign}
                    updateDesignName={updateDesignName}
                />
          </div>
      )
  }
  
  const isFixed = parameters.system === 'fixed';
  const isHinged = parameters.system === 'casement' || parameters.system === 'awning' || parameters.system === 'tilt-and-turn';
  const isMultiPanel = parameters.system.includes('track') || parameters.system === 'foldable';
  const isCustom = parameters.system === 'custom';

  let panelMin = 1, panelMax = 1;
  if (isHinged) {
    panelMin = 1;
    panelMax = 4;
  } else if (isMultiPanel) {
    panelMin = 2;
    panelMax = 8;
  }

  return (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground p-4 gap-6 overflow-y-auto">
      <h2 className="font-headline text-2xl font-semibold text-sidebar-foreground tracking-tight">
        Design Controls
      </h2>

      <DesignManager 
        designs={designs}
        activeDesign={activeDesign}
        addDesign={addDesign}
        removeDesign={removeDesign}
        selectDesign={selectDesign}
        updateDesignName={updateDesignName}
      />

      <Separator className="bg-sidebar-border" />
      
      <Card className="bg-sidebar-accent border-sidebar-border">
        <CardHeader className="flex-row items-center gap-2 space-y-0 pb-4">
            {isCustom ? <PenTool className="h-5 w-5 text-sidebar-accent-foreground" /> : <SlidersHorizontal className="h-5 w-5 text-sidebar-accent-foreground" />}
            <CardTitle className="text-lg font-headline text-sidebar-accent-foreground">System Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sidebar-foreground/80">
        <div className="grid gap-2">
            <Label htmlFor="system">System</Label>
            <Select
              value={parameters.system}
              onValueChange={(value: SystemType) => updateParameters({ system: value })}
            >
              <SelectTrigger id="system" className="bg-sidebar-primary text-sidebar-primary-foreground border-sidebar-border" suppressHydrationWarning>
                <SelectValue placeholder="Select system" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2-track">2-Track Sliding</SelectItem>
                <SelectItem value="3-track">3-Track Sliding</SelectItem>
                <SelectItem value="4-track">4-Track Sliding</SelectItem>
                <SelectItem value="5-track">5-Track Sliding</SelectItem>
                <SelectItem value="casement">Casement</SelectItem>
                <SelectItem value="awning">Awning</SelectItem>
                <SelectItem value="tilt-and-turn">Tilt & Turn</SelectItem>
                <SelectItem value="fixed">Fixed</SelectItem>
                <SelectItem value="foldable">Foldable</SelectItem>
                <SelectItem value="custom">Custom Designer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {!isCustom && (
            <>
                {parameters.system === 'casement' && (
                    <div className="grid gap-2">
                    <Label htmlFor="opening-direction">Hinge Side</Label>
                    <Select
                        value={parameters.casementOpening || 'pair'}
                        onValueChange={(value: CasementOpeningDirection) => updateParameters({ casementOpening: value })}
                    >
                        <SelectTrigger id="opening-direction" className="bg-sidebar-primary text-sidebar-primary-foreground border-sidebar-border" suppressHydrationWarning>
                        <SelectValue placeholder="Select hinge side" />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                        <SelectItem value="pair">Alternating Pair</SelectItem>
                        </SelectContent>
                    </Select>
                    </div>
                )}
                <div className="grid gap-2">
                    <Label>Panels: {parameters.panels}</Label>
                    <Slider
                    id="panels"
                    min={panelMin}
                    max={panelMax}
                    step={1}
                    value={[parameters.panels]}
                    onValueChange={(value) => updateParameters({ panels: value[0] })}
                    disabled={isFixed}
                    />
                </div>
            </>
          )}
          {isCustom && (
            <p className="text-sm text-sidebar-accent-foreground/80 pt-2">
                The custom design toolkit is available on the main canvas. Use it to draw your window freely.
            </p>
          )}
        </CardContent>
      </Card>
      
      {!isCustom && (
        <>
            <Separator className="bg-sidebar-border" />

            <Card className="bg-sidebar-accent border-sidebar-border">
                <CardHeader className="flex-row items-center gap-2 space-y-0 pb-4">
                <Ruler className="h-5 w-5 text-sidebar-accent-foreground" />
                <CardTitle className="text-lg font-headline text-sidebar-accent-foreground">Dimensions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sidebar-foreground/80">
                <div className="grid gap-2">
                    <Label htmlFor="width">Width (mm)</Label>
                    <Input
                    id="width"
                    type="number"
                    value={parameters.width}
                    onChange={(e) => updateParameters({ width: parseInt(e.target.value, 10) || 0 })}
                    className="bg-sidebar-primary text-sidebar-primary-foreground border-sidebar-border"
                    suppressHydrationWarning
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="height">Height (mm)</Label>
                    <Input
                    id="height"
                    type="number"
                    value={parameters.height}
                    onChange={(e) => updateParameters({ height: parseInt(e.target.value, 10) || 0 })}
                    className="bg-sidebar-primary text-sidebar-primary-foreground border-sidebar-border"
                    suppressHydrationWarning
                    />
                </div>
                </CardContent>
            </Card>
            
            <Separator className="bg-sidebar-border" />

            <Card className="bg-sidebar-accent border-sidebar-border">
                <CardHeader className="flex-row items-center gap-2 space-y-0 pb-4">
                <Frame className="h-5 w-5 text-sidebar-accent-foreground" />
                <CardTitle className="text-lg font-headline text-sidebar-accent-foreground">Frame & Materials</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sidebar-foreground/80">
                    <div className="grid gap-2">
                        <Label htmlFor="material">Material</Label>
                        <Select
                            value={parameters.material}
                            onValueChange={(value: MaterialType) => updateParameters({ material: value })}
                        >
                            <SelectTrigger id="material" className="bg-sidebar-primary text-sidebar-primary-foreground border-sidebar-border" suppressHydrationWarning>
                                <SelectValue placeholder="Select material" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="upvc">uPVC</SelectItem>
                                <SelectItem value="aluminum">Aluminum</SelectItem>
                                <SelectItem value="wood">Wood</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="profile">Profile</Label>
                        <Select
                            value={parameters.profile}
                            onValueChange={(value: ProfileType) => updateParameters({ profile: value })}
                        >
                            <SelectTrigger id="profile" className="bg-sidebar-primary text-sidebar-primary-foreground border-sidebar-border" suppressHydrationWarning>
                                <SelectValue placeholder="Select profile" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="standard">Standard</SelectItem>
                                <SelectItem value="slim">Slim</SelectItem>
                                <SelectItem value="heavy-duty">Heavy Duty</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="glass">Glass / Infill</Label>
                        <Select
                        value={parameters.glass}
                        onValueChange={(value: GlassType) => updateParameters({ glass: value })}
                        >
                        <SelectTrigger id="glass" className="bg-sidebar-primary text-sidebar-primary-foreground border-sidebar-border" suppressHydrationWarning>
                            <SelectValue placeholder="Select glass type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="standard">Standard Glass</SelectItem>
                            <SelectItem value="toughened">Toughened Glass</SelectItem>
                            <SelectItem value="laminated">Laminated Glass</SelectItem>
                            <SelectItem value="double-glazed">Double Glazed</SelectItem>
                            <SelectItem value="mesh">Security Mesh</SelectItem>
                        </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <Separator className="bg-sidebar-border" />

            <Card className="bg-sidebar-accent border-sidebar-border">
                    <CardHeader className="flex-row items-center gap-2 space-y-0 pb-4">
                        <Paintbrush className="h-5 w-5 text-sidebar-accent-foreground" />
                        <CardTitle className="text-lg font-headline text-sidebar-accent-foreground">Finish & Hardware</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sidebar-foreground/80">
                        <div className="grid gap-2">
                            <Label htmlFor="color">Frame Color</Label>
                            <Select
                                value={parameters.color}
                                onValueChange={(value: FrameColor) => updateParameters({ color: value })}
                            >
                                <SelectTrigger id="color" className="bg-sidebar-primary text-sidebar-primary-foreground border-sidebar-border" suppressHydrationWarning>
                                    <SelectValue placeholder="Select color" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="white">White</SelectItem>
                                    <SelectItem value="charcoal">Charcoal</SelectItem>
                                    <SelectItem value="bronze">Bronze</SelectItem>
                                    <SelectItem value="silver">Silver</SelectItem>
                                    <SelectItem value="wood-effect">Wood Effect</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="hardware">Hardware Style</Label>
                            <Select
                                value={parameters.hardware}
                                onValueChange={(value: HardwareStyle) => updateParameters({ hardware: value })}
                            >
                                <SelectTrigger id="hardware" className="bg-sidebar-primary text-sidebar-primary-foreground border-sidebar-border" suppressHydrationWarning>
                                    <SelectValue placeholder="Select hardware" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="modern">Modern</SelectItem>
                                    <SelectItem value="classic">Classic</SelectItem>
                                    <SelectItem value="minimalist">Minimalist</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>
        </>
      )}


      {warnings.length > 0 && (
        <Alert variant="destructive" className="mt-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="font-headline">Validation Warnings</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-5">
              {warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
