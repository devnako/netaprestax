"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText } from "lucide-react";

export default function ExportPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [loadingCSV, setLoadingCSV] = useState(false);
  const [loadingPDF, setLoadingPDF] = useState(false);

  const handleCSV = async () => {
    setLoadingCSV(true);
    const res = await fetch(`/api/export/csv?year=${year}`);
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `netaprestax-${year}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
    setLoadingCSV(false);
  };

  const handlePDF = async () => {
    setLoadingPDF(true);
    const res = await fetch(`/api/export/pdf?year=${year}`);
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `netaprestax-${year}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    }
    setLoadingPDF(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Exporter mes données</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Télécharge ton récapitulatif annuel pour ta comptabilité.
        </p>
      </div>

      {/* Year selector */}
      <div className="max-w-xs">
        <label className="block text-sm font-medium text-foreground">Année</label>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="mt-1 block w-full rounded-lg border border-border px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - i).map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Export cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-white p-6">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-8 w-8 text-green-600" />
            <div>
              <h2 className="text-lg font-semibold text-foreground">Export CSV</h2>
              <p className="text-sm text-muted-foreground">
                Compatible Excel, Google Sheets, comptabilité
              </p>
            </div>
          </div>
          <button
            onClick={handleCSV}
            disabled={loadingCSV}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {loadingCSV ? "Génération..." : "Télécharger CSV"}
          </button>
        </div>

        <div className="rounded-2xl border border-border bg-white p-6">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-red-500" />
            <div>
              <h2 className="text-lg font-semibold text-foreground">Export PDF</h2>
              <p className="text-sm text-muted-foreground">
                Récapitulatif annuel mis en page, prêt à imprimer
              </p>
            </div>
          </div>
          <button
            onClick={handlePDF}
            disabled={loadingPDF}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {loadingPDF ? "Génération..." : "Télécharger PDF"}
          </button>
        </div>
      </div>
    </div>
  );
}
