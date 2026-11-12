import { useState } from "react";
import { expect, test } from "vitest";
import { page } from "vitest/browser";

import { useConstraintValidation } from "./useConstraintValidation";

function ValidationForm() {
  const { inputProps, ...validation } = useConstraintValidation<HTMLInputElement>({
    getCustomValidity: (input) =>
      input.validity.patternMismatch ? "Use lowercase letters only." : "",
  });
  const [checkResult, setCheckResult] = useState("not checked");
  const [reportResult, setReportResult] = useState("not reported");

  return (
    <form onSubmit={(event) => event.preventDefault()}>
      <label>
        Value
        <input required pattern="[a-z]+" {...inputProps} />
      </label>
      {validation.isInvalid && (
        <p id="value-error" role="alert">
          {validation.errorMessage}
        </p>
      )}
      <button type="button" onClick={() => setCheckResult(String(validation.checkValidity()))}>
        Check validity
      </button>
      <button type="button" onClick={() => setReportResult(String(validation.reportValidity()))}>
        Report validity
      </button>
      <button type="submit">Submit</button>
      <p>Check: {checkResult}</p>
      <p>Report: {reportResult}</p>
    </form>
  );
}

test("captures custom validity errors and clears them when the input becomes valid", async () => {
  const screen = await page.render(<ValidationForm />);
  const input = screen.getByLabelText("Value");

  await input.fill("INVALID");
  await screen.getByRole("button", { name: "Submit" }).click();

  await expect.element(input).toBeInvalid();
  await expect.element(screen.getByRole("alert")).toHaveTextContent("Use lowercase letters only.");
  expect((input.element() as HTMLInputElement).getAttribute("aria-invalid")).toBe("true");

  await input.fill("valid");

  await expect.element(input).toBeValid();
  await expect.element(screen.getByRole("alert")).not.toBeInTheDocument();
});

test("checkValidity and reportValidity return the input's current validity", async () => {
  const screen = await page.render(<ValidationForm />);
  const input = screen.getByLabelText("Value");

  await screen.getByRole("button", { name: "Check validity" }).click();
  await expect.element(screen.getByText("Check: false")).toBeVisible();
  await screen.getByRole("button", { name: "Report validity" }).click();
  await expect.element(screen.getByText("Report: false")).toBeVisible();

  await input.fill("valid");
  await screen.getByRole("button", { name: "Check validity" }).click();
  await expect.element(screen.getByText("Check: true")).toBeVisible();
  await screen.getByRole("button", { name: "Report validity" }).click();
  await expect.element(screen.getByText("Report: true")).toBeVisible();
});
