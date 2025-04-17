import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  Button,
  Image,
  Flex,
  Badge,
  useColorModeValue,
  VStack,
  HStack,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast,
  IconButton,
} from '@chakra-ui/react';
import { FaArrowLeft, FaCheck, FaHeart, FaStar } from 'react-icons/fa';
import { cvService } from '../../api';
import useCV from '../../hooks/useCV';
import { mockTemplates } from './mock-data';

const TemplateCard = ({ template, isSelected, onSelect, isPremium }) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const selectedBorderColor = 'blue.500';
  
  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      borderColor={isSelected ? selectedBorderColor : borderColor}
      overflow="hidden"
      boxShadow={isSelected ? 'md' : 'sm'}
      transition="all 0.2s"
      cursor="pointer"
      onClick={onSelect}
      position="relative"
      bg={cardBg}
      _hover={{
        transform: 'translateY(-5px)',
        boxShadow: 'lg',
      }}
    >
      {isPremium && (
        <Badge
          position="absolute"
          top={2}
          right={2}
          colorScheme="yellow"
          borderRadius="full"
          px={3}
          py={1}
          zIndex={1}
        >
          <HStack spacing={1} align="center">
            <FaStar />
            <Text>Premium</Text>
          </HStack>
        </Badge>
      )}
      
      <Box position="relative" height="200px">
        <Image
          src={template.thumbnail || 'https://via.placeholder.com/300x200?text=CV+Template'}
          alt={template.name}
          objectFit="cover"
          width="100%"
          height="100%"
        />
        {isSelected && (
          <Flex
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg="blackAlpha.60"
            align="center"
            justify="center"
          >
            <IconButton
              icon={<FaCheck />}
              isRound
              colorScheme="blue"
              size="lg"
              aria-label="Selected template"
            />
          </Flex>
        )}
      </Box>
      
      <Box p={4}>
        <Flex justify="space-between" align="center">
          <Heading size="md">{template.name}</Heading>
          {!isPremium && (
            <Badge colorScheme="green">Free</Badge>
          )}
        </Flex>
        <Text color="gray.500" mt={2} noOfLines={2}>
          {template.description}
        </Text>
      </Box>
    </Box>
  );
};

const TemplateSelection = () => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const navigate = useNavigate();
  const toast = useToast();
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  
  const { templates, loading, error, fetchTemplates } = useCV();
  const [displayTemplates, setDisplayTemplates] = useState([]);
  
  // Fetch templates on mount
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        await fetchTemplates();
      } catch (err) {
        console.error('Error fetching templates:', err);
        // Toast already shown by the hook
      }
    };
    
    loadTemplates();
  }, [fetchTemplates]);
  
  // Update display templates when templates change or if templates are empty
  useEffect(() => {
    if (templates && templates.length > 0) {
      setDisplayTemplates(templates);
      
      // Auto-select first free template if none selected
      if (!selectedTemplate) {
        const freeTemplate = templates.find(temp => !temp.is_premium);
        if (freeTemplate) {
          setSelectedTemplate(freeTemplate.id);
        }
      }
    } else if (!loading) {
      // Use mock templates if no templates from API
      setDisplayTemplates(mockTemplates);
      
      // Auto-select first free mock template if none selected
      if (!selectedTemplate) {
        const freeTemplate = mockTemplates.find(temp => !temp.is_premium);
        if (freeTemplate) {
          setSelectedTemplate(freeTemplate.id);
        }
      }
    }
  }, [templates, loading, selectedTemplate]);
  
  const handleTemplateSelect = (templateId) => {
    setSelectedTemplate(templateId);
  };
  
  const handleContinue = () => {
    if (!selectedTemplate) {
      toast({
        title: 'No template selected',
        description: 'Please select a template to continue',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    // Navigate to CV editor with selected template
    navigate(`/cv/editor?template=${selectedTemplate}`);
  };
  
  const handleBack = () => {
    navigate('/dashboard');
  };
  
  // Loading state
  if (loading && displayTemplates.length === 0) {
    return (
      <Flex justify="center" align="center" minHeight="500px">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" thickness="4px" />
          <Text>Loading templates...</Text>
        </VStack>
      </Flex>
    );
  }
  
  // Error state with fallback to mock templates
  if (error && displayTemplates.length === 0) {
    return (
      <Container maxW="container.lg" py={10}>
        <Alert status="error" borderRadius="lg" mb={6}>
          <AlertIcon />
          <Box>
            <AlertTitle mr={2}>Error loading templates</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Box>
        </Alert>
        <Button onClick={() => window.location.reload()} colorScheme="blue">
          Try Again
        </Button>
      </Container>
    );
  }
  
  return (
    <Box bg={bgColor} minHeight="calc(100vh - 80px)" py={8}>
      <Container maxW="container.xl">
        <HStack spacing={4} mb={6}>
          <IconButton
            icon={<FaArrowLeft />}
            aria-label="Go back"
            variant="ghost"
            onClick={handleBack}
          />
          <Heading size="lg">Choose a CV Template</Heading>
        </HStack>
        
        <Text mb={8} color="gray.600">
          Select a template to create your professional CV. We offer both free and premium designs to make your CV stand out.
        </Text>
        
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6} mb={10}>
          {displayTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              isSelected={selectedTemplate === template.id}
              onSelect={() => handleTemplateSelect(template.id)}
              isPremium={template.is_premium}
            />
          ))}
        </SimpleGrid>
        
        <Flex justify="flex-end">
          <Button 
            size="lg" 
            colorScheme="blue"
            onClick={handleContinue}
            px={8}
            isDisabled={!selectedTemplate}
          >
            Continue with Selected Template
          </Button>
        </Flex>
      </Container>
    </Box>
  );
};

export default TemplateSelection; 