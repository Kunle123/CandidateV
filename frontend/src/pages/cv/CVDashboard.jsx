import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, 
  Heading, 
  SimpleGrid,
  Button, 
  Text, 
  Flex, 
  Card, 
  CardBody, 
  CardFooter,
  Stack,
  Badge,
  Image,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  HStack,
  VStack,
  Container,
  Icon,
  useColorModeValue,
  Divider
} from '@chakra-ui/react';
import { cvService, exportService } from '../../api';
import { retryApiCall, formatApiError } from '../../api/utils';
import { FaMagic, FaFileAlt, FaSearch, FaArrowRight } from 'react-icons/fa';
import { keyframes } from '@emotion/react';

// CSS keyframes for pulsing effect
const pulseAnimation = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(49, 130, 206, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(49, 130, 206, 0); }
  100% { box-shadow: 0 0 0 0 rgba(49, 130, 206, 0); }
`;

// CV Dashboard - shows user's CVs and CV templates
const CVDashboard = () => {
  const [userCVs, setUserCVs] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loadingCVs, setLoadingCVs] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const toast = useToast();
  const location = useLocation();
  const [highlightOptimization, setHighlightOptimization] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const action = params.get('action');
    
    if (action === 'optimize') {
      setHighlightOptimization(true);
      setTimeout(() => {
        const optimizationSection = document.getElementById('optimization-section');
        if (optimizationSection) {
          optimizationSection.scrollIntoView({ behavior: 'smooth' });
          
          optimizationSection.style.boxShadow = '0 0 0 2px #3182CE';
          setTimeout(() => {
            optimizationSection.style.boxShadow = 'none';
            optimizationSection.style.transition = 'box-shadow 0.5s ease-out';
          }, 2000);
        }
      }, 300);
    }
  }, [location.search]);

  // Fetch data on component mount
  useEffect(() => {
    loadUserCVs();
    loadTemplates();
  }, []);

  // Load user's CVs with retry on network errors
  const loadUserCVs = async () => {
    setLoadingCVs(true);
    setError(null);
    
    try {
      // Using retry utility for better reliability
      const result = await retryApiCall(
        () => cvService.getUserCVs(),
        { maxRetries: 3 }
      );
      
      if (result.success) {
        setUserCVs(result.data.items || []);
      } else {
        setError(`Failed to load CVs: ${result.error}`);
        toast({
          title: 'Error loading CVs',
          description: formatApiError(result.error),
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (err) {
      setError(`Error: ${formatApiError(err)}`);
    } finally {
      setLoadingCVs(false);
    }
  };

  // Load CV templates
  const loadTemplates = async () => {
    setLoadingTemplates(true);
    
    try {
      const result = await cvService.getTemplates();
      
      if (result.success) {
        setTemplates(result.data.items || []);
      } else {
        toast({
          title: 'Error loading templates',
          description: result.error,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (err) {
      console.error('Failed to load templates:', err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  // Create a new CV with selected template
  const createNewCV = async (templateId) => {
    try {
      const result = await cvService.createCV({
        title: 'New CV',
        template_id: templateId,
        content: {
          personal_info: {
            name: '',
            email: '',
            phone: '',
            address: ''
          },
          summary: '',
          experience: [],
          education: [],
          skills: []
        }
      });
      
      if (result.success) {
        toast({
          title: 'CV created',
          description: 'Your new CV has been created successfully.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        navigate(`/cv/edit/${result.data.id}`);
      } else {
        toast({
          title: 'Error creating CV',
          description: result.error,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: formatApiError(err),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Export CV
  const exportCV = async (cvId, format = 'pdf') => {
    try {
      const result = await exportService.createExport({
        cv_id: cvId,
        format: format
      });
      
      if (result.success) {
        const exportId = result.data.id;
        
        // Poll for export completion
        const checkExportStatus = async () => {
          const statusResult = await exportService.getExportJob(exportId);
          
          if (statusResult.success) {
            if (statusResult.data.status === 'completed') {
              // Download the exported file
              await exportService.downloadExport(exportId);
              
              toast({
                title: 'Export completed',
                description: `Your CV has been exported as ${format.toUpperCase()}.`,
                status: 'success',
                duration: 3000,
                isClosable: true,
              });
            } else if (statusResult.data.status === 'failed') {
              toast({
                title: 'Export failed',
                description: 'Failed to export your CV. Please try again.',
                status: 'error',
                duration: 5000,
                isClosable: true,
              });
            } else {
              // Still processing, check again after a delay
              setTimeout(checkExportStatus, 1000);
            }
          }
        };
        
        // Start polling
        checkExportStatus();
      } else {
        toast({
          title: 'Error exporting CV',
          description: result.error,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (err) {
      toast({
        title: 'Export error',
        description: formatApiError(err),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Open CV editor with Job Match tab active
  const optimizeCV = (cvId) => {
    navigate(`/cv/optimize/${cvId}`);
  };

  // Render template card
  const renderTemplateCard = (template) => (
    <Card 
      key={template.id} 
      maxW="sm" 
      borderWidth="1px" 
      borderRadius="lg"
      overflow="hidden"
      height="100%"
      boxShadow="md"
      _hover={{ boxShadow: 'lg', transform: 'translateY(-5px)' }}
      transition="all 0.3s"
    >
      <Image
        src={template.thumbnail_url || 'https://via.placeholder.com/300x200?text=Template'}
        alt={template.name}
        height="200px"
        objectFit="cover"
      />
      <CardBody>
        <Stack spacing="3">
          <Flex justify="space-between" align="center">
            <Heading size="md">{template.name}</Heading>
            {template.is_premium && (
              <Badge colorScheme="purple" ml="1">
                Premium
              </Badge>
            )}
          </Flex>
          <Text>{template.description}</Text>
        </Stack>
      </CardBody>
      <CardFooter>
        <Button
          colorScheme="blue"
          variant="solid"
          onClick={() => createNewCV(template.id)}
          width="100%"
        >
          Use This Template
        </Button>
      </CardFooter>
    </Card>
  );

  // Render CV card
  const renderCVCard = (cv) => (
    <Card 
      key={cv.id} 
      maxW="sm" 
      borderWidth="1px" 
      borderRadius="lg"
      overflow="hidden"
      height="100%"
      boxShadow="md"
      _hover={{ boxShadow: 'lg' }}
      transition="all 0.3s"
    >
      <CardBody>
        <Stack spacing="3">
          <Heading size="md">{cv.title}</Heading>
          <Text>Last modified: {new Date(cv.last_modified).toLocaleDateString()}</Text>
          <Text fontSize="sm" color="gray.600">
            Template: {templates.find(t => t.id === cv.template_id)?.name || cv.template_id}
          </Text>
        </Stack>
      </CardBody>
      <CardFooter>
        <Flex justify="space-between" width="100%">
          <Button
            colorScheme="blue"
            variant="outline"
            onClick={() => navigate(`/cv/edit/${cv.id}`)}
          >
            Edit
          </Button>
          <Button
            colorScheme="green"
            variant="outline"
            onClick={() => navigate(`/cv/view/${cv.id}`)}
          >
            View
          </Button>
          <Button
            colorScheme="purple"
            variant="outline"
            onClick={() => exportCV(cv.id, 'pdf')}
          >
            Export
          </Button>
        </Flex>
      </CardFooter>
    </Card>
  );

  // Color mode values
  const highlightBg = useColorModeValue('brand.50', 'brand.900');
  const borderColor = useColorModeValue('brand.200', 'brand.700');

  return (
    <Box p={5}>
      {error && (
        <Alert status="error" mb={6} rounded="md">
          <AlertIcon />
          <AlertTitle>Error loading data</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* New Prominent Optimize CV Button */}
      <Box 
        mb={8} 
        p={6} 
        borderWidth="2px" 
        borderRadius="lg" 
        borderColor="brand.400"
        bg={useColorModeValue('brand.50', 'gray.800')}
        boxShadow="md"
      >
        <VStack spacing={4}>
          <Heading size="lg" textAlign="center" color="brand.700">
            Optimize Your CV for Specific Jobs
          </Heading>
          
          <Text fontSize="lg" textAlign="center">
            Match your CV to job descriptions, highlight relevant skills, and generate tailored cover letters
          </Text>
          
          <Button
            size="lg"
            colorScheme="brand"
            rightIcon={<FaMagic />}
            onClick={() => navigate('/cv/optimize')}
            mt={4}
            px={8}
            py={7}
            fontSize="lg"
          >
            Optimize a CV
          </Button>
        </VStack>
      </Box>

      {/* CV Optimization Feature Section */}
      {userCVs.length > 0 && (
        <Box 
          id="optimization-section"
          mb={10} 
          p={6} 
          borderWidth="1px" 
          borderRadius="lg" 
          borderColor={borderColor}
          bg={highlightBg}
          animation={highlightOptimization ? `${pulseAnimation} 1.5s ease-in-out 3` : undefined}
          sx={{
            scrollMarginTop: "2rem"
          }}
        >
          <Container maxW="6xl">
            <VStack spacing={6} align="stretch">
              <Heading size="lg" textAlign="center">
                Optimize Your CV for Specific Jobs
              </Heading>
              
              <Text fontSize="lg" textAlign="center">
                Our AI will match your CV to job descriptions, highlighting relevant skills and using the right keywords to increase your interview chances.
              </Text>
              
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10} pt={2}>
                <VStack align="center" p={4}>
                  <Icon as={FaSearch} w={10} h={10} color="brand.500" mb={3} />
                  <Heading size="md">Job Matching</Heading>
                  <Text textAlign="center">
                    Match your experience to job requirements by reordering content and emphasizing relevant skills
                  </Text>
                </VStack>
                
                <VStack align="center" p={4}>
                  <Icon as={FaMagic} w={10} h={10} color="brand.500" mb={3} />
                  <Heading size="md">Keyword Optimization</Heading>
                  <Text textAlign="center">
                    Identify and incorporate key terms from job descriptions to pass ATS screening systems
                  </Text>
                </VStack>
                
                <VStack align="center" p={4}>
                  <Icon as={FaFileAlt} w={10} h={10} color="brand.500" mb={3} />
                  <Heading size="md">Cover Letter Generation</Heading>
                  <Text textAlign="center">
                    Generate customized cover letters that complement your optimized CV
                  </Text>
                </VStack>
              </SimpleGrid>
              
              <Divider my={3} />
              
              <Heading size="md" mb={4}>Select a CV to optimize:</Heading>
              
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={5}>
                {userCVs.slice(0, 3).map(cv => (
                  <Card 
                    key={cv.id} 
                    variant="outline" 
                    borderColor="brand.300"
                    _hover={{ 
                      shadow: 'md',
                      borderColor: 'brand.500',
                      transform: 'translateY(-2px)'
                    }}
                    transition="all 0.2s"
                  >
                    <CardBody>
                      <HStack justifyContent="space-between">
                        <VStack align="start" spacing={0}>
                          <Heading size="sm">{cv.title}</Heading>
                          <Text fontSize="xs" color="gray.500">
                            Last modified: {new Date(cv.last_modified).toLocaleDateString()}
                          </Text>
                        </VStack>
                        <Button
                          rightIcon={<FaArrowRight />}
                          colorScheme="brand"
                          onClick={() => optimizeCV(cv.id)}
                          size="sm"
                        >
                          Optimize
                        </Button>
                      </HStack>
                    </CardBody>
                  </Card>
                ))}
              </SimpleGrid>
              
              {userCVs.length > 3 && (
                <Button 
                  alignSelf="center"
                  variant="link"
                  colorScheme="blue"
                  onClick={() => document.getElementById('my-cvs').scrollIntoView({ behavior: 'smooth' })}
                >
                  View All CVs
                </Button>
              )}
            </VStack>
          </Container>
        </Box>
      )}

      <Heading mb={6} id="my-cvs">My CVs</Heading>
      
      {loadingCVs ? (
        <Flex justify="center" align="center" height="200px">
          <Spinner size="xl" color="blue.500" />
        </Flex>
      ) : userCVs.length > 0 ? (
        <SimpleGrid columns={[1, 2, 3]} spacing={10} mb={10}>
          {userCVs.map(renderCVCard)}
        </SimpleGrid>
      ) : (
        <Box textAlign="center" py={10} px={6} mb={10} bg="gray.50" rounded="md">
          <Text fontSize="lg" mb={4}>
            You haven't created any CVs yet.
          </Text>
          <Text mb={4} color="gray.600">
            Get started by selecting one of the templates below.
          </Text>
        </Box>
      )}

      <Heading mb={6} mt={10}>Available Templates</Heading>
      
      {loadingTemplates ? (
        <Flex justify="center" align="center" height="200px">
          <Spinner size="xl" color="blue.500" />
        </Flex>
      ) : (
        <SimpleGrid columns={[1, 2, 3]} spacing={10}>
          {templates.map(renderTemplateCard)}
        </SimpleGrid>
      )}
    </Box>
  );
};

export default CVDashboard; 