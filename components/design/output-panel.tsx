
"use client";

import type { ProjectOutput } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileText, Scissors, Info } from "lucide-react";

interface OutputPanelProps {
  outputs: ProjectOutput | null;
}

export function OutputPanel({ outputs }: OutputPanelProps) {
  if (!outputs || (outputs.bom.length === 0 && outputs.cutList.length === 0)) {
    return (
        <Card>
            <CardHeader className="flex-row items-center gap-4 space-y-0">
                <FileText className="h-6 w-6 text-muted-foreground" />
                <CardTitle>Production Outputs</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                    <Info className="w-8 h-8 mb-2" />
                    <p className="font-medium">No outputs generated yet.</p>
                    <p className="text-sm">Complete a design to see the Bill of Materials and Cut List here.</p>
                </div>
            </CardContent>
        </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card>
            <CardHeader className="flex-row items-center gap-4 space-y-0">
                <FileText className="h-6 w-6" />
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
                        {outputs.bom.map((item, index) => (
                        <TableRow key={index}>
                            <TableCell className="font-medium">{item.item}</TableCell>
                            <TableCell>{item.description}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell>{item.unit}</TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex-row items-center gap-4 space-y-0">
                <Scissors className="h-6 w-6" />
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
                        {outputs.cutList.map((item, index) => (
                        <TableRow key={index}>
                            <TableCell className="font-medium">{item.part}</TableCell>
                            <TableCell>{item.profile}</TableCell>
                            <TableCell className="text-right">{item.length}</TableCell>
                            <TableCell>{item.angle}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  );
}
