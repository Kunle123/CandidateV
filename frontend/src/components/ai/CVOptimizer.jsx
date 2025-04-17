import { useState } from 'react'
import {
  Box,
  Button,
  Heading,
  Text,
  VStack,
  HStack,
  Textarea,
  Flex,
  Badge,
  useColorModeValue,
  Spinner,
  useToast,
  Progress,
  Card,
  CardHeader,
  CardBody,
  FormControl,
  FormLabel,
  Switch,
  IconButton,
  Divider,
  Tooltip,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  List,
  ListItem,
  ListIcon,
} from '@chakra-ui/react'
import { CheckIcon, CloseIcon, InfoIcon, WarningIcon, CheckCircleIcon, SmallAddIcon } from '@chakra-ui/icons'
import aiService from '../../api/aiService'

const CVOptimizer = ({ cv, cvId, onApplySuggestions }) => {
  const [jobDescription, setJobDescription] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [suggestions, setSuggestions] = useState(null)
  const [progress, setProgress] = useState(0)
  const [selectedSuggestions, setSelectedSuggestions] = useState({})
  
  const toast = useToast()
  
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  
  const handleAnalyze = async () => {
    if (!jobDescription.trim()) {
      toast({
        title: 'Job description required',
        description: 'Please paste the job description to analyze and optimize your CV',
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
    
    setAnalyzing(true)
    setProgress(0)
    
    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 5
      })
    }, 200)
    
    try {
      // Use the detailed job match analysis endpoint
      const result = await aiService.getJobMatchAnalysis(cvId, jobDescription)
      
      if (result.success) {
        clearInterval(progressInterval)
        setProgress(100)
        
        // Transform API response to match UI expectations
        const apiSuggestions = result.data
        
        const transformedSuggestions = {
          score: apiSuggestions.match_score || 80,
          overview: apiSuggestions.overview || "Your CV has been analyzed against the job description. Here are the suggested improvements.",
          sections: {
            summary: apiSuggestions.sections && apiSuggestions.sections.summary
              ? {
                original: apiSuggestions.sections.summary.original,
                suggestion: apiSuggestions.sections.summary.optimized,
                reason: apiSuggestions.sections.summary.reason || "Better aligned with job requirements"
              } 
              : null,
            skills: {
              missing: apiSuggestions.missing_skills || [],
              reword: apiSuggestions.skills_to_reword || []
            },
            experience: []
          },
          keywords: {
            found: apiSuggestions.keywords_found || [],
            missing: apiSuggestions.keywords_missing || []
          }
        }
        
        // Add experience suggestions
        if (apiSuggestions.sections && apiSuggestions.sections.experience) {
          Object.entries(apiSuggestions.sections.experience).forEach(([key, value]) => {
            if (key.startsWith("experience_")) {
              const expIndex = parseInt(key.split('_')[1])
              transformedSuggestions.sections.experience.push({
                id: expIndex,
                field: "description",
                original: value.original,
                suggestion: value.optimized,
                reason: value.reason || "Better aligned with job requirements"
              })
            }
          })
        }
        
        setSuggestions(transformedSuggestions)
        
        // Initialize selections (all selected by default)
        const initialSelections = {
          summary: true
        }
        
        // Add experience suggestions
        transformedSuggestions.sections.experience.forEach(exp => {
          initialSelections[`experience_${exp.id}`] = true
        })
        
        // Add skill suggestions
        if (transformedSuggestions.sections.skills.reword) {
          transformedSuggestions.sections.skills.reword.forEach((skill, index) => {
            initialSelections[`skill_reword_${index}`] = true
          })
        }
        
        if (transformedSuggestions.sections.skills.missing) {
          transformedSuggestions.sections.skills.missing.forEach((skill, index) => {
            initialSelections[`skill_missing_${index}`] = true
          })
        }
        
        setSelectedSuggestions(initialSelections)
        
        toast({
          title: 'Optimization Complete',
          description: 'Your CV has been analyzed and optimization suggestions are ready',
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
      } else {
        clearInterval(progressInterval)
        setProgress(0)
        
        toast({
          title: 'Analysis Failed',
          description: result.error || 'Failed to analyze against the job description',
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
      }
    } catch (error) {
      clearInterval(progressInterval)
      setProgress(0)
      
      toast({
        title: 'Analysis Error',
        description: 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setAnalyzing(false)
    }
  }
  
  const handleToggleSuggestion = (id) => {
    setSelectedSuggestions(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }
  
  const handleApplyAll = () => {
    // In a real app, this would modify the CV with all selected suggestions
    onApplySuggestions(selectedSuggestions, suggestions)
    
    toast({
      title: 'Suggestions applied',
      description: 'Your CV has been updated with the selected optimizations',
      status: 'success',
      duration: 3000,
      isClosable: true,
    })
  }
  
  const getScoreColor = (score) => {
    if (score >= 80) return 'green'
    if (score >= 60) return 'yellow'
    return 'red'
  }
  
  return (
    <VStack spacing={6} align="stretch" w="100%">
      <Card borderWidth="1px" borderColor={borderColor}>
        <CardHeader>
          <Heading size="md">AI-Powered Job Matching</Heading>
        </CardHeader>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <Text>
              Paste the job description you're applying for below, and our AI will optimize your CV to increase your chances of getting an interview.
            </Text>
            
            <FormControl>
              <FormLabel>Job Description</FormLabel>
              <Textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job description here..."
                minH="200px"
                isDisabled={analyzing}
              />
            </FormControl>
            
            <Flex justify="space-between" align="center">
              <HStack>
                <FormControl display="flex" alignItems="center" maxW="300px">
                  <FormLabel htmlFor="advanced-analysis" mb="0">
                    Advanced Analysis
                  </FormLabel>
                  <Tooltip label="Premium feature that provides more detailed suggestions">
                    <Switch id="advanced-analysis" colorScheme="brand" isDisabled />
                  </Tooltip>
                </FormControl>
              </HStack>
              
              <Button
                onClick={handleAnalyze}
                colorScheme="blue"
                bg="brand.500"
                _hover={{ bg: "brand.600" }}
                isLoading={analyzing}
                loadingText="Analyzing"
              >
                Analyze & Optimize
              </Button>
            </Flex>
            
            {analyzing && (
              <Box mt={4}>
                <Text mb={2} fontSize="sm">Analyzing your CV against job requirements...</Text>
                <Progress value={progress} colorScheme="blue" size="sm" borderRadius="md" />
              </Box>
            )}
          </VStack>
        </CardBody>
      </Card>
      
      {suggestions && (
        <VStack spacing={6} align="stretch">
          {/* Score Overview */}
          <Card borderWidth="1px" borderColor={borderColor}>
            <CardHeader>
              <Flex justify="space-between" align="center">
                <Heading size="md">CV-Job Match Analysis</Heading>
                <Badge 
                  colorScheme={getScoreColor(suggestions.score)} 
                  fontSize="1.2em"
                  py={2}
                  px={3}
                  borderRadius="lg"
                >
                  {suggestions.score}/100
                </Badge>
              </Flex>
            </CardHeader>
            <CardBody>
              <VStack align="stretch" spacing={4}>
                <Text>{suggestions.overview}</Text>
                
                <Divider />
                
                {suggestions.keywords.found.length > 0 || suggestions.keywords.missing.length > 0 ? (
                  <>
                    <Heading size="sm">Keyword Analysis</Heading>
                    <Flex wrap="wrap" gap={2}>
                      <Box>
                        <Text mb={2} fontWeight="bold">Found in your CV:</Text>
                        <Flex wrap="wrap" gap={2}>
                          {suggestions.keywords.found.map(keyword => (
                            <Badge key={keyword} colorScheme="green" py={1} px={2}>
                              <HStack spacing={1}>
                                <CheckIcon boxSize={3} />
                                <Text>{keyword}</Text>
                              </HStack>
                            </Badge>
                          ))}
                          {suggestions.keywords.found.length === 0 && (
                            <Text fontStyle="italic" color="gray.500">No job-specific keywords found</Text>
                          )}
                        </Flex>
                      </Box>
                      
                      <Box mt={4}>
                        <Text mb={2} fontWeight="bold">Missing important keywords:</Text>
                        <Flex wrap="wrap" gap={2}>
                          {suggestions.keywords.missing.map(keyword => (
                            <Badge key={keyword} colorScheme="red" py={1} px={2}>
                              <HStack spacing={1}>
                                <SmallAddIcon boxSize={3} />
                                <Text>{keyword}</Text>
                              </HStack>
                            </Badge>
                          ))}
                          {suggestions.keywords.missing.length === 0 && (
                            <Text fontStyle="italic" color="gray.500">No missing keywords identified</Text>
                          )}
                        </Flex>
                      </Box>
                    </Flex>
                  </>
                ) : null}
              </VStack>
            </CardBody>
          </Card>
          
          {/* Suggestions */}
          <Card borderWidth="1px" borderColor={borderColor}>
            <CardHeader>
              <Flex justify="space-between" align="center">
                <Heading size="md">Suggested Optimizations</Heading>
                <Button
                  colorScheme="green"
                  onClick={handleApplyAll}
                  leftIcon={<CheckIcon />}
                >
                  Apply Selected
                </Button>
              </Flex>
            </CardHeader>
            <CardBody>
              <Accordion defaultIndex={[0]} allowMultiple>
                {/* Summary suggestion */}
                {suggestions.sections.summary && (
                  <AccordionItem borderWidth="1px" borderRadius="md" mb={4}>
                    <h3>
                      <AccordionButton bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md">
                        <Box flex="1" textAlign="left" fontWeight="medium">
                          Professional Summary
                        </Box>
                        <Switch 
                          colorScheme="green" 
                          isChecked={selectedSuggestions.summary}
                          onChange={() => handleToggleSuggestion('summary')}
                          onClick={(e) => e.stopPropagation()}
                          mr={2}
                        />
                        <AccordionIcon />
                      </AccordionButton>
                    </h3>
                    <AccordionPanel pb={4}>
                      <VStack align="stretch" spacing={3}>
                        <Box p={3} bg={useColorModeValue('red.50', 'rgba(200,0,0,0.1)')} borderRadius="md">
                          <Text fontWeight="bold" mb={1}>Current:</Text>
                          <Text>{suggestions.sections.summary.original || "No summary provided"}</Text>
                        </Box>
                        
                        <Box p={3} bg={useColorModeValue('green.50', 'rgba(0,200,0,0.1)')} borderRadius="md">
                          <Text fontWeight="bold" mb={1}>Suggested:</Text>
                          <Text>{suggestions.sections.summary.suggestion}</Text>
                        </Box>
                        
                        <Box p={3} bg={useColorModeValue('blue.50', 'rgba(0,0,200,0.1)')} borderRadius="md">
                          <Text fontWeight="bold" mb={1}>Why:</Text>
                          <Text>{suggestions.sections.summary.reason}</Text>
                        </Box>
                      </VStack>
                    </AccordionPanel>
                  </AccordionItem>
                )}
                
                {/* Skills suggestions */}
                {(suggestions.sections.skills.reword.length > 0 || suggestions.sections.skills.missing.length > 0) && (
                  <AccordionItem borderWidth="1px" borderRadius="md" mb={4}>
                    <h3>
                      <AccordionButton bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md">
                        <Box flex="1" textAlign="left" fontWeight="medium">
                          Skills Optimization
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                    </h3>
                    <AccordionPanel pb={4}>
                      <VStack align="stretch" spacing={4}>
                        {suggestions.sections.skills.reword.length > 0 && (
                          <Box>
                            <Heading size="sm" mb={2}>Reword Existing Skills</Heading>
                            <List spacing={3}>
                              {suggestions.sections.skills.reword.map((skill, index) => (
                                <ListItem key={index} p={2} borderWidth="1px" borderRadius="md">
                                  <Flex justify="space-between" align="center">
                                    <HStack>
                                      <ListIcon as={WarningIcon} color="yellow.500" />
                                      <Text fontWeight="medium">Change <b>"{skill.original}"</b> to <b>"{skill.suggestion}"</b></Text>
                                    </HStack>
                                    <Switch 
                                      colorScheme="green" 
                                      isChecked={selectedSuggestions[`skill_reword_${index}`]}
                                      onChange={() => handleToggleSuggestion(`skill_reword_${index}`)}
                                    />
                                  </Flex>
                                  <Text ml={6} mt={1} fontSize="sm" color="gray.600">{skill.reason}</Text>
                                </ListItem>
                              ))}
                            </List>
                          </Box>
                        )}
                        
                        {suggestions.sections.skills.missing.length > 0 && (
                          <Box>
                            <Heading size="sm" mb={2}>Add Missing Skills</Heading>
                            <Text fontSize="sm" mb={2}>
                              These skills were mentioned in the job description but are missing from your CV.
                              If you have experience with them, consider adding them.
                            </Text>
                            <List spacing={3}>
                              {suggestions.sections.skills.missing.map((skill, index) => (
                                <ListItem key={index} p={2} borderWidth="1px" borderRadius="md">
                                  <Flex justify="space-between" align="center">
                                    <HStack>
                                      <ListIcon as={SmallAddIcon} color="green.500" />
                                      <Text fontWeight="medium">Add <b>"{skill}"</b> to your skills</Text>
                                    </HStack>
                                    <Switch 
                                      colorScheme="green" 
                                      isChecked={selectedSuggestions[`skill_missing_${index}`]}
                                      onChange={() => handleToggleSuggestion(`skill_missing_${index}`)}
                                    />
                                  </Flex>
                                </ListItem>
                              ))}
                            </List>
                          </Box>
                        )}
                      </VStack>
                    </AccordionPanel>
                  </AccordionItem>
                )}
                
                {/* Experience suggestions */}
                {suggestions.sections.experience.length > 0 && (
                  <AccordionItem borderWidth="1px" borderRadius="md" mb={4}>
                    <h3>
                      <AccordionButton bg={useColorModeValue('gray.50', 'gray.700')} borderRadius="md">
                        <Box flex="1" textAlign="left" fontWeight="medium">
                          Experience Optimization
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                    </h3>
                    <AccordionPanel pb={4}>
                      <VStack align="stretch" spacing={4}>
                        {suggestions.sections.experience.map((exp, index) => (
                          <Box key={index} p={4} borderWidth="1px" borderRadius="md">
                            <Flex justify="space-between" align="center" mb={3}>
                              <Heading size="sm">Position {exp.id + 1}</Heading>
                              <Switch 
                                colorScheme="green" 
                                isChecked={selectedSuggestions[`experience_${exp.id}`]}
                                onChange={() => handleToggleSuggestion(`experience_${exp.id}`)}
                              />
                            </Flex>
                            
                            <VStack align="stretch" spacing={3}>
                              <Box p={3} bg={useColorModeValue('red.50', 'rgba(200,0,0,0.1)')} borderRadius="md">
                                <Text fontWeight="bold" mb={1}>Current:</Text>
                                <Text>{exp.original}</Text>
                              </Box>
                              
                              <Box p={3} bg={useColorModeValue('green.50', 'rgba(0,200,0,0.1)')} borderRadius="md">
                                <Text fontWeight="bold" mb={1}>Suggested:</Text>
                                <Text>{exp.suggestion}</Text>
                              </Box>
                              
                              <Box p={3} bg={useColorModeValue('blue.50', 'rgba(0,0,200,0.1)')} borderRadius="md">
                                <Text fontWeight="bold" mb={1}>Why:</Text>
                                <Text>{exp.reason}</Text>
                              </Box>
                            </VStack>
                          </Box>
                        ))}
                      </VStack>
                    </AccordionPanel>
                  </AccordionItem>
                )}
              </Accordion>
            </CardBody>
          </Card>
        </VStack>
      )}
    </VStack>
  )
}

export default CVOptimizer 