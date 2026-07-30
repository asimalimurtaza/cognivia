"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Heading,
  SimpleGrid,
  Text,
  useDisclosure,
  Input,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useToast,
  Spinner,
  Flex,
  useColorModeValue,
  Avatar,
  Badge,
  HStack,
  VStack,
  Card,
  CardBody,
  InputGroup,
  InputLeftElement,
  ModalCloseButton,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { FaGraduationCap } from "react-icons/fa";
import { FiPlus, FiArrowRight, FiKey } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const MotionCard = motion(Card);

interface Course {
  _id: string;
  title: string;
  description: string;
  subject?: string;
  level?: string;
  teacher?: {
    name: string;
    avatar?: string;
  };
}

const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: "linear-gradient(135deg, #3182ce 0%, #63b3ed 100%)",
  Science: "linear-gradient(135deg, #38a169 0%, #68d391 100%)",
  English: "linear-gradient(135deg, #dd6b20 0%, #f6ad55 100%)",
  History: "linear-gradient(135deg, #805ad5 0%, #b794f4 100%)",
  ComputerScience: "linear-gradient(135deg, #319795 0%, #4fd1c5 100%)",
  Default: "linear-gradient(135deg, #2b6cb0 0%, #4299e1 100%)",
};

export default function StudentCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const router = useRouter();

  const pageBg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.850");
  const headingColor = useColorModeValue("gray.800", "white");
  const textColor = useColorModeValue("gray.600", "gray.300");
  const metaColor = useColorModeValue("gray.500", "gray.400");
  const borderColor = useColorModeValue("gray.150", "gray.750");

  const heroBg = useColorModeValue(
    "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
    "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)"
  );

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/courses/students");
      if (!res.ok) {
        throw new Error("Failed to fetch courses");
      }
      const data = await res.json();
      setCourses(data.courses || []);
    } catch (error) {
      toast({
        title: "Error fetching courses",
        description: (error as Error).message || "Could not load your classes.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleJoinCourse = async () => {
    if (!joinCode.trim()) {
      toast({
        title: "Please enter a class code.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setJoining(true);
    try {
      const res = await fetch("/api/courses/join", {
        method: "POST",
        body: JSON.stringify({ joinCode: joinCode.trim() }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (res.ok) {
        toast({
          title: "Successfully joined class!",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        fetchCourses();
        onClose();
        setJoinCode("");
      } else {
        toast({
          title: data.error || "Failed to join class",
          description: "Double check the code provided by your teacher.",
          status: "error",
          duration: 4000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error("Error joining course:", error);
      toast({
        title: "Network error",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setJoining(false);
    }
  };

  return (
    <Box p={{ base: 4, md: 8 }} maxW="7xl" mx="auto" bg={pageBg} minH="100vh">
      <VStack spacing={8} align="stretch">
        {/* Banner Section */}
        <Box
          bg={heroBg}
          borderRadius="3xl"
          p={{ base: 6, md: 8 }}
          color="white"
          boxShadow="xl"
        >
          <Flex
            direction={{ base: "column", md: "row" }}
            justify="space-between"
            align={{ base: "flex-start", md: "center" }}
            gap={6}
          >
            <VStack align="flex-start" spacing={2}>
              <Badge colorScheme="blue" px={3} py={1} borderRadius="full" fontSize="xs" fontWeight="bold">
                Student Portal
              </Badge>
              <Heading size="xl" fontWeight="extrabold">
                My Enrolled Classes ({courses.length})
              </Heading>
              <Text color="gray.300" fontSize="sm" maxW="xl">
                Access your class announcements, view assignment requirements, download resources, and join live sessions.
              </Text>
            </VStack>

            <Button
              leftIcon={<FiPlus />}
              colorScheme="blue"
              size="lg"
              borderRadius="xl"
              px={8}
              onClick={onOpen}
              boxShadow="0 4px 20px rgba(59, 130, 246, 0.4)"
            >
              Join Class with Code
            </Button>
          </Flex>
        </Box>

        {/* Courses Grid */}
        {loading ? (
          <Flex justify="center" align="center" minH="300px">
            <VStack spacing={3}>
              <Spinner size="xl" color="blue.500" thickness="4px" />
              <Text color={metaColor}>Loading your classes...</Text>
            </VStack>
          </Flex>
        ) : courses.length === 0 ? (
          <Card
            p={12}
            borderRadius="3xl"
            bg={cardBg}
            borderWidth="1px"
            borderColor={borderColor}
            textAlign="center"
          >
            <VStack spacing={4}>
              <Flex w={16} h={16} bg="blue.50" color="blue.500" borderRadius="full" align="center" justify="center">
                <FaGraduationCap size={32} />
              </Flex>
              <Heading size="md" color={headingColor}>
                You haven&apos;t joined any classes yet
              </Heading>
              <Text color={textColor} maxW="md">
                Ask your teacher for the 6-character class code and click &quot;Join Class with Code&quot; above to get started.
              </Text>
              <Button leftIcon={<FiPlus />} colorScheme="blue" borderRadius="xl" onClick={onOpen}>
                Enter Class Code
              </Button>
            </VStack>
          </Card>
        ) : (
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={6}>
            <AnimatePresence>
              {courses.map((course) => {
                const headerGradient =
                  SUBJECT_COLORS[course.subject || ""] || SUBJECT_COLORS.Default;

                return (
                  <MotionCard
                    key={course._id}
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    bg={cardBg}
                    borderRadius="2xl"
                    overflow="hidden"
                    borderWidth="1px"
                    borderColor={borderColor}
                    boxShadow="sm"
                    _hover={{
                      boxShadow: "xl",
                      transform: "translateY(-4px)",
                    }}
                    cursor="pointer"
                    onClick={() => router.push(`/dashboard/courses/${course._id}`)}
                  >
                    {/* Header Banner */}
                    <Box h="110px" bg={headerGradient} p={5} color="white">
                      <HStack justify="space-between" mb={2}>
                        <Badge
                          bg="whiteAlpha.300"
                          color="white"
                          backdropFilter="blur(4px)"
                          px={3}
                          py={1}
                          borderRadius="full"
                          fontSize="xs"
                        >
                          {course.subject || "General"}
                        </Badge>
                      </HStack>

                      <Heading size="md" color="white" noOfLines={1}>
                        {course.title}
                      </Heading>
                    </Box>

                    <CardBody p={5}>
                      <Text fontSize="sm" color={textColor} noOfLines={2} minH="40px" mb={4}>
                        {course.description || "No description provided for this course."}
                      </Text>

                      <Flex justify="space-between" align="center" pt={3} borderTop="1px solid" borderColor={borderColor}>
                        <HStack spacing={2.5}>
                          <Avatar size="xs" name={course.teacher?.name || "Teacher"} src={course.teacher?.avatar} />
                          <Text fontSize="xs" fontWeight="semibold" color={metaColor}>
                            {course.teacher?.name || "Instructor"}
                          </Text>
                        </HStack>

                        <HStack spacing={1} color="blue.500" fontSize="xs" fontWeight="bold">
                          <Text>Open Workspace</Text>
                          <FiArrowRight />
                        </HStack>
                      </Flex>
                    </CardBody>
                  </MotionCard>
                );
              })}
            </AnimatePresence>
          </SimpleGrid>
        )}
      </VStack>

      {/* Join Class Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
        <ModalOverlay backdropFilter="blur(6px)" bg="blackAlpha.600" />
        <ModalContent borderRadius="2xl" overflow="hidden" bg={cardBg} boxShadow="2xl">
          <ModalHeader bg="linear-gradient(135deg, #2b6cb0 0%, #4299e1 100%)" color="white" p={6}>
            <Heading size="md">Join Class via Code</Heading>
            <Text fontSize="xs" opacity={0.9} mt={1}>
              Enter the 6-character code provided by your instructor
            </Text>
          </ModalHeader>
          <ModalCloseButton color="white" top={6} right={6} />

          <ModalBody p={6}>
            <VStack spacing={4}>
              <InputGroup size="lg">
                <InputLeftElement pointerEvents="none">
                  <FiKey color="#a0aec0" />
                </InputLeftElement>
                <Input
                  placeholder="e.g. AB12CD"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  letterSpacing="2px"
                  fontWeight="bold"
                  textTransform="uppercase"
                  borderRadius="xl"
                />
              </InputGroup>
              <Text fontSize="xs" color={metaColor}>
                Class codes are 6 letters/numbers long and case-insensitive.
              </Text>
            </VStack>
          </ModalBody>

          <ModalFooter px={6} pb={6} gap={3}>
            <Button onClick={onClose} variant="ghost" borderRadius="xl">
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleJoinCourse}
              isLoading={joining}
              borderRadius="xl"
              px={6}
            >
              Join Class
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
