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
import {
  DeleteIcon,
  EditIcon,
  CopyIcon,
  SearchIcon,
} from "@chakra-ui/icons";
import {
  FiPlus,
  FiBook,
  FiUsers,
  FiMoreVertical,
  FiBookOpen,
  FiCheck,
  FiLayers,
} from "react-icons/fi";

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

  // Minimal Color Mode Tokens
  const pageBg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const headingColor = useColorModeValue("gray.800", "white");
  const textColor = useColorModeValue("gray.600", "gray.300");
  const lightTextColor = useColorModeValue("gray.500", "gray.400");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const hoverBorderColor = useColorModeValue("gray.400", "gray.500");
  const codeBoxBg = useColorModeValue("gray.50", "gray.900");
  const modalBg = useColorModeValue("white", "gray.800");
  const btnBg = useColorModeValue("gray.900", "white");
  const btnColor = useColorModeValue("white", "gray.900");
  const btnHoverBg = useColorModeValue("gray.800", "gray.100");

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await fetch(
        "/api/courses?populate=assignments,students,createdBy"
      );
      const data = await res.json();
      setCourses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast({
        title: "Error loading classes",
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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
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
    0
  );
  const totalAssignments = courses.reduce(
    (acc, curr) => acc + (curr.assignments?.length || 0),
    0
  );

  return (
    <Box bg={pageBg} minH="100vh" p={{ base: 4, md: 8 }}>
      <VStack spacing={6} align="stretch" maxW="7xl" mx="auto">
        {/* Minimal Header Section */}
        <Flex
          direction={{ base: "column", md: "row" }}
          justify="space-between"
          align={{ base: "flex-start", md: "center" }}
          gap={4}
          pb={2}
        >
          <Box>
            <Heading size="lg" fontWeight="bold" color={headingColor}>
              Classes & Courses
            </Heading>
            <Text color={lightTextColor} fontSize="sm" mt={0.5}>
              Manage your course roster, assignments, and class codes
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
            Create Class
          </Button>
        </Flex>

        {/* Minimal Metrics Bar */}
        <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={4}>
          <Card bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor} p={4}>
            <HStack spacing={3}>
              <FiBookOpen size={18} color="#718096" />
              <Box>
                <Text fontSize="xl" fontWeight="bold" color={headingColor}>{courses.length}</Text>
                <Text fontSize="xs" color={lightTextColor}>Total Classes</Text>
              </Box>
            </HStack>
          </Card>

          <Card bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor} p={4}>
            <HStack spacing={3}>
              <FiUsers size={18} color="#718096" />
              <Box>
                <Text fontSize="xl" fontWeight="bold" color={headingColor}>{totalStudents}</Text>
                <Text fontSize="xs" color={lightTextColor}>Enrolled Students</Text>
              </Box>
            </HStack>
          </Card>

          <Card bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor} p={4}>
            <HStack spacing={3}>
              <FiLayers size={18} color="#718096" />
              <Box>
                <Text fontSize="xl" fontWeight="bold" color={headingColor}>{totalAssignments}</Text>
                <Text fontSize="xs" color={lightTextColor}>Published Assignments</Text>
              </Box>
            </HStack>
          </Card>
        </SimpleGrid>

        {/* Filter & Search Toolbar */}
        <Flex
          direction={{ base: "column", sm: "row" }}
          justify="space-between"
          align="center"
          gap={3}
        >
          <InputGroup maxW={{ base: "100%", sm: "320px" }} size="sm">
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Search classes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              borderRadius="md"
              bg={cardBg}
              borderColor={borderColor}
              fontSize="xs"
            />
          </InputGroup>

          <HStack spacing={3} w={{ base: "100%", sm: "auto" }}>
            <Select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              size="sm"
              borderRadius="md"
              bg={cardBg}
              borderColor={borderColor}
              fontSize="xs"
              w={{ base: "100%", sm: "180px" }}
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
          <Flex justify="center" align="center" minH="250px">
            <Spinner size="md" color="gray.500" thickness="2px" />
          </Flex>
        ) : filteredCourses.length === 0 ? (
          <Box
            textAlign="center"
            py={12}
            px={6}
            bg={cardBg}
            borderRadius="xl"
            borderWidth="1px"
            borderColor={borderColor}
          >
            <VStack spacing={3}>
              <FiBook size={28} color="#a0aec0" />
              <Heading size="sm" color={headingColor}>
                {searchQuery ? "No matching classes" : "No classes created"}
              </Heading>
              <Text color={lightTextColor} fontSize="xs" maxW="md">
                Create a class to generate a join code and start publishing assignments.
              </Text>
              {!searchQuery && (
                <Button size="sm" leftIcon={<FiPlus />} colorScheme="gray" borderRadius="md" onClick={onOpen}>
                  Create Class
                </Button>
              )}
            </VStack>
          </Box>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={5}>
            {filteredCourses.map((course) => (
              <Card
                key={course._id}
                bg={cardBg}
                borderRadius="xl"
                borderWidth="1px"
                borderColor={borderColor}
                boxShadow="none"
                _hover={{ borderColor: hoverBorderColor }}
                cursor="pointer"
                onClick={() => router.push(`/teacher/classes/${course._id}`)}
              >
                <CardBody p={5}>
                  <Flex justify="space-between" align="flex-start" mb={2}>
                    <Badge
                      variant="outline"
                      colorScheme="gray"
                      px={2}
                      py={0.5}
                      borderRadius="md"
                      fontSize="10px"
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
                          size="xs"
                          borderRadius="md"
                        />
                        <MenuList bg={cardBg} borderColor={borderColor} fontSize="xs">
                          <MenuItem
                            icon={<EditIcon />}
                            onClick={() => router.push(`/teacher/classes/${course._id}/edit`)}
                          >
                            Edit Class
                          </MenuItem>
                          <MenuItem
                            icon={<DeleteIcon />}
                            color="red.500"
                            onClick={() => {
                              setItemToDelete({ id: course._id, type: "course" });
                              setIsDeleteAlertOpen(true);
                            }}
                          >
                            Delete Class
                          </MenuItem>
                        </MenuList>
                      </Menu>
                    </Box>
                  </Flex>

                  <Heading size="sm" color={headingColor} mb={1} noOfLines={1}>
                    {course.title}
                  </Heading>
                  <Text fontSize="xs" color={lightTextColor} mb={3}>
                    {course.level || "All Levels"}
                  </Text>

                  <Text fontSize="xs" color={textColor} noOfLines={2} minH="32px" mb={4}>
                    {course.description || "No description provided."}
                  </Text>

                  {/* Join Code Minimal Box */}
                  <Box
                    p={2.5}
                    borderRadius="md"
                    bg={codeBoxBg}
                    borderWidth="1px"
                    borderColor={borderColor}
                    mb={4}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Flex justify="space-between" align="center">
                      <Box>
                        <Text fontSize="9px" uppercase tracking="wider" color={lightTextColor}>
                          Join Code
                        </Text>
                        <Text fontSize="xs" fontWeight="bold" letterSpacing="1px">
                          {course.joinCode}
                        </Text>
                      </Box>
                      <Tooltip label={copiedCodeId === course._id ? "Copied!" : "Copy Code"}>
                        <IconButton
                          aria-label="Copy Code"
                          icon={copiedCodeId === course._id ? <FiCheck /> : <CopyIcon />}
                          size="xs"
                          variant="ghost"
                          onClick={() => handleCopyCode(course.joinCode, course._id)}
                        />
                      </Tooltip>
                    </Flex>
                  </Box>

                  {/* Student & Assignment Counters */}
                  <Flex justify="space-between" align="center" pt={3} borderTop="1px solid" borderColor={borderColor}>
                    <HStack spacing={2}>
                      <AvatarGroup size="2xs" max={3}>
                        {Array.isArray(course.students) &&
                          course.students.map((st, idx) => (
                            <Avatar key={idx} name={typeof st === "object" ? st.name : "Student"} />
                          ))}
                      </AvatarGroup>
                      <Text fontSize="11px" color={lightTextColor}>
                        {course.students?.length || 0} Students
                      </Text>
                    </HStack>

                    <Text fontSize="11px" color={lightTextColor}>
                      {course.assignments?.length || 0} Assignments
                    </Text>
                  </Flex>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        )}
      </VStack>

      {/* Create Class Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
        <ModalOverlay bg="blackAlpha.400" />
        <ModalContent borderRadius="xl" overflow="hidden" bg={modalBg} borderWidth="1px" borderColor={borderColor} boxShadow="xl">
          <ModalHeader pt={6} px={6} pb={0}>
            <Heading size="md" color={headingColor}>Create New Class</Heading>
            <Text fontSize="xs" color={lightTextColor} mt={1}>
              Generate a unique course & share code with students
            </Text>
          </ModalHeader>
          <ModalCloseButton top={6} right={6} />

          <ModalBody p={6}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel fontSize="xs" fontWeight="medium">Class Title</FormLabel>
                <Input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. Advanced Data Structures"
                  borderRadius="md"
                  fontSize="xs"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="xs" fontWeight="medium">Subject</FormLabel>
                <Select
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  placeholder="Select Subject"
                  borderRadius="md"
                  fontSize="xs"
                >
                  <option value="Mathematics">Mathematics</option>
                  <option value="Science">Science</option>
                  <option value="English">English</option>
                  <option value="History">History</option>
                  <option value="ComputerScience">Computer Science</option>
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="xs" fontWeight="medium">Education Level</FormLabel>
                <Select
                  name="level"
                  value={form.level}
                  onChange={handleChange}
                  placeholder="Select Level"
                  borderRadius="md"
                  fontSize="xs"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="University">University / Higher Ed</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="xs" fontWeight="medium">Description</FormLabel>
                <Textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Brief course summary..."
                  rows={3}
                  borderRadius="md"
                  fontSize="xs"
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter px={6} pb={6} gap={2}>
            <Button onClick={onClose} variant="ghost" size="sm" borderRadius="md">Cancel</Button>
            <Button
              colorScheme="gray"
              bg={btnBg}
              color={btnColor}
              _hover={{ bg: btnHoverBg }}
              onClick={handleCreateCourse}
              size="sm"
              borderRadius="md"
              px={5}
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
        <AlertDialogOverlay bg="blackAlpha.400">
          <AlertDialogContent borderRadius="xl" bg={modalBg}>
            <AlertDialogHeader fontSize="md" fontWeight="semibold">
              Delete Class
            </AlertDialogHeader>
            <AlertDialogBody fontSize="xs" color={lightTextColor}>
              Are you sure you want to delete this class? All associated materials will be permanently removed.
            </AlertDialogBody>
            <AlertDialogFooter gap={2}>
              <Button ref={cancelRef} onClick={() => setIsDeleteAlertOpen(false)} variant="ghost" size="sm" borderRadius="md">
                Cancel
              </Button>
              <Button colorScheme="red" size="sm" onClick={handleDelete} borderRadius="md">
                Delete Class
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}
