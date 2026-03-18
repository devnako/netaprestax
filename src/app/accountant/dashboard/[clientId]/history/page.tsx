"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface MonthlyData {
  month: number;
  ca: number;
  cotisations: number;
  net: number;
  cumulCA: number;
  cumulNet: number;
}

const MONTH_NAMES = [
  "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
  "Juil", "Août", "Sep", "Oct", "Nov", "Déc",
];

export default function HistoryPage() {
  const params = useParams();
  const clientId = params.clientId as string;
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/accountant/${clientId}/history?year=${year}`
        );
        if (res.ok) {
          const history = await res.json();
          setData(history);
        }
      } catch (err) {
        console.error("Failed to fetch history");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [clientId, year]);

  const chartData = data.map((item) => ({
    month: MONTH_NAMES[item.month - 1],
    CA: item.ca,
    Cotisations: item.cotisations,
    Net: Math.max(0, item.net),
    "Cumul CA": item.cumulCA,
    "Cumul Net": Math.max(0, item.cumulNet),
  }));

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Historique</h1>
      </div>

      {/* Year Navigation */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => setYear(year - 1)}
          className="p-2 text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="w-20 text-center text-lg font-semibold text-foreground">
          {year}
        </span>
        <button
          onClick={() => setYear(year + 1)}
          className="p-2 text-muted-foreground hover:text-foreground"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {loading && (
        <div className="text-center text-muted-foreground">Chargement...</div>
      )}

      {!loading && data.length === 0 && (
        <div className="rounded-xl border border-border bg-white p-8 text-center">
          <p className="text-muted-foreground">Pas de données pour cette année</p>
        </div>
      )}

      {!loading && data.length > 0 && (
        <>
          {/* Bar Chart: CA vs Cotisations */}
          <div className="rounded-xl border border-border bg-white p-6">
            <h3 className="font-semibold text-foreground mb-4">
              Chiffre d'affaires et cotisations
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => (value as number).toLocaleString("fr-FR")} />
                <Legend />
                <Bar dataKey="CA" fill="#3b82f6" />
                <Bar dataKey="Cotisations" fill="#f97316" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Line Chart: Cumulative CA and Net */}
          <div className="rounded-xl border border-border bg-white p-6">
            <h3 className="font-semibold text-foreground mb-4">
              Cumul CA et Net
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => (value as number).toLocaleString("fr-FR")} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="Cumul CA"
                  stroke="#3b82f6"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="Cumul Net"
                  stroke="#16a34a"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Summary Table */}
          <div className="rounded-xl border border-border bg-white p-6">
            <h3 className="font-semibold text-foreground mb-4">
              Résumé mensuel
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left font-semibold text-foreground py-2">
                      Mois
                    </th>
                    <th className="text-right font-semibold text-foreground py-2">
                      CA
                    </th>
                    <th className="text-right font-semibold text-foreground py-2">
                      Cotisations
                    </th>
                    <th className="text-right font-semibold text-foreground py-2">
                      Net
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item) => (
                    <tr
                      key={item.month}
                      className="border-b border-border last:border-b-0"
                    >
                      <td className="text-foreground py-2">
                        {MONTH_NAMES[item.month - 1]}
                      </td>
                      <td className="text-right text-foreground py-2">
                        {new Intl.NumberFormat("fr-FR", {
                          style: "currency",
                          currency: "EUR",
                        }).format(item.ca)}
                      </td>
                      <td className="text-right text-foreground py-2">
                        {new Intl.NumberFormat("fr-FR", {
                          style: "currency",
                          currency: "EUR",
                        }).format(item.cotisations)}
                      </td>
                      <td className="text-right font-semibold text-accent py-2">
                        {new Intl.NumberFormat("fr-FR", {
                          style: "currency",
                          currency: "EUR",
                        }).format(Math.max(0, item.net))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
