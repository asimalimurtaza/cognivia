"use client";

import {
  Box,
  Heading,
  Text,
  Stack,
  Divider,
  Badge,
  Spinner,
  useToast,
  Button,
  Flex,
  Grid,
  GridItem,
  Card,
  CardHeader,
  CardBody,
  IconButton,
  useDisclosure,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  useColorModeValue,
  Tooltip,
} from "@chakra-ui/react";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import AssignmentModal from "@/components/AssignmentModal";
import {
  FiEdit,
  FiDownload,
  FiTrash2,
  FiMoreVertical,
  FiPlus,
  FiUsers,
  FiInfo,
} from "react-icons/fi";
import CourseMessages from "@/components/CourseMessages";

type Assignment = {
  _id: string;
  title: string;
  description: string;
  dueDate: string;
  fileUrl?: string;
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
}

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);
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

  const primaryColor = useColorModeValue("blue.600", "blue.300");
  const bgColor = useColorModeValue("gray.50", "gray.900");
  const cardBgColor = useColorModeValue("white", "gray.800");
  const headingColor = useColorModeValue("gray.800", "whiteAlpha.900");
  const textColor = useColorModeValue("gray.600", "gray.300");
  const lightTextColor = useColorModeValue("gray.500", "gray.400");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const spinnerColor = useColorModeValue("blue.500", "blue.300");
  const hoverBg = useColorModeValue("gray.100", "gray.700");
  const elevatedCardBg = useColorModeValue("gray.50", "gray.700");

  useEffect(() => {
    if (id) {
      fetch(`/api/courses/${id}`)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => setCourse(data))
        .catch((error: unknown) => {
          console.error("Error fetching course:", error);
          toast({
            title: "Error fetching course details",
            description:
              "Failed to load class information. Please try again later.",
            status: "error",
            duration: 5000,
            isClosable: true,
            position: "top",
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

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete assignment");
      }

      toast({
        title: "Assignment deleted",
        description: "The assignment has been successfully removed.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setRefresh((prev) => !prev);
    } catch (error: unknown) {
      const err = error as Error;
      toast({
        title: "Error deleting assignment",
        description: err.message || "Please try again later.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      onDeleteAlertClose();
      setSelectedAssignment(null);
    }
  };

  const handleDownloadAssignment = async (assignmentId: string) => {
    try {
      const id = assignmentId || selectedAssignment?._id;
      const res = await fetch(`/api/assignments/${id}/download`);
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
      alert("Download failed");
    }
  };

  if (!course) {
    return (
      <Flex
        justifyContent="center"
        alignItems="center"
        minH="80vh"
        bg={bgColor}
      >
        <Spinner size="xl" thickness="4px" color={spinnerColor} />
      </Flex>
    );
  }

  return (
    <Box p={{ base: 4, md: 8 }} maxW="7xl" mx="auto" bg={bgColor} minH="100vh">
      <Grid
        templateColumns={{ base: "1fr", md: "2fr 1fr" }}
        gap={{ base: 6, md: 10 }}
        alignItems="start"
      >
        {/* Main Content Column */}
        <GridItem>
          {/* Course Overview Card */}
          <Card
            mb={8}
            bg={cardBgColor}
            borderRadius="2xl"
            boxShadow="xl"
            overflow="hidden"
          >
            <CardHeader pb={2}>
              <Flex justify="space-between" align="center" mb={2}>
                <Heading as="h1" size="xl" color={headingColor}>
                  {course.title}
                </Heading>
                <Tooltip label="Edit Class Details" placement="bottom">
                  <IconButton
                    aria-label="Edit course"
                    icon={<FiEdit />}
                    onClick={() => router.push(`/teacher/classes/${id}/edit`)}
                    size="md"
                    borderRadius="full"
                    variant="ghost"
                    color={textColor}
                    _hover={{ bg: hoverBg }}
                  />
                </Tooltip>
              </Flex>
              <Text fontSize="lg" color={textColor} mb={4}>
                {course.description}
              </Text>
            </CardHeader>
            <CardBody pt={0}>
              <Stack
                direction={{ base: "column", sm: "row" }}
                spacing={3}
                mb={4}
              >
                <Badge
                  colorScheme="purple"
                  px={4}
                  py={1.5}
                  borderRadius="full"
                  fontSize="md"
                  fontWeight="medium"
                  variant="subtle"
                >
                  {course.subject}
                </Badge>
                <Badge
                  colorScheme="teal"
                  px={4}
                  py={1.5}
                  borderRadius="full"
                  fontSize="md"
                  fontWeight="medium"
                  variant="subtle"
                >
                  {course.level}
                </Badge>
              </Stack>

              <Divider mb={4} borderColor={borderColor} />

              <Flex justify="space-between" align="center">
                <Text fontSize="md" color={lightTextColor}>
                  Created On: {new Date(course.createdAt).toLocaleDateString()}
                </Text>
                <Badge
                  colorScheme="blue"
                  variant="solid"
                  px={4}
                  py={1.5}
                  borderRadius="full"
                  fontSize="md"
                  fontWeight="bold"
                >
                  Code: {course.joinCode}
                </Badge>
              </Flex>
            </CardBody>
          </Card>
          <Card bg={cardBgColor} borderRadius="2xl" mb="10" boxShadow="xl">
            <CourseMessages courseId={id} />
          </Card>
          {/* Assignments Section */}
          <Card bg={cardBgColor} borderRadius="2xl" boxShadow="xl">
            <CardHeader pb={2}>
              <Flex justify="space-between" align="center">
                <Heading size="lg" color={headingColor}>
                  Assignments
                </Heading>
              </Flex>
            </CardHeader>
            <CardBody>
              {course.assignments && course.assignments.length > 0 ? (
                <Stack spacing={5}>
                  {course.assignments.map((assignment) => (
                    <Card
                      key={assignment._id}
                      variant="elevated"
                      bg={elevatedCardBg}
                      borderRadius="xl"
                      boxShadow="sm"
                      _hover={{
                        boxShadow: "md",
                        transform: "translateY(-2px)",
                      }}
                      transition="all 0.2s ease-in-out"
                    >
                      <CardBody p={4}>
                        <Flex justify="space-between" align="center">
                          <Box flex="1" pr={4}>
                            <Heading size="md" mb={1} color={headingColor}>
                              {assignment.title}
                            </Heading>
                            <Text
                              fontSize="sm"
                              color={textColor}
                              noOfLines={2}
                              mb={2}
                            >
                              {assignment.description ||
                                "No description provided."}
                            </Text>
                            <Text
                              fontSize="xs"
                              color={lightTextColor}
                              fontWeight="medium"
                            >
                              Due:{" "}
                              {new Date(assignment.dueDate).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </Text>
                            {assignment.fileUrl && (
                              <Button
                                leftIcon={<FiDownload />}
                                size="sm"
                                as="a"
                                href={assignment.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                mt={3}
                                colorScheme="blue"
                                variant="outline"
                                borderRadius="full"
                              >
                                Download File
                              </Button>
                            )}
                            <Button
                              leftIcon={<FiDownload />}
                              size="sm"
                              as="a"
                              target="_blank"
                              rel="noopener noreferrer"
                              mt={3}
                              colorScheme="blue"
                              variant="outline"
                              borderRadius="full"
                              onClick={() =>
                                handleDownloadAssignment(assignment._id)
                              }
                            >
                              Download Submitted Assignments
                            </Button>
                          </Box>
                          <Menu>
                            <MenuButton
                              as={IconButton}
                              aria-label="Assignment options"
                              icon={<FiMoreVertical />}
                              variant="ghost"
                              size="sm"
                              borderRadius="full"
                              _hover={{ bg: hoverBg }}
                            />
                            <MenuList zIndex={10}>
                              <MenuItem
                                icon={<FiEdit />}
                                onClick={() => handleEditAssignment(assignment)}
                              >
                                Edit Assignment
                              </MenuItem>
                              <MenuItem
                                icon={<FiTrash2 />}
                                color="red.500"
                                onClick={() => {
                                  setSelectedAssignment(assignment);
                                  onDeleteAlertOpen();
                                }}
                              >
                                Delete Assignment
                              </MenuItem>
                            </MenuList>
                          </Menu>
                        </Flex>
                      </CardBody>
                    </Card>
                  ))}
                </Stack>
              ) : (
                <Stack
                  align="center"
                  textAlign="center"
                  py={10}
                  color={lightTextColor}
                >
                  <FiInfo size="40px" />
                  <Text fontSize="lg" mt={2}>
                    No assignments created yet.
                  </Text>
                  <Text>
                    Click &quot;New Assignment&quot; to add your first one.
                  </Text>
                </Stack>
              )}
            </CardBody>
          </Card>
        </GridItem>

        {/* Sidebar Column */}
        <GridItem>
          {/* Quick Actions Card */}
          <Card
            bg={cardBgColor}
            borderRadius="2xl"
            boxShadow="xl"
            position="sticky"
            top="4"
            p={6}
            mb={6}
          >
            <CardHeader pb={4}>
              <Heading size="md" color={headingColor}>
                Quick Actions
              </Heading>
            </CardHeader>
            <CardBody pt={0}>
              <Stack spacing={4}>
                <Button
                  onClick={handleCreateAssignment}
                  colorScheme="teal"
                  size="lg"
                  width="full"
                  borderRadius="full"
                  leftIcon={<FiPlus />}
                  boxShadow="md"
                  _hover={{ boxShadow: "lg", transform: "translateY(-1px)" }}
                >
                  Create New Assignment
                </Button>
                <Button
                  onClick={() => router.push(`/teacher/classes/${id}/students`)}
                  colorScheme="blue"
                  variant="outline"
                  size="lg"
                  width="full"
                  borderRadius="full"
                  leftIcon={<FiUsers />}
                  boxShadow="sm"
                  _hover={{ boxShadow: "md", transform: "translateY(-1px)" }}
                >
                  Manage Students
                </Button>
              </Stack>
            </CardBody>
          </Card>

          {/* Course Stats Card */}
          <Card bg={cardBgColor} borderRadius="2xl" boxShadow="xl" p={6}>
            <CardHeader pb={4}>
              <Heading size="md" color={headingColor}>
                Course Stats
              </Heading>
            </CardHeader>
            <CardBody pt={0}>
              <Stack spacing={3}>
                <Flex justify="space-between" align="center">
                  <Text color={textColor}>Total Assignments</Text>
                  <Badge
                    colorScheme="orange"
                    borderRadius="full"
                    px={3}
                    py={1}
                    fontSize="md"
                    fontWeight="bold"
                  >
                    {course.assignments?.length || 0}
                  </Badge>
                </Flex>
                <Divider borderColor={borderColor} />
                <Flex justify="space-between" align="center">
                  <Text color={textColor}>Enrolled Students</Text>
                  <Badge
                    colorScheme="green"
                    borderRadius="full"
                    px={3}
                    py={1}
                    fontSize="md"
                    fontWeight="bold"
                  >
                    {course.students?.length || 0}
                  </Badge>
                </Flex>
                <Divider borderColor={borderColor} />
                <Flex justify="space-between" align="center">
                  <Text color={textColor}>Class Created On</Text>
                  <Text fontWeight="medium" color={primaryColor}>
                    {new Date(course.createdAt).toLocaleDateString()}
                  </Text>
                </Flex>
              </Stack>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>

      {/* Assignment Modal (Create/Edit) */}
      <AssignmentModal
        isOpen={isAssignmentModalOpen}
        onClose={onAssignmentModalClose}
        courseId={id}
        assignmentData={selectedAssignment ?? undefined}
        onCreated={() => setRefresh((prev) => !prev)}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteAlertOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteAlertClose}
        isCentered
      >
        <AlertDialogOverlay bg="blackAlpha.600">
          <AlertDialogContent
            bg={cardBgColor}
            borderRadius="xl"
            boxShadow="2xl"
            p={4}
          >
            <AlertDialogHeader
              fontSize="2xl"
              fontWeight="bold"
              color={headingColor}
            >
              Delete Assignment
            </AlertDialogHeader>

            <AlertDialogBody color={textColor} mb={4}>
              Are you sure you want to delete &quot;
              <Text as="span" fontWeight="bold" color={primaryColor}>
                {selectedAssignment?.title}
              </Text>
              &quot;?
              <Text mt={2}>
                This action will permanently remove the assignment and any
                associated files.
                <Text as="span" fontWeight="bold" color="red.500">
                  {" "}
                  This cannot be undone.
                </Text>
              </Text>
            </AlertDialogBody>

            <AlertDialogFooter
              borderTop="1px solid"
              borderColor={borderColor}
              pt={4}
            >
              <Button
                ref={cancelRef}
                onClick={onDeleteAlertClose}
                borderRadius="full"
                variant="ghost"
                _hover={{ bg: hoverBg }}
              >
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={handleDeleteAssignment}
                ml={3}
                borderRadius="full"
              >
                Yes, Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}
