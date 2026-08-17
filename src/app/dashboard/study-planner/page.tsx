"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Card,
  useToast,
  Spinner,
  Flex,
  useColorModeValue,
  Checkbox,
  Badge,
  Progress,
  Icon,
} from "@chakra-ui/react";
import {
  FiCalendar,
  FiClock,
  FiZap,
  FiCheckCircle,
  FiBookOpen,
} from "react-icons/fi";

interface StudyTask {
  _id: string;
  title: string;
  courseTitle?: string;
  priority: "high" | "medium" | "low";
  scheduledDate: string;
  recommendedMinutes: number;
  completed: boolean;
}

interface StudyPlanDoc {
  _id: string;
  weekStartDate: string;
  tasks: StudyTask[];
}

export default function StudyPlannerPage() {
  const [plan, setPlan] = useState<StudyPlanDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const toast = useToast();

  const pageBg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const headingColor = useColorModeValue("gray.800", "white");
  const textColor = useColorModeValue("gray.600", "gray.300");
  const metaColor = useColorModeValue("gray.500", "gray.400");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const taskBg = useColorModeValue("gray.50", "gray.900");

  const btnBg = useColorModeValue("gray.900", "white");
  const btnColor = useColorModeValue("white", "gray.900");
  const btnHoverBg = useColorModeValue("gray.800", "gray.100");

  useEffect(() => {
    fetchStudyPlan();
  }, []);

  const fetchStudyPlan = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/study-planner");
      if (res.ok) {
        const data = await res.json();
        setPlan(data);
      }
    } catch (err) {
      console.error("Error loading study plan:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/study-planner", {
        method: "POST",
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to generate plan.");
      }

      const newPlan = await res.json();
      setPlan(newPlan);
      toast({
        title: "AI Study Schedule Generated!",
        description: "Synced with your course assignment due dates and quizzes.",
        status: "success",
        duration: 4000,
      });
    } catch (err) {
      toast({
        title: "Generation failed",
        description: (err as Error).message,
        status: "error",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleTask = async (taskId: string, currentCompleted: boolean) => {
    if (!plan) return;

    // Optimistic UI update
    setPlan((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        tasks: prev.tasks.map((t) =>
          t._id === taskId ? { ...t, completed: !currentCompleted } : t
        ),
      };
    });

    try {
      await fetch("/api/study-planner", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, completed: !currentCompleted }),
      });
    } catch (err) {
      console.error("Task toggle failed:", err);
    }
  };

  const completedCount = plan?.tasks?.filter((t) => t.completed).length || 0;
  const totalCount = plan?.tasks?.length || 0;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <Box p={{ base: 4, md: 8 }} maxW="7xl" mx="auto" bg={pageBg} minH="100vh">
      <VStack spacing={6} align="stretch">
        <Flex
          direction={{ base: "column", md: "row" }}
          justify="space-between"
          align={{ base: "flex-start", md: "center" }}
          gap={4}
        >
          <Box>
            <Heading size="lg" fontWeight="bold" color={headingColor}>
              AI Smart Study Planner
            </Heading>
            <Text color={metaColor} fontSize="sm" mt={0.5}>
              Automated daily schedule synced with your enrolled course deadlines
            </Text>
          </Box>

          <Button
            leftIcon={<FiZap />}
            colorScheme="gray"
            bg={btnBg}
            color={btnColor}
            _hover={{ bg: btnHoverBg }}
            size="md"
            borderRadius="md"
            onClick={handleGeneratePlan}
            isLoading={isGenerating}
          >
            Generate AI Study Plan
          </Button>
        </Flex>

        {loading ? (
          <Flex justify="center" align="center" minH="250px">
            <Spinner size="md" color="gray.500" thickness="2px" />
          </Flex>
        ) : !plan || !plan.tasks || plan.tasks.length === 0 ? (
          <Card p={10} borderRadius="xl" bg={cardBg} borderWidth="1px" borderColor={borderColor} textAlign="center">
            <VStack spacing={3}>
              <FiCalendar size={32} color="#a0aec0" />
              <Heading size="sm" color={headingColor}>
                No active study schedule
              </Heading>
              <Text color={textColor} fontSize="xs" maxW="md">
                Click &quot;Generate AI Study Plan&quot; to scan your enrolled courses, assignment deadlines, and build a tailored weekly checklist.
              </Text>
              <Button
                size="sm"
                leftIcon={<FiZap />}
                colorScheme="gray"
                bg={btnBg}
                color={btnColor}
                _hover={{ bg: btnHoverBg }}
                borderRadius="md"
                onClick={handleGeneratePlan}
                isLoading={isGenerating}
              >
                Build Weekly Schedule
              </Button>
            </VStack>
          </Card>
        ) : (
          <VStack spacing={6} align="stretch">
            {/* Progress Header Box */}
            <Card bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor} p={5}>
              <Flex justify="space-between" align="center" mb={3}>
                <HStack spacing={3}>
                  <Icon as={FiCheckCircle} color="green.500" w={5} h={5} />
                  <Box>
                    <Heading size="xs" color={headingColor}>
                      Weekly Progress: {completedCount} of {totalCount} Tasks Completed
                    </Heading>
                    <Text fontSize="xs" color={metaColor}>
                      Keep up the momentum to stay on track for your upcoming assignment dates.
                    </Text>
                  </Box>
                </HStack>
                <Text fontSize="lg" fontWeight="bold" color={headingColor}>
                  {progressPercent}%
                </Text>
              </Flex>
              <Progress value={progressPercent} size="xs" colorScheme="gray" borderRadius="full" />
            </Card>

            {/* Daily Tasks List */}
            <Card bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor} p={{ base: 4, md: 5 }}>
              <Heading size="sm" color={headingColor} mb={1}>
                Scheduled Study Tasks
              </Heading>
              <Text fontSize="xs" color={metaColor} mb={5}>
                Check off items as you complete your study sessions
              </Text>

              <VStack spacing={3} align="stretch">
                {plan.tasks.map((task) => {
                  const priorityColor =
                    task.priority === "high"
                      ? "red"
                      : task.priority === "medium"
                      ? "orange"
                      : "gray";

                  return (
                    <Card
                      key={task._id}
                      p={4}
                      borderRadius="lg"
                      borderWidth="1px"
                      borderColor={borderColor}
                      bg={taskBg}
                      opacity={task.completed ? 0.6 : 1}
                      transition="all 0.2s"
                    >
                      <Flex justify="space-between" align="center">
                        <HStack spacing={3.5} flex={1}>
                          <Checkbox
                            isChecked={task.completed}
                            onChange={() => handleToggleTask(task._id, task.completed)}
                            colorScheme="gray"
                            size="lg"
                          />
                          <Box flex={1}>
                            <HStack spacing={2} mb={0.5}>
                              <Badge variant="outline" colorScheme={priorityColor} fontSize="9px">
                                {task.priority.toUpperCase()} PRIORITY
                              </Badge>
                              {task.courseTitle && (
                                <Badge variant="subtle" colorScheme="gray" fontSize="9px">
                                  {task.courseTitle}
                                </Badge>
                              )}
                            </HStack>
                            <Text
                              fontSize="xs"
                              fontWeight="semibold"
                              color={headingColor}
                              textDecoration={task.completed ? "line-through" : "none"}
                            >
                              {task.title}
                            </Text>
                          </Box>
                        </HStack>

                        <HStack spacing={4} fontSize="xs" color={metaColor}>
                          <HStack spacing={1}>
                            <FiClock />
                            <Text>{task.recommendedMinutes} mins</Text>
                          </HStack>
                          <HStack spacing={1}>
                            <FiBookOpen />
                            <Text>{task.scheduledDate}</Text>
                          </HStack>
                        </HStack>
                      </Flex>
                    </Card>
                  );
                })}
              </VStack>
            </Card>
          </VStack>
        )}
      </VStack>
    </Box>
  );
}
