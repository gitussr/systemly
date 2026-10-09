/**
 * Makes chapter calculators interactive: shows each slider and keeps the values, the
 * result and the formula in step with it. Without this script the page shows the
 * starting values and their result (rendered at build time by rehypeCalculators).
 */
import {
  bandFor,
  compute,
  formatFormula,
  formatInput,
  formatResult,
  initialValues,
  meterWidth,
  type CalculatorConfig,
} from '../lib/markdown/calculator-model';

export function initCalculators(): void {
  for (const figure of document.querySelectorAll<HTMLElement>('figure[data-calculator]')) {
    const config = JSON.parse(figure.dataset.calculator!) as CalculatorConfig;
    const values = initialValues(config);
    const result = figure.querySelector<HTMLOutputElement>('[data-result]');
    const formula = figure.querySelector<HTMLElement>('[data-formula]');
    const meter = figure.querySelector<HTMLElement>('[data-meter]');
    const status = figure.querySelector<HTMLElement>('[data-band]');

    const update = () => {
      const total = compute(config, values);
      const band = bandFor(config, total);
      if (result) result.textContent = formatResult(config, total);
      if (formula) formula.textContent = formatFormula(config, values);
      if (meter) {
        meter.style.width = meterWidth(config, total);
        if (band) meter.dataset.tone = band.tone;
      }
      if (status && band) {
        status.textContent = band.message;
        status.dataset.tone = band.tone;
      }
    };

    for (const input of config.inputs) {
      const slider = figure.querySelector<HTMLInputElement>(`input[data-input="${input.id}"]`);
      const shown = figure.querySelector<HTMLOutputElement>(`[data-value-for="${input.id}"]`);
      if (!slider) continue;
      slider.hidden = false;
      slider.addEventListener('input', () => {
        values[input.id] = slider.valueAsNumber;
        const text = formatInput(input, slider.valueAsNumber);
        slider.setAttribute('aria-valuetext', text);
        if (shown) shown.textContent = text;
        update();
      });
    }
  }
}
