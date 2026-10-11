/**
 * CTC → in-hand salary for Indian offers. Pure functions; runs in the browser.
 * TAX_YEAR rules must be re-checked against incometax.gov.in each Union Budget.
 */

export const TAX_YEAR = "FY 2026-27";

type Slab = [upTo: number, rate: number];
const NEW_SLABS: Slab[] = [[400000, 0], [800000, 0.05], [1200000, 0.1], [1600000, 0.15], [2000000, 0.2], [2400000, 0.25], [Infinity, 0.3]];
const OLD_SLABS: Slab[] = [[250000, 0], [500000, 0.05], [1000000, 0.2], [Infinity, 0.3]];
const RULES = {
  new: { slabs: NEW_SLABS, standardDeduction: 75000, rebateLimit: 1200000, surcharge: [[5e7, 0.25], [2e7, 0.25], [1e7, 0.15], [5e6, 0.1]] as Slab[] },
  old: { slabs: OLD_SLABS, standardDeduction: 50000, rebateLimit: 500000, surcharge: [[5e7, 0.37], [2e7, 0.25], [1e7, 0.15], [5e6, 0.1]] as Slab[] },
} as const;
export type Regime = keyof typeof RULES;

const PF_RATE = 0.12;
const PF_WAGE_CAP_MONTHLY = 15000;
const GRATUITY_RATE = 0.0481;
const CESS = 0.04;
const SECTION_80C_CAP = 150000;

const slabTax = (income: number, slabs: Slab[]) => {
  let tax = 0, floor = 0;
  for (const [upTo, rate] of slabs) {
    if (income <= floor) break;
    tax += (Math.min(income, upTo) - floor) * rate;
    floor = upTo;
  }
  return tax;
};

/** Annual income tax incl. 87A rebate (with marginal relief), surcharge and 4% cess. */
export function incomeTax(taxableIncome: number, regime: Regime): number {
  const rules = RULES[regime];
  const income = Math.max(0, taxableIncome);
  let tax = slabTax(income, rules.slabs);
  if (income <= rules.rebateLimit) tax = 0;
  else if (regime === "new") tax = Math.min(tax, income - rules.rebateLimit); // marginal relief just above the rebate limit
  // shortcut: surcharge marginal relief is not applied; affects only incomes just above ₹50L/₹1Cr/₹2Cr/₹5Cr.
  const surchargeRate = rules.surcharge.find(([threshold]) => income > threshold)?.[1] ?? 0;
  tax *= 1 + surchargeRate;
  return Math.round(tax * (1 + CESS));
}

export interface OfferInput {
  ctc: number;               // annual CTC, including variable, employer PF and gratuity
  variable: number;          // annual variable/performance pay inside the CTC (assumed paid in full)
  basicPercent: number;      // basic as % of fixed pay (CTC − variable)
  pfOnCappedWage: boolean;   // employer/employee PF on ₹15,000/month instead of full basic
  professionalTax: number;   // annual, 0 in states without PT
  regime: Regime;
  oldRegimeDeductions: number; // old regime only: 80C beyond PF, 80D, HRA exemption… (user keeps within limits)
  joiningBonus: number;      // one-time, outside CTC
  noticeBuyout: number;      // what you pay your current employer to leave early
}

export interface OfferBreakdown {
  basic: number;
  employerPf: number;
  gratuity: number;
  grossSalary: number;
  employeePf: number;
  professionalTax: number;
  taxOnSalary: number;
  monthlyInHand: number;
  variableAfterTax: number;
  joiningBonusAfterTax: number;
  annualInHand: number;
  firstYearCash: number;
}

export function breakdownOffer(input: OfferInput): OfferBreakdown {
  const ctc = Math.max(0, input.ctc);
  const variable = Math.min(Math.max(0, input.variable), ctc);
  const fixed = ctc - variable;
  const basic = fixed * Math.min(Math.max(input.basicPercent, 0), 100) / 100;
  const pfWage = input.pfOnCappedWage ? Math.min(basic, PF_WAGE_CAP_MONTHLY * 12) : basic;
  const employerPf = pfWage * PF_RATE;
  const gratuity = basic * GRATUITY_RATE;
  const grossSalary = Math.max(0, fixed - employerPf - gratuity);
  const employeePf = pfWage * PF_RATE;
  const professionalTax = Math.max(0, input.professionalTax);

  const rules = RULES[input.regime];
  // Old regime: PT (s.16) and employee PF (within 80C) are deductible; the user enters other claims themselves.
  const deductions = rules.standardDeduction + (input.regime === "old"
    ? professionalTax + Math.min(SECTION_80C_CAP, employeePf) + Math.max(0, input.oldRegimeDeductions)
    : 0);
  const taxable = (extra: number) => grossSalary + extra - deductions;
  const taxOnSalary = incomeTax(taxable(0), input.regime);
  const variableAfterTax = variable - (incomeTax(taxable(variable), input.regime) - taxOnSalary);
  const joiningBonus = Math.max(0, input.joiningBonus);
  const joiningBonusAfterTax = joiningBonus - (incomeTax(taxable(variable + joiningBonus), input.regime) - incomeTax(taxable(variable), input.regime));

  const monthlyInHand = (grossSalary - employeePf - professionalTax - taxOnSalary) / 12;
  const annualInHand = monthlyInHand * 12 + variableAfterTax;
  return {
    basic, employerPf, gratuity, grossSalary, employeePf, professionalTax, taxOnSalary,
    monthlyInHand, variableAfterTax, joiningBonusAfterTax, annualInHand,
    firstYearCash: annualInHand + joiningBonusAfterTax - Math.max(0, input.noticeBuyout),
  };
}
