"use client";

import {Icons} from "@/components/icons";
import {ContactTypeData, Lead, Task} from "@/config/data";
import {db} from "@/config/firebase";
import React, {useState, useEffect, useCallback} from "react";
import {Button} from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {LinkButton} from "@/components/ui/link";
import {Textarea} from "@/components/ui/textarea";
import {doc, updateDoc} from "firebase/firestore";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {convertTimestampToDate, isValidURL} from "@/lib/utils";
import {format} from "date-fns";
import {Timestamp} from "firebase/firestore";

type LeadTask = Task & {lead: Lead};

interface OutreachTaskDialogProps {
  task: LeadTask;
  isCompleted: boolean;
  onToggleComplete: () => void;
  onDeleteTask: () => void;
  onClose: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export const OutreachTaskDialog = ({
  task,
  isCompleted,
  onToggleComplete,
  onDeleteTask,
  onClose,
  open,
  onOpenChange,
}: OutreachTaskDialogProps) => {
  const [copiedContact, setCopiedContact] = useState<boolean>(false);
  const [copiedDescription, setCopiedDescription] = useState<boolean>(false);
  const [outreachCopy, setOutreachCopy] = useState<string | undefined>(
    task.outreachCopy
  );
  const [notes, setNotes] = useState<string | undefined>(task.lead.notes);

  useEffect(() => {
    setOutreachCopy(task.outreachCopy);
  }, [task]);

  useEffect(() => {
    setNotes(task.lead.notes);
  }, [task.lead]);

  const copyToClipBoard = (copyFunction: any, text: string) => {
    navigator.clipboard.writeText(text);
    copyFunction(true);
    setTimeout(() => {
      copyFunction(false);
    }, 3000);
  };

  // Debounced update functions
  const debouncedUpdateOutreachCopy = useCallback(
    debounce(async (newOutreachCopy: string) => {
      try {
        const docRef = doc(db, "companies", task.lead.id);

        // Update only the specific task's outreach copy
        const updatedTasks = task.lead.tasks?.map((taskItem) =>
          taskItem.id === task.id
            ? {...taskItem, outreachCopy: newOutreachCopy}
            : taskItem
        );

        await updateDoc(docRef, {
          tasks: updatedTasks,
        });
      } catch (error) {
        console.error("Error updating task outreach copy:", error);
      }
    }, 1000),
    [task.lead.id, task.lead.tasks, task.id]
  );

  const debouncedUpdateNotes = useCallback(
    debounce(async (newNotes: string) => {
      try {
        await updateDoc(doc(db, "companies", task.lead.id), {
          notes: newNotes,
        });
      } catch (error) {
        console.error("Error updating lead notes:", error);
      }
    }, 1000),
    [task.lead.id]
  );

  const getFaviconUrl = (url: string) => {
    const cleanedWebsite = (website: string) => {
      if (!website) return "";
      if (website.startsWith("http")) {
        return website;
      }
      return `https://${website}`;
    };
    const domain = new URL(cleanedWebsite(url)).hostname;
    return `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <button className="absolute w-full h-full z-10 left-0 top-0"></button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-1">
            {task.action === "followUp" && "Follow up with"}
            {task.action === "initialContact" && "Reach out to"}{" "}
            {task.contact && (
              <>
                <div className="flex items-center gap-1">
                  {task.contact.photo_url && (
                    <Avatar className="w-5 h-5">
                      <AvatarImage src={task.contact.photo_url} />
                      <AvatarFallback>
                        {task.contact.name
                          .split(" ")
                          .map((name: string) => name[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  {task.contact.name}
                </div>
                on{" "}
                {task.contact.contactPoints.map((point, index) => {
                  return (
                    <React.Fragment key={point.id}>
                      {
                        ContactTypeData.find(
                          (type) => type.value === point.type
                        )?.label
                      }
                      {index < (task.contact?.contactPoints.length || 0) - 1 &&
                        " & "}
                    </React.Fragment>
                  );
                })}
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {task.contact && (
              <>
                {task.contact.name} is the {task.contact.role} of{" "}
                {task.lead.name} you need to{" "}
                {task.action === "followUp" && "Follow up with them"}
                {task.action === "initialContact" &&
                  "Reach out to them"} by{" "}
                {format(convertTimestampToDate(task.date as Timestamp), "PPP")}
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-1">
          <h1>Contact points</h1>
          {task.contact &&
            task.contact.contactPoints.map((point, index) => {
              const Icon = ContactTypeData.find(
                (type) => type.value === point.type
              )?.icon;

              return (
                <div
                  key={point.id}
                  className="border p-2 rounded-md gap-4 items-center max-w-full grid grid-cols-[32px_1fr_200px]"
                >
                  {Icon && <Icon className="h-8 w-8" />}
                  <div className="w-full overflow-hidden text-ellipsis whitespace-nowrap">
                    {point.value}
                  </div>
                  <div className="flex gap-2 ml-auto">
                    {isValidURL(point.value) && (
                      <LinkButton
                        href={point.value}
                        target="_blank"
                        variant={"secondary"}
                      >
                        Open link
                      </LinkButton>
                    )}
                    <Button
                      onClick={() =>
                        copyToClipBoard(setCopiedContact, point.value)
                      }
                      variant={"secondary"}
                    >
                      {copiedContact ? (
                        <>Copied</>
                      ) : (
                        <>
                          <Icons.copy className="h-5 w-5" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
        </div>
        <div className="grid gap-1">
          <h1>Notes</h1>
          <div className="w-full h-[100px] relative">
            <Textarea
              className="h-full overflow-scroll noResize w-full pb-20"
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                debouncedUpdateNotes(e.target.value);
              }}
            />
          </div>
        </div>
        <div className="grid gap-1">
          <div className="flex items-center">
            <h1>Outreach Copy</h1>
          </div>

          <div className="w-full h-[200px] relative">
            <Textarea
              className="h-full overflow-scroll noResize w-full pb-20"
              value={outreachCopy}
              onChange={(e) => {
                setOutreachCopy(e.target.value);
                debouncedUpdateOutreachCopy(e.target.value);
              }}
            />
            <div className="flex gap-2 ml-auto absolute bottom-2 right-2">
              {outreachCopy && (
                <Button
                  onClick={() =>
                    copyToClipBoard(
                      setCopiedDescription,
                      task?.outreachCopy || ""
                    )
                  }
                  variant={"secondary"}
                >
                  {copiedDescription ? (
                    <>Copied</>
                  ) : (
                    <>
                      <Icons.copy className="h-5 w-5" />
                      Copy
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="mr-auto text-destructive" variant={"ghost"}>
                <Icons.trash />
                delete task
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this task?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete
                  this task.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDeleteTask}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Delete Task
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {!isCompleted && (
            <Button
              onClick={onToggleComplete}
              className="bg-green-500 hover:bg-green-600"
            >
              <Icons.check />
              mark as complete
            </Button>
          )}
          {isCompleted && (
            <Button onClick={onToggleComplete} variant={"destructive"}>
              <Icons.close />
              mark as incomplete
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
