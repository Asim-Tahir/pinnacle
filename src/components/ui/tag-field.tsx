import { cx } from "cva";
import { TagIcon } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tag, TagGroup, TagList } from "@/components/ui/tag-group";

export interface TagInputProps extends Omit<
  React.ComponentProps<typeof Input>,
  "defaultValue" | "name" | "onChange" | "value"
> {
  value?: string[];
  onChange?: (next: string[]) => void;
  defaultValue?: string[];
  splitPattern?: RegExp;
  className?: string;
  inputClassName?: string;
  inputValue?: string;
  onInputValueChange?: (value: string) => void;
  isRequired?: boolean;
  requiredMessage?: string;
  name?: string;
  label?: React.ReactNode;
}

export function TagField({
  value,
  onChange,
  defaultValue = [],
  splitPattern = /[,;]/,
  className,
  inputClassName,
  inputValue: controlledInput,
  onInputValueChange,
  isRequired,
  requiredMessage,
  name = "tags",
  label,
  id,
  disabled,
  readOnly,
  onBlur,
  onKeyDown,
  ...inputProps
}: TagInputProps) {
  const [internalTags, setInternalTags] = useState(defaultValue);
  const [uncontrolledInput, setUncontrolledInput] = useState("");
  const [touched, setTouched] = useState(false);
  const generatedId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const tags = value ?? internalTags;
  const inputValue = controlledInput ?? uncontrolledInput;
  const setInputValue = onInputValueChange ?? setUncontrolledInput;
  const inputId = id ?? generatedId;
  const isInvalid = Boolean(isRequired && tags.length === 0 && touched);
  const errorText = requiredMessage ?? "At least one item is required";
  const isDisabled = Boolean(disabled || readOnly);

  useEffect(() => {
    const input = inputRef.current;
    const form = input?.form;
    if (!form || !input) return;

    const onSubmit = (event: Event) => {
      if (isRequired && tags.length === 0) {
        event.preventDefault();
        setTouched(true);
        input.setCustomValidity(errorText);
        form.reportValidity();
      } else {
        input.setCustomValidity("");
      }
    };

    form.addEventListener("submit", onSubmit);
    return () => form.removeEventListener("submit", onSubmit);
  }, [isRequired, tags.length, errorText]);

  function addTag() {
    const next = new Set(tags);
    inputValue.split(splitPattern).forEach((raw) => {
      const formatted = raw
        .trim()
        .replace(/\s\s+/g, " ")
        .replace(/\t|\\t|\r|\\r|\n|\\n/g, "");
      if (!formatted) return;
      const exists = Array.from(next).some(
        (tag) => tag.toLocaleLowerCase() === formatted.toLocaleLowerCase(),
      );
      if (!exists) next.add(formatted);
    });

    (onChange ?? setInternalTags)(Array.from(next));
    setInputValue("");
    setTouched(true);
    inputRef.current?.setCustomValidity("");
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented || isDisabled) return;

    if (event.key === "Enter" || event.key === "," || event.key === ";") {
      event.preventDefault();
      addTag();
    }
  }

  function handleBlur(event: React.FocusEvent<HTMLInputElement>) {
    onBlur?.(event);
    setTouched(true);
  }

  function handleTagsChange(next: string[]) {
    (onChange ?? setInternalTags)(next);
    setTouched(true);
  }

  return (
    <div data-slot="tag-field" className={cx("flex flex-col gap-y-1", className)}>
      {label && <Label htmlFor={inputId}>{label}</Label>}
      <Input
        {...inputProps}
        ref={inputRef}
        id={inputId}
        value={inputValue}
        onChange={(event) => setInputValue(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        disabled={disabled}
        readOnly={readOnly}
        aria-required={isRequired || undefined}
        aria-invalid={isInvalid || undefined}
        aria-describedby={isInvalid ? `${inputId}-error` : inputProps["aria-describedby"]}
        className={inputClassName}
      />
      {isInvalid && (
        <span
          id={`${inputId}-error`}
          role="alert"
          className="text-danger-subtle-foreground text-sm/6"
        >
          {errorText}
        </span>
      )}
      {tags.length > 0 && (
        <TagGroup
          value={tags}
          onValueChange={handleTagsChange}
          disabled={isDisabled}
          className="mt-1"
          aria-label="Selected tags"
        >
          <TagList>
            {tags.map((tag) => (
              <Tag key={tag} value={tag}>
                <TagIcon size={12} />
                {tag}
              </Tag>
            ))}
          </TagList>
        </TagGroup>
      )}
      <input type="hidden" name={name} value={tags.join(",")} />
    </div>
  );
}
