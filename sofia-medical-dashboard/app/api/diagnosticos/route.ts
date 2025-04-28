import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

const DB_PATH = path.join(process.cwd(), 'lib/database.json')
const IMG_DIR = path.join(process.cwd(), 'public/img-diagnosticos')

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('imagen') as File | null
    const diagnosticoData = JSON.parse(formData.get('diagnostico') as string)

    // Generar nombre único para la imagen
    const imagenNombre = `diag-${uuidv4()}.${file?.name.split('.').pop()}`
    const imagenPath = path.join(IMG_DIR, imagenNombre)

    // Guardar imagen si existe
    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer())
      fs.writeFileSync(imagenPath, buffer)
      diagnosticoData.imagen = `/img-diagnosticos/${imagenNombre}`
    }

    // Guardar en base de datos
    const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'))
    db.diagnosticos.push(diagnosticoData)
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2))

    return NextResponse.json(diagnosticoData)
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Error al guardar el diagnóstico' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'))
    return NextResponse.json(db.diagnosticos)
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al leer los diagnósticos' },
      { status: 500 }
    )
  }
}
