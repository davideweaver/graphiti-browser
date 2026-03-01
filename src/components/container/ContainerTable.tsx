import React from "react";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useIsMobile } from "@/hooks/use-mobile";

export type Column<T> = {
  header: React.ReactNode;
  accessor: keyof T;
  render?: (row: T) => React.ReactNode;
};

interface ContainerTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading: boolean;
  totalCount: number;
  page: number;
  setPage: (page: number) => void;
  itemsPerPage: number;
  onRowClick?: (row: T) => void;
}

const TableWrapper = ({
  children,
  footer,
  mobile,
}: {
  children: React.ReactNode;
  footer: React.ReactNode;
  mobile: boolean;
}) => {
  return mobile ? (
    <div className="h-full">
      <div className="overflow-auto">{children}</div>
      {footer}
    </div>
  ) : (
    <div>
      <div className="h-[calc(100svh-250px)] overflow-auto">{children}</div>
      {footer}
    </div>
  );
};

export const ContainerTable = <T extends { uuid: string }>({
  data,
  columns,
  loading,
  totalCount,
  page,
  setPage,
  itemsPerPage,
  onRowClick,
}: ContainerTableProps<T>) => {
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const isMobile = useIsMobile();

  const pagination = (
    <Pagination className="md:mx-0 justify-end md:justify-end">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => setPage(Math.max(1, page - 1))}
            className={
              page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"
            }
          />
        </PaginationItem>

        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const pageNum = i + 1;
          return (
            <PaginationItem key={pageNum}>
              <PaginationLink
                onClick={() => setPage(pageNum)}
                isActive={page === pageNum}
                className="cursor-pointer"
              >
                {pageNum}
              </PaginationLink>
            </PaginationItem>
          );
        })}

        {totalPages > 5 && <PaginationEllipsis />}

        <PaginationItem>
          <PaginationNext
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            className={
              page === totalPages
                ? "pointer-events-none opacity-50"
                : "cursor-pointer"
            }
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );

  const pageresults = (
    <div className="text-sm text-muted-foreground ml-2 font-semibold">
      <span className="whitespace-nowrap">
        {totalCount} {totalCount === 1 ? "result" : "results"}
      </span>
      {totalPages > 1 && (
        <>
          {","}
          <span className="ml-2 whitespace-nowrap">
            page {page} of {totalPages}
          </span>
        </>
      )}
    </div>
  );

  const footer = isMobile ? (
    <div className="mt-4 mb-16">
      <div className="mb-4 mr-4 text-right">{pageresults}</div>
      {totalPages > 1 && pagination}
    </div>
  ) : (
    <div className="mt-4 flex-shrink-0 flex justify-between items-center">
      {pageresults}
      {totalPages > 1 && pagination}
    </div>
  );

  return (
    <TableWrapper footer={footer} mobile={isMobile}>
      {/* using the plain table element because the ui table component adds incompatible styles */}
      <table className="w-full border-collapse">
        <TableHeader>
          <TableRow className="border-b border-border hover:bg-transparent">
            {columns.map((col) => (
              <TableHead
                key={String(col.accessor)}
                className="sticky top-0 z-10 bg-background"
              >
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center py-4">
                Loading...
              </TableCell>
            </TableRow>
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center py-4">
                No data found.
              </TableCell>
            </TableRow>
          ) : (
            data.map((row) => (
              <TableRow
                key={row.uuid}
                className="hover:bg-muted/5 cursor-pointer"
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <TableCell key={String(col.accessor)}>
                    {col.render ? col.render(row) : String(row[col.accessor])}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </table>
    </TableWrapper>
  );
};
