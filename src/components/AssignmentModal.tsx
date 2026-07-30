"use client";

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  useToast,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Text,
  Box,
  VStack,
  HStack,
  Icon,
  useColorModeValue,
  Flex,
  IconButton,
} from "@chakra-ui/react";
import { useState, useRef, useEffect } from "react";
import { FiUploadCloud, FiTrash2, FiCalendar, FiEdit3, FiCheckCircle } from "react-icons/fi";
import { motion } from "framer-motion";

const MotionBox = motion(Box);

interface Assignment {
  _id: string;
  title: string;
  description: string;
  dueDate: string;
  fileUrl?: string;
}

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  onCreated: () => void;
  assignmentData?: Assignment;
}

interface AssignmentForm {
  title: string;
  description: string;
  dueDate: string;
  fileUrl: string;
}

export default function AssignmentModal({
  isOpen,
  onClose,
  courseId,
  onCreated,
  assignmentData,
}: AssignmentModalProps) {
  const [form, setForm] = useState<AssignmentForm>({
    title: "",
    description: "",
    dueDate: "",
    fileUrl: "",
  });
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileName, setFileName] = useState<string>("");
  const cancelRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const modalBg = useColorModeValue("white", "gray.850");
  const modalBorder = useColorModeValue("gray.100", "gray.700");
  const headerBg = useColorModeValue("linear-gradient(135deg, #3182ce 0%, #63b3ed 100%)", "linear-gradient(135deg, #2b6cb0 0%, #3182ce 100%)");
  const inputBg = useColorModeValue("gray.50", "gray.800");
  const inputBorder = useColorModeValue("gray.200", "gray.700");
  const focusBorder = useColorModeValue("blue.500", "blue.300");
  const uploadAreaBg = useColorModeValue("blue.50", "whiteAlpha.50");
  const uploadAreaBorder = useColorModeValue("blue.200", "blue.700");
  const labelColor = useColorModeValue("gray.700", "gray.200");

  useEffect(() => {
    if (assignmentData) {
      setForm({
        title: assignmentData.title,
        description: assignmentData.description,
        dueDate: assignmentData.dueDate ? assignmentData.dueDate.split("T")[0] : "",
        fileUrl: assignmentData.fileUrl || "",
      });
      if (assignmentData.fileUrl) {
        const parts = assignmentData.fileUrl.split("/");
        setFileName(parts[parts.length - 1] || "Attached Document");
      }
    } else {
      setForm({
        title: "",
        description: "",
        dueDate: "",
        fileUrl: "",
      });
      setFileName("");
    }
  }, [assignmentData, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      setForm((prev) => ({ ...prev, fileUrl: data.url }));
      toast({
        title: "File uploaded successfully",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error("File upload error:", error);
      toast({
        title: "File upload failed",
        description: "Please try again",
        status: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.dueDate) {
      toast({
        title: "Missing fields",
        description: "Please fill in title and due date",
        status: "warning",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const url = assignmentData
        ? `/api/assignments/${assignmentData._id}`
        : "/api/assignments";

      const method = assignmentData ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, courseId }),
      });

      if (!res.ok) throw new Error("Operation failed");

      toast({
        title: assignmentData ? "Assignment updated" : "Assignment created",
        status: "success",
      });
      onCreated();
      onClose();
    } catch (error) {
      console.error("Submission error:", error);
      toast({
        title: assignmentData
          ? "Failed to update assignment"
          : "Failed to create assignment",
        status: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!assignmentData) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/assignments/${assignmentData._id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Deletion failed");

      toast({
        title: "Assignment deleted",
        status: "success",
      });
      onCreated();
      onClose();
      setIsDeleteOpen(false);
    } catch (error) {
      console.error("Deletion error:", error);
      toast({
        title: "Failed to delete assignment",
        status: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg" motionPreset="slideInBottom">
        <ModalOverlay backdropFilter="blur(8px)" bg="blackAlpha.600" />
        <ModalContent borderRadius="2xl" overflow="hidden" bg={modalBg} borderWidth="1px" borderColor={modalBorder} boxShadow="2xl">
          <Box bg={headerBg} p={6} color="white" position="relative">
            <HStack spacing={3}>
              <Box p={2.5} bg="whiteAlpha.200" borderRadius="xl" backdropFilter="blur(4px)">
                <Icon as={assignmentData ? FiEdit3 : FiUploadCloud} w={6} h={6} color="white" />
              </Box>
              <Box>
                <Text fontSize="xl" fontWeight="bold">
                  {assignmentData ? "Edit Assignment" : "Create New Assignment"}
                </Text>
                <Text fontSize="xs" opacity={0.9}>
                  {assignmentData ? "Update submission requirements & details" : "Publish new tasks for your students"}
                </Text>
              </Box>
            </HStack>
            <ModalCloseButton color="white" top={6} right={6} _hover={{ bg: "whiteAlpha.300" }} />
          </Box>

          <ModalBody p={6}>
            <VStack spacing={5} align="stretch">
              <FormControl isRequired>
                <FormLabel fontWeight="semibold" fontSize="sm" color={labelColor}>
                  Assignment Title
                </FormLabel>
                <Input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. Midterm Project Guidelines"
                  size="lg"
                  borderRadius="xl"
                  bg={inputBg}
                  borderColor={inputBorder}
                  _hover={{ borderColor: focusBorder }}
                  _focus={{ borderColor: focusBorder, boxShadow: `0 0 0 1px ${focusBorder}` }}
                />
              </FormControl>

              <FormControl>
                <FormLabel fontWeight="semibold" fontSize="sm" color={labelColor}>
                  Description & Instructions
                </FormLabel>
                <Textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Detail out objectives, resources, or grading criteria..."
                  rows={4}
                  borderRadius="xl"
                  bg={inputBg}
                  borderColor={inputBorder}
                  _hover={{ borderColor: focusBorder }}
                  _focus={{ borderColor: focusBorder, boxShadow: `0 0 0 1px ${focusBorder}` }}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontWeight="semibold" fontSize="sm" color={labelColor}>
                  <HStack spacing={1.5}>
                    <Icon as={FiCalendar} color="blue.500" />
                    <Text>Due Date</Text>
                  </HStack>
                </FormLabel>
                <Input
                  name="dueDate"
                  type="date"
                  value={form.dueDate}
                  onChange={handleChange}
                  size="lg"
                  borderRadius="xl"
                  bg={inputBg}
                  borderColor={inputBorder}
                  _hover={{ borderColor: focusBorder }}
                  _focus={{ borderColor: focusBorder, boxShadow: `0 0 0 1px ${focusBorder}` }}
                />
              </FormControl>

              <FormControl>
                <FormLabel fontWeight="semibold" fontSize="sm" color={labelColor}>
                  Attachment / Resource File
                </FormLabel>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />

                {form.fileUrl ? (
                  <Flex
                    p={4}
                    borderRadius="xl"
                    bg={uploadAreaBg}
                    borderWidth="1px"
                    borderColor={uploadAreaBorder}
                    align="center"
                    justify="space-between"
                  >
                    <HStack spacing={3}>
                      <Icon as={FiCheckCircle} color="green.500" w={5} h={5} />
                      <Box>
                        <Text fontSize="sm" fontWeight="semibold" noOfLines={1}>
                          {fileName || "File Uploaded"}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          Resource ready for download
                        </Text>
                      </Box>
                    </HStack>
                    <IconButton
                      aria-label="Remove file"
                      icon={<FiTrash2 />}
                      size="sm"
                      colorScheme="red"
                      variant="ghost"
                      onClick={() => setForm((prev) => ({ ...prev, fileUrl: "" }))}
                    />
                  </Flex>
                ) : (
                  <MotionBox
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    p={6}
                    borderWidth="2px"
                    borderStyle="dashed"
                    borderColor={uploadAreaBorder}
                    borderRadius="xl"
                    bg={uploadAreaBg}
                    textAlign="center"
                    cursor="pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <VStack spacing={2}>
                      <Icon as={FiUploadCloud} w={8} h={8} color="blue.500" />
                      <Text fontSize="sm" fontWeight="medium">
                        Click to upload assignment resource or instructions
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        PDF, DOCX, ZIP, PNG, or JPG (Max 10MB)
                      </Text>
                    </VStack>
                  </MotionBox>
                )}
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter bg={useColorModeValue("gray.50", "gray.900")} px={6} py={4} gap={3}>
            {assignmentData && (
              <Button
                colorScheme="red"
                variant="ghost"
                leftIcon={<FiTrash2 />}
                mr="auto"
                onClick={() => setIsDeleteOpen(true)}
                isDisabled={isSubmitting}
                borderRadius="xl"
              >
                Delete
              </Button>
            )}
            <Button onClick={onClose} variant="ghost" isDisabled={isSubmitting} borderRadius="xl">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              colorScheme="blue"
              isLoading={isSubmitting}
              borderRadius="xl"
              px={6}
              boxShadow="0 4px 14px 0 rgba(49, 130, 206, 0.39)"
            >
              {assignmentData ? "Save Changes" : "Create Assignment"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete confirmation dialog */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => setIsDeleteOpen(false)}
        isCentered
      >
        <AlertDialogOverlay backdropFilter="blur(4px)" bg="blackAlpha.600">
          <AlertDialogContent borderRadius="2xl" bg={modalBg}>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Assignment
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to delete &quot;{assignmentData?.title}&quot;? This action cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter gap={3}>
              <Button ref={cancelRef} onClick={() => setIsDeleteOpen(false)} variant="ghost" borderRadius="xl">
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={handleDelete}
                isLoading={isSubmitting}
                borderRadius="xl"
              >
                Delete Assignment
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
}
