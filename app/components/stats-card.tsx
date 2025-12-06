"use client";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/shadcn/ui/card";
import React from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  compact?: boolean;
  small?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, compact, small }) => (
  <Card className="border-0 shadow-sm">
    <CardHeader 
      className={`flex flex-row items-center justify-between space-y-0 ${
        compact ? 'pb-1' : 'pb-2'
      } ${small ? 'p-3' : ''}`}
    >
      <CardTitle 
        className={`font-medium text-gray-600 ${
          small ? 'text-xs' : 'text-sm'
        }`}
      >
        {title}
      </CardTitle>
      <div className="text-gray-400">{icon}</div>
    </CardHeader>
    <CardContent className={small ? 'p-3 pt-0' : ''}>
      <div 
        className={`font-bold text-gray-900 ${
          small ? 'text-lg' : 'text-2xl'
        }`}
      >
        {value}
      </div>
    </CardContent>
  </Card>
);
export default StatsCard;
