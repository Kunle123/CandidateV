import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Divider,
  Flex,
  Heading,
  Text,
  SimpleGrid,
  VStack,
  HStack,
  useColorModeValue,
  Icon,
  Badge,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Card,
  CardBody,
  CardHeader,
  Stack,
  StackDivider,
  Avatar,
  Spinner,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { FaPlus, FaFileAlt, FaUser, FaCog, FaDownload, FaClipboard, FaEdit, FaEye, FaTrash, FaMagic, FaUpload } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import useCV from '../../hooks/useCV';
import { mockUserCVs } from '../cv/mock-data';  // Import mock data

const DashboardTile = ({ title, icon, description, onClick }) => {
  const bg = useColorModeValue('white', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.600');

  return (
    <Box 
      p={5} 
      shadow="md" 
      borderWidth="1px" 
      borderRadius="lg" 
      bg={bg}
      transition="all 0.3s"
      _hover={{ 
        transform: 'translateY(-5px)', 
        shadow: 'lg',
        bg: hoverBg
      }}
      cursor="pointer"
      onClick={onClick}
    >
      <Flex direction="column" align="center" justify="center" textAlign="center">
        <Icon as={icon} boxSize={10} mb={4} color="blue.500" />
        <Heading size="md" mb={2}>{title}</Heading>
        <Text opacity="0.8">{description}</Text>
      </Flex>
    </Box>
  );
};

const StatCard = ({ label, value, helpText, color = "blue.500" }) => {
  return (
    <Stat
      px={{ base: 2, md: 4 }}
      py="5"
      shadow="md"
      border="1px solid"
      borderColor={useColorModeValue("gray.200", "gray.500")}
      rounded="lg"
      bg={useColorModeValue("white", "gray.700")}
    >
      <StatLabel fontWeight="medium" color={color}>{label}</StatLabel>
      <StatNumber fontSize="2xl" fontWeight="bold">{value}</StatNumber>
      {helpText && <StatHelpText>{helpText}</StatHelpText>}
    </Stat>
  );
};

const CVCard = ({ cv, onView, onEdit, onDelete }) => {
  const bgColor = useColorModeValue('white', 'gray.700');
  const lastUpdate = new Date(cv.lastUpdated).toLocaleDateString();
  
  return (
    <Box 
      p={4} 
      borderWidth="1px" 
      borderRadius="md" 
      bg={bgColor}
      boxShadow="sm"
      transition="all 0.2s"
      _hover={{ shadow: 'md' }}
    >
      <Flex justify="space-between" align="center" mb={3}>
        <Heading size="sm" fontWeight="semibold">{cv.name || `${cv.personal.firstName}'s CV`}</Heading>
        <Badge colorScheme="blue" fontSize="0.8em" borderRadius="full">
          {new Date(cv.lastUpdated).toLocaleDateString()}
        </Badge>
      </Flex>
      <Text fontSize="sm" color="gray.500" mb={3} noOfLines={2}>
        {cv.personal.title || 'No title specified'}
      </Text>
      <Divider mb={3} />
      <Flex justify="space-between">
        <HStack spacing={1}>
          <Button
            size="sm"
            leftIcon={<FaEdit />}
            variant="ghost"
            onClick={() => onEdit(cv.id)}
          >
            Edit
          </Button>
          <Button
            size="sm"
            leftIcon={<FaEye />}
            variant="ghost"
            onClick={() => onView(cv.id)}
          >
            View
          </Button>
        </HStack>
        <Button
          size="sm"
          colorScheme="red"
          variant="ghost"
          leftIcon={<FaTrash />}
          onClick={() => onDelete(cv.id)}
        >
          Delete
        </Button>
      </Flex>
    </Box>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { 
    cvs, 
    loading, 
    error, 
    fetchUserCVs,
    deleteCV
  } = useCV();

  const [userCVs, setUserCVs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load user's CVs on mount
    const loadCVs = async () => {
      try {
        await fetchUserCVs();
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load CVs:', error);
        // In development, use mock CVs if API fails
        setUserCVs(mockUserCVs);
        setIsLoading(false);
      }
    };

    loadCVs();
  }, [fetchUserCVs]);

  useEffect(() => {
    if (cvs && cvs.length) {
      setUserCVs(cvs);
    } else if (!loading && !error) {
      // If no CVs from API, use mock data in development
      setUserCVs(mockUserCVs);
    }
  }, [cvs, loading, error]);

  const stats = [
    { label: "CVs Created", value: userCVs.length || '0', helpText: "Total CVs" },
    { label: "Downloads", value: "12", helpText: "Total exports" },
    { label: "Profile Completion", value: "85%", helpText: "Update your profile" },
  ];

  const recentActivity = [
    { id: 1, action: "Updated CV", date: "2 days ago" },
    { id: 2, action: "Profile updated", date: "1 week ago" },
    { id: 3, action: "Downloaded PDF", date: "2 weeks ago" },
  ];

  const handleViewCV = (id) => {
    navigate(`/cv/preview?id=${id}`);
  };

  const handleEditCV = (id) => {
    navigate(`/cv/editor?id=${id}`);
  };

  const handleDeleteCV = async (id) => {
    if (window.confirm('Are you sure you want to delete this CV?')) {
      try {
        await deleteCV(id);
        setUserCVs(userCVs.filter(cv => cv.id !== id));
      } catch (error) {
        console.error('Failed to delete CV:', error);
      }
    }
  };

  const handleCreateCV = () => {
    navigate('/cv');
  };

  return (
    <Container maxW="container.xl" py={8}>
      <Box mb={8}>
        <Heading as="h1" size="xl" mb={2}>
          Welcome back, {user?.name || "User"}!
        </Heading>
        <Text color="gray.500">
          Manage your CVs, profile, and application preferences
        </Text>
      </Box>
      
      <Box 
        p={5} 
        mb={6} 
        bg="blue.50" 
        borderRadius="lg" 
        borderWidth="1px" 
        borderColor="blue.200"
        boxShadow="md"
      >
        <Flex direction={{ base: 'column', md: 'row' }} align="center" justify="space-between">
          <Box mb={{ base: 4, md: 0 }}>
            <Heading size="md" color="blue.700" mb={2}>
              New! Optimize Your CV for Specific Jobs
            </Heading>
            <Text>
              Our AI will match your CV to job descriptions, highlight relevant skills, and generate tailored cover letters.
            </Text>
          </Box>
          <Stack direction={{ base: 'column', md: 'row' }} spacing={3}>
            <Button 
              colorScheme="blue" 
              size="md"
              rightIcon={<FaUpload />}
              onClick={() => navigate('/cv/optimize')}
            >
              Upload & Optimize
            </Button>
            <Button 
              colorScheme="blue" 
              variant="outline"
              size="md"
              rightIcon={<FaMagic />}
              onClick={() => navigate('/cv/optimize')}
            >
              Optimize Existing CV
            </Button>
          </Stack>
        </Flex>
      </Box>
      
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={5} mb={10}>
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </SimpleGrid>
      
      <Box mb={10}>
        <Flex justify="space-between" align="center" mb={4}>
          <Heading as="h2" size="lg">Your CVs</Heading>
          <Button 
            leftIcon={<FaPlus />} 
            colorScheme="blue"
            onClick={handleCreateCV}
          >
            Create New CV
          </Button>
        </Flex>
        
        {isLoading ? (
          <Flex justify="center" py={10}>
            <Spinner size="xl" />
          </Flex>
        ) : userCVs && userCVs.length > 0 ? (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
            {userCVs.map((cv) => (
              <CVCard 
                key={cv.id} 
                cv={cv} 
                onView={handleViewCV}
                onEdit={handleEditCV}
                onDelete={handleDeleteCV}
              >
                <Button
                  leftIcon={<FaMagic />}
                  colorScheme="blue"
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/cv/optimize/${cv.id}`)}
                  mr={2}
                >
                  Optimize
                </Button>
              </CVCard>
            ))}
          </SimpleGrid>
        ) : (
          <Box 
            bg={useColorModeValue('white', 'gray.700')} 
            p={8} 
            borderRadius="md" 
            textAlign="center"
            borderWidth="1px"
          >
            <Heading size="md" mb={4}>You haven't created any CVs yet</Heading>
            <Text mb={6}>Create your first CV using our professional templates</Text>
            <Button 
              colorScheme="blue" 
              leftIcon={<FaPlus />}
              onClick={handleCreateCV}
            >
              Create Your First CV
            </Button>
          </Box>
        )}
      </Box>
      
      <Box mb={12}>
        <Heading as="h2" size="lg" mb={6}>
          Quick Actions
        </Heading>
        
        <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={6} mb={4}>
          {/* Featured Card: CV Optimization */}
          <Box 
            p={6} 
            borderWidth="1px"
            borderRadius="lg"
            boxShadow="lg"
            bg="blue.50"
            borderColor="blue.200"
            _hover={{ transform: 'translateY(-5px)', boxShadow: 'xl' }}
            transition="all 0.3s"
          >
            <VStack spacing={4} align="center">
              <Icon as={FaMagic} boxSize={14} color="blue.500" />
              <Heading size="md" textAlign="center">Optimize CV for Job Applications</Heading>
              <Text textAlign="center">
                Match your CV to specific job descriptions, highlight relevant skills, and generate customized cover letters.
              </Text>
              <HStack spacing={4} mt={2}>
                <Button
                  colorScheme="blue"
                  onClick={() => navigate('/cv/optimize')}
                  rightIcon={<FaUpload />}
                >
                  Upload & Optimize
                </Button>
                <Button
                  variant="outline"
                  colorScheme="blue"
                  onClick={() => navigate('/cv/optimize')}
                >
                  Select CV
                </Button>
              </HStack>
            </VStack>
          </Box>
          
          {/* Regular Actions Grid */}
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <DashboardTile
              title="Profile"
              icon={FaUser}
              description="Update your personal information and skills"
              onClick={() => navigate('/profile')}
            />
            <DashboardTile
              title="CV Builder"
              icon={FaFileAlt}
              description="Create or edit your professional CVs"
              onClick={handleCreateCV}
            />
            <DashboardTile
              title="Export Options"
              icon={FaDownload}
              description="Download your CVs in various formats"
              onClick={() => navigate('/cv')}
            />
            <DashboardTile
              title="Settings"
              icon={FaCog}
              description="Customize your application settings"
              onClick={() => navigate('/settings')}
            />
          </SimpleGrid>
        </SimpleGrid>
      </Box>
      
      <Box>
        <Heading as="h2" size="lg" mb={4}>
          Recent Activity
        </Heading>
        <Box 
          borderWidth="1px" 
          borderRadius="lg" 
          overflow="hidden"
          bg={useColorModeValue('white', 'gray.700')}
        >
          <VStack align="stretch" divider={<Box borderBottomWidth="1px" />}>
            {recentActivity.map((activity) => (
              <Flex 
                key={activity.id} 
                justify="space-between" 
                p={4}
              >
                <Text fontWeight="medium">{activity.action}</Text>
                <Text color="gray.500">{activity.date}</Text>
              </Flex>
            ))}
          </VStack>
          <Button variant="ghost" w="full" borderTopRadius={0}>
            View All Activity
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default Dashboard; 