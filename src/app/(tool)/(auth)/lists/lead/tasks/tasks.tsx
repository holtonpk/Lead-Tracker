import {AiOutreach} from "@/app/(tool)/(auth)/ai-chats/ai-outreach";
import {NewContactButton} from "@/app/(tool)/(auth)/lists/lead/contact/create-contact";
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
import {Contact, ContactTypeData, Lead, Task} from "@/config/data";
import {db} from "@/config/firebase";
import {
  convertTimestampToDate,
  formatTimeDifference,
  isValidURL,
} from "@/lib/utils";
import {format} from "date-fns";
import {doc, serverTimestamp, Timestamp, updateDoc} from "firebase/firestore";
import {Sparkles} from "lucide-react";
import {useState} from "react";
import {CreateNextTask} from "./create-task";
import {useAutoScroll} from "@/components/hooks/use-auto-scroll";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";

export const Tasks = ({lead}: {lead: Lead}) => {
  const orderedTasks =
    lead.tasks &&
    lead.tasks.sort((a, b) => {
      // Research tasks should come first
      if (a.action === "research" && b.action !== "research") return -1;
      if (a.action !== "research" && b.action === "research") return 1;

      // Then sort by date
      return a.date.seconds - b.date.seconds;
    });

  return (
    <div className=" h-fit w-full px-4 mx-auto   ">
      <div className="flex  flex-col ">
        <LeadCreatedLine lead={lead} />
        {lead.tasks && orderedTasks && (
          <>
            {orderedTasks.map((task, i) => (
              <TaskLine task={task} key={task.id} index={i + 1} lead={lead} />
            ))}
          </>
        )}
        {lead.contacts && lead.contacts.length > 0 ? (
          <CreateNextTask lead={lead} />
        ) : (
          <NewContactButton leadId={lead.id}>
            <div className="flex items-start ml-[11px]">
              <div className="border-l-[2px] mt-[1px] border-b-[2px] border-muted-foreground/20 border-dashed  w-[24px] h-5"></div>
              <Button variant={"outline"} className="flex-grow">
                <Icons.add className="h-4 w-4 " />
                Add a contact
              </Button>
            </div>
          </NewContactButton>
        )}
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
            Lead added{" "}
            {lead.createdBy &&
              `by ${
                lead.createdBy == "DFXXsRtmfFUk8Vd7Y2LUS5rhY423"
                  ? "Patrick"
                  : lead.createdBy
              }`}
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

  const [copiedContact, setCopiedContact] = useState<boolean>(false);
  const [copiedDescription, setCopiedDescription] = useState<boolean>(false);

  const copyToClipBoard = (copyFunction: any, text: string) => {
    navigator.clipboard.writeText(text);
    copyFunction(true);
    setTimeout(() => {
      copyFunction(false);
    }, 3000);
  };

  const updateTaskDescription = async (newDescription: string) => {
    try {
      const docRef = doc(db, "companies-fixed", lead.id);

      // Find the task index in the tasks array
      const taskIndex = lead.tasks?.findIndex((task) => task.id === task.id);

      if (taskIndex === undefined || taskIndex === -1) {
        throw new Error("Task not found");
      }

      const updatedTasks = lead.tasks?.map((taskL) =>
        taskL.id === task.id ? {...taskL, description: newDescription} : taskL
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
      const docRef = doc(db, "companies-fixed", lead.id);

      const taskToUpdate = lead.tasks?.find((taskL) => taskL.id === task.id);
      if (!taskToUpdate) {
        throw new Error("Task not found");
      }

      const updatedTasks = lead.tasks?.map((taskL) =>
        taskL.id === task.id
          ? {...taskL, isCompleted: !taskL.isCompleted}
          : taskL
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
      const docRef = doc(db, "companies-fixed", lead.id);

      // Filter out the task to be deleted
      const updatedTasks = lead.tasks?.filter((taskL) => taskL.id !== task.id);

      console.log("lead.tasks", lead.tasks);
      console.log("updatedTasks", updatedTasks);

      await updateDoc(docRef, {
        tasks: updatedTasks || [],
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const [description, setDescription] = useState<string | undefined>(
    task.outreachCopy
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

  const contact = lead.contacts?.find(
    (contact) => contact.id === task.contact
  ) as Contact;

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
            className={`flex flex-col justify-between  mb-6 w-full relative items-center border  rounded-md group hover:opacity-100 hover:shadow-lg cursor-pointer transition-all duration-300 
          ${!task.isCompleted && "opacity-60"}
          `}
          >
            <div className="flex bg-muted-foreground/10 w-full items-center justify-between p-2 relative">
              <h1 className="font-bold text-lg flex items-center gap-1  whitespace-nowrap flex-wrap">
                {task.action === "followUp" && "Follow up with"}
                {task.action === "initialContact" && "Reach out to"}{" "}
                {task.action === "research" && "Do Research on"}{" "}
                {task.action === "research" && (
                  <div className="font-bold flex items-center gap-1">
                    <Avatar className="w-5 h-5 ">
                      <AvatarImage src={getFaviconUrl(lead.website)} />
                    </Avatar>
                    {lead.name}
                  </div>
                )}
                {task.action !== "research" && task.contact && (
                  <>
                    <div className="flex items-center gap-1">
                      {contact.photo_url && (
                        <Avatar className="w-5 h-5 ">
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
                    {contact &&
                      contact.contactPoints.map((point, index) => {
                        return (
                          <span key={point.id}>
                            {
                              ContactTypeData.find(
                                (type) => type.value === point.type
                              )?.label
                            }
                            {contact &&
                              index < contact.contactPoints.length - 1 &&
                              " & "}
                          </span>
                        );
                      })}
                  </>
                )}
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
            {task.outreachCopy && (
              <span className="w-full p-2">{task.outreachCopy}</span>
            )}
          </span>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1">
              {task.action === "followUp" && "Follow up with"}
              {task.action === "initialContact" && "Reach out to"}{" "}
              {task.action === "research" && "Do Research on"}{" "}
              {task.action === "research" && (
                <div className="font-bold flex items-center gap-1">
                  <Avatar className="w-5 h-5 ">
                    <AvatarImage src={getFaviconUrl(lead.website)} />
                  </Avatar>
                  {lead.name}
                </div>
              )}
              {task.action !== "research" && task.contact && (
                <>
                  {contact.photo_url && (
                    <Avatar className="w-5 h-5 ">
                      <AvatarImage src={contact.photo_url} />
                      <AvatarFallback>
                        {contact.name
                          .split(" ")
                          .map((name: string) => name[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  {contact.name} on{" "}
                  {contact.contactPoints.map((point, index) => {
                    return (
                      <span key={point.id}>
                        {
                          ContactTypeData.find(
                            (type) => type.value === point.type
                          )?.label
                        }
                        {contact &&
                          index < contact.contactPoints.length - 1 &&
                          " & "}
                      </span>
                    );
                  })}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {task.action === "research" && `Do Research on ${lead.name}`}{" "}
              {task.action !== "research" && task.contact && (
                <>
                  {contact.name} is the {contact.role} of {lead.name} you need
                  to {task.action === "followUp" && "Follow up with them"}
                  {task.action === "initialContact" &&
                    "Reach out to them"} by{" "}
                  {format(
                    convertTimestampToDate(task.date as Timestamp),
                    "PPP"
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {task.action !== "research" && task.contact && (
            <div className="grid gap-1">
              <h1>Contact point</h1>
              {contact.contactPoints.map((point, index) => {
                const Icon = ContactTypeData.find(
                  (type) => type.value === point.type
                )?.icon;
                return (
                  <div key={point.id}>
                    {Icon && <Icon className="h-8 w-8 " />}
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
                            <Icons.copy className="h-5 w-5 " />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="grid gap-1">
            <h1>Outreach Copy</h1>
            <div className="w-full h-[200px] relative">
              <Textarea
                className="h-full overflow-scroll noResize  w-full pb-20"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  updateTaskDescription(e.target.value);
                }}
              />
              <div className="flex gap-2 ml-auto absolute bottom-2 right-2">
                {description && (
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
                        <Icons.copy className="h-5 w-5 " />
                        Copy
                      </>
                    )}
                  </Button>
                )}
                <AiOutreach
                  lead={lead}
                  task={task}
                  setDescription={setDescription}
                >
                  <Button>
                    <Sparkles className="h-5 w-5 " />
                    Ai Generate
                  </Button>
                </AiOutreach>
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
