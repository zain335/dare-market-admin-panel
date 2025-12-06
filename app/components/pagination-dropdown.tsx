import React, { Dispatch, SetStateAction } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./shadcn/ui/dropdown-menu";
import { Button } from "./shadcn/ui/button";

interface PaginationDropdownProps {
  pageSize: number;
  setPageSize: Dispatch<SetStateAction<number>>;
}

const PaginationDropdown: React.FC<PaginationDropdownProps> = ({
  pageSize,
  setPageSize,
}) => {
  return (
    <div>
      {" "}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size={"sm"}
            className="border border-accent-foreground/10"
          >
            {pageSize} rows
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 text-sm py-0">
          <DropdownMenuRadioGroup
            value={`${pageSize}`}
            onValueChange={(val) => {
              setPageSize(parseInt(val) || 0);
            }}
          >
            <DropdownMenuRadioItem value={`25`} className="cursor-pointer">
              25 rows
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value={`50`} className="cursor-pointer">
              50 rows
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value={`100`} className="cursor-pointer">
              100 rows
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value={`500`} className="cursor-pointer">
              500 rows
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value={`1000`} className="cursor-pointer">
              1000 rows
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default PaginationDropdown;
