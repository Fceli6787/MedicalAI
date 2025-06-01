"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UploadCloud, CheckCircle, XCircle, FileText } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import Swal from 'sweetalert2';

interface BulkUploadDialogProps {
  onUploadSuccess: () => void;
}

interface BulkUploadSummary {
  message: string;
  summary: {
    successfulCount: number;
    failedCount: number;
  };
  details: {
    successful: Array<{ record: any; id_usuario: number }>;
    failed: Array<{ record: any; reason: string; errors: string[] }>;
  };
}

export function BulkUploadDialog({ onUploadSuccess }: BulkUploadDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSummary, setUploadSummary] = useState<BulkUploadSummary | null>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      if (file.type === "text/csv") {
        setSelectedFile(file);
        setUploadSummary(null); // Reset summary on new file selection
      } else {
        setSelectedFile(null);
        toast({
          title: "Tipo de archivo inválido",
          description: "Por favor, seleccione un archivo CSV.",
          variant: "destructive",
        });
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No hay archivo seleccionado",
        description: "Por favor, seleccione un archivo CSV para subir.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadSummary(null);

    const formData = new FormData();
    formData.append("csvFile", selectedFile);

    try {
      const response = await fetch("/api/pacientes/bulk-register", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setUploadSummary(result.summary ? result : { summary: { successfulCount: 0, failedCount: 0 }, details: { successful: [], failed: [] } });
        toast({
          title: "Carga Masiva Completada",
          description: `Se procesaron ${result.summary.successfulCount} pacientes exitosamente y ${result.summary.failedCount} fallaron.`,
          variant: "default",
        });
        onUploadSuccess(); // Trigger data refresh in parent
      } else {
        toast({
          title: "Error en la Carga Masiva",
          description: result.error || "Ocurrió un error al procesar el archivo.",
          variant: "destructive",
        });
        setUploadSummary(result.summary ? result : null); // Show partial summary if available
      }
    } catch (error: any) {
      console.error("Error uploading CSV:", error);
      toast({
        title: "Error de Conexión",
        description: "No se pudo conectar con el servidor para la carga masiva.",
        variant: "destructive",
      });
      setUploadSummary(null);
    } finally {
      setIsUploading(false);
      setSelectedFile(null); // Clear selected file after upload attempt
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedFile(null);
    setUploadSummary(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-600">
          <UploadCloud className="mr-2 h-4 w-4" /> Carga Masiva
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="dark:text-white">Carga Masiva de Pacientes</DialogTitle>
          <DialogDescription className="dark:text-gray-400">
            Suba un archivo CSV para registrar múltiples pacientes a la vez.
            Asegúrese de que el CSV contenga las columnas: `nombre`, `id` (NUI), `contacto` (email o teléfono), `fecha_nacimiento`, `genero`, etc.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="csvFile" className="dark:text-gray-300">Seleccionar Archivo CSV</Label>
            <Input
              id="csvFile"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              disabled={isUploading}
            />
            {selectedFile && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Archivo seleccionado: {selectedFile.name}</p>
            )}
          </div>

          {uploadSummary && (
            <div className="mt-4 p-4 border rounded-md dark:border-gray-700">
              <h3 className="text-lg font-semibold mb-2 dark:text-white">Resumen de Carga</h3>
              <p className="flex items-center text-sm dark:text-gray-300">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                Registros Exitosos: <span className="font-bold ml-1">{uploadSummary.summary.successfulCount}</span>
              </p>
              <p className="flex items-center text-sm dark:text-gray-300">
                <XCircle className="h-4 w-4 text-red-500 mr-2" />
                Registros Fallidos: <span className="font-bold ml-1">{uploadSummary.summary.failedCount}</span>
              </p>

              {uploadSummary.details.failed.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="font-semibold dark:text-white">Detalles de Fallos:</h4>
                  <div className="max-h-48 overflow-y-auto border rounded p-2 dark:border-gray-700 dark:bg-gray-700/30">
                    {uploadSummary.details.failed.map((fail, index) => (
                      <div key={index} className="text-sm text-red-400 mb-1">
                        <p className="font-medium">Registro: {JSON.stringify(fail.record)}</p>
                        <p className="ml-2">Razón: {fail.reason}</p>
                        {fail.errors && fail.errors.length > 0 && (
                          <ul className="list-disc list-inside ml-4">
                            {fail.errors.map((err, errIndex) => (
                              <li key={errIndex}>{err}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <DialogFooter className="dark:border-t dark:border-gray-700 pt-4">
          <Button variant="outline" onClick={handleClose} className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700" disabled={isUploading}>
            Cerrar
          </Button>
          <Button
            onClick={handleUpload}
            className="bg-teal-600 hover:bg-teal-700 text-white dark:bg-teal-700 dark:hover:bg-teal-600"
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Subir CSV
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
