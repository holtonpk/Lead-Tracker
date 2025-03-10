import {toast} from "sonner";
import React, {useState} from "react";
import {
  Lead,
  ContactTypeData,
  Contact,
  ContactPoint,
  People,
} from "@/config/data";
import {NewContactButton} from "@/app/(tool)/(auth)/lists/lead/contact/create-contact";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {Icons, LinkedInLogo} from "@/components/icons";
import Link from "next/link";
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
import {ScrapeContacts} from "@/app/(tool)/(auth)/lists/buttons/scrape-contacts";
import {LinkButton} from "@/components/ui/link";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
export const ContactDisplay = ({lead}: {lead: Lead}) => {
  return (
    <div className="flex flex-col h-[calc(100vh-293px)]  px-2">
      {(lead.contacts && lead.contacts.length > 0) ||
      (lead.people && lead.people.length > 0) ? (
        <div className="  rounded-md  grid h-full grid-rows-2">
          <div className="flex flex-col gap-1 h-full ">
            <div className="flex justify-between">
              <h1 className="pl-2 font-bold ">Contacts</h1>
              {lead.contacts && lead.contacts.length > 0 && (
                <NewContactButton leadId={lead.id}>
                  <Button
                    size={"sm"}
                    className="h-6 gap-1"
                    variant={"secondary"}
                  >
                    <Icons.add />
                    add a contact
                  </Button>
                </NewContactButton>
              )}
            </div>
            {lead.contacts && lead.contacts.length > 0 ? (
              <div className="flex flex-col border rounded-md">
                <div className="w-full grid grid-cols-[1fr_1fr_90px] border-b py-1    divide-x">
                  <h1 className="pl-4 font-bold text-primary/60">Name</h1>
                  <h1 className="pl-4 font-bold text-primary/60">Role</h1>
                  <h1 className="pl-4 font-bold text-primary/60">Points</h1>
                  {/* <h1 className="pl-4 font-bold text-primary/60">Status</h1> */}
                </div>
                <div className="flex flex-col divide-y max-h-[150px] overflow-y-auto ">
                  {lead.contacts.map((contact, i) => (
                    <ContactRow
                      contact={contact}
                      key={contact.id}
                      lead={lead}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col border rounded-md p-8 justify-center items-center bg-muted gap-1">
                <h1 className="pl-2 font-bold text-primary/60">
                  No contacts saved
                </h1>
                <p className="text-muted-foreground text-center text-sm">
                  Manually add a contact or add a person from the people list.
                </p>
                <NewContactButton leadId={lead.id}>
                  <Button variant={"outline"}>
                    <Icons.add />
                    Add a contact
                  </Button>
                </NewContactButton>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1 h-full">
            <h1 className="pl-2 font-bold text-primary">People</h1>
            {lead.people && lead.people.length > 0 ? (
              <div className="flex flex-col divide-y  overflow-y-auto border rounded-md">
                {lead.people?.map((person, i) => (
                  <PersonRow person={person} key={i} lead={lead} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col border rounded-md p-8 justify-center items-center bg-muted gap-1">
                <h1 className="pl-2 font-bold text-primary/60">
                  No people saved
                </h1>
                <p className="text-muted-foreground text-center text-sm">
                  Find people associated with this company. This will charge
                  credits.
                </p>
                <ScrapeContacts
                  leadId={lead.id}
                  leadUrl={lead.website}
                  lead={lead}
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="w-fit mx-auto flex-col flex items-center  border rounded-md py-12 mt-16 bg-muted/50 px-10 gap-2">
          <h1 className="text-2xl ">No Contacts</h1>
          <p className="text-muted-foreground max-w-sm text-center">
            Add a contact manually or scrape contacts. Scraping will charge
            credits.
          </p>
          <div className="grid grid-cols-2 gap-2 items-center">
            <NewContactButton leadId={lead.id}>
              <Button variant={"outline"}>
                <Icons.add />
                Add manually
              </Button>
            </NewContactButton>
            <ScrapeContacts
              leadId={lead.id}
              leadUrl={lead.website}
              lead={lead}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const PersonRow = ({person, lead}: {person: People; lead: Lead}) => {
  const isAlreadyInContacts = lead.contacts?.some(
    (contact) => contact.id === person.id
  );

  const addToContacts = async () => {
    const updatedContacts = [
      ...(lead.contacts || []),
      {
        id: person.id,
        name: person.name,
        role: person.title,
        photo_url: person.photo_url,
        contactPoints: [
          person.linkedin_url && {
            type: "linkedIn",
            value: person.linkedin_url,
            id: Math.random().toLocaleString(),
          },
          person.email !== null && {
            type: "email",
            value: person.email,
            id: Math.random().toLocaleString(),
          },
        ],
      },
    ];

    await updateDoc(doc(db, `companies/${lead.id}`), {
      contacts: updatedContacts,
    });
  };

  return (
    <div className="flex items-center p-2 ">
      <Link
        href={person.linkedin_url}
        target="_blank"
        className=" hover:underline font-bold flex items-center gap-2"
      >
        <Avatar>
          <AvatarImage src={person.photo_url} />
          <AvatarFallback>
            {person.name
              .split(" ")
              .map((name) => name[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
        <h1>{person.name}</h1>
      </Link>
      <h1 className="pl-4 ">{person.title}</h1>
      <div className="flex gap-1 ml-auto items-center">
        {person.linkedin_url && <LinkedInLogo className="w-4 h-4" />}
        {person.email && <Icons.mail className="w-4 h-4" />}
        {!isAlreadyInContacts ? (
          <Button onClick={addToContacts} variant={"outline"} size={"sm"}>
            <Icons.add />
            add
          </Button>
        ) : (
          <div className="flex items-center gap-1 text-green-500 bg-green-500/10 px-2 py-1 rounded-md">
            <Icons.check className="size-4" />
            added
          </div>
        )}
      </div>
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
        className="w-full grid grid-cols-[1fr_1fr_90px] divide-x items-center py-2 hover:bg-muted"
      >
        <div className="flex gap-1 items-center pl-4">
          <Avatar className="w-6 h-6">
            <AvatarImage src={contact.photo_url} />
            <AvatarFallback className="text-[12px]">
              {contact.name
                .split(" ")
                .map((name) => name[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <h1 className="whitespace-nowrap overflow-hidden text-ellipsis">
            {contact.name}
          </h1>
        </div>
        <h1 className="pl-4 font-bold text-left">{contact.role}</h1>
        <div className="flex pl-4  w-full">
          {contact.contactPoints.map((point, i) => {
            const Icon = ContactTypeData.find(
              (cp) => cp.value == point.type
            )?.icon;

            return (
              <div
                key={point.value}
                className=" h-6 w-6 flex justify-center items-center "
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
            <DialogTitle>
              <div className="flex gap-1 items-center">
                <Avatar>
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
            </DialogTitle>
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
                lead={lead}
                contact={contact}
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
  lead,
  contact,
}: {
  point: ContactPoint;
  deleteContactPoint: (pointId: string) => void;
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
