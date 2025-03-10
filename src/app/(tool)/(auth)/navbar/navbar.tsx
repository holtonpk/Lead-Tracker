import {Icons, CrunchBaseLogo} from "@/components/icons";
import React, {useState} from "react";
import {Lists} from "./lists";
import {List as ListIcon, Mail} from "lucide-react";
import {List as ListType} from "@/config/data";
import {motion, AnimatePresence} from "framer-motion";
import {Button} from "@/components/ui/button";
import {LinkButton} from "@/components/ui/link";

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
  const [showEmailLists, setShowEmailLists] = useState(false);
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
        Tasks
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
          <Icons.loader className="mx-auto h-5 w-5  animate-spin col-span-2" />
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
      <button
        onClick={() => setShowEmailLists(!showEmailLists)}
        className="py-2 px-2 rounded-md  font-bold flex justify-between w-full hover:bg-primary/5 items-end "
      >
        <h1 className="font-bold text-base flex items-center gap-1 ">
          <Mail className="h-5 w-5" />
          Email Lists
        </h1>
        <Icons.chevronDown
          className={`h-4 w-4 text-muted-foreground mb-1 transition-transform duration-300
          ${showEmailLists ? "rotate-180" : "rotate-0"}
          
          `}
        />
      </button>
      <div className="grid grid-cols-[10px_1fr] pl-[18px]">
        {/* {isLoadingLists ? (
          <Icons.loader className="mx-auto h-5 w-5 mt-10 animate-spin col-span-2" />
        ) : ( */}
        <>
          <AnimatePresence>
            {showEmailLists && (
              <>
                <motion.div
                  initial={{height: 0}}
                  animate={{height: "100%"}}
                  exit={{height: 0}}
                  transition={{duration: 0.2}}
                  className="h-full w-[1px] bg-muted-foreground/20"
                ></motion.div>

                <EmailLists />
              </>
            )}
          </AnimatePresence>
        </>
        {/* )} */}
      </div>
      <LinkButton
        href="/ai-tune"
        className="w-full bg-blue-500 text-white hover:bg-blue-600 mt-auto "
      >
        <Icons.robot className="h-4 w-4 " />
        Ai Lead Tuning
      </LinkButton>
    </div>
  );
};

export default Navbar;

const EmailLists = () => {
  const emailLists = [
    {
      id: "1",
      name: "Campaign 1",
    },
    {
      id: "2",
      name: "Campaign 2",
    },
  ];

  return (
    <div className="flex  w-full  flex-col gap-1 items-start">
      {emailLists.map((list) => (
        <div
          key={list.id}
          className="w-full h-fit text-[12px] cursor-not-allowed  py-2 px-2 rounded-md hover:bg-muted-foreground/10 flex items-center"
        >
          {list.name}
        </div>
      ))}
    </div>
  );
};
