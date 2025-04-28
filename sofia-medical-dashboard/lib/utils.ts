import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function saveDiagnostico(formData: FormData) {
  try {
    const response = await fetch('/api/diagnosticos', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error('Error al guardar el diagnóstico')
    }

    return await response.json()
  } catch (error) {
    console.error('Error:', error)
    throw error
  }
}

export async function getDiagnosticos() {
  try {
    const response = await fetch('/api/diagnosticos')
    if (!response.ok) {
      throw new Error('Error al obtener los diagnósticos')
    }
    return await response.json()
  } catch (error) {
    console.error('Error:', error)
    throw error
  }
}

interface Diagnostico {
  id: string
  pacienteId: string
  pacienteNombre: string
  fecha: string
  confianza: number
  diagnostico: string
  [key: string]: any
}

export async function getTotalDiagnosticos(): Promise<number> {
  const diagnosticos: Diagnostico[] = await getDiagnosticos()
  return diagnosticos.length
}

export async function getTotalPacientes(): Promise<number> {
  const diagnosticos: Diagnostico[] = await getDiagnosticos()
  const pacientesUnicos = new Set(diagnosticos.map((d: Diagnostico) => d.pacienteId))
  return pacientesUnicos.size
}

export async function getPrecisionPromedio(): Promise<number> {
  const diagnosticos: Diagnostico[] = await getDiagnosticos()
  if (diagnosticos.length === 0) return 0
  const suma = diagnosticos.reduce((acc: number, d: Diagnostico) => acc + (d.confianza || 0), 0)
  return Math.round((suma / diagnosticos.length) * 10) / 10
}

export async function getUltimosDiagnosticos(limit = 5): Promise<Diagnostico[]> {
  const diagnosticos: Diagnostico[] = await getDiagnosticos()
  return diagnosticos
    .sort((a: Diagnostico, b: Diagnostico) => 
      new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    )
    .slice(0, limit)
}
