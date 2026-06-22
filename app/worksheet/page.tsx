"use client";

import { useEffect, useMemo, useState } from "react";

type WorksheetRow = {
  id: number;
  rowType: "Material" | "Stone";
  name: string;
  purity: string;
  detailType: string;
  pieces: number;
  weightG: number;
  size: string;
  qty: number;
  rate: number;
  setCharge: number;
};

const createMaterialRow = (id: number): WorksheetRow => ({
  id,
  rowType: "Material",
  name: "",
  purity: "",
  detailType: "",
  pieces: 0,
  weightG: 0,
  size: "",
  qty: 0,
  rate: 0,
  setCharge: 0
});

const createStoneRow = (id: number): WorksheetRow => ({
  id,
  rowType: "Stone",
  name: "",
  purity: "",
  detailType: "",
  pieces: 0,
  weightG: 0,
  size: "",
  qty: 0,
  rate: 0,
  setCharge: 0
});

const money = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function WorksheetPage() {
  const [rows, setRows] = useState<WorksheetRow[]>([
    createMaterialRow(1),
    createMaterialRow(2),
    createStoneRow(3),
    createStoneRow(4)
  ]);
  const storageKey = "lakshmi-tool-worksheet-rows";

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as WorksheetRow[];
      if (Array.isArray(parsed) && parsed.length) {
        setRows(parsed);
      }
    } catch {
      // Ignore bad local storage and keep the default editable table.
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(rows));
  }, [rows]);

  const nextId = useMemo(() => rows.reduce((max, row) => Math.max(max, row.id), 0) + 1, [rows]);
  const updateRow = (id: number, patch: Partial<WorksheetRow>) => setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  const addMaterialRow = () => setRows((current) => [...current, createMaterialRow(nextId)]);
  const addStoneRow = () => setRows((current) => [...current, createStoneRow(nextId)]);
  const removeRow = (id: number) => setRows((current) => current.filter((row) => row.id !== id));
  const resetRows = () =>
    setRows([createMaterialRow(1), createMaterialRow(2), createStoneRow(3), createStoneRow(4)]);

  const materialRows = rows.filter((row) => row.rowType === "Material");
  const stoneRows = rows.filter((row) => row.rowType === "Stone");
  const totalStoneCost = stoneRows.reduce((sum, row) => sum + row.qty * row.rate, 0);
  const totalSettingCost = stoneRows.reduce((sum, row) => sum + row.qty * row.setCharge, 0);
  const grandTotal = totalStoneCost + totalSettingCost;

  return (
    <main className="page-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Lakshmi Tool</p>
          <h1>Product worksheet</h1>
          <p className="lede">Material details and worksheet formulas live together in one combined table, so you can keep everything in one place.</p>
        </div>
        <div className="hero-card">
          <div><span>Page</span><strong>Worksheet</strong></div>
          <div><span>Search</span><strong><a href="/">Open search page</a></strong></div>
          <div><span>Rows</span><strong>{rows.length}</strong></div>
        </div>
      </section>

      <section className="worksheet-card">
        <div className="worksheet-head">
          <div>
            <h2>Combined Details Table</h2>
            <p>Material rows capture metal/stone details. Stone rows calculate cost automatically.</p>
          </div>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button className="primary-btn" onClick={addMaterialRow}>+ Material Row</button>
            <button className="primary-btn" onClick={addStoneRow}>+ Stone Row</button>
            <button className="delete-btn" onClick={resetRows}>Reset Table</button>
          </div>
        </div>

        <div className="grid-head combined-head">
          <span />
          <span>Row Type</span>
          <span>Name / Material</span>
          <span>Purity</span>
          <span>Type</span>
          <span>Pieces</span>
          <span>Weight g</span>
          <span>Size</span>
          <span>Qty</span>
          <span>Rate</span>
          <span>Stone Rate</span>
          <span>1pc set chrg</span>
          <span>Total chrg</span>
          <span />
        </div>

        <div className="rows">
          {rows.map((row, index) => {
            const stoneRate = row.rowType === "Stone" && row.qty > 0 && row.rate > 0 ? money.format(row.qty * row.rate) : "";
            const totalCharge = row.rowType === "Stone" && row.qty > 0 && row.setCharge > 0 ? money.format(row.qty * row.setCharge) : "";

            return (
              <div className="grid-row combined-row" key={row.id}>
                <div className="row-index">{index + 1}</div>
                <select value={row.rowType} onChange={(e) => updateRow(row.id, { rowType: e.target.value as "Material" | "Stone" })}>
                  <option value="Material">Material</option>
                  <option value="Stone">Stone</option>
                </select>
                <input value={row.name} onChange={(e) => updateRow(row.id, { name: e.target.value })} placeholder="Name / Material" />
                <input value={row.purity} onChange={(e) => updateRow(row.id, { purity: e.target.value })} placeholder="Purity" />
                <input value={row.detailType} onChange={(e) => updateRow(row.id, { detailType: e.target.value })} placeholder="Type" />
                <input type="number" min="0" step="1" value={row.pieces} onChange={(e) => updateRow(row.id, { pieces: Number(e.target.value || 0) })} />
                <input type="number" min="0" step="0.01" value={row.weightG} onChange={(e) => updateRow(row.id, { weightG: Number(e.target.value || 0) })} />
                <input value={row.size} onChange={(e) => updateRow(row.id, { size: e.target.value })} placeholder="Size" />
                <input type="number" min="0" step="1" value={row.qty} onChange={(e) => updateRow(row.id, { qty: Number(e.target.value || 0) })} />
                <input type="number" min="0" step="0.01" value={row.rate} onChange={(e) => updateRow(row.id, { rate: Number(e.target.value || 0) })} />
                <div className="readonly-field">{stoneRate}</div>
                <input type="number" min="0" step="0.01" value={row.setCharge} onChange={(e) => updateRow(row.id, { setCharge: Number(e.target.value || 0) })} />
                <div className="readonly-field">{totalCharge}</div>
                <button className="delete-btn" onClick={() => removeRow(row.id)}>Del</button>
              </div>
            );
          })}
        </div>

        <div className="summary">
          <div><span>Material rows</span><strong>{materialRows.length}</strong></div>
          <div><span>Stone rows</span><strong>{stoneRows.length}</strong></div>
          <div><span>Total stone cost</span><strong>{money.format(totalStoneCost)}</strong></div>
          <div><span>Total setting cost</span><strong>{money.format(totalSettingCost)}</strong></div>
          <div><span>Grand total</span><strong>{money.format(grandTotal)}</strong></div>
        </div>
      </section>
    </main>
  );
}
