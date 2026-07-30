"use client";

import {
  Box,
  Heading,
  Text,
  Spinner,
  Button,
  useToast,
  Flex,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  useDisclosure,
  SimpleGrid,
  Card,
  CardBody,
  Badge,
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
  AvatarGroup,
  Avatar,
  useColorModeValue,
  InputGroup,
  Tooltip,
  HStack,
  VStack,
  InputLeftElement,
  Select,
} from "@chakra-ui/react";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { DeleteIcon, EditIcon, CopyIcon, SearchIcon } from "@chakra-ui/icons";
import {
  FiPlus,
  FiBook,
  FiUsers,
  FiMoreVertical,
  FiBookOpen,
  FiCheck,
  FiLayers,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const MotionCard = motion(Card);

type User = {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
};

type Submission = {
  studentId: User | string;
  fileUrl: string;
  submittedAt?: Date;
};

type Assignment = {
  _id: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: string;
  fileUrl?: string;
  submissions: Submission[];
  createdAt?: string;
  updatedAt?: string;
};

type Course = {
  _id: string;
  title: string;
  description: string;
  subject: string;
  level: string;
  createdBy: User | string;
  students: User[] | string[];
  joinCode: string;
  assignments: Assignment[];
  createdAt?: string;
};

const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: "linear-gradient(135deg, #3182ce 0%, #63b3ed 100%)",
  Science: "linear-gradient(135deg, #38a169 0%, #68d391 100%)",
  English: "linear-gradient(135deg, #dd6b20 0%, #f6ad55 100%)",
  History: "linear-gradient(135deg, #805ad5 0%, #b794f4 100%)",
  ComputerScience: "linear-gradient(135deg, #319795 0%, #4fd1c5 100%)",
  Default: "linear-gradient(135deg, #4a5568 0%, #a0aec0 100%)",
};

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    subject: "",
    level: "",
  });

  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    type: "course" | "assignment";
  } | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  const toast = useToast();
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Modern Color Mode Tokens
  const pageBg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.850");
  const headingColor = useColorModeValue("gray.800", "white");
  const textColor = useColorModeValue("gray.600", "gray.300");
  const lightTextColor = useColorModeValue("gray.500", "gray.400");
  const borderColor = useColorModeValue("gray.150", "gray.750");
  const bannerBg = useColorModeValue(
    "linear-gradient(135deg, #1a202c 0%, #2d3748 100%)",
    "linear-gradient(135deg, #0d1117 0%, #161b22 100%)",
  );
  const codeBoxBg = useColorModeValue("blue.50", "blue.900");
  const codeBoxColor = useColorModeValue("blue.700", "blue.200");
  const modalBg = useColorModeValue("white", "gray.850");

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await fetch(
        "/api/courses?populate=assignments,students,createdBy",
      );
      const data = await res.json();
      setCourses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast({
        title: "Error loading classes",
        description: "Failed to fetch your classes.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreateCourse = async () => {
    if (!form.title || !form.subject || !form.level) {
      toast({
        title: "Missing fields",
        description: "Please provide title, subject, and level.",
        status: "warning",
      });
      return;
    }

    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        const newCourse = await res.json();
        toast({
          title: "Class created!",
          description: "Your new class has been added.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        setCourses((prev) => [newCourse, ...prev]);
        onClose();
        setForm({ title: "", description: "", subject: "", level: "" });
      } else {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create class");
      }
    } catch (error: unknown) {
      const err = error as Error;
      toast({
        title: "Error creating class",
        description: err.message || "Please try again.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      const endpoint =
        itemToDelete.type === "course"
          ? `/api/courses/${itemToDelete.id}`
          : `/api/assignments/${itemToDelete.id}`;

      const res = await fetch(endpoint, {
        method: "DELETE",
      });

      if (res.ok) {
        setCourses((prev) => prev.filter((c) => c._id !== itemToDelete.id));
        toast({
          title: "Class deleted",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error("Failed to delete");
      }
    } catch {
      toast({
        title: "Deletion failed",
        status: "error",
      });
    } finally {
      setIsDeleteAlertOpen(false);
      setItemToDelete(null);
    }
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    toast({
      title: "Class Join Code copied!",
      status: "success",
      duration: 2000,
    });
    setTimeout(() => setCopiedCodeId(null), 2500);
  };

  // Filtering
  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject =
      selectedSubject === "All" || course.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  const totalStudents = courses.reduce(
    (acc, curr) => acc + (curr.students?.length || 0),
    0,
  );
  const totalAssignments = courses.reduce(
    (acc, curr) => acc + (curr.assignments?.length || 0),
    0,
  );

  return (
    <Box bg={pageBg} minH="100vh" p={{ base: 4, md: 8 }}>
      <VStack spacing={8} align="stretch" maxW="7xl" mx="auto">
        {/* Banner Section */}
        <Box
          bg={bannerBg}
          borderRadius="3xl"
          p={{ base: 6, md: 10 }}
          color="white"
          boxShadow="2xl"
          position="relative"
          overflow="hidden"
        >
          <Flex
            direction={{ base: "column", md: "row" }}
            justify="space-between"
            align={{ base: "flex-start", md: "center" }}
            gap={6}
            position="relative"
            zIndex={1}
          >
            <VStack align="flex-start" spacing={2} maxW="2xl">
              <HStack spacing={2}>
                <Badge
                  colorScheme="blue"
                  px={3}
                  py={1}
                  borderRadius="full"
                  fontSize="xs"
                  fontWeight="bold"
                >
                  Teacher Portal
                </Badge>
              </HStack>
              <Heading size="xl" fontWeight="extrabold">
                Classes & Course Management
              </Heading>
              <Text color="gray.300" fontSize={{ base: "sm", md: "md" }}>
                Create, manage, and distribute course materials, assignments,
                and announcements to your students.
              </Text>
            </VStack>

            <Button
              leftIcon={<FiPlus />}
              colorScheme="blue"
              size="lg"
              borderRadius="xl"
              px={8}
              onClick={onOpen}
              boxShadow="0 4px 20px rgba(66, 153, 225, 0.4)"
              _hover={{
                transform: "translateY(-2px)",
                boxShadow: "0 6px 24px rgba(66, 153, 225, 0.5)",
              }}
            >
              Create New Class
            </Button>
          </Flex>

          {/* Quick Metrics Bar */}
          <SimpleGrid
            columns={{ base: 1, sm: 3 }}
            spacing={4}
            mt={8}
            pt={6}
            borderTop="1px solid rgba(255,255,255,0.1)"
          >
            <HStack spacing={4}>
              <Flex
                w={12}
                h={12}
                bg="whiteAlpha.200"
                borderRadius="xl"
                align="center"
                justify="center"
              >
                <FiBookOpen size={22} color="#63b3ed" />
              </Flex>
              <Box>
                <Text fontSize="2xl" fontWeight="extrabold">
                  {courses.length}
                </Text>
                <Text fontSize="xs" color="gray.400">
                  Total Classes
                </Text>
              </Box>
            </HStack>

            <HStack spacing={4}>
              <Flex
                w={12}
                h={12}
                bg="whiteAlpha.200"
                borderRadius="xl"
                align="center"
                justify="center"
              >
                <FiUsers size={22} color="#68d391" />
              </Flex>
              <Box>
                <Text fontSize="2xl" fontWeight="extrabold">
                  {totalStudents}
                </Text>
                <Text fontSize="xs" color="gray.400">
                  Enrolled Students
                </Text>
              </Box>
            </HStack>

            <HStack spacing={4}>
              <Flex
                w={12}
                h={12}
                bg="whiteAlpha.200"
                borderRadius="xl"
                align="center"
                justify="center"
              >
                <FiLayers size={22} color="#b794f4" />
              </Flex>
              <Box>
                <Text fontSize="2xl" fontWeight="extrabold">
                  {totalAssignments}
                </Text>
                <Text fontSize="xs" color="gray.400">
                  Published Assignments
                </Text>
              </Box>
            </HStack>
          </SimpleGrid>
        </Box>

        {/* Filter & Search Toolbar */}
        <Flex
          direction={{ base: "column", sm: "row" }}
          justify="space-between"
          align="center"
          gap={4}
        >
          <InputGroup maxW={{ base: "100%", sm: "360px" }} size="lg">
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Search classes by name or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              borderRadius="xl"
              bg={cardBg}
              borderColor={borderColor}
              fontSize="sm"
            />
          </InputGroup>

          <HStack spacing={3} w={{ base: "100%", sm: "auto" }}>
            <Select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              size="lg"
              borderRadius="xl"
              bg={cardBg}
              borderColor={borderColor}
              fontSize="sm"
              w={{ base: "100%", sm: "200px" }}
            >
              <option value="All">All Subjects</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Science">Science</option>
              <option value="English">English</option>
              <option value="History">History</option>
              <option value="ComputerScience">Computer Science</option>
            </Select>
          </HStack>
        </Flex>

        {/* Classes Grid */}
        {loading ? (
          <Flex justify="center" align="center" minH="300px">
            <VStack spacing={4}>
              <Spinner size="xl" color="blue.500" thickness="4px" />
              <Text color={lightTextColor}>Loading your classes...</Text>
            </VStack>
          </Flex>
        ) : filteredCourses.length === 0 ? (
          <Box
            textAlign="center"
            py={16}
            px={6}
            bg={cardBg}
            borderRadius="2xl"
            borderWidth="1px"
            borderColor={borderColor}
          >
            <VStack spacing={4}>
              <Flex
                w={16}
                h={16}
                bg="blue.50"
                color="blue.500"
                borderRadius="full"
                align="center"
                justify="center"
              >
                <FiBook size={32} />
              </Flex>
              <Heading size="md" color={headingColor}>
                {searchQuery
                  ? "No matching classes found"
                  : "No classes created yet"}
              </Heading>
              <Text color={textColor} maxW="md">
                {searchQuery
                  ? "Try clearing your search query or subject filters."
                  : "Get started by creating your first class and sharing the join code with your students."}
              </Text>
              {!searchQuery && (
                <Button
                  leftIcon={<FiPlus />}
                  colorScheme="blue"
                  borderRadius="xl"
                  onClick={onOpen}
                >
                  Create Class Now
                </Button>
              )}
            </VStack>
          </Box>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            <AnimatePresence>
              {filteredCourses.map((course) => {
                const headerGradient =
                  SUBJECT_COLORS[course.subject] || SUBJECT_COLORS.Default;

                return (
                  <MotionCard
                    key={course._id}
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
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
                    onClick={() =>
                      router.push(`/teacher/classes/${course._id}`)
                    }
                  >
                    {/* Top Subject Color Bar */}
                    <Box
                      h="120px"
                      bg={headerGradient}
                      p={5}
                      position="relative"
                      color="white"
                    >
                      <Flex justify="space-between" align="flex-start">
                        <Badge
                          bg="whiteAlpha.300"
                          color="white"
                          backdropFilter="blur(6px)"
                          px={3}
                          py={1}
                          borderRadius="full"
                          fontSize="xs"
                          fontWeight="bold"
                        >
                          {course.subject || "General"}
                        </Badge>

                        <Box onClick={(e) => e.stopPropagation()}>
                          <Menu placement="bottom-end">
                            <MenuButton
                              as={IconButton}
                              aria-label="Options"
                              icon={<FiMoreVertical />}
                              variant="ghost"
                              color="white"
                              _hover={{ bg: "whiteAlpha.200" }}
                              borderRadius="full"
                              size="sm"
                            />
                            <MenuList bg={cardBg} borderColor={borderColor}>
                              <MenuItem
                                icon={<EditIcon />}
                                onClick={() =>
                                  router.push(
                                    `/teacher/classes/${course._id}/edit`,
                                  )
                                }
                              >
                                Edit Class
                              </MenuItem>
                              <MenuItem
                                icon={<DeleteIcon />}
                                color="red.500"
                                onClick={() => {
                                  setItemToDelete({
                                    id: course._id,
                                    type: "course",
                                  });
                                  setIsDeleteAlertOpen(true);
                                }}
                              >
                                Delete Class
                              </MenuItem>
                            </MenuList>
                          </Menu>
                        </Box>
                      </Flex>

                      <Heading size="md" color="white" mt={2} noOfLines={1}>
                        {course.title}
                      </Heading>
                      <Text fontSize="xs" color="whiteAlpha.800">
                        {course.level || "All Levels"}
                      </Text>
                    </Box>

                    {/* Card Body */}
                    <CardBody p={5}>
                      <Text
                        fontSize="sm"
                        color={textColor}
                        noOfLines={2}
                        minH="40px"
                        mb={4}
                      >
                        {course.description ||
                          "No description provided for this class."}
                      </Text>

                      {/* Join Code Box */}
                      <Box
                        p={3}
                        borderRadius="xl"
                        bg={codeBoxBg}
                        color={codeBoxColor}
                        mb={4}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Flex justify="space-between" align="center">
                          <Box>
                            <Text
                              fontSize="10px"
                              fontWeight="bold"
                              opacity={0.8}
                            >
                              Class Join Code
                            </Text>
                            <Text
                              fontSize="md"
                              fontWeight="extrabold"
                              letterSpacing="1px"
                            >
                              {course.joinCode}
                            </Text>
                          </Box>
                          <Tooltip
                            label={
                              copiedCodeId === course._id
                                ? "Copied!"
                                : "Copy Join Code"
                            }
                          >
                            <IconButton
                              aria-label="Copy Code"
                              icon={
                                copiedCodeId === course._id ? (
                                  <FiCheck />
                                ) : (
                                  <CopyIcon />
                                )
                              }
                              size="sm"
                              colorScheme={
                                copiedCodeId === course._id ? "green" : "blue"
                              }
                              variant="ghost"
                              onClick={() =>
                                handleCopyCode(course.joinCode, course._id)
                              }
                            />
                          </Tooltip>
                        </Flex>
                      </Box>

                      {/* Student & Assignment Counters */}
                      <Flex
                        justify="space-between"
                        align="center"
                        pt={2}
                        borderTop="1px solid"
                        borderColor={borderColor}
                      >
                        <HStack spacing={2}>
                          <AvatarGroup size="xs" max={3}>
                            {Array.isArray(course.students) &&
                              course.students.map((st, idx) => (
                                <Avatar
                                  key={idx}
                                  name={
                                    typeof st === "object" ? st.name : "Student"
                                  }
                                />
                              ))}
                          </AvatarGroup>
                          <Text
                            fontSize="xs"
                            fontWeight="semibold"
                            color={lightTextColor}
                          >
                            {course.students?.length || 0} Students
                          </Text>
                        </HStack>

                        <Badge
                          colorScheme="purple"
                          borderRadius="md"
                          px={2.5}
                          py={0.5}
                          fontSize="xs"
                        >
                          {course.assignments?.length || 0} Assignments
                        </Badge>
                      </Flex>
                    </CardBody>
                  </MotionCard>
                );
              })}
            </AnimatePresence>
          </SimpleGrid>
        )}
      </VStack>

      {/* Create Class Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
        <ModalOverlay backdropFilter="blur(6px)" bg="blackAlpha.600" />
        <ModalContent
          borderRadius="2xl"
          overflow="hidden"
          bg={modalBg}
          boxShadow="2xl"
        >
          <ModalHeader
            bg="linear-gradient(135deg, #3182ce 0%, #63b3ed 100%)"
            color="white"
            p={6}
          >
            <Heading size="md">Create New Class</Heading>
            <Text fontSize="xs" opacity={0.9} mt={1}>
              Generate a unique course & share code with students
            </Text>
          </ModalHeader>
          <ModalCloseButton color="white" top={6} right={6} />

          <ModalBody p={6}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="semibold">
                  Class Title
                </FormLabel>
                <Input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. Advanced Data Structures"
                  borderRadius="xl"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="semibold">
                  Subject
                </FormLabel>
                <Select
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  placeholder="Select Subject"
                  borderRadius="xl"
                >
                  <option value="Mathematics">Mathematics</option>
                  <option value="Science">Science</option>
                  <option value="English">English</option>
                  <option value="History">History</option>
                  <option value="ComputerScience">Computer Science</option>
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="semibold">
                  Education Level
                </FormLabel>
                <Select
                  name="level"
                  value={form.level}
                  onChange={handleChange}
                  placeholder="Select Level"
                  borderRadius="xl"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="University">University / Higher Ed</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" fontWeight="semibold">
                  Description
                </FormLabel>
                <Textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Brief summary of the course syllabus and goals..."
                  rows={3}
                  borderRadius="xl"
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter px={6} pb={6} gap={3}>
            <Button onClick={onClose} variant="ghost" borderRadius="xl">
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleCreateCourse}
              borderRadius="xl"
              px={6}
            >
              Create Class
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Alert */}
      <AlertDialog
        isOpen={isDeleteAlertOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => setIsDeleteAlertOpen(false)}
        isCentered
      >
        <AlertDialogOverlay backdropFilter="blur(4px)" bg="blackAlpha.600">
          <AlertDialogContent borderRadius="2xl" bg={modalBg}>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Class
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to delete this class? All associated
              materials, announcements, and assignments will be permanently
              removed.
            </AlertDialogBody>
            <AlertDialogFooter gap={3}>
              <Button
                ref={cancelRef}
                onClick={() => setIsDeleteAlertOpen(false)}
                variant="ghost"
                borderRadius="xl"
              >
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={handleDelete}
                borderRadius="xl"
              >
                Delete Class
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}
