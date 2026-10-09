/**
 * Calculator arithmetic and formatting, shared by the build (which renders the default
 * values as the no-JavaScript fallback) and src/scripts/calculators.ts (which updates them
 * live), so both always show the same numbers. No dependencies: it ships to the browser.
 */

export interface CalculatorInput {
  /** Name used in the formula template, e.g. `{response-time}`. */
  id: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  /** Starting value, shown without JavaScript. */
  value: number;
  /** The value is divided by this before it is used, e.g. 1000 to turn ms into seconds. */
  divisor: number;
}

export interface CalculatorConfig {
  title: string;
  description?: string;
  inputs: CalculatorInput[];
  result: {
    label: string;
    /** How the inputs combine. Only multiplication is needed so far. */
    operation: 'product';
    /** Maximum decimal places shown in the result. */
    digits: number;
    /** Shown after the result, e.g. "%". */
    unit?: string;
  };
  /** Draws a bar under the result that is full when the result reaches this value. */
  meter?: number;
  /**
   * Status messages by result range, checked in order: a band applies when the result is
   * below `below` (exclusive) or at most `upTo` (inclusive); the last band has neither.
   */
  bands?: CalculatorBand[];
  /** Shown under the result; `{id}` is replaced by that input's value after its divisor. */
  formula?: string;
  caption?: string;
}

export type CalculatorTone = 'success' | 'warning' | 'danger';

export interface CalculatorBand {
  below?: number;
  upTo?: number;
  tone: CalculatorTone;
  message: string;
}

export type CalculatorValues = Record<string, number>;

export const FORMULA_PLACEHOLDER = /\{([a-z][a-z0-9-]*)\}/g;

export function initialValues(config: CalculatorConfig): CalculatorValues {
  return Object.fromEntries(config.inputs.map((input) => [input.id, input.value]));
}

function scaled(input: CalculatorInput, values: CalculatorValues): number {
  return (values[input.id] ?? input.value) / input.divisor;
}

export function compute(config: CalculatorConfig, values: CalculatorValues): number {
  return config.inputs.reduce((total, input) => total * scaled(input, values), 1);
}

/** A plain number without grouping; up to six decimals hides floating-point noise. */
function plain(value: number): string {
  return value.toLocaleString('en-US', { maximumFractionDigits: 6, useGrouping: false });
}

/** "500 ms", but "80%": a percent sign follows the number directly. */
function withUnit(number: string, unit: string | undefined): string {
  if (!unit) return number;
  return unit === '%' ? `${number}%` : `${number} ${unit}`;
}

/** An input's current value with its unit, e.g. "500 ms". */
export function formatInput(input: CalculatorInput, value: number): string {
  return withUnit(plain(value), input.unit);
}

export function formatResult(config: CalculatorConfig, value: number): string {
  return withUnit(value.toLocaleString('en-US', { maximumFractionDigits: config.result.digits }), config.result.unit);
}

/** The band whose range holds the result, if the calculator has bands. */
export function bandFor(config: CalculatorConfig, value: number): CalculatorBand | undefined {
  return config.bands?.find(
    (band) => (band.below === undefined || value < band.below) && (band.upTo === undefined || value <= band.upTo),
  );
}

/** How full the meter bar is, from 0 to 1. */
export function meterFraction(config: CalculatorConfig, value: number): number {
  return config.meter ? Math.min(Math.max(value / config.meter, 0), 1) : 0;
}

/** The meter fill width as a CSS percentage, e.g. "80%". */
export function meterWidth(config: CalculatorConfig, value: number): string {
  return `${plain(Math.round(meterFraction(config, value) * 1000) / 10)}%`;
}

export function formatFormula(config: CalculatorConfig, values: CalculatorValues): string {
  if (!config.formula) return '';
  const byId = new Map(config.inputs.map((input) => [input.id, input]));
  return config.formula.replace(FORMULA_PLACEHOLDER, (match, id: string) => {
    const input = byId.get(id);
    return input ? plain(scaled(input, values)) : match;
  });
}
