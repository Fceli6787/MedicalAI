"use client";

import React from "react";
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

interface OnboardingTourDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onNext: () => void;
  onSkip: () => void;
  title: string;
  description: string;
  isLastStep: boolean;
}

export function OnboardingTourDialog({
  isOpen,
  onClose,
  onNext,
  onSkip,
  title,
  description,
  isLastStep,
}: OnboardingTourDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="dark:bg-gray-800 dark:border-gray-700">
        <AlertDialogHeader>
          <AlertDialogTitle className="dark:text-white">{title}</AlertDialogTitle>
          <AlertDialogDescription className="dark:text-gray-400">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="dark:border-t dark:border-gray-700 pt-4">
          <AlertDialogCancel onClick={onSkip} className="dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">Saltar Tour</AlertDialogCancel>
          <AlertDialogAction onClick={onNext} className="bg-teal-600 hover:bg-teal-700 text-white dark:bg-teal-700 dark:hover:bg-teal-600">
            {isLastStep ? "Finalizar Tour" : "Siguiente"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
