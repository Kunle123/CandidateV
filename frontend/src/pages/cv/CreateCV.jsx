import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Heading,
  Text,
  Button,
  SimpleGrid,
  VStack,
  HStack,
  useColorModeValue,
  Flex,
  Image,
  Badge,
  useToast,
  Container,
  Card,
  CardBody,
  Divider,
  Stack,
  Skeleton
} from '@chakra-ui/react'
import { ArrowBackIcon, ArrowForwardIcon, CheckIcon } from '@chakra-ui/icons'

// Mock template data - in a real app this would come from an API
const templates = [
  {
    id: 'professional',
    name: 'Professional',
    description: 'Clean and traditional design suitable for corporate roles',
    imageUrl: 'https://via.placeholder.com/300x400?text=Professional+CV',
    isPremium: false,
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Contemporary layout with a creative touch',
    imageUrl: 'https://via.placeholder.com/300x400?text=Modern+CV',
    isPremium: false,
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Unique design for creative industries',
    imageUrl: 'https://via.placeholder.com/300x400?text=Creative+CV',
    isPremium: false,
  },
  {
    id: 'executive',
    name: 'Executive',
    description: 'Elegant design for senior management positions',
    imageUrl: 'https://via.placeholder.com/300x400?text=Executive+CV',
    isPremium: true,
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    description: 'Simple and clean layout focusing on content',
    imageUrl: 'https://via.placeholder.com/300x400?text=Minimalist+CV',
    isPremium: true,
  },
  {
    id: 'technical',
    name: 'Technical',
    description: 'Specialized layout for technical roles',
    imageUrl: 'https://via.placeholder.com/300x400?text=Technical+CV',
    isPremium: true,
  }
]

const CreateCV = () => {
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const toast = useToast()
  
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const hoverBg = useColorModeValue('gray.50', 'gray.700')

  const handleTemplateSelect = (template) => {
    if (template.isPremium) {
      toast({
        title: 'Premium Template',
        description: 'This template requires a premium subscription. Upgrade your account to access it.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      })
      return
    }
    setSelectedTemplate(template)
  }

  const handleContinue = () => {
    if (!selectedTemplate) {
      toast({
        title: 'No template selected',
        description: 'Please select a template to continue',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }
    
    setLoading(true)
    // In a real app, this would create a new CV with the selected template via API
    setTimeout(() => {
      setLoading(false)
      navigate('/cv/edit/new')
    }, 1000)
  }

  return (
    <Container maxW="1200px" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Box>
          <Heading as="h1" size="xl" mb={2}>
            Create New CV
          </Heading>
          <Text color="gray.600">
            Select a template to get started with your new CV
          </Text>
        </Box>

        {/* Template Selection */}
        <Box>
          <Heading as="h2" size="lg" mb={4}>
            Choose a Template
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {templates.map((template) => (
              <Card
                key={template.id}
                borderWidth="1px"
                borderColor={selectedTemplate?.id === template.id ? 'brand.500' : borderColor}
                borderRadius="lg"
                overflow="hidden"
                cursor="pointer"
                transition="all 0.3s"
                _hover={{ 
                  transform: 'translateY(-5px)', 
                  boxShadow: 'md',
                  borderColor: selectedTemplate?.id === template.id ? 'brand.500' : 'brand.200'
                }}
                onClick={() => handleTemplateSelect(template)}
                position="relative"
              >
                {/* Premium Badge */}
                {template.isPremium && (
                  <Badge
                    position="absolute"
                    top={2}
                    right={2}
                    colorScheme="yellow"
                    variant="solid"
                    borderRadius="full"
                    px={3}
                    py={1}
                    zIndex={1}
                  >
                    Premium
                  </Badge>
                )}
                
                {/* Selected Indicator */}
                {selectedTemplate?.id === template.id && (
                  <Badge
                    position="absolute"
                    top={2}
                    left={2}
                    colorScheme="green"
                    variant="solid"
                    borderRadius="full"
                    zIndex={1}
                  >
                    <CheckIcon boxSize={3} />
                  </Badge>
                )}
                
                {/* Template Image */}
                <Image
                  src={template.imageUrl}
                  alt={template.name}
                  height="200px"
                  objectFit="cover"
                  width="100%"
                />
                
                <CardBody>
                  <Stack spacing={2}>
                    <Heading size="md">{template.name}</Heading>
                    <Text py={2} color="gray.600" fontSize="sm">
                      {template.description}
                    </Text>
                  </Stack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        </Box>

        {/* Navigation Buttons */}
        <Flex justify="space-between" mt={8}>
          <Button
            leftIcon={<ArrowBackIcon />}
            onClick={() => navigate('/dashboard')}
            variant="outline"
          >
            Back to Dashboard
          </Button>
          
          <Button
            rightIcon={<ArrowForwardIcon />}
            onClick={handleContinue}
            colorScheme="blue"
            bg="brand.500"
            _hover={{ bg: "brand.600" }}
            isLoading={loading}
            isDisabled={!selectedTemplate}
          >
            Continue
          </Button>
        </Flex>
      </VStack>
    </Container>
  )
}

export default CreateCV 