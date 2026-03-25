import { MoreHorizontal, UserCircle, Archive, Trash2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";

interface WorkArea {
  id: string;
  name: string;
  responsible_person?: string | null;
}

interface AssetRowActionMenuProps {
  itemId: string;
  currentWorkAreaId?: string | null;
  isArchived?: boolean;
  workAreas: WorkArea[];
  onSetOwner: (itemId: string, workAreaId: string) => void;
  onArchive: (itemId: string) => void;
  onRestore?: (itemId: string) => void;
  onDelete: (itemId: string) => void;
}

export function AssetRowActionMenu({
  itemId,
  currentWorkAreaId,
  isArchived = false,
  workAreas,
  onSetOwner,
  onArchive,
  onRestore,
  onDelete,
}: AssetRowActionMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <UserCircle className="h-4 w-4 mr-2" />
            Sett eier
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {workAreas.length === 0 ? (
              <DropdownMenuItem disabled>Ingen arbeidsområder</DropdownMenuItem>
            ) : (
              workAreas.map((area) => (
                <DropdownMenuItem
                  key={area.id}
                  onClick={() => onSetOwner(itemId, area.id)}
                >
                  {area.name}
                  {currentWorkAreaId === area.id && (
                    <span className="ml-auto text-xs">✓</span>
                  )}
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        {isArchived && onRestore ? (
          <DropdownMenuItem onClick={() => onRestore(itemId)}>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Gjenopprett
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => onArchive(itemId)}>
            <Archive className="h-4 w-4 mr-2" />
            Arkiver
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={() => onDelete(itemId)}
          className="text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Slett
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
