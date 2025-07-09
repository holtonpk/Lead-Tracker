import {Icons} from "@/components/icons";
import {
  ContactPoint,
  ContactTypeData,
  Contact,
  Lead,
  SourceType,
  Task,
} from "@/config/data";
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
import {db} from "@/config/firebase";
import {formatTimeDifference, getFaviconUrl, hexToRgba} from "@/lib/utils";
import {doc, Timestamp, updateDoc, getDoc} from "firebase/firestore";
import Link from "next/link";
import {useEffect, useState} from "react";
import {Button} from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {RemoveFromList} from "@/app/(tool)/(auth)/lists/buttons/remove-from-list";
import {AddToList} from "@/app/(tool)/(auth)/lists/buttons/add-to-list";
import {DeleteLead} from "@/app/(tool)/(auth)/lists/buttons/delete-lead";
import {Phone} from "lucide-react";
import {Avatar, AvatarImage, AvatarFallback} from "@/components/ui/avatar";
import {
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {Select} from "@/components/ui/select";
import {Input} from "@/components/ui/input";
import {toast} from "sonner";
import {TooltipProvider} from "@/components/ui/tooltip";
import {Tooltip, TooltipTrigger} from "@/components/ui/tooltip";
import {TooltipContent} from "@radix-ui/react-tooltip";
export const LeadRow = ({
  lead,
  setSelectedLead,
  selectedLead,
  setGroupSelectedLeads,
  groupSelectedLeads,
  displayedLeadList,
  usersData,
}: {
  lead: Lead;
  setSelectedLead: React.Dispatch<React.SetStateAction<string | undefined>>;
  selectedLead: string | undefined;
  groupSelectedLeads: Lead[] | undefined;
  setGroupSelectedLeads: React.Dispatch<
    React.SetStateAction<Lead[] | undefined>
  >;
  displayedLeadList: string;
  usersData: any[];
}) => {
  const isGroupSelected = groupSelectedLeads?.some((l) => l.name === lead.name);

  const toggleGroupSelected = () => {
    if (isGroupSelected) {
      setGroupSelectedLeads(
        groupSelectedLeads?.filter((l) => l.name !== lead.name)
      );
    } else {
      setGroupSelectedLeads([...(groupSelectedLeads || []), lead]);
    }
  };

  const [source, setSource] = useState<SourceType | undefined>();

  useEffect(() => {
    const fetchSource = async () => {
      const docSnap = await getDoc(doc(db, `sources/${lead.sourceId}`));
      if (docSnap.exists()) {
        setSource(docSnap.data() as SourceType);
      }
    };
    if (lead.sourceId) {
      fetchSource();
    }
  }, [lead]);

  const nextTask = lead?.tasks ? (
    (() => {
      const soonestTask = lead.tasks
        .filter((task) => !task.isCompleted)
        .reduce<Task | null>(
          (soonest, task) =>
            !soonest || task.date < soonest.date ? task : soonest,
          null
        );

      if (!soonestTask?.date) {
        return (
          <span className="text-yellow-400 bg-yellow-400/20 px-4 py-1 rounded-sm">
            Missing
          </span>
        );
      }

      return formatTimeDifference(soonestTask.date as Timestamp);
    })()
  ) : (
    <span className="text-yellow-400 bg-yellow-400/20 px-4 py-1 rounded-sm">
      Missing
    </span>
  );

  const creator = usersData.find(
    (user) => user.firstName === lead.createdBy || user.uid === lead.createdBy
  );

  const cleanedWebsite = (website: string) => {
    if (!website) return "";
    if (website.startsWith("http")) {
      return website;
    }
    return `https://${website}`;
  };

  return (
    <div className=" p-2  relative items-center grid grid-cols-[200px_1fr_1fr_1fr_1fr_150px_1fr_36px] gap-4  px-4 pl-[40px] group ">
      <button
        onClick={toggleGroupSelected}
        className={`h-5 rounded-sm w-5  transition-all absolute left-4 top-1/2 -translate-y-1/2 z-20 border-2  flex justify-center items-center
        
      ${
        isGroupSelected
          ? "bg-primary border-primary"
          : "border-muted-foreground hover:bg-muted-foreground"
      }
        `}
      >
        {isGroupSelected && <Icons.check className="h-6 w-6 text-background" />}
      </button>
      <button
        onClick={() => setSelectedLead(lead.id)}
        className={`absolute left-0 top-0 w-full h-full transition-colors duration-100 
          
          ${
            isGroupSelected
              ? "bg-muted"
              : "bg-background group-hover:bg-muted/60"
          }
          `}
      ></button>
      <div className="flex items-center gap-2  pointer-events-none relative ml-4 w-full">
        <img
          src={getFaviconUrl(lead.website)}
          className="h-6 w-6 rounded-sm border bg-white shadow-sm"
        />
        <h1 className="text-primary whitespace-nowrap max-w-full overflow-hidden text-ellipsis ">
          {lead.name}
        </h1>
      </div>
      <Link
        target="_blank"
        href={new URL(cleanedWebsite(lead.website)).origin}
        className="flex text-sm items-center hover:text-blue-600 hover:underline transition-all duration-100 relative max-w-full w-fit overflow-hidden text-ellipsis "
      >
        {new URL(cleanedWebsite(lead.website)).hostname}
      </Link>
      <div>
        <div className="mx-auto relative capitalize pointer-events-none text-sm">
          {lead?.completed ? (
            <>
              {lead.completed.type == "callScheduled" ? (
                <div className="text-green-500 w-fit px-4 rounded-sm bg-green-500/20 text-center py-1 text-sm ">
                  call scheduled
                </div>
              ) : (
                <div className="text-destructive w-fit px-4 rounded-sm bg-destructive/20 text-center py-1 text-sm ">
                  unqualified
                </div>
              )}
            </>
          ) : (
            nextTask
          )}
        </div>
      </div>
      {/* <div className="flex items-center relative w-fit pointer-events-none">
        {lead.createdAt && formatTimeDifference(lead.createdAt as Timestamp)}
      </div> */}
      <div className="flex items-center relative w-fit mx-auto ">
        {/* {formatTimeDifference(lead.updatedAt as Timestamp)} */}

        {lead.contacts && lead.contacts.length > 0 ? (
          <div className="flex items-center gap-1 mx-auto relative ">
            <div className="flex item-center">
              {lead.contacts.slice(0, 3).map((contact) => {
                return (
                  <ContactDisplay
                    key={contact.id}
                    contact={contact}
                    lead={lead}
                  />
                );
              })}
            </div>
            {lead.contacts.length > 3 && (
              <p className="pointer-events-none text-[12px]">
                +{lead.contacts.length - 3} more
              </p>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground mx-auto">--</p>
        )}
      </div>
      <Rating id={lead.id} score={lead.score} />
      {/* <div
        style={{
          color: status?.color,
          background: status?.color && hexToRgba(status.color, 0.15),
        }}
        className="flex items-center  gap-1 text-sm rounded-[8px] px-2 w-fit   relative"
      >
        <div
          style={{backgroundColor: status?.color, borderColor: status?.color}}
          className="h-[5px] w-[5px] rounded-full"
        />
        {status?.label}
      </div> */}

      <div className="relative w-full flex items-center justify-center gap-2 ">
        <img
          src={creator?.photoURL}
          className="h-6 w-6 rounded-full border s"
        />
      </div>
      {source ? (
        <div
          style={{
            color: source.color,
            background: hexToRgba(source.color, 0.15),
          }}
          className="items-center  gap-1 text-sm rounded-[8px] px-2 w-fit  pointer-events-none relative whitespace-nowrap max-w-full overflow-hidden text-ellipsis grid grid-cols-[6px_1fr]"
        >
          <div
            style={{
              backgroundColor: source.color,
              borderColor: source.color,
            }}
            className="h-[5px] w-[5px] rounded-full "
          />
          <div className="max-w-full text-ellipsis overflow-hidden">
            {source.label}
          </div>
        </div>
      ) : (
        <p className="relative">--</p>
      )}
      <CompanyOptions lead={lead} displayedLeadList={displayedLeadList} />
    </div>
  );
};

export const CompanyOptions = ({
  lead,
  displayedLeadList,
}: {
  lead: Lead;
  displayedLeadList: string;
}) => {
  const [open, setOpen] = useState(false);

  const deleteCompany = async () => {};

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      {/* <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}> */}
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant={"secondary"} className="relative ml-auto ">
          <Icons.ellipsis className="h-4 w-4 text-primary rotate-90" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="left" className="border-border  ">
        <DropdownMenuItem
          // onSelect={() => setOpenMenu(true)}
          className=" gap-2 cursor-pointer focus:bg-primary/20"
          asChild
        >
          <AddToList companies={[lead]} onSuccess={() => setOpen(false)}>
            <button className="cursor-pointer relative flex select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0">
              <Icons.add className="h-4 w-4 " />
              Add to a List
            </button>
          </AddToList>
        </DropdownMenuItem>
        {displayedLeadList != "1" && (
          <DropdownMenuItem
            // onSelect={() => setOpenMenu(true)}
            className=" gap-2 cursor-pointer focus:bg-primary/20"
            asChild
          >
            <RemoveFromList
              companies={[lead]}
              listId={displayedLeadList}
              onSuccess={() => setOpen(false)}
            >
              <button className="cursor-pointer relative flex select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0">
                <Icons.xCircle className="h-4 w-4 " />
                Remove from list
              </button>
            </RemoveFromList>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem
          asChild
          // onSelect={() => setShowDeleteDialog(true)}
        >
          <DeleteLead leadId={lead.id} onSuccess={() => setOpen(false)}>
            <button className="w-full text-destructive cursor-pointer hover:bg-destructive/20 focus:text-destructive relative flex select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors  data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0">
              <Icons.trash className="h-4 w-4 " />
              Delete
            </button>
          </DeleteLead>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const Rating = ({id, score}: {id: string; score: number}) => {
  const [value, setValue] = useState(score); // Stored score
  const [hoveredValue, setHoveredValue] = useState<number | null>(null); // Hovered score

  const displayValue = hoveredValue !== null ? hoveredValue : value; // Show hovered or actual score

  const onValueChange = (newValue: number) => {
    updateDoc(doc(db, "companies", id), {
      score: newValue,
    });
    setValue(newValue); // Update score
  };

  useEffect(() => {
    setValue(score);
  }, [score]);

  return (
    <div className="flex items-center relative justify-center">
      {[...Array(3)].map((_, index) => (
        <button
          key={index}
          onClick={() => onValueChange(index + 1)} // Set score on click
          onMouseEnter={() => setHoveredValue(index + 1)} // Show hovered score
          onMouseLeave={() => setHoveredValue(null)} // Revert to actual score
          className="focus:outline-none"
        >
          <Icons.star
            className={`h-5 w-5 transition-colors  ${
              index < displayValue
                ? "fill-blue-300 text-blue-500"
                : "fill-none text-blue-500"
            }`}
          />
        </button>
      ))}
    </div>
  );
};

const ContactDisplay = ({contact, lead}: {contact: Contact; lead: Lead}) => {
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          key={contact.id}
          className="hover:z-[80] relative z-10 hover:scale-105 transition-all duration-100"
        >
          <Avatar className="h-6 w-6 rounded-full relative -ml-2 border bg-background">
            <AvatarImage src={contact.photo_url} />
            <AvatarFallback className="text-[12px]">
              {contact.name
                .split(" ")
                .map((name) => name[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
        </button>
      </DialogTrigger>
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
