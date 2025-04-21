import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Text,
  Spinner,
  Progress,
  Badge,
  Flex,
  Divider,
  HStack,
  VStack,
  List,
  ListItem,
  ListIcon,
  useColorModeValue,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Tooltip,
  useToast,
  Textarea
} from '@chakra-ui/react';
import { CheckIcon, WarningIcon, InfoIcon, StarIcon } from '@chakra-ui/icons';
import aiService from '../../api/aiService';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CVAnalyzer = ({ cv, cvId }) => {
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [progress, setProgress] = useState(0);
  const [jobDescription, setJobDescription] = useState('');
  const [matchScore, setMatchScore] = useState(null);
  const [fetchingMatchScore, setFetchingMatchScore] = useState(false);
  const toast = useToast();
  
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const runAnalysis = async () => {
    if (!cvId) {
      toast({
        title: 'Save CV First',
        description: 'Please save your CV before running the analysis',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setLoading(true);
    setAnalyzing(true);
    setProgress(0);
    
    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 5, 90));
    }, 500);
    
    try {
      const result = await aiService.analyzeCV(cvId);
      
      if (result.success) {
        clearInterval(progressInterval);
        setProgress(100);
        setAnalysis(result.data.analysis);
        
        toast({
          title: 'Analysis Complete',
          description: 'Your CV has been analyzed successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        clearInterval(progressInterval);
        setProgress(0);
        
        toast({
          title: 'Analysis Failed',
          description: result.error || 'Failed to analyze your CV',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      clearInterval(progressInterval);
      setProgress(0);
      
      toast({
        title: 'Analysis Error',
        description: 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
      setAnalyzing(false);
    }
  };
  
  const getScoreColor = (score) => {
    if (score >= 8) return 'green';
    if (score >= 6) return 'blue';
    if (score >= 4) return 'yellow';
    return 'red';
  };

  const handleGetMatchScore = async () => {
    if (!jobDescription.trim()) {
      toast({
        title: 'Job Description Required',
        description: 'Please paste a job description to analyze your match',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }
    
    if (!cvId) {
      toast({
        title: 'Save CV First',
        description: 'Please save your CV before analyzing',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }
    
    setFetchingMatchScore(true)
    
    try {
      // Use the new job match endpoint
      const result = await aiService.getJobMatch(cvId, jobDescription)
      
      if (result.success) {
        // Set match score from API response
        setMatchScore({
          score: result.data.match_score || 0,
          strengths: result.data.strengths || [],
          weaknesses: result.data.weaknesses || [],
          missingKeywords: result.data.missing_keywords || []
        })
        
        toast({
          title: 'Analysis Complete',
          description: 'Your CV has been analyzed against the job description',
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
      } else {
        // Check if AI service is offline
        if (result.error?.includes('AI service is currently offline')) {
          toast({
            title: 'AI Service Offline',
            description: 'The AI analysis service is currently offline. Please try again later or contact support if this persists.',
            status: 'warning',
            duration: 5000,
            isClosable: true,
          })
        } else {
          toast({
            title: 'Analysis Failed',
            description: result.error || 'Failed to analyze your CV against the job description',
            status: 'error',
            duration: 5000,
            isClosable: true,
          })
        }
      }
    } catch (error) {
      console.error('Error getting match score:', error)
      toast({
        title: 'Analysis Error',
        description: 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setFetchingMatchScore(false)
    }
  }

  const analyzeCV = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cv_id: cvId,
          job_description: jobDescription,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || 'Failed to analyze CV');
      }

      // Check if using mock data
      if (result.warning) {
        toast.warning(result.warning, {
          position: "top-right",
          autoClose: 5000,
        });
      }

      setAnalysis(result.data.analysis);
    } catch (error) {
      console.error('Analysis failed:', error);
      toast.error(error.message || 'Failed to analyze CV');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <ToastContainer />
      <VStack spacing={6} align="stretch" w="100%">
        <Card borderWidth="1px" borderColor={borderColor}>
          <CardHeader>
            <Heading size="md">AI-Powered CV Analysis</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Text>
                Our AI will analyze your CV and provide detailed feedback to help you improve it. This includes content analysis, keyword suggestions, and more.
              </Text>
              
              <Button
                onClick={runAnalysis}
                colorScheme="blue"
                isLoading={loading}
                loadingText="Analyzing"
                disabled={loading}
              >
                Analyze CV
              </Button>
              
              {analyzing && (
                <Box mt={2}>
                  <Text mb={2} fontSize="sm">Analyzing your CV...</Text>
                  <Progress value={progress} colorScheme="blue" size="sm" borderRadius="md" />
                </Box>
              )}
            </VStack>
          </CardBody>
        </Card>
        
        {/* Job Match Analysis */}
        <Card borderWidth="1px" borderColor={borderColor}>
          <CardHeader>
            <Heading size="md">Job Match Analysis</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Text>
                Paste a job description below to check how well your CV matches the requirements.
              </Text>
              
              <Textarea
                placeholder="Paste job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                minHeight="150px"
                resize="vertical"
              />
              
              <Button
                onClick={handleGetMatchScore}
                colorScheme="teal"
                isLoading={fetchingMatchScore}
                loadingText="Analyzing"
                disabled={fetchingMatchScore}
              >
                Check Match Score
              </Button>
              
              {matchScore && (
                <Box mt={4} p={4} borderWidth="1px" borderRadius="md" bg={cardBg}>
                  <Flex justify="space-between" align="center" mb={4}>
                    <Heading size="md">Match Score</Heading>
                    <Badge 
                      colorScheme={getScoreColor(matchScore.score * 10)} 
                      fontSize="1.2em"
                      py={2}
                      px={3}
                      borderRadius="lg"
                    >
                      {Math.round(matchScore.score * 10)}/10
                    </Badge>
                  </Flex>
                  
                  {matchScore.strengths && matchScore.strengths.length > 0 && (
                    <Box mb={4}>
                      <Heading size="sm" mb={2} color="green.500">Your Strengths</Heading>
                      <List spacing={2}>
                        {matchScore.strengths.map((strength, index) => (
                          <ListItem key={index}>
                            <ListIcon as={CheckIcon} color="green.500" />
                            {strength}
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                  
                  {matchScore.weaknesses && matchScore.weaknesses.length > 0 && (
                    <Box mb={4}>
                      <Heading size="sm" mb={2} color="red.500">Areas for Improvement</Heading>
                      <List spacing={2}>
                        {matchScore.weaknesses.map((weakness, index) => (
                          <ListItem key={index}>
                            <ListIcon as={WarningIcon} color="red.500" />
                            {weakness}
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                  
                  {matchScore.missingKeywords && matchScore.missingKeywords.length > 0 && (
                    <Box>
                      <Heading size="sm" mb={2} color="orange.500">Missing Keywords</Heading>
                      <Flex wrap="wrap" gap={2}>
                        {matchScore.missingKeywords.map((keyword, index) => (
                          <Badge key={index} colorScheme="orange" py={1} px={2}>
                            {keyword}
                          </Badge>
                        ))}
                      </Flex>
                    </Box>
                  )}
                </Box>
              )}
            </VStack>
          </CardBody>
        </Card>
        
        {analysis && (
          <VStack spacing={6} align="stretch">
            {/* Overall Score */}
            <Card borderWidth="1px" borderColor={borderColor}>
              <CardHeader>
                <Flex justify="space-between" align="center">
                  <Heading size="md">Overall Assessment</Heading>
                  <Badge 
                    colorScheme={getScoreColor(analysis.score)} 
                    fontSize="1.2em"
                    py={2}
                    px={3}
                    borderRadius="lg"
                  >
                    {analysis.score}/10
                  </Badge>
                </Flex>
              </CardHeader>
              <CardBody>
                <VStack align="stretch" spacing={4}>
                  {/* Strengths and Weaknesses */}
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <Box p={4} borderWidth="1px" borderRadius="md" borderColor="green.300" bg={useColorModeValue('green.50', 'green.900')}>
                      <Heading size="sm" mb={3} color="green.500">Strengths</Heading>
                      <List spacing={2}>
                        {analysis.strengths.map((strength, index) => (
                          <ListItem key={index}>
                            <ListIcon as={CheckIcon} color="green.500" />
                            {strength}
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                    
                    <Box p={4} borderWidth="1px" borderRadius="md" borderColor="red.300" bg={useColorModeValue('red.50', 'red.900')}>
                      <Heading size="sm" mb={3} color="red.500">Areas for Improvement</Heading>
                      <List spacing={2}>
                        {analysis.weaknesses.map((weakness, index) => (
                          <ListItem key={index}>
                            <ListIcon as={WarningIcon} color="red.500" />
                            {weakness}
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  </SimpleGrid>
                  
                  {/* Industry Fit */}
                  {analysis.industry_fit && analysis.industry_fit.length > 0 && (
                    <Box mt={4}>
                      <Heading size="sm" mb={3}>Industry Compatibility</Heading>
                      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                        {analysis.industry_fit.map((industry, index) => (
                          <Box key={index} p={3} borderWidth="1px" borderRadius="md">
                            <Flex justify="space-between" align="center" mb={2}>
                              <Text fontWeight="bold">{industry.industry}</Text>
                              <Badge colorScheme={getScoreColor(industry.fit_score)}>
                                {industry.fit_score}/10
                              </Badge>
                            </Flex>
                            <Text fontSize="sm">{industry.reasons}</Text>
                          </Box>
                        ))}
                      </SimpleGrid>
                    </Box>
                  )}
                  
                  {/* Keyword Analysis */}
                  {analysis.keywords_analysis && (
                    <Box mt={4}>
                      <Heading size="sm" mb={3}>Keyword Analysis</Heading>
                      <Box p={4} borderWidth="1px" borderRadius="md">
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                          <Box>
                            <Text fontWeight="bold" mb={2}>Found Keywords:</Text>
                            <Flex wrap="wrap" gap={2}>
                              {analysis.keywords_analysis.found_keywords && analysis.keywords_analysis.found_keywords.map((keyword, index) => (
                                <Badge key={index} colorScheme="green" py={1} px={2}>
                                  <HStack spacing={1}>
                                    <CheckIcon boxSize={3} />
                                    <Text>{keyword}</Text>
                                  </HStack>
                                </Badge>
                              ))}
                            </Flex>
                          </Box>
                          
                          <Box>
                            <Text fontWeight="bold" mb={2}>Missing Keywords:</Text>
                            <Flex wrap="wrap" gap={2}>
                              {analysis.keywords_analysis.missing_keywords && analysis.keywords_analysis.missing_keywords.map((keyword, index) => (
                                <Badge key={index} colorScheme="red" py={1} px={2}>
                                  <Text>{keyword}</Text>
                                </Badge>
                              ))}
                            </Flex>
                          </Box>
                        </SimpleGrid>
                        
                        {analysis.keywords_analysis.recommendation && (
                          <Box mt={4}>
                            <Text fontWeight="bold" mb={1}>Recommendation:</Text>
                            <Text>{analysis.keywords_analysis.recommendation}</Text>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  )}
                </VStack>
              </CardBody>
            </Card>
            
            {/* Detailed Feedback */}
            <Card borderWidth="1px" borderColor={borderColor}>
              <CardHeader>
                <Heading size="md">Section Feedback</Heading>
              </CardHeader>
              <CardBody>
                <Accordion allowMultiple>
                  {analysis.feedback && analysis.feedback.map((feedback, index) => (
                    <AccordionItem key={index} mb={2} borderWidth="1px" borderRadius="md">
                      <h2>
                        <AccordionButton>
                          <Flex flex="1" textAlign="left" justify="space-between" align="center">
                            <Heading size="sm">{feedback.section}</Heading>
                            <Badge colorScheme={getScoreColor(feedback.score)} ml={2}>
                              {feedback.score}/10
                            </Badge>
                          </Flex>
                          <AccordionIcon />
                        </AccordionButton>
                      </h2>
                      <AccordionPanel pb={4}>
                        <Text>{feedback.comments}</Text>
                      </AccordionPanel>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardBody>
            </Card>
            
            {/* Improvement Suggestions */}
            <Card borderWidth="1px" borderColor={borderColor}>
              <CardHeader>
                <Heading size="md">Improvement Suggestions</Heading>
              </CardHeader>
              <CardBody>
                <List spacing={4}>
                  {analysis.improvement_suggestions && analysis.improvement_suggestions.map((suggestion, index) => (
                    <ListItem key={index} p={4} borderWidth="1px" borderRadius="md">
                      <Flex justify="space-between" mb={2}>
                        <Heading size="sm">{suggestion.section}</Heading>
                        <Badge colorScheme={suggestion.importance === "high" ? "red" : suggestion.importance === "medium" ? "yellow" : "blue"}>
                          {suggestion.importance.toUpperCase()}
                        </Badge>
                      </Flex>
                      <Text>{suggestion.suggestion}</Text>
                    </ListItem>
                  ))}
                </List>
              </CardBody>
            </Card>
          </VStack>
        )}
      </VStack>
    </div>
  );
};

function SimpleGrid({ children, columns, spacing }) {
  return (
    <Flex wrap="wrap" margin={-spacing/2}>
      {React.Children.map(children, child => (
        <Box 
          width={columns ? { 
            base: "100%", 
            md: columns.md === 2 ? "50%" : columns.md === 3 ? "33.33%" : "100%",
            lg: columns.lg === 3 ? "33.33%" : "50%"
          } : "100%"}
          padding={spacing/2}
        >
          {child}
        </Box>
      ))}
    </Flex>
  );
}

export default CVAnalyzer; 