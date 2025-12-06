"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/shadcn/ui/dropdown-menu";
import { Button } from "@/components/shadcn/ui/button";
import { CalendarIcon, ChevronDownIcon } from "lucide-react";

interface MonthPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export default function MonthPicker({ value, onChange }: MonthPickerProps) {
  // Generate last 12 months
  const generateMonths = () => {
    const months = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const monthYear = `${year}-${month}`;
      const monthName = date.toLocaleDateString("en-US", { 
        year: "numeric", 
        month: "long" 
      });
      
      months.push({ value: monthYear, label: monthName });
    }
    
    return months;
  };

  const months = generateMonths();

  const currentMonth = months.find(m => m.value === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-[200px] justify-between">
          <CalendarIcon className="mr-2 h-4 w-4" />
          {currentMonth?.label || "Select month"}
          <ChevronDownIcon className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {months.map((month) => (
          <DropdownMenuItem
            key={month.value}
            onClick={() => onChange(month.value)}
            className="cursor-pointer"
          >
            {month.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 