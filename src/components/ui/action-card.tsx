
'use client';

import Link from 'next/link';
import type { LinkProps } from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';

interface ActionCardProps extends LinkProps {
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

export function ActionCard({ children, className, icon, ...props }: ActionCardProps) {
  return (
    <Link {...props} className="group">
      <Card className={cn(
        "h-full border-2 border-dashed border-muted-foreground/30 bg-muted/20 hover:border-primary/80 hover:bg-muted/50 transition-all duration-200 flex items-center justify-center text-center",
        className
      )}>
        <CardContent className="p-4 flex flex-col items-center justify-center gap-2">
           <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted-foreground/10 text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary transition-colors duration-200">
                {icon || <Plus className="h-6 w-6" />}
           </div>
          <div className="font-medium text-muted-foreground group-hover:text-primary transition-colors duration-200">
            {children}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
