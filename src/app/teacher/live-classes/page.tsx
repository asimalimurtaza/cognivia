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
  const cardBgColor = useColorModeValue("white", "gray.800");
  const itemBgColor = useColorModeValue("gray.50", "gray.900");
  const headingColor = useColorModeValue("gray.800", "white");
  const lightTextColor = useColorModeValue("gray.500", "gray.400");
  const borderColor = useColorModeValue("gray.200", "gray.700");

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
      <VStack spacing={6} align="stretch" maxW="7xl" mx="auto">
        {/* Minimal Header */}
        <Box>
          <Heading size="lg" fontWeight="bold" color={headingColor}>
            Live Interactive Classes
          </Heading>
          <Text color={lightTextColor} fontSize="sm" mt={0.5}>
            Schedule live video classes and manage stream channels
          </Text>
        </Box>

        <Grid templateColumns={{ base: "1fr", lg: "1fr 2fr" }} gap={6}>
          {/* Creation Form */}
          <GridItem>
            <Card
              bg={cardBgColor}
              borderRadius="xl"
              borderWidth="1px"
              borderColor={borderColor}
              p={5}
            >
              <Heading size="sm" color={headingColor} mb={1}>
                Schedule Live Class
              </Heading>
              <Text fontSize="xs" color={lightTextColor} mb={5}>
                Configure date, time, and target course
              </Text>

              <VStack spacing={4}>
                <FormControl isInvalid={!!formErrors.title} isRequired>
                  <FormLabel fontSize="xs" fontWeight="medium">Session Title</FormLabel>
                  <Input
                    placeholder="e.g. Q&A Review Session"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    borderRadius="md"
                    fontSize="xs"
                  />
                  <FormErrorMessage>{formErrors.title}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!formErrors.selectedCourse} isRequired>
                  <FormLabel fontSize="xs" fontWeight="medium">Course</FormLabel>
                  <Select
                    placeholder="Select Target Course"
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    borderRadius="md"
                    fontSize="xs"
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
                  <FormLabel fontSize="xs" fontWeight="medium">Schedule Date & Time</FormLabel>
                  <Input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    borderRadius="md"
                    fontSize="xs"
                  />
                  <FormErrorMessage>{formErrors.scheduledAt}</FormErrorMessage>
                </FormControl>

                <Button
                  colorScheme="gray"
                  bg={useColorModeValue("gray.800", "gray.100")}
                  color={useColorModeValue("white", "gray.900")}
                  _hover={{ bg: useColorModeValue("gray.700", "white") }}
                  leftIcon={<FiPlus />}
                  w="100%"
                  size="sm"
                  borderRadius="md"
                  onClick={handleCreate}
                  isLoading={isCreating}
                  mt={2}
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
              borderRadius="xl"
              borderWidth="1px"
              borderColor={borderColor}
              p={5}
            >
              <Heading size="sm" color={headingColor} mb={1}>
                Upcoming Live Classes ({classes.length})
              </Heading>
              <Text fontSize="xs" color={lightTextColor} mb={5}>
                Launch video stream rooms
              </Text>

              {isLoadingData ? (
                <Flex justify="center" align="center" minH="200px">
                  <Spinner size="md" color="gray.500" thickness="2px" />
                </Flex>
              ) : classes.length === 0 ? (
                <VStack py={10} spacing={2} color={lightTextColor} textAlign="center">
                  <FiVideo size={32} />
                  <Text fontWeight="medium" fontSize="sm">No live classes scheduled</Text>
                </VStack>
              ) : (
                <VStack spacing={3} align="stretch" maxH="500px" overflowY="auto" pr={1}>
                  {classes.map((cls) => (
                    <Card
                      key={cls._id}
                      p={4}
                      borderRadius="lg"
                      borderWidth="1px"
                      borderColor={borderColor}
                      bg={itemBgColor}
                    >
                      <Flex justify="space-between" align="center">
                        <Box flex={1}>
                          <HStack spacing={2} mb={1}>
                            <Badge variant="outline" colorScheme="gray" px={2} py={0.5} borderRadius="md" fontSize="10px">
                              {cls.course?.title || "Course Session"}
                            </Badge>
                          </HStack>
                          <Heading size="xs" color={headingColor} mb={1}>
                            {cls.title}
                          </Heading>
                          <HStack spacing={1} fontSize="xs" color={lightTextColor}>
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
                        </Box>

                        <Button
                          leftIcon={<FiPlayCircle />}
                          colorScheme="gray"
                          size="sm"
                          borderRadius="md"
                          onClick={() => window.open(`/live-class/${cls.channelName}`, "_blank")}
                        >
                          Start Stream
                        </Button>
                      </Flex>
                    </Card>
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
