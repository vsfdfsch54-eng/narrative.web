import * as React from "react"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon
  title: string
  description?: string
  indicator?: React.ReactNode
}

export function SectionHeader({
  icon: Icon,
  title,
  description,
  indicator,
  className,
  ...props
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between pb-4 border-b border-white/8",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="p-2 rounded-xl bg-white/5 border border-white/6">
            <Icon className="h-4 w-4 text-white/70" />
          </div>
        )}
        <div>
          <h2 className="text-lg font-medium text-white tracking-tight leading-tight">
            {title}
          </h2>
          {description && (
            <p className="text-xs text-white/55 font-normal tracking-wide mt-0.5">
              {description}
            </p>
          )}
        </div>
      </div>
      {indicator}
    </div>
  )
}
