"use client"

import React, { useState, useEffect, useCallback, memo } from "react" // Agregado React.memo
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Search, Edit, Trash2, FileText, ChevronLeft, ChevronRight, UserPlus, AlertCircle, Loader2, CalendarIcon } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { useToast } from "@/components/ui/use-toast"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import Swal from 'sweetalert2';
import { BulkUploadDialog } from "@/components/bulk-upload-dialog"; // Importar el nuevo componente

import dayjs from 'dayjs';
import 'dayjs/locale/es';
dayjs.locale('es');

interface Paciente {
  id_usuario: number;
  primer_nombre: string;
  primer_apellido: string;
  fecha_nacimiento?: string | number | Date | null;
  genero?: string | null;
  ultimo_diagnostico?: string | null;
  diagnosticosTotales?: number | null;
  segundo_nombre?: string | null;
  segundo_apellido?: string | null;
  email?: string;
  correo?: string;
  telefono_contacto?: string | null;
  direccion_residencial?: string | null;
  tipoDocumentoCodigo?: string;
  tipo_documento_codigo?: string;
  paisCodigo?: string;
  pais_codigo?: string;
  nui?: string;
  grupo_sanguineo?: string | null;
  ocupacion?: string | null;
  info_seguro_medico?: string | null;
  contacto_emergencia?: string | null;
}

interface PatientToDelete extends Paciente {
    fullName: string;
}

const initialPatientFormState = {
    primer_nombre: "",
    segundo_nombre: "",
    primer_apellido: "",
    segundo_apellido: "",
    fecha_nacimiento: "",
    genero: "",
    email: "",
    telefono_contacto: "",
    direccion_residencial: "",
    tipoDocumentoCodigo: "",
    paisCodigo: "",
    nui: "",
    grupo_sanguineo: "",
    ocupacion: "",
    info_seguro_medico: "",
    contacto_emergencia: "",
};

type PatientFormData = typeof initialPatientFormState;

// Funciones de utilidad para fechas (ya estaban fuera, lo cual es bueno)
const normalizeAndGetDateObject = (dateInput: string | number | Date | null | undefined): dayjs.Dayjs | null => {
    if (!dateInput) return null;
    let djsInstance: dayjs.Dayjs;
    if (dayjs.isDayjs(dateInput)) { djsInstance = dateInput; }
    else if (dateInput instanceof Date) { djsInstance = dayjs(dateInput); }
    else if (typeof dateInput === 'string') {
        if (dateInput.match(/^\d{4}$/)) {
            console.warn(`Received year-only string: ${dateInput}. Interpreting as Jan 1st of that year.`);
            djsInstance = dayjs(new Date(parseInt(dateInput, 10), 0, 1));
        } else { djsInstance = dayjs(dateInput); }
    } else if (typeof dateInput === 'number') {
        if (dateInput > 1000 && dateInput < 3000) {
            console.warn(`Received numeric year: ${dateInput}. Interpreting as Jan 1st of that year.`);
            djsInstance = dayjs(new Date(dateInput, 0, 1));
        } else { djsInstance = dayjs(dateInput); }
    } else {
        console.error("Invalid dateInput type provided to normalizeAndGetDateObject:", typeof dateInput, dateInput);
        return null;
    }
    return djsInstance.isValid() ? djsInstance : null;
};

const formatDisplayDate = (dateInput: string | number | Date | null | undefined): string => {
    const dateObj = normalizeAndGetDateObject(dateInput);
    if (!dateObj) return dateInput === null || dateInput === undefined ? "N/A" : "Fecha inválida";
    try { return dateObj.format('DD/MM/YYYY'); }
    catch (e) { console.error("Error in formatDisplayDate formatting with dayjs:", dateInput, e); return "Fecha inválida"; }
};
  
const formatDateForInput = (dateInput: string | number | Date | null | undefined): string => {
    const dateObj = normalizeAndGetDateObject(dateInput);
    if (!dateObj) return "";
    try { return dateObj.format('YYYY-MM-DD'); }
    catch (e) { console.error("Error in formatDateForInput formatting with dayjs:", dateInput, e); return ""; }
};


// 1. Mover PatientFormFields FUERA de PacientesPage y memoizarlo
type PatientFormFieldsProps = {
  formData: PatientFormData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectChange: (value: string, fieldName: keyof PatientFormData) => void;
  handleDateChange: (date: Date | undefined, fieldName: "fecha_nacimiento") => void;
};

const PatientFormFields = memo(({
  formData,
  handleInputChange,
  handleSelectChange,
  handleDateChange
}: PatientFormFieldsProps) => {
  // El contenido de PatientFormFields es el mismo que antes
  return (
    <div className="grid gap-6 py-4">
        {/* Grid for names */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
                <Label htmlFor="primer_nombre" className="dark:text-gray-300">Primer Nombre <span className="text-red-500">*</span></Label>
                <Input 
                    id="primer_nombre" 
                    value={formData.primer_nombre} 
                    onChange={handleInputChange} 
                    placeholder="Ingrese el primer nombre" 
                    required 
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="segundo_nombre" className="dark:text-gray-300">Segundo Nombre</Label>
                <Input 
                    id="segundo_nombre" 
                    value={formData.segundo_nombre || ""} 
                    onChange={handleInputChange} 
                    placeholder="Ingrese el segundo nombre" 
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="primer_apellido" className="dark:text-gray-300">Primer Apellido <span className="text-red-500">*</span></Label>
                <Input 
                    id="primer_apellido" 
                    value={formData.primer_apellido} 
                    onChange={handleInputChange} 
                    placeholder="Ingrese el primer apellido" 
                    required 
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                />
            </div>
        </div>
        {/* Second last name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"> {/* Ajustado a sm:grid-cols-1 si solo es un campo o mantener sm:grid-cols-2 y añadir un placeholder si es necesario */}
            <div className="space-y-2">
                <Label htmlFor="segundo_apellido" className="dark:text-gray-300">Segundo Apellido</Label>
                <Input 
                    id="segundo_apellido" 
                    value={formData.segundo_apellido || ""} 
                    onChange={handleInputChange} 
                    placeholder="Ingrese el segundo apellido" 
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                />
            </div>
            {/* Puedes agregar un div vacío o un campo diferente aquí si quieres mantener la estructura de 2 columnas */}
             <div className="space-y-2 hidden sm:block"> {/* Espacio reservado para mantener diseño, opcional */}
            </div>
        </div>
        {/* Document Type, NUI, Country */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
                <Label htmlFor="tipoDocumentoCodigo" className="dark:text-gray-300">Tipo Documento <span className="text-red-500">*</span></Label>
                <Select onValueChange={(value) => handleSelectChange(value, "tipoDocumentoCodigo")} value={formData.tipoDocumentoCodigo}>
                    <SelectTrigger id="tipoDocumentoCodigo" className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                    <SelectContent className="dark:bg-gray-800 dark:border-gray-700 dark:text-white">
                        <SelectItem value="CC">Cédula de Ciudadanía</SelectItem>
                        <SelectItem value="CE">Cédula de Extranjería</SelectItem>
                        <SelectItem value="PS">Pasaporte</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="nui" className="dark:text-gray-300">NUI <span className="text-red-500">*</span></Label>
                <Input 
                    id="nui" 
                    value={formData.nui} 
                    onChange={handleInputChange} 
                    placeholder="Ingrese el NUI" 
                    required 
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="paisCodigo" className="dark:text-gray-300">País <span className="text-red-500">*</span></Label>
                <Select onValueChange={(value) => handleSelectChange(value, "paisCodigo")} value={formData.paisCodigo}>
                    <SelectTrigger id="paisCodigo" className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"><SelectValue placeholder="Seleccionar país" /></SelectTrigger>
                    <SelectContent className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"><SelectItem value="COL">Colombia</SelectItem></SelectContent>
                </Select>
            </div>
        </div>
        {/* Birth Date, Gender */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="fecha_nacimiento" className="dark:text-gray-300">Fecha de Nacimiento</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal dark:bg-gray-700 dark:border-gray-600 dark:text-white hover:dark:bg-gray-600", !formData.fecha_nacimiento && "text-muted-foreground dark:text-gray-400")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.fecha_nacimiento ? formatDisplayDate(formData.fecha_nacimiento) : <span>Seleccionar fecha</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 dark:bg-gray-800 dark:border-gray-700">
                        <Calendar
                            mode="single"
                            selected={normalizeAndGetDateObject(formData.fecha_nacimiento)?.toDate()}
                            onSelect={(date) => handleDateChange(date, "fecha_nacimiento")}
                            initialFocus captionLayout="dropdown-buttons" fromYear={1900} toYear={new Date().getFullYear()}
                            className="dark:bg-gray-800 dark:text-white"
                            classNames={{
                                caption_label: "dark:text-white",
                                day: "dark:text-white hover:dark:bg-gray-700",
                                day_selected: "dark:bg-teal-600 dark:text-white hover:dark:bg-teal-500",
                                day_today: "dark:text-teal-400",
                                head_cell: "dark:text-gray-400",
                                nav_button: "dark:text-white hover:dark:bg-gray-700",
                                dropdown: "dark:bg-gray-700 dark:border-gray-600 dark:text-white",
                                dropdown_month: "dark:bg-gray-700 dark:text-white",
                                dropdown_year: "dark:bg-gray-700 dark:text-white",
                            }}
                        />
                    </PopoverContent>
                </Popover>
            </div>
            <div className="space-y-2">
                <Label htmlFor="genero" className="dark:text-gray-300">Género</Label>
                <Select onValueChange={(value) => handleSelectChange(value, "genero")} value={formData.genero}>
                    <SelectTrigger id="genero" className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"><SelectValue placeholder="Seleccionar género" /></SelectTrigger>
                    <SelectContent className="dark:bg-gray-800 dark:border-gray-700 dark:text-white">
                        <SelectItem value="Masculino">Masculino</SelectItem>
                        <SelectItem value="Femenino">Femenino</SelectItem>
                        <SelectItem value="Otro">Otro</SelectItem>
                        <SelectItem value="No especificado">Prefiero no decir</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
        {/* Email */}
        <div className="space-y-2">
            <Label htmlFor="email" className="dark:text-gray-300">Correo Electrónico <span className="text-red-500">*</span></Label>
            <Input 
                id="email" 
                type="email" 
                value={formData.email} 
                onChange={handleInputChange} 
                placeholder="paciente@ejemplo.com" 
                required 
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
            />
        </div>
        {/* Phone, Address */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="telefono_contacto" className="dark:text-gray-300">Teléfono</Label>
                <Input 
                    id="telefono_contacto" 
                    value={formData.telefono_contacto || ""} 
                    onChange={handleInputChange} 
                    placeholder="Ej: 3001234567" 
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="direccion_residencial" className="dark:text-gray-300">Dirección</Label>
                <Input 
                    id="direccion_residencial" 
                    value={formData.direccion_residencial || ""} 
                    onChange={handleInputChange} 
                    placeholder="Ej: Calle 10 # 20-30" 
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                />
            </div>
        </div>
        {/* Blood Type, Occupation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="grupo_sanguineo" className="dark:text-gray-300">Grupo Sanguíneo</Label>
                <Select onValueChange={(value) => handleSelectChange(value, "grupo_sanguineo")} value={formData.grupo_sanguineo || ""}>
                    <SelectTrigger id="grupo_sanguineo" className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"><SelectValue placeholder="Seleccionar grupo" /></SelectTrigger>
                    <SelectContent className="dark:bg-gray-800 dark:border-gray-700 dark:text-white">
                        <SelectItem value="A+">A+</SelectItem> <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem> <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem> <SelectItem value="AB-">AB-</SelectItem>
                        <SelectItem value="O+">O+</SelectItem> <SelectItem value="O-">O-</SelectItem>
                        <SelectItem value="Desconocido">Desconocido</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="ocupacion" className="dark:text-gray-300">Ocupación</Label>
                <Input 
                    id="ocupacion" 
                    value={formData.ocupacion || ""} 
                    onChange={handleInputChange} 
                    placeholder="Ej: Ingeniero" 
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                />
            </div>
        </div>
        {/* Medical Insurance, Emergency Contact */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="info_seguro_medico" className="dark:text-gray-300">Información Seguro Médico</Label>
                <Select onValueChange={(value) => handleSelectChange(value, "info_seguro_medico")} value={formData.info_seguro_medico || ""}>
                    <SelectTrigger id="info_seguro_medico" className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"><SelectValue placeholder="Seleccionar seguro" /></SelectTrigger>
                    <SelectContent className="dark:bg-gray-800 dark:border-gray-700 dark:text-white">
                        <SelectItem value="EPS Sura">EPS Sura</SelectItem>
                        <SelectItem value="EPS Sanitas">EPS Sanitas</SelectItem>
                        <SelectItem value="EPS Nueva EPS">EPS Nueva EPS</SelectItem>
                        <SelectItem value="Medicina Prepagada Colsanitas">Medicina Prepagada Colsanitas</SelectItem>
                        <SelectItem value="Particular">Particular</SelectItem>
                        <SelectItem value="Otro">Otro</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="contacto_emergencia" className="dark:text-gray-300">Contacto de Emergencia</Label>
                <Input 
                    id="contacto_emergencia" 
                    value={formData.contacto_emergencia || ""} 
                    onChange={handleInputChange} 
                    placeholder="Nombre y Teléfono" 
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                />
            </div>
        </div>
    </div>
  );
});
PatientFormFields.displayName = 'PatientFormFields'; // Buena práctica para debugging


export default function PacientesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [loadingPacientes, setLoadingPacientes] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newPatient, setNewPatient] = useState<PatientFormData>({...initialPatientFormState})

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingPatient, setEditingPatient] = useState<Paciente | null>(null)
  const [editingPatientFormData, setEditingPatientFormData] = useState<PatientFormData>({...initialPatientFormState})
  const [isLoadingEditData, setIsLoadingEditData] = useState(false)
  const [isSavingAddData, setIsSavingAddData] = useState(false)
  const [isSavingEditData, setIsSavingEditData] = useState(false)

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [patientToDelete, setPatientToDelete] = useState<PatientToDelete | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const itemsPerPage = 10

  const fetchData = useCallback(async () => {
    if (!user || user.rol === "paciente") {
      setError(user && user.rol === "paciente" ? "No tiene permisos para acceder a esta página." : null)
      setLoadingPacientes(false)
      setPacientes([])
      return
    }
    setLoadingPacientes(true)
    setError(null)
    try {
      const response = await fetch("/api/dashboard/pacientes")
      const data = await response.json()
      if (response.ok && data.pacientes) {
        const processedPacientes = data.pacientes.map((p: any) => {
            let fn_string: string | null = null;
            if (p.fecha_nacimiento) {
                const dateObj = normalizeAndGetDateObject(p.fecha_nacimiento);
                if (dateObj) { fn_string = dateObj.format('YYYY-MM-DD'); }
                else { console.warn(`Invalid fecha_nacimiento from API for patient ${p.id_usuario}: ${p.fecha_nacimiento}. Setting to null.`); }
            }
            return { ...p, fecha_nacimiento: fn_string, email: p.email || p.correo, tipoDocumentoCodigo: p.tipoDocumentoCodigo || p.tipo_documento_codigo, paisCodigo: p.paisCodigo || p.pais_codigo, };
        });
        setPacientes(processedPacientes as Paciente[]);
      } else {
        setError(data.error || "Error al cargar los pacientes.")
        setPacientes([])
      }
    } catch (err) {
      console.error("Error fetching patients:", err)
      setError("No se pudo conectar al servidor para cargar los pacientes.")
      setPacientes([])
    } finally {
      setLoadingPacientes(false)
    }
  }, [user]) // fetchData depende de user

  useEffect(() => {
    if (!authLoading) {
      fetchData()
    }
  }, [user, authLoading, fetchData])

  const filteredPacientes = pacientes.filter((paciente) => {
    const fullName = `${paciente.primer_nombre} ${paciente.primer_apellido}`.toLowerCase()
    const idString = paciente.id_usuario?.toString().toLowerCase() || ""
    const searchTermLower = searchTerm.toLowerCase()
    return fullName.includes(searchTermLower) || idString.includes(searchTermLower)
  })

  const totalPages = Math.ceil(filteredPacientes.length / itemsPerPage)
  const paginatedPacientes = filteredPacientes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
    }
  }

  // 2. Usar useCallback para los manejadores de eventos del formulario
  const handleNewPatientInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target as { id: keyof PatientFormData, value: string };
    setNewPatient((prev) => ({ ...prev, [id]: value }));
  }, []); // setNewPatient es estable

  const handleNewPatientSelectChange = useCallback((value: string, fieldName: keyof PatientFormData) => {
    setNewPatient((prev) => ({ ...prev, [fieldName]: value }));
  }, []); // setNewPatient es estable

  const handleNewPatientDateChange = useCallback((date: Date | undefined, fieldName: "fecha_nacimiento") => {
    setNewPatient(prev => ({ ...prev, [fieldName]: date ? dayjs(date).format('YYYY-MM-DD') : "" }));
  }, []); // setNewPatient es estable

  const handleAddPatientSubmit = async () => {
    // Validación robusta usando trim() para los campos de texto
    if (!newPatient.primer_nombre?.trim() || 
        !newPatient.primer_apellido?.trim() || 
        !newPatient.tipoDocumentoCodigo || 
        !newPatient.paisCodigo || 
        !newPatient.email?.trim() || 
                !newPatient.nui?.trim()) {
        toast({ title: "Campos Requeridos", description: "Por favor, complete todos los campos obligatorios (nombre, apellido, tipo documento, país, email, NUI).", variant: "destructive" });
        return;
    }
    const temporaryPassword = Math.random().toString(36).slice(-8);
    const patientDataForApi = {
      ...newPatient,
      password: temporaryPassword,
      roles: ['paciente']
    };
    try {
      setIsSavingAddData(true);
      const response = await fetch("/api/pacientes/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patientDataForApi),
      });
      const result = await response.json();
      setIsSavingEditData(false);

      if (response.ok) {
        setIsAddDialogOpen(false);
        setNewPatient({...initialPatientFormState});
        fetchData();

        Swal.fire({
          icon: 'success',
          title: '¡Paciente Registrado!',
          text: `El paciente ${newPatient.primer_nombre} ${newPatient.primer_apellido} ha sido guardado exitosamente.`,
          showConfirmButton: false,
          timer: 2000
        });
      } else {
        Swal.fire({ icon: 'error', title: 'Error al agregar paciente', text: result.error || "Ocurrió un error al registrar el paciente." });
      }
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error de conexión', text: "No se pudo conectar con el servidor para registrar el paciente." });
    } finally {
      setIsSavingEditData(false);
    }
  };

  const handleOpenEditDialog = async (pacienteId: number) => {
    setIsLoadingEditData(true);
    setIsEditDialogOpen(true);
    setEditingPatient(null);
    setEditingPatientFormData({...initialPatientFormState});
    try {
        const currentPatientFull = pacientes.find(p => p.id_usuario === pacienteId);
        if (currentPatientFull) {
            setEditingPatient(currentPatientFull);
            setEditingPatientFormData({
                primer_nombre: currentPatientFull.primer_nombre || "",
                segundo_nombre: currentPatientFull.segundo_nombre || "",
                primer_apellido: currentPatientFull.primer_apellido || "",
                segundo_apellido: currentPatientFull.segundo_apellido || "",
                fecha_nacimiento: formatDateForInput(currentPatientFull.fecha_nacimiento),
                genero: currentPatientFull.genero || "",
                email: currentPatientFull.email || currentPatientFull.correo || "",
                telefono_contacto: currentPatientFull.telefono_contacto || "",
                direccion_residencial: currentPatientFull.direccion_residencial || "",
                tipoDocumentoCodigo: currentPatientFull.tipoDocumentoCodigo || currentPatientFull.tipo_documento_codigo || "",
                paisCodigo: currentPatientFull.paisCodigo || currentPatientFull.pais_codigo || "",
                nui: currentPatientFull.nui || "",
                grupo_sanguineo: currentPatientFull.grupo_sanguineo || "",
                ocupacion: currentPatientFull.ocupacion || "",
                info_seguro_medico: currentPatientFull.info_seguro_medico || "",
                contacto_emergencia: currentPatientFull.contacto_emergencia || "",
            });
            setIsLoadingEditData(false); return;
        }
        const response = await fetch(`/api/dashboard/pacientes/${pacienteId}`);
        const data = await response.json();
        if (response.ok && data.paciente) {
            const fetchedPatient: Paciente = data.paciente;
            setEditingPatient(fetchedPatient);
            setEditingPatientFormData({
                primer_nombre: fetchedPatient.primer_nombre || "",
                segundo_nombre: fetchedPatient.segundo_nombre || "",
                primer_apellido: fetchedPatient.primer_apellido || "",
                segundo_apellido: fetchedPatient.segundo_apellido || "",
                fecha_nacimiento: formatDateForInput(fetchedPatient.fecha_nacimiento),
                genero: fetchedPatient.genero || "",
                email: fetchedPatient.email || fetchedPatient.correo || "",
                telefono_contacto: fetchedPatient.telefono_contacto || "",
                direccion_residencial: fetchedPatient.direccion_residencial || "",
                tipoDocumentoCodigo: fetchedPatient.tipoDocumentoCodigo || fetchedPatient.tipo_documento_codigo || "",
                paisCodigo: fetchedPatient.paisCodigo || fetchedPatient.pais_codigo || "",
                nui: fetchedPatient.nui || "",
                grupo_sanguineo: fetchedPatient.grupo_sanguineo || "",
                ocupacion: fetchedPatient.ocupacion || "",
                info_seguro_medico: fetchedPatient.info_seguro_medico || "",
                contacto_emergencia: fetchedPatient.contacto_emergencia || "",
            });
        } else {
            toast({ title: "Error", description: data.error || "No se pudieron cargar los datos del paciente.", variant: "destructive" });
            setIsEditDialogOpen(false);
        }
    } catch (error) {
        toast({ title: "Error de conexión", description: "No se pudo conectar para cargar datos del paciente.", variant: "destructive" });
        setIsEditDialogOpen(false);
    } finally {
        setIsLoadingEditData(false);
    }
  };

  const handleEditingPatientInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target as { id: keyof PatientFormData, value: string };
    setEditingPatientFormData((prev) => ({ ...prev, [id]: value }));
  }, []); // setEditingPatientFormData es estable

  const handleEditingPatientSelectChange = useCallback((value: string, fieldName: keyof PatientFormData) => {
    setEditingPatientFormData((prev) => ({ ...prev, [fieldName]: value }));
  }, []); // setEditingPatientFormData es estable

  const handleEditingPatientDateChange = useCallback((date: Date | undefined, fieldName: "fecha_nacimiento") => {
    setEditingPatientFormData(prev => ({ ...prev, [fieldName]: date ? dayjs(date).format('YYYY-MM-DD') : "" }));
  }, []); // setEditingPatientFormData es estable

  const handleEditPatientSubmit = async () => {
    if (!editingPatient || !editingPatientFormData.primer_nombre || !editingPatientFormData.primer_apellido || !editingPatientFormData.tipoDocumentoCodigo || !editingPatientFormData.paisCodigo || !editingPatientFormData.email || !editingPatientFormData.nui) {
        toast({ title: "Campos Requeridos", description: "Por favor, complete todos los campos obligatorios para la edición.", variant: "destructive" });
        return;
    }
    const dataToUpdate: Partial<PatientFormData> = { ...editingPatientFormData };
    setIsSavingEditData(true);
    try {
        const response = await fetch(`/api/dashboard/pacientes/${editingPatient.id_usuario}`, {
            method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dataToUpdate),
        });
        const result = await response.json();
        if (response.ok) {
            toast({ title: "Paciente Actualizado", description: `Los datos de ${editingPatientFormData.primer_nombre} ${editingPatientFormData.primer_apellido} han sido actualizados.`, variant: "default" });
            setIsEditDialogOpen(false); setEditingPatient(null); fetchData();
        } else {
            toast({ title: "Error al actualizar", description: result.error || "Ocurrió un error.", variant: "destructive" });
        }
    } catch (error) {
        toast({ title: "Error de conexión", description: "No se pudo conectar para actualizar el paciente.", variant: "destructive" });
    } finally {
        setIsSavingEditData(false);
    }
  };

  const handleViewHistory = (patientId: number) => { router.push(`/dashboard/historial?pacienteId=${patientId}`); };
  const handleOpenDeleteDialog = (paciente: Paciente) => { setPatientToDelete({ ...paciente, fullName: `${paciente.primer_nombre} ${paciente.primer_apellido}` }); setIsDeleteDialogOpen(true); };
  const handleCloseDeleteDialog = () => { setIsDeleteDialogOpen(false); setPatientToDelete(null); };
  const handleConfirmDelete = async () => {
    if (!patientToDelete) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/dashboard/pacientes/${patientToDelete.id_usuario}`, { method: "DELETE" });
      const result = await response.json();
      if (response.ok) {
        toast({ title: "Paciente Eliminado", description: `El paciente ${patientToDelete.fullName} ha sido eliminado.`, variant: "default" });
        fetchData();
      } else { toast({ title: "Error al eliminar", description: result.error || "Ocurrió un error.", variant: "destructive" }); }
    } catch (error) { toast({ title: "Error de conexión", description: "No se pudo conectar para eliminar el paciente.", variant: "destructive" }); }
    finally { setIsDeleting(false); handleCloseDeleteDialog(); }
  };

  if (authLoading) {
    return ( <div className="flex items-center justify-center min-h-screen w-full p-6 bg-white dark:bg-gray-900"> <Loader2 className="h-8 w-8 animate-spin text-teal-600" /> <span className="ml-2 text-gray-600 dark:text-gray-300">Verificando autenticación...</span> </div> )
  }
  if (!user || user.rol === "paciente") {
    return ( <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] w-full p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg"> <AlertCircle className="h-12 w-12 text-red-500 dark:text-red-400 mb-4" /> <h2 className="text-xl font-semibold text-red-700 dark:text-red-300 mb-2">Acceso Denegado</h2> <p className="text-red-600 dark:text-red-400 text-center">No tiene los permisos necesarios para ver esta sección.</p> </div> )
  }

  // PatientFormFields ya NO se define aquí. Se usa el que está fuera.

  return (
    <div className="p-6 space-y-6 w-full bg-white dark:bg-gray-900 min-h-screen">
      {/* Header y Botón "Nuevo Paciente" */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Gestión de Pacientes</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Administre la información y registros de sus pacientes.</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-teal-600 hover:bg-teal-700 text-white dark:bg-teal-700 dark:hover:bg-teal-600 w-full sm:w-auto">
              <UserPlus className="mr-2 h-4 w-4" /> Nuevo Paciente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="dark:text-white">Agregar Nuevo Paciente</DialogTitle>
              <DialogDescription className="dark:text-gray-400">Complete los detalles. Haga clic en guardar al finalizar.</DialogDescription>
            </DialogHeader>
            <PatientFormFields
                formData={newPatient}
                handleInputChange={handleNewPatientInputChange}
                handleSelectChange={handleNewPatientSelectChange}
                handleDateChange={handleNewPatientDateChange} // Actualizado para usar la función memoizada
            />
            <DialogFooter className="dark:border-t dark:border-gray-700 pt-4">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">Cancelar</Button>
              <Button
                onClick={handleAddPatientSubmit}
                className="bg-teal-600 hover:bg-teal-700 text-white dark:bg-teal-700 dark:hover:bg-teal-600"
                disabled={
                  isSavingAddData ||
                  !newPatient.primer_nombre?.trim() ||
                  !newPatient.primer_apellido?.trim() ||
                  !newPatient.tipoDocumentoCodigo ||
                  !newPatient.paisCodigo ||
                  !newPatient.email?.trim() ||
                  !newPatient.nui?.trim()
                }
              >
                {isSavingAddData ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Guardar Paciente
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Diálogo para Editar Paciente */}
      <Dialog open={isEditDialogOpen} onOpenChange={(isOpen) => {
          setIsEditDialogOpen(isOpen);
          if (!isOpen) { setEditingPatient(null); setEditingPatientFormData({...initialPatientFormState}); }
      }}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Editar Paciente</DialogTitle>
            <DialogDescription className="dark:text-gray-400">Modifique los detalles del paciente. Haga clic en guardar para aplicar los cambios.</DialogDescription>
          </DialogHeader>
          {isLoadingEditData ? (
              <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-teal-600" /></div>
          ) : editingPatient && (
              <PatientFormFields
                  formData={editingPatientFormData}
                  handleInputChange={handleEditingPatientInputChange}
                  handleSelectChange={handleEditingPatientSelectChange}
                  handleDateChange={handleEditingPatientDateChange} // Actualizado
              />
          )}
          <DialogFooter className="dark:border-t dark:border-gray-700 pt-4">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">Cancelar</Button>
              <Button onClick={handleEditPatientSubmit} className="bg-teal-600 hover:bg-teal-700 text-white dark:bg-teal-700 dark:hover:bg-teal-600" disabled={isLoadingEditData || isSavingEditData || !editingPatientFormData.primer_nombre || !editingPatientFormData.primer_apellido || !editingPatientFormData.tipoDocumentoCodigo || !editingPatientFormData.paisCodigo || !editingPatientFormData.email || !editingPatientFormData.nui}>
                  {isSavingEditData ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Guardar Cambios
              </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tabla de Pacientes */}
      <Card className="border-gray-200 dark:border-gray-700 shadow-sm dark:bg-gray-800">
        <CardHeader className="dark:border-b dark:border-gray-700">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="dark:text-white">Lista de Pacientes</CardTitle>
              <CardDescription className="mt-1 dark:text-gray-400">
                {loadingPacientes && !error ? "Cargando pacientes..." : `${filteredPacientes.length} paciente(s) encontrado(s)`}
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <Input placeholder="Buscar por nombre o ID..." className="pl-8 w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} disabled={loadingPacientes && !error} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs defaultValue="todos" className="space-y-4">
            <TabsList className="dark:bg-gray-700">
              <TabsTrigger value="todos" className="dark:data-[state=active]:bg-teal-600 dark:data-[state=active]:text-white dark:text-gray-300">Todos</TabsTrigger>
              <TabsTrigger value="recientes" disabled className="dark:text-gray-500">Recientes (Próximamente)</TabsTrigger>
              <TabsTrigger value="sin-diagnostico" disabled className="dark:text-gray-500">Sin Diagnóstico (Próximamente)</TabsTrigger>
            </TabsList>
            <TabsContent value="todos" className="space-y-4">
              {error && !loadingPacientes && ( <div className="rounded-md border border-red-200 bg-red-50 p-4 flex items-center gap-3 text-red-700 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300"> <AlertCircle className="h-5 w-5" /> <p className="text-sm font-medium">{error}</p> </div> )}
              <div className="rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gray-50 dark:bg-gray-700/60">
                      <TableRow className="dark:border-gray-600">
                        <TableHead className="w-[80px] px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID</TableHead>
                        <TableHead className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nombre Completo</TableHead>
                        <TableHead className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fecha Nac.</TableHead>
                        <TableHead className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Género</TableHead>
                        <TableHead className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Último Diag.</TableHead>
                        <TableHead className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider text-center">Total Diag.</TableHead>
                        <TableHead className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="dark:divide-gray-700">
                      {loadingPacientes && ( <TableRow><TableCell colSpan={7} className="h-32 text-center dark:border-gray-700"> <div className="flex justify-center items-center text-gray-500 dark:text-gray-400"> <Loader2 className="h-5 w-5 animate-spin mr-2" />Cargando datos... </div> </TableCell></TableRow> )}
                      {!loadingPacientes && !error && paginatedPacientes.length === 0 && ( <TableRow><TableCell colSpan={7} className="h-32 text-center text-gray-500 dark:text-gray-400 dark:border-gray-700"> No se encontraron pacientes {searchTerm ? "que coincidan con la búsqueda." : "."} </TableCell></TableRow> )}
                      {!loadingPacientes && !error && paginatedPacientes.map((paciente) => (
                        <TableRow key={paciente.id_usuario} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 dark:border-gray-700">
                          <TableCell className="px-4 py-3 font-medium text-gray-900 dark:text-teal-400 whitespace-nowrap">{paciente.id_usuario}</TableCell>
                          <TableCell className="px-4 py-3 text-gray-700 dark:text-gray-200 whitespace-nowrap">{`${paciente.primer_nombre} ${paciente.primer_apellido}`}</TableCell>
                          <TableCell className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDisplayDate(paciente.fecha_nacimiento)}</TableCell>
                          <TableCell className="px-4 py-3 text-gray-500 dark:text-gray-400 capitalize">{paciente.genero ?? "N/A"}</TableCell>
                          <TableCell className="px-4 py-3 text-gray-500 dark:text-gray-400"> {paciente.ultimo_diagnostico ? (<span className="text-sm">{paciente.ultimo_diagnostico}</span>) : (<Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-600 dark:bg-amber-900/50 dark:text-amber-300 font-normal text-xs py-0.5 px-2">Sin diagnóstico</Badge>)} </TableCell>
                          <TableCell className="px-4 py-3 text-gray-500 dark:text-gray-400 text-center">{paciente.diagnosticosTotales ?? 0}</TableCell>
                          <TableCell className="px-4 py-3 text-right whitespace-nowrap">
                            <div className="flex justify-end items-center space-x-1">
                              <Button variant="ghost" size="icon" className="text-gray-500 hover:text-blue-600 hover:bg-blue-100 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-gray-700" title="Ver historial" onClick={() => handleViewHistory(paciente.id_usuario)}><FileText className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" className="text-gray-500 hover:text-yellow-600 hover:bg-yellow-100 dark:text-gray-400 dark:hover:text-yellow-400 dark:hover:bg-gray-700" title="Editar paciente" onClick={() => handleOpenEditDialog(paciente.id_usuario)}><Edit className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" className="text-gray-500 hover:text-red-600 hover:bg-red-100 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-gray-700" title="Eliminar paciente" onClick={() => handleOpenDeleteDialog(paciente)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              {/* Controles de Paginación */}
              {!loadingPacientes && !error && filteredPacientes.length > itemsPerPage && (
                <div className="flex flex-col sm:flex-row items-center justify-between pt-4 gap-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400"> Mostrando {(currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, filteredPacientes.length)} de {filteredPacientes.length} pacientes </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="icon" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} aria-label="Página anterior" className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"><ChevronLeft className="h-4 w-4" /></Button>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-200">Página {currentPage} de {totalPages}</div>
                    <Button variant="outline" size="icon" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} aria-label="Página siguiente" className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"><ChevronRight className="h-4 w-4" /></Button>
                  </div>
                </div>
              )}
            </TabsContent>
            <TabsContent value="recientes"><p className="text-center text-gray-500 dark:text-gray-400 py-10">Funcionalidad de pacientes recientes estará disponible pronto.</p></TabsContent>
            <TabsContent value="sin-diagnostico"><p className="text-center text-gray-500 dark:text-gray-400 py-10">Funcionalidad de pacientes sin diagnóstico estará disponible pronto.</p></TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* AlertDialog para Confirmar Eliminación */}
      {patientToDelete && (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent className="dark:bg-gray-800 dark:border-gray-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="dark:text-white">¿Está seguro de eliminar este paciente?</AlertDialogTitle>
              <AlertDialogDescription className="dark:text-gray-400"> Esta acción no se puede deshacer. Se eliminará permanentemente el paciente{" "} <strong className="dark:text-gray-200">{patientToDelete.fullName}</strong> y todos sus datos asociados. </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="dark:border-t dark:border-gray-700 pt-4">
              <AlertDialogCancel onClick={handleCloseDeleteDialog} disabled={isDeleting} className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700 text-white dark:bg-red-700 dark:hover:bg-red-600"> {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Eliminar </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
