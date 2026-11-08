import { expect, test } from "vitest";

import { mixins } from "./mixins";

class Base {
  constructor(readonly name: string) {}
}

function createAlphaBehavior(initialValue: number) {
  return class AlphaBehavior {
    firstValue = initialValue;

    advanceAlpha() {
      this.firstValue += 1;
    }
  };
}

function createBetaBehavior(initialValue: number) {
  return class BetaBehavior {
    secondValue = initialValue;

    advanceBeta() {
      this.secondValue += 1;
    }
  };
}

test.each([
  [3, 17],
  [91, 4],
  [23, 68],
])("composes generated behaviors from %i and %i", (firstValue, secondValue) => {
  const Combined = mixins(Base, createAlphaBehavior(firstValue), createBetaBehavior(secondValue));
  const instance = new Combined(`Example ${firstValue} to ${secondValue}`);

  instance.advanceAlpha();
  instance.advanceBeta();

  expect(instance.name).toBe(`Example ${firstValue} to ${secondValue}`);
  expect(instance.firstValue).toBe(firstValue + 1);
  expect(instance.secondValue).toBe(secondValue + 1);
});
