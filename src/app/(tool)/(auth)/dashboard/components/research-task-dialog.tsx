"use client";

import {Icons} from "@/components/icons";
import {Lead, Task, Contact} from "@/config/data";
import {db} from "@/config/firebase";
import React, {useState, useEffect, useCallback} from "react";
import {Button} from "@/components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {doc, updateDoc, serverTimestamp, Timestamp} from "firebase/firestore";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {convertDateToTimestamp, convertTimestampToDate} from "@/lib/utils";
import {NewContactButton} from "@/app/(tool)/(auth)/lists/lead/contact/create-contact";
import {ContactRow} from "@/app/(tool)/(auth)/lists/lead/contact/contact-display";

type LeadTask = Task & {lead: Lead};

interface ResearchTaskDialogProps {
  task: LeadTask;
  isCompleted: boolean;
  onToggleComplete: () => void;
  onDeleteTask: () => void;
  onClose: () => void;
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

export const ResearchTaskDialog = ({
  task,
  isCompleted,
  onToggleComplete,
  onDeleteTask,
  onClose,
}: ResearchTaskDialogProps) => {
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

        // update the outreach copy for all tasks in that lead
        const tasks = task.lead.tasks;
        if (tasks) {
          tasks.forEach((taskItem) => {
            taskItem.outreachCopy = newOutreachCopy;
          });
        }

        await updateDoc(docRef, {
          tasks: tasks,
        });
      } catch (error) {
        console.error("Error updating task outreach copy:", error);
      }
    }, 1000),
    [task.lead.id, task.lead.tasks]
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

  const cleanedWebsite = (website: string) => {
    if (!website) return "";
    if (website.startsWith("http")) {
      return website;
    }
    return `https://${website}`;
  };

  const getFaviconUrl = (url: string) => {
    const domain = new URL(cleanedWebsite(url)).hostname;
    return `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
  };

  //   when a new contact is added the tasks taskCadence is used to schedule the tasks for the contact

  const onNewContact = async (contact: Contact) => {
    if (!task.taskCadence) {
      console.warn("No taskCadence found for task, cannot schedule new tasks");
      return;
    }

    try {
      const docRef = doc(db, "companies", task.lead.id);
      const newTasks: Task[] = [];

      // Create initial contact task for the new contact on the start date
      // Convert startDate to proper Date object if it's a Timestamp
      const startDate =
        task.taskCadence.startDate instanceof Date
          ? task.taskCadence.startDate
          : convertTimestampToDate(task.taskCadence.startDate as Timestamp);

      newTasks.push({
        id: crypto.randomUUID(),
        isCompleted: false,
        action: "initialContact",
        contact: contact,
        date: convertDateToTimestamp(startDate) as Timestamp,
        taskCadence: task.taskCadence,
      } as Task);

      // Create follow-up tasks based on taskCadence settings
      if (task.taskCadence.followUpVolume > 0) {
        for (let i = 1; i <= task.taskCadence.followUpVolume; i++) {
          // Calculate follow-up date: startDate + (followUpTime * i) business days
          const followUpDate = new Date(startDate);
          followUpDate.setDate(
            followUpDate.getDate() + task.taskCadence.followUpTime * i
          );

          // Skip weekends for follow-up dates
          while (followUpDate.getDay() === 0 || followUpDate.getDay() === 6) {
            followUpDate.setDate(followUpDate.getDate() + 1);
          }

          newTasks.push({
            id: crypto.randomUUID(),
            isCompleted: false,
            action: "followUp",
            contact: contact,
            date: convertDateToTimestamp(followUpDate) as Timestamp,
            taskCadence: task.taskCadence,
          } as Task);
        }
      }

      // Add new tasks to the lead's existing tasks
      const updatedTasks = [...(task.lead.tasks || []), ...newTasks];
      await updateDoc(docRef, {
        tasks: updatedTasks,
        updatedAt: serverTimestamp(),
      });

      console.log(
        `Scheduled ${newTasks.length} tasks for new contact: ${contact.name}`
      );
    } catch (error) {
      console.error("Error scheduling tasks for new contact:", error);
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-1">
          Do Research on{" "}
          <div className="font-bold flex items-center gap-1">
            <Avatar className="w-5 h-5">
              <AvatarImage src={getFaviconUrl(task.lead.website)} />
            </Avatar>
            {task.lead.name}
          </div>
        </DialogTitle>
        <DialogDescription>Do Research on {task.lead.name}</DialogDescription>
      </DialogHeader>

      <div className="grid gap-1">
        <LinkButton
          href={cleanedWebsite(task.lead.website)}
          target="_blank"
          variant={"secondary"}
        >
          Open Website
        </LinkButton>
      </div>

      <Tabs defaultValue="contacts" className="w-full">
        <TabsList className="grid grid-cols-3 w-full bg-muted-foreground/20 border  h-10  ">
          <TabsTrigger value="contacts" className="">
            Contacts
          </TabsTrigger>
          <TabsTrigger value="notes">Company Notes</TabsTrigger>
          <TabsTrigger value="research">Outreach Copy</TabsTrigger>
        </TabsList>

        <TabsContent value="contacts" className="space-y-4">
          {task.lead.contacts && task.lead.contacts.length > 0 ? (
            <div className="grid gap-1">
              <div className="flex flex-col border rounded-md">
                <div className="w-full grid grid-cols-[1fr_1fr_90px] border-b py-1    divide-x">
                  <h1 className="pl-4 font-bold text-primary/60">Name</h1>
                  <h1 className="pl-4 font-bold text-primary/60">Role</h1>
                  <h1 className="pl-4 font-bold text-primary/60">Points</h1>
                  {/* <h1 className="pl-4 font-bold text-primary/60">Status</h1> */}
                </div>
                <div className="flex flex-col divide-y h-[200px] overflow-y-auto ">
                  {task.lead.contacts.map((contact, i) => (
                    <ContactRow
                      contact={contact}
                      key={contact.id}
                      lead={task.lead}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[200px] flex flex-col border rounded-md p-8 justify-center items-center bg-muted gap-1">
              <h1 className="pl-2 font-bold text-primary/60">
                No contacts saved
              </h1>
              <p className="text-muted-foreground text-center text-sm">
                Manually add a contact or add a person from the people list.
              </p>
              <NewContactButton leadId={task.lead.id} onSuccess={onNewContact}>
                <Button variant={"outline"}>
                  <Icons.add />
                  Add a contact
                </Button>
              </NewContactButton>
            </div>
          )}
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <div className="grid gap-1">
            <h1>Company Notes</h1>
            <div className="w-full h-[200px] relative">
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
        </TabsContent>

        <TabsContent value="research" className="space-y-4">
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
        </TabsContent>
      </Tabs>

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
                This action cannot be undone. This will permanently delete this
                task.
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
  );
};
