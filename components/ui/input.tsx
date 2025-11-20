import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-input bg-card/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 backdrop-blur-sm",
          "pointer-events-auto touch-action-manipulation",
          "select-text",
          className
        )}
        ref={ref}
        style={{
          WebkitUserSelect: 'text',
          userSelect: 'text',
          pointerEvents: 'auto',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'rgba(255, 255, 255, 0.2)',
          position: 'relative',
          zIndex: 10,
        }}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }

