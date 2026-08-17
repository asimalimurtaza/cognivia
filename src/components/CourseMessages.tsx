"use client";

import {
  Box,
  Textarea,
  Button,
  VStack,
  Text,
  HStack,
  useToast,
  Spinner,
  Flex,
  useColorModeValue,
  Avatar,
  Icon,
  Badge,
} from "@chakra-ui/react";
import { useEffect, useState, useRef } from "react";
import { FiMessageCircle, FiSend, FiClock } from "react-icons/fi";

interface Message {
  _id: string;
  content: string;
  postedBy: { name: string; avatar?: string };
  createdAt: string;
}

export default function CourseMessages({ courseId }: { courseId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [isPostingMessage, setIsPostingMessage] = useState(false);
  const toast = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const containerBg = useColorModeValue("white", "gray.800");
  const containerBorder = useColorModeValue("gray.200", "gray.700");
  const messageInputBg = useColorModeValue("white", "gray.900");
  const messageInputColor = useColorModeValue("gray.800", "gray.100");
  const messageInputBorder = useColorModeValue("gray.200", "gray.700");
  
  const bubbleBg = useColorModeValue("gray.50", "gray.900");
  const bubbleBorder = useColorModeValue("gray.200", "gray.700");
  
  const textColor = useColorModeValue("gray.800", "gray.100");
  const metaColor = useColorModeValue("gray.500", "gray.400");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    async function fetchMessages() {
      setIsLoadingMessages(true);
      try {
        const res = await fetch(
          `/api/courses/${courseId}?populate=messages.postedBy`
        );
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Failed to fetch messages.");
        }
        const data = await res.json();
        const fetchedMessages = data.messages || data?.course?.messages || [];
        setMessages(
          fetchedMessages.sort(
            (a: Message, b: Message) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          )
        );
      } catch (err) {
        console.error("Failed to load messages:", err);
        toast({
          title: "Error loading announcements",
          description: (err as Error).message || "Could not retrieve class messages.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        setMessages([]);
      } finally {
        setIsLoadingMessages(false);
      }
    }

    fetchMessages();
  }, [courseId, toast]);

  useEffect(() => {
    if (!isLoadingMessages) {
      scrollToBottom();
    }
  }, [messages, isLoadingMessages]);

  async function handlePostMessage() {
    if (!newMessage.trim()) return;

    setIsPostingMessage(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, content: newMessage.trim() }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessages((prev) => [...prev, data]);
        setNewMessage("");
        toast({
          title: "Announcement posted",
          status: "success",
          duration: 2000,
          isClosable: true,
          position: "bottom-right",
        });
      } else {
        throw new Error(data.message || "Failed to post message.");
      }
    } catch (err) {
      console.error("Failed to post message:", err);
      toast({
        title: "Failed to post",
        description: (err as Error).message || "Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsPostingMessage(false);
    }
  }

  return (
    <Box
      p={{ base: 4, md: 6 }}
      borderWidth="1px"
      borderRadius="xl"
      bg={containerBg}
      borderColor={containerBorder}
      minH="450px"
      maxH="650px"
      display="flex"
      flexDirection="column"
    >
      <HStack justify="space-between" pb={3} mb={4} borderBottomWidth="1px" borderColor={containerBorder}>
        <Box>
          <Text fontSize="md" fontWeight="semibold" color={textColor}>
            Class Stream & Announcements
          </Text>
          <Text fontSize="xs" color={metaColor}>
            Broadcast updates to all enrolled students
          </Text>
        </Box>
        <Badge variant="outline" colorScheme="gray" borderRadius="md" px={2} py={0.5} fontSize="xs">
          {messages.length} Posts
        </Badge>
      </HStack>

      <VStack spacing={3} align="stretch" flexGrow={1} overflowY="auto" pr={1} pb={2}>
        {isLoadingMessages ? (
          <Flex justify="center" align="center" minH="250px" flexGrow={1}>
            <Spinner size="md" color="gray.500" thickness="2px" />
          </Flex>
        ) : messages.length === 0 ? (
          <VStack
            spacing={2}
            py={12}
            color={metaColor}
            textAlign="center"
            flexGrow={1}
            justify="center"
          >
            <Icon as={FiMessageCircle} w={8} h={8} color={metaColor} />
            <Text fontSize="sm" fontWeight="medium" color={textColor}>
              No announcements posted yet
            </Text>
          </VStack>
        ) : (
          messages.map((msg) => (
            <Box
              key={msg._id}
              p={4}
              borderRadius="lg"
              borderWidth="1px"
              borderColor={bubbleBorder}
              bg={bubbleBg}
            >
              <HStack justify="space-between" mb={2}>
                <HStack spacing={2}>
                  <Avatar
                    size="xs"
                    name={msg.postedBy?.name || "Teacher"}
                    src={msg.postedBy?.avatar}
                  />
                  <Text fontWeight="semibold" fontSize="xs" color={textColor}>
                    {msg.postedBy?.name || "Teacher"}
                  </Text>
                  <Badge variant="subtle" colorScheme="gray" fontSize="9px" px={1.5}>
                    Teacher
                  </Badge>
                </HStack>

                <HStack spacing={1} color={metaColor} fontSize="10px">
                  <Icon as={FiClock} />
                  <Text>
                    {new Date(msg.createdAt).toLocaleString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      day: "numeric",
                      month: "short",
                    })}
                  </Text>
                </HStack>
              </HStack>

              <Text fontSize="xs" color={textColor} lineHeight="relaxed" whiteSpace="pre-wrap">
                {msg.content}
              </Text>
            </Box>
          ))
        )}
        <div ref={messagesEndRef} />
      </VStack>

      {/* Input Box */}
      <Box pt={3} borderTopWidth="1px" borderColor={containerBorder}>
        <VStack spacing={2.5}>
          <Textarea
            placeholder="Write an announcement..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            rows={2}
            bg={messageInputBg}
            color={messageInputColor}
            borderColor={messageInputBorder}
            borderRadius="md"
            fontSize="xs"
          />
          <Flex justify="flex-end" w="100%">
            <Button
              colorScheme="gray"
              bg={useColorModeValue("gray.800", "gray.100")}
              color={useColorModeValue("white", "gray.900")}
              _hover={{ bg: useColorModeValue("gray.700", "white") }}
              onClick={handlePostMessage}
              isDisabled={!newMessage.trim() || isPostingMessage}
              isLoading={isPostingMessage}
              leftIcon={<FiSend />}
              size="sm"
              borderRadius="md"
              px={4}
            >
              Post Announcement
            </Button>
          </Flex>
        </VStack>
      </Box>
    </Box>
  );
}
