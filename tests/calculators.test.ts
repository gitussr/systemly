import { beforeAll, describe, expect, it } from 'vitest';
import type { MarkdownRenderer } from '@astrojs/markdown-remark';
import { markdownProcessor, sharedMarkdownOptions } from '../src/lib/markdown/config';
import { parseCalculator } from '../src/lib/markdown/calculators';
import { bandFor, compute, formatFormula, formatInput, formatResult, initialValues, maxFor, meterWidth } from '../src/lib/markdown/calculator-model';

let renderer: MarkdownRenderer;

beforeAll(async () => {
  renderer = await markdownProcessor.createRenderer(sharedMarkdownOptions);
});

const html = async (markdown: string) => (await renderer.render(markdown)).code;

const LITTLE = `title: Little's Law Calculator
description: Adjust the values.
inputs:
  - id: throughput
    label: Throughput
    unit: req/s
    min: 10
    max: 1000
    step: 10
    value: 200
  - id: response-time
    label: Average response time
    unit: ms
    min: 50
    max: 3000
    step: 50
    value: 500
    divisor: 1000
result:
  label: Average in-flight requests
  operation: product
  digits: 1
formula: "{throughput} × {response-time} seconds"
caption: This is an average.`;

const block = (yaml: string) => '```calculator\n' + yaml + '\n```';

describe('calculators', () => {
  it('renders the starting values and their result, so the page reads without JavaScript', async () => {
    const out = await html(block(LITTLE));
    expect(out).toContain('<figure class="calculator" role="group" aria-labelledby="calculator-1-title"');
    expect(out).toContain('<p class="calculator__title" id="calculator-1-title">Little\'s Law Calculator</p>');
    expect(out).toContain('<label for="calculator-1-throughput">Throughput</label>');
    expect(out).toMatch(/<output class="calculator__value" for="calculator-1-throughput"[^>]*>200 req\/s<\/output>/);
    expect(out).toMatch(/<output class="calculator__value" for="calculator-1-response-time"[^>]*>500 ms<\/output>/);
    expect(out).toMatch(/<output class="calculator__result-value" aria-live="polite"[^>]*>100<\/output>/);
    expect(out).toContain('200 × 0.5 seconds');
    expect(out).toContain('<p class="calculator__caption">This is an average.</p>');
    expect(out).not.toContain('language-calculator');
  });

  it('keeps sliders hidden until the script shows them, labelled and with a spoken value', async () => {
    const out = await html(block(LITTLE));
    const slider = /<input[^>]*id="calculator-1-response-time"[^>]*>/.exec(out)?.[0] ?? '';
    for (const attr of ['type="range"', 'min="50"', 'max="3000"', 'step="50"', 'value="500"', 'aria-valuetext="500 ms"', 'hidden']) {
      expect(slider).toContain(attr);
    }
  });

  it('numbers each calculator on a page', async () => {
    const out = await html(`${block(LITTLE)}\n\nText.\n\n${block(LITTLE)}`);
    expect(out).toContain('id="calculator-2-throughput"');
  });

  it('rejects invalid blocks with a readable message', () => {
    expect(() => parseCalculator(LITTLE.replace('value: 200', 'value: 5000'))).toThrow(/inputs\.0: value must be between min and max/);
    expect(() => parseCalculator(LITTLE.replace('{response-time}', '{latency}'))).toThrow(/formula uses \{latency\}/);
    expect(() => parseCalculator(LITTLE.replace('operation: product', 'operation: sum'))).toThrow(/result\.operation/);
    expect(() => parseCalculator(`${LITTLE}\ncolour: green`)).toThrow(/colour/);
  });

  it('computes and formats without floating-point noise', () => {
    const config = parseCalculator(LITTLE);
    const values = { ...initialValues(config), throughput: 1000, 'response-time': 350 };
    expect(compute(config, values)).toBeCloseTo(350);
    expect(formatResult(config, compute(config, { throughput: 330, 'response-time': 150 }))).toBe('49.5');
    expect(formatResult(config, 1234.56)).toBe('1,234.6');
    expect(formatFormula(config, values)).toBe('1000 × 0.35 seconds');
    expect(formatInput(config.inputs[1]!, 350)).toBe('350 ms');
  });

  it('shows a meter and the status band for the result', async () => {
    const out = await html(block(UTILIZATION));
    expect(out).toMatch(/<output class="calculator__result-value"[^>]*>80%<\/output>/);
    expect(out).toMatch(/<output class="calculator__value"[^>]*>80%<\/output>/);
    expect(out).toContain('<div class="calculator__meter" aria-hidden="true"><span class="calculator__meter-fill" data-meter="" data-tone="warning" style="width: 80%"></span></div>');
    expect(out).toContain('<p class="calculator__band" aria-live="polite" data-band="" data-tone="warning">Busy.</p>');
  });

  it('picks bands by below (exclusive) and upTo (inclusive), and caps the meter', () => {
    const config = parseCalculator(UTILIZATION);
    expect(bandFor(config, 70)?.message).toBe('Headroom.');
    expect(bandFor(config, 80)?.message).toBe('Busy.');
    expect(bandFor(config, 100)?.message).toBe('Busy.');
    expect(bandFor(config, 110)?.message).toBe('Over.');
    expect(meterWidth(config, 200)).toBe('100%');
    expect(meterWidth(config, 10)).toBe('10%');
  });

  it('rejects bands that are out of order or unbounded too early', () => {
    expect(() => parseCalculator(UTILIZATION.replace('upTo: 100', 'upTo: 50'))).toThrow(/bands\.1 must start above/);
    expect(() => parseCalculator(`${UTILIZATION}\n    upTo: 300`)).toThrow(/last band/);
    expect(() => parseCalculator(UTILIZATION.replace('    below: 80\n', ''))).toThrow(/bands\.0 needs below or upTo/);
    expect(() => parseCalculator(UTILIZATION.replace('tone: danger', 'tone: red'))).toThrow(/tone/);
  });

  it('gives the first input as a percentage of the second, capped by atMost', async () => {
    const config = parseCalculator(SUCCESS);
    expect(formatResult(config, compute(config, initialValues(config)))).toBe('99.8%');
    expect(compute(config, { good: 500, total: 1000 })).toBe(50);
    // successful requests above the eligible total count as the total, never above 100%
    expect(compute(config, { good: 9000, total: 1000 })).toBe(100);
    expect(maxFor(config, config.inputs[0]!, { good: 9000, total: 1000 })).toBe(1000);
    expect(formatFormula(config, { good: 9000, total: 1000 })).toBe('1000 of 1000');
    const out = await html(block(SUCCESS));
    expect(out).toMatch(/<output class="calculator__result-value"[^>]*>99\.8%<\/output>/);
    expect(/<input[^>]*id="calculator-1-good"[^>]*>/.exec(out)?.[0]).toContain('max="10000"');
  });

  it('rejects a percentage without two inputs and a bad atMost', () => {
    expect(() => parseCalculator(UTILIZATION.replace('operation: product', 'operation: percentage'))).toThrow(/exactly two inputs/);
    expect(() => parseCalculator(SUCCESS.replace('atMost: total', 'atMost: good'))).toThrow(/inputs\.0: atMost must name another input/);
    expect(() => parseCalculator(SUCCESS.replace('atMost: total', 'atMost: eligible'))).toThrow(/atMost must name another input/);
    expect(() => parseCalculator(SUCCESS.replace('value: 10000', 'value: 5000'))).toThrow(/inputs\.0: value must not exceed total/);
  });
});

const SUCCESS = `title: Success rate
inputs:
  - id: good
    label: Successful requests
    unit: requests
    min: 0
    max: 10000
    step: 10
    value: 9980
    atMost: total
  - id: total
    label: Eligible requests
    unit: requests
    min: 100
    max: 10000
    step: 100
    value: 10000
result:
  label: Success rate
  operation: percentage
  digits: 3
  unit: "%"
formula: "{good} of {total}"`;

const UTILIZATION = `title: Utilization
inputs:
  - id: demand
    label: Workload demand
    unit: "%"
    min: 10
    max: 200
    step: 10
    value: 80
result:
  label: Demand relative to capacity
  operation: product
  digits: 0
  unit: "%"
meter: 100
bands:
  - tone: success
    message: Headroom.
    below: 80
  - tone: warning
    message: Busy.
    upTo: 100
  - tone: danger
    message: Over.`;
