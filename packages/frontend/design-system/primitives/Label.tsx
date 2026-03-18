import { forwardRef } from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cn } from '../utils/cn';

type LabelProps = React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>;

const Label = forwardRef<
  React.ComponentRef<typeof LabelPrimitive.Root>,
  LabelProps
>(({ className, ...props }, ref) => {
  return (
    <LabelPrimitive.Root
      ref={ref}
      className={cn(
        'text-sm font-[var(--font-weight-medium)] leading-[var(--line-height-normal)] text-[var(--color-text-primary)] peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className,
      )}
      {...props}
    />
  );
});
Label.displayName = 'Label';

export { Label, type LabelProps };
