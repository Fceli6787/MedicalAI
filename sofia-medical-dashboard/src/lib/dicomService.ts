import * as dicomParser from "dicom-parser"
import * as cornerstone from "cornerstone-core"

// Interface for DICOM data
interface DicomData {
  pixelData: Uint8Array
  width: number
  height: number
  windowCenter: number
  windowWidth: number
  slope: number
  intercept: number
  bitsStored: number
  pixelRepresentation: number
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

type DicomResult = DicomError | DicomSuccess

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
    
    const pixelData = new Uint8Array(arrayBuffer, pixelDataElement.dataOffset, pixelDataElement.length)
    
    // Extract windowing parameters
    const windowCenter = dataSet.int16("x00281050") || 50
    const windowWidth = dataSet.int16("x00281051") || 400
    const slope = Number.parseFloat(dataSet.string("x00281053") || "1")
    const intercept = Number.parseFloat(dataSet.string("x00281052") || "0")
    
    // Extract bit information
    const bitsStored = dataSet.uint16("x00280101") || 16
    const pixelRepresentation = dataSet.uint16("x00280103") || 0
    
    // Extract transfer syntax
    const transferSyntax = dataSet.string("x00020010") || "1.2.840.10008.1.2"
    
    // Check for compressed DICOM
    if (transferSyntax.includes("1.2.840.10008.1.2.4")) {
      throw new Error("Archivos DICOM comprimidos no soportados. Use un archivo sin compresión.")
    }

    // Configure cornerstone metadata provider
    cornerstone.metaData.addProvider((type, imageId) => {
      if (type === "dicom") return dataSet
      return null
    }, 1000)

    return {
      success: true,
      data: {
        pixelData,
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
 * Applies window/level adjustment to image data
 * @param data Image data to adjust
 * @param windowCenter Center of the window
 * @param windowWidth Width of the window
 * @param slope Rescale slope
 * @param intercept Rescale intercept
 * @param bitsStored Bits stored in pixel data
 * @param pixelRepresentation Pixel representation type
 */
export const applyWindowLevel = (
  data: Uint8ClampedArray,
  windowCenter: number,
  windowWidth: number,
  slope: number,
  intercept: number,
  bitsStored: number,
  pixelRepresentation: number
): void => {
  const maxValue = Math.pow(2, bitsStored) - 1
  const minValue = pixelRepresentation === 1 ? -maxValue / 2 : 0
  
  for (let i = 0; i < data.length; i += 4) {
    let value = data[i] * slope + intercept
    value = Math.max(minValue, Math.min(maxValue, value))
    
    const windowMin = windowCenter - windowWidth / 2
    const windowMax = windowCenter + windowWidth / 2
    
    let normalized = 0
    if (value <= windowMin) {
      normalized = 0
    } else if (value >= windowMax) {
      normalized = 255
    } else {
      normalized = Math.round(((value - windowMin) / windowWidth) * 255)
    }
    
    data[i] = data[i + 1] = data[i + 2] = normalized
    data[i + 3] = 255
  }
}
