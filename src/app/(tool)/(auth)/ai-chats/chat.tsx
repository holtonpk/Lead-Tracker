"use client";

import {useState, FormEvent, useEffect, useRef} from "react";
import {Paperclip, Mic, CornerDownLeft} from "lucide-react";
import {Button} from "@/components/ui/button";
import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from "@/components/ui/chat-bubble";
import {ChatMessageList} from "@/components/ui/chat-message-list";
import {ChatInput} from "@/components/ui/chat-input";
import {useAuth} from "@/context/user-auth";
import {Icons} from "@/components/icons";
type AiChatMessage = {
  id: number;
  content: string;
  sender: string;
};

export function ChatMessage({
  messages,
  setMessages,
  saveResponse,
}: {
  messages: AiChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<AiChatMessage[]>>;
  saveResponse: (text: string) => void;
}) {
  const [input, setInput] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const hasRun = useRef(false);

  useEffect(() => {
    const fetchFirstMessage = async () => {
      setIsLoading(true);

      const response = await fetch("/api/outreach-gen", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({messages: messages}),
      });

      const data = await response.json();
      if (response.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: prev.length + 1,
            content: data.response || "AI response error.",
            sender: "ai",
          },
        ]);
      } else {
        throw new Error("Failed to fetch AI response");
      }
      setIsLoading(false);
    };

    if (
      !hasRun.current &&
      !isLoading &&
      messages[messages.length - 1]?.sender === "user"
    ) {
      hasRun.current = true;
      fetchFirstMessage();
    }
  }, [messages, setMessages, isLoading]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Append user message to state immediately
    const userMessage: AiChatMessage = {
      id: messages.length + 1,
      content: input,
      sender: "user",
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/outreach-gen", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({messages: updatedMessages}),
      });

      const data = await response.json();
      if (response.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: prev.length + 1,
            content: data.response || "AI response error.",
            sender: "ai",
          },
        ]);
      } else {
        throw new Error("Failed to fetch AI response");
      }
    } catch (error) {
      console.error("Error fetching AI response:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[calc(90vh-48px)] border bg-background rounded-b-lg flex flex-col">
      <div className="flex-1 overflow-hidden">
        <ChatMessageList>
          {messages.map((message) => (
            <ChatBubbleRow
              message={message}
              saveResponse={saveResponse}
              key={message.id}
            />
          ))}

          {isLoading && (
            <ChatBubble variant="received">
              <ChatBubbleAvatar
                className="h-8 w-8 shrink-0"
                src="/chat-logo.png"
                fallback="AI"
              />
              <ChatBubbleMessage isLoading />
            </ChatBubble>
          )}
        </ChatMessageList>
      </div>

      <div
        className={`p-4 border-t
        ${isLoading ? "opacity-50 pointer-events-none" : "opacity-100"}
        `}
      >
        <form
          onSubmit={handleSubmit}
          className="relative rounded-lg h-fit grid grid-cols-[1fr_120px] items-center gap-2 p-1"
        >
          <ChatInput
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="tweak response..."
            className="min-h-12 resize-none rounded-lg bg-background border p-3 shadow-none ring-transparent focus:ring-transparent pr-20"
          />

          <Button type="submit" className="gap-1.5 w-fit">
            Generate
            <CornerDownLeft className="size-3.5" />
          </Button>
        </form>
      </div>
    </div>
  );
}

const ChatBubbleRow = ({
  saveResponse,
  message,
}: {
  message: AiChatMessage;
  saveResponse: (text: string) => void;
}) => {
  const {currentUser} = useAuth()!;

  const [copiedRes, setCopiedRes] = useState<boolean>(false);

  const copyToClipBoard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRes(true);
    setTimeout(() => {
      setCopiedRes(false);
    }, 3000);
  };
  return (
    <ChatBubble
      key={message.id}
      variant={message.sender === "user" ? "sent" : "received"}
    >
      <>
        <ChatBubbleAvatar
          className="h-8 w-8 shrink-0"
          src={
            message.sender === "user" ? currentUser?.photoURL : "/chat-logo.png"
          }
          fallback={message.sender === "user" ? "US" : "AI"}
        />
        <ChatBubbleMessage
          variant={message.sender === "user" ? "sent" : "received"}
        >
          {message.content}
          {message.sender == "ai" && (
            <div className="flex gap-2 mt-4">
              <Button
                onClick={() => copyToClipBoard(message.content)}
                variant={"outline"}
              >
                {copiedRes ? (
                  <>Copied</>
                ) : (
                  <>
                    <Icons.copy className="h-5 w-5 " />
                    Copy
                  </>
                )}
              </Button>
              <Button onClick={() => saveResponse(message.content)}>
                Use this response
              </Button>
            </div>
          )}
        </ChatBubbleMessage>
      </>
    </ChatBubble>
  );
};
