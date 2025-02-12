import {Icons} from "@/components/icons";
import React, {useState} from "react";
import {Lists} from "./lists";
import {List as ListIcon} from "lucide-react";
import {List as ListType} from "@/config/data";
import {motion, AnimatePresence} from "framer-motion";

const Navbar = ({
  isLoadingLists,
  LeadLists,
  displayedLeadList,
  setDisplayedLeadList,
  tab,
  setTab,
}: {
  isLoadingLists: boolean;
  LeadLists: ListType[];
  displayedLeadList: string;
  setDisplayedLeadList: React.Dispatch<React.SetStateAction<string>>;
  tab: string;
  setTab: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const [showLists, setShowLists] = useState(true);

  return (
    <div className="w-full h-screen flex flex-col gap-2 bg-[#FAFAFA] py-2 px-2 relative">
      <button
        onClick={() => setTab("dashboard")}
        className={`py-2 px-2 rounded-md  font-bold  flex items-center gap-1 mt-2 w-full text-base
        ${
          tab == "dashboard"
            ? "bg-primary/10"
            : "bg-transparent hover:bg-primary/5"
        }
        `}
      >
        <Icons.todo className="h-5 w-5" />
        Dashboard
      </button>

      <button
        onClick={() => setShowLists(!showLists)}
        className="py-2 px-2 rounded-md  font-bold flex justify-between w-full hover:bg-primary/5 items-end "
      >
        <h1 className="font-bold text-base flex items-center gap-1 ">
          <ListIcon className="h-5 w-5" />
          Lists
        </h1>
        <Icons.chevronDown
          className={`h-4 w-4 text-muted-foreground mb-1 transition-transform duration-300
          ${showLists ? "rotate-180" : "rotate-0"}
          
          `}
        />
      </button>
      <div className="grid grid-cols-[10px_1fr] pl-[18px]">
        {isLoadingLists ? (
          <Icons.loader className="mx-auto h-5 w-5 mt-10 animate-spin col-span-2" />
        ) : (
          <>
            <AnimatePresence>
              {showLists && (
                <>
                  <motion.div
                    initial={{height: 0}}
                    animate={{height: "100%"}}
                    exit={{height: 0}}
                    transition={{duration: 0.2}}
                    className="h-full w-[1px] bg-muted-foreground/20"
                  ></motion.div>

                  <Lists
                    LeadLists={LeadLists}
                    displayedLeadList={displayedLeadList}
                    setDisplayedLeadList={setDisplayedLeadList}
                    tab={tab}
                    setTab={setTab}
                  />
                </>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
};

export default Navbar;
