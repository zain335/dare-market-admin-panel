import { cn } from "@/lib/utils";
import React, { ChangeEvent, Dispatch, SetStateAction } from "react";
import LoadingIcon from "./icons/loading";
import PaginationDropdown from "./pagination-dropdown";
import { Input } from "./shadcn/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationNext,
  PaginationPrevious,
} from "./shadcn/ui/pagination";

interface TablePaginationProps {
  pageSize: number;
  setPageSize: Dispatch<SetStateAction<number>>;
  loading: boolean;
  // Cursor-based pagination props
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  onNextPage?: () => void;
  onPreviousPage?: () => void;
  // Legacy props for backward compatibility
  page?: number;
  setPage?: Dispatch<SetStateAction<number>>;
  count?: number;
}
const TablePagination: React.FC<TablePaginationProps> = ({
  pageSize,
  setPageSize,
  loading,
  // Cursor-based pagination props
  hasNextPage,
  hasPreviousPage,
  onNextPage,
  onPreviousPage,
  // Legacy props for backward compatibility
  page,
  setPage,
  count,
}) => {
  const InputClass =
    "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";
  
  // Use cursor-based pagination if available, otherwise fall back to legacy
  const useCursorPagination = hasNextPage !== undefined && hasPreviousPage !== undefined;
  
  let max = 1;
  if (!useCursorPagination && count && page) {
    max = Math.ceil(count / pageSize);
    max = max === 0 ? 1 : max;
  }

  const handleNext = () => {
    if (useCursorPagination) {
      onNextPage?.();
    } else if (page && setPage && page < max) {
      setPage(page + 1);
    }
  };
  
  const handleBack = () => {
    if (useCursorPagination) {
      onPreviousPage?.();
    } else if (page && setPage && page > 1) {
      setPage(page - 1);
    }
  };
  
  const handlePageChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!useCursorPagination && setPage) {
      const value = Number(event.target.value);
      if (!isNaN(value)) {
        if (value <= max && value >= 1) setPage(value);
        else if (value < 1) setPage(1);
        else setPage(max);
      }
    }
  };
  return (
    <div className="py-2">
      <Pagination className="justify-start">
        <PaginationContent className="space-x-1">
          <PaginationPrevious
            onClick={handleBack}
            size={"sm"}
            className={`border cursor-pointer ${
              (useCursorPagination ? !hasPreviousPage : page === 1) && 
              "bg-foreground/10 pointer-events-none"
            } `}
          />
          
          {!useCursorPagination && page && setPage && (
            <>
              <span className="text-sm text-foreground-light"> Page </span>
              <Input
                type="number"
                className={cn(
                  "text-sm w-12 p-1 h-8 border border-[1] focus-visible:ring-0 focus-visible:border-foreground-light",
                  InputClass
                )}
                min={1}
                max={max}
                value={page}
                onChange={handlePageChange}
              />
              <span className="text-sm text-foreground-light"> of {max} </span>
            </>
          )}
          
          {useCursorPagination && (
            <span className="text-sm text-foreground-light"> 
              Showing {pageSize} items 
            </span>
          )}
          
          <PaginationNext
            onClick={handleNext}
            size={"sm"}
            className={`border cursor-pointer ${
              (useCursorPagination ? !hasNextPage : page === max) && 
              "bg-foreground/10 pointer-events-none"
            } `}
          />
          
          <PaginationDropdown
            pageSize={pageSize}
            setPageSize={(newPageSize) => {
              setPageSize(newPageSize);
              if (!useCursorPagination && setPage) {
                setPage(1);
              }
            }}
          />

          {!useCursorPagination && count && (
            <span className="text-sm text-foreground-light">
              {" "}
              {count} records{" "}
            </span>
          )}
          
          <div>
            {loading && (
              <LoadingIcon className="animate-spin" width={20} height={20} />
            )}
          </div>
        </PaginationContent>
      </Pagination>
    </div>
  );
};

export default TablePagination;
