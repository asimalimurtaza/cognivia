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

  // Minimal Color Tokens
  const pageBg = useColorModeValue("gray.50", "gray.900");
  const headingColor = useColorModeValue("gray.800", "white");
  const descriptionColor = useColorModeValue("gray.600", "gray.300");
  const cardBg = useColorModeValue("white", "gray.800");
  const itemBg = useColorModeValue("gray.50", "gray.900");
  const borderColor = useColorModeValue("gray.200", "gray.700");

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
          <Spinner size="md" color="gray.500" thickness="2px" />
          <Text fontSize="xs" color={descriptionColor}>Loading workspace...</Text>
        </VStack>
      </Flex>
    );
  }

  if (!course) {
    return (
      <Flex justify="center" align="center" minH="80vh" bg={pageBg} direction="column" p={8}>
        <Heading size="md" color={headingColor} mb={2}>
          Course Not Found
        </Heading>
        <Text fontSize="xs" color={descriptionColor} mb={4}>
          The course you are looking for does not exist or you are not enrolled.
        </Text>
        <Button size="sm" colorScheme="gray" onClick={() => router.push("/dashboard/courses")} borderRadius="md">
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
        size="sm"
        mb={4}
        onClick={() => router.push("/dashboard/courses")}
        borderRadius="md"
      >
        Back to My Classes
      </Button>

      {/* Course Minimal Header Banner */}
      <Card
        bg={cardBg}
        borderRadius="xl"
        p={{ base: 5, md: 6 }}
        borderWidth="1px"
        borderColor={borderColor}
        boxShadow="none"
        mb={6}
      >
        <Flex
          direction={{ base: "column", md: "row" }}
          justify="space-between"
          align={{ base: "flex-start", md: "center" }}
          gap={4}
        >
          <VStack align="flex-start" spacing={2} flex={1}>
            <HStack spacing={2}>
              <Badge variant="outline" colorScheme="gray" px={2} py={0.5} borderRadius="md" fontSize="10px">
                {course.subject || "Course Workspace"}
              </Badge>
              {course.level && (
                <Badge variant="subtle" colorScheme="gray" px={2} py={0.5} borderRadius="md" fontSize="10px">
                  {course.level}
                </Badge>
              )}
            </HStack>

            <Heading size="lg" fontWeight="bold" color={headingColor}>
              {course.title}
            </Heading>

            <Text color={descriptionColor} fontSize="xs" maxW="3xl">
              {course.description || "Welcome to your class workspace."}
            </Text>
          </VStack>

          <Button
            leftIcon={<FiLogOut />}
            colorScheme="red"
            variant="ghost"
            size="sm"
            borderRadius="md"
            onClick={onOpen}
            isLoading={isUnenrolling}
            px={4}
          >
            Unenroll
          </Button>
        </Flex>
      </Card>

      {/* Active Live Class Alert Banner */}
      {liveClasses.length > 0 && (
        <Card
          mb={6}
          bg={cardBg}
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="xl"
          p={4}
        >
          <Flex direction={{ base: "column", sm: "row" }} justify="space-between" align="center" gap={3}>
            <HStack spacing={3}>
              <Box p={2} bg="gray.100" _dark={{ bg: "gray.700" }} borderRadius="md">
                <FaVideo size={16} color="#4a5568" />
              </Box>
              <Box>
                <HStack spacing={2}>
                  <Badge colorScheme="red" fontSize="9px" px={1.5}>
                    LIVE NOW
                  </Badge>
                  <Text fontWeight="semibold" fontSize="xs" color={headingColor}>
                    {liveClasses[0].title}
                  </Text>
                </HStack>
                <Text fontSize="10px" color={descriptionColor} mt={0.5}>
                  Instructor has launched a live video session
                </Text>
              </Box>
            </HStack>

            <Button
              leftIcon={<FiPlayCircle />}
              size="sm"
              colorScheme="gray"
              borderRadius="md"
              onClick={() => window.open(`/live-class/${liveClasses[0].channelName}`, "_blank")}
            >
              Join Live Class
            </Button>
          </Flex>
        </Card>
      )}

      {/* Main Tabbed Interface */}
      <Tabs variant="line" colorScheme="gray">
        <TabList mb={6} overflowX="auto" pb={1} gap={2} borderColor={borderColor}>
          <Tab fontWeight="medium" fontSize="xs">
            <HStack spacing={2}>
              <FiMessageCircle />
              <Text>Announcements & Feed</Text>
            </HStack>
          </Tab>
          <Tab fontWeight="medium" fontSize="xs">
            <HStack spacing={2}>
              <FiFileText />
              <Text>Assignments ({course.assignments?.length || 0})</Text>
            </HStack>
          </Tab>
          <Tab fontWeight="medium" fontSize="xs">
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
            <Card bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor} p={{ base: 4, md: 5 }}>
              <Heading size="sm" color={headingColor} mb={0.5}>
                Assignments & Homework
              </Heading>
              <Text fontSize="xs" color={descriptionColor} mb={5}>
                Download instructions and check deadline dates
              </Text>

              {course.assignments && course.assignments.length > 0 ? (
                <VStack spacing={3} align="stretch">
                  {course.assignments.map((assignment) => (
                    <Card
                      key={assignment._id}
                      p={4}
                      borderRadius="lg"
                      borderWidth="1px"
                      borderColor={borderColor}
                      bg={itemBg}
                    >
                      <Flex justify="space-between" align="center">
                        <Box flex={1}>
                          <Heading size="xs" color={headingColor} mb={1}>
                            {assignment.title}
                          </Heading>
                          <Text fontSize="xs" color={descriptionColor} noOfLines={2} mb={2}>
                            {assignment.description || "No description provided."}
                          </Text>
                          <HStack spacing={1} fontSize="10px" color="gray.500">
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
                            size="xs"
                            variant="outline"
                            borderRadius="md"
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
                <Box textAlign="center" py={10}>
                  <VStack spacing={2}>
                    <FaRegFileAlt size={28} color="#a0aec0" />
                    <Text fontSize="sm" fontWeight="medium" color={headingColor}>
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
            <Card bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor} p={{ base: 4, md: 5 }}>
              <Heading size="sm" color={headingColor} mb={0.5}>
                Live Video Class Sessions
              </Heading>
              <Text fontSize="xs" color={descriptionColor} mb={5}>
                Scheduled live streams and video meeting rooms for this course
              </Text>

              {liveClasses.length > 0 ? (
                <VStack spacing={3} align="stretch">
                  {liveClasses.map((lc) => (
                    <Card
                      key={lc._id}
                      p={4}
                      borderRadius="lg"
                      borderWidth="1px"
                      borderColor={borderColor}
                      bg={itemBg}
                    >
                      <Flex justify="space-between" align="center">
                        <Box flex={1}>
                          <Heading size="xs" color={headingColor} mb={1}>
                            {lc.title}
                          </Heading>
                          <HStack spacing={1} fontSize="10px" color="gray.500">
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
                          size="xs"
                          colorScheme="gray"
                          borderRadius="md"
                          onClick={() => window.open(`/live-class/${lc.channelName}`, "_blank")}
                        >
                          Join Room
                        </Button>
                      </Flex>
                    </Card>
                  ))}
                </VStack>
              ) : (
                <Box textAlign="center" py={10}>
                  <VStack spacing={2}>
                    <FaVideo size={28} color="#a0aec0" />
                    <Text fontSize="sm" fontWeight="medium" color={headingColor}>
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
        <AlertDialogOverlay bg="blackAlpha.400">
          <AlertDialogContent borderRadius="xl" bg={cardBg}>
            <AlertDialogHeader fontSize="md" fontWeight="semibold">
              Unenroll from Class
            </AlertDialogHeader>
            <AlertDialogBody fontSize="xs" color={descriptionColor}>
              Are you sure you want to unenroll from &quot;{course.title}&quot;? You will lose access to class announcements and materials.
            </AlertDialogBody>
            <AlertDialogFooter gap={2}>
              <Button ref={cancelRef} onClick={onClose} variant="ghost" size="sm" borderRadius="md">
                Cancel
              </Button>
              <Button
                colorScheme="red"
                size="sm"
                onClick={handleUnenroll}
                isLoading={isUnenrolling}
                borderRadius="md"
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
