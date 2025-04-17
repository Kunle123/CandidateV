import { useState } from 'react'
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom'
import {
  Flex,
  Box,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Button,
  Heading,
  Text,
  useColorModeValue,
  FormErrorMessage,
  InputGroup,
  InputRightElement,
  useToast,
  Link,
} from '@chakra-ui/react'
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons'
import { useAuth } from '../../context/AuthContext'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { login, error: authError } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  
  const from = location.state?.from?.pathname || '/dashboard'

  const validateForm = () => {
    const newErrors = {}
    
    if (!email) newErrors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email is invalid'
    
    if (!password) newErrors.password = 'Password is required'
    else if (password.length < 8) newErrors.password = 'Password must be at least 8 characters'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (validateForm()) {
      setIsSubmitting(true)
      
      const success = await login(email, password)
      
      if (success) {
        toast({
          title: 'Login successful',
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
        navigate(from, { replace: true })
      } else {
        toast({
          title: 'Login failed',
          description: authError || 'Please check your credentials and try again',
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
      }
      
      setIsSubmitting(false)
    }
  }

  return (
    <Flex
      direction="column"
      w="100%"
    >
      <Box mb={8} textAlign="center">
        <Heading fontSize="2xl" fontWeight="bold">
          Sign in to your account
        </Heading>
        <Text mt={2} color="gray.600">
          to access your CVs and continue building your career
        </Text>
      </Box>
      
      <Box
        as="form"
        onSubmit={handleSubmit}
      >
        <Stack spacing={4}>
          <FormControl id="email" isInvalid={errors.email}>
            <FormLabel>Email address</FormLabel>
            <Input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <FormErrorMessage>{errors.email}</FormErrorMessage>
          </FormControl>
          
          <FormControl id="password" isInvalid={errors.password}>
            <FormLabel>Password</FormLabel>
            <InputGroup>
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <InputRightElement h={'full'}>
                <Button
                  variant={'ghost'}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <ViewIcon /> : <ViewOffIcon />}
                </Button>
              </InputRightElement>
            </InputGroup>
            <FormErrorMessage>{errors.password}</FormErrorMessage>
          </FormControl>
          
          <Stack spacing={6}>
            <Stack
              direction={{ base: 'column', sm: 'row' }}
              align={'start'}
              justify={'space-between'}
            >
              <Link color={'brand.500'}>Forgot password?</Link>
            </Stack>
            
            <Button
              bg={'brand.500'}
              color={'white'}
              _hover={{
                bg: 'brand.600',
              }}
              type="submit"
              isLoading={isSubmitting}
              loadingText="Signing in"
            >
              Sign in
            </Button>
          </Stack>
        </Stack>
      </Box>

      <Text align={'center'} mt={8}>
        Don't have an account?{' '}
        <Link as={RouterLink} to="/register" color={'brand.500'}>
          Sign up
        </Link>
      </Text>
    </Flex>
  )
}

export default Login 