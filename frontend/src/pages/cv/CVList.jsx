import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Image,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription
} from '@chakra-ui/react';
import { cvService } from '../../api';
import useApi from '../../hooks/useApi';

// CV List Component - demonstrates using the useApi hook
const CVList = () => {
  const navigate = useNavigate();
  
  // Use our custom hook for API calls
  const cvApi = useApi({
    showToast: true,
    errorToastTitle: 'CV Service Error'
  });
  
  // Second instance for templates (showing multiple hooks usage)
  const templateApi = useApi({
    showToast: true,
    errorToastTitle: 'Template Error'
  });
  
  // Load CVs when component mounts
  useEffect(() => {
    loadCVs();
    loadTemplates();
  }, []);
  
  // Load user CVs with the hook
  const loadCVs = async () => {
    await cvApi.execute(
      () => cvService.getUserCVs(),
      {
        errorMessage: 'Failed to load your CVs. Please try again later.',
        retryOnNetworkError: true
      }
    );
  };
  
  // Load templates with the hook
  const loadTemplates = async () => {
    await templateApi.execute(
      () => cvService.getTemplates(),
      {
        errorMessage: 'Failed to load CV templates. Please try again later.'
      }
    );
  };
  
  // View a CV
  const viewCV = (cvId) => {
    navigate(`/cv/view/${cvId}`);
  };
  
  // Edit a CV
  const editCV = (cvId) => {
    navigate(`/cv/edit/${cvId}`);
  };
  
  // Render CV card
  const renderCVCard = (cv, templates) => (
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
            Template: {templates?.find(t => t.id === cv.template_id)?.name || cv.template_id}
          </Text>
        </Stack>
      </CardBody>
      <CardFooter>
        <Flex justify="space-between" width="100%">
          <Button
            colorScheme="blue"
            variant="outline"
            onClick={() => editCV(cv.id)}
          >
            Edit
          </Button>
          <Button
            colorScheme="green"
            variant="outline"
            onClick={() => viewCV(cv.id)}
          >
            View
          </Button>
        </Flex>
      </CardFooter>
    </Card>
  );
  
  // Get CVs from the hook data
  const cvs = cvApi.data?.items || [];
  const templates = templateApi.data?.items || [];
  
  return (
    <Box p={5}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading>My CVs</Heading>
        <Button 
          colorScheme="blue" 
          onClick={() => navigate('/cv')}
        >
          CV Dashboard
        </Button>
      </Flex>
      
      {/* Show error if API call failed */}
      {cvApi.error && (
        <Alert status="error" mb={6} rounded="md">
          <AlertIcon />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{cvApi.error}</AlertDescription>
        </Alert>
      )}
      
      {/* Show loading state */}
      {cvApi.loading ? (
        <Flex justify="center" align="center" height="200px">
          <Spinner size="xl" color="blue.500" />
        </Flex>
      ) : cvs.length > 0 ? (
        <SimpleGrid columns={[1, 2, 3]} spacing={10}>
          {cvs.map(cv => renderCVCard(cv, templates))}
        </SimpleGrid>
      ) : (
        <Box textAlign="center" py={10} px={6} bg="gray.50" rounded="md">
          <Text fontSize="lg" mb={4}>
            You haven't created any CVs yet.
          </Text>
          <Button 
            colorScheme="blue" 
            onClick={() => navigate('/cv')}
            mt={2}
          >
            Create Your First CV
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default CVList; 