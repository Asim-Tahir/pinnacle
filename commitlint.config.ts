import type { UserConfig } from "@commitlint/types";
import { RuleConfigSeverity } from "@commitlint/types";

export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "subject-full-stop": [RuleConfigSeverity.Disabled],
    "header-max-length": [RuleConfigSeverity.Error, "always", 120],
    "scope-enum": [RuleConfigSeverity.Error, "always", ["deps"]],
    "scope-case": [RuleConfigSeverity.Error, "always", "lower-case"],
  },
} satisfies UserConfig;
