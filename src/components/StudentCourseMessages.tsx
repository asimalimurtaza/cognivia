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
import { FiMessageCircle, FiClock } from "react-icons/fi";

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

  const containerBg = useColorModeValue("white", "gray.800");
  const containerBorder = useColorModeValue("gray.200", "gray.700");
  const cardBg = useColorModeValue("gray.50", "gray.900");
  const cardBorder = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("gray.800", "gray.100");
  const metaColor = useColorModeValue("gray.500", "gray.400");

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
      borderRadius="xl"
      bg={containerBg}
      borderColor={containerBorder}
      minH="350px"
      maxH="550px"
      display="flex"
      flexDirection="column"
    >
      <HStack justify="space-between" pb={3} mb={4} borderBottomWidth="1px" borderColor={containerBorder}>
        <Box>
          <Text fontSize="md" fontWeight="semibold" color={textColor}>
            Class Announcements
          </Text>
          <Text fontSize="xs" color={metaColor}>
            Latest notices from your instructor
          </Text>
        </Box>
        <Badge variant="outline" colorScheme="gray" borderRadius="md" px={2} py={0.5} fontSize="xs">
          {messages.length} Announcements
        </Badge>
      </HStack>

      <VStack spacing={3} align="stretch" flexGrow={1} overflowY="auto" pr={1}>
        {isLoadingMessages ? (
          <Flex justify="center" align="center" minH="200px" flexGrow={1}>
            <Spinner size="md" color="gray.500" thickness="2px" />
          </Flex>
        ) : messages.length === 0 ? (
          <VStack
            spacing={2}
            py={10}
            color={metaColor}
            textAlign="center"
            flexGrow={1}
            justify="center"
          >
            <Icon as={FiMessageCircle} w={8} h={8} color={metaColor} />
            <Text fontSize="sm" fontWeight="medium" color={textColor}>
              No announcements yet
            </Text>
          </VStack>
        ) : (
          messages.map((msg) => (
            <Box
              key={msg._id}
              p={4}
              borderRadius="lg"
              borderWidth="1px"
              borderColor={cardBorder}
              bg={cardBg}
            >
              <HStack justify="space-between" mb={2}>
                <HStack spacing={2}>
                  <Avatar
                    size="xs"
                    name={msg.postedBy?.name || "Instructor"}
                    src={msg.postedBy?.avatar}
                  />
                  <Text fontWeight="semibold" fontSize="xs" color={textColor}>
                    {msg.postedBy?.name || "Instructor"}
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
      </VStack>
    </Box>
  );
}
