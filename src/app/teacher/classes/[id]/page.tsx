"use client";

import {
  Box,
  Heading,
  Text,
  Badge,
  Spinner,
  useToast,
  Button,
  Flex,
  Grid,
  GridItem,
  Card,
  IconButton,
  useDisclosure,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  useColorModeValue,
  HStack,
  VStack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Avatar,
  AvatarGroup,
} from "@chakra-ui/react";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import AssignmentModal from "@/components/AssignmentModal";
import {
  FiEdit,
  FiDownload,
  FiTrash2,
  FiPlus,
  FiUsers,
  FiMessageCircle,
  FiFileText,
  FiCopy,
  FiCheck,
  FiArrowLeft,
  FiCalendar,
} from "react-icons/fi";
import CourseMessages from "@/components/CourseMessages";
import { motion } from "framer-motion";

const MotionBox = motion(Box);

type Assignment = {
  _id: string;
  title: string;
  description: string;
  dueDate: string;
  fileUrl?: string;
  submissions?: Array<unknown>;
};

type Course = {
  _id: string;
  title: string;
  description: string;
  subject: string;
  level: string;
  createdAt: string;
  joinCode: string;
  assignments?: Assignment[];
  students?: Student[];
};

interface Student {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
}

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);
  const [copied, setCopied] = useState(false);
  const toast = useToast();
  const router = useRouter();

  // Modals
  const {
    isOpen: isAssignmentModalOpen,
    onOpen: onAssignmentModalOpen,
    onClose: onAssignmentModalClose,
  } = useDisclosure();

  const {
    isOpen: isDeleteAlertOpen,
    onOpen: onDeleteAlertOpen,
    onClose: onDeleteAlertClose,
  } = useDisclosure();

  const cancelRef = useRef<HTMLButtonElement>(null);
  const [refresh, setRefresh] = useState(false);

  // Modern Color Tokens
  const pageBg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.850");
  const headingColor = useColorModeValue("gray.800", "white");
  const textColor = useColorModeValue("gray.600", "gray.300");
  const metaColor = useColorModeValue("gray.500", "gray.400");
  const borderColor = useColorModeValue("gray.150", "gray.750");

  const heroGradient = useColorModeValue(
    "linear-gradient(135deg, #1a365d 0%, #2b6cb0 100%)",
    "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)"
  );

  useEffect(() => {
    if (id) {
      fetch(`/api/courses/${id}`)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.json();
        })
        .then((data) => setCourse(data))
        .catch((error: unknown) => {
          console.error("Error fetching course:", error);
          toast({
            title: "Error fetching course details",
            description: "Failed to load class information.",
            status: "error",
            duration: 4000,
            isClosable: true,
          });
        });
    }
  }, [id, toast, refresh]);

  const handleEditAssignment = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    onAssignmentModalOpen();
  };

  const handleCreateAssignment = () => {
    setSelectedAssignment(null);
    onAssignmentModalOpen();
  };

  const handleDeleteAssignment = async () => {
    if (!selectedAssignment) return;

    try {
      const res = await fetch(`/api/assignments/${selectedAssignment._id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete assignment");

      toast({
        title: "Assignment deleted",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setRefresh((prev) => !prev);
    } catch {
      toast({
        title: "Error deleting assignment",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      onDeleteAlertClose();
      setSelectedAssignment(null);
    }
  };

  const handleDownloadAssignment = async (assignmentId: string) => {
    try {
      const targetId = assignmentId || selectedAssignment?._id;
      const res = await fetch(`/api/assignments/${targetId}/download`);
      if (!res.ok) throw new Error("Failed to download submissions");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      let filename =
        res.headers.get("Content-Disposition")?.split("filename=")[1] ||
        "submissions.zip";
      filename = filename.replace(/"/g, "").replace(/_/g, " ");
      a.href = url;
      a.download = filename;

      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      toast({
        title: "Download failed",
        status: "error",
      });
    }
  };

  const copyJoinCode = () => {
    if (course?.joinCode) {
      navigator.clipboard.writeText(course.joinCode);
      setCopied(true);
      toast({
        title: "Join Code copied!",
        status: "success",
        duration: 2000,
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!course) {
    return (
      <Flex justify="center" align="center" minH="80vh" bg={pageBg}>
        <VStack spacing={4}>
          <Spinner size="xl" thickness="4px" color="blue.500" />
          <Text color={metaColor}>Loading class workspace...</Text>
        </VStack>
      </Flex>
    );
  }

  return (
    <Box p={{ base: 4, md: 8 }} maxW="7xl" mx="auto" bg={pageBg} minH="100vh">
      {/* Back Button */}
      <Button
        leftIcon={<FiArrowLeft />}
        variant="ghost"
        mb={4}
        onClick={() => router.push("/teacher/classes")}
        borderRadius="xl"
      >
        Back to Classes
      </Button>

      {/* Hero Header Banner */}
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
                {course.subject || "General"}
              </Badge>
              <Badge colorScheme="blue" px={3} py={1} borderRadius="full" fontSize="xs">
                {course.level || "Beginner"}
              </Badge>
            </HStack>

            <Heading size="xl" fontWeight="extrabold">
              {course.title}
            </Heading>

            <Text color="gray.200" fontSize="sm" maxW="3xl">
              {course.description || "No description provided."}
            </Text>
          </VStack>

          {/* Right Action Box: Join Code & Edit */}
          <HStack spacing={4} align="stretch" w={{ base: "100%", md: "auto" }}>
            <Box
              bg="whiteAlpha.200"
              backdropFilter="blur(8px)"
              p={4}
              borderRadius="2xl"
              borderWidth="1px"
              borderColor="whiteAlpha.300"
              textAlign="center"
              flex={1}
            >
              <Text fontSize="xs" color="gray.300" textTransform="uppercase" fontWeight="bold">
                Student Join Code
              </Text>
              <HStack justify="center" spacing={2} mt={1}>
                <Text fontSize="2xl" fontWeight="extrabold" letterSpacing="1.5px">
                  {course.joinCode}
                </Text>
                <IconButton
                  aria-label="Copy Join Code"
                  icon={copied ? <FiCheck color="#68d391" /> : <FiCopy />}
                  size="sm"
                  variant="ghost"
                  color="white"
                  _hover={{ bg: "whiteAlpha.300" }}
                  onClick={copyJoinCode}
                />
              </HStack>
            </Box>

            <IconButton
              aria-label="Edit Course"
              icon={<FiEdit />}
              size="lg"
              colorScheme="whiteAlpha"
              variant="solid"
              borderRadius="2xl"
              onClick={() => router.push(`/teacher/classes/${id}/edit`)}
            />
          </HStack>
        </Flex>
      </MotionBox>

      {/* Main Tabbed Interface */}
      <Tabs variant="soft-rounded" colorScheme="blue">
        <TabList mb={6} overflowX="auto" pb={2} gap={2}>
          <Tab borderRadius="xl" fontWeight="bold" fontSize="sm">
            <HStack spacing={2}>
              <FiMessageCircle />
              <Text>Announcements & Feed</Text>
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
              <FiUsers />
              <Text>Roster ({course.students?.length || 0})</Text>
            </HStack>
          </Tab>
        </TabList>

        <TabPanels>
          {/* TAB 1: Stream / Announcements */}
          <TabPanel p={0}>
            <Grid templateColumns={{ base: "1fr", lg: "3fr 1fr" }} gap={6}>
              <GridItem>
                <CourseMessages courseId={course._id} />
              </GridItem>

              {/* Sidebar Quick Info */}
              <GridItem>
                <VStack spacing={6} align="stretch">
                  <Card bg={cardBg} borderRadius="2xl" borderWidth="1px" borderColor={borderColor} p={5}>
                    <Heading size="xs" textTransform="uppercase" color="gray.500" mb={3}>
                      Upcoming Due Dates
                    </Heading>
                    {course.assignments && course.assignments.length > 0 ? (
                      <VStack align="stretch" spacing={3}>
                        {course.assignments.slice(0, 3).map((asg) => (
                          <Box key={asg._id} p={3} bg={pageBg} borderRadius="xl">
                            <Text fontWeight="semibold" fontSize="sm" noOfLines={1}>
                              {asg.title}
                            </Text>
                            <HStack spacing={1.5} fontSize="xs" color="gray.500" mt={1}>
                              <FiCalendar />
                              <Text>
                                {new Date(asg.dueDate).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </Text>
                            </HStack>
                          </Box>
                        ))}
                      </VStack>
                    ) : (
                      <Text fontSize="xs" color="gray.500">
                        No upcoming assignment deadlines.
                      </Text>
                    )}
                  </Card>

                  <Card bg={cardBg} borderRadius="2xl" borderWidth="1px" borderColor={borderColor} p={5}>
                    <Heading size="xs" textTransform="uppercase" color="gray.500" mb={3}>
                      Class Roster Summary
                    </Heading>
                    <HStack spacing={3}>
                      <AvatarGroup size="sm" max={4}>
                        {course.students?.map((st) => (
                          <Avatar key={st._id} name={st.name} src={st.avatar} />
                        ))}
                      </AvatarGroup>
                      <Text fontSize="xs" fontWeight="semibold" color={textColor}>
                        {course.students?.length || 0} Total Enrolled
                      </Text>
                    </HStack>
                  </Card>
                </VStack>
              </GridItem>
            </Grid>
          </TabPanel>

          {/* TAB 2: Assignments */}
          <TabPanel p={0}>
            <Card bg={cardBg} borderRadius="2xl" borderWidth="1px" borderColor={borderColor} p={{ base: 4, md: 6 }}>
              <Flex justify="space-between" align="center" mb={6}>
                <Box>
                  <Heading size="md" color={headingColor}>
                    Class Assignments
                  </Heading>
                  <Text fontSize="xs" color={metaColor}>
                    Create, edit, and download student submissions
                  </Text>
                </Box>
                <Button
                  leftIcon={<FiPlus />}
                  colorScheme="blue"
                  borderRadius="xl"
                  onClick={handleCreateAssignment}
                >
                  New Assignment
                </Button>
              </Flex>

              {course.assignments && course.assignments.length > 0 ? (
                <VStack spacing={4} align="stretch">
                  {course.assignments.map((assignment) => (
                    <Card
                      key={assignment._id}
                      p={5}
                      borderRadius="xl"
                      borderWidth="1px"
                      borderColor={borderColor}
                      bg={pageBg}
                      boxShadow="sm"
                    >
                      <Flex justify="space-between" align="flex-start">
                        <Box flex={1}>
                          <HStack spacing={2} mb={1}>
                            <Heading size="sm" color={headingColor}>
                              {assignment.title}
                            </Heading>
                            {assignment.fileUrl && (
                              <Badge colorScheme="green" fontSize="9px">
                                Resource Included
                              </Badge>
                            )}
                          </HStack>
                          <Text fontSize="xs" color={textColor} noOfLines={2} mb={2}>
                            {assignment.description || "No specific instructions provided."}
                          </Text>
                          <HStack spacing={4} fontSize="xs" color={metaColor}>
                            <HStack spacing={1}>
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
                          </HStack>
                        </Box>

                        <HStack spacing={2}>
                          <Button
                            size="sm"
                            leftIcon={<FiDownload />}
                            variant="outline"
                            colorScheme="blue"
                            borderRadius="lg"
                            onClick={() => handleDownloadAssignment(assignment._id)}
                          >
                            Submissions
                          </Button>
                          <IconButton
                            aria-label="Edit"
                            icon={<FiEdit />}
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditAssignment(assignment)}
                          />
                          <IconButton
                            aria-label="Delete"
                            icon={<FiTrash2 />}
                            size="sm"
                            colorScheme="red"
                            variant="ghost"
                            onClick={() => {
                              setSelectedAssignment(assignment);
                              onDeleteAlertOpen();
                            }}
                          />
                        </HStack>
                      </Flex>
                    </Card>
                  ))}
                </VStack>
              ) : (
                <Box textAlign="center" py={12}>
                  <VStack spacing={3}>
                    <FiFileText size={36} color="#a0aec0" />
                    <Text fontSize="md" fontWeight="semibold" color={headingColor}>
                      No assignments published yet
                    </Text>
                    <Text fontSize="xs" color={metaColor}>
                      Click &quot;New Assignment&quot; to post a homework or project task.
                    </Text>
                  </VStack>
                </Box>
              )}
            </Card>
          </TabPanel>

          {/* TAB 3: Students Roster */}
          <TabPanel p={0}>
            <Card bg={cardBg} borderRadius="2xl" borderWidth="1px" borderColor={borderColor} p={{ base: 4, md: 6 }}>
              <Heading size="md" color={headingColor} mb={1}>
                Enrolled Students Roster
              </Heading>
              <Text fontSize="xs" color={metaColor} mb={6}>
                Students currently registered in this class
              </Text>

              {course.students && course.students.length > 0 ? (
                <Grid templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }} gap={4}>
                  {course.students.map((student) => (
                    <Card key={student._id} p={4} borderRadius="xl" borderWidth="1px" borderColor={borderColor} bg={pageBg}>
                      <HStack spacing={3}>
                        <Avatar name={student.name} src={student.avatar} size="md" />
                        <Box overflow="hidden">
                          <Text fontWeight="bold" fontSize="sm" noOfLines={1} color={headingColor}>
                            {student.name}
                          </Text>
                          <Text fontSize="xs" color={metaColor} noOfLines={1}>
                            {student.email}
                          </Text>
                        </Box>
                      </HStack>
                    </Card>
                  ))}
                </Grid>
              ) : (
                <Box textAlign="center" py={12}>
                  <VStack spacing={3}>
                    <FiUsers size={36} color="#a0aec0" />
                    <Text fontSize="md" fontWeight="semibold" color={headingColor}>
                      No students enrolled yet
                    </Text>
                    <Text fontSize="xs" color={metaColor}>
                      Share join code <Badge colorScheme="blue">{course.joinCode}</Badge> with students to enroll them.
                    </Text>
                  </VStack>
                </Box>
              )}
            </Card>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Assignment Modal Component */}
      <AssignmentModal
        isOpen={isAssignmentModalOpen}
        onClose={onAssignmentModalClose}
        courseId={course._id}
        onCreated={() => setRefresh((prev) => !prev)}
        assignmentData={selectedAssignment || undefined}
      />

      {/* Delete Assignment Confirmation Alert */}
      <AlertDialog
        isOpen={isDeleteAlertOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteAlertClose}
        isCentered
      >
        <AlertDialogOverlay backdropFilter="blur(4px)" bg="blackAlpha.600">
          <AlertDialogContent borderRadius="2xl" bg={cardBg}>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Assignment
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to delete &quot;{selectedAssignment?.title}&quot;? All student submissions for this assignment will also be removed.
            </AlertDialogBody>
            <AlertDialogFooter gap={3}>
              <Button ref={cancelRef} onClick={onDeleteAlertClose} variant="ghost" borderRadius="xl">
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDeleteAssignment} borderRadius="xl">
                Delete Assignment
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}
