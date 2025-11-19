import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium tracking-tight transition-all duration-250 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/10 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:pointer-events-none disabled:opacity-40 disabled:cursor-not-allowed relative overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "bg-white/8 text-white border border-white/6 hover:bg-white/12 hover:border-white/8 hover:-translate-y-0.5",
        primary:
          "bg-white text-[#0A0D12] border border-white/20 hover:bg-white/95 hover:-translate-y-0.5",
        secondary:
          "bg-white/6 text-white border border-white/6 hover:bg-white/10 hover:border-white/8",
        ghost:
          "text-white/65 hover:text-white hover:bg-white/5 border-transparent",
        outline:
          "border border-white/6 text-white bg-transparent hover:bg-white/5 hover:border-white/8",
      },
      size: {
        default: "h-11 px-6 py-2.5",
        sm: "h-9 rounded-full px-4 text-xs",
        lg: "h-12 rounded-full px-10 text-base",
        icon: "h-11 w-11 rounded-full",
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
