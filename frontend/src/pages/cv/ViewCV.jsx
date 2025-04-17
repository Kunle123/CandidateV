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
  Divider,
  useToast,
  useColorModeValue,
  SimpleGrid,
  Link,
  Icon,
  Badge,
  Spinner,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react'
import { 
  EditIcon, 
  DownloadIcon, 
  EmailIcon, 
  PhoneIcon, 
  LinkIcon, 
  ChevronDownIcon,
  ArrowBackIcon,
} from '@chakra-ui/icons'
import { FaLinkedin, FaGlobe, FaMapMarkerAlt } from 'react-icons/fa'
import CVOptimizer from '../../components/ai/CVOptimizer'

// Mock CV data - in a real app this would come from an API
const mockCV = {
  id: '1',
  title: 'Software Developer CV',
  personalInfo: {
    fullName: 'Jane Smith',
    jobTitle: 'Senior Software Engineer',
    email: 'jane.smith@example.com',
    phone: '+1 (555) 123-4567',
    address: 'San Francisco, CA',
    linkedIn: 'linkedin.com/in/janesmith',
    website: 'janesmith.dev',
    summary: 'Experienced software engineer with 8+ years of experience in full-stack development, specializing in React, Node.js, and cloud technologies. Passionate about creating scalable, user-friendly applications and mentoring junior developers.',
  },
  education: [
    {
      id: 1,
      institution: 'University of California, Berkeley',
      degree: 'Master of Science',
      fieldOfStudy: 'Computer Science',
      startDate: '2012-09',
      endDate: '2014-06',
      description: 'Focused on software engineering and artificial intelligence. Graduated with honors.',
    },
    {
      id: 2,
      institution: 'Stanford University',
      degree: 'Bachelor of Science',
      fieldOfStudy: 'Computer Engineering',
      startDate: '2008-09',
      endDate: '2012-06',
      description: 'Minor in Mathematics. Member of the robotics club.',
    }
  ],
  experience: [
    {
      id: 1,
      company: 'Tech Innovations Inc.',
      position: 'Senior Software Engineer',
      location: 'San Francisco, CA',
      startDate: '2020-03',
      endDate: '',
      current: true,
      description: 'Lead developer for the company\'s flagship product. Architected and implemented a microservices-based backend system that improved scalability by 200%. Mentored junior developers and introduced modern testing practices that reduced bugs by 40%.',
    },
    {
      id: 2,
      company: 'Global Solutions LLC',
      position: 'Software Engineer',
      location: 'San Jose, CA',
      startDate: '2016-05',
      endDate: '2020-02',
      current: false,
      description: 'Developed and maintained web applications using React.js and Node.js. Implemented CI/CD pipelines that reduced deployment time by 70%. Collaborated with product managers to define and implement new features.',
    },
    {
      id: 3,
      company: 'StartUp Ventures',
      position: 'Junior Developer',
      location: 'Oakland, CA',
      startDate: '2014-07',
      endDate: '2016-04',
      current: false,
      description: 'Worked in an agile team developing a customer-facing web application. Responsible for front-end development using JavaScript and early versions of React.',
    }
  ],
  skills: [
    { id: 1, name: 'JavaScript', level: 'Expert' },
    { id: 2, name: 'React.js', level: 'Expert' },
    { id: 3, name: 'Node.js', level: 'Advanced' },
    { id: 4, name: 'Python', level: 'Intermediate' },
    { id: 5, name: 'AWS', level: 'Advanced' },
    { id: 6, name: 'Docker', level: 'Intermediate' },
    { id: 7, name: 'GraphQL', level: 'Advanced' },
    { id: 8, name: 'Agile Methodology', level: 'Expert' },
  ],
  templateId: 'professional',
}

const ViewCV = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  
  const [cv, setCV] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(0)
  
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const headingColor = useColorModeValue('gray.800', 'white')
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const accentColor = useColorModeValue('brand.600', 'brand.400')
  
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
  
  const handleEdit = () => {
    navigate(`/cv/edit/${id}`)
  }
  
  const handleExport = (format) => {
    toast({
      title: `Exporting CV as ${format}`,
      description: 'Your CV will be downloaded shortly.',
      status: 'info',
      duration: 3000,
      isClosable: true,
    })
    
    // In a real app, this would call an API to generate the file
    setTimeout(() => {
      toast({
        title: 'Export complete',
        description: `Your CV has been exported as ${format}.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    }, 2000)
  }
  
  const formatDate = (dateString) => {
    if (!dateString) return 'Present'
    
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short'
    })
  }
  
  const handleApplySuggestions = (selectedSuggestions, suggestions) => {
    // In a real app, this would update the CV data with the selected suggestions
    // For now, just show a success message
    toast({
      title: 'CV Optimized',
      description: 'Your CV has been optimized for the job application',
      status: 'success',
      duration: 3000,
      isClosable: true,
    })
  }

  if (loading) {
    return (
      <Flex justify="center" align="center" height="50vh">
        <Spinner size="xl" color="brand.500" thickness="4px" />
      </Flex>
    )
  }

  return (
    <Container maxW="1200px" py={8}>
      {cv && (
        <VStack spacing={8} align="stretch">
          {/* Actions Bar */}
          <Flex 
            justifyContent="space-between" 
            alignItems="center"
            flexDirection={{ base: 'column', sm: 'row' }}
            gap={4}
          >
            <Button
              leftIcon={<ArrowBackIcon />}
              onClick={() => navigate('/dashboard')}
              variant="outline"
            >
              Back to Dashboard
            </Button>
            
            <HStack>
              <Button
                leftIcon={<EditIcon />}
                onClick={handleEdit}
                colorScheme="blue"
                variant="outline"
              >
                Edit
              </Button>
              
              <Menu>
                <MenuButton
                  as={Button}
                  rightIcon={<ChevronDownIcon />}
                  leftIcon={<DownloadIcon />}
                  colorScheme="blue"
                  bg="brand.500"
                  _hover={{ bg: "brand.600" }}
                >
                  Export
                </MenuButton>
                <MenuList>
                  <MenuItem onClick={() => handleExport('PDF')}>PDF</MenuItem>
                  <MenuItem onClick={() => handleExport('DOCX')}>DOCX</MenuItem>
                  <MenuItem onClick={() => handleExport('TXT')}>Text</MenuItem>
                </MenuList>
              </Menu>
            </HStack>
          </Flex>
          
          {/* Tabs for Preview and Optimize */}
          <Tabs colorScheme="blue" isFitted onChange={setActiveTab} index={activeTab}>
            <TabList mb={4}>
              <Tab>Preview</Tab>
              <Tab>Optimize for Job</Tab>
            </TabList>
            <TabPanels>
              {/* Preview Tab */}
              <TabPanel px={0}>
                {/* CV Preview */}
                <Box
                  bg={bgColor}
                  borderWidth="1px"
                  borderColor={borderColor}
                  borderRadius="md"
                  overflow="hidden"
                  boxShadow="lg"
                >
                  {/* Header Section */}
                  <Box p={8} bg="brand.600" color="white">
                    <VStack align="start" spacing={2}>
                      <Heading as="h1" size="xl" fontWeight="bold">
                        {cv.personalInfo.fullName}
                      </Heading>
                      <Text fontSize="xl">{cv.personalInfo.jobTitle}</Text>
                    </VStack>
                  </Box>
                  
                  {/* Contact Info */}
                  <Flex 
                    bg="gray.50" 
                    p={4} 
                    flexWrap="wrap" 
                    justifyContent="center" 
                    gap={4}
                    display={{ base: 'flex', md: 'flex' }}
                    _dark={{ bg: 'gray.700' }}
                  >
                    {cv.personalInfo.email && (
                      <HStack spacing={2}>
                        <Icon as={EmailIcon} color={accentColor} />
                        <Text>{cv.personalInfo.email}</Text>
                      </HStack>
                    )}
                    
                    {cv.personalInfo.phone && (
                      <HStack spacing={2}>
                        <Icon as={PhoneIcon} color={accentColor} />
                        <Text>{cv.personalInfo.phone}</Text>
                      </HStack>
                    )}
                    
                    {cv.personalInfo.address && (
                      <HStack spacing={2}>
                        <Icon as={FaMapMarkerAlt} color={accentColor} />
                        <Text>{cv.personalInfo.address}</Text>
                      </HStack>
                    )}
                    
                    {cv.personalInfo.linkedIn && (
                      <HStack spacing={2}>
                        <Icon as={FaLinkedin} color={accentColor} />
                        <Link href={`https://${cv.personalInfo.linkedIn}`} isExternal>
                          {cv.personalInfo.linkedIn}
                        </Link>
                      </HStack>
                    )}
                    
                    {cv.personalInfo.website && (
                      <HStack spacing={2}>
                        <Icon as={FaGlobe} color={accentColor} />
                        <Link href={`https://${cv.personalInfo.website}`} isExternal>
                          {cv.personalInfo.website}
                        </Link>
                      </HStack>
                    )}
                  </Flex>
                  
                  {/* Main Content */}
                  <Box p={8}>
                    <VStack spacing={8} align="stretch">
                      {/* Summary */}
                      {cv.personalInfo.summary && (
                        <Box>
                          <Heading as="h2" size="md" mb={4} color={headingColor}>
                            PROFESSIONAL SUMMARY
                          </Heading>
                          <Text color={textColor}>{cv.personalInfo.summary}</Text>
                        </Box>
                      )}
                      
                      {/* Experience */}
                      {cv.experience && cv.experience.length > 0 && (
                        <Box>
                          <Heading as="h2" size="md" mb={4} color={headingColor}>
                            WORK EXPERIENCE
                          </Heading>
                          <VStack spacing={6} align="stretch">
                            {cv.experience.map((exp) => (
                              <Box key={exp.id}>
                                <Flex 
                                  justify="space-between" 
                                  align={{ base: 'start', md: 'center' }}
                                  direction={{ base: 'column', md: 'row' }}
                                  gap={{ base: 1, md: 0 }}
                                >
                                  <Heading as="h3" size="sm" fontWeight="bold">
                                    {exp.position} | {exp.company}
                                  </Heading>
                                  <Text fontSize="sm" color={textColor}>
                                    {formatDate(exp.startDate)} - {formatDate(exp.endDate)}
                                  </Text>
                                </Flex>
                                {exp.location && (
                                  <Text fontSize="sm" color={textColor} mb={2}>
                                    {exp.location}
                                  </Text>
                                )}
                                <Text color={textColor}>{exp.description}</Text>
                              </Box>
                            ))}
                          </VStack>
                        </Box>
                      )}
                      
                      {/* Education */}
                      {cv.education && cv.education.length > 0 && (
                        <Box>
                          <Heading as="h2" size="md" mb={4} color={headingColor}>
                            EDUCATION
                          </Heading>
                          <VStack spacing={6} align="stretch">
                            {cv.education.map((edu) => (
                              <Box key={edu.id}>
                                <Flex 
                                  justify="space-between" 
                                  align={{ base: 'start', md: 'center' }}
                                  direction={{ base: 'column', md: 'row' }}
                                  gap={{ base: 1, md: 0 }}
                                >
                                  <Heading as="h3" size="sm" fontWeight="bold">
                                    {edu.degree} in {edu.fieldOfStudy}
                                  </Heading>
                                  <Text fontSize="sm" color={textColor}>
                                    {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                                  </Text>
                                </Flex>
                                <Text fontSize="sm" color={textColor} mb={2}>
                                  {edu.institution}
                                </Text>
                                {edu.description && (
                                  <Text color={textColor}>{edu.description}</Text>
                                )}
                              </Box>
                            ))}
                          </VStack>
                        </Box>
                      )}
                      
                      {/* Skills */}
                      {cv.skills && cv.skills.length > 0 && (
                        <Box>
                          <Heading as="h2" size="md" mb={4} color={headingColor}>
                            SKILLS
                          </Heading>
                          <Flex wrap="wrap" gap={2}>
                            {cv.skills.map((skill) => (
                              <Badge 
                                key={skill.id} 
                                colorScheme="blue" 
                                p={2} 
                                borderRadius="md"
                                variant="subtle"
                              >
                                {skill.name}
                              </Badge>
                            ))}
                          </Flex>
                        </Box>
                      )}
                    </VStack>
                  </Box>
                </Box>
              </TabPanel>
              
              {/* Optimize Tab */}
              <TabPanel px={0}>
                <CVOptimizer cv={cv} onApplySuggestions={handleApplySuggestions} />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </VStack>
      )}
    </Container>
  )
}

export default ViewCV 