import { Skeleton } from "@/components/ui/skeleton";
import { TableRow, TableCell } from "@/components/ui/table";

interface TableSkeletonProps {
  columnCount: number;
  rowCount?: number;
}

export function TableSkeleton({
  columnCount,
  rowCount = 8,
}: TableSkeletonProps) {
  return (
    <>
      {Array.from({ length: rowCount }).map((_, i) => (
        <TableRow
          key={i}
          className="hover:bg-transparent border-b border-zinc-100"
        >
          {Array.from({ length: columnCount }).map((_, j) => (
            <TableCell key={j} className="py-4 px-4">
              <Skeleton className="h-5 w-full bg-zinc-100 rounded-lg" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}
