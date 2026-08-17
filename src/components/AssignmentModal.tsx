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
  ModalHeader,
} from "@chakra-ui/react";
import { useState, useRef, useEffect } from "react";
import { FiUploadCloud, FiTrash2, FiCalendar, FiEdit3, FiCheckCircle } from "react-icons/fi";

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

  const modalBg = useColorModeValue("white", "gray.800");
  const modalBorder = useColorModeValue("gray.200", "gray.700");
  const inputBg = useColorModeValue("white", "gray.900");
  const inputBorder = useColorModeValue("gray.200", "gray.700");
  const focusBorder = useColorModeValue("gray.400", "gray.500");
  const uploadAreaBg = useColorModeValue("gray.50", "gray.900");
  const uploadAreaBorder = useColorModeValue("gray.200", "gray.700");
  const labelColor = useColorModeValue("gray.700", "gray.200");
  const headingColor = useColorModeValue("gray.800", "white");
  const subTextColor = useColorModeValue("gray.500", "gray.400");

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
        title: "File uploaded",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error("File upload error:", error);
      toast({
        title: "File upload failed",
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
      <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg">
        <ModalOverlay bg="blackAlpha.400" />
        <ModalContent borderRadius="xl" overflow="hidden" bg={modalBg} borderWidth="1px" borderColor={modalBorder} boxShadow="xl">
          <ModalHeader pt={6} px={6} pb={0}>
            <HStack spacing={3}>
              <Icon as={assignmentData ? FiEdit3 : FiUploadCloud} w={5} h={5} color={headingColor} />
              <Box>
                <Text fontSize="lg" fontWeight="semibold" color={headingColor}>
                  {assignmentData ? "Edit Assignment" : "Create New Assignment"}
                </Text>
                <Text fontSize="xs" color={subTextColor} fontWeight="normal">
                  {assignmentData ? "Update submission requirements" : "Publish new tasks for your class"}
                </Text>
              </Box>
            </HStack>
            <ModalCloseButton top={6} right={6} />
          </ModalHeader>

          <ModalBody p={6}>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel fontWeight="medium" fontSize="xs" color={labelColor}>
                  Assignment Title
                </FormLabel>
                <Input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Assignment title"
                  borderRadius="md"
                  bg={inputBg}
                  borderColor={inputBorder}
                  _focus={{ borderColor: focusBorder }}
                />
              </FormControl>

              <FormControl>
                <FormLabel fontWeight="medium" fontSize="xs" color={labelColor}>
                  Description & Instructions
                </FormLabel>
                <Textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Detail out objectives or instructions..."
                  rows={3}
                  borderRadius="md"
                  bg={inputBg}
                  borderColor={inputBorder}
                  _focus={{ borderColor: focusBorder }}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontWeight="medium" fontSize="xs" color={labelColor}>
                  <HStack spacing={1.5}>
                    <Icon as={FiCalendar} />
                    <Text>Due Date</Text>
                  </HStack>
                </FormLabel>
                <Input
                  name="dueDate"
                  type="date"
                  value={form.dueDate}
                  onChange={handleChange}
                  borderRadius="md"
                  bg={inputBg}
                  borderColor={inputBorder}
                  _focus={{ borderColor: focusBorder }}
                />
              </FormControl>

              <FormControl>
                <FormLabel fontWeight="medium" fontSize="xs" color={labelColor}>
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
                    p={3}
                    borderRadius="md"
                    bg={uploadAreaBg}
                    borderWidth="1px"
                    borderColor={uploadAreaBorder}
                    align="center"
                    justify="space-between"
                  >
                    <HStack spacing={2.5}>
                      <Icon as={FiCheckCircle} color="gray.600" w={4} h={4} />
                      <Text fontSize="xs" fontWeight="medium" noOfLines={1}>
                        {fileName || "File Uploaded"}
                      </Text>
                    </HStack>
                    <IconButton
                      aria-label="Remove file"
                      icon={<FiTrash2 />}
                      size="xs"
                      variant="ghost"
                      onClick={() => setForm((prev) => ({ ...prev, fileUrl: "" }))}
                    />
                  </Flex>
                ) : (
                  <Box
                    p={4}
                    borderWidth="1px"
                    borderStyle="dashed"
                    borderColor={uploadAreaBorder}
                    borderRadius="md"
                    bg={uploadAreaBg}
                    textAlign="center"
                    cursor="pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <VStack spacing={1}>
                      <Icon as={FiUploadCloud} w={5} h={5} color={subTextColor} />
                      <Text fontSize="xs" fontWeight="medium">
                        Click to upload resource or assignment file
                      </Text>
                    </VStack>
                  </Box>
                )}
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter px={6} pb={6} gap={2}>
            {assignmentData && (
              <Button
                colorScheme="red"
                variant="ghost"
                size="sm"
                leftIcon={<FiTrash2 />}
                mr="auto"
                onClick={() => setIsDeleteOpen(true)}
                isDisabled={isSubmitting}
                borderRadius="md"
              >
                Delete
              </Button>
            )}
            <Button onClick={onClose} variant="ghost" size="sm" isDisabled={isSubmitting} borderRadius="md">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              colorScheme="gray"
              bg={useColorModeValue("gray.800", "gray.100")}
              color={useColorModeValue("white", "gray.900")}
              _hover={{ bg: useColorModeValue("gray.700", "white") }}
              size="sm"
              isLoading={isSubmitting}
              borderRadius="md"
              px={5}
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
        <AlertDialogOverlay bg="blackAlpha.400">
          <AlertDialogContent borderRadius="xl" bg={modalBg}>
            <AlertDialogHeader fontSize="md" fontWeight="semibold">
              Delete Assignment
            </AlertDialogHeader>
            <AlertDialogBody fontSize="sm" color={subTextColor}>
              Are you sure you want to delete &quot;{assignmentData?.title}&quot;? This action cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter gap={2}>
              <Button ref={cancelRef} onClick={() => setIsDeleteOpen(false)} variant="ghost" size="sm" borderRadius="md">
                Cancel
              </Button>
              <Button
                colorScheme="red"
                size="sm"
                onClick={handleDelete}
                isLoading={isSubmitting}
                borderRadius="md"
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
}
