import {Icons} from "@/components/icons";
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
import {LinkButton} from "@/components/ui/link";
import {Textarea} from "@/components/ui/textarea";
import {ContactTypeData, Lead, Task} from "@/config/data";
import {db} from "@/config/firebase";
import {
  convertTimestampToDate,
  formatTimeDifference,
  isValidURL,
} from "@/lib/utils";
import {format} from "date-fns";
import {doc, Timestamp, updateDoc} from "firebase/firestore";
import {useState} from "react";
import {CreateNextTask} from "./create-task";

export const Tasks = ({lead}: {lead: Lead}) => {
  const orderedTasks =
    lead.tasks && lead.tasks.sort((a, b) => a.date.seconds - b.date.seconds);

  return (
    <div className=" h-fit w-full px-4 mx-auto pb-2 ">
      <div className="flex  flex-col">
        <LeadCreatedLine lead={lead} />
        {lead.tasks && orderedTasks && (
          <>
            {orderedTasks.map((task, i) => (
              <TaskLine task={task} key={task.id} index={i + 1} lead={lead} />
            ))}
          </>
        )}
        <CreateNextTask lead={lead} />
      </div>
    </div>
  );
};

const LeadCreatedLine = ({lead}: {lead: Lead}) => {
  return (
    <div className="grid grid-cols-[24px_1fr] gap-4 h-fit">
      <div className="flex flex-col flex-grow items-center  gap-1 pt-2 h-full">
        <div
          className={` h-6 w-6  rounded-full  flex items-center justify-center bg-green-500
            `}
        >
          <Icons.check className="h-4 w-4 text-background" />
        </div>
        <div className="w-[2px] relative bg-gradient-to-b from-muted to-green-500 flex-grow"></div>
      </div>
      <span
        className={`flex flex-col justify-between mb-6 w-full relative items-center`}
      >
        <div className="flex  w-full items-center justify-between p-2">
          <h1 className="font-bold text-lg whitespace-nowrap">
            Lead added by Adam
          </h1>
          <h2 className="text-muted-foreground whitespace-nowrap text-sm">
            {formatTimeDifference(lead.createdAt as Timestamp)}
          </h2>
        </div>
      </span>
    </div>
  );
};

const TaskLine = ({
  task,
  index,
  lead,
}: {
  task: Task;
  index: number;
  lead: Lead;
}) => {
  const [open, setOpen] = useState(false);

  const [date, setDate] = useState<Date | undefined>(
    convertTimestampToDate(task.date as Timestamp)
  );

  const recommendSave =
    date &&
    date.setHours(0, 0, 0, 0) !==
      convertTimestampToDate(task.date as Timestamp).setHours(0, 0, 0, 0);

  const Icon = ContactTypeData.find(
    (point) => point.value == task.contactPoint.type
  )?.icon;

  const [copiedContact, setCopiedContact] = useState<boolean>(false);
  const [copiedDescription, setCopiedDescription] = useState<boolean>(false);

  const copyToClipBoard = (copyFunction: any, text: string) => {
    navigator.clipboard.writeText(task.contactPoint.value);
    copyFunction(true);
    setTimeout(() => {
      copyFunction(false);
    }, 3000);
  };

  const updateTaskDescription = async (newDescription: string) => {
    try {
      const docRef = doc(db, "companies", lead.id);

      // Find the task index in the tasks array
      const taskIndex = lead.tasks?.findIndex((task) => task.id === task.id);

      if (taskIndex === undefined || taskIndex === -1) {
        throw new Error("Task not found");
      }

      const updatedTasks = lead.tasks?.map((task) =>
        task.id === task.id ? {...task, description: newDescription} : task
      );

      await updateDoc(docRef, {
        tasks: updatedTasks,
      });
    } catch (error) {
      console.error("Error updating task description:", error);
    }
  };

  const toggleTaskCompletion = async () => {
    try {
      const docRef = doc(db, "companies", lead.id);

      const taskToUpdate = lead.tasks?.find((task) => task.id === task.id);
      if (!taskToUpdate) {
        throw new Error("Task not found");
      }

      const updatedTasks = lead.tasks?.map((task) =>
        task.id === task.id ? {...task, isCompleted: !task.isCompleted} : task
      );

      await updateDoc(docRef, {
        tasks: updatedTasks,
      });
    } catch (error) {
      console.error("Error toggling task completion:", error);
    }
  };

  const deleteTask = async () => {
    try {
      const docRef = doc(db, "companies", lead.id);

      // Filter out the task to be deleted
      const updatedTasks = lead.tasks?.filter((task) => task.id !== task.id);

      await updateDoc(docRef, {
        tasks: updatedTasks || [],
        // updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  return (
    <div className="grid grid-cols-[24px_1fr]  gap-4 h-fit">
      <div className="flex flex-col flex-grow items-center gap-1 pt-2 h-full">
        <div
          className={` h-6 w-6  rounded-full  flex items-center justify-center
            ${task.isCompleted ? "bg-green-500" : "bg-muted-foreground/20"}
            `}
        >
          {task.isCompleted ? (
            <Icons.check className="h-4 w-4 text-background" />
          ) : (
            index
          )}
        </div>
        {task.isCompleted ? (
          <div className="w-[2px] relative bg-gradient-to-b from-muted to-green-500 flex-grow"></div>
        ) : (
          <div className="w-[2px] relative border-muted-foreground/2- border-r-[2px] border-dashed flex-grow"></div>
        )}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <span
            className={`flex flex-col justify-between mb-6 w-full relative items-center border  rounded-md group hover:opacity-100 hover:shadow-lg cursor-pointer transition-all duration-300 
          ${!task.isCompleted && "opacity-60"}
          `}
          >
            <div className="flex bg-muted-foreground/10 w-full items-center justify-between p-2 relative">
              <h1 className="font-bold text-lg whitespace-nowrap">
                {task.action === "followUp" && "Follow up with"}
                {task.action === "initialContact" && "Reach out to"}{" "}
                {task.contact.name} on{" "}
                {
                  ContactTypeData.find(
                    (point) => point.value === task.contactPoint.type
                  )?.label
                }
              </h1>
              <div className="flex gap-1 items-center ">
                <h2
                  className={`text-muted-foreground whitespace-nowrap text-sm
                ${
                  new Date().setHours(0, 0, 0, 0) >
                    convertTimestampToDate(task.date as Timestamp).setHours(
                      0,
                      0,
                      0,
                      0
                    ) &&
                  !task.isCompleted &&
                  "text-red-500"
                }
              
              `}
                >
                  {formatTimeDifference(task.date as Timestamp)}
                </h2>
              </div>
            </div>
            {task.description && (
              <span className="w-full p-2">{task.description}</span>
            )}
          </span>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {task.action === "followUp" && "Follow up with"}
              {task.action === "initialContact" && "Reach out to"}{" "}
              {task.contact.name} on{" "}
              {
                ContactTypeData.find(
                  (point) => point.value === task.contactPoint.type
                )?.label
              }
            </DialogTitle>
            <DialogDescription>
              {task.contact.name} is the {task.contact.role} of {lead.name} you
              need to {task.action === "followUp" && "Follow up with them"}
              {task.action === "initialContact" && "Reach out to them"} by{" "}
              {format(convertTimestampToDate(task.date as Timestamp), "PPP")}
            </DialogDescription>
          </DialogHeader>
          {/* <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[200px] pl-3 text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                {date ? format(date, "PPP") : <span>Pick a date</span>}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}

                initialFocus
              />
            </PopoverContent>
          </Popover> */}

          {/* <div className="grid gap-1">
            <h1>Notes</h1>
            <Textarea value={lead.notes} />
          </div> */}
          <div className="grid gap-1">
            <h1>Contact point</h1>
            <div className="border p-2 rounded-md flex items-center">
              {Icon && <Icon className="h-8 w-8 mr-2" />}
              {task.contactPoint.value}
              <div className="flex gap-2 ml-auto">
                {isValidURL(task.contactPoint.value) && (
                  <LinkButton
                    href={task.contactPoint.value}
                    target="_blank"
                    variant={"secondary"}
                  >
                    Open link
                  </LinkButton>
                )}
                <Button
                  onClick={() =>
                    copyToClipBoard(setCopiedContact, task.contactPoint.value)
                  }
                  variant={"secondary"}
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
              </div>
            </div>
          </div>
          <div className="grid gap-1">
            <h1>Outreach Copy</h1>
            <div className="w-full h-[200px] relative">
              <Textarea
                className="h-full overflow-scroll noResize  w-full"
                value={task.description}
                onChange={(e) => updateTaskDescription(e.target.value)}
              />
              <Button
                onClick={() =>
                  copyToClipBoard(setCopiedDescription, task?.description || "")
                }
                variant={"secondary"}
                className="absolute bottom-2 right-2"
              >
                {copiedDescription ? (
                  <>Copied</>
                ) : (
                  <>
                    <Icons.copy className="h-5 w-5 " />
                    Copy
                  </>
                )}
              </Button>
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
                    onClick={deleteTask}
                    className="bg-destructive  hover:bg-destructive/90"
                  >
                    Delete Task
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {!task.isCompleted && (
              <Button
                onClick={toggleTaskCompletion}
                className="bg-green-500 hover:bg-green-600"
              >
                <Icons.check />
                mark as complete
              </Button>
            )}
            {task.isCompleted && (
              <Button onClick={toggleTaskCompletion} variant={"destructive"}>
                <Icons.close />
                mark as incomplete
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
