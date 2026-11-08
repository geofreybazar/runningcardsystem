import { KeyRound, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

function Actions({ onEdit, onReset, onRemove }) {
  const item = (label, onClick, Icon, destructive) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          className={`size-8 ${destructive ? "text-destructive hover:text-destructive" : ""}`}
          onClick={onClick}
          aria-label={label}
        >
          <Icon />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
  return (
    <div className='flex justify-end'>
      {item("Edit", onEdit, Pencil)}
      {item("Reset password", onReset, KeyRound)}
      {item("Remove", onRemove, Trash2, true)}
    </div>
  );
}

export default Actions;
