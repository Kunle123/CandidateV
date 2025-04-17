import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Button,
  Divider,
  useColorModeValue,
  Avatar,
  SimpleGrid,
  Flex,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Badge,
  ButtonGroup,
  IconButton,
  Tooltip
} from '@chakra-ui/react';
import { userService } from '../../api';
import useApi from '../../hooks/useApi';
import { FaCog, FaArrowLeft } from 'react-icons/fa';

const ProfilePage = () => {
  const navigate = useNavigate();
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    job_title: '',
    location: '',
    website: '',
    social_links: {
      linkedin: '',
      github: '',
      twitter: '',
    }
  });
  
  // Use custom API hook with appropriate settings
  const profileApi = useApi({
    showToast: true,
    errorToastTitle: 'Profile Error',
    showSuccessToast: true,
    successToastTitle: 'Profile Updated'
  });
  
  // Load profile data on component mount
  useEffect(() => {
    loadProfile();
  }, []);
  
  // Load user profile data
  const loadProfile = async () => {
    await profileApi.execute(
      () => userService.getCurrentProfile(),
      {
        errorMessage: 'Failed to load your profile data.',
        retryOnNetworkError: true
      }
    );
  };
  
  // When profile data is loaded, update form
  useEffect(() => {
    if (profileApi.data) {
      setFormData({
        name: profileApi.data.name || '',
        email: profileApi.data.email || '',
        bio: profileApi.data.bio || '',
        job_title: profileApi.data.job_title || '',
        location: profileApi.data.location || '',
        website: profileApi.data.website || '',
        social_links: {
          linkedin: profileApi.data.social_links?.linkedin || '',
          github: profileApi.data.social_links?.github || '',
          twitter: profileApi.data.social_links?.twitter || '',
        }
      });
    }
  }, [profileApi.data]);
  
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested social links
    if (name.startsWith('social_')) {
      const socialNetwork = name.split('_')[1];
      setFormData({
        ...formData,
        social_links: {
          ...formData.social_links,
          [socialNetwork]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    await profileApi.execute(
      () => userService.updateProfile({
        name: formData.name,
        bio: formData.bio,
        job_title: formData.job_title,
        location: formData.location,
        website: formData.website,
        social_links: formData.social_links
      }),
      {
        successMessage: 'Your profile has been updated successfully.',
        errorMessage: 'Failed to update your profile. Please try again.',
        onSuccess: () => {
          // Refresh profile data
          loadProfile();
        }
      }
    );
  };

  // Navigate to preferences page
  const goToPreferences = () => {
    navigate('/profile/preferences');
  };

  // Navigate back to dashboard
  const goToDashboard = () => {
    navigate('/dashboard');
  };
  
  // Colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Show loading state
  if (profileApi.loading && !profileApi.data) {
    return (
      <Flex justify="center" align="center" minHeight="50vh">
        <Spinner size="xl" color="blue.500" />
      </Flex>
    );
  }
  
  return (
    <Box p={5} maxWidth="1000px" mx="auto">
      {/* Page header with navigation */}
      <Flex justify="space-between" align="center" mb={6}>
        <Flex align="center">
          <Tooltip label="Back to Dashboard">
            <IconButton
              icon={<FaArrowLeft />}
              aria-label="Back to Dashboard"
              variant="ghost"
              mr={3}
              onClick={goToDashboard}
            />
          </Tooltip>
          <Heading size="xl">Your Profile</Heading>
        </Flex>
        <ButtonGroup>
          <Button
            leftIcon={<FaCog />}
            colorScheme="teal"
            variant="outline"
            onClick={goToPreferences}
          >
            Preferences
          </Button>
        </ButtonGroup>
      </Flex>

      {/* Error message */}
      {profileApi.error && !profileApi.data && (
        <Alert status="error" mb={6} rounded="md">
          <AlertIcon />
          <AlertTitle>Error loading profile</AlertTitle>
          <AlertDescription>{profileApi.error}</AlertDescription>
        </Alert>
      )}
      
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={10}>
        {/* Left column - Profile Info */}
        <Box 
          bg={bgColor} 
          p={6} 
          borderRadius="lg" 
          borderWidth="1px"
          borderColor={borderColor}
          boxShadow="md"
        >
          <VStack spacing={6} align="flex-start">
            <Heading size="md">Profile Overview</Heading>
            
            <HStack spacing={4} width="full">
              <Avatar 
                size="xl" 
                name={formData.name} 
                src={profileApi.data?.profile_image_url}
              />
              <VStack align="flex-start" spacing={1}>
                <Heading size="md">{formData.name}</Heading>
                <Text color="gray.600">{formData.job_title}</Text>
                <HStack mt={2}>
                  <Badge colorScheme="blue">Professional</Badge>
                  {profileApi.data?.preferences?.theme && (
                    <Badge colorScheme="purple">{profileApi.data.preferences.theme} Theme</Badge>
                  )}
                </HStack>
              </VStack>
            </HStack>
            
            <Divider />
            
            <VStack align="flex-start" spacing={3} width="full">
              <Heading size="sm">Account Information</Heading>
              <HStack>
                <Text fontWeight="bold" width="100px">Email:</Text>
                <Text>{formData.email}</Text>
              </HStack>
              
              <HStack>
                <Text fontWeight="bold" width="100px">Location:</Text>
                <Text>{formData.location || 'Not specified'}</Text>
              </HStack>
              
              <HStack>
                <Text fontWeight="bold" width="100px">Website:</Text>
                <Text>{formData.website || 'Not specified'}</Text>
              </HStack>
              
              <Heading size="sm" mt={2}>Social Links</Heading>
              <HStack>
                <Text fontWeight="bold" width="100px">LinkedIn:</Text>
                <Text>{formData.social_links.linkedin || 'Not linked'}</Text>
              </HStack>
              
              <HStack>
                <Text fontWeight="bold" width="100px">GitHub:</Text>
                <Text>{formData.social_links.github || 'Not linked'}</Text>
              </HStack>
              
              <HStack>
                <Text fontWeight="bold" width="100px">Twitter:</Text>
                <Text>{formData.social_links.twitter || 'Not linked'}</Text>
              </HStack>
            </VStack>
            
            <Box width="full">
              <Heading size="sm" mb={2}>Bio</Heading>
              <Text>{formData.bio || 'No bio provided.'}</Text>
            </Box>
          </VStack>
        </Box>
        
        {/* Right column - Edit form */}
        <Box 
          bg={bgColor} 
          p={6} 
          borderRadius="lg" 
          borderWidth="1px"
          borderColor={borderColor}
          boxShadow="md"
        >
          <form onSubmit={handleSubmit}>
            <VStack spacing={6} align="flex-start">
              <Heading size="md">Edit Profile</Heading>
              
              <FormControl id="name">
                <FormLabel>Name</FormLabel>
                <Input 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                />
              </FormControl>
              
              <FormControl id="job_title">
                <FormLabel>Job Title</FormLabel>
                <Input 
                  name="job_title"
                  value={formData.job_title}
                  onChange={handleChange}
                  placeholder="Software Engineer"
                />
              </FormControl>
              
              <FormControl id="location">
                <FormLabel>Location</FormLabel>
                <Input 
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="City, Country"
                />
              </FormControl>
              
              <FormControl id="website">
                <FormLabel>Website</FormLabel>
                <Input 
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://example.com"
                />
              </FormControl>
              
              <Divider />
              
              <Heading size="md">Social Links</Heading>
              
              <FormControl id="linkedin">
                <FormLabel>LinkedIn URL</FormLabel>
                <Input 
                  name="social_linkedin"
                  value={formData.social_links.linkedin}
                  onChange={handleChange}
                  placeholder="https://linkedin.com/in/username"
                />
              </FormControl>
              
              <FormControl id="github">
                <FormLabel>GitHub URL</FormLabel>
                <Input 
                  name="social_github"
                  value={formData.social_links.github}
                  onChange={handleChange}
                  placeholder="https://github.com/username"
                />
              </FormControl>
              
              <FormControl id="twitter">
                <FormLabel>Twitter URL</FormLabel>
                <Input 
                  name="social_twitter"
                  value={formData.social_links.twitter}
                  onChange={handleChange}
                  placeholder="https://twitter.com/username"
                />
              </FormControl>
              
              <FormControl id="bio">
                <FormLabel>Bio</FormLabel>
                <Textarea 
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Tell us about yourself"
                  rows={4}
                />
              </FormControl>
              
              <Button 
                type="submit"
                colorScheme="blue"
                width="full"
                size="lg"
                isLoading={profileApi.loading} 
                loadingText="Saving"
              >
                Save Changes
              </Button>
            </VStack>
          </form>
        </Box>
      </SimpleGrid>
    </Box>
  );
};

export default ProfilePage; 