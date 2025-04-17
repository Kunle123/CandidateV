import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams, useSearchParams } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  VStack,
  HStack,
  IconButton,
  useColorModeValue,
  Divider,
  Spinner,
  Alert,
  AlertIcon,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Badge,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Input,
} from '@chakra-ui/react';
import { 
  FaArrowLeft, 
  FaDownload, 
  FaEdit, 
  FaEye, 
  FaChevronDown, 
  FaFilePdf, 
  FaFileWord, 
  FaFileCsv,
  FaShare,
  FaEnvelope,
  FaLink,
  FaCopy,
} from 'react-icons/fa';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { apiService, cvService } from '../../api';

// Sample CV template component - In a real app, this would be more sophisticated
const CVTemplate1 = ({ cv }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  
  return (
    <Box bg={bgColor} p={8} borderRadius="md" boxShadow="md" width="100%" maxWidth="800px" mx="auto">
      {/* Header with personal info */}
      <VStack spacing={2} align="center" mb={6}>
        <Heading size="xl">{cv.personal.firstName} {cv.personal.lastName}</Heading>
        <Text fontSize="lg" color="blue.500" fontWeight="bold">{cv.personal.title}</Text>
        <HStack spacing={4} mt={2}>
          {cv.personal.email && <Text fontSize="sm">{cv.personal.email}</Text>}
          {cv.personal.phone && <Text fontSize="sm">{cv.personal.phone}</Text>}
          {cv.personal.address && <Text fontSize="sm">{cv.personal.address}</Text>}
        </HStack>
      </VStack>
      
      {/* Professional Summary */}
      {cv.personal.summary && (
        <Box mb={6}>
          <Heading size="md" mb={2}>Professional Summary</Heading>
          <Divider mb={3} />
          <Text>{cv.personal.summary}</Text>
        </Box>
      )}
      
      {/* Work Experience */}
      {cv.experience && cv.experience.length > 0 && (
        <Box mb={6}>
          <Heading size="md" mb={2}>Work Experience</Heading>
          <Divider mb={3} />
          <VStack spacing={4} align="stretch">
            {cv.experience.map((exp, index) => (
              <Box key={index}>
                <Flex justify="space-between" mb={1}>
                  <Heading size="sm">{exp.position}</Heading>
                  <Text fontSize="sm">
                    {exp.startDate && new Date(exp.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })} - 
                    {exp.endDate ? new Date(exp.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : 'Present'}
                  </Text>
                </Flex>
                <Flex justify="space-between" mb={2}>
                  <Text fontWeight="medium">{exp.company}</Text>
                  <Text fontSize="sm">{exp.location}</Text>
                </Flex>
                <Text fontSize="sm">{exp.description}</Text>
              </Box>
            ))}
          </VStack>
        </Box>
      )}
      
      {/* Education */}
      {cv.education && cv.education.length > 0 && (
        <Box mb={6}>
          <Heading size="md" mb={2}>Education</Heading>
          <Divider mb={3} />
          <VStack spacing={4} align="stretch">
            {cv.education.map((edu, index) => (
              <Box key={index}>
                <Flex justify="space-between" mb={1}>
                  <Heading size="sm">{edu.degree} {edu.field && `in ${edu.field}`}</Heading>
                  <Text fontSize="sm">
                    {edu.startDate && new Date(edu.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })} - 
                    {edu.endDate ? new Date(edu.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : 'Present'}
                  </Text>
                </Flex>
                <Text fontWeight="medium" mb={2}>{edu.institution}</Text>
                {edu.description && <Text fontSize="sm">{edu.description}</Text>}
              </Box>
            ))}
          </VStack>
        </Box>
      )}
      
      {/* Skills */}
      {cv.skills && cv.skills.length > 0 && (
        <Box mb={6}>
          <Heading size="md" mb={2}>Skills</Heading>
          <Divider mb={3} />
          <Flex wrap="wrap" gap={2}>
            {cv.skills.map((skill, index) => (
              <Badge key={index} colorScheme="blue" px={2} py={1} borderRadius="full">
                {skill.name} {skill.level && `(${skill.level})`}
              </Badge>
            ))}
          </Flex>
        </Box>
      )}
    </Box>
  );
};

// Sample CV template component 2 - A different layout
const CVTemplate2 = ({ cv }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const accentColor = useColorModeValue('blue.500', 'blue.300');
  
  return (
    <Box bg={bgColor} p={8} borderRadius="md" boxShadow="md" width="100%" maxWidth="800px" mx="auto">
      {/* Header with personal info - Horizontal layout */}
      <Flex mb={8} justify="space-between" align="center" wrap="wrap">
        <Box>
          <Heading size="xl">{cv.personal.firstName} {cv.personal.lastName}</Heading>
          <Text fontSize="lg" color={accentColor} fontWeight="medium">{cv.personal.title}</Text>
        </Box>
        <VStack align="flex-end" spacing={1}>
          {cv.personal.email && <Text fontSize="sm">{cv.personal.email}</Text>}
          {cv.personal.phone && <Text fontSize="sm">{cv.personal.phone}</Text>}
          {cv.personal.address && <Text fontSize="sm">{cv.personal.address}</Text>}
          {cv.personal.website && <Text fontSize="sm">{cv.personal.website}</Text>}
        </VStack>
      </Flex>
      
      {/* Two column layout */}
      <Flex gap={8} direction={{ base: 'column', md: 'row' }}>
        {/* Left column */}
        <Box width={{ base: '100%', md: '30%' }}>
          {/* Skills */}
          {cv.skills && cv.skills.length > 0 && (
            <Box mb={6}>
              <Heading size="md" color={accentColor} mb={3}>Skills</Heading>
              <VStack align="stretch" spacing={2}>
                {cv.skills.map((skill, index) => (
                  <Box key={index}>
                    <Text fontWeight="semibold">{skill.name}</Text>
                    <Box bg="gray.200" height="6px" width="100%" borderRadius="full">
                      <Box 
                        bg={accentColor} 
                        height="6px" 
                        width={
                          skill.level === 'Beginner' ? '25%' : 
                          skill.level === 'Intermediate' ? '50%' : 
                          skill.level === 'Advanced' ? '75%' : '100%'
                        }
                        borderRadius="full" 
                      />
                    </Box>
                  </Box>
                ))}
              </VStack>
            </Box>
          )}
          
          {/* Education */}
          {cv.education && cv.education.length > 0 && (
            <Box mb={6}>
              <Heading size="md" color={accentColor} mb={3}>Education</Heading>
              <VStack spacing={4} align="stretch">
                {cv.education.map((edu, index) => (
                  <Box key={index}>
                    <Text fontWeight="bold">{edu.degree} {edu.field && `in ${edu.field}`}</Text>
                    <Text fontSize="sm" fontWeight="medium">{edu.institution}</Text>
                    <Text fontSize="xs" color="gray.500" mb={1}>
                      {edu.startDate && new Date(edu.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })} - 
                      {edu.endDate ? new Date(edu.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : 'Present'}
                    </Text>
                    {edu.description && <Text fontSize="sm">{edu.description}</Text>}
                  </Box>
                ))}
              </VStack>
            </Box>
          )}
        </Box>
        
        {/* Right column */}
        <Box width={{ base: '100%', md: '70%' }}>
          {/* Professional Summary */}
          {cv.personal.summary && (
            <Box mb={6}>
              <Heading size="md" color={accentColor} mb={3}>Professional Summary</Heading>
              <Text>{cv.personal.summary}</Text>
            </Box>
          )}
          
          {/* Work Experience */}
          {cv.experience && cv.experience.length > 0 && (
            <Box mb={6}>
              <Heading size="md" color={accentColor} mb={3}>Work Experience</Heading>
              <VStack spacing={6} align="stretch">
                {cv.experience.map((exp, index) => (
                  <Box key={index}>
                    <Text fontWeight="bold" fontSize="lg">{exp.position}</Text>
                    <Flex justify="space-between" mb={2}>
                      <Text fontWeight="medium">{exp.company}, {exp.location}</Text>
                      <Text fontSize="sm" color="gray.500">
                        {exp.startDate && new Date(exp.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })} - 
                        {exp.endDate ? new Date(exp.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : 'Present'}
                      </Text>
                    </Flex>
                    <Text fontSize="sm">{exp.description}</Text>
                  </Box>
                ))}
              </VStack>
            </Box>
          )}
        </Box>
      </Flex>
    </Box>
  );
};

const CVPreview = () => {
  const [cv, setCV] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareLink, setShareLink] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  
  const bgColor = useColorModeValue('gray.100', 'gray.900');
  
  // Get CV data
  const fetchCV = async () => {
    setLoading(true);
    try {
      const cvId = params.get('id');
      if (!cvId) {
        navigate('/cv');
        return;
      }
      
      // Use cvService instead of direct axios
      const response = await cvService.getCV(cvId);
      setCV(response.data);
    } catch (error) {
      console.error('Error fetching CV:', error);
      setError('Failed to load CV data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle back to editor
  const handleBackToEditor = () => {
    const params = new URLSearchParams(location.search);
    const cvId = params.get('id');
    navigate(`/cv/editor?id=${cvId}`);
  };
  
  // Export CV in different formats
  const exportCV = async (format) => {
    setExporting(true);
    try {
      const cvId = params.get('id');
      if (!cvId) {
        return;
      }
      
      // Use apiService instead of direct axios
      const response = await apiService.get(`/export/cv/${cvId}?format=${format}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `CV-${cv.title || 'Export'}.${format}`);
      document.body.appendChild(link);
      link.click();
      
      toast({
        title: 'Export Successful',
        description: `Your CV has been exported as ${format.toUpperCase()}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error exporting CV:', error);
      toast({
        title: 'Export Failed',
        description: `Failed to export as ${format.toUpperCase()}. Please try again.`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setExporting(false);
    }
  };
  
  // Handle sharing
  const handleShare = () => {
    const params = new URLSearchParams(location.search);
    const cvId = params.get('id');
    const shareLink = `${window.location.origin}/shared-cv/${cvId}`;
    setShareLink(shareLink);
    setShareModalOpen(true);
  };
  
  // Copy share link to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    toast({
      title: 'Link Copied',
      description: 'Share link has been copied to clipboard.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };
  
  // Loading state
  if (loading) {
    return (
      <Flex justify="center" align="center" minHeight="500px">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" thickness="4px" />
          <Text>Loading CV preview...</Text>
        </VStack>
      </Flex>
    );
  }
  
  // Error state
  if (error || !cv) {
    return (
      <Container maxW="container.lg" py={10}>
        <Alert status="error" borderRadius="lg">
          <AlertIcon />
          <Box>
            <Heading size="md" mb={2}>Error</Heading>
            <Text>{error || 'CV not found'}</Text>
          </Box>
        </Alert>
        <Button mt={4} onClick={() => navigate('/cv')} colorScheme="blue">
          Back to CV Templates
        </Button>
      </Container>
    );
  }
  
  // Determine which template to use based on templateId
  const renderCVTemplate = () => {
    switch (cv.templateId) {
      case 'template2':
        return <CVTemplate2 cv={cv} />;
      case 'template1':
      default:
        return <CVTemplate1 cv={cv} />;
    }
  };
  
  return (
    <Box bg={bgColor} minHeight="100vh" py={6}>
      <Container maxW="container.xl">
        <Box 
          bg={useColorModeValue('white', 'gray.800')} 
          p={4} 
          borderRadius="lg"
          boxShadow="sm"
          mb={6}
        >
          <Flex justify="space-between" align="center">
            <HStack>
              <IconButton
                icon={<FaArrowLeft />}
                aria-label="Go back to editor"
                variant="ghost"
                onClick={handleBackToEditor}
              />
              <Heading size="lg">CV Preview</Heading>
            </HStack>
            
            <HStack spacing={2}>
              <Button
                leftIcon={<FaEdit />}
                variant="outline"
                onClick={handleBackToEditor}
              >
                Edit
              </Button>
              
              <Menu>
                <MenuButton as={Button} rightIcon={<FaChevronDown />} colorScheme="blue" isLoading={exporting}>
                  Export
                </MenuButton>
                <MenuList>
                  <MenuItem icon={<FaFilePdf />} onClick={() => exportCV('pdf')}>
                    Export as PDF
                  </MenuItem>
                  <MenuItem icon={<FaFileWord />} onClick={() => exportCV('docx')}>
                    Export as Word
                  </MenuItem>
                  <MenuItem icon={<FaFileCsv />} onClick={() => exportCV('txt')}>
                    Export as Plain Text
                  </MenuItem>
                </MenuList>
              </Menu>
              
              <Button leftIcon={<FaShare />} onClick={handleShare}>
                Share
              </Button>
            </HStack>
          </Flex>
        </Box>
        
        <Box
          bg={useColorModeValue('white', 'gray.800')}
          p={8}
          borderRadius="lg"
          boxShadow="md"
          mb={6}
          maxW="900px"
          mx="auto"
        >
          {renderCVTemplate()}
        </Box>
      </Container>
      
      {/* Share Modal */}
      <Modal isOpen={shareModalOpen} onClose={() => setShareModalOpen(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Share Your CV</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={4}>
              Share this link with others to let them view your CV:
            </Text>
            <Flex>
              <Input value={shareLink} isReadOnly pr="4.5rem" />
              <Button
                position="absolute"
                right={4}
                top="50%"
                transform="translateY(-50%)"
                zIndex={2}
                h="1.75rem"
                size="sm"
                onClick={copyToClipboard}
              >
                <FaCopy />
              </Button>
            </Flex>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setShareModalOpen(false)}>
              Close
            </Button>
            <Button colorScheme="blue" leftIcon={<FaEnvelope />}>
              Send via Email
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default CVPreview; 