import { useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
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
  InputGroup,
  InputRightElement,
  useToast,
  Link,
  Checkbox,
  FormErrorMessage,
} from '@chakra-ui/react'
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons'
import { useAuth } from '../../context/AuthContext'

const Register = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const validateForm = () => {
    const newErrors = {}
    
    if (!name) newErrors.name = 'Name is required'
    if (!email) newErrors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email is invalid'
    
    if (!password) newErrors.password = 'Password is required'
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters'
    
    if (!confirmPassword) newErrors.confirmPassword = 'Please confirm your password'
    else if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match'
    
    if (!termsAccepted) newErrors.terms = 'You must accept the terms'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (validateForm()) {
      setIsSubmitting(true)
      
      try {
        await signUp({ email, password, name })
        toast({
          title: 'Registration successful',
          description: 'Please check your email to verify your account',
          status: 'success',
          duration: 5000,
          isClosable: true,
        })
        navigate('/login')
      } catch (error) {
        toast({
          title: 'Registration failed',
          description: error.message || 'An error occurred during registration',
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
        setErrors(prev => ({
          ...prev,
          submit: error.message
        }))
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  return (
    <Flex
      direction="column"
      w="100%"
    >
      <Box mb={8} textAlign="center">
        <Heading fontSize="2xl" fontWeight="bold">
          Create your account
        </Heading>
        <Text mt={2} color="gray.600">
          to start building your professional CV
        </Text>
      </Box>
      
      <Box
        as="form"
        onSubmit={handleSubmit}
      >
        <Stack spacing={4}>
          <FormControl id="name" isInvalid={errors.name}>
            <FormLabel>Full Name</FormLabel>
            <Input 
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
            <FormErrorMessage>{errors.name}</FormErrorMessage>
          </FormControl>

          <FormControl id="email" isInvalid={errors.email}>
            <FormLabel>Email address</FormLabel>
            <Input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
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
                autoComplete="new-password"
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
          
          <FormControl id="confirmPassword" isInvalid={errors.confirmPassword}>
            <FormLabel>Confirm Password</FormLabel>
            <Input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
            <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>
          </FormControl>

          <FormControl id="terms" isInvalid={errors.terms}>
            <Checkbox
              isChecked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
            >
              I accept the terms and conditions
            </Checkbox>
            <FormErrorMessage>{errors.terms}</FormErrorMessage>
          </FormControl>
          
          <Button
            type="submit"
            bg={'brand.500'}
            color={'white'}
            _hover={{
              bg: 'brand.600',
            }}
            isLoading={isSubmitting}
            loadingText="Creating account"
          >
            Sign up
          </Button>

          {errors.submit && (
            <Text color="red.500" fontSize="sm" textAlign="center">
              {errors.submit}
            </Text>
          )}
        </Stack>
      </Box>

      <Text align={'center'} mt={8}>
        Already have an account?{' '}
        <Link as={RouterLink} to="/login" color={'brand.500'}>
          Sign in
        </Link>
      </Text>
    </Flex>
  )
}

export default Register 