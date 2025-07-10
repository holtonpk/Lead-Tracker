import {Icons} from "@/components/icons";
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
import {Input} from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {Contact, ContactPoint, ContactTypeData, RolesData} from "@/config/data";
import {db} from "@/config/firebase";
import {useToast} from "@/hooks/use-toast";
import {arrayUnion, doc, serverTimestamp, updateDoc} from "firebase/firestore";
import {useState} from "react";

export const NewContactButton = ({
  leadId,
  children,
  onSuccess,
}: {
  leadId: string;
  children: React.ReactNode;
  onSuccess?: (contact: Contact) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {toast} = useToast();

  const saveContact = async () => {
    if (!leadId || !name || !role || contactPoints.length === 0) {
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
      const docRef = doc(db, "companies", leadId);

      const newContact = {
        id: crypto.randomUUID(), // Add unique ID for future updates/deletions
        name,
        role,
        contactPoints: contactPoints.filter(
          (point) => point.value && point.type && point.id
        ), // Only save valid contact points
      } as Contact;

      // Use arrayUnion instead of fetching + updating
      await updateDoc(docRef, {
        updatedAt: serverTimestamp(),
        contacts: arrayUnion(newContact),
      });

      toast({
        title: "Success",
        description: "Contact saved successfully",
      });

      // Reset form
      setName("");
      setRole("");
      setContactPoints([
        {value: "", type: "", id: Math.random().toLocaleString()},
      ]);
      setOpen(false);
      onSuccess?.(newContact);
    } catch (error) {
      console.error("Error saving contact:", error);
      toast({
        title: "Error",
        description: "Failed to save contact. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const [name, setName] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [contactPoints, setContactPoints] = useState<ContactPoint[]>([
    {
      value: "",
      type: "",
      id: Math.random().toLocaleString(),
    },
  ]);

  const updateContactPoint = (
    index: number,
    updatedPoint: Partial<ContactPoint>
  ) => {
    setContactPoints((prev) =>
      prev.map((point, i) =>
        i === index ? {...point, ...updatedPoint} : point
      )
    );
  };

  const deleteContactRow = (index: number) => {
    setContactPoints((prev) => prev.filter((_, i) => i !== index));
  };

  const addContactPoint = () => {
    setContactPoints([
      ...contactPoints,
      {
        value: "",
        type: "",
        id: Math.random().toLocaleString(),
      },
    ]);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New contact</DialogTitle>
          <DialogDescription>
            Add or edit contact for this lead
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <div className="grid gap-1">
            <h1 className="font-bold">Contact Name</h1>
            <Input
              placeholder="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>
        <div className="grid gap-1">
          <h1 className="font-bold">Role</h1>
          <Select onValueChange={setRole} value={role}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select their role" />
            </SelectTrigger>
            <SelectContent>
              {RolesData.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1">
          <h1 className="font-bold">Contact Points</h1>
          <div className="gap-2 flex flex-col border p-2 rounded-md">
            {contactPoints.map((point, i) => (
              <ContactPointRow
                key={i} // Changed from Math.random() to index for stable keys
                index={i}
                point={point}
                updateContactPoint={updateContactPoint}
                deleteContactRow={deleteContactRow}
              />
            ))}

            <Button
              onClick={addContactPoint}
              variant="secondary"
              className="col-span-2"
            >
              <Icons.add className="" />
              add another contact point
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={saveContact}>
            {isLoading && <Icons.spinner className="h-4 w-4 animate-spin" />}
            Create contact
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const ContactPointRow = ({
  index,
  point,
  updateContactPoint,
  deleteContactRow,
}: {
  index: number;
  point: ContactPoint;
  updateContactPoint: (
    index: number,
    updatedPoint: Partial<ContactPoint>
  ) => void;
  deleteContactRow: (index: number) => void;
}) => {
  const valuePlaceHolder =
    point.type == "email"
      ? "example@email.com"
      : point.type == "phone"
      ? "ex. (123) 456-7890"
      : point.type == "linkedIn"
      ? "LinkedIn profile url"
      : point.type == "instagram"
      ? "Instagram profile url"
      : point.type == "x"
      ? "X profile url"
      : point.type == "url"
      ? "url"
      : "enter value";

  return (
    <div className="flex gap-1 items-center relative rounded-md">
      <div className="grid grid-cols-2 w-full">
        <Select
          value={point.type}
          onValueChange={(newType) =>
            updateContactPoint(index, {type: newType})
          }
        >
          <SelectTrigger className="w-full rounded-r-none border-r-0 focus:ring-0">
            <SelectValue placeholder="Contact Type" />
          </SelectTrigger>
          <SelectContent>
            {ContactTypeData.map((type) => {
              const Icon = type.icon;
              return (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex gap-1 items-center">
                    <Icon className="h-4 w-4" />
                    {type.label}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        <Input
          className="bg-muted-foreground/20 rounded-l-none focus-visible:ring-0"
          placeholder={valuePlaceHolder}
          value={point.value}
          onChange={(e) => updateContactPoint(index, {value: e.target.value})}
        />
      </div>
      <Button
        onClick={() => deleteContactRow(index)}
        variant="ghost"
        size="sm"
        className="p-1 h-fit"
      >
        <Icons.close />
      </Button>
    </div>
  );
};
