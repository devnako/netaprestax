export async function openPdfPreview(apiUrl: string) {
  const res = await fetch(apiUrl);
  if (!res.ok) return;
  const html = await res.text();
  const html2pdf = (await import("html2pdf.js")).default;
  const container = document.createElement("div");
  container.innerHTML = html;
  document.body.appendChild(container);
  const el = container.querySelector("body") || container;
  const pdfBlob = await html2pdf()
    .set({
      margin: 0,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    })
    .from(el)
    .toPdf()
    .output("blob");
  document.body.removeChild(container);
  const blobUrl = URL.createObjectURL(pdfBlob);
  window.open(blobUrl, "_blank");
}
