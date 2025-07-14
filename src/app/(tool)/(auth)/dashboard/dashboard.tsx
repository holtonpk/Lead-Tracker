"use client";

import {Icons} from "@/components/icons";
import {Lead, Task} from "@/config/data";
import {db} from "@/config/firebase";
import {
  addDoc,
  collection,
  getDocs,
  onSnapshot,
  query,
} from "firebase/firestore";
import React, {useEffect, useState} from "react";
import {Calendar} from "@/components/ui/calendar";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {CalendarIcon} from "lucide-react";
import {cn} from "@/lib/utils";
import {convertTimestampToDate} from "@/lib/utils";
import {format} from "date-fns";
import {Timestamp} from "firebase/firestore";
import {useAuth} from "@/context/user-auth";
import {Button} from "@/components/ui/button";
import {ResearchTaskRow, OutreachTaskRow} from "./components";

type LeadTask = Task & {lead: Lead};

export const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>();

  useEffect(() => {
    const clientIdeaDataQuery = query(collection(db, "companies-fixed"));
    const unsubscribe = onSnapshot(clientIdeaDataQuery, (querySnapshot) => {
      const leadsData: Lead[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        leadsData.push(data as Lead);
      });
      // setFilteredLeads(leadsData);
      setLeads(leadsData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const [date, setDate] = useState<Date | undefined>(new Date());

  const addDays = (date: Date | undefined, days: number): Date => {
    if (!date) return new Date();
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + days);
    return newDate;
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  const filterTasksByDate = (
    leads: Lead[] | undefined,
    selectedDate: Date | undefined
  ): LeadTask[] => {
    if (!leads || !selectedDate) return [];

    return leads.reduce<LeadTask[]>((allTasks, lead) => {
      if (lead.completed || !lead.tasks) return allTasks;

      const tasksWithLead = lead.tasks
        .filter((task) => {
          const taskDate = convertTimestampToDate(task.date as Timestamp);
          return isSameDay(taskDate, selectedDate);
        })
        .map((task) => ({
          ...task,
          lead,
        }))
        .sort((a, b) => {
          // Sort research tasks first
          if (a.action === "research" && b.action !== "research") return -1;
          if (a.action !== "research" && b.action === "research") return 1;
          return 0;
        });

      return [...allTasks, ...tasksWithLead];
    }, []);
  };

  // Usage:
  const leadsWithTasks = filterTasksByDate(leads, date);

  const [openPicker, setOpenPicker] = useState(false);

  const onDateChange = (value: Date | undefined) => {
    setDate(value);
    setOpenPicker(false);
  };

  const goToNextDay = () => {
    setDate(addDays(date, 1));
  };

  const goToPrevDay = () => {
    setDate(addDays(date, -1));
  };

  const {currentUser} = useAuth()!;

  const [timeFrame, setTimeFrame] = useState<string>("today");

  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollDone, setScrollDone] = useState(false);

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    const isAtBottom =
      Math.abs(
        scrollTop + e.currentTarget.clientHeight - e.currentTarget.scrollHeight
      ) < 16;
    setScrollDone(isAtBottom);
    if (scrollTop !== 0) {
      setIsScrolled(true);
    } else {
      setIsScrolled(false);
    }
  };

  const renderTaskRow = (task: LeadTask, index: number) => {
    switch (task.action) {
      case "research":
        return <ResearchTaskRow task={task} key={task.id + index} />;

      case "initialContact":
      case "followUp":
        return <OutreachTaskRow task={task} key={task.id + index} />;
      default:
        return null;
    }
  };

  // const fixData = async () => {
  //   // get data from /companies
  //   // get all that have the value "qd8vimrcyht" in lists
  //   let data: any[] = [];
  //   const companies = await getDocs(collection(db, "companies"));
  //   companies.forEach(async (company) => {
  //     const companyData = company.data();
  //     if (companyData.lists.includes("qd8vimrcyht")) {
  //       const newTasks = companyData.tasks.map((task: Task) => {
  //         if (task.contact && task.contact.id) {
  //           return {
  //             ...task,
  //             contact: task.contact.id,
  //           };
  //         }
  //         return {
  //           ...task,
  //         };
  //       });

  //       data.push({
  //         ...companyData,
  //         tasks: newTasks,
  //       });
  //     }
  //   });
  //   // console.log("dd", data);
  //   // now make a new collection called "companies-fixed" and add the data to it
  //   const companiesFixed = collection(db, "companies-fixed");
  //   data.forEach(async (company) => {
  //     await addDoc(companiesFixed, company);
  //   });
  //   console.log("done");
  // };

  return (
    <div className="flex flex-col p-6 relative">
      {/* <Button onClick={fixData}>Fix Data</Button> */}
      <div className="flex gap-4 items-center ">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Icons.todo className="text-muted-foreground" />
          Tasks
        </h1>
        <div className="flex  items-center">
          <Button
            onClick={goToPrevDay}
            className="h-8 w-8 rounded-full -mr-2 "
            variant={"ghost"}
          >
            <Icons.chevronLeft />
          </Button>
          <Popover open={openPicker} onOpenChange={setOpenPicker}>
            <PopoverTrigger asChild>
              <Button
                variant={"ghost"}
                className={cn(
                  "w-fit  text-left font-normal items-center justify-start flex gap-2  text-primary",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className=" h-4 w-4 opacity-50" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={onDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button
            onClick={goToNextDay}
            className="h-8 w-8 rounded-full -ml-2 "
            variant={"ghost"}
          >
            <Icons.chevronRight />
          </Button>
        </div>
      </div>
      <div className="w-full  h-[calc(100vh-300px)] relative">
        <div
          onScroll={onScroll}
          className="flex flex-col bg-background   border p-2 flex-grow rounded-md  overflow-scroll gap-2 h-[calc(100vh-100px)] pb-4"
        >
          {leadsWithTasks.length < 1 || !leadsWithTasks ? (
            <div className="w-full h-full items-center justify-center flex text-lg">
              {" "}
              Nothing Scheduled
            </div>
          ) : (
            <>
              {leadsWithTasks?.flatMap((task, index) =>
                renderTaskRow(task, index)
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
