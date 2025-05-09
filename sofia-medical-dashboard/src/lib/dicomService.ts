import * as dicomParser from "dicom-parser"
import * as cornerstone from "cornerstone-core"

// Interface for DICOM data
// Exportar esta interfaz también si se usa fuera
export interface DicomData {
  pixelData: Uint8Array // Podría ser Uint16Array o Int16Array dependiendo del DICOM
  width: number
  height: number
  windowCenter: number
  windowWidth: number
  slope: number
  intercept: number
  bitsStored: number
  pixelRepresentation: number // 0 = unsigned, 1 = signed
  transferSyntax: string
}

// Error types
interface DicomError {
  success: false
  error: string
}

interface DicomSuccess {
  success: true
  data: DicomData
}

// --- CORRECCIÓN: Añadir export ---
export type DicomResult = DicomError | DicomSuccess

/**
 * Parses a DICOM file and extracts relevant image data
 * @param file DICOM file to parse
 * @returns Parsed DICOM data or error
 */
export const parseDicomFile = async (file: File): Promise<DicomResult> => {
  try {
    // Validate file type
    const isValidDicom = file.name.toLowerCase().endsWith(".dcm") || file.type === "application/dicom"
    if (!isValidDicom) {
      throw new Error("Archivo no es un DICOM válido")
    }

    // Read file as array buffer
    const arrayBuffer = await file.arrayBuffer()
    const byteArray = new Uint8Array(arrayBuffer)
    
    // Parse DICOM dataset
    const dataSet = dicomParser.parseDicom(byteArray)
    
    // Extract image dimensions
    const width = dataSet.uint16("x00280011") || 512
    const height = dataSet.uint16("x00280010") || 512
    
    // Extract pixel data
    const pixelDataElement = dataSet.elements.x7fe00010
    if (!pixelDataElement) {
      throw new Error("No se encontró datos de píxeles en el archivo DICOM")
    }
    
    // IMPORTANTE: Determinar el tipo correcto de pixelData (Uint8, Uint16, Int16)
    // Esto depende de Photometric Interpretation, Bits Allocated, Bits Stored, Pixel Representation
    // Por ahora, mantenemos Uint8Array, pero esto podría necesitar ajustes
    // para una correcta interpretación y aplicación de window/level.
    const pixelData = new Uint8Array(arrayBuffer, pixelDataElement.dataOffset, pixelDataElement.length)
    
    // Extract windowing parameters (con valores por defecto razonables)
    const windowCenter = dataSet.floatString("x00281050") ?? 50 // Usar floatString y ?? para default
    const windowWidth = dataSet.floatString("x00281051") ?? 400 // Usar floatString y ?? para default
    // Usar floatString para slope/intercept y proveer defaults numéricos
    const slope = dataSet.floatString("x00281053") ?? 1 
    const intercept = dataSet.floatString("x00281052") ?? 0
    
    // Extract bit information
    const bitsStored = dataSet.uint16("x00280101") || 16 // Default a 16 si no está presente
    const pixelRepresentation = dataSet.uint16("x00280103") || 0 // 0=unsigned, 1=signed
    
    // Extract transfer syntax
    const transferSyntax = dataSet.string("x00020010") || "1.2.840.10008.1.2" // Default a Implicit VR Little Endian
    
    // Check for compressed DICOM (simplificado, puede necesitar más UIDs)
    if (transferSyntax.startsWith("1.2.840.10008.1.2.4") || transferSyntax.startsWith("1.2.840.10008.1.2.5")) {
       console.warn("Advertencia: Archivo DICOM parece estar comprimido. La visualización podría fallar.");
      // Considerar lanzar error o intentar decodificar si se añaden librerías para ello.
      // throw new Error("Archivos DICOM comprimidos no soportados actualmente.")
    }

    // Configure cornerstone metadata provider (esto es para cornerstone.js, puede no ser necesario si solo conviertes a PNG)
    // cornerstone.metaData.addProvider((type, imageId) => {
    //   if (type === "dicom") return dataSet
    //   return null
    // }, 1000)

    return {
      success: true,
      data: {
        pixelData, // Podría necesitar ser el array buffer original o un array tipado diferente
        width,
        height,
        windowCenter,
        windowWidth,
        slope,
        intercept,
        bitsStored,
        pixelRepresentation,
        transferSyntax
      }
    }
  } catch (error) {
    console.error("Error processing DICOM file:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido al procesar archivo DICOM"
    }
  }
}

/**
 * Applies window/level adjustment to image data (for display purposes, typically 8-bit)
 * NOTE: This implementation assumes input pixelData is already scaled or needs scaling
 * to fit into the 8-bit range for display. The logic might need significant
 * adjustments based on the actual data type and range of the raw DICOM pixelData.
 * @param displayData The Uint8ClampedArray (RGBA) for the canvas ImageData
 * @param rawPixelData The original pixel data array (could be Int16Array, Uint16Array etc.)
 * @param windowCenter Center of the window
 * @param windowWidth Width of the window
 * @param slope Rescale slope
 * @param intercept Rescale intercept
 * @param bitsStored Bits stored in pixel data
 * @param pixelRepresentation Pixel representation type
 */
export const applyWindowLevel = (
  displayData: Uint8ClampedArray, // Target RGBA array for canvas
  rawPixelData: Int16Array | Uint16Array | Uint8Array, // Source pixel data
  width: number,
  height: number,
  windowCenter: number,
  windowWidth: number,
  slope: number,
  intercept: number
): void => {
  
  const numPixels = width * height;
  if (displayData.length !== numPixels * 4) {
      console.error("applyWindowLevel: Mismatch between displayData length and image dimensions.");
      return;
  }
   if (rawPixelData.length !== numPixels) {
      console.error("applyWindowLevel: Mismatch between rawPixelData length and image dimensions.");
      return;
  }

  const wc = windowCenter;
  const ww = windowWidth;
  const lowerBound = wc - ww / 2;
  const upperBound = wc + ww / 2;

  for (let i = 0; i < numPixels; i++) {
    // 1. Get raw pixel value
    let rawValue = rawPixelData[i];
    
    // 2. Apply rescale slope and intercept (HU conversion for CT, etc.)
    let rescaledValue = rawValue * slope + intercept;

    // 3. Apply windowing
    let windowedValue = 0; // Default to black
    if (rescaledValue <= lowerBound) {
      windowedValue = 0;
    } else if (rescaledValue >= upperBound) {
      windowedValue = 255; // White
    } else {
      // Scale linearly within the window
      windowedValue = ((rescaledValue - lowerBound) / ww) * 255;
    }

    // 4. Clamp the value to 0-255
    const clampedValue = Math.max(0, Math.min(255, Math.round(windowedValue)));

    // 5. Set RGBA values in the display buffer
    const idx = i * 4;
    displayData[idx] = clampedValue;     // R
    displayData[idx + 1] = clampedValue; // G
    displayData[idx + 2] = clampedValue; // B
    displayData[idx + 3] = 255;          // A (opaque)
  }
}
