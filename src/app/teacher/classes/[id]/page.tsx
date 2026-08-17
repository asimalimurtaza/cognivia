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

  // Minimal Color Tokens
  const pageBg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const headingColor = useColorModeValue("gray.800", "white");
  const textColor = useColorModeValue("gray.600", "gray.300");
  const metaColor = useColorModeValue("gray.500", "gray.400");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const btnBg = useColorModeValue("gray.900", "white");
  const btnColor = useColorModeValue("white", "gray.900");
  const btnHoverBg = useColorModeValue("gray.700", "white");

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
        <VStack spacing={3}>
          <Spinner size="md" thickness="2px" color="gray.500" />
          <Text fontSize="xs" color={metaColor}>Loading class workspace...</Text>
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
        size="sm"
        mb={4}
        onClick={() => router.push("/teacher/classes")}
        borderRadius="md"
      >
        Back to Classes
      </Button>

      {/* Minimal Header Banner */}
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
                {course.subject || "General"}
              </Badge>
              <Badge variant="subtle" colorScheme="gray" px={2} py={0.5} borderRadius="md" fontSize="10px">
                {course.level || "Beginner"}
              </Badge>
            </HStack>

            <Heading size="lg" fontWeight="bold" color={headingColor}>
              {course.title}
            </Heading>

            <Text color={textColor} fontSize="xs" maxW="3xl">
              {course.description || "No description provided."}
            </Text>
          </VStack>

          {/* Right Action Box: Join Code & Edit */}
          <HStack spacing={3} align="stretch">
            <Box
              bg={pageBg}
              p={3}
              borderRadius="lg"
              borderWidth="1px"
              borderColor={borderColor}
              textAlign="center"
            >
              <Text fontSize="10px" color={metaColor} textTransform="uppercase" fontWeight="medium">
                Class Join Code
              </Text>
              <HStack justify="center" spacing={2} mt={0.5}>
                <Text fontSize="md" fontWeight="bold" letterSpacing="1px">
                  {course.joinCode}
                </Text>
                <IconButton
                  aria-label="Copy Join Code"
                  icon={copied ? <FiCheck /> : <FiCopy />}
                  size="xs"
                  variant="ghost"
                  onClick={copyJoinCode}
                />
              </HStack>
            </Box>

            <IconButton
              aria-label="Edit Course"
              icon={<FiEdit />}
              size="md"
              variant="outline"
              borderRadius="lg"
              onClick={() => router.push(`/teacher/classes/${id}/edit`)}
            />
          </HStack>
        </Flex>
      </Card>

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
                <VStack spacing={4} align="stretch">
                  <Card bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor} p={4}>
                    <Heading size="xs" textTransform="uppercase" color={metaColor} mb={3}>
                      Upcoming Deadlines
                    </Heading>
                    {course.assignments && course.assignments.length > 0 ? (
                      <VStack align="stretch" spacing={2.5}>
                        {course.assignments.slice(0, 3).map((asg) => (
                          <Box key={asg._id} p={2.5} bg={pageBg} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
                            <Text fontWeight="medium" fontSize="xs" noOfLines={1}>
                              {asg.title}
                            </Text>
                            <HStack spacing={1} fontSize="10px" color={metaColor} mt={0.5}>
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
                      <Text fontSize="xs" color={metaColor}>
                        No upcoming assignment deadlines.
                      </Text>
                    )}
                  </Card>

                  <Card bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor} p={4}>
                    <Heading size="xs" textTransform="uppercase" color={metaColor} mb={3}>
                      Roster Summary
                    </Heading>
                    <HStack spacing={3}>
                      <AvatarGroup size="xs" max={4}>
                        {course.students?.map((st) => (
                          <Avatar key={st._id} name={st.name} src={st.avatar} />
                        ))}
                      </AvatarGroup>
                      <Text fontSize="xs" color={textColor}>
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
            <Card bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor} p={{ base: 4, md: 5 }}>
              <Flex justify="space-between" align="center" mb={5}>
                <Box>
                  <Heading size="sm" color={headingColor}>
                    Class Assignments
                  </Heading>
                  <Text fontSize="xs" color={metaColor}>
                    Manage and download student submissions
                  </Text>
                </Box>
                <Button
                  leftIcon={<FiPlus />}
                  size="sm"
                  colorScheme="gray"
                  bg={btnBg}
                  color={btnColor}
                  _hover={{ bg: btnHoverBg }}
                  borderRadius="md"
                  onClick={handleCreateAssignment}
                >
                  New Assignment
                </Button>
              </Flex>

              {course.assignments && course.assignments.length > 0 ? (
                <VStack spacing={3} align="stretch">
                  {course.assignments.map((assignment) => (
                    <Card
                      key={assignment._id}
                      p={4}
                      borderRadius="lg"
                      borderWidth="1px"
                      borderColor={borderColor}
                      bg={pageBg}
                    >
                      <Flex justify="space-between" align="flex-start">
                        <Box flex={1}>
                          <HStack spacing={2} mb={1}>
                            <Heading size="xs" color={headingColor}>
                              {assignment.title}
                            </Heading>
                            {assignment.fileUrl && (
                              <Badge variant="subtle" colorScheme="gray" fontSize="9px">
                                Resource Included
                              </Badge>
                            )}
                          </HStack>
                          <Text fontSize="xs" color={textColor} noOfLines={2} mb={2}>
                            {assignment.description || "No specific instructions provided."}
                          </Text>
                          <HStack spacing={1} fontSize="xs" color={metaColor}>
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

                        <HStack spacing={1.5}>
                          <Button
                            size="xs"
                            leftIcon={<FiDownload />}
                            variant="outline"
                            borderRadius="md"
                            onClick={() => handleDownloadAssignment(assignment._id)}
                          >
                            Submissions
                          </Button>
                          <IconButton
                            aria-label="Edit"
                            icon={<FiEdit />}
                            size="xs"
                            variant="ghost"
                            onClick={() => handleEditAssignment(assignment)}
                          />
                          <IconButton
                            aria-label="Delete"
                            icon={<FiTrash2 />}
                            size="xs"
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
                <Box textAlign="center" py={10}>
                  <VStack spacing={2}>
                    <FiFileText size={28} color="#a0aec0" />
                    <Text fontSize="sm" fontWeight="medium" color={headingColor}>
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
            <Card bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor} p={{ base: 4, md: 5 }}>
              <Heading size="sm" color={headingColor} mb={0.5}>
                Enrolled Students Roster
              </Heading>
              <Text fontSize="xs" color={metaColor} mb={5}>
                Students currently registered in this class
              </Text>

              {course.students && course.students.length > 0 ? (
                <Grid templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }} gap={3}>
                  {course.students.map((student) => (
                    <Card key={student._id} p={3.5} borderRadius="lg" borderWidth="1px" borderColor={borderColor} bg={pageBg}>
                      <HStack spacing={3}>
                        <Avatar name={student.name} src={student.avatar} size="sm" />
                        <Box overflow="hidden">
                          <Text fontWeight="semibold" fontSize="xs" noOfLines={1} color={headingColor}>
                            {student.name}
                          </Text>
                          <Text fontSize="10px" color={metaColor} noOfLines={1}>
                            {student.email}
                          </Text>
                        </Box>
                      </HStack>
                    </Card>
                  ))}
                </Grid>
              ) : (
                <Box textAlign="center" py={10}>
                  <VStack spacing={2}>
                    <FiUsers size={28} color="#a0aec0" />
                    <Text fontSize="sm" fontWeight="medium" color={headingColor}>
                      No students enrolled yet
                    </Text>
                    <Text fontSize="xs" color={metaColor}>
                      Share join code <Badge variant="outline">{course.joinCode}</Badge> with students to enroll them.
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
        <AlertDialogOverlay bg="blackAlpha.400">
          <AlertDialogContent borderRadius="xl" bg={cardBg}>
            <AlertDialogHeader fontSize="md" fontWeight="semibold">
              Delete Assignment
            </AlertDialogHeader>
            <AlertDialogBody fontSize="xs" color={metaColor}>
              Are you sure you want to delete &quot;{selectedAssignment?.title}&quot;? All student submissions for this assignment will also be removed.
            </AlertDialogBody>
            <AlertDialogFooter gap={2}>
              <Button ref={cancelRef} onClick={onDeleteAlertClose} variant="ghost" size="sm" borderRadius="md">
                Cancel
              </Button>
              <Button colorScheme="red" size="sm" onClick={handleDeleteAssignment} borderRadius="md">
                Delete Assignment
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}
