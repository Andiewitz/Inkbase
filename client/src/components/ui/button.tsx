import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C7E86] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-[#2C7E86] text-white hover:bg-[#22666D] shadow-xs hover:shadow-md",
        secondary:
          "bg-white/90 text-slate-700 border border-white/90 hover:bg-white hover:border-slate-200 hover:text-[#2C7E86] shadow-2xs",
        ghost:
          "text-slate-600 hover:bg-[#EAF6F8] hover:text-[#2C7E86]",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 shadow-xs",
        outline:
          "border border-slate-200/80 bg-white text-slate-700 hover:bg-[#EAF6F8] hover:text-[#2C7E86] hover:border-[#CDEBF2]",
        muted:
          "bg-[#EAF6F8] text-[#2C7E86] hover:bg-[#DDF1F5]",
      },
      size: {
        default: "h-8.5 px-4 py-2 rounded-xl",
        sm: "h-7.5 px-3 py-1.5 rounded-lg",
        lg: "h-10 px-5 py-2.5 rounded-2xl",
        icon: "h-8.5 w-8.5 rounded-xl",
        "icon-sm": "h-7 w-7 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
