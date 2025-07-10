"use client";

import {Icons} from "@/components/icons";
import {Contact, ContactTypeData, Lead, Task} from "@/config/data";
import {db} from "@/config/firebase";
import {collection, onSnapshot, query} from "firebase/firestore";
import {AnimatePresence, motion} from "framer-motion";
import {useEffect, useState} from "react";
import {Calendar} from "@/components/ui/calendar";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {
  CalendarIcon,
  Building2,
  TrendingDown,
  TrendingUp,
  Send,
  Phone,
  Sparkles,
} from "lucide-react";
import {cn, formatDate} from "@/lib/utils";
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
import {LinkButton} from "@/components/ui/link";
import {Textarea} from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  convertTimestampToDate,
  formatTimeDifference,
  isValidURL,
} from "@/lib/utils";
import {format} from "date-fns";
import {doc, Timestamp, updateDoc, serverTimestamp} from "firebase/firestore";
import {useAuth} from "@/context/user-auth";
import {ChatMessage} from "./chat";

export const AiOutreach = ({
  children,
  lead,
  task,
  setDescription,
}: {
  children: React.ReactNode;
  lead: Lead;
  task: Task;
  setDescription: React.Dispatch<React.SetStateAction<string | undefined>>;
}) => {
  const {currentUser} = useAuth()!;

  const message = `This message will be sent to ${
    task.contact?.name
  }, who is the ${task.contact?.role} at ${lead.name}. My name is ${
    currentUser?.firstName
  } I'm a co founder of Ripple Media. ${
    lead.notes
      ? `Here are some key notes on how I can assist their company: **${lead.notes}**. Please incorporate these insights into the message.`
      : ""
  } ${
    lead.tasks?.some((task) => task.outreachCopy)
      ? `Additionally, use the tone and structure of my past outreach messages as a reference. Here are previous messages I've sent: **${lead.tasks
          .map((task) => task.outreachCopy)
          .join("; ")}**.`
      : ""
  } Generate a professional and engaging message that aligns with my previous communication style while emphasizing the value I can bring to ${
    lead.name
  }.`;

  type AiChatMessage = {
    id: number;
    content: string;
    sender: string;
  };

  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      id: 1,
      content: message,
      sender: "user",
    },
  ]);

  const [open, setOpen] = useState(false);

  const saveResponse = async (text: string) => {
    console.log("saving...", text);
    setDescription(text);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="p-0 h-[90vh] gap-0">
        <DialogHeader className="h-12 flex justify-center px-4 ">
          <DialogTitle>
            Ai generate outreach copy for {task.contact?.name}
          </DialogTitle>
        </DialogHeader>
        {/* <Textarea value={input} /> */}
        {/* <div>{input}</div> */}

        <ChatMessage
          messages={messages}
          setMessages={setMessages}
          saveResponse={saveResponse}
        />
      </DialogContent>
    </Dialog>
  );
};

const dummyAi =
  "Hi Colton,\n\nI noticed that SchoolAi has a strong presence on LinkedIn—great work! At Ripple Media, we specialize in amplifying your reach across other social platforms. We've helped similar brands build an engaging social presence and see real growth. I'd love to share some strategies that could elevate SchoolAi's visibility and engagement beyond LinkedIn.\n\nIf you're interested, let's hop on a quick call. I'll create a complimentary one-month content strategy tailored just for SchoolAi, focusing on connecting with educators. Looking forward to discussing how we can enhance your social footprint.\n\nBest,\nPatrick";
