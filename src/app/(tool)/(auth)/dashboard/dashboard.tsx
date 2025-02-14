"use client";

import {Icons} from "@/components/icons";
import {Contact, ContactTypeData, Lead, Task} from "@/config/data";
import {db} from "@/config/firebase";
import {collection, onSnapshot, query} from "firebase/firestore";
import {AnimatePresence, motion} from "framer-motion";
import {useEffect, useState} from "react";
import {Calendar} from "@/components/ui/calendar";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {
  CalendarIcon,
  Building2,
  TrendingDown,
  TrendingUp,
  Send,
  Phone,
  Sparkles,
} from "lucide-react";
import {cn, formatDate} from "@/lib/utils";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  convertTimestampToDate,
  formatTimeDifference,
  isValidURL,
} from "@/lib/utils";
import {format} from "date-fns";
import {doc, Timestamp, updateDoc, serverTimestamp} from "firebase/firestore";
import {useAuth} from "@/context/user-auth";
import {AiOutreach} from "@/app/(tool)/(auth)/ai-chats/ai-outreach";

type LeadTask = Task & {lead: Lead};

export const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>();

  useEffect(() => {
    const clientIdeaDataQuery = query(collection(db, "companies"));
    const unsubscribe = onSnapshot(clientIdeaDataQuery, (querySnapshot) => {
      const leadsData: Lead[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        leadsData.push(data as Lead);
      });
      // setFilteredLeads(leadsData);
      setLeads(leadsData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const [date, setDate] = useState<Date | undefined>(new Date());

  const addDays = (date: Date | undefined, days: number): Date => {
    if (!date) return new Date();
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + days);
    return newDate;
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  const filterTasksByDate = (
    leads: Lead[] | undefined,
    selectedDate: Date | undefined
  ): LeadTask[] => {
    if (!leads || !selectedDate) return [];

    return leads.reduce<LeadTask[]>((allTasks, lead) => {
      if (!lead.tasks) return allTasks;

      const tasksWithLead = lead.tasks
        .filter((task) => {
          const taskDate = convertTimestampToDate(task.date as Timestamp);
          return isSameDay(taskDate, selectedDate);
        })
        .map((task) => ({
          ...task,
          lead,
        }));

      return [...allTasks, ...tasksWithLead];
    }, []);
  };

  // Usage:
  const leadsWithTasks = filterTasksByDate(leads, date);

  const [openPicker, setOpenPicker] = useState(false);

  const onDateChange = (value: Date | undefined) => {
    setDate(value);
    setOpenPicker(false);
  };

  const goToNextDay = () => {
    setDate(addDays(date, 1));
  };

  const goToPrevDay = () => {
    setDate(addDays(date, -1));
  };

  const {currentUser} = useAuth()!;

  const [timeFrame, setTimeFrame] = useState<string>("today");

  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollDone, setScrollDone] = useState(false);

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    const isAtBottom =
      Math.abs(
        scrollTop + e.currentTarget.clientHeight - e.currentTarget.scrollHeight
      ) < 16;
    setScrollDone(isAtBottom);
    if (scrollTop !== 0) {
      setIsScrolled(true);
    } else {
      setIsScrolled(false);
    }
  };

  return (
    <div className="flex flex-col p-6 relative">
      <div className="flex w-full justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex gap-2 items-center ">
          {/* {formatDate(new Date())} */}
          <Select value={timeFrame} onValueChange={setTimeFrame}>
            <SelectTrigger className="w-[120px] border-0 focus:ring-0 focus:ring-transparent  hover:bg-muted">
              <SelectValue placeholder="Theme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">today</SelectItem>
              <SelectItem value="week">last 7 days</SelectItem>
              <SelectItem value="month">last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <div className="p-2 bg-foreground/10 flex items-center justify-center rounded-full">
            <CalendarIcon className="h-4 w-4" />
          </div>
        </div>
      </div>
      {/* <p className="mt-2">Today is its time to fucking grind</p> */}
      <div className="grid grid-cols-3 gap-8 px-20 divide-x border-y py-4 mt-4 relative">
        <div className="w-full h-fit gap-4 flex rounded-md p-3 px-6 relative">
          <div className="h-16 w-16 rounded-full bg-foreground/10 flex items-center justify-center">
            <Building2 className="h-8 w-8" />
          </div>
          <div className="flex flex-col gap-2 flex-grow">
            <h1 className="font- text-xl  flex items-center">Total Leads</h1>
            <div className="flex gap-1 items-end w-full justify-between">
              <h1 className="text-2xl font-bold">{leads?.length}</h1>
              <p className="text-green-500 flex items-center gap-1">
                <TrendingUp />+ 8 leads
              </p>
            </div>
          </div>
        </div>
        <div className="w-full h-fit gap-4 flex rounded-md p-3 px-6">
          <div className="h-16 w-16 rounded-full bg-foreground/10 flex items-center justify-center">
            <Send className="h-8 w-8" />
          </div>
          <div className="flex flex-col gap-2 flex-grow">
            <h1 className="font- text-xl  flex items-center">
              Total Outreaches
            </h1>
            <div className="flex gap-1 items-end w-full justify-between">
              <h1 className="text-2xl font-bold">{324}</h1>
              <p className="text-green-500 flex items-center gap-1">
                <TrendingUp />+ 100 people
              </p>
            </div>
          </div>
        </div>
        <div className="w-full h-fit gap-4 flex rounded-md p-3 px-6">
          <div className="h-16 w-16 rounded-full bg-foreground/10 flex items-center justify-center">
            <Phone className="h-8 w-8" />
          </div>
          <div className="flex flex-col gap-2 flex-grow">
            <h1 className="font- text-xl  flex items-center">
              Calls Scheduled
            </h1>
            <div className="flex gap-1 items-end w-full justify-between">
              <h1 className="text-2xl font-bold">{0}</h1>
              <p className="text-destructive flex items-center gap-1">
                <TrendingDown />- 2 calls
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex gap-4 items-center mt-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Icons.todo className="text-muted-foreground" />
          Tasks
        </h1>
        <div className="flex  items-center">
          <Button
            onClick={goToPrevDay}
            className="h-8 w-8 rounded-full -mr-2 "
            variant={"ghost"}
          >
            <Icons.chevronLeft />
          </Button>
          <Popover open={openPicker} onOpenChange={setOpenPicker}>
            <PopoverTrigger asChild>
              <Button
                variant={"ghost"}
                className={cn(
                  "w-fit  text-left font-normal items-center justify-start flex gap-2  text-primary",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className=" h-4 w-4 opacity-50" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={onDateChange}
                // disabled={(date) => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button
            onClick={goToNextDay}
            className="h-8 w-8 rounded-full -ml-2 "
            variant={"ghost"}
          >
            <Icons.chevronRight />
          </Button>
        </div>
      </div>
      <div className="w-full  h-[calc(100vh-300px)] relative">
        <div
          onScroll={onScroll}
          className="flex flex-col bg-background   border p-2 flex-grow rounded-md  overflow-scroll gap-2 h-[calc(100vh-300px)] pb-4"
        >
          {leadsWithTasks.length < 1 || !leadsWithTasks ? (
            <div className="w-full h-full items-center justify-center flex text-lg">
              {" "}
              Nothing Scheduled
            </div>
          ) : (
            <>
              {leadsWithTasks?.flatMap((task) => (
                <TaskRow task={task} key={task.id} />
              ))}
            </>
          )}
          <AnimatePresence>
            {isScrolled && (
              <motion.div
                initial={{opacity: 0}}
                animate={{opacity: 1}}
                exit={{opacity: 0}}
                className="absolute pointer-events-none top-[1px]  px-[1px] overflow-hidden rounded-t-md left-0 w-full z-30 "
              >
                <div className="upload-row-edge-grad-top  w-full h-16 z-30 pointer-events-none"></div>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {!scrollDone && (
              <motion.div
                initial={{opacity: 0}}
                animate={{opacity: 1}}
                exit={{opacity: 0}}
                className="absolute pointer-events-none  bottom-[1px] px-[1px] overflow-hidden rounded-b-md left-0 w-full z-30 animate-in fade-in-0 duration-500"
              >
                <div className="upload-row-edge-grad-bottom  w-full h-16 z-30 pointer-events-none"></div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const TaskRow = ({task}: {task: LeadTask}) => {
  const [isCompleted, setIsComplete] = useState(task.isCompleted);

  const [showScheduleNext, setShowScheduleNext] = useState(false);

  const [description, setDescription] = useState<string | undefined>(
    task.description
  );

  const toggleComplete = async () => {
    const updatedTasks = task.lead.tasks?.map((taskL) =>
      taskL.id === task.id ? {...taskL, isCompleted: !isCompleted} : taskL
    );

    await updateDoc(doc(db, `companies/${task.lead.id}`), {
      tasks: updatedTasks,
    });
    if (!isCompleted) {
      setOpen(false);
    }
    setIsComplete(!isCompleted);
  };

  const [open, setOpen] = useState(false);

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
      const docRef = doc(db, "companies", task.lead.id);

      // Find the task index in the tasks array
      const taskIndex = task.lead.tasks?.findIndex(
        (task) => task.id === task.id
      );

      if (taskIndex === undefined || taskIndex === -1) {
        throw new Error("Task not found");
      }

      const updatedTasks = task.lead.tasks?.map((task) =>
        task.id === task.id ? {...task, description: newDescription} : task
      );

      await updateDoc(docRef, {
        tasks: updatedTasks,
      });
    } catch (error) {
      console.error("Error updating task description:", error);
    }
  };

  const deleteTask = async () => {
    try {
      const docRef = doc(db, "companies", task.lead.id);

      // Filter out the task to be deleted
      const updatedTasks = task.lead.tasks?.filter(
        (taskL) => taskL.id !== task.id
      );

      await updateDoc(docRef, {
        tasks: updatedTasks || [],
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const Icon = ContactTypeData.find(
    (point) => point.value == task.contactPoint.type
  )?.icon;

  return (
    <div className="flex items-center gap-1">
      <div className="flex  justify-start items-center bg-background overflow-hidden text-primary p-3 px-4 rounded-lg  border relative gap-4 w-full hover:bg-muted-foreground/20 transition-colors duration-300">
        <button
          onClick={toggleComplete}
          className={`border  rounded-[4px] h-6 w-6 relative  transition-colors duration-300  z-20 flex items-center justify-center
        ${
          isCompleted
            ? "bg-primary hover:border-primary"
            : "border-muted-foreground hover:bg-muted-foreground hover:border-muted-foreground"
        }
        
        `}
        >
          {isCompleted && <Icons.check className="text-background h-4 w-4" />}
        </button>
        <AnimatePresence>
          {isCompleted && (
            <motion.div
              animate={{width: "calc(100% - 76px)"}}
              initial={{width: "0%"}}
              exit={{width: "0%"}}
              className="absolute top-1/2 -translate-y-1/2 left-[56px] pointer-events-none  h-[2px] bg-primary z-30 origin-left rounded-sm "
            ></motion.div>
          )}
        </AnimatePresence>
        <div
          className={`relative z-20 pointer-events-none ${
            isCompleted ? "opacity-30" : "opacity-100"
          }`}
        >
          {task.action === "followUp" && "Follow up with"}
          {task.action === "initialContact" && "Reach out to"}{" "}
          <span className="font-bold">{task.contact.name}</span> from{" "}
          <span className="font-bold">{task.lead.name}</span> on{" "}
          {
            ContactTypeData.find(
              (point) => point.value === task.contactPoint.type
            )?.label
          }
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <DialogTrigger asChild>
              <button className="absolute w-full h-full  z-10 left-0 top-0 "></button>
            </DialogTrigger>
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
                {task.contact.name} is the {task.contact.role} of{" "}
                {task.lead.name} you need to{" "}
                {task.action === "followUp" && "Follow up with them"}
                {task.action === "initialContact" &&
                  "Reach out to them"} by{" "}
                {format(convertTimestampToDate(task.date as Timestamp), "PPP")}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-1">
              <h1>Contact point</h1>
              <div className="border p-2 rounded-md gap-4 items-center max-w-full grid grid-cols-[32px_1fr_200px]">
                {Icon && <Icon className="h-8 w-8 " />}
                <div className="w-full overflow-hidden text-ellipsis whitespace-nowrap">
                  {task.contactPoint.value}
                </div>
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
              <div className="flex items-center">
                <h1>Outreach Copy</h1>
              </div>

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
                          task?.description || ""
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
                    lead={task.lead}
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
                  <Button
                    className="mr-auto text-destructive"
                    variant={"ghost"}
                  >
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
                  onClick={toggleComplete}
                  className="bg-green-500 hover:bg-green-600"
                >
                  <Icons.check />
                  mark as complete
                </Button>
              )}
              {task.isCompleted && (
                <Button onClick={toggleComplete} variant={"destructive"}>
                  <Icons.close />
                  mark as incomplete
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
