import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  SimpleGrid,
  Textarea,
  useColorModeValue,
  useToast,
  VStack,
  HStack,
  IconButton,
  Text,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Tab,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Badge,
  Spinner,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Alert,
  AlertIcon,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
} from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { FaArrowLeft, FaPlus, FaTrash, FaSave, FaDownload, FaEye, FaRobot, FaBriefcase, FaMagic, FaKeyboard, FaMinus, FaCopy } from 'react-icons/fa';
import { apiService, cvService } from '../../api';

// Import the CVAnalyzer component
import CVAnalyzer from '../../components/ai/CVAnalyzer';
import CVOptimizer from '../../components/ai/CVOptimizer';
import JobOptimizationPanel from '../../components/ai/JobOptimizationPanel';

// Default empty CV data structure
const defaultCV = {
  personal: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    title: '',
    summary: '',
  },
  education: [],
  experience: [],
  skills: [],
  certifications: [],
  languages: [],
};

// Component to handle personal information
const PersonalInfoForm = ({ data, onChange }) => {
  return (
    <VStack spacing={4} align="stretch">
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        <FormControl isRequired>
          <FormLabel>First Name</FormLabel>
          <Input 
            value={data.firstName} 
            onChange={(e) => onChange('firstName', e.target.value)} 
            placeholder="First Name"
          />
        </FormControl>
        <FormControl isRequired>
          <FormLabel>Last Name</FormLabel>
          <Input 
            value={data.lastName} 
            onChange={(e) => onChange('lastName', e.target.value)} 
            placeholder="Last Name"
          />
        </FormControl>
      </SimpleGrid>
      
      <FormControl isRequired>
        <FormLabel>Professional Title</FormLabel>
        <Input 
          value={data.title} 
          onChange={(e) => onChange('title', e.target.value)} 
          placeholder="e.g. Senior Software Engineer"
        />
      </FormControl>
      
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        <FormControl isRequired>
          <FormLabel>Email</FormLabel>
          <Input 
            type="email" 
            value={data.email} 
            onChange={(e) => onChange('email', e.target.value)} 
            placeholder="email@example.com"
          />
        </FormControl>
        <FormControl>
          <FormLabel>Phone</FormLabel>
          <Input 
            value={data.phone} 
            onChange={(e) => onChange('phone', e.target.value)} 
            placeholder="+1 123-456-7890"
          />
        </FormControl>
      </SimpleGrid>
      
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        <FormControl>
          <FormLabel>Address</FormLabel>
          <Input 
            value={data.address} 
            onChange={(e) => onChange('address', e.target.value)} 
            placeholder="City, Country"
          />
        </FormControl>
        <FormControl>
          <FormLabel>Website</FormLabel>
          <Input 
            value={data.website} 
            onChange={(e) => onChange('website', e.target.value)} 
            placeholder="https://yourwebsite.com"
          />
        </FormControl>
      </SimpleGrid>
      
      <FormControl>
        <FormLabel>Professional Summary</FormLabel>
        <Textarea 
          value={data.summary} 
          onChange={(e) => onChange('summary', e.target.value)} 
          placeholder="A brief summary of your professional background and skills"
          rows={4}
        />
      </FormControl>
    </VStack>
  );
};

// Component for education section
const EducationForm = ({ items, onAdd, onUpdate, onRemove }) => {
  const [newItem, setNewItem] = useState({
    institution: '',
    degree: '',
    field: '',
    startDate: '',
    endDate: '',
    description: '',
  });

  const handleChange = (field, value) => {
    setNewItem({
      ...newItem,
      [field]: value,
    });
  };

  const handleAdd = () => {
    onAdd(newItem);
    setNewItem({
      institution: '',
      degree: '',
      field: '',
      startDate: '',
      endDate: '',
      description: '',
    });
  };

  return (
    <VStack spacing={6} align="stretch">
      <Accordion allowMultiple defaultIndex={[0]}>
        {items.map((item, index) => (
          <AccordionItem key={index}>
            <h2>
              <AccordionButton>
                <Box flex="1" textAlign="left">
                  <Text fontWeight="bold">{item.institution || 'Education Entry'}</Text>
                  <Text fontSize="sm" color="gray.500">{item.degree} {item.field && `in ${item.field}`}</Text>
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4}>
              <VStack spacing={4} align="stretch">
                <FormControl isRequired>
                  <FormLabel>Institution</FormLabel>
                  <Input 
                    value={item.institution} 
                    onChange={(e) => onUpdate(index, 'institution', e.target.value)} 
                    placeholder="University/College name"
                  />
                </FormControl>
                
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl>
                    <FormLabel>Degree</FormLabel>
                    <Input 
                      value={item.degree} 
                      onChange={(e) => onUpdate(index, 'degree', e.target.value)} 
                      placeholder="e.g. Bachelor's, Master's"
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Field of Study</FormLabel>
                    <Input 
                      value={item.field} 
                      onChange={(e) => onUpdate(index, 'field', e.target.value)} 
                      placeholder="e.g. Computer Science"
                    />
                  </FormControl>
                </SimpleGrid>
                
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl>
                    <FormLabel>Start Date</FormLabel>
                    <Input 
                      type="month" 
                      value={item.startDate} 
                      onChange={(e) => onUpdate(index, 'startDate', e.target.value)} 
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>End Date (or expected)</FormLabel>
                    <Input 
                      type="month" 
                      value={item.endDate} 
                      onChange={(e) => onUpdate(index, 'endDate', e.target.value)} 
                    />
                  </FormControl>
                </SimpleGrid>
                
                <FormControl>
                  <FormLabel>Description</FormLabel>
                  <Textarea 
                    value={item.description} 
                    onChange={(e) => onUpdate(index, 'description', e.target.value)} 
                    placeholder="Notable achievements, activities, etc."
                    rows={3}
                  />
                </FormControl>
                
                <Button 
                  leftIcon={<FaTrash />} 
                  colorScheme="red" 
                  variant="outline" 
                  size="sm"
                  onClick={() => onRemove(index)}
                >
                  Remove
                </Button>
              </VStack>
            </AccordionPanel>
          </AccordionItem>
        ))}
      </Accordion>
      
      <Divider />
      
      <Box bg={useColorModeValue('gray.50', 'gray.700')} p={4} borderRadius="md">
        <Heading size="sm" mb={4}>Add New Education</Heading>
        <VStack spacing={4} align="stretch">
          <FormControl>
            <FormLabel>Institution</FormLabel>
            <Input 
              value={newItem.institution} 
              onChange={(e) => handleChange('institution', e.target.value)} 
              placeholder="University/College name"
            />
          </FormControl>
          
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl>
              <FormLabel>Degree</FormLabel>
              <Input 
                value={newItem.degree} 
                onChange={(e) => handleChange('degree', e.target.value)} 
                placeholder="e.g. Bachelor's, Master's"
              />
            </FormControl>
            <FormControl>
              <FormLabel>Field of Study</FormLabel>
              <Input 
                value={newItem.field} 
                onChange={(e) => handleChange('field', e.target.value)} 
                placeholder="e.g. Computer Science"
              />
            </FormControl>
          </SimpleGrid>
          
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl>
              <FormLabel>Start Date</FormLabel>
              <Input 
                type="month" 
                value={newItem.startDate} 
                onChange={(e) => handleChange('startDate', e.target.value)} 
              />
            </FormControl>
            <FormControl>
              <FormLabel>End Date</FormLabel>
              <Input 
                type="month" 
                value={newItem.endDate} 
                onChange={(e) => handleChange('endDate', e.target.value)} 
              />
            </FormControl>
          </SimpleGrid>
          
          <Button 
            leftIcon={<FaPlus />} 
            colorScheme="blue" 
            onClick={handleAdd}
            isDisabled={!newItem.institution}
          >
            Add Education
          </Button>
        </VStack>
      </Box>
    </VStack>
  );
};

// Component for experience section
const ExperienceForm = ({ items, onAdd, onUpdate, onRemove }) => {
  const [newItem, setNewItem] = useState({
    company: '',
    position: '',
    location: '',
    startDate: '',
    endDate: '',
    current: false,
    description: '',
  });

  const handleChange = (field, value) => {
    setNewItem({
      ...newItem,
      [field]: value,
    });
  };

  const handleAdd = () => {
    onAdd(newItem);
    setNewItem({
      company: '',
      position: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: '',
    });
  };

  return (
    <VStack spacing={6} align="stretch">
      <Accordion allowMultiple defaultIndex={[0]}>
        {items.map((item, index) => (
          <AccordionItem key={index}>
            <h2>
              <AccordionButton>
                <Box flex="1" textAlign="left">
                  <Text fontWeight="bold">{item.position || 'Work Experience'}</Text>
                  <Text fontSize="sm" color="gray.500">{item.company}{item.location && `, ${item.location}`}</Text>
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4}>
              <VStack spacing={4} align="stretch">
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Company</FormLabel>
                    <Input 
                      value={item.company} 
                      onChange={(e) => onUpdate(index, 'company', e.target.value)} 
                      placeholder="Company name"
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Position</FormLabel>
                    <Input 
                      value={item.position} 
                      onChange={(e) => onUpdate(index, 'position', e.target.value)} 
                      placeholder="Job title"
                    />
                  </FormControl>
                </SimpleGrid>
                
                <FormControl>
                  <FormLabel>Location</FormLabel>
                  <Input 
                    value={item.location} 
                    onChange={(e) => onUpdate(index, 'location', e.target.value)} 
                    placeholder="City, Country"
                  />
                </FormControl>
                
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl>
                    <FormLabel>Start Date</FormLabel>
                    <Input 
                      type="month" 
                      value={item.startDate} 
                      onChange={(e) => onUpdate(index, 'startDate', e.target.value)} 
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>End Date</FormLabel>
                    <Input 
                      type="month" 
                      value={item.endDate} 
                      onChange={(e) => onUpdate(index, 'endDate', e.target.value)} 
                      placeholder="Present"
                      disabled={item.current}
                    />
                  </FormControl>
                </SimpleGrid>
                
                <FormControl>
                  <FormLabel>Description</FormLabel>
                  <Textarea 
                    value={item.description} 
                    onChange={(e) => onUpdate(index, 'description', e.target.value)} 
                    placeholder="Describe your responsibilities and achievements"
                    rows={4}
                  />
                </FormControl>
                
                <Button 
                  leftIcon={<FaTrash />} 
                  colorScheme="red" 
                  variant="outline" 
                  size="sm"
                  onClick={() => onRemove(index)}
                >
                  Remove
                </Button>
              </VStack>
            </AccordionPanel>
          </AccordionItem>
        ))}
      </Accordion>
      
      <Divider />
      
      <Box bg={useColorModeValue('gray.50', 'gray.700')} p={4} borderRadius="md">
        <Heading size="sm" mb={4}>Add New Experience</Heading>
        <VStack spacing={4} align="stretch">
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl>
              <FormLabel>Company</FormLabel>
              <Input 
                value={newItem.company} 
                onChange={(e) => handleChange('company', e.target.value)} 
                placeholder="Company name"
              />
            </FormControl>
            <FormControl>
              <FormLabel>Position</FormLabel>
              <Input 
                value={newItem.position} 
                onChange={(e) => handleChange('position', e.target.value)} 
                placeholder="Job title"
              />
            </FormControl>
          </SimpleGrid>
          
          <FormControl>
            <FormLabel>Location</FormLabel>
            <Input 
              value={newItem.location} 
              onChange={(e) => handleChange('location', e.target.value)} 
              placeholder="City, Country"
            />
          </FormControl>
          
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl>
              <FormLabel>Start Date</FormLabel>
              <Input 
                type="month" 
                value={newItem.startDate} 
                onChange={(e) => handleChange('startDate', e.target.value)} 
              />
            </FormControl>
            <FormControl>
              <FormLabel>End Date</FormLabel>
              <Input 
                type="month" 
                value={newItem.endDate} 
                onChange={(e) => handleChange('endDate', e.target.value)} 
                placeholder="Present"
                disabled={newItem.current}
              />
            </FormControl>
          </SimpleGrid>
          
          <FormControl>
            <FormLabel>Description</FormLabel>
            <Textarea 
              value={newItem.description} 
              onChange={(e) => handleChange('description', e.target.value)} 
              placeholder="Describe your responsibilities and achievements"
              rows={3}
            />
          </FormControl>
          
          <Button 
            leftIcon={<FaPlus />} 
            colorScheme="blue" 
            onClick={handleAdd}
            isDisabled={!newItem.company || !newItem.position}
          >
            Add Experience
          </Button>
        </VStack>
      </Box>
    </VStack>
  );
};

// Component for skills section
const SkillsForm = ({ items, onAdd, onUpdate, onRemove }) => {
  const [newSkill, setNewSkill] = useState({ name: '', level: 'Intermediate' });

  const handleAdd = () => {
    if (newSkill.name.trim()) {
      onAdd(newSkill);
      setNewSkill({ name: '', level: 'Intermediate' });
    }
  };

  const levels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

  return (
    <VStack spacing={6} align="stretch">
      {items.map((skill, index) => (
        <Flex key={index} justify="space-between" align="center">
          <FormControl flex="2" mr={2}>
            <Input 
              value={skill.name} 
              onChange={(e) => onUpdate(index, 'name', e.target.value)} 
              placeholder="Skill name"
            />
          </FormControl>
          <FormControl flex="1" mr={2}>
            <Input 
              as="select" 
              value={skill.level} 
              onChange={(e) => onUpdate(index, 'level', e.target.value)}
            >
              {levels.map((level) => (
                <option key={level} value={level}>{level}</option>
              ))}
            </Input>
          </FormControl>
          <IconButton 
            icon={<FaTrash />} 
            colorScheme="red" 
            variant="ghost" 
            onClick={() => onRemove(index)} 
            aria-label="Remove skill"
          />
        </Flex>
      ))}
      
      <Divider />
      
      <Box bg={useColorModeValue('gray.50', 'gray.700')} p={4} borderRadius="md">
        <Heading size="sm" mb={4}>Add New Skill</Heading>
        <Flex>
          <FormControl flex="2" mr={2}>
            <Input 
              value={newSkill.name} 
              onChange={(e) => setNewSkill({...newSkill, name: e.target.value})} 
              placeholder="e.g. JavaScript, Project Management"
            />
          </FormControl>
          <FormControl flex="1" mr={2}>
            <Input 
              as="select" 
              value={newSkill.level} 
              onChange={(e) => setNewSkill({...newSkill, level: e.target.value})}
            >
              {levels.map((level) => (
                <option key={level} value={level}>{level}</option>
              ))}
            </Input>
          </FormControl>
          <Button 
            leftIcon={<FaPlus />} 
            colorScheme="blue" 
            onClick={handleAdd}
            isDisabled={!newSkill.name.trim()}
          >
            Add
          </Button>
        </Flex>
      </Box>
    </VStack>
  );
};

const CVEditor = () => {
  const [cv, setCV] = useState(defaultCV);
  const [cvId, setCvId] = useState(null);
  const [templateId, setTemplateId] = useState('modern');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalCV, setOriginalCV] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const params = useSearchParams()[0];
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Tabs state 
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  // Extract template ID and tab from URL
  useEffect(() => {
    const id = params.get('id');
    const template = params.get('template');
    const tab = params.get('tab');
    
    if (template) {
      setTemplateId(template);
    }
    
    if (id) {
      setCvId(id);
      loadCV();
    }

    // Set active tab based on URL parameter
    if (tab === 'job-match') {
      setActiveTabIndex(4); // Index of Job Match tab
    } else if (tab === 'preview') {
      setActiveTabIndex(1);
    } else if (tab === 'analyze') {
      setActiveTabIndex(2);
    } else if (tab === 'optimize') {
      setActiveTabIndex(3);
    }
  }, [params]);
  
  const loadCV = async () => {
    setLoading(true);
    try {
      const id = params.get('id');
      const template = params.get('template');
      const tab = params.get('tab');
      
      // Set active tab if specified in URL
      if (tab === 'personal') setActiveTabIndex(0);
      else if (tab === 'experience') setActiveTabIndex(1);
      else if (tab === 'education') setActiveTabIndex(2);
      else if (tab === 'skills') setActiveTabIndex(3);
      else if (tab === 'projects') setActiveTabIndex(4);
      else if (tab === 'preview') setActiveTabIndex(5); 
      else if (tab === 'analyze') {
        setActiveTabIndex(6);
      }
      
      // If we have an ID, load the CV
      if (id) {
        // Use cvService instead of direct axios
        const response = await cvService.getCV(id);
        
        setCV(response.data);
        setOriginalCV(JSON.parse(JSON.stringify(response.data)));
        setHasChanges(false);
      } 
      // Otherwise, create a new CV with the selected template
      else if (template) {
        setCV({
          title: 'Untitled CV',
          template: template,
          personal: {
            firstName: '',
            lastName: '',
            title: '',
            email: '',
            phone: '',
            location: '',
            summary: ''
          },
          experience: [],
          education: [],
          skills: [],
          projects: [],
          languages: [],
          certifications: [],
          interests: []
        });
      } else {
        // No ID or template, redirect to template selection
        navigate('/cv');
        return;
      }
    } catch (error) {
      console.error('Error loading CV:', error);
      setError('Failed to load CV data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Update personal information
  const handlePersonalInfoChange = (field, value) => {
    setCV({
      ...cv,
      personal: {
        ...cv.personal,
        [field]: value,
      },
    });
  };
  
  // Education section handlers
  const addEducation = (item) => {
    setCV({
      ...cv,
      education: [...cv.education, item],
    });
  };
  
  const updateEducation = (index, field, value) => {
    const updatedEducation = [...cv.education];
    updatedEducation[index] = {
      ...updatedEducation[index],
      [field]: value,
    };
    setCV({
      ...cv,
      education: updatedEducation,
    });
  };
  
  const removeEducation = (index) => {
    const updatedEducation = [...cv.education];
    updatedEducation.splice(index, 1);
    setCV({
      ...cv,
      education: updatedEducation,
    });
  };
  
  // Experience section handlers
  const addExperience = (item) => {
    setCV({
      ...cv,
      experience: [...cv.experience, item],
    });
  };
  
  const updateExperience = (index, field, value) => {
    const updatedExperience = [...cv.experience];
    updatedExperience[index] = {
      ...updatedExperience[index],
      [field]: value,
    };
    setCV({
      ...cv,
      experience: updatedExperience,
    });
  };
  
  const removeExperience = (index) => {
    const updatedExperience = [...cv.experience];
    updatedExperience.splice(index, 1);
    setCV({
      ...cv,
      experience: updatedExperience,
    });
  };
  
  // Skills section handlers
  const addSkill = (item) => {
    setCV({
      ...cv,
      skills: [...cv.skills, item],
    });
  };
  
  const updateSkill = (index, field, value) => {
    const updatedSkills = [...cv.skills];
    updatedSkills[index] = {
      ...updatedSkills[index],
      [field]: value,
    };
    setCV({
      ...cv,
      skills: updatedSkills,
    });
  };
  
  const removeSkill = (index) => {
    const updatedSkills = [...cv.skills];
    updatedSkills.splice(index, 1);
    setCV({
      ...cv,
      skills: updatedSkills,
    });
  };
  
  // Save CV
  const saveCV = async () => {
    setSaving(true);
    setError(null);
    
    try {
      let response;
      const cvId = params.get('id');
      
      // Use cvService instead of direct axios
      if (cvId) {
        response = await cvService.updateCV(cvId, cv);
      } else {
        response = await cvService.createCV(cv);
        // Update URL if this is a new CV
        navigate(`/cv/editor?id=${response.data.id}`);
      }
      
      setOriginalCV(JSON.parse(JSON.stringify(cv)));
      setHasChanges(false);
      
      toast({
        title: 'CV Saved',
        description: 'Your CV has been saved successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      return response.data.id;
    } catch (error) {
      console.error('Error saving CV:', error);
      setError('Failed to save CV. Please try again.');
      
      toast({
        title: 'Save Failed',
        description: 'There was a problem saving your CV',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      
      return null;
    } finally {
      setSaving(false);
    }
  };
  
  // Delete CV
  const deleteCV = async () => {
    try {
      const cvId = params.get('id');
      if (!cvId) return;
      
      // Use cvService instead of direct axios
      await cvService.deleteCV(cvId);
      
      toast({
        title: 'CV Deleted',
        description: 'Your CV has been deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      navigate('/cv');
    } catch (error) {
      console.error('Error deleting CV:', error);
      toast({
        title: 'Delete Failed',
        description: 'There was a problem deleting your CV',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // Preview CV
  const previewCV = () => {
    const params = new URLSearchParams(location.search);
    const cvId = params.get('id');
    if (cvId) {
      navigate(`/cv/preview?id=${cvId}`);
    } else {
      toast({
        title: 'Save Required',
        description: 'Please save your CV first before previewing.',
        status: 'info',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // Navigate back to templates
  const handleBack = () => {
    navigate('/cv');
  };

  return (
    <Container maxW="container.xl" py={5}>
      <HStack mb={5} spacing={4}>
        <Button 
          leftIcon={<FaArrowLeft />} 
          onClick={handleBack} 
          variant="ghost"
        >
          Back
        </Button>
        <Heading size="lg">
          {cv.personal.firstName ? `${cv.personal.firstName}'s CV` : 'New CV'}
        </Heading>
        <Badge colorScheme="blue" fontSize="0.8em" p={2}>
          {templateId}
        </Badge>
      </HStack>
      
      <Tabs 
        variant="enclosed" 
        colorScheme="blue" 
        index={activeTabIndex}
        onChange={(index) => {
          setActiveTabIndex(index);
        }}
      >
        <TabList>
          <Tab><HStack><FaKeyboard /><Text>Editor</Text></HStack></Tab>
          <Tab><HStack><FaEye /><Text>Preview</Text></HStack></Tab>
          <Tab><HStack><FaRobot /><Text>AI Analysis</Text></HStack></Tab>
          <Tab><HStack><FaPlus /><Text>AI Suggestions</Text></HStack></Tab>
          <Tab><HStack><FaMagic /><Text>Job Match</Text></HStack></Tab>
        </TabList>
        <TabPanels>
          {/* Editor Tab */}
          <TabPanel>
            <Tabs orientation="vertical" variant="line" minHeight="600px">
              <TabList width="200px">
                <Tab>Personal Information</Tab>
                <Tab>Experience</Tab>
                <Tab>Education</Tab>
                <Tab>Skills</Tab>
                <Tab>Languages</Tab>
                <Tab>Certifications</Tab>
              </TabList>
              <TabPanels flex="1">
                <TabPanel>
                  <PersonalInfoForm 
                    data={cv.personal} 
                    onChange={handlePersonalInfoChange} 
                  />
                </TabPanel>
                <TabPanel>
                  <ExperienceForm 
                    items={cv.experience} 
                    onAdd={addExperience} 
                    onUpdate={updateExperience} 
                    onRemove={removeExperience}
                  />
                </TabPanel>
                <TabPanel>
                  <EducationForm 
                    items={cv.education} 
                    onAdd={addEducation}
                    onUpdate={updateEducation}
                    onRemove={removeEducation}
                  />
                </TabPanel>
                <TabPanel>
                  <SkillsForm 
                    items={cv.skills} 
                    onAdd={addSkill} 
                    onUpdate={updateSkill} 
                    onRemove={removeSkill}
                  />
                </TabPanel>
                <TabPanel>
                  {/* Languages tab content */}
                  <Text>Language section coming soon</Text>
                </TabPanel>
                <TabPanel>
                  {/* Certifications tab content */}
                  <Text>Certifications section coming soon</Text>
                </TabPanel>
              </TabPanels>
            </Tabs>
            <Flex justify="flex-end" mt={5}>
              <Button
                leftIcon={<FaSave />}
                colorScheme="blue"
                isLoading={saving}
                onClick={saveCV}
              >
                Save CV
              </Button>
            </Flex>
          </TabPanel>
          
          {/* Preview Tab */}
          <TabPanel>
            <Box p={5} borderWidth="1px" borderRadius="lg" minHeight="600px" bg="white">
              {/* Placeholder for CV preview */}
              <Text>Preview feature coming soon. You'll be able to see how your CV looks as you edit it.</Text>
              
              <HStack mt={5} spacing={4}>
                <Button leftIcon={<FaDownload />} colorScheme="teal">
                  Export as PDF
                </Button>
                <Button leftIcon={<FaDownload />} variant="outline" colorScheme="teal">
                  Export as Word
                </Button>
              </HStack>
            </Box>
          </TabPanel>
          
          {/* AI Analysis Tab */}
          <TabPanel>
            <CVAnalyzer cv={cv} />
          </TabPanel>
          
          {/* AI Optimization Tab */}
          <TabPanel>
            <CVOptimizer cv={cv} />
          </TabPanel>
          
          {/* Job Match Tab */}
          <TabPanel>
            <JobOptimizationPanel cvId={cvId} cvData={cv} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Container>
  );
};

export default CVEditor; 