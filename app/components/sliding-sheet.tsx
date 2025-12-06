"use client";
import { Button } from "@/components/shadcn/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/shadcn/ui/sheet";
import { FormAction } from "@/types";
import { Dispatch, PropsWithChildren, SetStateAction } from "react";

interface SlidingSheetProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  title: string;
  description?: string;
  children: React.ReactNode;
  actions: FormAction[];
}
export const SlidingSheet: React.FC<PropsWithChildren<SlidingSheetProps>> = ({
  open,
  setOpen,
  title,
  description = "",
  children,
  actions,
}) => {
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="min-w-[900px] flex flex-col ">
        <SheetHeader className="py-2 border-b px-6">
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <div className="flex-grow px-6 max-h-screen overflow-y-auto">
          {" "}
          {children}
        </div>
        <SheetFooter className="py-2 flex flex-col border-t px-6">
          <div className="w-full flex flex-row justify-end items-center space-x-2">
            {actions.map((action) => (
              <Button
                key={action.id}
                variant={action.type === "submit" ? "primary" : "danger"}
                onClick={action.onClick}
              >
                {action.name}
              </Button>
            ))}
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
