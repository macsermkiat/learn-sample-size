// Public engine API. Pure TS, framework-agnostic: numbers in, numbers out.
export type {
  OutcomeType,
  Criterion,
  RatioLabel,
  SampleSizeResult,
} from "./types";
export { binarySampleSize, type BinaryInput } from "./binary";
export { continuousSampleSize, type ContinuousInput } from "./continuous";
export {
  survivalSampleSize,
  maxR2csSurvival,
  type SurvivalInput,
} from "./survival";
export {
  maxR2csBinary,
  nagelkerkeToR2cs,
  r2csToNagelkerke,
  cToR2cs,
  round2,
} from "./shared";
