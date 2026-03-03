"use client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, } from "@/components/ui/card";
import { FileText, Scissors, Info } from "lucide-react";
export function OutputPanel({ outputs }) {
    const hasBom = !!outputs?.bom?.length;
    const hasCutList = !!outputs?.cutList?.length;
    const hasPanelOutlines = !!outputs?.panelOutlines?.length;
    const hasSummary = !!outputs?.materialSummary;
    if (!outputs || (!hasBom && !hasCutList && !hasPanelOutlines && !hasSummary)) {
        return (<Card>
            <CardHeader className="flex-row items-center gap-4 space-y-0">
                <FileText className="h-6 w-6 text-muted-foreground"/>
                <CardTitle>Production Outputs</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                    <Info className="w-8 h-8 mb-2"/>
                    <p className="font-medium">No outputs generated yet.</p>
                    <p className="text-sm">Complete a design to see the Bill of Materials and Cut List here.</p>
                </div>
            </CardContent>
        </Card>);
    }
    return (<div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card>
            <CardHeader className="flex-row items-center gap-4 space-y-0">
                <FileText className="h-6 w-6"/>
                <CardTitle>Bill of Materials</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead>Unit</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {(outputs.bom || []).map((item, index) => (<TableRow key={index}>
                            <TableCell className="font-medium">{item.item}</TableCell>
                            <TableCell>{item.description}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell>{item.unit}</TableCell>
                        </TableRow>))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex-row items-center gap-4 space-y-0">
                <Scissors className="h-6 w-6"/>
                <CardTitle>Cut List</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Part</TableHead>
                        <TableHead>Profile</TableHead>
                        <TableHead className="text-right">Length (mm)</TableHead>
                        <TableHead>Angle</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {(outputs.cutList || []).map((item, index) => (<TableRow key={index}>
                            <TableCell className="font-medium">{item.part}</TableCell>
                            <TableCell>{item.profile}</TableCell>
                            <TableCell className="text-right">{item.length}</TableCell>
                            <TableCell>{item.angle}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                        </TableRow>))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

        <Card>
            <CardHeader className="flex-row items-center gap-4 space-y-0">
                <FileText className="h-6 w-6"/>
                <CardTitle>Window & Glass Outlines</CardTitle>
            </CardHeader>
            <CardContent>
                {hasPanelOutlines ? (<Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Panel</TableHead>
                                <TableHead className="text-right">Sash (W×H mm)</TableHead>
                                <TableHead className="text-right">Glass (W×H mm)</TableHead>
                                <TableHead className="text-right">Glass Area (m²)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {outputs.panelOutlines.map((outline, index) => (<TableRow key={index}>
                                    <TableCell className="font-medium">{outline.panel}</TableCell>
                                    <TableCell className="text-right">{outline.sashWidth} × {outline.sashHeight}</TableCell>
                                    <TableCell className="text-right">{outline.glassWidth} × {outline.glassHeight}</TableCell>
                                    <TableCell className="text-right">{outline.glassArea}</TableCell>
                                </TableRow>))}
                        </TableBody>
                    </Table>) : (<p className="text-sm text-muted-foreground">No panel outlines available for this design mode.</p>)}
            </CardContent>
        </Card>

        <Card className="lg:col-span-2">
            <CardHeader className="flex-row items-center gap-4 space-y-0">
                <Info className="h-6 w-6"/>
                <CardTitle>Material Summary</CardTitle>
            </CardHeader>
            <CardContent>
                {hasSummary ? (<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                        <div className="border rounded-md p-3"><span className="text-muted-foreground block">System</span><span className="font-medium">{outputs.materialSummary.system}</span></div>
                        <div className="border rounded-md p-3"><span className="text-muted-foreground block">Panels</span><span className="font-medium">{outputs.materialSummary.panelCount}</span></div>
                        <div className="border rounded-md p-3"><span className="text-muted-foreground block">Frame Profile</span><span className="font-medium">{outputs.materialSummary.material} / {outputs.materialSummary.profile}</span></div>
                        <div className="border rounded-md p-3"><span className="text-muted-foreground block">Glass Type</span><span className="font-medium">{outputs.materialSummary.glass}</span></div>
                        <div className="border rounded-md p-3"><span className="text-muted-foreground block">Total Frame Length</span><span className="font-medium">{outputs.materialSummary.frameLengthM} m</span></div>
                        <div className="border rounded-md p-3"><span className="text-muted-foreground block">Total Glass Area</span><span className="font-medium">{outputs.materialSummary.glassAreaM2} m²</span></div>
                        <div className="border rounded-md p-3"><span className="text-muted-foreground block">Weather Seal</span><span className="font-medium">{outputs.materialSummary.weatherSealM} m</span></div>
                    </div>) : (<p className="text-sm text-muted-foreground">Material summary is not available yet for this design.</p>)}
            </CardContent>
        </Card>
    </div>);
}
