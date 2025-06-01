"use client";

import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: number; // Opcional, si el feedback se asocia a un usuario
  pageContext: string; // Contexto de dónde se envía el feedback (ej. "Dashboard Onboarding Tour")
}

export function FeedbackModal({ isOpen, onClose, userId, pageContext }: FeedbackModalProps) {
  const [feedbackText, setFeedbackText] = useState("");
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);
  const { toast } = useToast();

  const handleSendFeedback = async () => {
    if (!feedbackText.trim()) {
      toast({
        title: "Retroalimentación vacía",
        description: "Por favor, escribe algo antes de enviar tu retroalimentación.",
        variant: "destructive",
      });
      return;
    }

    setIsSendingFeedback(true);
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          feedback: feedbackText,
          page: pageContext,
        }),
      });

      if (response.ok) {
        toast({
          title: "¡Gracias por tu retroalimentación!",
          description: "Hemos recibido tus comentarios.",
          variant: "success",
        });
        setFeedbackText("");
        onClose();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error desconocido al enviar retroalimentación.");
      }
    } catch (error: any) {
      console.error("Error al enviar retroalimentación:", error);
      toast({
        title: "Error al enviar retroalimentación",
        description: error.message || "Hubo un problema al enviar tus comentarios. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSendingFeedback(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="dark:bg-gray-800 dark:border-gray-700">
        <AlertDialogHeader>
          <AlertDialogTitle className="dark:text-white">¡Ayúdanos a Mejorar!</AlertDialogTitle>
          <AlertDialogDescription className="dark:text-gray-400">
            ¿Qué te pareció este tour de bienvenida? Tu opinión es muy valiosa para nosotros.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-4 py-4">
          <Textarea
            placeholder="Escribe aquí tus comentarios..."
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            rows={5}
            className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
          />
        </div>
        <AlertDialogFooter className="dark:border-t dark:border-gray-700 pt-4">
          <AlertDialogCancel onClick={onClose} disabled={isSendingFeedback} className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">Cerrar</AlertDialogCancel>
          <Button onClick={handleSendFeedback} disabled={isSendingFeedback || !feedbackText.trim()} className="bg-teal-600 hover:bg-teal-700 text-white dark:bg-teal-700 dark:hover:bg-teal-600">
            {isSendingFeedback ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isSendingFeedback ? "Enviando..." : "Enviar Retroalimentación"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
