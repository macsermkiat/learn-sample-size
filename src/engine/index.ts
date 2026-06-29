// Public engine API. Pure TS, framework-agnostic: numbers in, numbers out.
export type {
  OutcomeType,
  Criterion,
  RatioLabel,
  SampleSizeResult,
} from "./types";
export { binarySampleSize, type BinaryInput } from "./binary";
export {
  maxR2csBinary,
  nagelkerkeToR2cs,
  r2csToNagelkerke,
  cToR2cs,
  round2,
} from "./shared";
