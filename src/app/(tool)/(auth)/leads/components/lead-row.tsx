import {Icons} from "@/components/icons";
import {
  ContactTypeData,
  Lead,
  LeadStatuses,
  SourceDataFull,
} from "@/config/data";
import {db} from "@/config/firebase";
import {formatTimeDifference, getFaviconUrl, hexToRgba} from "@/lib/utils";
import {doc, Timestamp, updateDoc} from "firebase/firestore";
import Link from "next/link";
import {useState} from "react";

export const LeadRow = ({
  lead,
  setSelectedLead,
  selectedLead,
  setGroupSelectedLeads,
  groupSelectedLeads,
}: {
  lead: Lead;
  setSelectedLead: React.Dispatch<React.SetStateAction<string | undefined>>;
  selectedLead: string | undefined;
  groupSelectedLeads: Lead[] | undefined;
  setGroupSelectedLeads: React.Dispatch<
    React.SetStateAction<Lead[] | undefined>
  >;
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

  const status = LeadStatuses.find((u) => u.id == lead.status);

  return (
    <div className=" p-2  relative items-center grid grid-cols-6 gap-4  px-4 pl-[40px] group ">
      <button
        onClick={toggleGroupSelected}
        className={`h-5 rounded-sm w-5   absolute left-4 top-1/2 -translate-y-1/2 z-20 border-2 border-primary flex justify-center items-center
        
      ${isGroupSelected ? "bg-primary" : ""}
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
      <div className="flex items-center gap-1 w-fit  relative ml-4 ">
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
        href={lead.website}
        className="flex items-center hover:text-blue-600 hover:underline transition-all duration-100 relative max-w-full w-fit overflow-hidden text-ellipsis "
      >
        {new URL(lead.website).hostname}
      </Link>
      <div className="flex items-center relative w-fit">
        {formatTimeDifference(lead.createdAt as Timestamp)}
      </div>
      <div className="flex items-center relative max-w-full">
        {/* {formatTimeDifference(lead.updatedAt as Timestamp)} */}
        <div className="flex items-center relative w-fit overflow-hidden">
          {lead.contacts ? (
            lead.contacts.flatMap((contact) =>
              contact.contactPoints.map((point, index) => {
                const Icon = ContactTypeData.find(
                  (contactType) => contactType.value === point.type
                )?.icon;

                return (
                  <div
                    key={`${contact.id}-${index}`}
                    className="rounded-[2px] aspect-square h-6 w-6  border flex justify-center items-center"
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                  </div>
                );
              })
            )
          ) : (
            <>no contacts</>
          )}
        </div>
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
      <div
        style={{
          color: SourceDataFull.find((source) => source.label === lead.source)
            ?.color,
          background: hexToRgba(
            SourceDataFull.find((source) => source.label === lead.source)
              ?.color || "",
            0.15
          ),
        }}
        className="flex items-center  gap-1 text-sm rounded-[8px] px-2 w-fit   relative"
      >
        <div
          style={{
            backgroundColor: SourceDataFull.find(
              (source) => source.label === lead.source
            )?.color,
            borderColor: SourceDataFull.find(
              (source) => source.label === lead.source
            )?.color,
          }}
          className="h-[5px] w-[5px] rounded-full"
        />
        {lead?.source}
      </div>
    </div>
  );
};

const Rating = ({id, score}: {id: string; score: number}) => {
  const [value, setValue] = useState(score); // Stored score
  const [hoveredValue, setHoveredValue] = useState<number | null>(null); // Hovered score

  const displayValue = hoveredValue !== null ? hoveredValue : value; // Show hovered or actual score

  const onValueChange = (newValue: number) => {
    updateDoc(doc(db, "companies", id), {
      score: newValue,
    });
    setValue(newValue); // Update score
  };

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
