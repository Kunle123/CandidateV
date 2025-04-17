import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Divider,
  Flex,
  Heading,
  Text,
  VStack,
  useColorModeValue,
  useToast,
  Switch,
  FormControl,
  FormLabel,
  FormHelperText,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Input,
  HStack,
  Select,
} from '@chakra-ui/react';
import { useAuth } from '../../context/AuthContext';

const Settings = () => {
  const { user, logout } = useAuth();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteAccountDialogOpen, setIsDeleteAccountDialogOpen] = useState(false);
  const cancelRef = React.useRef();

  // Mock settings data - in a real app this would come from an API
  const [settings, setSettings] = useState({
    security: {
      twoFactorAuth: false,
      sessionTimeout: '30',
      autoLogout: true,
    },
    notifications: {
      emailNotifications: true,
      applicationUpdates: true,
      marketingEmails: false,
    },
    privacy: {
      dataSharing: false,
      activityTracking: true,
    },
    appearance: {
      language: 'en',
      theme: 'light',
      fontSize: 'medium',
    }
  });

  const handleSecurityChange = (setting, value) => {
    setSettings({
      ...settings,
      security: {
        ...settings.security,
        [setting]: value,
      },
    });
  };

  const handleNotificationChange = (setting) => {
    setSettings({
      ...settings,
      notifications: {
        ...settings.notifications,
        [setting]: !settings.notifications[setting],
      },
    });
  };

  const handlePrivacyChange = (setting) => {
    setSettings({
      ...settings,
      privacy: {
        ...settings.privacy,
        [setting]: !settings.privacy[setting],
      },
    });
  };

  const handleAppearanceChange = (setting, value) => {
    setSettings({
      ...settings,
      appearance: {
        ...settings.appearance,
        [setting]: value,
      },
    });
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: 'Settings saved',
        description: 'Your settings have been updated successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    }, 1500);
  };

  const handleDeleteAccount = () => {
    setIsLoading(true);
    
    // Simulate API call for deleting account
    setTimeout(() => {
      setIsLoading(false);
      setIsDeleteAccountDialogOpen(false);
      
      // Perform logout
      logout();
      
      toast({
        title: 'Account deleted',
        description: 'Your account has been successfully deleted',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    }, 2000);
  };

  const handleChangePassword = () => {
    toast({
      title: 'Password change',
      description: 'Password change functionality will be implemented in the future',
      status: 'info',
      duration: 5000,
      isClosable: true,
    });
  };

  const boxBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Container maxW="container.lg" py={8}>
      <Box 
        bg={boxBg} 
        p={6} 
        borderRadius="lg" 
        borderWidth="1px" 
        borderColor={borderColor}
        mb={6}
        boxShadow="sm"
      >
        <Heading size="lg" mb={2}>Account Settings</Heading>
        <Text color="gray.500">Manage your account settings and preferences</Text>
      </Box>

      {/* Security Settings */}
      <Box 
        bg={boxBg} 
        p={6} 
        borderRadius="lg" 
        borderWidth="1px" 
        borderColor={borderColor}
        mb={6}
        boxShadow="sm"
      >
        <Heading size="md" mb={4}>Security</Heading>
        
        <VStack spacing={6} align="stretch">
          <FormControl display="flex" alignItems="center">
            <Switch 
              id="two-factor-auth" 
              isChecked={settings.security.twoFactorAuth}
              onChange={(e) => handleSecurityChange('twoFactorAuth', e.target.checked)}
              colorScheme="blue"
              size="lg"
              mr={3}
            />
            <Box>
              <FormLabel htmlFor="two-factor-auth" mb="0">
                Two-Factor Authentication
              </FormLabel>
              <FormHelperText mt={0}>
                Add an extra layer of security to your account
              </FormHelperText>
            </Box>
          </FormControl>
          
          <Divider />
          
          <FormControl>
            <FormLabel>Session Timeout (minutes)</FormLabel>
            <Select 
              value={settings.security.sessionTimeout}
              onChange={(e) => handleSecurityChange('sessionTimeout', e.target.value)}
              maxW="200px"
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="120">2 hours</option>
            </Select>
            <FormHelperText>
              Set how long you stay logged in when inactive
            </FormHelperText>
          </FormControl>
          
          <Divider />
          
          <FormControl display="flex" alignItems="center">
            <Switch 
              id="auto-logout" 
              isChecked={settings.security.autoLogout}
              onChange={(e) => handleSecurityChange('autoLogout', e.target.checked)}
              colorScheme="blue"
              size="lg"
              mr={3}
            />
            <Box>
              <FormLabel htmlFor="auto-logout" mb="0">
                Auto Logout on Browser Close
              </FormLabel>
              <FormHelperText mt={0}>
                Automatically logs you out when closing the browser
              </FormHelperText>
            </Box>
          </FormControl>
          
          <Divider />
          
          <Button 
            colorScheme="blue" 
            variant="outline" 
            onClick={handleChangePassword} 
            maxW="200px"
          >
            Change Password
          </Button>
        </VStack>
      </Box>

      {/* Notification Settings */}
      <Box 
        bg={boxBg} 
        p={6} 
        borderRadius="lg" 
        borderWidth="1px" 
        borderColor={borderColor}
        mb={6}
        boxShadow="sm"
      >
        <Heading size="md" mb={4}>Notifications</Heading>
        
        <VStack spacing={6} align="stretch">
          <FormControl display="flex" alignItems="center">
            <Switch 
              id="email-notifications" 
              isChecked={settings.notifications.emailNotifications}
              onChange={() => handleNotificationChange('emailNotifications')}
              colorScheme="blue"
              size="lg"
              mr={3}
            />
            <Box>
              <FormLabel htmlFor="email-notifications" mb="0">
                Email Notifications
              </FormLabel>
              <FormHelperText mt={0}>
                Receive updates about your account activity
              </FormHelperText>
            </Box>
          </FormControl>
          
          <Divider />
          
          <FormControl display="flex" alignItems="center">
            <Switch 
              id="application-updates" 
              isChecked={settings.notifications.applicationUpdates}
              onChange={() => handleNotificationChange('applicationUpdates')}
              colorScheme="blue"
              size="lg"
              mr={3}
            />
            <Box>
              <FormLabel htmlFor="application-updates" mb="0">
                Application Updates
              </FormLabel>
              <FormHelperText mt={0}>
                Be notified about new features and improvements
              </FormHelperText>
            </Box>
          </FormControl>
          
          <Divider />
          
          <FormControl display="flex" alignItems="center">
            <Switch 
              id="marketing-emails" 
              isChecked={settings.notifications.marketingEmails}
              onChange={() => handleNotificationChange('marketingEmails')}
              colorScheme="blue"
              size="lg"
              mr={3}
            />
            <Box>
              <FormLabel htmlFor="marketing-emails" mb="0">
                Marketing Emails
              </FormLabel>
              <FormHelperText mt={0}>
                Receive promotional offers and newsletters
              </FormHelperText>
            </Box>
          </FormControl>
        </VStack>
      </Box>

      {/* Privacy Settings */}
      <Box 
        bg={boxBg} 
        p={6} 
        borderRadius="lg" 
        borderWidth="1px" 
        borderColor={borderColor}
        mb={6}
        boxShadow="sm"
      >
        <Heading size="md" mb={4}>Privacy</Heading>
        
        <VStack spacing={6} align="stretch">
          <FormControl display="flex" alignItems="center">
            <Switch 
              id="data-sharing" 
              isChecked={settings.privacy.dataSharing}
              onChange={() => handlePrivacyChange('dataSharing')}
              colorScheme="blue"
              size="lg"
              mr={3}
            />
            <Box>
              <FormLabel htmlFor="data-sharing" mb="0">
                Data Sharing
              </FormLabel>
              <FormHelperText mt={0}>
                Allow us to use your data to improve our services
              </FormHelperText>
            </Box>
          </FormControl>
          
          <Divider />
          
          <FormControl display="flex" alignItems="center">
            <Switch 
              id="activity-tracking" 
              isChecked={settings.privacy.activityTracking}
              onChange={() => handlePrivacyChange('activityTracking')}
              colorScheme="blue"
              size="lg"
              mr={3}
            />
            <Box>
              <FormLabel htmlFor="activity-tracking" mb="0">
                Activity Tracking
              </FormLabel>
              <FormHelperText mt={0}>
                Track your activity to provide personalized recommendations
              </FormHelperText>
            </Box>
          </FormControl>
        </VStack>
      </Box>

      {/* Appearance Settings */}
      <Box 
        bg={boxBg} 
        p={6} 
        borderRadius="lg" 
        borderWidth="1px" 
        borderColor={borderColor}
        mb={6}
        boxShadow="sm"
      >
        <Heading size="md" mb={4}>Appearance</Heading>
        
        <VStack spacing={6} align="stretch">
          <FormControl>
            <FormLabel>Language</FormLabel>
            <Select 
              value={settings.appearance.language}
              onChange={(e) => handleAppearanceChange('language', e.target.value)}
              maxW="200px"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </Select>
          </FormControl>
          
          <Divider />
          
          <FormControl>
            <FormLabel>Theme</FormLabel>
            <Select 
              value={settings.appearance.theme}
              onChange={(e) => handleAppearanceChange('theme', e.target.value)}
              maxW="200px"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System Default</option>
            </Select>
          </FormControl>
          
          <Divider />
          
          <FormControl>
            <FormLabel>Font Size</FormLabel>
            <Select 
              value={settings.appearance.fontSize}
              onChange={(e) => handleAppearanceChange('fontSize', e.target.value)}
              maxW="200px"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </Select>
          </FormControl>
        </VStack>
      </Box>

      {/* Action Buttons */}
      <HStack spacing={4} mt={8} justify="space-between">
        <Button 
          colorScheme="red" 
          variant="outline" 
          onClick={() => setIsDeleteAccountDialogOpen(true)}
        >
          Delete Account
        </Button>
        
        <Button 
          colorScheme="blue" 
          isLoading={isLoading}
          onClick={handleSaveSettings}
        >
          Save All Settings
        </Button>
      </HStack>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteAccountDialogOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => setIsDeleteAccountDialogOpen(false)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Account
            </AlertDialogHeader>

            <AlertDialogBody>
              <Text mb={4}>
                Are you sure you want to delete your account? This action cannot be undone.
              </Text>
              <FormControl mb={4}>
                <FormLabel>Type "DELETE" to confirm</FormLabel>
                <Input placeholder="Type DELETE here" />
              </FormControl>
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => setIsDeleteAccountDialogOpen(false)}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDeleteAccount} ml={3} isLoading={isLoading}>
                Delete Account
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Container>
  );
};

export default Settings; 