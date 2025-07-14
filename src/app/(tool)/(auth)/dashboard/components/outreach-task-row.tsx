"use client";

import {Icons} from "@/components/icons";
import {Contact, ContactTypeData, Lead, Task} from "@/config/data";
import {db} from "@/config/firebase";
import {AnimatePresence, motion} from "framer-motion";
import React, {useState} from "react";
import {doc, updateDoc, serverTimestamp} from "firebase/firestore";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {OutreachTaskDialog} from "./outreach-task-dialog";

type LeadTask = Task & {lead: Lead};

interface OutreachTaskRowProps {
  task: LeadTask;
}

export const OutreachTaskRow = ({task}: OutreachTaskRowProps) => {
  const [isCompleted, setIsComplete] = useState(task.isCompleted);
  const [open, setOpen] = useState(false);

  const toggleComplete = async () => {
    const updatedTasks = task.lead.tasks?.map((taskL) =>
      taskL.id === task.id ? {...taskL, isCompleted: !isCompleted} : taskL
    );

    await updateDoc(doc(db, `companies/${task.lead.id}`), {
      tasks: updatedTasks,
    });
    if (!isCompleted) {
      setOpen(false);
    }
    setIsComplete(!isCompleted);
  };

  const deleteTask = async () => {
    try {
      const docRef = doc(db, "companies", task.lead.id);

      // Filter out the task to be deleted
      const updatedTasks = task.lead.tasks?.filter(
        (taskL) => taskL.id !== task.id
      );

      await updateDoc(docRef, {
        tasks: updatedTasks || [],
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const getFaviconUrl = (url: string) => {
    const cleanedWebsite = (website: string) => {
      if (!website) return "";
      if (website.startsWith("http")) {
        return website;
      }
      return `https://${website}`;
    };
    const domain = new URL(cleanedWebsite(url)).hostname;
    return `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
  };

  const contact = task.lead.contacts?.find(
    (contact) => contact.id === task.contact
  ) as Contact;

  return (
    <div className="flex items-center gap-1">
      <div className="flex justify-start items-center bg-background overflow-hidden text-primary p-3 px-4 rounded-lg border relative gap-4 w-full hover:bg-muted-foreground/20 transition-colors duration-300">
        <button
          onClick={toggleComplete}
          className={`border rounded-[4px] h-6 w-6 relative transition-colors duration-300 z-20 flex items-center justify-center
        ${
          isCompleted
            ? "bg-primary hover:border-primary"
            : "border-muted-foreground hover:bg-muted-foreground hover:border-muted-foreground"
        }
        `}
        >
          {isCompleted && <Icons.check className="text-background h-4 w-4" />}
        </button>
        <AnimatePresence>
          {isCompleted && (
            <motion.div
              animate={{width: "calc(100% - 76px)"}}
              initial={{width: "0%"}}
              exit={{width: "0%"}}
              className="absolute top-1/2 -translate-y-1/2 left-[56px] pointer-events-none h-[2px] bg-primary z-30 origin-left rounded-sm"
            ></motion.div>
          )}
        </AnimatePresence>
        <div
          className={`relative z-20 pointer-events-none flex gap-1 ${
            isCompleted ? "opacity-30" : "opacity-100"
          }`}
        >
          {task.action === "followUp" && "Follow up with"}
          {task.action === "initialContact" && "Reach out to"}{" "}
          {task.contact && (
            <>
              <div className="font-bold flex items-center gap-1">
                {contact.photo_url && (
                  <Avatar className="w-5 h-5 border">
                    <AvatarImage src={contact.photo_url} />
                    <AvatarFallback>
                      {contact.name
                        .split(" ")
                        .map((name: string) => name[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                )}
                {contact.name}
              </div>{" "}
              from{" "}
              <span className="font-bold flex items-center gap-1">
                <Avatar className="w-5 h-5 border">
                  <AvatarImage src={getFaviconUrl(task.lead.website)} />
                  <AvatarFallback>
                    {task.lead.name
                      .split(" ")
                      .map((name: string) => name[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>

                {task.lead.name}
              </span>{" "}
              on{" "}
              {contact &&
                contact.contactPoints.map((point, index) => {
                  return (
                    <div key={point.id}>
                      {
                        ContactTypeData.find(
                          (type) => type.value === point.type
                        )?.label
                      }
                      {index < (contact?.contactPoints.length || 0) - 1 &&
                        " & "}
                    </div>
                  );
                })}
            </>
          )}
        </div>
        <OutreachTaskDialog
          task={task}
          isCompleted={isCompleted}
          onToggleComplete={toggleComplete}
          onDeleteTask={deleteTask}
          onClose={() => setOpen(false)}
          open={open}
          onOpenChange={setOpen}
        />
      </div>
    </div>
  );
};
