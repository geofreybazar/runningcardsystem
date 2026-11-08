import { BellOff } from "lucide-react";
import { Card } from "@/components/ui/card";

/** A list with nothing in it yet. */
const Empty = ({ children }) => (
  <Card className='items-center gap-2 py-8 text-center text-sm text-muted-foreground'>
    <BellOff className='size-5' />
    {children}
  </Card>
);

export default Empty;
