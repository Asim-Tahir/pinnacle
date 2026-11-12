import { cx } from "cva";
import { XIcon } from "lucide-react";
import { ToggleGroup } from "radix-ui";

export type TagGroupProps = Omit<
  React.ComponentProps<typeof ToggleGroup.Root>,
  "type" | "value" | "defaultValue" | "onValueChange"
> & {
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
};

export function TagGroup({ className, ...props }: TagGroupProps) {
  return (
    <ToggleGroup.Root
      type="multiple"
      data-slot="tag-group"
      className={cx("flex flex-col gap-y-1", className)}
      {...props}
    />
  );
}

export function TagList({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cx("flex flex-wrap gap-1", className)} {...props} />;
}

export function Tag({
  children,
  className,
  ...props
}: React.ComponentProps<typeof ToggleGroup.Item>) {
  return (
    <ToggleGroup.Item
      type="button"
      data-slot="tag"
      className={cx(
        "inline-flex items-center gap-x-1.5",
        "rounded-full px-2 py-0.5",
        "text-xs/5 font-medium",
        "cursor-pointer outline-hidden",
        "inset-ring inset-ring-input hover:bg-[var(--chip)]",
        "focus-visible:ring-3 focus-visible:ring-ring/50",
        "data-[state=on]:inset-ring-ring/70 data-[state=on]:bg-primary-subtle",
        "data-[state=on]:text-primary-subtle-foreground",
        "data-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
      <XIcon aria-hidden="true" className="size-3 shrink-0" />
    </ToggleGroup.Item>
  );
}
