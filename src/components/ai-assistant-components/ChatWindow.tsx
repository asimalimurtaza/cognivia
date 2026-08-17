"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import {
  Box,
  Flex,
  HStack,
  Input,
  Text,
  IconButton,
  Spinner,
  useColorModeValue,
  Avatar,
  Divider,
  VStack,
  Code,
  useToast,
  Heading,
  CodeProps,
  HeadingProps,
  TextProps,
  Badge,
} from "@chakra-ui/react";
import { FaCopy, FaUser } from "react-icons/fa";
import { motion } from "framer-motion";
import { ArrowUpIcon } from "@chakra-ui/icons";
import { MdAssistant } from "react-icons/md";
import { FiCheckCircle } from "react-icons/fi";

const MotionBox = motion(Box);

interface ChatWindowProps {
  query: string;
  setQuery: (value: string) => void;
  activePrompt?: string;
  currentMessages: Array<{ query: string; response: string }>;
  currentResponse: string;
  loading: boolean;
  onAskAI: () => void;
  onCopyResponse: (text: string) => void;
}

interface MarkdownComponentProps {
  children?: React.ReactNode;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  query,
  setQuery,
  activePrompt,
  currentMessages,
  currentResponse,
  loading,
  onAskAI,
  onCopyResponse,
}) => {
  const surfaceColor = useColorModeValue("gray.50", "gray.900");
  const inputBg = useColorModeValue("gray.50", "gray.900");
  const textColor = useColorModeValue("gray.800", "gray.200");
  const subTextColor = useColorModeValue("gray.600", "gray.400");
  const codeBg = useColorModeValue("gray.100", "gray.800");
  const dividerColor = useColorModeValue("gray.200", "gray.700");
  const toast = useToast();

  const formatMarkdown = (text: string) => {
    const components = {
      code({ children, ...props }: MarkdownComponentProps) {
        return (
          <Code
            bg={codeBg}
            p={1}
            borderRadius="md"
            fontSize="0.9em"
            {...(props as CodeProps)}
          >
            {children}
          </Code>
        );
      },
      h1({ children, ...props }: MarkdownComponentProps) {
        return (
          <Heading
            as="h1"
            size="md"
            color={textColor}
            my={3}
            {...(props as HeadingProps)}
          >
            {children}
          </Heading>
        );
      },
      h2({ children, ...props }: MarkdownComponentProps) {
        return (
          <Heading
            as="h2"
            size="sm"
            color={textColor}
            my={2}
            {...(props as HeadingProps)}
          >
            {children}
          </Heading>
        );
      },
      h3({ children, ...props }: MarkdownComponentProps) {
        return (
          <Heading
            as="h3"
            size="xs"
            color={textColor}
            my={2}
            {...(props as HeadingProps)}
          >
            {children}
          </Heading>
        );
      },
      p({ children, ...props }: MarkdownComponentProps) {
        return (
          <Text my={1.5} lineHeight="relaxed" fontSize="sm" {...(props as TextProps)}>
            {children}
          </Text>
        );
      },
    };

    return <ReactMarkdown components={components}>{text}</ReactMarkdown>;
  };

  const scrollbarStyles = {
    "&::-webkit-scrollbar": {
      width: "6px",
    },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: subTextColor,
      borderRadius: "3px",
    },
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      onAskAI();
    }
  };

  return (
    <Flex direction="column" h="100vh" gap={3}>
      {/* Top Banner Indicator */}
      <Flex p={3} borderBottomWidth="1px" borderColor={dividerColor} justify="space-between" align="center">
        <HStack spacing={2}>
          <MdAssistant size={20} />
          <Text fontWeight="semibold" fontSize="sm">
            Cognivia AI
          </Text>
        </HStack>

        <Badge variant="outline" colorScheme="gray" borderRadius="md" px={2.5} py={0.5} fontSize="10px">
          <HStack spacing={1}>
            <FiCheckCircle color="#38a169" />
            <Text>Notes, Quizzes & Courses Context Active</Text>
          </HStack>
        </Badge>
      </Flex>

      <Box
        flex={1}
        p={4}
        bg={surfaceColor}
        overflowY="auto"
        css={scrollbarStyles}
      >
        {currentMessages.length === 0 && !loading ? (
          <Flex
            direction="column"
            align="center"
            justify="center"
            h="full"
            color={subTextColor}
          >
            <Avatar
              icon={<MdAssistant />}
              size="lg"
              mb={3}
              bg="gray.700"
              color="white"
            />
            <Text fontSize="lg" fontWeight="semibold" color={textColor}>
              Cognivia AI
            </Text>
            <Text color="gray.500" fontSize="xs" mb={4}>
              Personalized Educational Assistant with Context & Memory
            </Text>
            <Text textAlign="center" maxW="md" fontSize="xs" color={subTextColor}>
              Ask me about your generated notes, upcoming quizzes, enrolled courses, or any study topics.
            </Text>
          </Flex>
        ) : (
          <VStack spacing={4} align="stretch">
            {currentMessages.map((msg, index) => (
              <MotionBox
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <VStack align="stretch" spacing={2}>
                  <Flex align="center" gap={2.5}>
                    <Avatar
                      icon={<FaUser />}
                      size="xs"
                      bg="gray.500"
                      color="white"
                    />
                    <Text fontWeight="semibold" fontSize="xs" color={textColor}>
                      You
                    </Text>
                  </Flex>
                  <Text color={textColor} pl={8} fontSize="sm">
                    {msg.query}
                  </Text>

                  <Divider borderColor={dividerColor} my={1.5} />

                  <Flex align="center" gap={2.5}>
                    <Avatar
                      icon={<MdAssistant />}
                      size="xs"
                      bg="gray.800"
                      color="white"
                    />
                    <Text fontWeight="semibold" fontSize="xs" color={textColor}>
                      Cognivia AI
                    </Text>
                    <IconButton
                      aria-label="Copy response"
                      icon={<FaCopy />}
                      size="xs"
                      variant="ghost"
                      ml="auto"
                      onClick={() => {
                        onCopyResponse(msg.response);
                        toast({
                          title: "Copied to clipboard",
                          status: "success",
                          duration: 2000,
                          isClosable: true,
                        });
                      }}
                    />
                  </Flex>
                  <Box pl={8}>{formatMarkdown(msg.response)}</Box>
                </VStack>
              </MotionBox>
            ))}

            {loading && (
              <MotionBox
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <VStack align="stretch" spacing={2}>
                  <Flex align="center" gap={2.5}>
                    <Avatar
                      icon={<FaUser />}
                      size="xs"
                      bg="gray.500"
                      color="white"
                    />
                    <Text fontWeight="semibold" fontSize="xs" color={textColor}>
                      You
                    </Text>
                  </Flex>
                  <Text color={textColor} pl={8} fontSize="sm">
                    {activePrompt || query}
                  </Text>

                  <Divider borderColor={dividerColor} my={1.5} />

                  <Flex align="center" gap={2.5}>
                    <Avatar
                      icon={<MdAssistant />}
                      size="xs"
                      bg="gray.800"
                      color="white"
                    />
                    <Text fontWeight="semibold" fontSize="xs" color={textColor}>
                      Cognivia AI
                    </Text>
                    <Spinner size="xs" ml="auto" />
                  </Flex>
                  <Box pl={8}>
                    {currentResponse ? (
                      formatMarkdown(currentResponse)
                    ) : (
                      <Text color={subTextColor} fontSize="xs" fontStyle="italic">
                        Cognivia AI is thinking...
                      </Text>
                    )}
                  </Box>
                </VStack>
              </MotionBox>
            )}
          </VStack>
        )}
      </Box>

      {/* Input Field Bar */}
      <HStack
        p={2}
        bg={inputBg}
        borderRadius="xl"
        borderWidth="1px"
        borderColor={dividerColor}
        m={2}
      >
        <Input
          placeholder="Ask Cognivia AI about your notes, quizzes, courses..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          size="md"
          flex={1}
          bg={surfaceColor}
          color={textColor}
          onKeyDown={handleKeyDown}
          borderRadius="lg"
          borderColor={dividerColor}
          fontSize="xs"
        />
        <IconButton
          aria-label="Ask Cognivia AI"
          colorScheme="gray"
          bg={useColorModeValue("gray.800", "gray.100")}
          color={useColorModeValue("white", "gray.900")}
          _hover={{ bg: useColorModeValue("gray.700", "white") }}
          onClick={onAskAI}
          isLoading={loading}
          icon={<ArrowUpIcon />}
          size="md"
          borderRadius="lg"
        />
      </HStack>
    </Flex>
  );
};

export default ChatWindow;
