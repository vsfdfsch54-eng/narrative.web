import * as React from "react"
import { cn } from "@/lib/utils"
import { tokens } from "@/lib/design-tokens"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, style, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "pointer-events-auto touch-action-manipulation select-text",
          className
        )}
        ref={ref}
        style={{
          height: '44px',
          width: '100%',
          padding: `0 ${tokens.spacing[16]}`,
          borderRadius: tokens.radii.input,
          background: tokens.colors.surface1,
          color: tokens.colors.textOnPill,
          fontSize: '16px',
          fontWeight: 400,
          letterSpacing: '0',
          border: 'none',
          boxShadow: tokens.shadows.pillUnselected,
          outline: 'none',
          WebkitUserSelect: 'text',
          userSelect: 'text',
          pointerEvents: 'auto',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'rgba(255, 255, 255, 0.2)',
          position: 'relative',
          zIndex: 10,
          ...style,
        }}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }

