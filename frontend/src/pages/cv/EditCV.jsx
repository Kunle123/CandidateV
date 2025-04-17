import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  IconButton,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Divider,
  useToast,
  useColorModeValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Badge,
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  Spinner,
  Tooltip,
} from '@chakra-ui/react'
import { 
  AddIcon, 
  DeleteIcon, 
  ArrowBackIcon, 
  CheckIcon, 
  ViewIcon, 
  WarningIcon, 
  InfoIcon, 
  StarIcon 
} from '@chakra-ui/icons'

// Mock CV data - in a real app this would come from an API
const mockCV = {
  id: 'new',
  title: 'New CV',
  personalInfo: {
    fullName: '',
    email: '',
    phone: '',
    address: '',
    linkedIn: '',
    website: '',
    summary: '',
  },
  education: [],
  experience: [],
  skills: [],
  languages: [],
  achievements: [],
  templateId: 'professional',
}

const EditCV = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { isOpen, onOpen, onClose } = useDisclosure()
  
  const [cv, setCV] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeSection, setActiveSection] = useState('personal')
  
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  
  useEffect(() => {
    // In a real app, this would fetch the CV data from an API
    const fetchCV = async () => {
      try {
        // Simulate API delay
        setTimeout(() => {
          setCV(mockCV)
          setLoading(false)
        }, 1000)
      } catch (error) {
        console.error('Error fetching CV:', error)
        toast({
          title: 'Error loading CV',
          description: 'Could not load CV data. Please try again later.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
        setLoading(false)
      }
    }
    
    fetchCV()
  }, [id, toast])
  
  const handlePersonalInfoChange = (e) => {
    const { name, value } = e.target
    setCV({
      ...cv,
      personalInfo: {
        ...cv.personalInfo,
        [name]: value
      }
    })
  }
  
  const handleAddEducation = () => {
    setCV({
      ...cv,
      education: [
        ...cv.education,
        {
          id: Date.now(),
          institution: '',
          degree: '',
          fieldOfStudy: '',
          startDate: '',
          endDate: '',
          description: '',
        }
      ]
    })
  }
  
  const handleEducationChange = (id, field, value) => {
    setCV({
      ...cv,
      education: cv.education.map(edu => 
        edu.id === id ? { ...edu, [field]: value } : edu
      )
    })
  }
  
  const handleRemoveEducation = (id) => {
    setCV({
      ...cv,
      education: cv.education.filter(edu => edu.id !== id)
    })
  }
  
  const handleAddExperience = () => {
    setCV({
      ...cv,
      experience: [
        ...cv.experience,
        {
          id: Date.now(),
          company: '',
          position: '',
          location: '',
          startDate: '',
          endDate: '',
          current: false,
          description: '',
        }
      ]
    })
  }
  
  const handleExperienceChange = (id, field, value) => {
    setCV({
      ...cv,
      experience: cv.experience.map(exp => 
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    })
  }
  
  const handleRemoveExperience = (id) => {
    setCV({
      ...cv,
      experience: cv.experience.filter(exp => exp.id !== id)
    })
  }
  
  const handleAddSkill = () => {
    setCV({
      ...cv,
      skills: [
        ...cv.skills,
        {
          id: Date.now(),
          name: '',
          level: 'Intermediate',
        }
      ]
    })
  }
  
  const handleSkillChange = (id, field, value) => {
    setCV({
      ...cv,
      skills: cv.skills.map(skill => 
        skill.id === id ? { ...skill, [field]: value } : skill
      )
    })
  }
  
  const handleRemoveSkill = (id) => {
    setCV({
      ...cv,
      skills: cv.skills.filter(skill => skill.id !== id)
    })
  }
  
  const handleSave = () => {
    setSaving(true)
    // In a real app, this would save the CV to an API
    setTimeout(() => {
      setSaving(false)
      toast({
        title: 'CV saved',
        description: 'Your CV has been saved successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    }, 1000)
  }
  
  const handlePreview = () => {
    // In a real app, this would navigate to a preview page with the current CV data
    navigate(`/cv/view/${id}`)
  }

  if (loading) {
    return (
      <Flex justify="center" align="center" height="50vh">
        <Spinner size="xl" color="brand.500" thickness="4px" />
      </Flex>
    )
  }

  return (
    <Container maxW="1200px" py={8} px={{ base: 4, md: 8 }}>
      {cv && (
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <Flex 
            justifyContent="space-between" 
            alignItems="center"
            flexDirection={{ base: 'column', sm: 'row' }}
            gap={4}
          >
            <Box>
              <Heading as="h1" size="xl" mb={1}>
                {cv.title || 'New CV'}
              </Heading>
              <Text color="gray.600">
                Fill in your details to create a professional CV
              </Text>
            </Box>
            
            <HStack>
              <Button
                leftIcon={<ViewIcon />}
                onClick={handlePreview}
                variant="outline"
              >
                Preview
              </Button>
              <Button
                leftIcon={<CheckIcon />}
                onClick={handleSave}
                colorScheme="blue"
                bg="brand.500"
                _hover={{ bg: "brand.600" }}
                isLoading={saving}
              >
                Save
              </Button>
            </HStack>
          </Flex>
          
          {/* Main Content */}
          <Flex 
            gap={8} 
            direction={{ base: 'column', lg: 'row' }}
          >
            {/* Sidebar Navigation */}
            <VStack 
              w={{ base: '100%', lg: '250px' }}
              align="stretch"
              spacing={2}
              position={{ base: 'relative', lg: 'sticky' }}
              top={{ lg: '20px' }}
              alignSelf={{ lg: 'flex-start' }}
            >
              <Button
                justifyContent="flex-start"
                variant={activeSection === 'personal' ? 'solid' : 'ghost'}
                colorScheme={activeSection === 'personal' ? 'blue' : 'gray'}
                onClick={() => setActiveSection('personal')}
                py={6}
                borderRadius="md"
                leftIcon={<InfoIcon />}
              >
                Personal Information
              </Button>
              
              <Button
                justifyContent="flex-start"
                variant={activeSection === 'education' ? 'solid' : 'ghost'}
                colorScheme={activeSection === 'education' ? 'blue' : 'gray'}
                onClick={() => setActiveSection('education')}
                py={6}
                borderRadius="md"
                leftIcon={<StarIcon />}
              >
                Education
                <Badge ml={2} colorScheme="blue" borderRadius="full">
                  {cv.education.length}
                </Badge>
              </Button>
              
              <Button
                justifyContent="flex-start"
                variant={activeSection === 'experience' ? 'solid' : 'ghost'}
                colorScheme={activeSection === 'experience' ? 'blue' : 'gray'}
                onClick={() => setActiveSection('experience')}
                py={6}
                borderRadius="md"
                leftIcon={<StarIcon />}
              >
                Experience
                <Badge ml={2} colorScheme="blue" borderRadius="full">
                  {cv.experience.length}
                </Badge>
              </Button>
              
              <Button
                justifyContent="flex-start"
                variant={activeSection === 'skills' ? 'solid' : 'ghost'}
                colorScheme={activeSection === 'skills' ? 'blue' : 'gray'}
                onClick={() => setActiveSection('skills')}
                py={6}
                borderRadius="md"
                leftIcon={<StarIcon />}
              >
                Skills
                <Badge ml={2} colorScheme="blue" borderRadius="full">
                  {cv.skills.length}
                </Badge>
              </Button>
            </VStack>
            
            {/* Form Content */}
            <Box flex={1}>
              {activeSection === 'personal' && (
                <VStack align="stretch" spacing={6}>
                  <Heading as="h2" size="lg">
                    Personal Information
                  </Heading>
                  
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                    <FormControl>
                      <FormLabel>Full Name</FormLabel>
                      <Input 
                        name="fullName" 
                        value={cv.personalInfo.fullName} 
                        onChange={handlePersonalInfoChange}
                        placeholder="John Doe"
                      />
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>Job Title</FormLabel>
                      <Input 
                        name="jobTitle" 
                        value={cv.personalInfo.jobTitle} 
                        onChange={handlePersonalInfoChange}
                        placeholder="Software Engineer"
                      />
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>Email</FormLabel>
                      <Input 
                        name="email" 
                        type="email"
                        value={cv.personalInfo.email} 
                        onChange={handlePersonalInfoChange}
                        placeholder="john.doe@example.com"
                      />
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>Phone</FormLabel>
                      <Input 
                        name="phone" 
                        value={cv.personalInfo.phone} 
                        onChange={handlePersonalInfoChange}
                        placeholder="+1 (555) 123-4567"
                      />
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>Location</FormLabel>
                      <Input 
                        name="address" 
                        value={cv.personalInfo.address} 
                        onChange={handlePersonalInfoChange}
                        placeholder="New York, NY"
                      />
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>LinkedIn Profile</FormLabel>
                      <Input 
                        name="linkedIn" 
                        value={cv.personalInfo.linkedIn} 
                        onChange={handlePersonalInfoChange}
                        placeholder="linkedin.com/in/johndoe"
                      />
                    </FormControl>
                  </SimpleGrid>
                  
                  <FormControl>
                    <FormLabel>Professional Summary</FormLabel>
                    <Textarea 
                      name="summary" 
                      value={cv.personalInfo.summary} 
                      onChange={handlePersonalInfoChange}
                      placeholder="A brief summary of your professional background and career goals"
                      minH="150px"
                    />
                  </FormControl>
                </VStack>
              )}
              
              {activeSection === 'education' && (
                <VStack align="stretch" spacing={6}>
                  <Flex justify="space-between" align="center">
                    <Heading as="h2" size="lg">
                      Education
                    </Heading>
                    <Button
                      leftIcon={<AddIcon />}
                      onClick={handleAddEducation}
                      colorScheme="blue"
                      size="sm"
                    >
                      Add Education
                    </Button>
                  </Flex>
                  
                  {cv.education.length === 0 ? (
                    <Box
                      p={8}
                      textAlign="center"
                      borderWidth="1px"
                      borderRadius="lg"
                      borderStyle="dashed"
                    >
                      <Text color="gray.500" mb={4}>
                        No education entries yet. Add your educational background to strengthen your CV.
                      </Text>
                      <Button
                        leftIcon={<AddIcon />}
                        onClick={handleAddEducation}
                        colorScheme="blue"
                        size="md"
                      >
                        Add Education
                      </Button>
                    </Box>
                  ) : (
                    <Accordion allowMultiple defaultIndex={[0]}>
                      {cv.education.map((edu, index) => (
                        <AccordionItem key={edu.id} mb={4} borderWidth="1px" borderRadius="md">
                          <h2>
                            <AccordionButton py={4}>
                              <Box flex="1" textAlign="left" fontWeight="medium">
                                {edu.institution || edu.degree ? (
                                  <>{edu.institution || 'Institution'} - {edu.degree || 'Degree'}</>
                                ) : (
                                  `Education Entry ${index + 1}`
                                )}
                              </Box>
                              <AccordionIcon />
                            </AccordionButton>
                          </h2>
                          <AccordionPanel pb={4}>
                            <VStack align="stretch" spacing={4}>
                              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                                <FormControl>
                                  <FormLabel>Institution</FormLabel>
                                  <Input 
                                    value={edu.institution} 
                                    onChange={(e) => handleEducationChange(edu.id, 'institution', e.target.value)}
                                    placeholder="University or School Name"
                                  />
                                </FormControl>
                                
                                <FormControl>
                                  <FormLabel>Degree</FormLabel>
                                  <Input 
                                    value={edu.degree} 
                                    onChange={(e) => handleEducationChange(edu.id, 'degree', e.target.value)}
                                    placeholder="e.g. Bachelor of Science"
                                  />
                                </FormControl>
                                
                                <FormControl>
                                  <FormLabel>Field of Study</FormLabel>
                                  <Input 
                                    value={edu.fieldOfStudy} 
                                    onChange={(e) => handleEducationChange(edu.id, 'fieldOfStudy', e.target.value)}
                                    placeholder="e.g. Computer Science"
                                  />
                                </FormControl>
                                
                                <SimpleGrid columns={2} spacing={4}>
                                  <FormControl>
                                    <FormLabel>Start Date</FormLabel>
                                    <Input 
                                      type="month"
                                      value={edu.startDate} 
                                      onChange={(e) => handleEducationChange(edu.id, 'startDate', e.target.value)}
                                    />
                                  </FormControl>
                                  
                                  <FormControl>
                                    <FormLabel>End Date</FormLabel>
                                    <Input 
                                      type="month"
                                      value={edu.endDate} 
                                      onChange={(e) => handleEducationChange(edu.id, 'endDate', e.target.value)}
                                    />
                                  </FormControl>
                                </SimpleGrid>
                              </SimpleGrid>
                              
                              <FormControl>
                                <FormLabel>Description</FormLabel>
                                <Textarea 
                                  value={edu.description} 
                                  onChange={(e) => handleEducationChange(edu.id, 'description', e.target.value)}
                                  placeholder="Relevant coursework, achievements, or activities"
                                />
                              </FormControl>
                              
                              <Flex justify="flex-end">
                                <Button
                                  leftIcon={<DeleteIcon />}
                                  onClick={() => handleRemoveEducation(edu.id)}
                                  colorScheme="red"
                                  variant="ghost"
                                  size="sm"
                                >
                                  Remove
                                </Button>
                              </Flex>
                            </VStack>
                          </AccordionPanel>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  )}
                </VStack>
              )}
              
              {activeSection === 'experience' && (
                <VStack align="stretch" spacing={6}>
                  <Flex justify="space-between" align="center">
                    <Heading as="h2" size="lg">
                      Work Experience
                    </Heading>
                    <Button
                      leftIcon={<AddIcon />}
                      onClick={handleAddExperience}
                      colorScheme="blue"
                      size="sm"
                    >
                      Add Experience
                    </Button>
                  </Flex>
                  
                  {cv.experience.length === 0 ? (
                    <Box
                      p={8}
                      textAlign="center"
                      borderWidth="1px"
                      borderRadius="lg"
                      borderStyle="dashed"
                    >
                      <Text color="gray.500" mb={4}>
                        No work experience entries yet. Add your professional background to showcase your skills.
                      </Text>
                      <Button
                        leftIcon={<AddIcon />}
                        onClick={handleAddExperience}
                        colorScheme="blue"
                        size="md"
                      >
                        Add Experience
                      </Button>
                    </Box>
                  ) : (
                    <Accordion allowMultiple defaultIndex={[0]}>
                      {cv.experience.map((exp, index) => (
                        <AccordionItem key={exp.id} mb={4} borderWidth="1px" borderRadius="md">
                          <h2>
                            <AccordionButton py={4}>
                              <Box flex="1" textAlign="left" fontWeight="medium">
                                {exp.company || exp.position ? (
                                  <>{exp.position || 'Position'} - {exp.company || 'Company'}</>
                                ) : (
                                  `Experience Entry ${index + 1}`
                                )}
                              </Box>
                              <AccordionIcon />
                            </AccordionButton>
                          </h2>
                          <AccordionPanel pb={4}>
                            <VStack align="stretch" spacing={4}>
                              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                                <FormControl>
                                  <FormLabel>Company</FormLabel>
                                  <Input 
                                    value={exp.company} 
                                    onChange={(e) => handleExperienceChange(exp.id, 'company', e.target.value)}
                                    placeholder="Company Name"
                                  />
                                </FormControl>
                                
                                <FormControl>
                                  <FormLabel>Position</FormLabel>
                                  <Input 
                                    value={exp.position} 
                                    onChange={(e) => handleExperienceChange(exp.id, 'position', e.target.value)}
                                    placeholder="e.g. Software Engineer"
                                  />
                                </FormControl>
                                
                                <FormControl>
                                  <FormLabel>Location</FormLabel>
                                  <Input 
                                    value={exp.location} 
                                    onChange={(e) => handleExperienceChange(exp.id, 'location', e.target.value)}
                                    placeholder="e.g. New York, NY"
                                  />
                                </FormControl>
                                
                                <SimpleGrid columns={2} spacing={4}>
                                  <FormControl>
                                    <FormLabel>Start Date</FormLabel>
                                    <Input 
                                      type="month"
                                      value={exp.startDate} 
                                      onChange={(e) => handleExperienceChange(exp.id, 'startDate', e.target.value)}
                                    />
                                  </FormControl>
                                  
                                  <FormControl>
                                    <FormLabel>End Date</FormLabel>
                                    <Input 
                                      type="month"
                                      value={exp.endDate} 
                                      onChange={(e) => handleExperienceChange(exp.id, 'endDate', e.target.value)}
                                      placeholder="Present"
                                    />
                                  </FormControl>
                                </SimpleGrid>
                              </SimpleGrid>
                              
                              <FormControl>
                                <FormLabel>Description</FormLabel>
                                <Textarea 
                                  value={exp.description} 
                                  onChange={(e) => handleExperienceChange(exp.id, 'description', e.target.value)}
                                  placeholder="Describe your responsibilities, achievements, and the skills you used"
                                  minH="150px"
                                />
                              </FormControl>
                              
                              <Flex justify="flex-end">
                                <Button
                                  leftIcon={<DeleteIcon />}
                                  onClick={() => handleRemoveExperience(exp.id)}
                                  colorScheme="red"
                                  variant="ghost"
                                  size="sm"
                                >
                                  Remove
                                </Button>
                              </Flex>
                            </VStack>
                          </AccordionPanel>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  )}
                </VStack>
              )}
              
              {activeSection === 'skills' && (
                <VStack align="stretch" spacing={6}>
                  <Flex justify="space-between" align="center">
                    <Heading as="h2" size="lg">
                      Skills
                    </Heading>
                    <Button
                      leftIcon={<AddIcon />}
                      onClick={handleAddSkill}
                      colorScheme="blue"
                      size="sm"
                    >
                      Add Skill
                    </Button>
                  </Flex>
                  
                  {cv.skills.length === 0 ? (
                    <Box
                      p={8}
                      textAlign="center"
                      borderWidth="1px"
                      borderRadius="lg"
                      borderStyle="dashed"
                    >
                      <Text color="gray.500" mb={4}>
                        No skills added yet. Highlight your technical and soft skills to stand out.
                      </Text>
                      <Button
                        leftIcon={<AddIcon />}
                        onClick={handleAddSkill}
                        colorScheme="blue"
                        size="md"
                      >
                        Add Skill
                      </Button>
                    </Box>
                  ) : (
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      {cv.skills.map((skill) => (
                        <Flex 
                          key={skill.id} 
                          borderWidth="1px" 
                          borderRadius="md" 
                          p={4}
                          align="center"
                          justify="space-between"
                        >
                          <Input 
                            value={skill.name} 
                            onChange={(e) => handleSkillChange(skill.id, 'name', e.target.value)}
                            placeholder="Skill name (e.g. JavaScript, Project Management)"
                            border="none"
                            _focus={{
                              border: "none",
                              boxShadow: "none"
                            }}
                          />
                          <IconButton
                            icon={<DeleteIcon />}
                            onClick={() => handleRemoveSkill(skill.id)}
                            colorScheme="red"
                            variant="ghost"
                            aria-label="Remove skill"
                            size="sm"
                          />
                        </Flex>
                      ))}
                    </SimpleGrid>
                  )}
                </VStack>
              )}
            </Box>
          </Flex>
          
          {/* Bottom Toolbar */}
          <Flex justify="space-between" mt={12} pt={6} borderTop="1px" borderColor={borderColor}>
            <Button
              leftIcon={<ArrowBackIcon />}
              onClick={() => navigate('/dashboard')}
              variant="outline"
            >
              Back to Dashboard
            </Button>
            
            <HStack>
              <Button
                onClick={handlePreview}
                variant="outline"
                leftIcon={<ViewIcon />}
              >
                Preview
              </Button>
              <Button
                onClick={handleSave}
                colorScheme="blue"
                bg="brand.500"
                _hover={{ bg: "brand.600" }}
                isLoading={saving}
                leftIcon={<CheckIcon />}
              >
                Save
              </Button>
            </HStack>
          </Flex>
        </VStack>
      )}
    </Container>
  )
}

export default EditCV 