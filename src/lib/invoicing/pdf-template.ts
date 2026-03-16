import { computeDocumentTotals, computeLineTotal } from "./calculations";

interface BusinessInfo {
  name: string;
  siret: string | null;
  address: string | null;
  businessName: string | null;
  tvaNumber: string | null;
  tvaAssujetti: boolean;
}

interface ClientInfo {
  name: string;
  email: string | null;
  address: string | null;
  siret: string | null;
}

interface Line {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number | null;
}

interface DocumentParams {
  type: "devis" | "facture";
  number: string;
  issuedAt: string;
  validUntil?: string | null;
  paidAt?: string | null;
  status: string;
  business: BusinessInfo;
  client: ClientInfo;
  lines: Line[];
  notes: string | null;
  paymentTerms: string | null;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatEuro(n: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}

function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(1).replace(".", ",")} %`;
}

export function generateDocumentHtml(params: DocumentParams): string {
  const { type, number, issuedAt, validUntil, business, client, lines, notes, paymentTerms } = params;
  const label = type === "devis" ? "Devis" : "Facture";
  const totals = computeDocumentTotals(lines, business.tvaAssujetti);

  const linesHtml = lines
    .map((l) => {
      const lineTotal = computeLineTotal(l.quantity, l.unitPrice);
      const vatCell = business.tvaAssujetti
        ? `<td style="padding:8px 12px;text-align:right">${l.vatRate !== null ? formatPercent(l.vatRate) : "—"}</td>`
        : "";
      return `<tr style="border-bottom:1px solid #e5e7eb">
        <td style="padding:8px 12px">${l.description}</td>
        <td style="padding:8px 12px;text-align:right">${l.quantity}</td>
        <td style="padding:8px 12px;text-align:right">${formatEuro(l.unitPrice)}</td>
        ${vatCell}
        <td style="padding:8px 12px;text-align:right;font-weight:600">${formatEuro(lineTotal)}</td>
      </tr>`;
    })
    .join("\n");

  const vatHeader = business.tvaAssujetti ? `<th style="padding:8px 12px;text-align:right">TVA</th>` : "";
  const totalLabel = business.tvaAssujetti ? "Total HT" : "Total";

  let totalsHtml = `<tr><td colspan="${business.tvaAssujetti ? 4 : 3}" style="text-align:right;padding:8px 12px;font-weight:600">${totalLabel}</td><td style="padding:8px 12px;text-align:right;font-weight:700">${formatEuro(totals.totalHT)}</td></tr>`;

  if (business.tvaAssujetti) {
    for (const v of totals.vatBreakdown) {
      totalsHtml += `<tr><td colspan="4" style="text-align:right;padding:4px 12px;color:#6b7280">TVA ${formatPercent(v.rate)} (base ${formatEuro(v.base)})</td><td style="padding:4px 12px;text-align:right">${formatEuro(v.amount)}</td></tr>`;
    }
    totalsHtml += `<tr style="border-top:2px solid #1f2937"><td colspan="4" style="text-align:right;padding:8px 12px;font-weight:700;font-size:16px">Total TTC</td><td style="padding:8px 12px;text-align:right;font-weight:700;font-size:16px;color:#2563eb">${formatEuro(totals.totalTTC)}</td></tr>`;
  }

  const tvaMention = !business.tvaAssujetti
    ? `<p style="margin-top:24px;padding:12px;background:#f9fafb;border-radius:8px;font-size:13px;color:#6b7280">TVA non applicable, art. 293 B du CGI</p>`
    : "";

  const tvaNumberLine = business.tvaAssujetti && business.tvaNumber
    ? `<p style="margin:0;font-size:13px;color:#6b7280">N° TVA : ${business.tvaNumber}</p>`
    : "";

  const validityLine = type === "devis" && validUntil
    ? `<p style="margin:4px 0;font-size:13px;color:#6b7280">Valable jusqu'au ${formatDate(validUntil)}</p>`
    : "";

  const notesHtml = notes
    ? `<div style="margin-top:24px"><p style="font-weight:600;font-size:14px;margin-bottom:4px">Notes</p><p style="font-size:13px;color:#6b7280;white-space:pre-wrap">${notes}</p></div>`
    : "";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>${label} ${number}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:system-ui,-apple-system,sans-serif; color:#1f2937; line-height:1.5; }
    @media print { .no-print { display:none !important; } body { padding:0; } }
  </style>
</head>
<body>
  <div class="no-print" style="position:fixed;top:0;left:0;right:0;background:#2563eb;color:white;padding:12px 24px;display:flex;align-items:center;justify-content:space-between;z-index:50">
    <span style="font-weight:600">${label} ${number}</span>
    <button onclick="window.print()" style="background:white;color:#2563eb;border:none;padding:8px 20px;border-radius:8px;font-weight:600;cursor:pointer">Imprimer / Sauvegarder PDF</button>
  </div>

  <div style="max-width:800px;margin:60px auto 40px;padding:40px">
    <!-- Header -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px">
      <div>
        <h1 style="font-size:28px;font-weight:700;color:#2563eb">${label}</h1>
        <p style="margin-top:4px;font-size:14px;color:#6b7280">N° ${number}</p>
        <p style="margin:2px 0;font-size:13px;color:#6b7280">Date : ${formatDate(issuedAt)}</p>
        ${validityLine}
      </div>
      <div style="text-align:right">
        <p style="font-weight:700;font-size:16px">${business.businessName || business.name}</p>
        <p style="font-size:13px;color:#1f2937">Micro-entreprise</p>
        ${business.address ? `<p style="margin-top:4px;font-size:13px;color:#6b7280;white-space:pre-wrap">${business.address}</p>` : ""}
        ${business.siret ? `<p style="margin-top:4px;font-size:13px;color:#6b7280">SIRET : ${business.siret}</p>` : ""}
        ${tvaNumberLine}
      </div>
    </div>

    <!-- Client -->
    <div style="background:#f9fafb;border-radius:12px;padding:20px;margin-bottom:32px">
      <p style="font-size:12px;text-transform:uppercase;color:#6b7280;margin-bottom:8px">Client</p>
      <p style="font-weight:600;font-size:15px">${client.name}</p>
      ${client.address ? `<p style="font-size:13px;color:#6b7280;white-space:pre-wrap;margin-top:4px">${client.address}</p>` : ""}
      ${client.email ? `<p style="font-size:13px;color:#6b7280;margin-top:2px">${client.email}</p>` : ""}
      ${client.siret ? `<p style="font-size:13px;color:#6b7280;margin-top:2px">SIRET : ${client.siret}</p>` : ""}
    </div>

    <!-- Lines -->
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <thead>
        <tr style="border-bottom:2px solid #1f2937">
          <th style="padding:8px 12px;text-align:left">Description</th>
          <th style="padding:8px 12px;text-align:right">Qté</th>
          <th style="padding:8px 12px;text-align:right">Prix unit. HT</th>
          ${vatHeader}
          <th style="padding:8px 12px;text-align:right">Total HT</th>
        </tr>
      </thead>
      <tbody>
        ${linesHtml}
      </tbody>
      <tfoot>
        ${totalsHtml}
      </tfoot>
    </table>

    ${tvaMention}
    ${notesHtml}

    <!-- Payment terms -->
    <div style="margin-top:32px;padding-top:20px;border-top:1px solid #e5e7eb;font-size:13px;color:#6b7280">
      ${paymentTerms ? `<p><strong>Conditions de règlement :</strong> ${paymentTerms}</p>` : ""}
      <p style="margin-top:8px"><strong>Pénalités de retard :</strong> En cas de retard de paiement, des pénalités seront exigées au taux de 3 fois le taux d'intérêt légal (art. L.441-10 du Code de commerce).</p>
      <p style="margin-top:4px"><strong>Indemnité forfaitaire de recouvrement :</strong> 40 € (art. D.441-5 du Code de commerce).</p>
    </div>
  </div>
</body>
</html>`;
}
