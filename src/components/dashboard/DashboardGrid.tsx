import React, { useState, useRef, useCallback, ReactNode } from "react";
import { GripVertical, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type TileSize = "half" | "full";

export interface DashboardTile {
  id: string;
  label: string;
  size: TileSize;
  component: ReactNode;
}

interface DashboardGridProps {
  tiles: DashboardTile[];
  order: string[];
  hiddenIds: string[];
  onReorder: (newOrder: string[]) => void;
  onHide: (id: string) => void;
  editMode: boolean;
}

export function DashboardGrid({ tiles, order, hiddenIds, onReorder, onHide, editMode }: DashboardGridProps) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const dragNode = useRef<HTMLDivElement | null>(null);

  // Sort tiles by order, filter hidden
  const visibleTiles = order
    .filter(id => !hiddenIds.includes(id))
    .map(id => tiles.find(t => t.id === id))
    .filter(Boolean) as DashboardTile[];

  const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, id: string) => {
    setDragId(id);
    dragNode.current = e.currentTarget;
    e.dataTransfer.effectAllowed = "move";
    // Make drag image semi-transparent
    requestAnimationFrame(() => {
      if (dragNode.current) dragNode.current.style.opacity = "0.4";
    });
  }, []);

  const handleDragEnd = useCallback(() => {
    if (dragNode.current) dragNode.current.style.opacity = "1";
    if (dragId && overId && dragId !== overId) {
      const currentOrder = order.filter(id => !hiddenIds.includes(id));
      const fromIdx = currentOrder.indexOf(dragId);
      const toIdx = currentOrder.indexOf(overId);
      if (fromIdx !== -1 && toIdx !== -1) {
        const newOrder = [...order];
        // Remove dragId from its position in the full order
        const fullFrom = newOrder.indexOf(dragId);
        newOrder.splice(fullFrom, 1);
        // Insert at the position of overId
        const fullTo = newOrder.indexOf(overId);
        newOrder.splice(toIdx > fromIdx ? fullTo + 1 : fullTo, 0, dragId);
        onReorder(newOrder);
      }
    }
    setDragId(null);
    setOverId(null);
  }, [dragId, overId, order, hiddenIds, onReorder]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setOverId(id);
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {visibleTiles.map(tile => {
        const isBeingDragged = dragId === tile.id;
        const isDropTarget = overId === tile.id && dragId !== tile.id;

        return (
          <div
            key={tile.id}
            className={cn(
              "relative transition-all duration-200 rounded-xl",
              tile.size === "full" && "lg:col-span-2",
              editMode && "ring-1 ring-dashed ring-border",
              isBeingDragged && "opacity-40",
              isDropTarget && "ring-2 ring-primary ring-dashed",
            )}
            draggable={editMode}
            onDragStart={(e) => handleDragStart(e, tile.id)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, tile.id)}
            onDragLeave={() => setOverId(null)}
          >
            {/* Edit mode overlay with drag handle + dismiss */}
            {editMode && (
              <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
                <div className="flex items-center gap-0.5 rounded-md bg-muted/90 backdrop-blur-sm px-1.5 py-1 cursor-grab active:cursor-grabbing">
                  <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[10px] font-medium text-muted-foreground select-none">
                    {tile.label}
                  </span>
                </div>
                <button
                  onClick={() => onHide(tile.id)}
                  className="flex items-center justify-center h-6 w-6 rounded-md bg-muted/90 backdrop-blur-sm hover:bg-destructive/10 transition-colors"
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            )}
            {tile.component}
          </div>
        );
      })}
    </div>
  );
}
