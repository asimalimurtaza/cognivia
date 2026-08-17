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

export default function StudentCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const router = useRouter();

  const pageBg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const headingColor = useColorModeValue("gray.800", "white");
  const textColor = useColorModeValue("gray.600", "gray.300");
  const metaColor = useColorModeValue("gray.500", "gray.400");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const hoverBorderColor = useColorModeValue("gray.400", "gray.500");
  const btnBg = useColorModeValue("gray.900", "white");
  const btnColor = useColorModeValue("white", "gray.900");
  const btnHoverBg = useColorModeValue("gray.800", "gray.100");

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
      <VStack spacing={6} align="stretch">
        {/* Minimal Banner Section */}
        <Flex
          direction={{ base: "column", md: "row" }}
          justify="space-between"
          align={{ base: "flex-start", md: "center" }}
          gap={4}
          pb={2}
        >
          <Box>
            <Heading size="lg" fontWeight="bold" color={headingColor}>
              My Enrolled Classes ({courses.length})
            </Heading>
            <Text color={metaColor} fontSize="sm" mt={0.5}>
              Access your class stream, assignments, and live video sessions
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
            Join Class with Code
          </Button>
        </Flex>

        {/* Courses Grid */}
        {loading ? (
          <Flex justify="center" align="center" minH="250px">
            <Spinner size="md" color="gray.500" thickness="2px" />
          </Flex>
        ) : courses.length === 0 ? (
          <Card
            p={10}
            borderRadius="xl"
            bg={cardBg}
            borderWidth="1px"
            borderColor={borderColor}
            textAlign="center"
          >
            <VStack spacing={3}>
              <FaGraduationCap size={32} color="#a0aec0" />
              <Heading size="sm" color={headingColor}>
                You haven&apos;t joined any classes yet
              </Heading>
              <Text color={textColor} fontSize="xs" maxW="md">
                Ask your teacher for the 6-character class code to join your workspace.
              </Text>
              <Button size="sm" leftIcon={<FiPlus />} colorScheme="gray" borderRadius="md" onClick={onOpen}>
                Enter Class Code
              </Button>
            </VStack>
          </Card>
        ) : (
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={5}>
            {courses.map((course) => (
              <Card
                key={course._id}
                bg={cardBg}
                borderRadius="xl"
                borderWidth="1px"
                borderColor={borderColor}
                boxShadow="none"
                _hover={{ borderColor: hoverBorderColor }}
                cursor="pointer"
                onClick={() => router.push(`/dashboard/courses/${course._id}`)}
              >
                <CardBody p={5}>
                  <Badge variant="outline" colorScheme="gray" px={2} py={0.5} borderRadius="md" fontSize="10px" mb={2}>
                    {course.subject || "General"}
                  </Badge>

                  <Heading size="sm" color={headingColor} mb={2} noOfLines={1}>
                    {course.title}
                  </Heading>

                  <Text fontSize="xs" color={textColor} noOfLines={2} minH="36px" mb={4}>
                    {course.description || "No description provided for this course."}
                  </Text>

                  <Flex justify="space-between" align="center" pt={3} borderTop="1px solid" borderColor={borderColor}>
                    <HStack spacing={2}>
                      <Avatar size="2xs" name={course.teacher?.name || "Teacher"} src={course.teacher?.avatar} />
                      <Text fontSize="xs" color={metaColor}>
                        {course.teacher?.name || "Instructor"}
                      </Text>
                    </HStack>

                    <HStack spacing={1} color={textColor} fontSize="xs" fontWeight="medium">
                      <Text>Open</Text>
                      <FiArrowRight />
                    </HStack>
                  </Flex>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        )}
      </VStack>

      {/* Join Class Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
        <ModalOverlay bg="blackAlpha.400" />
        <ModalContent borderRadius="xl" overflow="hidden" bg={cardBg} borderWidth="1px" borderColor={borderColor} boxShadow="xl">
          <ModalHeader pt={6} px={6} pb={0}>
            <Heading size="md" color={headingColor}>Join Class via Code</Heading>
            <Text fontSize="xs" color={metaColor} mt={1}>
              Enter the 6-character code provided by your instructor
            </Text>
          </ModalHeader>
          <ModalCloseButton top={6} right={6} />

          <ModalBody p={6}>
            <VStack spacing={3}>
              <InputGroup size="md">
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
                  borderRadius="md"
                  fontSize="sm"
                />
              </InputGroup>
              <Text fontSize="xs" color={metaColor}>
                Class codes are 6 letters/numbers long and case-insensitive.
              </Text>
            </VStack>
          </ModalBody>

          <ModalFooter px={6} pb={6} gap={2}>
            <Button onClick={onClose} variant="ghost" size="sm" borderRadius="md">
              Cancel
            </Button>
            <Button
              colorScheme="gray"
              bg={btnBg}
              color={btnColor}
              _hover={{ bg: btnHoverBg }}
              onClick={handleJoinCourse}
              isLoading={joining}
              size="sm"
              borderRadius="md"
              px={5}
            >
              Join Class
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
