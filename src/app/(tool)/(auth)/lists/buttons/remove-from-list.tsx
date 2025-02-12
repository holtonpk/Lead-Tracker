import React, {useState} from "react";
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
import {Icons} from "@/components/icons";
import {Button} from "@/components/ui/button";
import {Lead} from "@/config/data";
import {arrayRemove, doc, updateDoc} from "firebase/firestore";
import {db} from "@/config/firebase";

export const RemoveFromList = ({
  children,
  companies,
  listId,
  onSuccess,
}: {
  children: React.ReactNode;
  companies: Lead[];
  listId: string;
  onSuccess?: any;
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const [open, setOpen] = useState(false);

  const handleRemoveFromList = async () => {
    setIsLoading(true);

    try {
      // Ensure companies exist and update them
      const updatePromises = (companies ?? []).map(async (company) => {
        await updateDoc(doc(db, `companies/${company.id}`), {
          lists: arrayRemove(listId), // Remove listId from the "lists" array
        });
      });

      // Only await if there are promises to resolve
      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
      }

      console.log("List successfully removed from companies!");
    } catch (error) {
      console.error("Error removing list from companies:", error);
    }

    setIsLoading(false);
    onSuccess?.();
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove from list?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove the selected from this list
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button variant="destructive" onClick={handleRemoveFromList}>
            {isLoading ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                Removing
              </>
            ) : (
              "Remove"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
