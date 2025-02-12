import React, {useState} from "react";
import {Lead, ContactTypeData, Contact, ContactPoint} from "@/config/data";
import {NewContactButton} from "@/app/(tool)/(auth)/leads/lists/lead/contact/create-contact";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {Icons} from "@/components/icons";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {updateDoc, doc} from "firebase/firestore";
import {db} from "@/config/firebase";
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
import {pid} from "process";

export const ContactDisplay = ({lead}: {lead: Lead}) => {
  return (
    <div className="flex flex-col   px-2">
      {lead.contacts && lead.contacts.length > 0 ? (
        <div className="flex flex-col gap-1 rounded-md">
          <div className="flex gap-2 font-bold items-center justify-between w-full  px-3"></div>
          <div className="flex flex-col border rounded-md overflow-hidden bg-background ">
            <div className="w-full grid grid-cols-3 border-b py-1   divide-x">
              <h1 className="pl-4 font-bold text-primary/60">Name</h1>
              <h1 className="pl-4 font-bold text-primary/60">Role</h1>
              <h1 className="pl-4 font-bold text-primary/60">Type</h1>
              {/* <h1 className="pl-4 font-bold text-primary/60">Status</h1> */}
            </div>
            <div className="flex flex-col divide-y">
              {lead.contacts.map((contact, i) => (
                <ContactRow contact={contact} key={i} lead={lead} />
              ))}
            </div>
          </div>

          <NewContactButton text="Add a Contact" leadId={lead.id} />
        </div>
      ) : (
        <div className="w-full flex-col flex items-center  p-2 px-4 gap-2">
          <h1 className="text-2xl font-bold">No Contacts</h1>
          <NewContactButton text="Add a Contact" leadId={lead.id} />
        </div>
      )}
    </div>
  );
};

const ContactRow = ({contact, lead}: {contact: Contact; lead: Lead}) => {
  const [open, setOpen] = useState(false);

  const [newContactPoints, setNewContactPoints] = useState<
    ContactPoint[] | undefined
  >();

  const addContactPoint = () => {
    setNewContactPoints([
      ...(newContactPoints || []),
      {
        value: "",
        type: "",
        id: Math.random().toLocaleString(),
      },
    ]);
  };

  const updateContactPoint = (
    index: number,
    updatedPoint: Partial<ContactPoint>
  ) => {
    setNewContactPoints((prev) =>
      prev?.map((point, i) =>
        i === index ? {...point, ...updatedPoint} : point
      )
    );
  };

  const deleteContactRow = (index: number) => {
    setNewContactPoints(undefined);
  };

  const saveContactPoint = async () => {
    if (!newContactPoints || newContactPoints.length < 0) return;
    // Find the contact's index in the contacts array

    const contactIndex = lead.contacts?.findIndex((c) => c.id === contact.id);

    // If contact exists
    if (
      typeof contactIndex === "number" &&
      contactIndex !== -1 &&
      lead.contacts
    ) {
      // Create a new contacts array with the updated contact
      const updatedContacts = [...lead.contacts];

      // Update the specific contact's contactPoints
      updatedContacts[contactIndex] = {
        ...updatedContacts[contactIndex],
        contactPoints: [
          ...updatedContacts[contactIndex].contactPoints,
          newContactPoints[0],
        ],
      };

      // Update the document
      await updateDoc(doc(db, `companies/${lead.id}`), {
        contacts: updatedContacts,
      });
      setNewContactPoints(undefined);
    }
  };

  const deleteContactPoint = async (pointId: string) => {
    // Find the contact that contains this contact point
    const contactIndex = lead.contacts?.findIndex((contact) =>
      contact.contactPoints.some((point) => point.id === pointId)
    );

    if (
      typeof contactIndex === "number" &&
      contactIndex !== -1 &&
      lead.contacts
    ) {
      // Create a new contacts array
      const updatedContacts = [...lead.contacts];

      // Filter out the specific contact point
      updatedContacts[contactIndex] = {
        ...updatedContacts[contactIndex],
        contactPoints: updatedContacts[contactIndex].contactPoints.filter(
          (point) => point.id !== pointId
        ),
      };

      // Update the document
      await updateDoc(doc(db, `companies/${lead.id}`), {
        contacts: updatedContacts,
      });
    }
  };

  const deleteContact = async () => {
    // Filter out the contact to be deleted
    const updatedContacts =
      lead.contacts?.filter((contactL) => contactL.id !== contact.id) || [];

    await updateDoc(doc(db, `companies/${lead.id}`), {
      contacts: updatedContacts,
    });
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full grid grid-cols-3 divide-x items-center py-2 hover:bg-muted"
      >
        <h1 className="pl-4 font-bold">{contact.name}</h1>
        <h1 className="pl-4 font-bold">{contact.role}</h1>
        <div className="flex pl-4  w-full">
          {contact.contactPoints.map((point, i) => {
            const Icon = ContactTypeData.find(
              (cp) => cp.value == point.type
            )?.icon;

            return (
              <div
                key={point.value}
                className="border rounded-full h-6 w-6 flex justify-center items-center bg-background"
              >
                {Icon && <Icon className="h-4 w-4 text-primary" />}
                {/* {ContactTypeData.find((cp)=> cp.value == point.type)?.label} */}
              </div>
            );
          })}
        </div>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{contact.name}</DialogTitle>
            <DialogDescription>
              {contact.role} of {lead.name}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1">
            {contact.contactPoints.map((point, i) => (
              <PointRow
                point={point}
                key={i}
                deleteContactPoint={deleteContactPoint}
              />
            ))}
            {newContactPoints &&
              newContactPoints.map((point, i) => (
                <ContactPointRow
                  key={point.id}
                  index={i}
                  point={point}
                  updateContactPoint={updateContactPoint}
                  deleteContactRow={deleteContactRow}
                />
              ))}
            {newContactPoints && newContactPoints?.length > 0 && (
              <Button onClick={saveContactPoint} className="col-span-2 mt-2">
                Save
              </Button>
            )}
            {(!newContactPoints || newContactPoints?.length < 0) && (
              <Button
                onClick={addContactPoint}
                variant="secondary"
                className="col-span-2 "
              >
                <Icons.add className="" />
                add another contact point
              </Button>
            )}
          </div>
          <DialogFooter>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant={"ghost"}
                  className="text-destructive mr-auto hover:bg-destructive/60 hover:text-destructive"
                >
                  <Icons.trash />
                  Delete contact
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently this
                    contact.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={deleteContact}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ContactDisplay;

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
    <div className="flex mt-3 items-center relative rounded-md ">
      <div className="grid grid-cols-2 w-full shadow-sm flex-grow">
        <Select
          value={point.type}
          onValueChange={(newType) =>
            updateContactPoint(index, {type: newType})
          }
        >
          <SelectTrigger className="w-full rounded-r-none border-r-0 focus:ring-0 h-12">
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
          className="bg-muted-foreground/20 rounded-l-none focus-visible:ring-0 h-12"
          placeholder={valuePlaceHolder}
          value={point.value}
          onChange={(e) => updateContactPoint(index, {value: e.target.value})}
        />
      </div>
      <Button onClick={() => deleteContactRow(index)} variant="ghost" size="sm">
        <Icons.close />
      </Button>
    </div>
  );
};

const PointRow = ({
  point,
  deleteContactPoint,
}: {
  point: ContactPoint;
  deleteContactPoint: (pointId: string) => void;
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

  return (
    <div className="w-full flex items-center">
      <div className="flex items-center flex-grow border gap-2 rounded-md shadow-sm p-2">
        {Icon && <Icon className="h-6 w-6 text-primary" />}
        {point.value}

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
      </div>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button variant={"ghost"} size="sm">
            <Icons.trash />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              account and remove your data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteContactPoint(point.id);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
