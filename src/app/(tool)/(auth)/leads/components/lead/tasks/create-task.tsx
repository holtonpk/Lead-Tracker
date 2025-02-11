import {useState} from "react";
import {Icons, LinkedInLogo} from "@/components/icons";
import {CalendarIcon} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Textarea} from "@/components/ui/textarea";
import {format} from "date-fns";
import {cn} from "@/lib/utils";
import {Calendar} from "@/components/ui/calendar";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Lead,
  Task,
  Contact,
  ContactPoint,
  ContactTypeData,
} from "@/config/data";
import {
  doc,
  Timestamp,
  updateDoc,
  serverTimestamp,
  arrayUnion,
} from "firebase/firestore";
import {convertDateToTimestamp, formatTimeDifference} from "@/lib/utils";
import {useToast} from "@/hooks/use-toast";
import {db} from "@/config/firebase";

export const CreateNextTask = ({lead}: {lead: Lead}) => {
  const [open, setOpen] = useState(false);

  const [date, setDate] = useState<Date | undefined>();

  const [contactPoint, setContactPoint] = useState<ContactPoint | undefined>(
    undefined
  );

  const {toast} = useToast();

  const [action, setAction] = useState<
    "initialContact" | "followUp" | undefined
  >(undefined);
  const [contact, setContact] = useState<Contact | undefined>();
  const [outReachCopy, setOutReachCopy] = useState<string>("");
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState(false);

  const saveStep = async () => {
    if (!date || !action || !contact || !contactPoint) {
      toast({
        title: "A is empty",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      // Batch the Firestore operations
      const docRef = doc(db, "companies", lead.id);

      // Use arrayUnion instead of fetching + updating
      await updateDoc(docRef, {
        // updatedAt: serverTimestamp(),
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

      toast({
        title: "Success",
        description: "Task saved successfully",
      });

      // Reset form
      setContact(undefined);
      setOutReachCopy("");
      setIsCompleted(false);
      setAction(undefined);
      setOpen(false);
      setContactPoint(undefined);
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

  return (
    <div className="flex items-start ml-[11px]">
      <div className="border-l-[2px] mt-[1px] border-b-[2px] border-muted-foreground/20 border-dashed  w-[24px] h-5"></div>

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
          <div className="flex  gap-2 items-center">
            <Select
              onValueChange={(value) =>
                setAction(value as "initialContact" | "followUp")
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select an action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="initialContact">Initiate Contact</SelectItem>
                <SelectItem value="followUp">Follow Up</SelectItem>
              </SelectContent>
            </Select>
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
                {lead?.contacts &&
                  lead.contacts?.map((contact, i) => (
                    <SelectItem key={i} value={contact.name}>
                      {contact.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
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
          {date && contact && (
            <Textarea
              placeholder="Outreach copy"
              value={outReachCopy}
              onChange={(e) => setOutReachCopy(e.target.value)}
            />
          )}

          <DialogFooter>
            {date && contact && (
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
            )}

            <Button onClick={saveStep}>
              {isLoading && <Icons.spinner className="h-4 w-4 animate-spin" />}
              Save Step
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
