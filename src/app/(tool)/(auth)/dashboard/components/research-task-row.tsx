"use client";

import {Icons} from "@/components/icons";
import {Lead, Task} from "@/config/data";
import {db} from "@/config/firebase";
import {AnimatePresence, motion} from "framer-motion";
import React, {useState} from "react";
import {Button} from "@/components/ui/button";
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
import {doc, updateDoc, serverTimestamp} from "firebase/firestore";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {ResearchTaskDialog} from "./research-task-dialog";

type LeadTask = Task & {lead: Lead};

interface ResearchTaskRowProps {
  task: LeadTask;
}

export const ResearchTaskRow = ({task}: ResearchTaskRowProps) => {
  const [isCompleted, setIsComplete] = useState(task.isCompleted);
  const [open, setOpen] = useState(false);

  const toggleComplete = async () => {
    const updatedTasks = task.lead.tasks?.map((taskL) =>
      taskL.id === task.id ? {...taskL, isCompleted: !isCompleted} : taskL
    );

    await updateDoc(doc(db, `companies-fixed/${task.lead.id}`), {
      tasks: updatedTasks,
    });
    if (!isCompleted) {
      setOpen(false);
    }
    setIsComplete(!isCompleted);
  };

  const deleteTask = async () => {
    try {
      const docRef = doc(db, "companies-fixed", task.lead.id);

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
          Do Research on{" "}
          <div className="font-bold flex items-center gap-1">
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
          </div>
          {(!task.lead.contacts || task.lead.contacts.length === 0) && (
            <div className="">& Add Contacts</div>
          )}
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="absolute w-full h-full z-10 left-0 top-0"></button>
          </DialogTrigger>
          <ResearchTaskDialog
            task={task}
            isCompleted={isCompleted}
            onToggleComplete={toggleComplete}
            onDeleteTask={deleteTask}
            onClose={() => setOpen(false)}
          />
        </Dialog>
      </div>
    </div>
  );
};
