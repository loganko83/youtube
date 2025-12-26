'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@tubegenius/ui';
import { LucideIcon } from 'lucide-react';
import { cn } from '@tubegenius/ui';

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  className?: string;
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
}: StatsCardProps) {
  const isPositiveTrend = trend && trend.value > 0;
  const isNegativeTrend = trend && trend.value < 0;

  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        <Icon className="w-5 h-5 text-tube-600" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
        {trend && (
          <div className="flex items-center mt-2 text-xs">
            <span
              className={cn(
                'font-medium',
                isPositiveTrend && 'text-green-600',
                isNegativeTrend && 'text-red-600',
                !isPositiveTrend && !isNegativeTrend && 'text-gray-600'
              )}
            >
              {isPositiveTrend && '+'}
              {trend.value}%
            </span>
            <span className="text-gray-500 ml-1">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
