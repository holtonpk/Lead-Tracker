"use client";

import {Icons} from "@/components/icons";
import {
  ContactTypeData,
  Lead,
  Task,
  Contact,
  ContactPoint,
} from "@/config/data";
import {db} from "@/config/firebase";
import React, {useState, useEffect, useCallback} from "react";
import {Button} from "@/components/ui/button";
import {toast} from "sonner";

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
        const docRef = doc(db, "companies-fixed", task.lead.id);

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
        await updateDoc(doc(db, "companies-fixed", task.lead.id), {
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

  const contact = task.lead.contacts?.find(
    (contact) => contact.id === task.contact
  ) as Contact;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <button className="absolute w-full h-full z-10 left-0 top-0"></button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center whitespace-nowrap flex-wrap gap-1">
            {task.action === "followUp" && "Follow up with"}
            {task.action === "initialContact" && "Reach out to"}{" "}
            {task.contact && (
              <>
                <div className="flex items-center gap-1">
                  {contact.photo_url && (
                    <Avatar className="w-5 h-5">
                      <AvatarImage src={contact.photo_url} />
                      <AvatarFallback>
                        {contact.name
                          .split(" ")
                          .map((name: string) => name[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  {contact.name}
                </div>
                on{" "}
                {contact.contactPoints.map((point, index) => {
                  return (
                    <React.Fragment key={point.id}>
                      {
                        ContactTypeData.find(
                          (type) => type.value === point.type
                        )?.label
                      }
                      {index < (contact?.contactPoints.length || 0) - 1 &&
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
                {contact.name} is the {contact.role} of {task.lead.name} you
                need to {task.action === "followUp" && "Follow up with them"}
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
            contact.contactPoints.map((point, index) => (
              <PointRow
                point={point}
                key={index}
                lead={task.lead}
                contact={contact}
              />
            ))}
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

const PointRow = ({
  point,
  lead,
  contact,
}: {
  point: ContactPoint;
  lead: Lead;
  contact: Contact;
}) => {
  const [copiedContact, setCopiedContact] = useState<boolean>(false);

  const copyToClipBoard = (copyFunction: any, text: string) => {
    navigator.clipboard.writeText(text);
    copyFunction(true);
    setTimeout(() => {
      copyFunction(false);
    }, 3000);
  };

  const Icon = ContactTypeData.find((cp) => cp.value == point.type)?.icon;

  const [open, setOpen] = useState(false);

  const [unlocking, setUnlocking] = useState(false);

  const unlockEmail = async () => {
    try {
      setUnlocking(true);
      const url = `/api/unlock-email`;
      const options = {
        method: "POST",
        body: JSON.stringify({id: contact.id}),
      };

      const response = await fetch(url, options);
      console.log("rr", response);
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.person?.email) {
        throw new Error("No email found for this contact");
      }
      console.log(data);

      const unlockedEmail = data.person.email;
      const updatedContacts = [...(lead.contacts || [])];
      const contactIndex = lead.contacts?.findIndex((c) => c.id === contact.id);

      if (contactIndex === undefined || contactIndex === -1) {
        throw new Error("Contact not found");
      }

      // Find the index of the contact point using point.id
      const pointIndex = updatedContacts[contactIndex].contactPoints.findIndex(
        (p) => p.id === point.id
      );

      if (pointIndex === -1) {
        throw new Error("Contact point not found");
      }

      // Update the existing contact point
      updatedContacts[contactIndex].contactPoints[pointIndex] = {
        ...updatedContacts[contactIndex].contactPoints[pointIndex],
        value: unlockedEmail,
      };

      await updateDoc(doc(db, `companies/${lead.id}`), {
        contacts: updatedContacts,
      });
    } catch (error) {
      toast.error("Error unlocking email", {
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    } finally {
      setUnlocking(false);
    }
  };

  return (
    <div className="w-full flex items-center">
      <div
        className={`items-center flex-grow border gap-2 rounded-md shadow-sm p-2  w-full grid   ${
          point.type == "email" &&
          point.value == "email_not_unlocked@domain.com"
            ? "grid-cols-[32px_1fr]"
            : "grid-cols-[32px_1fr_100px]"
        }`}
      >
        {Icon && <Icon className="h-6 w-6 text-primary" />}
        {point.type == "email" &&
        point.value == "email_not_unlocked@domain.com" ? (
          <Button
            onClick={unlockEmail}
            disabled={unlocking}
            variant={"secondary"}
            className="w-full overflow-hidden text-ellipsis whitespace-nowrap"
          >
            {unlocking ? (
              <Icons.loader className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Icons.lock className="h-4 w-4" />
                Unlock email (This will charge credits)
              </>
            )}
          </Button>
        ) : (
          <>
            <div className="w-full overflow-hidden text-ellipsis whitespace-nowrap">
              {point.value}
            </div>

            <Button
              onClick={() => copyToClipBoard(setCopiedContact, point.value)}
              variant={"secondary"}
              className="ml-auto"
            >
              {copiedContact ? (
                <>Copied</>
              ) : (
                <>
                  <Icons.copy className="h-5 w-5 " />
                  Copy
                </>
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
