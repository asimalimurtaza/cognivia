"use client";

import { useState, useRef } from "react";
import {
  Box,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Card,
  useToast,
  Spinner,
  Flex,
  useColorModeValue,
  Input,
  IconButton,
  Badge,
  Grid,
  GridItem,
  Icon,
  Code,
  HeadingProps,
  TextProps,
  CodeProps,
} from "@chakra-ui/react";
import ReactMarkdown from "react-markdown";
import {
  FiUploadCloud,
  FiFileText,
  FiSend,
  FiCheckCircle,
  FiZap,
  FiHelpCircle,
  FiList,
} from "react-icons/fi";

interface Message {
  query: string;
  response: string;
}

interface MarkdownComponentProps {
  children?: React.ReactNode;
}

export default function DocumentChatPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState<string>("");
  const [isProcessingDoc, setIsProcessingDoc] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [query, setQuery] = useState("");
  const [isAsking, setIsAsking] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const pageBg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const headingColor = useColorModeValue("gray.800", "white");
  const metaColor = useColorModeValue("gray.500", "gray.400");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const bubbleBg = useColorModeValue("gray.50", "gray.900");
  const codeBg = useColorModeValue("gray.100", "gray.800");

  const btnBg = useColorModeValue("gray.900", "white");
  const btnColor = useColorModeValue("white", "gray.900");
  const btnHoverBg = useColorModeValue("gray.800", "gray.100");

  const formatMarkdown = (text: string) => {
    const components = {
      code({ children, ...props }: MarkdownComponentProps) {
        return (
          <Code bg={codeBg} p={1} borderRadius="md" fontSize="0.85em" {...(props as CodeProps)}>
            {children}
          </Code>
        );
      },
      h1({ children, ...props }: MarkdownComponentProps) {
        return (
          <Heading as="h1" size="sm" color={headingColor} my={2} {...(props as HeadingProps)}>
            {children}
          </Heading>
        );
      },
      h2({ children, ...props }: MarkdownComponentProps) {
        return (
          <Heading as="h2" size="xs" color={headingColor} my={1.5} {...(props as HeadingProps)}>
            {children}
          </Heading>
        );
      },
      p({ children, ...props }: MarkdownComponentProps) {
        return (
          <Text my={1} lineHeight="relaxed" fontSize="xs" {...(props as TextProps)}>
            {children}
          </Text>
        );
      },
    };

    return <ReactMarkdown components={components}>{text}</ReactMarkdown>;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setDocumentName(file.name);
    setIsProcessingDoc(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("query", "Summarize this document and highlight 3 core concepts.");

      const res = await fetch("/api/chat/document", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to process PDF.");
      }

      const data = await res.json();
      setMessages([
        {
          query: "Document Summary & Overview",
          response: data.response,
        },
      ]);

      toast({
        title: "Document Analyzed",
        description: `Successfully extracted text from ${file.name}`,
        status: "success",
        duration: 3000,
      });
    } catch (err) {
      console.error("PDF upload error:", err);
      toast({
        title: "Document analysis failed",
        description: (err as Error).message,
        status: "error",
      });
    } finally {
      setIsProcessingDoc(false);
    }
  };

  const handleAskQuestion = async (customQuery?: string) => {
    const activeQuery = customQuery || query;
    if (!activeQuery.trim()) return;

    if (!selectedFile) {
      toast({
        title: "No document loaded",
        description: "Please upload a PDF or text document first.",
        status: "warning",
      });
      return;
    }

    setIsAsking(true);
    setQuery("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("query", activeQuery);

      const res = await fetch("/api/chat/document", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Document AI query failed");

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { query: activeQuery, response: data.response },
      ]);
    } catch (err) {
      toast({
        title: "Query failed",
        description: (err as Error).message,
        status: "error",
      });
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <Box p={{ base: 4, md: 8 }} maxW="7xl" mx="auto" bg={pageBg} minH="100vh">
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="lg" fontWeight="bold" color={headingColor}>
            Interactive Document AI (&quot;Chat with PDF&quot;)
          </Heading>
          <Text color={metaColor} fontSize="sm" mt={0.5}>
            Upload textbook chapters or course slides and query key takeaways instantly
          </Text>
        </Box>

        <Grid templateColumns={{ base: "1fr", lg: "1fr 2fr" }} gap={6}>
          {/* Left Column: File Loader & Overview */}
          <GridItem>
            <Card bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor} p={5}>
              <Heading size="sm" color={headingColor} mb={1}>
                Load Study Material
              </Heading>
              <Text fontSize="xs" color={metaColor} mb={4}>
                Upload assignment PDFs or paste study text
              </Text>

              <input
                type="file"
                ref={fileInputRef}
                accept=".pdf,.txt"
                onChange={handleFileSelect}
                style={{ display: "none" }}
              />

              {selectedFile ? (
                <Box p={4} borderRadius="lg" bg={bubbleBg} borderWidth="1px" borderColor={borderColor} mb={4}>
                  <HStack justify="space-between">
                    <HStack spacing={2}>
                      <Icon as={FiCheckCircle} color="green.500" />
                      <Box>
                        <Text fontWeight="semibold" fontSize="xs" color={headingColor} noOfLines={1}>
                          {documentName}
                        </Text>
                        <Text fontSize="10px" color={metaColor}>
                          {(selectedFile.size / 1024).toFixed(1)} KB PDF/Text
                        </Text>
                      </Box>
                    </HStack>
                    <Button size="xs" variant="ghost" onClick={() => fileInputRef.current?.click()}>
                      Change
                    </Button>
                  </HStack>
                </Box>
              ) : (
                <Box
                  p={6}
                  borderWidth="1px"
                  borderStyle="dashed"
                  borderColor={borderColor}
                  borderRadius="xl"
                  bg={bubbleBg}
                  textAlign="center"
                  cursor="pointer"
                  onClick={() => fileInputRef.current?.click()}
                  mb={4}
                >
                  <VStack spacing={2}>
                    <Icon as={FiUploadCloud} w={6} h={6} color={metaColor} />
                    <Text fontSize="xs" fontWeight="medium">
                      Click to upload course PDF or study notes
                    </Text>
                    <Text fontSize="10px" color={metaColor}>
                      Supports PDF, TXT files up to 15MB
                    </Text>
                  </VStack>
                </Box>
              )}

              {/* Quick AI Action Pills */}
              <Heading size="xs" textTransform="uppercase" color={metaColor} mb={3} pt={2}>
                Quick Document Actions
              </Heading>
              <VStack align="stretch" spacing={2}>
                <Button
                  size="xs"
                  variant="outline"
                  leftIcon={<FiList />}
                  justifyContent="flex-start"
                  onClick={() => handleAskQuestion("Provide a detailed summary of key concepts in bullet points.")}
                  isDisabled={!selectedFile}
                  borderRadius="md"
                >
                  Summarize Key Points
                </Button>
                <Button
                  size="xs"
                  variant="outline"
                  leftIcon={<FiZap />}
                  justifyContent="flex-start"
                  onClick={() => handleAskQuestion("Extract all formulas, definitions, and important technical terms.")}
                  isDisabled={!selectedFile}
                  borderRadius="md"
                >
                  Extract Formulas & Definitions
                </Button>
                <Button
                  size="xs"
                  variant="outline"
                  leftIcon={<FiHelpCircle />}
                  justifyContent="flex-start"
                  onClick={() => handleAskQuestion("Generate 5 practice exam questions with answers based on this document.")}
                  isDisabled={!selectedFile}
                  borderRadius="md"
                >
                  Generate 5 Exam Questions
                </Button>
              </VStack>
            </Card>
          </GridItem>

          {/* Right Column: Document Q&A Feed */}
          <GridItem>
            <Card bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor} p={5} minH="500px" display="flex" flexDirection="column">
              <Heading size="sm" color={headingColor} mb={1}>
                Document AI Assistant
              </Heading>
              <Text fontSize="xs" color={metaColor} mb={4}>
                Ask questions or request specific explanations from your file
              </Text>

              <VStack spacing={3} align="stretch" flex={1} overflowY="auto" maxH="450px" pr={1} mb={4}>
                {isProcessingDoc ? (
                  <Flex justify="center" align="center" minH="250px">
                    <VStack spacing={3}>
                      <Spinner size="md" color="gray.500" thickness="2px" />
                      <Text fontSize="xs" color={metaColor}>Extracting text and generating summary...</Text>
                    </VStack>
                  </Flex>
                ) : messages.length === 0 ? (
                  <Flex justify="center" align="center" minH="250px" direction="column" color={metaColor}>
                    <FiFileText size={32} />
                    <Text fontSize="xs" mt={2} fontWeight="medium">
                      No document loaded yet
                    </Text>
                    <Text fontSize="10px">Upload a PDF on the left to start asking questions.</Text>
                  </Flex>
                ) : (
                  messages.map((msg, idx) => (
                    <Box key={idx} p={3.5} borderRadius="lg" borderWidth="1px" borderColor={borderColor} bg={bubbleBg}>
                      <Badge variant="outline" colorScheme="gray" fontSize="9px" mb={1}>
                        {msg.query}
                      </Badge>
                      <Box mt={1}>{formatMarkdown(msg.response)}</Box>
                    </Box>
                  ))
                )}

                {isAsking && (
                  <HStack p={3} borderRadius="lg" bg={bubbleBg} spacing={2}>
                    <Spinner size="xs" />
                    <Text fontSize="xs" color={metaColor}>Cognivia Document AI is analyzing...</Text>
                  </HStack>
                )}
              </VStack>

              {/* Input Bar */}
              <HStack spacing={2} pt={2} borderTop="1px solid" borderColor={borderColor}>
                <Input
                  placeholder="Ask a question about this document..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAskQuestion()}
                  size="sm"
                  borderRadius="md"
                  fontSize="xs"
                  isDisabled={!selectedFile}
                />
                <IconButton
                  aria-label="Send Query"
                  icon={<FiSend />}
                  size="sm"
                  colorScheme="gray"
                  bg={btnBg}
                  color={btnColor}
                  _hover={{ bg: btnHoverBg }}
                  onClick={() => handleAskQuestion()}
                  isLoading={isAsking}
                  isDisabled={!selectedFile}
                  borderRadius="md"
                />
              </HStack>
            </Card>
          </GridItem>
        </Grid>
      </VStack>
    </Box>
  );
}
