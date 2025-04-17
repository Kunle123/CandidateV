import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
  Badge,
  Tooltip,
} from '@chakra-ui/react';
import { 
  FaDownload, 
  FaFilePdf, 
  FaPrint, 
  FaEnvelope, 
  FaLinkedin, 
  FaLink,
  FaCopy,
} from 'react-icons/fa';
import axios from 'axios';

// Sample shared CV view - simplified display
const SharedCVView = () => {
  const [cv, setCV] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();
  
  const bgColor = useColorModeValue('gray.100', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Load CV data
  useEffect(() => {
    const fetchCV = async () => {
      try {
        if (!id) {
          setError('CV not found');
          setLoading(false);
          return;
        }
        
        const response = await axios.get(`/api/cv/shared/${id}`);
        setCV(response.data);
      } catch (err) {
        console.error('Error fetching shared CV:', err);
        setError('This CV is no longer available or does not exist.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCV();
  }, [id]);
  
  // Copy page URL to clipboard
  const copyPageUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard');
  };
  
  // Print CV
  const printCV = () => {
    window.print();
  };
  
  // Download CV as PDF
  const downloadPDF = async () => {
    try {
      const response = await axios.get(`/api/export/cv/${id}?format=pdf`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `CV_${cv.personal.firstName}_${cv.personal.lastName}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error downloading PDF:', err);
      alert('Failed to download PDF. Please try again.');
    }
  };
  
  // Loading state
  if (loading) {
    return (
      <Flex justify="center" align="center" minHeight="500px">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" thickness="4px" />
          <Text>Loading CV...</Text>
        </VStack>
      </Flex>
    );
  }
  
  // Error state
  if (error || !cv) {
    return (
      <Container maxW="container.md" py={10}>
        <Alert status="error" borderRadius="lg">
          <AlertIcon />
          <Box>
            <Heading size="md" mb={2}>CV Not Found</Heading>
            <Text>{error || 'The CV you are looking for doesn\'t exist or is no longer shared.'}</Text>
          </Box>
        </Alert>
      </Container>
    );
  }
  
  return (
    <Box bg={bgColor} minHeight="100vh" py={6} className="shared-cv-container">
      <Container maxW="container.md">
        {/* Header with actions */}
        <Flex 
          justify="space-between" 
          align="center" 
          mb={6} 
          bg={cardBg} 
          p={4} 
          borderRadius="md" 
          boxShadow="sm"
          flexWrap="wrap"
          gap={2}
        >
          <HStack>
            <Badge colorScheme="green" px={2} py={1} borderRadius="full">
              Shared CV
            </Badge>
            <Text fontWeight="medium">{cv.personal.firstName} {cv.personal.lastName}</Text>
          </HStack>
          
          <HStack spacing={2} className="no-print">
            <Tooltip label="Download PDF">
              <IconButton
                icon={<FaFilePdf />}
                aria-label="Download PDF"
                onClick={downloadPDF}
                size="sm"
              />
            </Tooltip>
            <Tooltip label="Print CV">
              <IconButton
                icon={<FaPrint />}
                aria-label="Print CV"
                onClick={printCV}
                size="sm"
              />
            </Tooltip>
            <Tooltip label="Copy Link">
              <IconButton
                icon={<FaLink />}
                aria-label="Copy Link"
                onClick={copyPageUrl}
                size="sm"
              />
            </Tooltip>
          </HStack>
        </Flex>
        
        {/* CV Content */}
        <Box 
          bg={cardBg} 
          p={8} 
          borderRadius="md" 
          boxShadow="md" 
          borderWidth="1px"
          borderColor={borderColor}
        >
          {/* Personal Info */}
          <VStack spacing={2} align="center" mb={8} className="cv-header">
            <Heading size="xl">{cv.personal.firstName} {cv.personal.lastName}</Heading>
            <Text fontSize="xl" color="blue.500" fontWeight="medium">{cv.personal.title}</Text>
            <HStack spacing={4} mt={2} wrap="wrap" justify="center">
              {cv.personal.email && (
                <HStack>
                  <FaEnvelope />
                  <Text>{cv.personal.email}</Text>
                </HStack>
              )}
              {cv.personal.phone && (
                <HStack>
                  <FaEnvelope />
                  <Text>{cv.personal.phone}</Text>
                </HStack>
              )}
              {cv.personal.location && (
                <Text>{cv.personal.location}</Text>
              )}
            </HStack>
          </VStack>
          
          {/* Professional Summary */}
          {cv.personal.summary && (
            <Box mb={8} className="cv-section">
              <Heading size="md" mb={3} pb={2} borderBottomWidth="2px" borderColor="blue.500">
                Professional Summary
              </Heading>
              <Text>{cv.personal.summary}</Text>
            </Box>
          )}
          
          {/* Experience */}
          {cv.experience && cv.experience.length > 0 && (
            <Box mb={8} className="cv-section">
              <Heading size="md" mb={3} pb={2} borderBottomWidth="2px" borderColor="blue.500">
                Work Experience
              </Heading>
              <VStack spacing={6} align="stretch">
                {cv.experience.map((exp, index) => (
                  <Box key={index}>
                    <Flex justify="space-between" mb={1} flexWrap="wrap">
                      <Heading size="sm">{exp.position}</Heading>
                      <Text fontSize="sm" fontWeight="medium">
                        {exp.startDate && new Date(exp.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })} - 
                        {exp.endDate ? new Date(exp.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : 'Present'}
                      </Text>
                    </Flex>
                    <Flex justify="space-between" mb={2} flexWrap="wrap">
                      <Text fontWeight="medium">{exp.company}</Text>
                      <Text fontSize="sm">{exp.location}</Text>
                    </Flex>
                    <Text>{exp.description}</Text>
                    {index < cv.experience.length - 1 && <Divider mt={4} />}
                  </Box>
                ))}
              </VStack>
            </Box>
          )}
          
          {/* Education */}
          {cv.education && cv.education.length > 0 && (
            <Box mb={8} className="cv-section">
              <Heading size="md" mb={3} pb={2} borderBottomWidth="2px" borderColor="blue.500">
                Education
              </Heading>
              <VStack spacing={6} align="stretch">
                {cv.education.map((edu, index) => (
                  <Box key={index}>
                    <Flex justify="space-between" mb={1} flexWrap="wrap">
                      <Heading size="sm">{edu.degree} {edu.field && `in ${edu.field}`}</Heading>
                      <Text fontSize="sm" fontWeight="medium">
                        {edu.startDate && new Date(edu.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })} - 
                        {edu.endDate ? new Date(edu.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : 'Present'}
                      </Text>
                    </Flex>
                    <Text fontWeight="medium" mb={2}>{edu.institution}</Text>
                    {edu.description && <Text>{edu.description}</Text>}
                    {index < cv.education.length - 1 && <Divider mt={4} />}
                  </Box>
                ))}
              </VStack>
            </Box>
          )}
          
          {/* Skills */}
          {cv.skills && cv.skills.length > 0 && (
            <Box mb={8} className="cv-section">
              <Heading size="md" mb={3} pb={2} borderBottomWidth="2px" borderColor="blue.500">
                Skills
              </Heading>
              <Flex wrap="wrap" gap={2}>
                {cv.skills.map((skill, index) => (
                  <Badge key={index} colorScheme="blue" px={3} py={1} borderRadius="full" fontSize="md">
                    {skill.name} {skill.level && `(${skill.level})`}
                  </Badge>
                ))}
              </Flex>
            </Box>
          )}
        </Box>
        
        {/* Footer */}
        <Flex 
          mt={6} 
          justify="center" 
          className="no-print"
        >
          <HStack spacing={4}>
            <Button leftIcon={<FaDownload />} colorScheme="blue" onClick={downloadPDF}>
              Download PDF
            </Button>
            <Button leftIcon={<FaLinkedin />} colorScheme="linkedin" variant="outline">
              Share to LinkedIn
            </Button>
            <Button leftIcon={<FaEnvelope />} colorScheme="gray" variant="outline">
              Email
            </Button>
          </HStack>
        </Flex>
        
        <Text fontSize="sm" color="gray.500" textAlign="center" mt={8} className="no-print">
          This CV was created and shared with CandidateV
        </Text>
      </Container>
      
      {/* Print Styles - added via style tag */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .shared-cv-container {
            background: white !important;
            padding: 0 !important;
          }
          .cv-header {
            margin-bottom: 1.5rem !important;
          }
          .cv-section {
            margin-bottom: 1.2rem !important;
            page-break-inside: avoid;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
      `}</style>
    </Box>
  );
};

export default SharedCVView; 