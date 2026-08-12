import { toPng, toJpeg } from "html-to-image";
import { jsPDF } from "jspdf";
import { MM_TO_PX } from "./constants";

export async function exportToPng(node, fileName = "label") {
  if (!node) throw new Error("No label element to export");
  const dataUrl = await toPng(node, {
    pixelRatio: 3,
    backgroundColor: "#ffffff",
  });
  downloadDataUrl(dataUrl, `${fileName}.png`);
}

export async function exportToJpeg(node, fileName = "label") {
  if (!node) throw new Error("No label element to export");
  const dataUrl = await toJpeg(node, {
    pixelRatio: 3,
    backgroundColor: "#ffffff",
    quality: 0.95,
  });
  downloadDataUrl(dataUrl, `${fileName}.jpg`);
}

export async function exportToPdf(node, widthMm, heightMm, fileName = "label") {
  if (!node) throw new Error("No label element to export");
  const dataUrl = await toPng(node, {
    pixelRatio: 3,
    backgroundColor: "#ffffff",
  });
  const pdf = new jsPDF({
    orientation: widthMm >= heightMm ? "landscape" : "portrait",
    unit: "mm",
    format: [widthMm, heightMm],
    compress: true,
  });
  pdf.addImage(dataUrl, "PNG", 0, 0, widthMm, heightMm);
  pdf.save(`${fileName}.pdf`);
}

export function exportToSvg(node, widthMm, heightMm, fileName = "label") {
  if (!node) throw new Error("No label element to export");
  const clone = node.cloneNode(true);
  const pxW = Math.round(widthMm * MM_TO_PX);
  const pxH = Math.round(heightMm * MM_TO_PX);
  clone.style.width = `${pxW}px`;
  clone.style.height = `${pxH}px`;
  clone.style.position = "static";
  clone.style.margin = "0";
  clone.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${pxW}" height="${pxH}" viewBox="0 0 ${pxW} ${pxH}">
      <foreignObject width="100%" height="100%">
        ${clone.outerHTML}
      </foreignObject>
    </svg>
  `;
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileName}.svg`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportDataToCsv(rows, fileName = "labels") {
  if (!rows || rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((r) =>
      headers
        .map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`)
        .join(","),
    ),
  ].join("\n");
  downloadText(csv, `${fileName}.csv`, "text/csv;charset=utf-8");
}

export function exportDataToJson(data, fileName = "labels") {
  downloadText(
    JSON.stringify(data, null, 2),
    `${fileName}.json`,
    "application/json",
  );
}

function downloadDataUrl(dataUrl, fileName) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = fileName;
  a.click();
}

function downloadText(text, fileName, mime) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

export function printElement(node, copies = 1, onAfterPrint) {
  if (!node) return;
  const printRoot = document.getElementById("print-root");
  printRoot.innerHTML = "";
  for (let i = 0; i < copies; i++) {
    const clone = node.cloneNode(true);
    clone.style.margin = "0 auto";
    printRoot.appendChild(clone);
  }
  const onPrintComplete = () => {
    printRoot.innerHTML = "";
    window.removeEventListener("afterprint", onPrintComplete);
    onAfterPrint?.();
  };
  window.addEventListener("afterprint", onPrintComplete);
  window.print();
}
