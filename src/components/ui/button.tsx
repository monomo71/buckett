import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-[var(--accent)] text-white hover:brightness-110',
        secondary: 'bg-[var(--panel-muted)] text-[var(--text-main)] hover:brightness-105',
        outline: 'border border-[var(--border-color)] bg-[var(--panel-bg)] text-[var(--text-main)] hover:bg-[var(--panel-muted)]',
        destructive: 'bg-rose-500/15 text-rose-600 hover:bg-rose-500/25',
        ghost: 'bg-transparent text-[var(--text-soft)] hover:bg-[var(--accent-soft)]',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-lg px-2.5',
        icon: 'h-8 w-8 rounded-lg p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />
}

export { Button, buttonVariants }
