import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  useToast,
  Container,
  Checkbox,
  Flex,
  Link,
  InputGroup,
  InputRightElement,
  IconButton,
} from '@chakra-ui/react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('demo@candidatev.com');
  const [password, setPassword] = useState('demo1234');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  
  const { signIn, getSocialLoginUrl } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  
  // Get the redirect path from location state or default to dashboard
  const from = location.state?.from?.pathname || '/dashboard';
  
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const result = await signIn({ email, password });
      if (result.success) {
        toast({
          title: 'Login successful',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        navigate(from, { replace: true });
      } else {
        toast({
          title: 'Login failed',
          description: result.error,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'An error occurred',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSocialLogin = (provider) => {
    window.location.href = getSocialLoginUrl(provider);
  };

  const toggleShowPassword = () => setShowPassword(!showPassword);
  
  return (
    <Container maxW="md" py={12}>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center">
          <Heading as="h1" size="xl" mb={2}>Welcome Back</Heading>
          <Text color="gray.600">Log in to your CandidateV account</Text>
        </Box>
        
        <Box as="form" onSubmit={handleLogin}>
          <VStack spacing={4} align="stretch">
            <FormControl id="email" isRequired>
              <FormLabel>Email</FormLabel>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
              />
            </FormControl>
            
            <FormControl id="password" isRequired>
              <FormLabel>Password</FormLabel>
              <InputGroup>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                />
                <InputRightElement width="4.5rem">
                  <Button
                    h="1.75rem"
                    size="sm"
                    onClick={toggleShowPassword}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </Button>
                </InputRightElement>
              </InputGroup>
            </FormControl>
            
            <Flex justify="space-between" align="center">
              <Checkbox
                colorScheme="blue"
                isChecked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              >
                Remember me
              </Checkbox>
              <Link color="blue.500" href="/forgot-password">
                Forgot password?
              </Link>
            </Flex>
            
            <Button
              type="submit"
              colorScheme="blue"
              size="lg"
              isLoading={isLoading}
              loadingText="Logging in..."
              w="100%"
              mt={4}
            >
              Log In
            </Button>
          </VStack>
        </Box>
        
        <VStack spacing={2}>
          <Button colorScheme="red" w="100%" onClick={() => handleSocialLogin('google')}>
            Continue with Google
          </Button>
          <Button colorScheme="linkedin" w="100%" onClick={() => handleSocialLogin('linkedin')}>
            Continue with LinkedIn
          </Button>
          <Button colorScheme="facebook" w="100%" onClick={() => handleSocialLogin('facebook')}>
            Continue with Facebook
          </Button>
        </VStack>
        
        <Text textAlign="center">
          Don't have an account? <Link color="blue.500" href="/register">Sign up</Link>
        </Text>
        
        <Box borderWidth="1px" borderRadius="md" p={4} bg="gray.50">
          <Text fontSize="sm" textAlign="center">
            <strong>Note:</strong> Default demo credentials are pre-filled. Click Log In to access the demo.
          </Text>
        </Box>
      </VStack>
    </Container>
  );
};

export default Login; 