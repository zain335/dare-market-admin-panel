"use client";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/shadcn/ui/dropdown-menu";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import * as React from "react";

import { Button } from "@/components/shadcn/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/ui/card";
import { Input } from "@/components/shadcn/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/ui/table";
import { DareStatusFilter } from "@/constants";
import LoadingIcon from "./icons/loading";
import TablePagination from "./pagination";

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  pageSize: number;
  loadingData: boolean;
  setPageSize: React.Dispatch<React.SetStateAction<number>>;
  handleRowClick?: (row: T) => void;
  enableUserFilter?: boolean;
  userType?: string;
  enableRowClick?: boolean;
  onUserTypeChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  customFilters?: React.ReactNode[];
  title?: string;
  description?: string;
  // Cursor-based pagination props
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  onNextPage?: () => void;
  onPreviousPage?: () => void;
  // Legacy props for backward compatibility
  page?: number;
  count?: number;
  setPage?: React.Dispatch<React.SetStateAction<number>>;
}

export function DataTable<T>({
  data,
  columns,
  pageSize,
  loadingData,
  setPageSize,
  handleRowClick = (row) => {},
  enableRowClick = false,
  onUserTypeChange = (userType: string) => {},
  onSearch = (value: string) => {},
  customFilters,
  title = "",
  description = "Search and filter records",
  // Cursor-based pagination props
  hasNextPage,
  hasPreviousPage,
  onNextPage,
  onPreviousPage,
  // Legacy props for backward compatibility
  page,
  count,
  setPage,
}: DataTableProps<T>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});

  const table = useReactTable({
    data: data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    initialState: {
      pagination: {
        pageSize: 50,
      },
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,

    debugTable: true,
  });

  return (
    <Card className="w-full border-0 shadow-none px-0">
      <CardHeader className="pb-4 px-0">
        <CardTitle className="text-md font-semibold text-gray-700">
          {title}
        </CardTitle>
        <p className="text-sm text-gray-500">{description}</p>
      </CardHeader>
      <CardContent className="w-full p-0">
        <div className="flex items-center py-4">
          <div className="flex flex-row space-x-2">
            <Input
              placeholder="Filter Records [Press Enter for Deep Search]"
              onKeyDown={(event) => {
                event.key === "Enter" && onSearch(event.currentTarget.value);
              }}
              className="w-80 py-0 border border-accent-foreground/10"
            />
            {customFilters?.length &&
              customFilters.map((filter, index) => (
                <div key={index} className="flex items-center space-x-2">
                  {filter}
                </div>
              ))}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto py-0">
                Columns <ChevronDownIcon className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="rounded-md border bg-foreground-lighter/90">
          <div className="w-full">
            <Table scrollClass="h-[80vh] rounded-[5px]">
              <TableHeader className="sticky bg-foreground-light/10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow
                    key={headerGroup.id}
                    className="hover:bg-foreground-light/10"
                  >
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {loadingData && (
                  <TableRow className="absolute flex w-full items-center justify-center text-center bg-muted/50">
                    <TableCell
                      colSpan={columns.length}
                      className="h-[75vh] flex text-center items-center justify-center"
                    >
                      <div className="flex justify-center items-center">
                        <LoadingIcon
                          className="animate-spin"
                          width={50}
                          height={50}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className={`${
                        enableRowClick ? "cursor-pointer" : "cursor-default"
                      }`}
                      onClick={() =>
                        enableRowClick && handleRowClick(row.original as T)
                      }
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-[75vh] text-center pointer-events-none"
                    >
                      {loadingData ? (
                        <div className="flex justify-center items-center">
                          <LoadingIcon
                            className="animate-spin"
                            width={50}
                            height={50}
                          />
                        </div>
                      ) : (
                        "No results"
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        <TablePagination
          pageSize={pageSize}
          setPageSize={(pageSize) => {
            setPageSize(pageSize);
            table.setPageSize(pageSize);
          }}
          loading={loadingData}
          // Cursor-based pagination props
          hasNextPage={hasNextPage}
          hasPreviousPage={hasPreviousPage}
          onNextPage={onNextPage}
          onPreviousPage={onPreviousPage}
          // Legacy props for backward compatibility
          page={page}
          count={count}
          setPage={setPage}
        />
      </CardContent>
    </Card>
  );
}
