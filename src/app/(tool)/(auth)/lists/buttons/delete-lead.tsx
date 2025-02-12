import React, {useState} from "react";

import {arrayRemove, deleteDoc, doc, updateDoc} from "firebase/firestore";
import {db} from "@/config/firebase";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {Lead} from "@/config/data";
import {Icons} from "@/components/icons";
import {Button} from "@/components/ui/button";

export const DeleteLead = ({
  children,
  leadId,
  onSuccess,
}: {
  children: React.ReactNode;
  leadId: string;
  onSuccess?: any;
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const [open, setOpen] = useState(false);

  const handleDeleteCompany = async () => {
    setIsLoading(true);
    await deleteDoc(doc(db, `companies/${leadId}`));
    onSuccess?.();
    setIsLoading(false);
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this lead?</AlertDialogTitle>
          <AlertDialogDescription>
            This will delete the lead and all the data associated with it
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button variant="destructive" onClick={handleDeleteCompany}>
            {isLoading ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                Deleting
              </>
            ) : (
              "Yes Delete this Lead"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
