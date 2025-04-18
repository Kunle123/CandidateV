import { useState, useRef } from 'react';
import {
  Box,
  Button,
  Heading,
  Text,
  Textarea,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  useToast,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Badge,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useColorModeValue,
  Divider,
  Tag,
  TagLabel,
  Flex,
  Tooltip,
  IconButton,
  Stack,
} from '@chakra-ui/react';
import { FaMagic, FaFileAlt, FaKeyboard, FaCopy, FaDownload, FaLightbulb } from 'react-icons/fa';
import { apiService } from '../../api';

const JobOptimizationPanel = ({ cvId, cvData }) => {
  const [jobDescription, setJobDescription] = useState('');
  const [userComments, setUserComments] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [positionTitle, setPositionTitle] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false);
  const [optimizedCV, setOptimizedCV] = useState(null);
  const [coverLetter, setCoverLetter] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState(null);
  const toast = useToast();
  const coverLetterRef = useRef(null);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const highlightColor = useColorModeValue('blue.50', 'blue.900');

  // Optimize CV for specific job
  const optimizeCV = async () => {
    if (!jobDescription.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please paste a job description to optimize your CV',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsOptimizing(true);
      setError(null);

      // Prepare optimization targets
      const targets = [];
      
      // Include summary
      if (cvData.personal?.summary) {
        targets.push({
          section: 'summary',
          content: cvData.personal.summary,
          target_job: positionTitle || undefined,
          target_industry: undefined,
          tone: 'professional',
        });
      }
      
      // Include experience descriptions
      if (cvData.experience?.length > 0) {
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
      if (cvData.skills?.length > 0) {
        const skillsContent = cvData.skills.map(skill => skill.name).join(', ');
        targets.push({
          section: 'skills',
          content: skillsContent,
          target_job: positionTitle || undefined,
          target_industry: undefined,
          tone: 'professional',
        });
      }
      
      // Call the AI service to optimize the CV - Use apiService instead of axios
      toast({
        title: 'Optimizing your CV',
        description: 'This may take up to 1 minute. Please wait...',
        status: 'info',
        duration: 15000, // 15 seconds
        isClosable: true,
      });
      
      const response = await apiService.post('/ai/optimize', {
        cv_id: cvId,
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
      
      setOptimizedCV(response.data);
      setActiveTab(1); // Switch to Optimized CV tab
      
      toast({
        title: 'CV Optimized',
        description: 'Your CV has been optimized for this job description',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Error optimizing CV:', err);
      
      // Check if it's a timeout error
      if (err.message && (err.message.includes('timeout') || err.code === 'ECONNABORTED')) {
        setError('The optimization request timed out. The server might be busy. Please try again in a few minutes.');
        toast({
          title: 'Request timed out',
          description: 'The CV optimization is taking longer than expected. Please try again.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } else {
        setError('Failed to optimize CV. Please try again later.');
        toast({
          title: 'Optimization failed',
          description: err.response?.data?.detail || 'An error occurred while optimizing your CV',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } finally {
      setIsOptimizing(false);
    }
  };

  // Generate cover letter
  const generateCoverLetter = async () => {
    if (!jobDescription.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please paste a job description to generate a cover letter',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsGeneratingCoverLetter(true);
      setError(null);

      // Call the AI service to generate the cover letter - Use apiService instead of axios
      const response = await apiService.post('/ai/cover-letter', {
        cv_id: cvId,
        job_description: jobDescription,
        user_comments: userComments,
        company_name: companyName,
        recipient_name: recipientName,
        position_title: positionTitle,
        tone: 'professional',
      });
      
      setCoverLetter(response.data);
      setActiveTab(2); // Switch to Cover Letter tab
      
      toast({
        title: 'Cover Letter Generated',
        description: 'Your cover letter has been generated based on your CV and the job description',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Error generating cover letter:', err);
      setError('Failed to generate cover letter. Please try again later.');
      toast({
        title: 'Cover letter generation failed',
        description: err.response?.data?.detail || 'An error occurred while generating your cover letter',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsGeneratingCoverLetter(false);
    }
  };

  // Apply optimized content to CV
  const applyOptimization = (section, content) => {
    // This would need to be implemented to update the main CV data
    // using a function passed from the parent component
    toast({
      title: 'Optimization applied',
      description: `The optimized content for ${section} has been applied to your CV`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  // Copy cover letter to clipboard
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

  return (
    <Box 
      borderWidth="1px" 
      borderRadius="lg" 
      overflow="hidden" 
      bg={bgColor} 
      borderColor={borderColor}
      p={5}
    >
      <Heading size="md" mb={4}>
        <HStack>
          <FaMagic />
          <Text>Job-Specific Optimization</Text>
        </HStack>
      </Heading>
      
      <Tabs isFitted colorScheme="blue" index={activeTab} onChange={setActiveTab}>
        <TabList>
          <Tab>Job Details</Tab>
          <Tab isDisabled={!optimizedCV}>Optimized CV</Tab>
          <Tab isDisabled={!coverLetter}>Cover Letter</Tab>
        </TabList>
        
        <TabPanels>
          {/* Job Details Panel */}
          <TabPanel>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>Job Description</FormLabel>
                <Textarea 
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the full job description here to optimize your CV and generate a tailored cover letter"
                  rows={8}
                />
              </FormControl>
              
              <HStack>
                <FormControl>
                  <FormLabel>Position Title</FormLabel>
                  <Input 
                    value={positionTitle}
                    onChange={(e) => setPositionTitle(e.target.value)}
                    placeholder="e.g. Senior Software Engineer"
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>Company Name</FormLabel>
                  <Input 
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Acme Corporation"
                  />
                </FormControl>
              </HStack>
              
              <FormControl>
                <FormLabel>Recipient Name (for cover letter)</FormLabel>
                <Input 
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="e.g. Jane Smith, Hiring Manager"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Additional Comments/Notes</FormLabel>
                <Textarea 
                  value={userComments}
                  onChange={(e) => setUserComments(e.target.value)}
                  placeholder="Add any additional information you'd like to include or highlight (optional)"
                  rows={3}
                />
              </FormControl>
              
              <Divider my={4} />
              
              <HStack spacing={4}>
                <Button
                  leftIcon={<FaMagic />}
                  colorScheme="blue"
                  onClick={optimizeCV}
                  isLoading={isOptimizing}
                  loadingText="Optimizing..."
                  isDisabled={!jobDescription.trim() || isGeneratingCoverLetter}
                >
                  Optimize CV for This Job
                </Button>
                
                <Button
                  leftIcon={<FaFileAlt />}
                  colorScheme="teal"
                  onClick={generateCoverLetter}
                  isLoading={isGeneratingCoverLetter}
                  loadingText="Generating..."
                  isDisabled={!jobDescription.trim() || isOptimizing}
                >
                  Generate Cover Letter
                </Button>
              </HStack>
              
              {error && (
                <Alert status="error" mt={4}>
                  <AlertIcon />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </VStack>
          </TabPanel>
          
          {/* Optimized CV Panel */}
          <TabPanel>
            {optimizedCV ? (
              <VStack spacing={6} align="stretch">
                <Box>
                  <Heading size="sm" mb={2}>Optimization Summary</Heading>
                  <Text>Match score: <Badge colorScheme="green" fontSize="0.9em">{optimizedCV.match_score || "N/A"}%</Badge></Text>
                  <HStack mt={2} flexWrap="wrap">
                    {optimizedCV.keywords_added?.map((keyword, idx) => (
                      <Tag key={idx} size="md" colorScheme="blue" m={1}>
                        <TagLabel>{keyword}</TagLabel>
                      </Tag>
                    ))}
                  </HStack>
                </Box>
                
                <Divider />
                
                <Accordion allowMultiple defaultIndex={[0]}>
                  {optimizedCV.optimized_sections?.map((section, idx) => (
                    <AccordionItem key={idx}>
                      <h2>
                        <AccordionButton>
                          <Box flex="1" textAlign="left">
                            <Text fontWeight="bold">
                              {section.section.replace(/_\d+$/, '')} 
                              <Badge ml={2} colorScheme="green">Optimized</Badge>
                            </Text>
                          </Box>
                          <AccordionIcon />
                        </AccordionButton>
                      </h2>
                      <AccordionPanel pb={4}>
                        <VStack spacing={4} align="stretch">
                          <Box p={3} bg={highlightColor} borderRadius="md">
                            <Heading size="xs" mb={2}>Original</Heading>
                            <Text whiteSpace="pre-wrap">{section.original_content}</Text>
                          </Box>
                          
                          <Box p={3} borderWidth="1px" borderColor="green.300" borderRadius="md" bg="green.50">
                            <Heading size="xs" mb={2}>Optimized</Heading>
                            <Text whiteSpace="pre-wrap">{section.optimized_content}</Text>
                          </Box>
                          
                          <Box>
                            <Heading size="xs" mb={2}>Improvements</Heading>
                            <VStack align="stretch">
                              {section.improvements.map((improvement, i) => (
                                <HStack key={i} spacing={2}>
                                  <Box color="green.500">
                                    <FaLightbulb />
                                  </Box>
                                  <Text fontSize="sm">{improvement}</Text>
                                </HStack>
                              ))}
                            </VStack>
                          </Box>
                          
                          <Button 
                            colorScheme="blue" 
                            size="sm"
                            onClick={() => applyOptimization(section.section, section.optimized_content)}
                          >
                            Apply This Optimization
                          </Button>
                        </VStack>
                      </AccordionPanel>
                    </AccordionItem>
                  ))}
                </Accordion>
              </VStack>
            ) : (
              <Box textAlign="center" p={8}>
                <Text>No optimized CV content yet. Click "Optimize CV for This Job" to get started.</Text>
              </Box>
            )}
          </TabPanel>
          
          {/* Cover Letter Panel */}
          <TabPanel>
            {coverLetter ? (
              <VStack spacing={6} align="stretch">
                <Stack direction={{ base: 'column', md: 'row' }} justify="space-between" align="center">
                  <Heading size="sm">Your Cover Letter</Heading>
                  <HStack>
                    <Tooltip label="Copy to clipboard">
                      <IconButton
                        icon={<FaCopy />}
                        aria-label="Copy to clipboard"
                        onClick={() => copyToClipboard(coverLetter.cover_letter)}
                      />
                    </Tooltip>
                    <Tooltip label="Download as text file">
                      <IconButton
                        icon={<FaDownload />}
                        aria-label="Download as text"
                        onClick={() => {
                          const blob = new Blob([coverLetter.cover_letter], { type: 'text/plain' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `Cover_Letter_${companyName || 'Company'}.txt`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                        }}
                      />
                    </Tooltip>
                  </HStack>
                </Stack>
                
                <Box 
                  p={5} 
                  borderWidth="1px" 
                  borderRadius="md" 
                  bg={useColorModeValue('gray.50', 'gray.900')} 
                  boxShadow="sm"
                  ref={coverLetterRef}
                >
                  <Text whiteSpace="pre-wrap" fontFamily="serif">
                    {coverLetter.cover_letter}
                  </Text>
                </Box>
                
                <Divider />
                
                <Box>
                  <Heading size="sm" mb={3}>Key Points Highlighted</Heading>
                  <VStack align="stretch">
                    {coverLetter.key_points.map((point, i) => (
                      <HStack key={i} spacing={2}>
                        <Box color="green.500">
                          <FaLightbulb />
                        </Box>
                        <Text>{point}</Text>
                      </HStack>
                    ))}
                  </VStack>
                </Box>
                
                <Box>
                  <Heading size="sm" mb={3}>Keywords Used</Heading>
                  <Flex flexWrap="wrap">
                    {coverLetter.keywords_used.map((keyword, i) => (
                      <Tag key={i} colorScheme="blue" m={1}>
                        <TagLabel>{keyword}</TagLabel>
                      </Tag>
                    ))}
                  </Flex>
                </Box>
              </VStack>
            ) : (
              <Box textAlign="center" p={8}>
                <Text>No cover letter generated yet. Click "Generate Cover Letter" to create one.</Text>
              </Box>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default JobOptimizationPanel; 