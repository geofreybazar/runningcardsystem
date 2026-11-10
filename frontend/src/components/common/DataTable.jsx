import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

/**
 * A dense table over `rows`. columns: [{ key, header, cell(row), className?, headClassName? }].
 * `onRowClick` makes rows act like links: clickable, focusable, Enter/Space to open.
 */
function DataTable({ columns, rows, rowKey = (r) => r.id, onRowClick, rowClassName, className, caption }) {
  return (
    <Table className={cn("tabular-nums", className)}>
      {caption && <caption className='sr-only'>{caption}</caption>}
      <TableHeader className='sticky top-0 z-10'>
        <TableRow className='hover:bg-transparent'>
          {columns.map((c) => (
            <TableHead key={c.key} className={c.headClassName}>
              {c.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow
            key={rowKey(row)}
            className={cn(onRowClick && "cursor-pointer focus-visible:bg-muted focus-visible:outline-none", rowClassName?.(row))}
            onClick={onRowClick && (() => onRowClick(row))}
            onKeyDown={
              onRowClick &&
              ((e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onRowClick(row);
                }
              })
            }
            tabIndex={onRowClick ? 0 : undefined}
          >
            {columns.map((c) => (
              <TableCell key={c.key} className={c.className}>
                {c.cell(row)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default DataTable;
