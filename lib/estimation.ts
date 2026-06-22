export type EstimateRowInput = {
  qty?: string | number;
  stoneRate?: string | number;
  settingRate?: string | number;
};

export type WorkbookEstimation = {
  rows: Array<{
    qty: number;
    stoneRate: number;
    settingRate: number;
    fValue: number;
    hValue: number;
  }>;
  F41: number;
  H41: number;
  G42: number;
  F43: number;
  H43: number;
  F44: number;
  stoneTotal: number;
  settingTotal: number;
  totalQty: number;
  totalChargeTotal: number;
  gahtCharge: number;
  polishCharge: number;
  totalCharges: number;
  grandTotal: number;
};

export function toNumber(value: string | number | null | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(String(value ?? "").replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatMoney(value: number) {
  return Number.isFinite(value) ? value.toFixed(2) : "0.00";
}

export function calcStoneValue(qty?: string | number, stoneRate?: string | number) {
  return toNumber(qty) * toNumber(stoneRate);
}

export function calcSettingValue(qty?: string | number, settingCharge?: string | number) {
  return toNumber(qty) * toNumber(settingCharge);
}

export function calcGahtCharge(weight?: string | number, gahtRate?: string | number) {
  return toNumber(weight) * toNumber(gahtRate);
}

export function calcPolishTotal(polishQty?: string | number, polishRate?: string | number) {
  return toNumber(polishQty) * toNumber(polishRate);
}

export function calcTotals(rows: EstimateRowInput[]) {
  const stoneTotal = rows.reduce((sum, row) => sum + calcStoneValue(row.qty, row.stoneRate), 0);
  const settingTotal = rows.reduce((sum, row) => sum + calcSettingValue(row.qty, row.settingRate), 0);
  const totalQty = rows.reduce((sum, row) => sum + toNumber(row.qty), 0);
  return { stoneTotal, settingTotal, totalQty };
}

export function calcWorkbookEstimation(input: {
  rows: EstimateRowInput[];
  g42?: string | number;
}) : WorkbookEstimation {
  const rows = input.rows.map((row) => {
    const qty = toNumber(row.qty);
    const stoneRate = toNumber(row.stoneRate);
    const settingRate = toNumber(row.settingRate);
    const fValue = qty * stoneRate;
    const hValue = qty * settingRate;
    return { qty, stoneRate, settingRate, fValue, hValue };
  });
  const stoneTotal = rows.reduce((sum, row) => sum + row.fValue, 0);
  const settingTotal = rows.reduce((sum, row) => sum + row.hValue, 0);
  const totalQty = rows.reduce((sum, row) => sum + row.qty, 0);
  const G42 = input.g42 == null ? 1 : toNumber(input.g42);
  const F41 = stoneTotal;
  const H41 = settingTotal;
  const F43 = F41 * G42;
  const H43 = H41 * G42;
  const F44 = F43 + H43;
  return {
    rows,
    F41,
    H41,
    G42,
    F43,
    H43,
    F44,
    stoneTotal,
    settingTotal,
    totalQty,
    totalChargeTotal: settingTotal,
    gahtCharge: 0,
    polishCharge: 0,
    totalCharges: H41,
    grandTotal: F44,
  };
}

export function calcEstimation(input: {
  rows: EstimateRowInput[];
  gahtWeight?: string | number;
  gahtRate?: string | number;
  polishQty?: string | number;
  polishRate?: string | number;
  g42?: string | number;
}) {
  const workbook = calcWorkbookEstimation({ rows: input.rows, g42: input.g42 ?? 1 });
  const gahtCharge = calcGahtCharge(input.gahtWeight, input.gahtRate);
  const polishCharge = calcPolishTotal(input.polishQty, input.polishRate);
  const totalCharges = workbook.totalChargeTotal + gahtCharge + polishCharge;
  const grandTotal = workbook.stoneTotal + totalCharges;

  return {
    ...workbook,
    gahtCharge,
    polishCharge,
    totalCharges,
    grandTotal,
  };
}
