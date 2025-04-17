import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Heading,
  VStack,
  FormControl,
  FormLabel,
  Switch,
  Button,
  useColorModeValue,
  Select,
  Divider,
  Text,
  HStack,
  Card,
  SimpleGrid,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  Flex,
  Icon,
  ButtonGroup,
  IconButton,
  Tooltip
} from '@chakra-ui/react';
import userService from '../../api/userService';
import useApi from '../../hooks/useApi';
import { FaSun, FaMoon, FaBell, FaBellSlash, FaEnvelope, FaUserCog, FaGlobe, FaLock, FaUser, FaArrowLeft } from 'react-icons/fa';

const PreferencesPage = () => {
  const navigate = useNavigate();
  
  // Default preferences
  const defaultPreferences = {
    theme: 'light',
    notifications: true,
    emailUpdates: true,
    language: 'en',
    privacy: {
      profileVisibility: 'public',
      showEmail: false,
      shareActivity: true
    }
  };
  
  // Form state
  const [preferences, setPreferences] = useState(defaultPreferences);
  
  // Use our custom API hook
  const preferencesApi = useApi({
    showToast: true,
    errorToastTitle: 'Preferences Error',
    showSuccessToast: true,
    successToastTitle: 'Preferences Updated'
  });
  
  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, []);
  
  // Load user preferences with retry
  const loadPreferences = async () => {
    await preferencesApi.execute(
      () => userService.getCurrentProfile(),
      {
        errorMessage: 'Failed to load your preferences. Please try again.',
        retryOnNetworkError: true
      }
    );
  };
  
  // Update preferences from API data
  useEffect(() => {
    if (preferencesApi.data && preferencesApi.data.preferences) {
      // Merge with default preferences to ensure all fields exist
      setPreferences({
        ...defaultPreferences,
        ...preferencesApi.data.preferences,
        // Ensure nested objects are properly merged
        privacy: {
          ...defaultPreferences.privacy,
          ...(preferencesApi.data.preferences.privacy || {})
        }
      });
    }
  }, [preferencesApi.data]);
  
  // Handle form changes
  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    
    // Handle nested privacy settings
    if (name.startsWith('privacy_')) {
      const privacySetting = name.split('_')[1];
      setPreferences({
        ...preferences,
        privacy: {
          ...preferences.privacy,
          [privacySetting]: type === 'checkbox' ? checked : value
        }
      });
    } else {
      setPreferences({
        ...preferences,
        [name]: type === 'checkbox' ? checked : value
      });
    }
  };
  
  // Save preferences
  const savePreferences = async () => {
    await preferencesApi.execute(
      () => userService.updatePreferences({ preferences }),
      {
        successMessage: 'Your preferences have been saved successfully.',
        errorMessage: 'Failed to save your preferences. Please try again.'
      }
    );
  };

  // Navigate back to profile
  const goToProfile = () => {
    navigate('/profile');
  };

  // Navigate back to dashboard
  const goToDashboard = () => {
    navigate('/dashboard');
  };
  
  // Color mode
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Loading state
  if (preferencesApi.loading && !preferencesApi.data) {
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
          <Heading size="xl">User Preferences</Heading>
        </Flex>
        <ButtonGroup>
          <Button
            leftIcon={<FaUser />}
            colorScheme="blue"
            variant="outline"
            onClick={goToProfile}
          >
            Back to Profile
          </Button>
        </ButtonGroup>
      </Flex>
      
      {/* Error alert */}
      {preferencesApi.error && !preferencesApi.data && (
        <Alert status="error" mb={6} rounded="md">
          <AlertIcon />
          <AlertTitle>Error loading preferences</AlertTitle>
          <AlertDescription>{preferencesApi.error}</AlertDescription>
        </Alert>
      )}
      
      <VStack spacing={8} align="stretch">
        <Text color="gray.600">
          Customize your experience by adjusting the settings below. Changes are automatically saved to your profile.
        </Text>
        
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          {/* Appearance */}
          <Card p={6} bg={bgColor} borderColor={borderColor} boxShadow="md">
            <VStack spacing={6} align="flex-start">
              <HStack>
                <Icon as={preferences.theme === 'dark' ? FaMoon : FaSun} boxSize={6} color="blue.500" />
                <Heading size="md">Appearance</Heading>
              </HStack>
              
              <FormControl display="flex" alignItems="center" justifyContent="space-between">
                <FormLabel htmlFor="theme" mb="0">Theme</FormLabel>
                <Select 
                  id="theme" 
                  name="theme" 
                  value={preferences.theme}
                  onChange={handleChange}
                  width="150px"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </Select>
              </FormControl>
              
              <FormControl display="flex" alignItems="center" justifyContent="space-between">
                <FormLabel htmlFor="language" mb="0">Language</FormLabel>
                <Select 
                  id="language" 
                  name="language" 
                  value={preferences.language}
                  onChange={handleChange}
                  width="150px"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </Select>
              </FormControl>
            </VStack>
          </Card>
          
          {/* Notifications */}
          <Card p={6} bg={bgColor} borderColor={borderColor} boxShadow="md">
            <VStack spacing={6} align="flex-start">
              <HStack>
                <Icon as={preferences.notifications ? FaBell : FaBellSlash} boxSize={6} color="blue.500" />
                <Heading size="md">Notifications</Heading>
              </HStack>
              
              <FormControl display="flex" alignItems="center" justifyContent="space-between">
                <FormLabel htmlFor="notifications" mb="0">
                  Push Notifications
                </FormLabel>
                <Switch 
                  id="notifications" 
                  name="notifications"
                  isChecked={preferences.notifications} 
                  onChange={handleChange}
                  colorScheme="blue"
                />
              </FormControl>
              
              <FormControl display="flex" alignItems="center" justifyContent="space-between">
                <FormLabel htmlFor="emailUpdates" mb="0">
                  Email Updates
                </FormLabel>
                <Switch 
                  id="emailUpdates" 
                  name="emailUpdates"
                  isChecked={preferences.emailUpdates} 
                  onChange={handleChange}
                  colorScheme="blue"
                />
              </FormControl>
            </VStack>
          </Card>
          
          {/* Privacy */}
          <Card p={6} bg={bgColor} borderColor={borderColor} boxShadow="md">
            <VStack spacing={6} align="flex-start">
              <HStack>
                <Icon as={FaLock} boxSize={6} color="blue.500" />
                <Heading size="md">Privacy</Heading>
              </HStack>
              
              <FormControl display="flex" alignItems="center" justifyContent="space-between">
                <FormLabel htmlFor="profileVisibility" mb="0">Profile Visibility</FormLabel>
                <Select 
                  id="profileVisibility" 
                  name="privacy_profileVisibility" 
                  value={preferences.privacy?.profileVisibility || 'public'}
                  onChange={handleChange}
                  width="150px"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                  <option value="contacts">Contacts Only</option>
                </Select>
              </FormControl>
              
              <FormControl display="flex" alignItems="center" justifyContent="space-between">
                <FormLabel htmlFor="showEmail" mb="0">
                  Show Email to Others
                </FormLabel>
                <Switch 
                  id="showEmail" 
                  name="privacy_showEmail"
                  isChecked={preferences.privacy?.showEmail} 
                  onChange={handleChange}
                  colorScheme="blue"
                />
              </FormControl>
              
              <FormControl display="flex" alignItems="center" justifyContent="space-between">
                <FormLabel htmlFor="shareActivity" mb="0">
                  Share Activity
                </FormLabel>
                <Switch 
                  id="shareActivity" 
                  name="privacy_shareActivity"
                  isChecked={preferences.privacy?.shareActivity} 
                  onChange={handleChange}
                  colorScheme="blue"
                />
              </FormControl>
            </VStack>
          </Card>
          
          {/* Account Settings */}
          <Card p={6} bg={bgColor} borderColor={borderColor} boxShadow="md">
            <VStack spacing={6} align="flex-start">
              <HStack>
                <Icon as={FaUserCog} boxSize={6} color="blue.500" />
                <Heading size="md">Account Settings</Heading>
              </HStack>
              
              <Text color="gray.600">
                Additional account settings like password changes and account deletion 
                can be managed in your account security page.
              </Text>
              
              <Button colorScheme="blue" variant="outline" width="full">
                Manage Account Security
              </Button>
            </VStack>
          </Card>
        </SimpleGrid>
        
        <Divider my={4} />
        
        <Flex justify="flex-end">
          <Button 
            colorScheme="blue" 
            size="lg" 
            px={8}
            onClick={savePreferences}
            isLoading={preferencesApi.loading}
            loadingText="Saving"
          >
            Save Preferences
          </Button>
        </Flex>
      </VStack>
    </Box>
  );
};

export default PreferencesPage; 