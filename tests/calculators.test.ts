import { beforeAll, describe, expect, it } from 'vitest';
import type { MarkdownRenderer } from '@astrojs/markdown-remark';
import { markdownProcessor, sharedMarkdownOptions } from '../src/lib/markdown/config';
import { parseCalculator } from '../src/lib/markdown/calculators';
import { compute, formatFormula, formatInput, formatResult, initialValues } from '../src/lib/markdown/calculator-model';

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
});
