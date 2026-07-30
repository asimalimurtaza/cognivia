"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Heading,
  Text,
  Button,
  Flex,
  useToast,
  useDisclosure,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Spinner,
  useColorModeValue,
  Badge,
  HStack,
  VStack,
  Card,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from "@chakra-ui/react";
import {
  FaRegFileAlt,
  FaVideo,
} from "react-icons/fa";
import {
  FiArrowLeft,
  FiLogOut,
  FiCalendar,
  FiDownload,
  FiPlayCircle,
  FiMessageCircle,
  FiFileText,
} from "react-icons/fi";
import StudentCourseMessages from "@/components/StudentCourseMessages";
import { motion } from "framer-motion";

const MotionBox = motion(Box);

interface Course {
  _id: string;
  title: string;
  description: string;
  subject?: string;
  level?: string;
  liveClasses?: string[];
  createdAt?: string;
  messages?: string[];
  assignments?: {
    _id: string;
    title: string;
    description?: string;
    dueDate: string;
    fileUrl?: string;
  }[];
}

interface LiveClass {
  _id: string;
  title: string;
  scheduledAt: string;
  channelName: string;
}

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const [isUnenrolling, setIsUnenrolling] = useState(false);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);

  // Color Mode Tokens
  const pageBg = useColorModeValue("gray.50", "gray.900");
  const headingColor = useColorModeValue("gray.800", "white");
  const descriptionColor = useColorModeValue("gray.600", "gray.300");
  const cardBg = useColorModeValue("white", "gray.850");
  const itemBg = useColorModeValue("gray.50", "gray.800");
  const borderColor = useColorModeValue("gray.150", "gray.750");

  const heroGradient = useColorModeValue(
    "linear-gradient(135deg, #1e293b 0%, #3b82f6 100%)",
    "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)"
  );

  useEffect(() => {
    const fetchCourse = async () => {
      if (!id) return;
      setIsLoadingContent(true);
      try {
        const res = await fetch(`/api/courses/${id}`);
        if (!res.ok) throw new Error("Failed to fetch course data.");
        const data = await res.json();
        setCourse(data);

        if (data.liveClasses && data.liveClasses.length > 0) {
          const liveClassPromises = data.liveClasses.map(
            async (lcId: string) => {
              const lcRes = await fetch(`/api/live-classes/${lcId}`);
              if (!lcRes.ok) return null;
              return await lcRes.json();
            }
          );
          const liveClassDetails = await Promise.all(liveClassPromises);
          setLiveClasses(liveClassDetails.filter(Boolean));
        } else {
          setLiveClasses([]);
        }
      } catch (err: unknown) {
        const error = err as Error;
        console.error("Failed to fetch course or live classes:", error);
        toast({
          title: "Error loading course",
          description: error.message || "Could not retrieve course details.",
          status: "error",
          duration: 4000,
          isClosable: true,
        });
      } finally {
        setIsLoadingContent(false);
      }
    };

    fetchCourse();
  }, [id, toast]);

  const handleUnenroll = async () => {
    setIsUnenrolling(true);
    try {
      const res = await fetch(`/api/courses/${id}/unenroll`, {
        method: "POST",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to unenroll");
      }

      toast({
        title: "Unenrolled successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      router.push("/dashboard/courses");
    } catch (err: unknown) {
      const error = err as Error;
      toast({
        title: "Error",
        description: error.message || "Could not unenroll from course.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsUnenrolling(false);
      onClose();
    }
  };

  if (isLoadingContent) {
    return (
      <Flex justify="center" align="center" minH="80vh" bg={pageBg}>
        <VStack spacing={3}>
          <Spinner size="xl" color="blue.500" thickness="4px" />
          <Text color={descriptionColor}>Loading course workspace...</Text>
        </VStack>
      </Flex>
    );
  }

  if (!course) {
    return (
      <Flex justify="center" align="center" minH="80vh" bg={pageBg} direction="column" p={8}>
        <Heading size="lg" color={headingColor} mb={4}>
          Course Not Found
        </Heading>
        <Text color={descriptionColor} mb={6}>
          The course you are looking for does not exist or you are not enrolled.
        </Text>
        <Button colorScheme="blue" onClick={() => router.push("/dashboard/courses")} borderRadius="xl">
          Back to My Classes
        </Button>
      </Flex>
    );
  }

  return (
    <Box p={{ base: 4, md: 8 }} maxW="7xl" mx="auto" bg={pageBg} minH="100vh">
      {/* Navigation & Back */}
      <Button
        leftIcon={<FiArrowLeft />}
        variant="ghost"
        mb={4}
        onClick={() => router.push("/dashboard/courses")}
        borderRadius="xl"
      >
        Back to My Classes
      </Button>

      {/* Course Hero Banner */}
      <MotionBox
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        bg={heroGradient}
        borderRadius="3xl"
        p={{ base: 6, md: 8 }}
        color="white"
        boxShadow="xl"
        mb={8}
      >
        <Flex
          direction={{ base: "column", md: "row" }}
          justify="space-between"
          align={{ base: "flex-start", md: "center" }}
          gap={6}
        >
          <VStack align="flex-start" spacing={3} flex={1}>
            <HStack spacing={2}>
              <Badge bg="whiteAlpha.300" color="white" px={3} py={1} borderRadius="full" fontSize="xs">
                {course.subject || "Course Workspace"}
              </Badge>
              {course.level && (
                <Badge colorScheme="blue" px={3} py={1} borderRadius="full" fontSize="xs">
                  {course.level}
                </Badge>
              )}
            </HStack>

            <Heading size="xl" fontWeight="extrabold">
              {course.title}
            </Heading>

            <Text color="gray.200" fontSize="sm" maxW="3xl">
              {course.description || "Welcome to your class workspace."}
            </Text>
          </VStack>

          <Button
            leftIcon={<FiLogOut />}
            colorScheme="red"
            variant="solid"
            borderRadius="xl"
            onClick={onOpen}
            isLoading={isUnenrolling}
            px={6}
          >
            Unenroll
          </Button>
        </Flex>
      </MotionBox>

      {/* Active Live Class Alert Banner */}
      {liveClasses.length > 0 && (
        <Card
          mb={8}
          bg="linear-gradient(135deg, #15803d 0%, #22c55e 100%)"
          color="white"
          borderRadius="2xl"
          p={5}
          boxShadow="lg"
        >
          <Flex direction={{ base: "column", sm: "row" }} justify="space-between" align="center" gap={4}>
            <HStack spacing={4}>
              <Flex w={12} h={12} bg="whiteAlpha.300" borderRadius="full" align="center" justify="center">
                <FaVideo size={20} />
              </Flex>
              <Box>
                <HStack spacing={2}>
                  <Badge colorScheme="red" variant="solid" fontSize="10px" borderRadius="full" px={2}>
                    LIVE NOW
                  </Badge>
                  <Heading size="sm" color="white">
                    {liveClasses[0].title}
                  </Heading>
                </HStack>
                <Text fontSize="xs" opacity={0.9} mt={1}>
                  Instructor has launched a live video session
                </Text>
              </Box>
            </HStack>

            <Button
              leftIcon={<FiPlayCircle />}
              colorScheme="whiteAlpha"
              bg="white"
              color="green.800"
              _hover={{ bg: "gray.100" }}
              borderRadius="xl"
              onClick={() => window.open(`/live-class/${liveClasses[0].channelName}`, "_blank")}
            >
              Join Live Class
            </Button>
          </Flex>
        </Card>
      )}

      {/* Main Tabbed Interface */}
      <Tabs variant="soft-rounded" colorScheme="blue">
        <TabList mb={6} overflowX="auto" pb={2} gap={2}>
          <Tab borderRadius="xl" fontWeight="bold" fontSize="sm">
            <HStack spacing={2}>
              <FiMessageCircle />
              <Text>Announcements & Stream</Text>
            </HStack>
          </Tab>
          <Tab borderRadius="xl" fontWeight="bold" fontSize="sm">
            <HStack spacing={2}>
              <FiFileText />
              <Text>Assignments ({course.assignments?.length || 0})</Text>
            </HStack>
          </Tab>
          <Tab borderRadius="xl" fontWeight="bold" fontSize="sm">
            <HStack spacing={2}>
              <FaVideo />
              <Text>Live Class Sessions ({liveClasses.length})</Text>
            </HStack>
          </Tab>
        </TabList>

        <TabPanels>
          {/* TAB 1: Stream / Messages */}
          <TabPanel p={0}>
            <StudentCourseMessages courseId={course._id} />
          </TabPanel>

          {/* TAB 2: Assignments */}
          <TabPanel p={0}>
            <Card bg={cardBg} borderRadius="2xl" borderWidth="1px" borderColor={borderColor} p={{ base: 4, md: 6 }}>
              <Heading size="md" color={headingColor} mb={1}>
                Assignments & Homework
              </Heading>
              <Text fontSize="xs" color={descriptionColor} mb={6}>
                Download instructions and check deadline dates
              </Text>

              {course.assignments && course.assignments.length > 0 ? (
                <VStack spacing={4} align="stretch">
                  {course.assignments.map((assignment) => (
                    <Card
                      key={assignment._id}
                      p={5}
                      borderRadius="xl"
                      borderWidth="1px"
                      borderColor={borderColor}
                      bg={itemBg}
                      boxShadow="sm"
                    >
                      <Flex justify="space-between" align="center">
                        <Box flex={1}>
                          <Heading size="sm" color={headingColor} mb={1}>
                            {assignment.title}
                          </Heading>
                          <Text fontSize="xs" color={descriptionColor} noOfLines={2} mb={2}>
                            {assignment.description || "No description provided."}
                          </Text>
                          <HStack spacing={1} fontSize="xs" color="gray.500">
                            <FiCalendar />
                            <Text>
                              Due:{" "}
                              {new Date(assignment.dueDate).toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              })}
                            </Text>
                          </HStack>
                        </Box>

                        {assignment.fileUrl && (
                          <Button
                            leftIcon={<FiDownload />}
                            size="sm"
                            colorScheme="blue"
                            borderRadius="lg"
                            onClick={() => window.open(assignment.fileUrl, "_blank")}
                          >
                            Download Resource
                          </Button>
                        )}
                      </Flex>
                    </Card>
                  ))}
                </VStack>
              ) : (
                <Box textAlign="center" py={12}>
                  <VStack spacing={3}>
                    <FaRegFileAlt size={36} color="#a0aec0" />
                    <Text fontSize="md" fontWeight="semibold" color={headingColor}>
                      No assignments currently assigned
                    </Text>
                    <Text fontSize="xs" color={descriptionColor}>
                      Your teacher hasn&apos;t posted any assignments yet.
                    </Text>
                  </VStack>
                </Box>
              )}
            </Card>
          </TabPanel>

          {/* TAB 3: Live Class Sessions */}
          <TabPanel p={0}>
            <Card bg={cardBg} borderRadius="2xl" borderWidth="1px" borderColor={borderColor} p={{ base: 4, md: 6 }}>
              <Heading size="md" color={headingColor} mb={1}>
                Live Video Class Sessions
              </Heading>
              <Text fontSize="xs" color={descriptionColor} mb={6}>
                Scheduled live streams and video meeting rooms for this course
              </Text>

              {liveClasses.length > 0 ? (
                <VStack spacing={4} align="stretch">
                  {liveClasses.map((lc) => (
                    <Card
                      key={lc._id}
                      p={5}
                      borderRadius="xl"
                      borderWidth="1px"
                      borderColor={borderColor}
                      bg={itemBg}
                    >
                      <Flex justify="space-between" align="center">
                        <Box flex={1}>
                          <Heading size="sm" color={headingColor} mb={1}>
                            {lc.title}
                          </Heading>
                          <HStack spacing={1} fontSize="xs" color="gray.500">
                            <FiCalendar />
                            <Text>
                              Scheduled:{" "}
                              {new Date(lc.scheduledAt).toLocaleString("en-US", {
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
                          colorScheme="green"
                          size="md"
                          borderRadius="xl"
                          onClick={() => window.open(`/live-class/${lc.channelName}`, "_blank")}
                        >
                          Join Room
                        </Button>
                      </Flex>
                    </Card>
                  ))}
                </VStack>
              ) : (
                <Box textAlign="center" py={12}>
                  <VStack spacing={3}>
                    <FaVideo size={36} color="#a0aec0" />
                    <Text fontSize="md" fontWeight="semibold" color={headingColor}>
                      No live sessions scheduled
                    </Text>
                    <Text fontSize="xs" color={descriptionColor}>
                      Live class notifications will appear here when scheduled by your teacher.
                    </Text>
                  </VStack>
                </Box>
              )}
            </Card>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Unenroll Confirmation Alert */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
        isCentered
      >
        <AlertDialogOverlay backdropFilter="blur(4px)" bg="blackAlpha.600">
          <AlertDialogContent borderRadius="2xl" bg={cardBg}>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Unenroll from Class
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to unenroll from &quot;{course.title}&quot;? You will lose access to class announcements and materials.
            </AlertDialogBody>
            <AlertDialogFooter gap={3}>
              <Button ref={cancelRef} onClick={onClose} variant="ghost" borderRadius="xl">
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={handleUnenroll}
                isLoading={isUnenrolling}
                borderRadius="xl"
              >
                Unenroll
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}
