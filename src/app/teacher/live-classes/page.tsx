"use client";

import {
  Box,
  Heading,
  Input,
  Button,
  VStack,
  useToast,
  Text,
  Select,
  Flex,
  Card,
  useColorModeValue,
  Spinner,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Badge,
  HStack,
  Grid,
  GridItem,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import {
  FiPlus,
  FiVideo,
  FiCalendar,
  FiPlayCircle,
} from "react-icons/fi";
import { motion } from "framer-motion";

const MotionCard = motion(Card);

type Course = {
  _id: string;
  title: string;
};

type LiveClass = {
  _id: string;
  title: string;
  courseId: string;
  course?: Course;
  scheduledAt: string;
  channelName: string;
};

type FormErrors = {
  title: string;
  scheduledAt: string;
  selectedCourse: string;
};

export default function LiveClassDashboard() {
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [formErrors, setFormErrors] = useState<FormErrors>({
    title: "",
    scheduledAt: "",
    selectedCourse: "",
  });

  const bgColor = useColorModeValue("gray.50", "gray.900");
  const cardBgColor = useColorModeValue("white", "gray.850");
  const itemBgColor = useColorModeValue("gray.50", "gray.800");
  const headingColor = useColorModeValue("gray.800", "white");
  const lightTextColor = useColorModeValue("gray.500", "gray.400");
  const borderColor = useColorModeValue("gray.150", "gray.750");

  const heroBg = useColorModeValue(
    "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
    "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)"
  );

  const validateForm = () => {
    let isValid = true;
    const errors: FormErrors = {
      title: "",
      scheduledAt: "",
      selectedCourse: "",
    };

    if (!title.trim()) {
      errors.title = "Class title is required.";
      isValid = false;
    }
    if (!scheduledAt) {
      errors.scheduledAt = "Scheduled date & time is required.";
      isValid = false;
    }
    if (!selectedCourse) {
      errors.selectedCourse = "Please select a course.";
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  useEffect(() => {
    async function fetchData() {
      setIsLoadingData(true);
      try {
        const [courseRes, classRes] = await Promise.all([
          fetch("/api/courses"),
          fetch("/api/live-classes"),
        ]);

        if (courseRes.ok) {
          const coursesData = await courseRes.json();
          setCourses(Array.isArray(coursesData) ? coursesData : []);
        }

        if (classRes.ok) {
          const classesData = await classRes.json();
          setClasses(Array.isArray(classesData) ? classesData : []);
        }
      } catch (err) {
        console.error("Error loading live class data:", err);
        toast({
          title: "Error loading data",
          description: "Failed to load live class schedule.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoadingData(false);
      }
    }

    fetchData();
  }, [toast]);

  const handleCreate = async () => {
    if (!validateForm()) return;

    setIsCreating(true);
    try {
      const channelName = `room-${Date.now()}`;
      const res = await fetch("/api/live-classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          scheduledAt,
          courseId: selectedCourse,
          channelName,
        }),
      });

      if (res.ok) {
        const newClass = await res.json();
        setClasses((prev) => [newClass, ...prev]);
        toast({
          title: "Live Class Scheduled!",
          description: "Your session is ready for students.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });

        setTitle("");
        setScheduledAt("");
        setSelectedCourse("");
        setFormErrors({ title: "", scheduledAt: "", selectedCourse: "" });
      } else {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create live class");
      }
    } catch (err) {
      toast({
        title: "Creation failed",
        description: (err as Error).message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Box bg={bgColor} minH="100vh" p={{ base: 4, md: 8 }}>
      <VStack spacing={8} align="stretch" maxW="7xl" mx="auto">
        {/* Banner */}
        <Box
          bg={heroBg}
          borderRadius="3xl"
          p={{ base: 6, md: 8 }}
          color="white"
          boxShadow="xl"
        >
          <HStack spacing={3} mb={2}>
            <Badge colorScheme="red" variant="solid" px={3} py={1} borderRadius="full">
              LIVE SESSION HUB
            </Badge>
          </HStack>
          <Heading size="xl" fontWeight="extrabold">
            Live Interactive Classes
          </Heading>
          <Text color="gray.200" fontSize="sm" mt={1} maxW="2xl">
            Schedule live audio/video classes, stream video lectures, and interact in real-time with enrolled students.
          </Text>
        </Box>

        <Grid templateColumns={{ base: "1fr", lg: "1fr 2fr" }} gap={8}>
          {/* Creation Form */}
          <GridItem>
            <Card
              bg={cardBgColor}
              borderRadius="2xl"
              borderWidth="1px"
              borderColor={borderColor}
              boxShadow="md"
              p={6}
            >
              <Heading size="md" color={headingColor} mb={1}>
                Schedule New Live Class
              </Heading>
              <Text fontSize="xs" color={lightTextColor} mb={6}>
                Configure date, time, and target course
              </Text>

              <VStack spacing={4}>
                <FormControl isInvalid={!!formErrors.title} isRequired>
                  <FormLabel fontSize="sm" fontWeight="semibold">Session Title</FormLabel>
                  <Input
                    placeholder="e.g. Q&A & Exam Review Session"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    borderRadius="xl"
                  />
                  <FormErrorMessage>{formErrors.title}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!formErrors.selectedCourse} isRequired>
                  <FormLabel fontSize="sm" fontWeight="semibold">Course</FormLabel>
                  <Select
                    placeholder="Select Target Course"
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    borderRadius="xl"
                  >
                    {courses.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.title}
                      </option>
                    ))}
                  </Select>
                  <FormErrorMessage>{formErrors.selectedCourse}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!formErrors.scheduledAt} isRequired>
                  <FormLabel fontSize="sm" fontWeight="semibold">Schedule Date & Time</FormLabel>
                  <Input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    borderRadius="xl"
                  />
                  <FormErrorMessage>{formErrors.scheduledAt}</FormErrorMessage>
                </FormControl>

                <Button
                  colorScheme="blue"
                  leftIcon={<FiPlus />}
                  w="100%"
                  size="lg"
                  borderRadius="xl"
                  onClick={handleCreate}
                  isLoading={isCreating}
                  mt={2}
                  boxShadow="0 4px 14px rgba(59, 130, 246, 0.35)"
                >
                  Schedule Session
                </Button>
              </VStack>
            </Card>
          </GridItem>

          {/* Class List */}
          <GridItem>
            <Card
              bg={cardBgColor}
              borderRadius="2xl"
              borderWidth="1px"
              borderColor={borderColor}
              boxShadow="md"
              p={6}
            >
              <Heading size="md" color={headingColor} mb={1}>
                Upcoming & Live Classes ({classes.length})
              </Heading>
              <Text fontSize="xs" color={lightTextColor} mb={6}>
                Manage stream channels and launch video rooms
              </Text>

              {isLoadingData ? (
                <Flex justify="center" align="center" minH="250px">
                  <Spinner size="xl" color="blue.500" thickness="3px" />
                </Flex>
              ) : classes.length === 0 ? (
                <VStack py={12} spacing={3} color={lightTextColor} textAlign="center">
                  <FiVideo size={40} />
                  <Text fontWeight="semibold" fontSize="md">No live classes scheduled</Text>
                  <Text fontSize="xs">Schedule your first class using the form on the left.</Text>
                </VStack>
              ) : (
                <VStack spacing={4} align="stretch" maxH="550px" overflowY="auto" pr={1}>
                  {classes.map((cls) => (
                    <MotionCard
                      key={cls._id}
                      whileHover={{ scale: 1.01 }}
                      p={5}
                      borderRadius="xl"
                      borderWidth="1px"
                      borderColor={borderColor}
                      bg={itemBgColor}
                    >
                      <Flex justify="space-between" align="center">
                        <Box flex={1}>
                          <HStack spacing={2} mb={1}>
                            <Badge colorScheme="blue" px={2.5} py={0.5} borderRadius="md" fontSize="xs">
                              {cls.course?.title || "Course Session"}
                            </Badge>
                          </HStack>
                          <Heading size="sm" color={headingColor} mb={1}>
                            {cls.title}
                          </Heading>
                          <HStack spacing={4} fontSize="xs" color={lightTextColor}>
                            <HStack spacing={1}>
                              <FiCalendar />
                              <Text>
                                {new Date(cls.scheduledAt).toLocaleString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </Text>
                            </HStack>
                          </HStack>
                        </Box>

                        <Button
                          leftIcon={<FiPlayCircle />}
                          colorScheme="green"
                          size="md"
                          borderRadius="xl"
                          onClick={() => window.open(`/live-class/${cls.channelName}`, "_blank")}
                          boxShadow="0 4px 12px rgba(34, 197, 94, 0.3)"
                        >
                          Start Stream
                        </Button>
                      </Flex>
                    </MotionCard>
                  ))}
                </VStack>
              )}
            </Card>
          </GridItem>
        </Grid>
      </VStack>
    </Box>
  );
}
