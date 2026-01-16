import type { TextItem } from "pdfjs-dist/types/src/display/api";

export const extractTextFromPdf = async (file: File): Promise<string> => {
  try {
    // Dynamically import pdfjs-dist to avoid SSR ReferenceError (DOMMatrix, etc.)
    const pdfjsLib = await import("pdfjs-dist");

    // Set worker source if not already set
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
    }

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      useSystemFonts: true,
    });
    
    const pdf = await loadingTask.promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
            .map((item) => (item as TextItem).str)
            .join(" ");
        fullText += pageText + " ";
    }

    return fullText.trim();
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw new Error("Failed to parse PDF");
  }
};
