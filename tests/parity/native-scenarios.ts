import { PARITY_SCENARIOS } from "./scenarios";
import { withParityBasePath } from "./shared";

export const NATIVE_PARITY_SCENARIOS = PARITY_SCENARIOS.map((scenario) => ({
  ...scenario,
  targetPath: withParityBasePath(scenario.canonicalPath)
}));

