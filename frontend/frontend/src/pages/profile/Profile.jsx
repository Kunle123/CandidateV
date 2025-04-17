import { useState, useEffect } from 'react'
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
  Avatar,
  Divider,
  useToast,
  useColorModeValue,
  Card,
  CardHeader,
  CardBody,
  Image,
  IconButton,
  Badge,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Switch,
  Spinner,
} from '@chakra-ui/react'
import { EditIcon, CheckIcon, CloseIcon } from '@chakra-ui/icons'
import { useAuth } from '../../context/AuthContext'

// Mock user data - in a real app this would come from an API
const mockUserData = {
  id: '1',
  name: 'Jane Smith',
  email: 'jane.smith@example.com',
  avatar: null,
  jobTitle: 'Senior Software Engineer',
  location: 'San Francisco, CA',
  phone: '+1 (555) 123-4567',
  bio: 'Experienced software engineer with 8+ years of experience specializing in full-stack development with React, Node.js, and cloud technologies.',
  links: {
    linkedin: 'linkedin.com/in/janesmith',
    github: 'github.com/janesmith',
    website: 'janesmith.dev',
  },
  preferences: {
    darkMode: false,
    emailNotifications: true,
    marketingEmails: false,
  },
  subscription: {
    plan: 'free',
    validUntil: null,
    paymentMethod: null,
  },
}

const Profile = () => {
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({})
  const [activeTab, setActiveTab] = useState(0)
  
  const { user } = useAuth()
  const toast = useToast()
  
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  
  useEffect(() => {
    // In a real app, this would fetch the user profile data from an API
    const fetchUserData = async () => {
      try {
        // Simulate API delay
        setTimeout(() => {
          setUserData(mockUserData)
          setFormData(mockUserData)
          setLoading(false)
        }, 1000)
      } catch (error) {
        console.error('Error fetching user data:', error)
        toast({
          title: 'Error loading profile',
          description: 'Could not load your profile data. Please try again later.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
        setLoading(false)
      }
    }
    
    fetchUserData()
  }, [toast])
  
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }
  
  const handleLinkChange = (platform, value) => {
    setFormData({
      ...formData,
      links: {
        ...formData.links,
        [platform]: value,
      },
    })
  }
  
  const handlePreferenceChange = (preference, value) => {
    setFormData({
      ...formData,
      preferences: {
        ...formData.preferences,
        [preference]: value,
      },
    })
  }
  
  const handleSave = () => {
    // In a real app, this would save the user profile data to an API
    setLoading(true)
    setTimeout(() => {
      setUserData(formData)
      setEditMode(false)
      setLoading(false)
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    }, 1000)
  }
  
  const handleCancel = () => {
    setFormData(userData)
    setEditMode(false)
  }
  
  const handleUpgradePlan = () => {
    toast({
      title: 'Subscription upgrade',
      description: 'This feature is not implemented yet.',
      status: 'info',
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
      {userData && (
        <VStack spacing={8} align="stretch">
          <Heading as="h1" size="xl" mb={2}>
            My Profile
          </Heading>
          
          <Tabs 
            colorScheme="blue" 
            isFitted 
            variant="enclosed" 
            index={activeTab} 
            onChange={(index) => setActiveTab(index)}
          >
            <TabList mb="1em">
              <Tab>Personal Info</Tab>
              <Tab>Preferences</Tab>
              <Tab>Subscription</Tab>
            </TabList>
            <TabPanels>
              {/* Personal Info Tab */}
              <TabPanel>
                <Card borderWidth="1px" borderColor={borderColor} borderRadius="lg">
                  <CardHeader>
                    <Flex justify="space-between" align="center">
                      <Heading size="md">Personal Information</Heading>
                      {!editMode ? (
                        <Button
                          leftIcon={<EditIcon />}
                          onClick={() => setEditMode(true)}
                          colorScheme="blue"
                          variant="outline"
                          size="sm"
                        >
                          Edit
                        </Button>
                      ) : (
                        <HStack>
                          <Button
                            leftIcon={<CloseIcon />}
                            onClick={handleCancel}
                            colorScheme="red"
                            variant="outline"
                            size="sm"
                          >
                            Cancel
                          </Button>
                          <Button
                            leftIcon={<CheckIcon />}
                            onClick={handleSave}
                            colorScheme="green"
                            variant="solid"
                            size="sm"
                          >
                            Save
                          </Button>
                        </HStack>
                      )}
                    </Flex>
                  </CardHeader>
                  
                  <CardBody>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
                      {/* Profile Image */}
                      <VStack spacing={4} align="center">
                        <Avatar 
                          size="2xl" 
                          name={formData.name} 
                          src={formData.avatar}
                        />
                        {editMode && (
                          <Button
                            size="sm"
                            colorScheme="blue"
                          >
                            Change Image
                          </Button>
                        )}
                      </VStack>
                      
                      {/* Profile Fields */}
                      <VStack spacing={4} align="stretch">
                        <FormControl>
                          <FormLabel>Full Name</FormLabel>
                          <Input 
                            name="name" 
                            value={formData.name} 
                            onChange={handleInputChange}
                            isReadOnly={!editMode} 
                          />
                        </FormControl>
                        
                        <FormControl>
                          <FormLabel>Email</FormLabel>
                          <Input 
                            name="email" 
                            value={formData.email} 
                            onChange={handleInputChange}
                            isReadOnly 
                          />
                        </FormControl>
                        
                        <FormControl>
                          <FormLabel>Job Title</FormLabel>
                          <Input 
                            name="jobTitle" 
                            value={formData.jobTitle} 
                            onChange={handleInputChange}
                            isReadOnly={!editMode} 
                          />
                        </FormControl>
                        
                        <FormControl>
                          <FormLabel>Location</FormLabel>
                          <Input 
                            name="location" 
                            value={formData.location} 
                            onChange={handleInputChange}
                            isReadOnly={!editMode} 
                          />
                        </FormControl>
                        
                        <FormControl>
                          <FormLabel>Phone</FormLabel>
                          <Input 
                            name="phone" 
                            value={formData.phone} 
                            onChange={handleInputChange}
                            isReadOnly={!editMode} 
                          />
                        </FormControl>
                      </VStack>
                    </SimpleGrid>
                    
                    <VStack spacing={4} align="stretch" mt={8}>
                      <FormControl>
                        <FormLabel>Bio</FormLabel>
                        <Textarea 
                          name="bio" 
                          value={formData.bio} 
                          onChange={handleInputChange}
                          isReadOnly={!editMode} 
                          minH="150px"
                        />
                      </FormControl>
                      
                      <Divider my={2} />
                      
                      <Heading size="sm" mb={2}>Social Links</Heading>
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        <FormControl>
                          <FormLabel>LinkedIn</FormLabel>
                          <Input 
                            value={formData.links.linkedin} 
                            onChange={(e) => handleLinkChange('linkedin', e.target.value)}
                            isReadOnly={!editMode} 
                            placeholder="linkedin.com/in/username"
                          />
                        </FormControl>
                        
                        <FormControl>
                          <FormLabel>GitHub</FormLabel>
                          <Input 
                            value={formData.links.github} 
                            onChange={(e) => handleLinkChange('github', e.target.value)}
                            isReadOnly={!editMode} 
                            placeholder="github.com/username"
                          />
                        </FormControl>
                        
                        <FormControl>
                          <FormLabel>Portfolio Website</FormLabel>
                          <Input 
                            value={formData.links.website} 
                            onChange={(e) => handleLinkChange('website', e.target.value)}
                            isReadOnly={!editMode} 
                            placeholder="example.com"
                          />
                        </FormControl>
                      </SimpleGrid>
                    </VStack>
                  </CardBody>
                </Card>
              </TabPanel>
              
              {/* Preferences Tab */}
              <TabPanel>
                <Card borderWidth="1px" borderColor={borderColor} borderRadius="lg">
                  <CardHeader>
                    <Heading size="md">Account Preferences</Heading>
                  </CardHeader>
                  
                  <CardBody>
                    <VStack spacing={6} align="stretch">
                      <Heading size="sm" mb={2}>Appearance</Heading>
                      <HStack justify="space-between">
                        <Text>Dark Mode</Text>
                        <Switch 
                          colorScheme="blue"
                          isChecked={formData.preferences.darkMode}
                          onChange={(e) => handlePreferenceChange('darkMode', e.target.checked)}
                        />
                      </HStack>
                      
                      <Divider />
                      
                      <Heading size="sm" mb={2}>Notifications</Heading>
                      <HStack justify="space-between">
                        <Text>Email Notifications</Text>
                        <Switch 
                          colorScheme="blue"
                          isChecked={formData.preferences.emailNotifications}
                          onChange={(e) => handlePreferenceChange('emailNotifications', e.target.checked)}
                        />
                      </HStack>
                      
                      <HStack justify="space-between">
                        <Text>Marketing Emails</Text>
                        <Switch 
                          colorScheme="blue"
                          isChecked={formData.preferences.marketingEmails}
                          onChange={(e) => handlePreferenceChange('marketingEmails', e.target.checked)}
                        />
                      </HStack>
                      
                      <Divider />
                      
                      <Heading size="sm" mb={4}>Security</Heading>
                      <Button colorScheme="blue" variant="outline" size="md" maxW="200px">
                        Change Password
                      </Button>
                    </VStack>
                  </CardBody>
                </Card>
              </TabPanel>
              
              {/* Subscription Tab */}
              <TabPanel>
                <Card borderWidth="1px" borderColor={borderColor} borderRadius="lg">
                  <CardHeader>
                    <Heading size="md">Subscription Plan</Heading>
                  </CardHeader>
                  
                  <CardBody>
                    <VStack spacing={6} align="stretch">
                      <Box p={5} borderWidth="1px" borderRadius="lg" bg={useColorModeValue('gray.50', 'gray.700')}>
                        <Flex justify="space-between" align="center">
                          <VStack align="start" spacing={1}>
                            <Heading size="md" color={userData.subscription.plan === 'free' ? 'gray.600' : 'brand.500'}>
                              {userData.subscription.plan === 'free' ? 'Free Plan' : 'Premium Plan'}
                            </Heading>
                            <Text fontSize="sm">
                              {userData.subscription.plan === 'free' 
                                ? 'Basic features with limited usage' 
                                : 'Full access to all premium features'}
                            </Text>
                          </VStack>
                          
                          <Badge 
                            colorScheme={userData.subscription.plan === 'free' ? 'gray' : 'green'} 
                            p={2} 
                            borderRadius="md"
                          >
                            {userData.subscription.plan === 'free' ? 'CURRENT' : 'PREMIUM'}
                          </Badge>
                        </Flex>
                      </Box>
                      
                      {userData.subscription.plan === 'free' && (
                        <Box p={5} borderWidth="1px" borderRadius="lg" bg={useColorModeValue('blue.50', 'blue.900')}>
                          <VStack align="stretch" spacing={4}>
                            <Heading size="md" color="brand.500">Upgrade to Premium</Heading>
                            <Text>Get access to advanced CV optimization, unlimited templates, and priority support.</Text>
                            
                            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                              <VStack align="start" p={3} borderWidth="1px" borderRadius="md" bg={useColorModeValue('white', 'gray.700')}>
                                <Heading size="sm">Monthly</Heading>
                                <HStack>
                                  <Text fontSize="2xl" fontWeight="bold">$9.99</Text>
                                  <Text fontSize="sm">/month</Text>
                                </HStack>
                                <Button 
                                  onClick={handleUpgradePlan}
                                  colorScheme="blue" 
                                  size="sm" 
                                  mt={2}
                                >
                                  Select
                                </Button>
                              </VStack>
                              
                              <VStack align="start" p={3} borderWidth="1px" borderRadius="md" bg={useColorModeValue('white', 'gray.700')}>
                                <HStack>
                                  <Heading size="sm">Annual</Heading>
                                  <Badge colorScheme="green">SAVE 20%</Badge>
                                </HStack>
                                <HStack>
                                  <Text fontSize="2xl" fontWeight="bold">$7.99</Text>
                                  <Text fontSize="sm">/month</Text>
                                </HStack>
                                <Button 
                                  onClick={handleUpgradePlan}
                                  colorScheme="blue" 
                                  size="sm" 
                                  mt={2}
                                >
                                  Select
                                </Button>
                              </VStack>
                            </SimpleGrid>
                          </VStack>
                        </Box>
                      )}
                      
                      {userData.subscription.plan !== 'free' && (
                        <VStack align="stretch" spacing={4}>
                          <Box p={4} borderWidth="1px" borderRadius="md">
                            <VStack align="start" spacing={2}>
                              <Text fontWeight="bold">Next billing date</Text>
                              <Text>December 15, 2023</Text>
                            </VStack>
                          </Box>
                          
                          <Box p={4} borderWidth="1px" borderRadius="md">
                            <VStack align="start" spacing={2}>
                              <Text fontWeight="bold">Payment method</Text>
                              <HStack>
                                <Text>Visa ending in 4242</Text>
                                <Button size="xs" variant="link" colorScheme="blue">
                                  Update
                                </Button>
                              </HStack>
                            </VStack>
                          </Box>
                          
                          <Button colorScheme="red" variant="outline" size="md" maxW="200px">
                            Cancel Subscription
                          </Button>
                        </VStack>
                      )}
                    </VStack>
                  </CardBody>
                </Card>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </VStack>
      )}
    </Container>
  )
}

export default Profile 