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
  IconButton
} from '@chakra-ui/react'
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons'
import { useAuth } from '../../context/AuthContext'
import { FORM_IDS, VALIDATION_MESSAGES, BUTTON_STATES, FORM_DEFAULTS } from '../../constants/formConstants'
import { toast } from 'react-toastify'

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = VALIDATION_MESSAGES.REQUIRED
    }
    
    if (!formData.email) {
      newErrors.email = VALIDATION_MESSAGES.EMAIL.REQUIRED
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      newErrors.email = VALIDATION_MESSAGES.EMAIL.INVALID
    }
    
    if (!formData.password) {
      newErrors.password = VALIDATION_MESSAGES.PASSWORD.REQUIRED
    } else if (formData.password.length < 6) {
      newErrors.password = VALIDATION_MESSAGES.PASSWORD.MIN_LENGTH
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = VALIDATION_MESSAGES.PASSWORD.MISMATCH
    }
    
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = VALIDATION_MESSAGES.TERMS
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    if (!formData.acceptTerms) {
      toast.error('Please accept the terms and conditions')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await signUp({
        name: formData.name,
        email: formData.email,
        password: formData.password
      })
      
      if (error) {
        toast.error(error.message)
        return
      }

      if (data) {
        toast.success('Account created successfully! Please check your email to verify your account.')
        navigate('/login')
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
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
          <FormControl isInvalid={errors.name}>
            <FormLabel htmlFor={FORM_IDS.AUTH.NAME}>Name</FormLabel>
            <Input
              {...FORM_DEFAULTS.INPUT}
              id={FORM_IDS.AUTH.NAME}
              name="name"
              value={formData.name}
              onChange={handleChange}
            />
            <FormErrorMessage>{errors.name}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={errors.email}>
            <FormLabel htmlFor={FORM_IDS.AUTH.EMAIL}>Email</FormLabel>
            <Input
              {...FORM_DEFAULTS.INPUT}
              id={FORM_IDS.AUTH.EMAIL}
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
            />
            <FormErrorMessage>{errors.email}</FormErrorMessage>
          </FormControl>
          
          <FormControl isInvalid={errors.password}>
            <FormLabel htmlFor={FORM_IDS.AUTH.PASSWORD}>Password</FormLabel>
            <InputGroup>
              <Input
                {...FORM_DEFAULTS.INPUT}
                id={FORM_IDS.AUTH.PASSWORD}
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
              />
              <InputRightElement>
                <IconButton
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                  onClick={() => setShowPassword(!showPassword)}
                  variant="ghost"
                  size="sm"
                />
              </InputRightElement>
            </InputGroup>
            <FormErrorMessage>{errors.password}</FormErrorMessage>
          </FormControl>
          
          <FormControl isInvalid={errors.confirmPassword}>
            <FormLabel htmlFor={FORM_IDS.AUTH.CONFIRM_PASSWORD}>Confirm Password</FormLabel>
            <InputGroup>
              <Input
                {...FORM_DEFAULTS.INPUT}
                id={FORM_IDS.AUTH.CONFIRM_PASSWORD}
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              <InputRightElement>
                <IconButton
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  icon={showConfirmPassword ? <ViewOffIcon /> : <ViewIcon />}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  variant="ghost"
                  size="sm"
                />
              </InputRightElement>
            </InputGroup>
            <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={errors.acceptTerms}>
            <Checkbox
              {...FORM_DEFAULTS.CHECKBOX}
              id={FORM_IDS.AUTH.TERMS}
              name="acceptTerms"
              isChecked={formData.acceptTerms}
              onChange={handleChange}
            >
              I accept the terms and conditions
            </Checkbox>
            <FormErrorMessage>{errors.acceptTerms}</FormErrorMessage>
          </FormControl>
          
          <Button
            {...FORM_DEFAULTS.BUTTON}
            type="submit"
            isLoading={isLoading}
            loadingText={BUTTON_STATES.AUTH.SIGN_UP.LOADING}
          >
            {BUTTON_STATES.AUTH.SIGN_UP.DEFAULT}
          </Button>
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