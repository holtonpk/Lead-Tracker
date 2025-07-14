"use client";
import {useState} from "react";
import {Contact, Lead, Task, taskTemplate} from "@/config/data";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Input} from "@/components/ui/input";
import {CalendarIcon} from "lucide-react";
import {Calendar} from "@/components/ui/calendar";
import {format} from "date-fns";
import {cn} from "@/lib/utils";
import {Icons} from "@/components/icons";
import {convertDateToTimestamp, convertTimestampToDate} from "@/lib/utils";
import {
  Timestamp,
  doc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
  deleteField,
} from "firebase/firestore";
import {db} from "@/config/firebase";
import {useToast} from "@/hooks/use-toast";
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

export const ConfigOutreach = ({leads}: {leads: Lead[]}) => {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [leadsPerDay, setLeadsPerDay] = useState<number>(20);
  const [followUpTime, setFollowUpTime] = useState<number>(3);
  const [followUpVolume, setFollowUpVolume] = useState<number>(2);
  const {toast} = useToast();

  const leadsWithoutTasks = leads.filter(
    (lead) => lead.tasks?.length === 0 || lead.tasks?.length === undefined
  );

  // group the leads into task templates based off the leads per day. so if the total leads is 50 it will group the first 20 leads into a group with the startDate equal to the startDate and the followUpDays equal to the followUpDays. the next 20 will have a start date on the next business day after the first startDate. and so on for the remainder
  // on the start date for each task the following tasks will be created
  // a research task
  // a initialContact task for each contact for the lead
  // based off the followUpTime and followUpVolume, the followup tasks will be created for each contact
  // the followup tasks will be created on the followUpTime. which represents the amount of business days after the start date.
  // the amount of followup tasks will be based off the followUpVolume.

  const [taskGroups, setTaskGroups] = useState<taskTemplate[] | undefined>(
    undefined
  );

  const groupLeadsByDate = () => {
    if (!startDate || leadsWithoutTasks.length === 0) {
      return;
    }

    const templates: taskTemplate[] = [];
    const currentDate = new Date(startDate);
    const remainingLeads = [...leadsWithoutTasks];

    while (remainingLeads.length > 0) {
      const groupLeads = remainingLeads.splice(0, leadsPerDay);
      const allTasks: Task[] = [];

      // For each lead in this group, create tasks
      groupLeads.forEach((lead) => {
        // 1. Create a research task on the start date (only one per lead)
        allTasks.push({
          id: crypto.randomUUID(),
          isCompleted: false,
          action: "research",
          date: convertDateToTimestamp(currentDate) as Timestamp,
          contact: "",
          leadId: lead.id, // Add leadId to identify which lead this task belongs to
          taskCadence: {
            startDate: new Date(currentDate),
            followUpTime: followUpTime,
            followUpVolume: followUpVolume,
          },
        } as Task);

        // 2. Create initial contact tasks for each contact on the start date
        if (lead.contacts) {
          lead.contacts.forEach((contact) => {
            // Create one initial contact task per contact (not per contact point)
            allTasks.push({
              id: crypto.randomUUID(),
              isCompleted: false,
              action: "initialContact",
              contact: contact.id,
              date: convertDateToTimestamp(currentDate) as Timestamp,
              leadId: lead.id, // Add leadId to identify which lead this task belongs to
              taskCadence: {
                startDate: new Date(currentDate),
                followUpTime: followUpTime,
                followUpVolume: followUpVolume,
              },
            } as Task);
          });
        }

        // 3. Create follow-up tasks based on followUpTime and followUpVolume
        if (lead.contacts && followUpVolume > 0) {
          lead.contacts.forEach((contact) => {
            // Create follow-up tasks (one per contact, not per contact point)
            for (let i = 1; i <= followUpVolume; i++) {
              const followUpDate = new Date(currentDate);
              followUpDate.setDate(followUpDate.getDate() + followUpTime * i);

              // Skip weekends for follow-up dates
              while (
                followUpDate.getDay() === 0 ||
                followUpDate.getDay() === 6
              ) {
                followUpDate.setDate(followUpDate.getDate() + 1);
              }

              allTasks.push({
                id: crypto.randomUUID(),
                isCompleted: false,
                action: "followUp",
                contact: contact.id,
                date: convertDateToTimestamp(followUpDate) as Timestamp,
                leadId: lead.id, // Add leadId to identify which lead this task belongs to
                taskCadence: {
                  startDate: new Date(currentDate),
                  followUpTime: followUpTime,
                  followUpVolume: followUpVolume,
                },
              } as Task);
            }
          });
        }
      });

      templates.push({
        leads: groupLeads,
        cadence: {
          startDate: new Date(currentDate),
          followUpTime: followUpTime,
          followUpVolume: followUpVolume,
        },
        tasks: allTasks,
      });

      // Move to next business day
      currentDate.setDate(currentDate.getDate() + 1);

      // Skip weekends (Saturday = 6, Sunday = 0)
      while (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
    console.log("templates", templates);
    setTaskGroups(templates);
  };

  const [isSaving, setIsSaving] = useState(false);

  const saveTasks = async () => {
    setIsSaving(true);
    console.log("save tasks");
    if (!taskGroups) return;

    if (taskGroups.length === 0) {
      toast({
        title: "No tasks to save",
        description: "Please generate tasks first",
        variant: "destructive",
      });
      return;
    }

    let savedCount = 0;
    let errorCount = 0;

    // Save tasks for each lead in each task group
    for (const taskGroup of taskGroups) {
      for (const lead of taskGroup.leads) {
        try {
          const docRef = doc(db, "companies-fixed", lead.id);

          // Get tasks for this specific lead using leadId
          const leadTasks = taskGroup.tasks.filter((task: Task) => {
            return (task as any).leadId === lead.id;
          });

          // Add tasks to the lead
          await updateDoc(docRef, {
            tasks: arrayUnion(...leadTasks),
            updatedAt: serverTimestamp(),
          });
          savedCount++;
        } catch (error) {
          console.error("Error saving tasks for lead:", lead.id, error);
          errorCount++;
        }
      }
    }

    // Show success/error toast
    if (errorCount === 0) {
      toast({
        title: "Tasks saved successfully",
        description: `Saved tasks for ${savedCount} leads`,
      });
    } else {
      toast({
        title: "Partial success",
        description: `Saved tasks for ${savedCount} leads, ${errorCount} errors`,
        variant: "destructive",
      });
    }
    setIsSaving(false);
  };

  const [isDeleting, setIsDeleting] = useState(false);
  const deleteTasks = async () => {
    // this will delete all the tasks for all the leads
    setIsDeleting(true);
    try {
      for (const lead of leads) {
        await updateDoc(doc(db, "companies-fixed", lead.id), {
          tasks: deleteField(),
          updatedAt: serverTimestamp(),
        });
      }
      toast({
        title: "Tasks deleted successfully",
        description: `Deleted tasks for ${leads.length} leads`,
      });
    } catch (error) {
      console.error("Error deleting tasks:", error);
      toast({
        title: "Error deleting tasks",
        description: "Failed to delete tasks. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Icons.send />
          Config outreach
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Config outreach</DialogTitle>
          <DialogDescription>
            Configure the outreach for the leads. {leadsWithoutTasks.length}{" "}
            leads don&apos;t have tasks.
          </DialogDescription>
        </DialogHeader>
        {/* start date */}
        <div className="grid gap-1">
          <label className="font-bold">Start date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[200px] pl-3 text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                {startDate ? (
                  format(startDate, "PPP")
                ) : (
                  <span>Pick a date</span>
                )}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                // disabled={(date) => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        {/* leads per day */}
        <div className="grid grid-cols-3 gap-4">
          <div className="grid gap-1">
            <label className="font-bold">Leads per day</label>
            <Input
              type="number"
              value={leadsPerDay}
              onChange={(e) => setLeadsPerDay(Number(e.target.value))}
            />
          </div>
          {/* follow up days */}
          <div className="grid gap-1">
            <label className="font-bold">Follow up days</label>
            <Input
              type="number"
              value={followUpTime}
              onChange={(e) => setFollowUpTime(Number(e.target.value))}
            />
          </div>
          {/* total follow ups */}
          <div className="grid gap-1">
            <label className="font-bold">Total follow ups</label>
            <Input
              type="number"
              value={followUpVolume}
              onChange={(e) => setFollowUpVolume(Number(e.target.value))}
            />
          </div>
        </div>
        <Button onClick={groupLeadsByDate}>
          {!taskGroups ? "Generate tasks" : "Regenerate tasks"}
        </Button>
        {taskGroups && (
          <div className="flex flex-col max-h-[200px] overflow-y-auto">
            {taskGroups.map((taskGroup) => (
              <TaskGroup
                key={taskGroup.cadence.startDate.toISOString()}
                taskGroup={taskGroup}
              />
            ))}
          </div>
        )}
        {taskGroups && (
          <Button onClick={saveTasks} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save tasks"}
          </Button>
        )}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant={"destructive"}>
              {isDeleting ? "Deleting..." : "Delete tasks"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete all tasks?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all tasks for all {leads.length}{" "}
                leads. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={deleteTasks}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete all tasks
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
};

const TaskGroup = ({taskGroup}: {taskGroup: taskTemplate}) => {
  const [isOpen, setIsOpen] = useState(false);

  const contact = taskGroup.leads[0].contacts?.find(
    (contact) => contact.id === taskGroup.tasks[0].contact
  ) as Contact;

  return (
    <div className="border rounded-lg mb-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3 text-left flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <div>
          <h3 className="font-semibold">
            {format(taskGroup.cadence.startDate, "PPP")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {taskGroup.leads.length} leads • {taskGroup.tasks.length} tasks
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {
              taskGroup.tasks.filter((t: Task) => t.action === "research")
                .length
            }{" "}
            research,
            {
              taskGroup.tasks.filter((t: Task) => t.action === "initialContact")
                .length
            }{" "}
            initial,
            {
              taskGroup.tasks.filter((t: Task) => t.action === "followUp")
                .length
            }{" "}
            follow-up
          </span>
          <Icons.chevronDown
            className={`h-4 w-4 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="border-t p-3 bg-muted/20 max-h-60 overflow-y-auto">
          <div className="space-y-2">
            {taskGroup.tasks.map((task: Task) => (
              <div
                key={task.id}
                className="flex items-center gap-2 p-2 bg-background rounded border text-sm"
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    task.action === "research"
                      ? "bg-blue-500"
                      : task.action === "initialContact"
                      ? "bg-green-500"
                      : "bg-orange-500"
                  }`}
                />
                <span className="font-medium">{task.action}</span>
                <span className="text-muted-foreground">
                  {format(
                    convertTimestampToDate(task.date as Timestamp),
                    "MMM d"
                  )}
                </span>
                {contact && (
                  <span className="text-muted-foreground">
                    • {contact.name}
                  </span>
                )}
                {/* Show contact point type if available */}
                {(task as any).contactPoint && (
                  <span className="text-muted-foreground">
                    • {(task as any).contactPoint.type}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
