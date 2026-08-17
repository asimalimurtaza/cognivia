"use client";

import React, { useState, useEffect } from "react";
import {
  Flex,
  useToast,
  useColorModeValue,
  IconButton,
  useBreakpointValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Box,
} from "@chakra-ui/react";
import { FiMenu } from "react-icons/fi";
import ChatHistory from "@/components/ai-assistant-components/ChatHistory";
import ChatWindow from "@/components/ai-assistant-components/ChatWindow";
import { useDisclosure } from "@chakra-ui/react";

interface DBMessage {
  sender: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface DBChatSession {
  _id: string;
  title: string;
  messages: DBMessage[];
  updatedAt: string;
}

function mapDBMessagesToPairs(messages: DBMessage[]) {
  const pairs: { query: string; response: string }[] = [];
  for (let i = 0; i < messages.length; i += 2) {
    const userMsg = messages[i];
    const botMsg = messages[i + 1];
    if (userMsg && userMsg.sender === "user") {
      pairs.push({
        query: userMsg.content,
        response: botMsg ? botMsg.content : "...",
      });
    }
  }
  return pairs;
}

export default function AIAssistant() {
  const [query, setQuery] = useState<string>("");
  const [activePrompt, setActivePrompt] = useState<string>("");
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<
    Record<
      string,
      {
        id: string;
        title: string;
        messages: { query: string; response: string }[];
        timestamp: number;
      }
    >
  >({});
  const [loading, setLoading] = useState<boolean>(false);
  const [currentResponse, setCurrentResponse] = useState<string>("");
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isMobile = useBreakpointValue({ base: true, md: false });

  const surfaceColor = useColorModeValue("white", "gray.800");
  const dividerColor = useColorModeValue("gray.200", "gray.600");

  // Load chat history from MongoDB API
  useEffect(() => {
    async function loadSessions() {
      try {
        const res = await fetch("/api/chat");
        if (res.ok) {
          const sessions: DBChatSession[] = await res.json();
          const historyMap: Record<
            string,
            {
              id: string;
              title: string;
              messages: { query: string; response: string }[];
              timestamp: number;
            }
          > = {};

          sessions.forEach((s) => {
            historyMap[s._id] = {
              id: s._id,
              title: s.title || "New Chat",
              messages: mapDBMessagesToPairs(s.messages || []),
              timestamp: new Date(s.updatedAt).getTime(),
            };
          });

          setChatHistory(historyMap);
        }
      } catch (err) {
        console.error("Failed to load saved chat sessions:", err);
      }
    }

    loadSessions();
  }, []);

  const handleAskAI = async () => {
    if (!query.trim()) {
      toast({
        title: "Input required",
        description: "Please enter a question before submitting.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const userPrompt = query.trim();
    setActivePrompt(userPrompt);
    setQuery("");
    setLoading(true);
    setCurrentResponse("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: currentChatId,
          prompt: userPrompt,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error("Failed to send message to Cognivia AI");
      }

      const sessionIdHeader = res.headers.get("X-Session-Id");
      const titleHeader = res.headers.get("X-Session-Title");
      const sessionTitle = titleHeader
        ? decodeURIComponent(titleHeader)
        : userPrompt.substring(0, 20) + "...";
      const activeSessionId =
        sessionIdHeader || currentChatId || `chat_${Date.now()}`;

      setCurrentChatId(activeSessionId);

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let streamedText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        streamedText += chunk;
        setCurrentResponse(streamedText);
      }

      setChatHistory((prev) => {
        const existingMessages = prev[activeSessionId]?.messages || [];
        return {
          ...prev,
          [activeSessionId]: {
            id: activeSessionId,
            title: prev[activeSessionId]?.title || sessionTitle,
            messages: [
              ...existingMessages,
              { query: userPrompt, response: streamedText },
            ],
            timestamp: Date.now(),
          },
        };
      });

      setCurrentResponse("");
      setActivePrompt("");
    } catch (error) {
      console.error("Cognivia AI Error:", error);
      toast({
        title: "Error",
        description: "Something went wrong sending your message.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyResponse = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "The response has been copied to your clipboard.",
      status: "success",
      duration: 2000,
      isClosable: true,
    });
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      const res = await fetch(`/api/chat/${chatId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setChatHistory((prev) => {
          const newHistory = { ...prev };
          delete newHistory[chatId];
          return newHistory;
        });

        if (currentChatId === chatId) {
          setCurrentChatId(null);
          setCurrentResponse("");
        }

        toast({
          title: "Chat Deleted",
          description: "The selected conversation has been deleted.",
          status: "info",
          duration: 2000,
          isClosable: true,
        });
      } else {
        throw new Error("Failed to delete chat session");
      }
    } catch (err) {
      console.error("Delete chat error:", err);
      toast({
        title: "Deletion failed",
        status: "error",
      });
    }
  };

  const handleOpenChat = (chatId: string) => {
    setCurrentChatId(chatId);
    setCurrentResponse("");
    onClose();
  };

  const handleNewChat = () => {
    setCurrentChatId(null);
    setCurrentResponse("");
  };

  const currentMessages = currentChatId
    ? chatHistory[currentChatId]?.messages || []
    : [];

  return (
    <Flex direction="column" minH="90vh">
      <Flex align="center">
        {isMobile && (
          <IconButton
            icon={<FiMenu />}
            aria-label="Open Chat History"
            onClick={onOpen}
            variant="ghost"
            ml="auto"
          />
        )}
      </Flex>

      <Flex flex={1} overflow="hidden">
        {/* Mobile Drawer */}
        {isMobile && (
          <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent bg={surfaceColor}>
              <ModalHeader>
                <Flex align="center" gap={3}></Flex>
              </ModalHeader>
              <ModalCloseButton />
              <ModalBody p={0}>
                <ChatHistory
                  chatHistory={chatHistory}
                  currentChatId={currentChatId}
                  onNewChat={handleNewChat}
                  onOpenChat={handleOpenChat}
                  onDeleteChat={handleDeleteChat}
                />
              </ModalBody>
            </ModalContent>
          </Modal>
        )}

        {/* Desktop Sidebar */}
        {!isMobile && (
          <Box
            w="300px"
            borderColor={dividerColor}
            overflowY="auto"
          >
            <ChatHistory
              chatHistory={chatHistory}
              currentChatId={currentChatId}
              onNewChat={handleNewChat}
              onOpenChat={handleOpenChat}
              onDeleteChat={handleDeleteChat}
            />
          </Box>
        )}

        {/* Main Chat Area */}
        <Box flex={1} overflowY="auto">
          <ChatWindow
            query={query}
            setQuery={setQuery}
            activePrompt={activePrompt}
            currentMessages={currentMessages}
            currentResponse={currentResponse}
            loading={loading}
            onAskAI={handleAskAI}
            onCopyResponse={handleCopyResponse}
          />
        </Box>
      </Flex>
    </Flex>
  );
}
