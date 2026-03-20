"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

interface MonthData {
  month: number;
  mois: string;
  ca: number;
  cotisations: number;
  impot: number;
  frais: number;
  net: number;
  cumulCA: number;
  cumulNet: number;
  tvaCollectee: number;
  tvaDeductible: number;
  tvaSolde: number;
}

function formatEuro(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-white p-3 shadow-sm">
      <p className="text-sm font-medium text-foreground">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: {formatEuro(entry.value)}
        </p>
      ))}
    </div>
  );
}

export default function HistoryPage() {
  const params = useParams();
  const clientId = params.clientId as string;
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<MonthData[]>([]);
  const [loading, setLoading] = useState(true);
  const [tvaAssujetti, setTvaAssujetti] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/accountant/${clientId}/history?year=${year}`);
        if (res.ok) {
          const json = await res.json();
          setData(json.months || []);
          setTvaAssujetti(json.tvaAssujetti ?? false);
        }
      } catch {} finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [clientId, year]);

  const totalCA = data.reduce((sum, m) => sum + m.ca, 0);
  const totalNet = data.reduce((sum, m) => sum + m.net, 0);
  const totalCotisations = data.reduce((sum, m) => sum + m.cotisations, 0);
  const totalImpot = data.reduce((sum, m) => sum + m.impot, 0);
  const moisActifs = data.filter((m) => m.ca > 0).length;
  const totalTvaCollectee = data.reduce((sum, m) => sum + m.tvaCollectee, 0);
  const totalTvaDeductible = data.reduce((sum, m) => sum + m.tvaDeductible, 0);
  const totalTvaSolde = Math.round((totalTvaCollectee - totalTvaDeductible) * 100) / 100;

  return (
    <div className="space-y-8 pb-20 md:pb-0">
      {/* Header + Year selector */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Historique</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setYear((y) => y - 1)}
            className="rounded-lg border border-border p-2 hover:bg-muted"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[4rem] text-center font-semibold">{year}</span>
          <button
            onClick={() => setYear((y) => y + 1)}
            disabled={year >= new Date().getFullYear()}
            className="rounded-lg border border-border p-2 hover:bg-muted disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Chargement...</p>
      ) : (
        <>
          {/* Summary cards */}
          <div className={`grid grid-cols-2 gap-3 ${tvaAssujetti ? "md:grid-cols-5" : "md:grid-cols-4"} md:gap-4`}>
            <SummaryCard label={tvaAssujetti ? "CA total (HT)" : "CA total"} value={formatEuro(totalCA)} />
            <SummaryCard label="Net total" value={formatEuro(totalNet)} accent />
            <SummaryCard label="Prélèvements" value={formatEuro(totalCotisations + totalImpot)} />
            <SummaryCard label="Mois actifs" value={`${moisActifs} / 12`} />
            {tvaAssujetti && (
              <SummaryCard
                label={totalTvaSolde >= 0 ? "TVA à reverser" : "Crédit de TVA"}
                value={formatEuro(Math.abs(totalTvaSolde))}
                color={totalTvaSolde > 0 ? "red" : totalTvaSolde < 0 ? "green" : undefined}
              />
            )}
          </div>

          {/* Bar chart: CA vs Net */}
          <div className="rounded-2xl border border-border bg-white p-4 md:p-6">
            <h2 className="text-lg font-semibold text-foreground">{tvaAssujetti ? "CA (HT) vs Net mensuel" : "CA vs Net mensuel"}</h2>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="ca" name={tvaAssujetti ? "CA (HT)" : "CA"} fill="#2563eb" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="net" name="Net" fill="#16a34a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Line chart: Cumul */}
          <div className="rounded-2xl border border-border bg-white p-4 md:p-6">
            <h2 className="text-lg font-semibold text-foreground">Cumul annuel</h2>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line type="monotone" dataKey="cumulCA" name={tvaAssujetti ? "CA cumulé (HT)" : "CA cumulé"} stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="cumulNet" name="Net cumulé" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* TVA chart */}
          {tvaAssujetti && (
            <div className="rounded-2xl border border-border bg-white p-4 md:p-6">
              <h2 className="text-lg font-semibold text-foreground">TVA mensuelle</h2>
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="tvaCollectee" name="TVA collectée" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="tvaDeductible" name="TVA déductible" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="tvaSolde" name="Solde TVA" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Monthly table */}
          <div className="rounded-2xl border border-border bg-white p-4 md:p-6">
            <h2 className="text-lg font-semibold text-foreground">Détail mensuel</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full whitespace-nowrap text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="pb-3 pr-4">Mois</th>
                    <th className="pb-3 pr-4 text-right">{tvaAssujetti ? "CA (HT)" : "CA"}</th>
                    <th className="pb-3 pr-4 text-right">Cotisations</th>
                    <th className="pb-3 pr-4 text-right">Impôt</th>
                    <th className="pb-3 pr-4 text-right">Frais</th>
                    <th className={`pb-3 ${tvaAssujetti ? "pr-4" : ""} text-right font-semibold`}>Net</th>
                    {tvaAssujetti && (
                      <>
                        <th className="pb-3 pr-4 text-right">Collectée</th>
                        <th className="pb-3 pr-4 text-right">Déductible</th>
                        <th className="pb-3 text-right">Solde TVA</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {data.map((m) => (
                    <tr key={m.month} className="border-b border-border/50">
                      <td className="py-2.5 pr-4 font-medium">{m.mois}</td>
                      <td className="py-2.5 pr-4 text-right">{m.ca > 0 ? formatEuro(m.ca) : "—"}</td>
                      <td className="py-2.5 pr-4 text-right text-orange-600">
                        {m.cotisations > 0 ? `-${formatEuro(m.cotisations)}` : "—"}
                      </td>
                      <td className="py-2.5 pr-4 text-right text-red-600">
                        {m.impot > 0 ? `-${formatEuro(m.impot)}` : "—"}
                      </td>
                      <td className="py-2.5 pr-4 text-right text-muted-foreground">
                        {m.frais > 0 ? `-${formatEuro(m.frais)}` : "—"}
                      </td>
                      <td className="py-2.5 text-right font-semibold text-accent">
                        {m.net > 0 ? formatEuro(m.net) : "—"}
                      </td>
                      {tvaAssujetti && (
                        <>
                          <td className="py-2.5 pr-4 text-right text-blue-600">
                            {m.tvaCollectee > 0 ? formatEuro(m.tvaCollectee) : "—"}
                          </td>
                          <td className="py-2.5 pr-4 text-right text-amber-600">
                            {m.tvaDeductible > 0 ? `-${formatEuro(m.tvaDeductible)}` : "—"}
                          </td>
                          <td className={`py-2.5 text-right font-medium ${
                            m.tvaSolde > 0 ? "text-red-600" : m.tvaSolde < 0 ? "text-green-600" : "text-muted-foreground"
                          }`}>
                            {m.tvaSolde !== 0 ? formatEuro(m.tvaSolde) : "—"}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                  {/* Total row */}
                  <tr className="font-semibold">
                    <td className="pt-3">Total</td>
                    <td className="pt-3 text-right">{formatEuro(totalCA)}</td>
                    <td className="pt-3 text-right text-orange-600">-{formatEuro(totalCotisations)}</td>
                    <td className="pt-3 text-right text-red-600">-{formatEuro(totalImpot)}</td>
                    <td className="pt-3 text-right text-muted-foreground">
                      -{formatEuro(data.reduce((s, m) => s + m.frais, 0))}
                    </td>
                    <td className="pt-3 text-right text-accent">{formatEuro(totalNet)}</td>
                    {tvaAssujetti && (
                      <>
                        <td className="pt-3 text-right text-blue-600">{formatEuro(totalTvaCollectee)}</td>
                        <td className="pt-3 text-right text-amber-600">-{formatEuro(totalTvaDeductible)}</td>
                        <td className={`pt-3 text-right ${
                          totalTvaSolde > 0 ? "text-red-600" : totalTvaSolde < 0 ? "text-green-600" : ""
                        }`}>
                          {formatEuro(totalTvaSolde)}
                        </td>
                      </>
                    )}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  accent,
  color,
}: {
  label: string;
  value: string;
  accent?: boolean;
  color?: "red" | "green";
}) {
  const borderBg = color === "red"
    ? "border-red-200 bg-red-50"
    : color === "green"
    ? "border-green-200 bg-green-50"
    : accent
    ? "border-accent bg-accent/5"
    : "border-border bg-white";

  const textColor = color === "red"
    ? "text-red-600"
    : color === "green"
    ? "text-green-600"
    : accent
    ? "text-accent"
    : "text-foreground";

  return (
    <div className={`rounded-xl border p-5 ${borderBg}`}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${textColor}`}>{value}</p>
    </div>
  );
}
