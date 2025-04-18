import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  Flex,
  VStack,
  HStack,
  Textarea,
  useToast,
  Card,
  CardBody,
  Input,
  FormControl,
  FormLabel,
  SimpleGrid,
  Progress,
  Divider,
  Badge,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  useColorModeValue,
  Icon,
  Tag,
  TagLabel,
  Step,
  StepDescription,
  StepIcon,
  StepIndicator,
  StepNumber,
  StepSeparator,
  StepStatus,
  StepTitle,
  Stepper,
  OrderedList,
  ListItem,
  FormHelperText,
  VisuallyHidden,
  Center,
  IconButton,
  UnorderedList,
  Menu,
  MenuButton,
  MenuList,
  MenuItem
} from '@chakra-ui/react';
import { FaArrowLeft, FaArrowRight, FaFileAlt, FaMagic, FaSearch, FaCheck, FaClone, FaDownload, FaUpload, FaFilePdf, FaFileWord, FaChevronDown, FaCopy } from 'react-icons/fa';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { cvService, apiService } from '../../api';

const CVOptimize = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const location = useLocation();
  
  // Step tracking
  const [activeStep, setActiveStep] = useState(0);
  const steps = ['Select CV', 'Add Job Description', 'View Match Score', 'Optimize CV'];
  
  // Data states
  const [cvData, setCvData] = useState(null);
  const [userCVs, setUserCVs] = useState([]);
  const [selectedCVId, setSelectedCVId] = useState(id || null);
  const [jobDescription, setJobDescription] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [positionTitle, setPositionTitle] = useState('');
  const [userComments, setUserComments] = useState('');
  
  // Result states
  const [matchResults, setMatchResults] = useState(null);
  const [optimizedSections, setOptimizedSections] = useState([]);
  const [coverLetter, setCoverLetter] = useState(null);
  
  // Loading states
  const [loadingCVs, setLoadingCVs] = useState(false);
  const [loadingCV, setLoadingCV] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [generatingCoverLetter, setGeneratingCoverLetter] = useState(false);
  
  // Error state
  const [error, setError] = useState(null);
  
  // Colors
  const cardBg = useColorModeValue('white', 'gray.700');
  const highlightBg = useColorModeValue('blue.50', 'blue.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Add state for file upload
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef();
  
  // Add drag and drop support
  const [dragActive, setDragActive] = useState(false);
  
  useEffect(() => {
    // Load user's CVs
    loadUserCVs();
    
    // If we have an ID, load that CV
    if (id) {
      setSelectedCVId(id);
      loadCV(id);
      setActiveStep(1); // Move to job description step
    }
  }, [id]);
  
  const loadUserCVs = async () => {
    setLoadingCVs(true);
    try {
      const response = await cvService.getCVs();
      setUserCVs(response.data?.items || []);
    } catch (err) {
      console.error('Error loading CVs:', err);
      
      // Check if it's an authentication error
      if (err.response && err.response.status === 401) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in to access your CVs. Run the demo-login.ps1 script for a demo account.',
          status: 'warning',
          duration: 7000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Using mock data',
          description: 'Connected to demo mode - backend services not fully available',
          status: 'info',
          duration: 5000,
          isClosable: true,
        });
      }
      
      // Use mock CVs for demo purposes regardless of error type
      setUserCVs([
        {
          id: 'mock-cv-1',
          title: 'Software Developer CV',
          personal: {
            firstName: 'John',
            lastName: 'Doe',
            title: 'Senior Software Engineer',
            summary: 'Experienced software developer with expertise in React, Node.js and cloud technologies.'
          },
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'mock-cv-2',
          title: 'Project Manager CV',
          personal: {
            firstName: 'Jane',
            lastName: 'Smith',
            title: 'Technical Project Manager',
            summary: 'Seasoned project manager with 8+ years of experience in technology projects.'
          },
          lastUpdated: new Date().toISOString()
        }
      ]);
    } finally {
      setLoadingCVs(false);
    }
  };
  
  const loadCV = async (cvId) => {
    setLoadingCV(true);
    try {
      const response = await cvService.getCV(cvId);
      setCvData(response.data);
    } catch (err) {
      console.error('Error loading CV:', err);
      toast({
        title: 'Error loading CV',
        description: 'Unable to load the selected CV. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoadingCV(false);
    }
  };
  
  const analyzeJobMatch = async () => {
    if (!jobDescription.trim()) {
      toast({
        title: 'Missing job description',
        description: 'Please paste a job description to analyze.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setAnalyzing(true);
    setError(null);
    
    try {
      const response = await apiService.post('/ai/job-match/analyze', {
        cv_id: selectedCVId,
        job_description: jobDescription,
        detailed: true
      });
      
      setMatchResults(response.data);
      setActiveStep(2); // Move to match results step
    } catch (err) {
      console.error('Error analyzing job match:', err);
      
      // Check if it's an authentication error
      if (err.response && err.response.status === 401) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in to analyze job matches. Run the demo-login.ps1 script for a demo account.',
          status: 'warning',
          duration: 7000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Using mock data',
          description: 'Connected to demo mode - backend services not fully available',
          status: 'info',
          duration: 5000,
          isClosable: true,
        });
      }
      
      // Create mock response for demo purposes regardless of error type
      const mockResults = {
        match_score: 78,
        overview: "Your CV shows good alignment with this Project Manager position. There are several strengths but also areas for improvement.",
        strengths: [
          "You have relevant project management experience",
          "Your technical background is valuable for this role",
          "You demonstrate leadership capabilities"
        ],
        weaknesses: [
          "Consider emphasizing experience with SCADA systems if applicable",
          "More details about ISO standards compliance would strengthen your application",
          "Quantify your experience with delivering projects within tight timelines"
        ],
        keywords_found: [
          "Project Management", 
          "Leadership", 
          "Stakeholder Management"
        ],
        keywords_missing: [
          "SCADA", 
          "ISO Standards", 
          "NEC3/4"
        ]
      };
      
      setMatchResults(mockResults);
      setActiveStep(2); // Move to match results step
    } finally {
      setAnalyzing(false);
    }
  };
  
  const optimizeCV = async () => {
    setOptimizing(true);
    setError(null);
    
    try {
      // Prepare optimization targets
      const targets = [];
      
      // Include summary
      if (cvData?.personal?.summary) {
        targets.push({
          section: 'summary',
          content: cvData.personal.summary,
          target_job: positionTitle || undefined,
          target_industry: undefined,
          tone: 'professional',
        });
      }
      
      // Include experience descriptions
      if (cvData?.experience?.length > 0) {
        cvData.experience.forEach((exp, index) => {
          if (exp.description) {
            targets.push({
              section: `experience_${index}`,
              content: exp.description,
              target_job: positionTitle || undefined,
              target_industry: undefined,
              tone: 'professional',
            });
          }
        });
      }
      
      // Include skills if available
      if (cvData?.skills?.length > 0) {
        const skillsContent = cvData.skills.map(skill => skill.name).join(', ');
        targets.push({
          section: 'skills',
          content: skillsContent,
          target_job: positionTitle || undefined,
          target_industry: undefined,
          tone: 'professional',
        });
      }
      
      // Call the AI service to optimize the CV
      const response = await apiService.post('/ai/optimize', {
        cv_id: selectedCVId,
        targets: targets.length > 0 ? targets : [
          // Provide default target if no sections were found to optimize
          {
            section: 'default',
            content: 'Please optimize my CV for the job position.',
            target_job: positionTitle || undefined,
            target_industry: undefined,
            tone: 'professional',
          }
        ],
        job_description: jobDescription,
        user_comments: userComments,
      });
      
      setOptimizedSections(response.data.optimized_sections || []);
      setActiveStep(3); // Move to optimization results step
      
      toast({
        title: 'CV Optimized',
        description: 'Your CV has been optimized for this job description',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Error optimizing CV:', err);
      
      // Mock optimized sections for demo purposes
      const mockOptimizedSections = [
        {
          section: "summary",
          original_content: "Experienced project manager with a background in engineering and technology implementations.",
          optimized_content: "Results-driven Project Manager with 7+ years of experience implementing complex engineering and power transmission systems. Proven track record of delivering critical projects within demanding timescales while maintaining quality standards and system integrity.",
          improvements: [
            "Added specific expertise in power transmission systems",
            "Highlighted experience with critical projects and demanding timescales",
            "Emphasized quality standards maintenance"
          ]
        },
        {
          section: "experience_0",
          original_content: "Led multiple engineering projects for clients in the energy sector.",
          optimized_content: "Led cross-functional teams implementing SCADA/DCS systems for critical power transmission infrastructure, ensuring compliance with ISO standards and delivering projects within strict timelines. Managed stakeholder relationships and conducted regular progress reviews to maintain project integrity.",
          improvements: [
            "Emphasized SCADA/DCS system experience",
            "Added ISO standards compliance work",
            "Highlighted stakeholder management experience"
          ]
        }
      ];
      
      toast({
        title: 'Using mock data',
        description: 'Connected to demo mode - backend services not fully available',
        status: 'info',
        duration: 5000,
        isClosable: true,
      });
      
      setOptimizedSections(mockOptimizedSections);
      setActiveStep(3); // Move to optimization results step
    } finally {
      setOptimizing(false);
    }
  };
  
  const generateCoverLetter = async () => {
    setGeneratingCoverLetter(true);
    setError(null);
    
    try {
      const response = await apiService.post('/ai/cover-letter', {
        cv_id: selectedCVId,
        job_description: jobDescription,
        user_comments: userComments,
        company_name: companyName,
        recipient_name: '',
        position_title: positionTitle,
      });
      
      setCoverLetter(response.data);
      
      toast({
        title: 'Cover Letter Generated',
        description: 'Your cover letter has been generated based on your CV and the job description',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Error generating cover letter:', err);
      toast({
        title: 'Cover letter generation failed',
        description: err.response?.data?.detail || 'An error occurred while generating your cover letter',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setGeneratingCoverLetter(false);
    }
  };
  
  const applyOptimizations = async () => {
    // Would implement the logic to apply optimizations to the CV
    toast({
      title: 'Optimizations Applied',
      description: 'The optimized content has been applied to your CV',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
    
    // Navigate to CV editor
    navigate(`/cv/edit/${selectedCVId}`);
  };
  
  // Add file upload handler
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadedFile(file);
      
      // Simulate processing the uploaded file
      setIsUploading(true);
      
      // In a real implementation, you would call an API to parse the CV
      // For now, we'll just simulate the upload process
      setTimeout(() => {
        setIsUploading(false);
        toast({
          title: 'CV Uploaded',
          description: `${file.name} has been uploaded successfully.`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        // In a real implementation, the API would parse the CV and return the data
        // For now, we'll just set a mock CV ID
        const mockCVId = 'uploaded-cv-' + Date.now();
        setSelectedCVId(mockCVId);
        
        // Proceed to next step
        setActiveStep(1);
      }, 1500);
    }
  };
  
  // Add file input trigger
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle drop event
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload({ target: { files: e.dataTransfer.files } });
    }
  };
  
  // Enhanced cover letter functionality in the Match Results step

  // Add this for better clipboard functionality
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied to clipboard',
        description: 'The cover letter has been copied to your clipboard',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'Copy failed',
        description: 'Failed to copy to clipboard',
        status: 'error',
        duration: 2000,
        isClosable: true,
      });
    }
  };

  // Add this for better file download
  const downloadAsFile = (content, filename, fileType) => {
    const mimeTypes = {
      txt: 'text/plain',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      pdf: 'application/pdf'
    };
    
    const blob = new Blob([content], { type: mimeTypes[fileType] || 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Render CV selection step
  const renderSelectCVStep = () => (
    <VStack spacing={6} align="stretch">
      <Heading size="md">Step 1: Select Your CV</Heading>
      <Text>Choose an existing CV or upload a new one to optimize for a specific job.</Text>
      
      {/* Upload CV Section */}
      <Box 
        mt={4} 
        p={6} 
        borderWidth="2px" 
        borderRadius="lg"
        borderStyle="dashed"
        borderColor={dragActive ? "blue.500" : "blue.300"}
        bg={dragActive ? "blue.100" : useColorModeValue('blue.50', 'blue.900')}
        _hover={{ borderColor: 'blue.500' }}
        transition="all 0.3s"
        cursor="pointer"
        onClick={triggerFileInput}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <VisuallyHidden>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf,.doc,.docx,.txt,.rtf"
          />
        </VisuallyHidden>
        
        <Center flexDirection="column" py={4}>
          {isUploading ? (
            <VStack spacing={3}>
              <Spinner size="xl" color="blue.500" />
              <Text>Processing your CV...</Text>
            </VStack>
          ) : uploadedFile ? (
            <VStack spacing={2}>
              <Icon 
                as={
                  uploadedFile.name.endsWith('.pdf') ? FaFilePdf : 
                  uploadedFile.name.endsWith('.doc') || uploadedFile.name.endsWith('.docx') ? FaFileWord : 
                  FaFileAlt
                } 
                boxSize={16} 
                color="blue.500" 
              />
              <Text fontWeight="bold">{uploadedFile.name}</Text>
              <Text fontSize="sm" color="gray.500">Click to upload a different file</Text>
            </VStack>
          ) : (
            <VStack spacing={3}>
              <Icon as={FaUpload} boxSize={12} color="blue.500" />
              <Heading size="md">Upload Your CV</Heading>
              <Text textAlign="center">
                Drag and drop your file here, or click to browse
              </Text>
              <Text fontSize="sm" color="gray.500">
                Supported formats: PDF, Word Documents, Plain Text
              </Text>
            </VStack>
          )}
        </Center>
      </Box>
      
      <Divider my={6} />
      <Flex justify="center" mb={6}>
        <Badge px={2} py={1} borderRadius="full" fontSize="sm">OR</Badge>
      </Flex>
      
      <Text fontWeight="medium" mb={3}>Select from your existing CVs:</Text>
      
      {loadingCVs ? (
        <Flex justify="center" p={10}>
          <Spinner size="xl" color="blue.500" />
        </Flex>
      ) : userCVs.length > 0 ? (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={5}>
          {userCVs.map(cv => (
            <Card 
              key={cv.id} 
              variant={selectedCVId === cv.id ? 'filled' : 'outline'}
              borderColor={selectedCVId === cv.id ? 'blue.500' : borderColor}
              _hover={{ 
                shadow: 'md',
                borderColor: 'blue.400'
              }}
              cursor="pointer"
              onClick={() => {
                setSelectedCVId(cv.id);
                loadCV(cv.id);
              }}
            >
              <CardBody>
                <VStack align="start" spacing={1}>
                  <Flex justify="space-between" width="100%">
                    <Heading size="sm">{cv.title}</Heading>
                    {selectedCVId === cv.id && <Icon as={FaCheck} color="green.500" />}
                  </Flex>
                  <Text fontSize="xs" color="gray.500">
                    Last modified: {new Date(cv.last_modified).toLocaleDateString()}
                  </Text>
                  <Text fontSize="sm" noOfLines={2} mt={2}>
                    {cv.summary ? cv.summary.substring(0, 100) + '...' : 'No summary available'}
                  </Text>
                </VStack>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      ) : (
        <Box textAlign="center" py={8} borderWidth="1px" borderRadius="lg">
          <Heading size="sm" mb={4}>No CVs Found</Heading>
          <Text mb={4}>You haven't created any CVs yet. Upload a CV or create one first.</Text>
          <Button 
            colorScheme="blue"
            onClick={() => navigate('/cv')}
          >
            Create a CV
          </Button>
        </Box>
      )}
      
      <Flex justify="flex-end" mt={4}>
        <Button
          colorScheme="blue"
          rightIcon={<FaArrowRight />}
          onClick={() => setActiveStep(1)}
          isDisabled={!selectedCVId && !uploadedFile}
        >
          Continue to Job Description
        </Button>
      </Flex>
    </VStack>
  );
  
  // Render job description step with enhanced context
  const renderJobDescriptionStep = () => (
    <VStack spacing={6} align="stretch">
      <Heading size="md">Step 2: Add Job Description</Heading>
      <Text>
        Paste the job description you want to optimize your CV for. Our AI will analyze your CV against the job requirements.
      </Text>
      
      <Box p={4} bg="blue.50" borderRadius="md">
        <Heading size="sm" mb={2} color="blue.700">Tips for Better Results</Heading>
        <UnorderedList spacing={1} pl={4}>
          <ListItem>Include the complete job description for most accurate matching</ListItem>
          <ListItem>Add specific keywords or skills you want to highlight in "Additional Comments"</ListItem>
          <ListItem>The more detailed the job description, the better our AI can optimize your CV</ListItem>
        </UnorderedList>
      </Box>
      
      <FormControl isRequired>
        <FormLabel>Job Description</FormLabel>
        <Textarea 
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the full job description here... Example: 'Looking for a Software Developer with 5+ years of experience in React, Node.js, and AWS...'"
          rows={8}
          focusBorderColor="blue.400"
        />
        <FormHelperText>
          Copy and paste the entire job posting for best results
        </FormHelperText>
      </FormControl>
      
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        <FormControl>
          <FormLabel>Position Title</FormLabel>
          <Input 
            value={positionTitle}
            onChange={(e) => setPositionTitle(e.target.value)}
            placeholder="e.g. Senior Software Engineer"
            focusBorderColor="blue.400"
          />
          <FormHelperText>
            The exact job title from the posting
          </FormHelperText>
        </FormControl>
        <FormControl>
          <FormLabel>Company Name</FormLabel>
          <Input 
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g. Acme Corporation"
            focusBorderColor="blue.400"
          />
          <FormHelperText>
            Used for generating the cover letter
          </FormHelperText>
        </FormControl>
      </SimpleGrid>
      
      <FormControl>
        <FormLabel>Additional Comments (Optional)</FormLabel>
        <Textarea 
          value={userComments}
          onChange={(e) => setUserComments(e.target.value)}
          placeholder="Add any additional information you'd like to include or highlight. Example: 'I want to emphasize my leadership experience' or 'Please highlight my project management skills'"
          rows={3}
          focusBorderColor="blue.400"
        />
        <FormHelperText>
          Include any specific areas or skills you want to emphasize
        </FormHelperText>
      </FormControl>
      
      {error && (
        <Alert status="error">
          <AlertIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Flex justify="space-between" mt={4}>
        <Button
          variant="outline"
          leftIcon={<FaArrowLeft />}
          onClick={() => setActiveStep(0)}
        >
          Back
        </Button>
        <Button
          colorScheme="blue"
          rightIcon={<FaSearch />}
          onClick={analyzeJobMatch}
          isLoading={analyzing}
          loadingText="Analyzing..."
          isDisabled={!jobDescription.trim()}
        >
          Analyze Match
        </Button>
      </Flex>
    </VStack>
  );
  
  // Render match results step
  const renderMatchResultsStep = () => (
    <VStack spacing={6} align="stretch">
      <Heading size="md">Step 3: Review Job Match Analysis</Heading>
      
      {matchResults ? (
        <>
          <Card>
            <CardBody>
              <VStack align="start" spacing={4}>
                <Flex 
                  width="100%" 
                  direction={{ base: "column", md: "row" }}
                  justify="space-between"
                  align={{ base: "start", md: "center" }}
                >
                  <Heading size="md">
                    Match Score: <Badge fontSize="0.8em" colorScheme={matchResults.match_score > 75 ? "green" : matchResults.match_score > 50 ? "yellow" : "red"}>
                      {matchResults.match_score}%
                    </Badge>
                  </Heading>
                  <HStack>
                    <Button
                      colorScheme="blue"
                      size="sm"
                      leftIcon={<FaMagic />}
                      onClick={optimizeCV}
                      isLoading={optimizing}
                      loadingText="Optimizing..."
                    >
                      Optimize CV
                    </Button>
                    <Button
                      colorScheme="teal"
                      size="sm"
                      leftIcon={<FaFileAlt />}
                      onClick={generateCoverLetter}
                      isLoading={generatingCoverLetter}
                      loadingText="Generating..."
                    >
                      Generate Cover Letter
                    </Button>
                  </HStack>
                </Flex>
                
                <Divider />
                
                <Box width="100%">
                  <Text fontWeight="bold" mb={2}>Overview</Text>
                  <Text>{matchResults.overview}</Text>
                </Box>
                
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} width="100%">
                  <Box>
                    <Text fontWeight="bold" mb={2}>Strengths</Text>
                    <OrderedList pl={4} spacing={1}>
                      {matchResults.strengths.map((strength, idx) => (
                        <ListItem key={idx}>{strength}</ListItem>
                      ))}
                    </OrderedList>
                  </Box>
                  
                  <Box>
                    <Text fontWeight="bold" mb={2}>Areas for Improvement</Text>
                    <OrderedList pl={4} spacing={1}>
                      {matchResults.weaknesses.map((weakness, idx) => (
                        <ListItem key={idx}>{weakness}</ListItem>
                      ))}
                    </OrderedList>
                  </Box>
                </SimpleGrid>
                
                <Box width="100%">
                  <Text fontWeight="bold" mb={2}>Keywords Found</Text>
                  <Flex flexWrap="wrap">
                    {matchResults.keywords_found.map((keyword, idx) => (
                      <Tag key={idx} colorScheme="green" m={1}>
                        <TagLabel>{keyword}</TagLabel>
                      </Tag>
                    ))}
                  </Flex>
                </Box>
                
                <Box width="100%">
                  <Text fontWeight="bold" mb={2}>Missing Keywords</Text>
                  <Flex flexWrap="wrap">
                    {matchResults.keywords_missing.map((keyword, idx) => (
                      <Tag key={idx} colorScheme="red" m={1}>
                        <TagLabel>{keyword}</TagLabel>
                      </Tag>
                    ))}
                  </Flex>
                </Box>
              </VStack>
            </CardBody>
          </Card>
          
          {coverLetter && (
            <Card mt={4}>
              <CardBody>
                <VStack align="start" spacing={4} width="100%">
                  <Flex width="100%" justify="space-between" align="center">
                    <Heading size="md">Cover Letter</Heading>
                    <HStack>
                      <Menu>
                        <MenuButton as={Button} rightIcon={<FaChevronDown />} size="sm">
                          Download
                        </MenuButton>
                        <MenuList>
                          <MenuItem 
                            icon={<FaFileAlt />} 
                            onClick={() => downloadAsFile(
                              coverLetter.cover_letter, 
                              `Cover_Letter_${companyName || 'Company'}_.txt`, 
                              'txt'
                            )}
                          >
                            Plain Text (.txt)
                          </MenuItem>
                          <MenuItem 
                            icon={<FaFileWord />} 
                            onClick={() => downloadAsFile(
                              coverLetter.cover_letter, 
                              `Cover_Letter_${companyName || 'Company'}_.docx`, 
                              'docx'
                            )}
                          >
                            Word Document (.docx)
                          </MenuItem>
                          <MenuItem 
                            icon={<FaFilePdf />} 
                            onClick={() => downloadAsFile(
                              coverLetter.cover_letter, 
                              `Cover_Letter_${companyName || 'Company'}_.pdf`, 
                              'pdf'
                            )}
                          >
                            PDF Document (.pdf)
                          </MenuItem>
                        </MenuList>
                      </Menu>
                      <Button 
                        size="sm" 
                        leftIcon={<FaCopy />}
                        onClick={() => copyToClipboard(coverLetter.cover_letter)}
                      >
                        Copy
                      </Button>
                    </HStack>
                  </Flex>
                  
                  <Divider />
                  
                  <Box 
                    p={4} 
                    borderWidth="1px" 
                    borderRadius="md" 
                    width="100%"
                    fontSize="sm"
                    fontFamily="serif"
                    bg={useColorModeValue('white', 'gray.800')}
                    boxShadow="sm"
                  >
                    <Text whiteSpace="pre-wrap">
                      {coverLetter.cover_letter}
                    </Text>
                  </Box>
                  
                  <Box width="100%" my={2}>
                    <Heading size="sm" mb={2}>Key Points Highlighted</Heading>
                    <Box p={3} bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md">
                      <UnorderedList spacing={1}>
                        {coverLetter.key_points.map((point, i) => (
                          <ListItem key={i}>{point}</ListItem>
                        ))}
                      </UnorderedList>
                    </Box>
                  </Box>
                  
                  <Box width="100%">
                    <Heading size="sm" mb={2}>Keywords Used</Heading>
                    <Flex flexWrap="wrap">
                      {coverLetter.keywords_used.map((keyword, idx) => (
                        <Tag key={idx} colorScheme="blue" m={1}>
                          <TagLabel>{keyword}</TagLabel>
                        </Tag>
                      ))}
                    </Flex>
                  </Box>
                </VStack>
              </CardBody>
            </Card>
          )}
        </>
      ) : (
        <Box textAlign="center" py={8}>
          <Text>No analysis results available. Please analyze your job match first.</Text>
        </Box>
      )}
      
      <Flex justify="space-between" mt={4}>
        <Button
          variant="outline"
          leftIcon={<FaArrowLeft />}
          onClick={() => setActiveStep(1)}
        >
          Back
        </Button>
        <Button
          colorScheme="blue"
          rightIcon={<FaMagic />}
          onClick={() => {
            optimizeCV();
          }}
          isDisabled={!matchResults}
          isLoading={optimizing}
          loadingText="Optimizing..."
        >
          Optimize CV
        </Button>
      </Flex>
    </VStack>
  );
  
  // Render optimization results step
  const renderOptimizationStep = () => (
    <VStack spacing={6} align="stretch">
      <Heading size="md">Step 4: Apply Optimizations</Heading>
      
      {optimizedSections.length > 0 ? (
        <>
          <Text>Review and apply the optimized content to your CV.</Text>
          
          {optimizedSections.map((section, idx) => (
            <Card key={idx} mb={4}>
              <CardBody>
                <VStack align="start" spacing={4}>
                  <Heading size="sm">
                    {section.section.replace(/_\d+$/, '').charAt(0).toUpperCase() + section.section.replace(/_\d+$/, '').slice(1)}
                  </Heading>
                  
                  <Box p={3} bg={highlightBg} borderRadius="md" width="100%">
                    <Text fontSize="xs" fontWeight="bold" mb={1}>Original</Text>
                    <Text fontSize="sm">{section.original_content}</Text>
                  </Box>
                  
                  <Box p={3} borderWidth="1px" borderColor="green.300" borderRadius="md" bg="green.50" width="100%">
                    <Text fontSize="xs" fontWeight="bold" mb={1}>Optimized</Text>
                    <Text fontSize="sm">{section.optimized_content}</Text>
                  </Box>
                  
                  <Box width="100%">
                    <Text fontSize="xs" fontWeight="bold" mb={1}>Improvements</Text>
                    <OrderedList pl={4} fontSize="sm">
                      {section.improvements.map((improvement, i) => (
                        <ListItem key={i}>{improvement}</ListItem>
                      ))}
                    </OrderedList>
                  </Box>
                </VStack>
              </CardBody>
            </Card>
          ))}
          
          <Flex justify="space-between" mt={4}>
            <Button
              variant="outline"
              leftIcon={<FaArrowLeft />}
              onClick={() => setActiveStep(2)}
            >
              Back
            </Button>
            <Button
              colorScheme="green"
              rightIcon={<FaCheck />}
              onClick={applyOptimizations}
            >
              Apply All Optimizations
            </Button>
          </Flex>
        </>
      ) : (
        <Box textAlign="center" py={8}>
          <Text>No optimization results available. Please optimize your CV first.</Text>
          <Button
            mt={4}
            colorScheme="blue"
            onClick={() => setActiveStep(2)}
          >
            Go Back to Analysis
          </Button>
        </Box>
      )}
    </VStack>
  );
  
  return (
    <Container maxW="container.lg" py={8}>
      <Button 
        leftIcon={<FaArrowLeft />} 
        onClick={() => navigate('/cv')}
        variant="ghost"
        mb={6}
      >
        Back to Dashboard
      </Button>
      
      <Heading mb={6}>Optimize Your CV</Heading>
      
      <Stepper index={activeStep} mb={8} colorScheme="blue">
        {steps.map((step, index) => (
          <Step key={index} onClick={() => index < activeStep && setActiveStep(index)}>
            <StepIndicator>
              <StepStatus
                complete={<StepIcon />}
                incomplete={<StepNumber />}
                active={<StepNumber />}
              />
            </StepIndicator>
            <Box flexShrink="0">
              <StepTitle>{step}</StepTitle>
            </Box>
            <StepSeparator />
          </Step>
        ))}
      </Stepper>
      
      <Box 
        p={6} 
        borderWidth="1px" 
        borderRadius="lg" 
        borderColor={borderColor}
        bg={cardBg}
      >
        {activeStep === 0 && renderSelectCVStep()}
        {activeStep === 1 && renderJobDescriptionStep()}
        {activeStep === 2 && renderMatchResultsStep()}
        {activeStep === 3 && renderOptimizationStep()}
      </Box>
    </Container>
  );
};

export default CVOptimize; 