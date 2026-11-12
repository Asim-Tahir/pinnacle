import { useCallback, useId, useMemo, useRef, useState } from "react";

type ConstraintValidatedElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

interface UseConstraintValidationOptions<T extends ConstraintValidatedElement> {
  getCustomValidity?: (element: T) => string;
}

export function useConstraintValidation<T extends ConstraintValidatedElement>({
  getCustomValidity,
}: UseConstraintValidationOptions<T> = {}) {
  const id = useId();
  const ref = useRef<T>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const updateCustomValidity = useCallback(
    (element: T) => {
      if (getCustomValidity) {
        element.setCustomValidity(getCustomValidity(element));
      }
    },
    [getCustomValidity],
  );

  const onInvalid = useCallback(
    (event: React.InvalidEvent<T>) => {
      const element = event.currentTarget;
      updateCustomValidity(element);
      setErrorMessage(element.validationMessage);
    },
    [updateCustomValidity],
  );

  const onInput = useCallback(
    (event: React.InputEvent<T>) => {
      const element = event.currentTarget;
      updateCustomValidity(element);
      setErrorMessage((current) => {
        if (element.validity.valid) return "";
        return current ? element.validationMessage : current;
      });
    },
    [updateCustomValidity],
  );

  const checkValidity = useCallback(() => {
    const element = ref.current;
    if (!element) return true;

    updateCustomValidity(element);
    return element.checkValidity();
  }, [updateCustomValidity]);

  const reportValidity = useCallback(() => {
    const element = ref.current;
    if (!element) return true;

    updateCustomValidity(element);
    return element.reportValidity();
  }, [updateCustomValidity]);

  const inputProps = useMemo<React.InputHTMLAttributes<T>>(
    () => ({
      ref,
      onInvalid,
      onInput,
      "aria-invalid": errorMessage ? "true" : undefined,
      "aria-describedby": errorMessage ? `${id}-error` : undefined,
    }),
    [onInput, onInvalid, errorMessage, id],
  );

  return {
    ref,
    errorMessage,
    isInvalid: Boolean(errorMessage),
    onInvalid,
    onInput,
    checkValidity,
    reportValidity,
    inputProps,
  };
}
