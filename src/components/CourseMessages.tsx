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
import { motion, AnimatePresence } from "framer-motion";

const MotionBox = motion(Box);

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

  const containerBg = useColorModeValue("white", "gray.850");
  const containerBorder = useColorModeValue("gray.100", "gray.750");
  const containerShadow = useColorModeValue("0 10px 30px -5px rgba(0, 0, 0, 0.05)", "0 10px 30px -5px rgba(0, 0, 0, 0.4)");
  const messageInputBg = useColorModeValue("gray.50", "gray.800");
  const messageInputColor = useColorModeValue("gray.800", "gray.100");
  const messageInputBorder = useColorModeValue("gray.200", "gray.700");
  const messageInputFocusBorder = useColorModeValue("blue.500", "blue.400");
  
  const teacherBubbleBg = useColorModeValue("linear-gradient(135deg, #ebf8ff 0%, #ebf8ff 100%)", "linear-gradient(135deg, #2b6cb0 0%, #2c5282 100%)");
  const bubbleBorder = useColorModeValue("blue.100", "gray.700");
  
  const textColor = useColorModeValue("gray.800", "gray.100");
  const metaColor = useColorModeValue("gray.500", "gray.400");
  const emptyIconColor = useColorModeValue("blue.400", "blue.300");

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
      borderRadius="2xl"
      bg={containerBg}
      borderColor={containerBorder}
      boxShadow={containerShadow}
      minH="450px"
      maxH="650px"
      display="flex"
      flexDirection="column"
    >
      <HStack justify="space-between" pb={4} mb={4} borderBottomWidth="1px" borderColor={containerBorder}>
        <HStack spacing={3}>
          <Box p={2} bg="blue.500" color="white" borderRadius="xl">
            <Icon as={FiMessageCircle} w={5} h={5} />
          </Box>
          <Box>
            <Text fontSize="lg" fontWeight="bold" color={textColor}>
              Class Announcements & Stream
            </Text>

            <Text fontSize="xs" color={metaColor}>
              Broadcast updates to all enrolled students
            </Text>
          </Box>
        </HStack>
        <Badge colorScheme="blue" borderRadius="full" px={3} py={1} fontSize="xs" fontWeight="bold">
          {messages.length} Posts
        </Badge>
      </HStack>

      <VStack spacing={4} align="stretch" flexGrow={1} overflowY="auto" pr={1} pb={2}>
        {isLoadingMessages ? (
          <Flex justify="center" align="center" minH="250px" flexGrow={1}>
            <VStack spacing={3}>
              <Spinner size="xl" color="blue.500" thickness="3px" />
              <Text fontSize="sm" color={metaColor}>
                Loading announcements...
              </Text>
            </VStack>
          </Flex>
        ) : messages.length === 0 ? (
          <VStack
            spacing={3}
            py={12}
            color={metaColor}
            textAlign="center"
            flexGrow={1}
            justify="center"
          >
            <Icon as={FiMessageCircle} w={12} h={12} color={emptyIconColor} />
            <Text fontSize="lg" fontWeight="semibold" color={textColor}>
              No announcements posted yet
            </Text>
            <Text fontSize="sm">
              Use the box below to publish your first announcement to students.
            </Text>
          </VStack>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <MotionBox
                key={msg._id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                p={4}
                borderRadius="xl"
                borderWidth="1px"
                borderColor={bubbleBorder}
                bg={teacherBubbleBg}
                boxShadow="sm"
              >
                <HStack justify="space-between" mb={2}>
                  <HStack spacing={2.5}>
                    <Avatar
                      size="sm"
                      name={msg.postedBy?.name || "Teacher"}
                      src={msg.postedBy?.avatar}
                      bg="blue.600"
                      color="white"
                    />
                    <Box>
                      <HStack spacing={2}>
                        <Text fontWeight="bold" fontSize="sm" color={textColor}>
                          {msg.postedBy?.name || "Teacher"}
                        </Text>
                        <Badge colorScheme="teal" fontSize="9px" px={2} borderRadius="full">
                          Teacher
                        </Badge>
                      </HStack>
                    </Box>
                  </HStack>

                  <HStack spacing={1} color={metaColor} fontSize="xs">
                    <Icon as={FiClock} w={3.5} h={3.5} />
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

                <Text fontSize="sm" color={textColor} lineHeight="relaxed" whiteSpace="pre-wrap" pl={1}>
                  {msg.content}
                </Text>
              </MotionBox>
            ))}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </VStack>

      {/* Input Box */}
      <Box pt={4} borderTopWidth="1px" borderColor={containerBorder}>
        <VStack spacing={3}>
          <Textarea
            placeholder="Share an announcement or update with the class..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            rows={3}
            bg={messageInputBg}
            color={messageInputColor}
            borderColor={messageInputBorder}
            borderRadius="xl"
            _hover={{ borderColor: messageInputFocusBorder }}
            _focus={{
              borderColor: messageInputFocusBorder,
              boxShadow: `0 0 0 1px ${messageInputFocusBorder}`,
            }}
            fontSize="sm"
          />
          <Flex justify="flex-end" w="100%">
            <Button
              colorScheme="blue"
              onClick={handlePostMessage}
              isDisabled={!newMessage.trim() || isPostingMessage}
              isLoading={isPostingMessage}
              leftIcon={<FiSend />}
              size="md"
              borderRadius="xl"
              px={6}
              boxShadow="0 4px 12px rgba(49, 130, 206, 0.3)"
            >
              Post Announcement
            </Button>
          </Flex>
        </VStack>
      </Box>
    </Box>
  );
}
