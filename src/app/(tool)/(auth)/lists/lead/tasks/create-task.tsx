import {Icons} from "@/components/icons";
import {Button} from "@/components/ui/button";
import {Calendar} from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Input} from "@/components/ui/input";
import {CalendarIcon, Divide, Phone} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import {Sparkles} from "lucide-react";
import {Textarea} from "@/components/ui/textarea";
import {
  Contact,
  ContactPoint,
  ContactTypeData,
  Lead,
  Task,
  TaskActions,
} from "@/config/data";
import {db} from "@/config/firebase";
import {useToast} from "@/hooks/use-toast";
import {cn, convertDateToTimestamp} from "@/lib/utils";
import {format} from "date-fns";
import {
  arrayUnion,
  doc,
  serverTimestamp,
  Timestamp,
  deleteField,
  updateDoc,
} from "firebase/firestore";
import {useState} from "react";
import {AiOutreach} from "@/app/(tool)/(auth)/ai-chats/ai-outreach";
import {number} from "zod";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
export const CreateNextTask = ({lead}: {lead: Lead}) => {
  const [open, setOpen] = useState(false);

  const [date, setDate] = useState<Date | undefined>();

  const [contactPoint, setContactPoint] = useState<ContactPoint | undefined>(
    undefined
  );

  const {toast} = useToast();

  const [action, setAction] = useState<TaskActions | undefined>(undefined);
  const [contact, setContact] = useState<Contact | undefined>();
  const [outReachCopy, setOutReachCopy] = useState<string | undefined>();
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState(false);

  const [daysAlpha, setDaysAlpha] = useState(5);
  const [repeat, setRepeat] = useState(5);

  const saveResearch = async () => {
    if (!date || !action) {
      toast({
        title: "A field is empty",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const docRef = doc(db, "companies", lead.id);
      await updateDoc(docRef, {
        tasks: arrayUnion({
          id: crypto.randomUUID(),
          isCompleted: false,
          action: "research",
          date: convertDateToTimestamp(date) as Timestamp,
        }),
      });
    } catch (error) {
      console.error("Error saving research:", error);
    }
  };
  const saveStep = async () => {
    if (!date || !action || !contact || !contactPoint) {
      toast({
        title: "A field is empty",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      const docRef = doc(db, "companies", lead.id);

      const tasksToAdd = [];

      if (action === "initialContact") {
        for (let i = 0; i < repeat + 1; i++) {
          const newDate = new Date(date);
          newDate.setDate(newDate.getDate() + i * daysAlpha);

          tasksToAdd.push({
            id: crypto.randomUUID(),
            isCompleted: i == 0 ? isCompleted : false,
            action: i == 0 ? action : "followUp",
            contact: contact,
            contactPoint: contactPoint,
            date: convertDateToTimestamp(newDate) as Timestamp,
            description: outReachCopy,
          } as Task);
        }

        await updateDoc(docRef, {
          tasks: arrayUnion(...tasksToAdd),
        });
      } else {
        await updateDoc(docRef, {
          tasks: arrayUnion({
            id: crypto.randomUUID(),
            isCompleted: isCompleted,
            action: action,
            contact: contact,
            contactPoint: contactPoint,
            date: convertDateToTimestamp(date) as Timestamp,
            description: outReachCopy,
          } as Task),
        });
      }

      toast({
        title: "Success",
        description: "Task(s) saved successfully",
      });

      setContact(undefined);
      setOutReachCopy("");
      setIsCompleted(false);
      setAction(undefined);
      setOpen(false);
      setContactPoint(undefined);
      setDate(undefined);
    } catch (error) {
      console.error("Error saving contact:", error);
      toast({
        title: "Error",
        description: "Failed to save task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const setAsComplete = async () => {
    setIsLoading(true);

    const docRef = doc(db, "companies", lead.id);
    updateDoc(docRef, {
      completed: {
        type: action,
        date: serverTimestamp(),
      },
    });
    setIsLoading(false);
  };

  const removeComplete = async () => {
    setIsLoading(true);

    const docRef = doc(db, "companies", lead.id);
    await updateDoc(docRef, {
      completed: deleteField(), // Removes the 'completed' field
    });

    setIsLoading(false);
  };

  return (
    <div className="flex items-start ml-[11px]">
      <div className="border-l-[2px] mt-[1px] border-b-[2px] border-muted-foreground/20 border-dashed  w-[24px] h-5"></div>

      {lead?.completed ? (
        <div className="relative w-full">
          {lead.completed.type == "callScheduled" ? (
            <div className="text-green-500 w-full px-4 rounded-md bg-green-500/20 text-center py-1 flex items-center justify-center gap-1">
              <Phone className="h-4 w-4" />A call has been scheduled
            </div>
          ) : (
            <div className="text-destructive w-full px-4 rounded-md bg-destructive/20 text-center py-1 flex items-center justify-center gap-1">
              <Icons.xCircle className="h-4 w-4" />
              This Lead was unqualified
            </div>
          )}
          <Button
            onClick={removeComplete}
            variant={"ghost"}
            size="sm"
            className="absolute bottom-0 translate-y-full left-1/2 -translate-x-1/2 "
          >
            reopen lead
          </Button>
        </div>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant={"outline"} className="flex-grow">
              <Icons.add className="h-4 w-4 " />
              Add Next Step
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add next step</DialogTitle>
              <DialogDescription>
                Add the next step for this lead
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-2 items-center">
              <Select
                onValueChange={(value) =>
                  setAction(value as "initialContact" | "followUp")
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select an action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Start</SelectLabel>
                    <SelectItem value="research">Do Research</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Active</SelectLabel>
                    <SelectItem value="initialContact">
                      Initiate Contact
                    </SelectItem>
                    <SelectItem value="followUp">Follow Up</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Done</SelectLabel>
                    <SelectItem value="closed">Disqualified</SelectItem>
                    <SelectItem value="callScheduled">
                      Call Scheduled
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              {(action == "followUp" || action == "initialContact") && (
                <>
                  with
                  <Select
                    onValueChange={(value) =>
                      setContact(
                        lead.contacts?.find((contact) => contact.name === value)
                      )
                    }
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select a contact" />
                    </SelectTrigger>
                    <SelectContent>
                      {lead?.contacts && lead?.contacts.length > 0 ? (
                        lead.contacts?.map((contact, i) => (
                          <SelectItem key={i} value={contact.name}>
                            <div className="flex gap-2 items-center">
                              <Avatar className="w-5 h-5 ">
                                <AvatarImage src={contact.photo_url} />
                                <AvatarFallback>
                                  {contact.name
                                    .split(" ")
                                    .map((name) => name[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              {contact.name}
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem disabled={true} value={"empty"}>
                          No contacts found
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>
            {contact && (
              <div className="flex items-center gap-2">
                Via
                <Select
                  onValueChange={(value) =>
                    setContactPoint(
                      contact.contactPoints.find(
                        (contactPoint) => contactPoint.value === value
                      )
                    )
                  }
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select a contact method" />
                  </SelectTrigger>
                  <SelectContent>
                    {contact.contactPoints.map((contactPoint) => {
                      const Icon = ContactTypeData.find(
                        (point) => point.value == contactPoint.type
                      )?.icon;

                      return (
                        <SelectItem
                          key={contactPoint.value}
                          value={contactPoint.value}
                        >
                          <div className="flex gap-1 items-center">
                            {Icon && <Icon className="h-4 w-4" />}

                            {
                              ContactTypeData.find(
                                (point) => point.value == contactPoint.type
                              )?.label
                            }
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                on
                <Popover>
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
                      // disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {action == "research" && (
              <Popover>
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
                    // disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            )}
            {date && contact && (
              <div className="grid gap-1">
                <h1 className="font-bold">Outreach Copy</h1>
                <div className="w-full h-[200px] relative">
                  <Textarea
                    placeholder="Outreach copy"
                    className="h-full overflow-scroll noResize  w-full pb-20"
                    value={outReachCopy}
                    onChange={(e) => setOutReachCopy(e.target.value)}
                  />
                  <div className="flex gap-2 ml-auto absolute bottom-2 right-2">
                    {/* <AiOutreach
                      lead={lead}
                      task={{
                        id: crypto.randomUUID(),
                        isCompleted: isCompleted,
                        action: action || "followUp",
                        contact: contact,
                        contactPoint: contactPoint || {
                          id: "",
                          value: "",
                          type: "",
                        },
                        date: convertDateToTimestamp(date) as Timestamp,
                        description: outReachCopy,
                      }}
                      setDescription={setOutReachCopy}
                    >
                      <Button>
                        <Sparkles className="h-5 w-5 " />
                        Ai Generate
                      </Button>
                    </AiOutreach> */}
                  </div>
                </div>
                {action == "initialContact" && (
                  <div className="grid gap-1 mt-2">
                    <h1 className="font-bold">Schedule follow up</h1>
                    <div className="flex items-center  gap-1">
                      Follow up in
                      <Input
                        value={daysAlpha}
                        onChange={(e) => setDaysAlpha(Number(e.target.value))}
                        type="number"
                        placeholder="days"
                        className="w-[48px] py-1 h-fit pr-0"
                      />
                      days. Repeat this for
                      <Input
                        value={repeat}
                        onChange={(e) => setRepeat(Number(e.target.value))}
                        type="number"
                        placeholder="cycles"
                        className="w-[48px] py-1 h-fit pr-0"
                      />
                      cycle(s)
                    </div>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              {date && contact && (
                <>
                  <div className="flex gap-1 items-center mr-auto">
                    <button
                      onClick={() => setIsCompleted(!isCompleted)}
                      className={`h-5 rounded-sm w-5    z-20 border-2 border-primary flex justify-center items-center
        
      ${isCompleted ? "bg-primary" : ""}
        `}
                    >
                      {isCompleted && (
                        <Icons.check className="h-6 w-6 text-background" />
                      )}
                    </button>
                    This task is already completed
                  </div>
                  <Button onClick={saveStep}>
                    {isLoading && (
                      <Icons.spinner className="h-4 w-4 animate-spin" />
                    )}
                    Save Step
                  </Button>
                </>
              )}
              {action &&
                action != "followUp" &&
                action != "initialContact" &&
                action != "research" && (
                  <Button onClick={setAsComplete}>
                    {isLoading && (
                      <Icons.spinner className="h-4 w-4 animate-spin" />
                    )}
                    Close Lead
                  </Button>
                )}
              {action == "research" && date && (
                <Button onClick={saveResearch}>
                  {isLoading && (
                    <Icons.spinner className="h-4 w-4 animate-spin" />
                  )}
                  Save Research
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
