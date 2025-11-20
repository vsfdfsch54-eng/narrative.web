import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-[14px] text-sm font-bold tracking-tight transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden touch-manipulation border",
  {
    variants: {
      variant: {
        default:
          "bg-white/5 text-[#f1f1f3] border-white/10 hover:bg-white/10 hover:border-white/20",
        primary:
          "bg-[#f1f1f3] text-[#0a0a0c] border-[#f1f1f3] hover:bg-[#f1f1f3]/95",
        secondary:
          "bg-white/5 text-[#f1f1f3] border-white/10 hover:bg-white/10",
        ghost:
          "text-[#f1f1f3]/65 hover:text-[#f1f1f3] hover:bg-white/5 border-transparent",
        outline:
          "border border-white/10 text-[#f1f1f3] bg-transparent hover:bg-white/5 hover:border-white/20",
      },
      size: {
        default: "h-11 px-6 py-2.5",
        sm: "h-9 px-4 text-xs rounded-[12px]",
        lg: "h-12 px-8 text-base rounded-[14px]",
        icon: "h-11 w-11 rounded-[14px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {props.children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
