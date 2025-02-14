import {Icons} from "@/components/icons";
import {ContactTypeData, Lead, SourceType, Task} from "@/config/data";
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
export const LeadRow = ({
  lead,
  setSelectedLead,
  selectedLead,
  setGroupSelectedLeads,
  groupSelectedLeads,
  displayedLeadList,
}: {
  lead: Lead;
  setSelectedLead: React.Dispatch<React.SetStateAction<string | undefined>>;
  selectedLead: string | undefined;
  groupSelectedLeads: Lead[] | undefined;
  setGroupSelectedLeads: React.Dispatch<
    React.SetStateAction<Lead[] | undefined>
  >;
  displayedLeadList: string;
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
          <span className="text-destructive bg-destructive/20 px-4 py-1 rounded-sm">
            Missing
          </span>
        );
      }

      return formatTimeDifference(soonestTask.date as Timestamp);
    })()
  ) : (
    <span className="text-destructive bg-destructive/20 px-4 py-1 rounded-sm">
      Missing
    </span>
  );

  return (
    <div className=" p-2  relative items-center grid grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr_36px] gap-4  px-4 pl-[40px] group ">
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
      <div className="flex items-center gap-1 w-fit pointer-events-none relative ml-4 ">
        <img
          src={getFaviconUrl(lead.website)}
          className="h-6 w-6 rounded-full border bg-white"
        />
        <h1 className="font-bold  text-primary whitespace-nowrap max-w-full overflow-hidden text-ellipsis ">
          {lead.name}
        </h1>
      </div>
      <Link
        target="_blank"
        href={new URL(lead.website).origin}
        className="flex items-center hover:text-blue-600 hover:underline transition-all duration-100 relative max-w-full w-fit overflow-hidden text-ellipsis "
      >
        {new URL(lead.website).hostname.replace(/^www\./, "")}
      </Link>
      <div>
        <div className="mx-auto relative capitalize pointer-events-none">
          {nextTask}
        </div>
      </div>

      {/* <div className="flex items-center relative w-fit pointer-events-none">
        {lead.createdAt && formatTimeDifference(lead.createdAt as Timestamp)}
      </div> */}
      <div className="flex items-center relative max-w-full pointer-events-none">
        {/* {formatTimeDifference(lead.updatedAt as Timestamp)} */}

        {lead.contacts && lead.contacts.length > 0 ? (
          // lead.contacts.flatMap((contact) =>
          //   contact.contactPoints.map((point, index) => {
          //     const Icon = ContactTypeData.find(
          //       (contactType) => contactType.value === point.type
          //     )?.icon;

          //     return (
          //       <div
          //         key={`${contact.id}-${index}`}
          //         className="rounded-[2px] aspect-square h-6 w-6  border flex justify-center items-center"
          //       >
          //         {Icon && <Icon className="h-4 w-4" />}
          //       </div>
          //     );
          //   })
          // )
          <p className="mx-auto">
            {lead.contacts.reduce(
              (sum, arr) => sum + arr.contactPoints.length,
              0
            )}
          </p>
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
    <div className="flex items-center relative">
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
