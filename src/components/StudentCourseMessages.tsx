"use client";

import {
  Box,
  VStack,
  Text,
  HStack,
  Spinner,
  Flex,
  useColorModeValue,
  Avatar,
  Icon,
  Badge,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { FiMessageCircle, FiClock, FiBell } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const MotionBox = motion(Box);

interface Message {
  _id: string;
  content: string;
  postedBy: { name: string; avatar?: string };
  createdAt: string;
}

export default function StudentCourseMessages({
  courseId,
}: {
  courseId: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);

  const containerBg = useColorModeValue("white", "gray.850");
  const containerBorder = useColorModeValue("gray.100", "gray.750");
  const containerShadow = useColorModeValue("0 10px 30px -5px rgba(0, 0, 0, 0.05)", "0 10px 30px -5px rgba(0, 0, 0, 0.4)");
  const cardBg = useColorModeValue("blue.50", "gray.800");
  const cardBorder = useColorModeValue("blue.100", "gray.700");
  const textColor = useColorModeValue("gray.800", "gray.100");
  const metaColor = useColorModeValue("gray.500", "gray.400");
  const emptyIconColor = useColorModeValue("blue.400", "blue.300");

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
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        );
      } catch (err) {
        console.error("Failed to load messages:", err);
        setMessages([]);
      } finally {
        setIsLoadingMessages(false);
      }
    }

    fetchMessages();
  }, [courseId]);

  return (
    <Box
      p={{ base: 4, md: 6 }}
      borderWidth="1px"
      borderRadius="2xl"
      bg={containerBg}
      borderColor={containerBorder}
      boxShadow={containerShadow}
      minH="350px"
      maxH="550px"
      display="flex"
      flexDirection="column"
    >
      <HStack justify="space-between" pb={4} mb={4} borderBottomWidth="1px" borderColor={containerBorder}>
        <HStack spacing={3}>
          <Box p={2.5} bg="blue.500" color="white" borderRadius="xl">
            <Icon as={FiBell} w={5} h={5} />
          </Box>
          <Box>
            <Text fontSize="lg" fontWeight="bold" color={textColor}>
              Class Announcements & Stream
            </Text>
            <Text fontSize="xs" color={metaColor}>
              Latest updates and notices from your instructor
            </Text>
          </Box>
        </HStack>
        <Badge colorScheme="blue" borderRadius="full" px={3} py={1} fontSize="xs" fontWeight="bold">
          {messages.length} Announcements
        </Badge>
      </HStack>

      <VStack spacing={4} align="stretch" flexGrow={1} overflowY="auto" pr={1}>
        {isLoadingMessages ? (
          <Flex justify="center" align="center" minH="200px" flexGrow={1}>
            <VStack spacing={3}>
              <Spinner size="lg" color="blue.500" thickness="3px" />
              <Text fontSize="sm" color={metaColor}>
                Loading class stream...
              </Text>
            </VStack>
          </Flex>
        ) : messages.length === 0 ? (
          <VStack
            spacing={3}
            py={10}
            color={metaColor}
            textAlign="center"
            flexGrow={1}
            justify="center"
          >
            <Icon as={FiMessageCircle} w={12} h={12} color={emptyIconColor} />
            <Text fontSize="lg" fontWeight="semibold" color={textColor}>
              No announcements yet
            </Text>
            <Text fontSize="sm">
              Check back later for announcements and class notices.
            </Text>
          </VStack>
        ) : (
          <AnimatePresence>
            {messages.map((msg) => (
              <MotionBox
                key={msg._id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                p={4}
                borderRadius="xl"
                borderWidth="1px"
                borderColor={cardBorder}
                bg={cardBg}
                boxShadow="sm"
              >
                <HStack justify="space-between" mb={2}>
                  <HStack spacing={2.5}>
                    <Avatar
                      size="sm"
                      name={msg.postedBy?.name || "Instructor"}
                      src={msg.postedBy?.avatar}
                      bg="blue.600"
                      color="white"
                    />
                    <Box>
                      <HStack spacing={2}>
                        <Text fontWeight="bold" fontSize="sm" color={textColor}>
                          {msg.postedBy?.name || "Instructor"}
                        </Text>
                        <Badge colorScheme="purple" fontSize="9px" px={2} borderRadius="full">
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
      </VStack>
    </Box>
  );
}
