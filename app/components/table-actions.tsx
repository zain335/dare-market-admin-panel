import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/shadcn/ui/dropdown-menu";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { Button } from "./shadcn/ui/button";
import { TableAction } from "@/types";

interface TableActionsProps {
  actions: TableAction[];
}
const TableActions: React.FC<TableActionsProps> = ({ actions }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <DotsHorizontalIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {/* <DropdownMenuLabel>Actions</DropdownMenuLabel> */}
        {actions &&
          actions.map((action, index) =>
            action.id === "separator" ? (
              <DropdownMenuSeparator key={index} />
            ) : (
              <DropdownMenuItem
                key={index}
                onClick={action.onClick}
                className=""
              >
                {action.name}
              </DropdownMenuItem>
            )
          )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TableActions;
