/**
 * Turns ```calculator code blocks into interactive calculators. The block holds YAML: the
 * title, the inputs (label, unit, range, starting value) and how they combine. All wording
 * stays in the chapter file.
 *
 *   <figure class="calculator" data-calculator="{…config as JSON…}">
 *     …title, one labelled slider per input, the result and the formula…
 *   </figure>
 *
 * Optional extras: a unit after the result, a `meter` bar under it and status `bands`
 * (a message per result range, e.g. "Demand exceeds capacity" above 100%).
 *
 * The page is rendered with the starting values and their result, so without JavaScript it
 * still reads as a worked example; the sliders are `hidden` until src/scripts/calculators.ts
 * shows them and keeps the numbers up to date. An invalid block fails the build.
 */
import { z } from 'astro/zod';
import { parse } from 'yaml';
import type { Element, ElementContent, Root, RootContent } from 'hast';
import type { VFile } from 'vfile';
import {
  FORMULA_PLACEHOLDER,
  bandFor,
  compute,
  formatFormula,
  formatInput,
  formatResult,
  initialValues,
  maxFor,
  meterWidth,
  type CalculatorConfig,
} from './calculator-model';

const inputSchema = z
  .object({
    id: z.string().regex(/^[a-z][a-z0-9-]*$/, 'use lowercase letters, digits and hyphens'),
    label: z.string().min(1),
    unit: z.string().min(1),
    min: z.number(),
    max: z.number(),
    step: z.number().positive(),
    value: z.number(),
    divisor: z.number().positive().default(1),
    atMost: z.string().optional(),
  })
  .strict()
  .refine((i) => i.min < i.max, { message: 'min must be less than max' })
  .refine((i) => i.value >= i.min && i.value <= i.max, { message: 'value must be between min and max' });

const bandSchema = z
  .object({
    below: z.number().optional(),
    upTo: z.number().optional(),
    tone: z.enum(['success', 'warning', 'danger']),
    message: z.string().min(1),
  })
  .strict()
  .refine((b) => b.below === undefined || b.upTo === undefined, { message: 'use either below or upTo, not both' });

const configSchema = z
  .object({
    title: z.string().min(1),
    description: z.string().min(1).optional(),
    inputs: z.array(inputSchema).min(1),
    result: z
      .object({
        label: z.string().min(1),
        operation: z.enum(['product', 'percentage']),
        digits: z.number().int().min(0).max(6).default(1),
        unit: z.string().min(1).optional(),
      })
      .strict(),
    meter: z.number().positive().optional(),
    bands: z.array(bandSchema).min(2).optional(),
    formula: z.string().min(1).optional(),
    caption: z.string().min(1).optional(),
  })
  .strict()
  .superRefine((config, ctx) => {
    const ids = config.inputs.map((i) => i.id);
    const duplicate = ids.find((id, n) => ids.indexOf(id) !== n);
    if (duplicate) ctx.addIssue({ code: 'custom', message: `input id "${duplicate}" is used twice` });
    if (config.result.operation === 'percentage' && config.inputs.length !== 2) {
      ctx.addIssue({ code: 'custom', message: 'a percentage needs exactly two inputs (part, then whole)' });
    }
    config.inputs.forEach((input, n) => {
      if (input.atMost === undefined) return;
      const limit = config.inputs.find((i) => i.id === input.atMost);
      if (!limit || limit === input) ctx.addIssue({ code: 'custom', message: `inputs.${n}: atMost must name another input id` });
      else if (input.value > limit.value) ctx.addIssue({ code: 'custom', message: `inputs.${n}: value must not exceed ${limit.id}` });
    });
    for (const [, id] of (config.formula ?? '').matchAll(FORMULA_PLACEHOLDER)) {
      if (!ids.includes(id!)) ctx.addIssue({ code: 'custom', message: `formula uses {${id}}, which is not an input id` });
    }
    const bands = config.bands ?? [];
    const limits = bands.map((b) => b.below ?? b.upTo);
    if (bands.length && limits.at(-1) !== undefined) {
      ctx.addIssue({ code: 'custom', message: 'the last band takes every remaining value, so it has no below or upTo' });
    }
    limits.slice(0, -1).forEach((limit, n) => {
      if (limit === undefined) ctx.addIssue({ code: 'custom', message: `bands.${n} needs below or upTo` });
      else if (n > 0 && limits[n - 1] !== undefined && limit <= limits[n - 1]!) {
        ctx.addIssue({ code: 'custom', message: `bands.${n} must start above the band before it` });
      }
    });
  });

export function parseCalculator(source: string): CalculatorConfig {
  const result = configSchema.safeParse(parse(source));
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join('.') || 'calculator'}: ${i.message}`);
    throw new Error(`Invalid calculator block — ${issues.join('; ')}`);
  }
  return result.data;
}

export function rehypeCalculators() {
  return (tree: Root, file: VFile) => {
    let count = 0;
    const replace = (parent: Root | Element) => {
      parent.children = parent.children.map((child: RootContent | ElementContent) => {
        if (child.type !== 'element') return child;
        const source = calculatorSource(child);
        if (source === undefined) {
          replace(child);
          return child;
        }
        let config: CalculatorConfig;
        try {
          config = parseCalculator(source);
        } catch (error) {
          throw new Error(`${(error as Error).message}${file.path ? ` (${file.path})` : ''}`);
        }
        return renderCalculator(config, `calculator-${++count}`);
      }) as typeof parent.children;
    };
    replace(tree);
  };
}

/** The text of a <pre><code class="language-calculator"> block. */
function calculatorSource(node: Element): string | undefined {
  if (node.tagName !== 'pre') return undefined;
  const code = node.children.find((c): c is Element => c.type === 'element' && c.tagName === 'code');
  const classes = code?.properties.className;
  if (!Array.isArray(classes) || !classes.includes('language-calculator')) return undefined;
  const text = (n: ElementContent): string =>
    n.type === 'text' ? n.value : n.type === 'element' ? n.children.map(text).join('') : '';
  return code!.children.map(text).join('');
}

function el(tagName: string, properties: Element['properties'], children: (ElementContent | string)[] = []): Element {
  return {
    type: 'element',
    tagName,
    properties,
    children: children.map((c) => (typeof c === 'string' ? { type: 'text', value: c } : c)),
  };
}

function renderCalculator(config: CalculatorConfig, id: string): Element {
  const values = initialValues(config);
  const titleId = `${id}-title`;
  const children: Element[] = [el('p', { className: ['calculator__title'], id: titleId }, [config.title])];
  if (config.description) children.push(el('p', { className: ['calculator__description'] }, [config.description]));

  for (const input of config.inputs) {
    const inputId = `${id}-${input.id}`;
    const shown = formatInput(input, input.value);
    children.push(
      el('div', { className: ['calculator__field'] }, [
        el('div', { className: ['calculator__row'] }, [
          el('label', { htmlFor: [inputId] }, [input.label]),
          el('output', { className: ['calculator__value'], htmlFor: [inputId], dataValueFor: input.id }, [shown]),
        ]),
        el('input', {
          type: 'range',
          id: inputId,
          min: String(input.min),
          max: String(maxFor(config, input, values)),
          step: String(input.step),
          value: String(input.value),
          ariaValueText: shown,
          dataInput: input.id,
          hidden: true,
        }),
      ]),
    );
  }

  const total = compute(config, values);
  const result: Element[] = [
    el('p', { className: ['calculator__result-label'] }, [config.result.label]),
    el('output', { className: ['calculator__result-value'], ariaLive: 'polite', dataResult: '' }, [
      formatResult(config, total),
    ]),
  ];
  const band = bandFor(config, total);
  if (config.meter) {
    result.push(
      el('div', { className: ['calculator__meter'], ariaHidden: 'true' }, [
        el('span', { className: ['calculator__meter-fill'], dataMeter: '', dataTone: band?.tone, style: `width: ${meterWidth(config, total)}` }),
      ]),
    );
  }
  if (band) {
    result.push(el('p', { className: ['calculator__band'], ariaLive: 'polite', dataBand: '', dataTone: band.tone }, [band.message]));
  }
  if (config.formula) {
    result.push(el('p', { className: ['calculator__formula'], dataFormula: '' }, [formatFormula(config, values)]));
  }
  children.push(el('div', { className: ['calculator__result'] }, result));
  if (config.caption) children.push(el('p', { className: ['calculator__caption'] }, [config.caption]));

  return el(
    'figure',
    { className: ['calculator'], role: 'group', ariaLabelledBy: [titleId], dataCalculator: JSON.stringify(config) },
    children,
  );
}
