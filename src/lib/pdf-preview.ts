export async function openPdfPreview(apiUrl: string) {
  const res = await fetch(apiUrl);
  if (!res.ok) return;
  const html = await res.text();
  const html2pdf = (await import("html2pdf.js")).default;
  const container = document.createElement("div");
  container.setAttribute("data-pdf-render", "");
  container.style.cssText =
    "position:fixed;top:0;left:0;width:210mm;height:0;overflow:hidden;opacity:0;pointer-events:none;";
  container.innerHTML = html;
  document.body.appendChild(container);
  const pdfBlob = await html2pdf()
    .set({
      margin: 0,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        onclone: (clonedDoc: Document) => {
          const c = clonedDoc.querySelector("[data-pdf-render]") as HTMLElement | null;
          if (c) {
            c.style.height = "auto";
            c.style.overflow = "visible";
            c.style.opacity = "1";
          }
        },
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    })
    .from(container)
    .toPdf()
    .output("blob");
  document.body.removeChild(container);
  const blobUrl = URL.createObjectURL(pdfBlob);
  window.open(blobUrl, "_blank");
}
