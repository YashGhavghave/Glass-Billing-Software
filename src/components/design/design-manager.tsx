
"use client";

import type { Design } from "@/lib/types";
import { Plus, Trash2, Edit, Check, Building2 } from "lucide-react";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DesignManagerProps {
    designs: Design[];
    activeDesign: Design | undefined;
    addDesign: () => void;
    removeDesign: (id: string) => void;
    selectDesign: (id: string) => void;
    updateDesignName: (id: string, name: string) => void;
}

export const DesignManager = ({ designs, activeDesign, addDesign, removeDesign, selectDesign, updateDesignName }: DesignManagerProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const handleEdit = (design: Design) => {
    setEditingId(design.id);
    setEditingName(design.name);
  };

  const handleSave = (id: string) => {
    if (editingName.trim()) {
      updateDesignName(id, editingName.trim());
    }
    setEditingId(null);
  };

  const handleCancel = () => {
    setEditingId(null);
  }

  return (
    <Card className="bg-sidebar-accent border-sidebar-border">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-sidebar-accent-foreground" />
            <CardTitle className="text-lg font-headline text-sidebar-accent-foreground">Project Windows</CardTitle>
        </div>
        <Button size="sm" variant="ghost" onClick={addDesign} className="h-7 text-sidebar-accent-foreground hover:bg-sidebar-accent-foreground/10 hover:text-sidebar-accent-foreground">
            <Plus className="mr-1 h-4 w-4" /> Add
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
            {designs.length === 0 ? (
                <p className="text-sm text-sidebar-accent-foreground/70 text-center py-2">No windows in this project.</p>
            ) : designs.map(design => (
                <div 
                    key={design.id}
                    onClick={() => editingId !== design.id && selectDesign(design.id)}
                    className={cn(
                        "flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors",
                        activeDesign?.id === design.id ? "bg-sidebar-primary" : "hover:bg-sidebar-accent-foreground/5"
                    )}
                >
                    {editingId === design.id ? (
                        <Input 
                            value={editingName} 
                            onChange={e => setEditingName(e.target.value)}
                            className="h-7 text-sm bg-card"
                            autoFocus
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleSave(design.id)
                              if (e.key === 'Escape') handleCancel()
                            }}
                            onBlur={() => handleSave(design.id)}
                            suppressHydrationWarning
                        />
                    ) : (
                        <span className={cn("text-sm font-medium", activeDesign?.id === design.id ? "text-sidebar-primary-foreground" : "text-sidebar-accent-foreground")}>{design.name}</span>
                    )}

                    <div className="flex items-center gap-1">
                        {editingId === design.id ? (
                            <>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-sidebar-primary-foreground" onMouseDown={(e) => {e.preventDefault(); handleSave(design.id)}}><Check className="h-4 w-4" /></Button>
                            </>
                        ) : (
                            <>
                                <Button variant="ghost" size="icon" className={cn("h-6 w-6 opacity-50 hover:opacity-100", activeDesign?.id === design.id ? "text-sidebar-primary-foreground" : "text-sidebar-accent-foreground")} onClick={(e) => {e.stopPropagation(); handleEdit(design)}}><Edit className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive/50 hover:text-destructive opacity-50 hover:opacity-100" onClick={(e) => {e.stopPropagation(); removeDesign(design.id)}}><Trash2 className="h-4 w-4" /></Button>
                            </>
                        )}
                    </div>
                </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
};
