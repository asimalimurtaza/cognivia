"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  SimpleGrid,
  Card,
  CardBody,
  Badge,
  useToast,
  Spinner,
  Flex,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  useDisclosure,
  IconButton,
  Progress,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import {
  FiPlus,
  FiRotateCw,
  FiAward,
  FiBookOpen,
  FiTrash2,
  FiArrowLeft,
  FiZap,
} from "react-icons/fi";

const MotionBox = motion(Box);

interface Flashcard {
  _id: string;
  front: string;
  back: string;
  box: number;
  lastReviewed?: string;
  nextReviewDate?: string;
}

interface FlashcardSet {
  _id: string;
  title: string;
  subject: string;
  cards: Flashcard[];
  createdAt: string;
}

export default function FlashcardsPage() {
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSet, setActiveSet] = useState<FlashcardSet | null>(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Form state
  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");

  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const pageBg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const headingColor = useColorModeValue("gray.800", "white");
  const textColor = useColorModeValue("gray.600", "gray.300");
  const metaColor = useColorModeValue("gray.500", "gray.400");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const hoverBorderColor = useColorModeValue("gray.400", "gray.500");
  const flashcardBg = useColorModeValue("white", "gray.800");

  const btnBg = useColorModeValue("gray.900", "white");
  const btnColor = useColorModeValue("white", "gray.900");
  const btnHoverBg = useColorModeValue("gray.800", "gray.100");

  useEffect(() => {
    fetchFlashcardSets();
  }, []);

  const fetchFlashcardSets = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/flashcards");
      if (res.ok) {
        const data = await res.json();
        setSets(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error loading flashcards:", err);
      toast({
        title: "Failed to load flashcards",
        status: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateDeck = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Topic prompt required",
        status: "warning",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, title, subject }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to generate deck.");
      }

      const newDeck = await res.json();
      setSets((prev) => [newDeck, ...prev]);
      toast({
        title: "Flashcard Deck Created!",
        status: "success",
        duration: 3000,
      });

      setPrompt("");
      setTitle("");
      setSubject("");
      onClose();
    } catch (err) {
      toast({
        title: "Generation failed",
        description: (err as Error).message,
        status: "error",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReviewCard = async (rating: "hard" | "good" | "easy") => {
    if (!activeSet) return;
    const currentCard = activeSet.cards[cardIndex];
    if (!currentCard) return;

    try {
      const res = await fetch(`/api/flashcards/${activeSet._id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId: currentCard._id, rating }),
      });

      if (res.ok) {
        const updatedSet = await res.json();
        setActiveSet(updatedSet);
        setSets((prev) =>
          prev.map((s) => (s._id === updatedSet._id ? updatedSet : s)),
        );
      }
    } catch (err) {
      console.error("Failed to submit review:", err);
    }

    setIsFlipped(false);
    if (cardIndex < activeSet.cards.length - 1) {
      setCardIndex((prev) => prev + 1);
    } else {
      toast({
        title: "Deck Review Complete!",
        description:
          "Great job! Cards rescheduled according to Leitner intervals.",
        status: "success",
        duration: 4000,
      });
      setCardIndex(0);
    }
  };

  const handleDeleteSet = async (setId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/flashcards/${setId}/review`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSets((prev) => prev.filter((s) => s._id !== setId));
        if (activeSet?._id === setId) {
          setActiveSet(null);
        }
        toast({ title: "Deck deleted", status: "info" });
      }
    } catch (err) {
      console.error("Delete deck failed:", err);
    }
  };

  // Active Study View Mode
  if (activeSet) {
    const currentCard = activeSet.cards[cardIndex];
    const progressPercent = Math.round(
      ((cardIndex + 1) / activeSet.cards.length) * 100,
    );

    return (
      <Box p={{ base: 4, md: 8 }} maxW="4xl" mx="auto" bg={pageBg} minH="100vh">
        <Button
          leftIcon={<FiArrowLeft />}
          variant="ghost"
          size="sm"
          mb={6}
          onClick={() => {
            setActiveSet(null);
            setIsFlipped(false);
            setCardIndex(0);
          }}
          borderRadius="md"
        >
          Back to Flashcard Decks
        </Button>

        <VStack spacing={6} align="stretch">
          <Flex justify="space-between" align="center">
            <Box>
              <HStack spacing={2} mb={1}>
                <Badge variant="outline" colorScheme="gray" fontSize="10px">
                  {activeSet.subject}
                </Badge>
                <Badge colorScheme="blue" fontSize="10px">
                  Leitner Box System
                </Badge>
              </HStack>
              <Heading size="md" color={headingColor}>
                {activeSet.title}
              </Heading>
            </Box>
            <Text fontSize="xs" color={metaColor}>
              Card {cardIndex + 1} of {activeSet.cards.length}
            </Text>
          </Flex>

          <Progress
            value={progressPercent}
            size="xs"
            colorScheme="gray"
            borderRadius="full"
          />

          {/* Interactive 3D Flip Card */}
          <Box
            minH="280px"
            cursor="pointer"
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <MotionBox
              style={{ transformStyle: "preserve-3d" }}
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.4 }}
              w="100%"
              minH="280px"
              position="relative"
            >
              {/* Front Side */}
              <Card
                bg={flashcardBg}
                borderRadius="2xl"
                borderWidth="1px"
                borderColor={borderColor}
                p={8}
                minH="280px"
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
                textAlign="center"
                style={{ backfaceVisibility: "hidden" }}
                boxShadow="md"
              >
                <Badge
                  variant="subtle"
                  colorScheme="gray"
                  fontSize="9px"
                  mb={4}
                >
                  QUESTION / FRONT (Click to Flip)
                </Badge>
                <Text fontSize="md" fontWeight="semibold" color={headingColor}>
                  {currentCard?.front}
                </Text>
                <HStack color={metaColor} fontSize="xs" mt={6} spacing={1}>
                  <FiRotateCw />
                  <Text>Click anywhere on card to flip</Text>
                </HStack>
              </Card>

              {/* Back Side */}
              <Card
                bg={flashcardBg}
                borderRadius="2xl"
                borderWidth="1px"
                borderColor={borderColor}
                p={8}
                minH="280px"
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
                textAlign="center"
                position="absolute"
                top={0}
                left={0}
                w="100%"
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                }}
                boxShadow="md"
              >
                <Badge colorScheme="green" fontSize="9px" mb={4}>
                  ANSWER / BACK (Leitner Box {currentCard?.box || 1})
                </Badge>
                <Text fontSize="sm" color={textColor} lineHeight="relaxed">
                  {currentCard?.back}
                </Text>
              </Card>
            </MotionBox>
          </Box>

          {/* Rating Buttons */}
          <Box pt={2}>
            <Text fontSize="xs" color={metaColor} textAlign="center" mb={3}>
              Rate how well you knew this card:
            </Text>
            <HStack spacing={4} justify="center">
              <Button
                colorScheme="red"
                variant="outline"
                size="sm"
                borderRadius="md"
                onClick={() => handleReviewCard("hard")}
                px={6}
              >
                Hard (Box 1)
              </Button>
              <Button
                colorScheme="blue"
                variant="outline"
                size="sm"
                borderRadius="md"
                onClick={() => handleReviewCard("good")}
                px={6}
              >
                Good (+1 Box)
              </Button>
              <Button
                colorScheme="green"
                variant="solid"
                size="sm"
                borderRadius="md"
                onClick={() => handleReviewCard("easy")}
                px={6}
              >
                Easy (Box 5)
              </Button>
            </HStack>
          </Box>
        </VStack>
      </Box>
    );
  }

  // Decks List View
  return (
    <Box p={{ base: 4, md: 8 }} maxW="7xl" mx="auto" bg={pageBg} minH="100vh">
      <VStack spacing={6} align="stretch">
        <Flex
          direction={{ base: "column", md: "row" }}
          justify="space-between"
          align={{ base: "flex-start", md: "center" }}
          gap={4}
        >
          <Box>
            <Heading size="lg" fontWeight="bold" color={headingColor}>
              AI Flashcards & Spaced Repetition
            </Heading>
            <Text color={metaColor} fontSize="sm" mt={0.5}>
              Leitner box review system to maximize exam retention
            </Text>
          </Box>

          <Button
            leftIcon={<FiPlus />}
            colorScheme="gray"
            bg={btnBg}
            color={btnColor}
            _hover={{ bg: btnHoverBg }}
            size="md"
            borderRadius="md"
            onClick={onOpen}
          >
            Generate AI Deck
          </Button>
        </Flex>

        {loading ? (
          <Flex justify="center" align="center" minH="250px">
            <Spinner size="md" color="gray.500" thickness="2px" />
          </Flex>
        ) : sets.length === 0 ? (
          <Card
            p={10}
            borderRadius="xl"
            bg={cardBg}
            borderWidth="1px"
            borderColor={borderColor}
            textAlign="center"
          >
            <VStack spacing={3}>
              <FiBookOpen size={32} color="#a0aec0" />
              <Heading size="sm" color={headingColor}>
                No flashcard decks created yet
              </Heading>
              <Text color={textColor} fontSize="xs" maxW="md">
                Click &quot;Generate AI Deck&quot; to transform your study
                topics or notes into smart Leitner flashcards.
              </Text>
              <Button
                size="sm"
                leftIcon={<FiZap />}
                colorScheme="gray"
                borderRadius="md"
                onClick={onOpen}
              >
                Generate AI Flashcards
              </Button>
            </VStack>
          </Card>
        ) : (
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={5}>
            {sets.map((set) => (
              <Card
                key={set._id}
                bg={cardBg}
                borderRadius="xl"
                borderWidth="1px"
                borderColor={borderColor}
                boxShadow="none"
                _hover={{ borderColor: hoverBorderColor }}
                cursor="pointer"
                onClick={() => {
                  setActiveSet(set);
                  setCardIndex(0);
                  setIsFlipped(false);
                }}
              >
                <CardBody p={5}>
                  <Flex justify="space-between" align="center" mb={2}>
                    <Badge variant="outline" colorScheme="gray" fontSize="10px">
                      {set.subject || "General"}
                    </Badge>
                    <IconButton
                      aria-label="Delete deck"
                      icon={<FiTrash2 />}
                      size="xs"
                      variant="ghost"
                      colorScheme="red"
                      onClick={(e) => handleDeleteSet(set._id, e)}
                    />
                  </Flex>

                  <Heading size="sm" color={headingColor} mb={2} noOfLines={1}>
                    {set.title}
                  </Heading>

                  <HStack
                    spacing={4}
                    fontSize="xs"
                    color={metaColor}
                    mt={4}
                    pt={3}
                    borderTop="1px solid"
                    borderColor={borderColor}
                  >
                    <HStack spacing={1}>
                      <FiAward />
                      <Text>{set.cards?.length || 0} Cards</Text>
                    </HStack>
                    <Text fontSize="10px">
                      {new Date(set.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </Text>
                  </HStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        )}
      </VStack>

      {/* Generate Flashcards Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
        <ModalOverlay bg="blackAlpha.400" />
        <ModalContent
          borderRadius="xl"
          overflow="hidden"
          bg={cardBg}
          borderWidth="1px"
          borderColor={borderColor}
        >
          <ModalHeader pt={6} px={6} pb={0}>
            <Heading size="md" color={headingColor}>
              Generate AI Flashcards
            </Heading>
            <Text fontSize="xs" color={metaColor} mt={1}>
              Cognivia AI will create 6-10 questions and answers
            </Text>
          </ModalHeader>
          <ModalCloseButton top={6} right={6} />

          <ModalBody p={6}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel fontSize="xs" fontWeight="medium">
                  Study Topic or Prompt
                </FormLabel>
                <Textarea
                  placeholder="e.g. Photosynthesis light reactions, Calvin cycle, and chloroplast structure..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                  borderRadius="md"
                  fontSize="xs"
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="xs" fontWeight="medium">
                  Deck Title (Optional)
                </FormLabel>
                <Input
                  placeholder="e.g. Biology Ch. 5 Photosynthesis"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  borderRadius="md"
                  fontSize="xs"
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="xs" fontWeight="medium">
                  Subject (Optional)
                </FormLabel>
                <Input
                  placeholder="e.g. Biology"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  borderRadius="md"
                  fontSize="xs"
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter px={6} pb={6} gap={2}>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              borderRadius="md"
            >
              Cancel
            </Button>
            <Button
              colorScheme="gray"
              bg={btnBg}
              color={btnColor}
              _hover={{ bg: btnHoverBg }}
              onClick={handleGenerateDeck}
              isLoading={isGenerating}
              size="sm"
              borderRadius="md"
              px={5}
            >
              Generate Flashcard Deck
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
