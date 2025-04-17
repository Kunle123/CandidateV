import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  useColorModeValue,
  useToast,
  VStack,
  HStack,
  Avatar,
  IconButton,
  Switch,
  FormHelperText,
  InputGroup,
  InputLeftAddon,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from '@chakra-ui/react';
import { FaCamera, FaFacebook, FaGithub, FaLinkedin, FaTwitter } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Mock profile data - in a real app this would come from an API
  const [profile, setProfile] = useState({
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ')[1] || '',
    email: user?.email || '',
    phone: '+1 (555) 123-4567',
    location: 'New York, NY',
    bio: 'Experienced software developer with a passion for creating elegant solutions to complex problems.',
    jobTitle: 'Senior Software Engineer',
    website: 'https://example.com',
    skills: 'JavaScript, React, Node.js, TypeScript, GraphQL',
    social: {
      linkedin: 'johndoe',
      twitter: 'johndoe',
      github: 'johndoe',
      facebook: 'johndoe',
    },
    preferences: {
      emailNotifications: true,
      darkMode: false,
      publicProfile: true,
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile({
      ...profile,
      [name]: value,
    });
  };

  const handleSocialChange = (e) => {
    const { name, value } = e.target;
    setProfile({
      ...profile,
      social: {
        ...profile.social,
        [name]: value,
      },
    });
  };

  const handlePreferenceChange = (name) => {
    setProfile({
      ...profile,
      preferences: {
        ...profile.preferences,
        [name]: !profile.preferences[name],
      },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    }, 1500);
  };

  const headerBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Container maxW="container.lg" py={8}>
      <Box 
        bg={headerBg} 
        p={6} 
        borderRadius="lg" 
        borderWidth="1px" 
        borderColor={borderColor}
        mb={6}
        boxShadow="sm"
      >
        <Heading size="lg" mb={2}>Profile</Heading>
        <Text color="gray.500">Manage your personal information and preferences</Text>
      </Box>

      <Tabs colorScheme="blue" isLazy>
        <TabList mb={6}>
          <Tab>Personal Info</Tab>
          <Tab>Social Media</Tab>
          <Tab>Preferences</Tab>
        </TabList>

        <TabPanels>
          <TabPanel px={0}>
            <Box 
              bg={headerBg} 
              p={6} 
              borderRadius="lg" 
              borderWidth="1px" 
              borderColor={borderColor}
              boxShadow="sm"
            >
              <form onSubmit={handleSubmit}>
                <VStack spacing={6} align="stretch">
                  <Flex 
                    direction={{ base: "column", md: "row" }}
                    align={{ base: "center", md: "start" }}
                    justify="space-between"
                    mb={6}
                  >
                    <HStack spacing={4} align="center" mb={{ base: 4, md: 0 }}>
                      <Avatar 
                        size="xl"
                        name={`${profile.firstName} ${profile.lastName}`}
                        src={user?.profileImage}
                      />
                      <Box position="relative">
                        <IconButton
                          aria-label="Change profile picture"
                          icon={<FaCamera />}
                          isRound
                          size="sm"
                          position="absolute"
                          bottom={0}
                          left={0}
                          colorScheme="blue"
                        />
                      </Box>
                    </HStack>
                    <Button
                      variant="outline"
                      colorScheme="blue"
                      isLoading={isLoading}
                      type="submit"
                      alignSelf={{ base: "center", md: "flex-end" }}
                    >
                      Save Changes
                    </Button>
                  </Flex>

                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                    <FormControl id="firstName">
                      <FormLabel>First Name</FormLabel>
                      <Input
                        name="firstName"
                        value={profile.firstName}
                        onChange={handleChange}
                      />
                    </FormControl>
                    <FormControl id="lastName">
                      <FormLabel>Last Name</FormLabel>
                      <Input
                        name="lastName"
                        value={profile.lastName}
                        onChange={handleChange}
                      />
                    </FormControl>
                  </SimpleGrid>

                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                    <FormControl id="email">
                      <FormLabel>Email</FormLabel>
                      <Input
                        name="email"
                        type="email"
                        value={profile.email}
                        onChange={handleChange}
                        isReadOnly
                      />
                      <FormHelperText>Email cannot be changed</FormHelperText>
                    </FormControl>
                    <FormControl id="phone">
                      <FormLabel>Phone</FormLabel>
                      <Input
                        name="phone"
                        value={profile.phone}
                        onChange={handleChange}
                      />
                    </FormControl>
                  </SimpleGrid>

                  <FormControl id="jobTitle">
                    <FormLabel>Job Title</FormLabel>
                    <Input
                      name="jobTitle"
                      value={profile.jobTitle}
                      onChange={handleChange}
                    />
                  </FormControl>

                  <FormControl id="location">
                    <FormLabel>Location</FormLabel>
                    <Input
                      name="location"
                      value={profile.location}
                      onChange={handleChange}
                    />
                  </FormControl>

                  <FormControl id="website">
                    <FormLabel>Website</FormLabel>
                    <Input
                      name="website"
                      value={profile.website}
                      onChange={handleChange}
                    />
                  </FormControl>

                  <FormControl id="bio">
                    <FormLabel>Bio</FormLabel>
                    <Textarea
                      name="bio"
                      value={profile.bio}
                      onChange={handleChange}
                      rows={4}
                    />
                  </FormControl>

                  <FormControl id="skills">
                    <FormLabel>Skills</FormLabel>
                    <Textarea
                      name="skills"
                      value={profile.skills}
                      onChange={handleChange}
                      placeholder="Separate skills with commas"
                      rows={3}
                    />
                    <FormHelperText>Enter skills separated by commas</FormHelperText>
                  </FormControl>

                  <Button
                    mt={4}
                    colorScheme="blue"
                    isLoading={isLoading}
                    type="submit"
                  >
                    Save Changes
                  </Button>
                </VStack>
              </form>
            </Box>
          </TabPanel>

          <TabPanel px={0}>
            <Box 
              bg={headerBg} 
              p={6} 
              borderRadius="lg" 
              borderWidth="1px" 
              borderColor={borderColor}
              boxShadow="sm"
            >
              <form onSubmit={handleSubmit}>
                <VStack spacing={6} align="stretch">
                  <Text mb={4}>
                    Connect your social media accounts to enhance your profile
                  </Text>
                  
                  <FormControl id="linkedin">
                    <FormLabel>LinkedIn</FormLabel>
                    <InputGroup>
                      <InputLeftAddon children="linkedin.com/in/" />
                      <Input
                        name="linkedin"
                        value={profile.social.linkedin}
                        onChange={handleSocialChange}
                      />
                    </InputGroup>
                  </FormControl>
                  
                  <FormControl id="github">
                    <FormLabel>GitHub</FormLabel>
                    <InputGroup>
                      <InputLeftAddon children="github.com/" />
                      <Input
                        name="github"
                        value={profile.social.github}
                        onChange={handleSocialChange}
                      />
                    </InputGroup>
                  </FormControl>
                  
                  <FormControl id="twitter">
                    <FormLabel>Twitter</FormLabel>
                    <InputGroup>
                      <InputLeftAddon children="twitter.com/" />
                      <Input
                        name="twitter"
                        value={profile.social.twitter}
                        onChange={handleSocialChange}
                      />
                    </InputGroup>
                  </FormControl>
                  
                  <FormControl id="facebook">
                    <FormLabel>Facebook</FormLabel>
                    <InputGroup>
                      <InputLeftAddon children="facebook.com/" />
                      <Input
                        name="facebook"
                        value={profile.social.facebook}
                        onChange={handleSocialChange}
                      />
                    </InputGroup>
                  </FormControl>
                  
                  <Button
                    mt={4}
                    colorScheme="blue"
                    isLoading={isLoading}
                    type="submit"
                  >
                    Save Social Links
                  </Button>
                </VStack>
              </form>
            </Box>
          </TabPanel>
          
          <TabPanel px={0}>
            <Box 
              bg={headerBg} 
              p={6} 
              borderRadius="lg" 
              borderWidth="1px" 
              borderColor={borderColor}
              boxShadow="sm"
            >
              <form onSubmit={handleSubmit}>
                <VStack spacing={6} align="stretch">
                  <Text mb={4}>
                    Manage your application preferences and settings
                  </Text>
                  
                  <Stack spacing={5}>
                    <FormControl display="flex" alignItems="center">
                      <Switch 
                        id="email-notifications" 
                        isChecked={profile.preferences.emailNotifications}
                        onChange={() => handlePreferenceChange('emailNotifications')}
                        colorScheme="blue"
                        size="lg"
                        mr={3}
                      />
                      <Box>
                        <FormLabel htmlFor="email-notifications" mb="0">
                          Email Notifications
                        </FormLabel>
                        <FormHelperText mt={0}>
                          Receive email updates about your account
                        </FormHelperText>
                      </Box>
                    </FormControl>
                    
                    <Divider />
                    
                    <FormControl display="flex" alignItems="center">
                      <Switch 
                        id="dark-mode" 
                        isChecked={profile.preferences.darkMode}
                        onChange={() => handlePreferenceChange('darkMode')}
                        colorScheme="blue"
                        size="lg"
                        mr={3}
                      />
                      <Box>
                        <FormLabel htmlFor="dark-mode" mb="0">
                          Dark Mode
                        </FormLabel>
                        <FormHelperText mt={0}>
                          Set your preferred theme for the application
                        </FormHelperText>
                      </Box>
                    </FormControl>
                    
                    <Divider />
                    
                    <FormControl display="flex" alignItems="center">
                      <Switch 
                        id="public-profile" 
                        isChecked={profile.preferences.publicProfile}
                        onChange={() => handlePreferenceChange('publicProfile')}
                        colorScheme="blue"
                        size="lg"
                        mr={3}
                      />
                      <Box>
                        <FormLabel htmlFor="public-profile" mb="0">
                          Public Profile
                        </FormLabel>
                        <FormHelperText mt={0}>
                          Make your profile visible to others
                        </FormHelperText>
                      </Box>
                    </FormControl>
                  </Stack>
                  
                  <Button
                    mt={4}
                    colorScheme="blue"
                    isLoading={isLoading}
                    type="submit"
                  >
                    Save Preferences
                  </Button>
                </VStack>
              </form>
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Container>
  );
};

export default Profile; 