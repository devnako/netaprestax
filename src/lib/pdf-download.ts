export async function downloadPdf(htmlContent: string, filename: string) {
  const html2pdf = (await import("html2pdf.js")).default;
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "0";
  container.style.top = "0";
  container.style.visibility = "hidden";
  container.style.pointerEvents = "none";
  container.innerHTML = htmlContent;
  document.body.appendChild(container);
  const el = container.querySelector("body") || container;
  try {
    await html2pdf()
      .set({
        margin: 0,
        filename,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          onclone: (_doc: Document, clonedEl: HTMLElement) => {
            clonedEl.style.visibility = "visible";
          },
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(el)
      .save();
  } finally {
    document.body.removeChild(container);
  }
}
