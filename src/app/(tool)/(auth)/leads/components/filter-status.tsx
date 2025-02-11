import {Icons} from "@/components/icons";
import {Button} from "@/components/ui/button";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Separator} from "@/components/ui/separator";
import {LeadStatuses} from "@/config/data";
import {PlusCircle} from "lucide-react";

export const FilterStatus = ({
  selectedStatus,
  setSelectedStatus,
}: {
  selectedStatus: string[];
  setSelectedStatus: React.Dispatch<React.SetStateAction<string[]>>;
}) => {
  return (
    <div className=" flex h-9  items-center p-1 rounded-md border border-primary/30 overflow-hidden border-dashed">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-full  text-primary bg-muted-foreground/20 "
          >
            <PlusCircle className="mr-1 h-4 w-4" />
            Status
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-1 h-fit" align="start">
          <>
            {LeadStatuses.map((status) => (
              <button
                key={status.id}
                className="w-full px-8 p-2 h-fit flex items-center gap-2 hover:bg-muted whitespace-nowrap"
                onClick={() => {
                  if (selectedStatus?.includes(status.id)) {
                    setSelectedStatus(
                      selectedStatus?.filter((u) => u != status.id)
                    );
                  } else {
                    setSelectedStatus([...(selectedStatus || []), status.id]);
                  }
                }}
              >
                {/* {status.icon} */}
                {status.label}
                {selectedStatus?.includes(status.id) && (
                  <Icons.check className="h-4 w-4 text-primary ml-auto absolute left-2" />
                )}
              </button>
            ))}
          </>
        </PopoverContent>
      </Popover>
      {selectedStatus?.length > 0 && (
        <>
          <Separator
            orientation="vertical"
            className="mx-2 h-[50%] bg-primary/50"
          />
          <div className="flex gap-1">
            {selectedStatus.map((status) => (
              <div
                key={status}
                className="bg-muted-foreground/30   text-primary h-full rounded-sm px-2 flex items-center gap-1 text-sm"
              >
                <button
                  onClick={() => {
                    setSelectedStatus(
                      selectedStatus?.filter((u) => u != status)
                    );
                  }}
                  className="hover:text-primary/70"
                >
                  <Icons.close className="h-3 w-3" />
                </button>
                {LeadStatuses.find((u) => u.id == status)?.label}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
