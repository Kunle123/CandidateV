import { Link as RouterLink } from 'react-router-dom'
import {
  Box,
  Heading,
  Container,
  Text,
  Button,
  Stack,
  Icon,
  useColorModeValue,
  createIcon,
  Flex,
  SimpleGrid,
  Image,
  Highlight,
  ButtonGroup,
} from '@chakra-ui/react'
import { FaRocket, FaMagic, FaDownload, FaLock, FaFileAlt, FaSearch, FaArrowRight } from 'react-icons/fa'

const Feature = ({ title, text, icon }) => {
  return (
    <Stack align={'center'} textAlign={'center'}>
      <Flex
        w={16}
        h={16}
        align={'center'}
        justify={'center'}
        color={'white'}
        rounded={'full'}
        bg={'brand.500'}
        mb={1}
      >
        {icon}
      </Flex>
      <Text fontWeight={600}>{title}</Text>
      <Text color={'gray.600'}>{text}</Text>
    </Stack>
  )
}

export default function Home() {
  return (
    <Container maxW={'3xl'}>
      <Stack
        as={Box}
        textAlign={'center'}
        spacing={{ base: 8, md: 14 }}
        py={{ base: 20, md: 36 }}
      >
        <Heading
          fontWeight={600}
          fontSize={{ base: '2xl', sm: '4xl', md: '6xl' }}
          lineHeight={'110%'}
        >
          Build your career with <br />
          <Text as={'span'} color={'green.400'}>
            CandidateV Pro
          </Text>
        </Heading>
        <Text color={'gray.500'}>
          Create professional CVs with AI assistance. Optimize your resume for ATS systems,
          track applications, and get personalized recommendations for job success.
          Start your journey to your dream job today!
        </Text>
        <Stack
          direction={'column'}
          spacing={3}
          align={'center'}
          alignSelf={'center'}
          position={'relative'}
        >
          <Button
            as={RouterLink}
            to="/register"
            colorScheme={'green'}
            bg={'green.400'}
            rounded={'full'}
            px={6}
            _hover={{
              bg: 'green.500',
            }}
          >
            Get Started
          </Button>
          <Button 
            as={RouterLink} 
            to="/login"
            variant={'link'} 
            colorScheme={'blue'} 
            size={'sm'}
          >
            Already have an account? Sign in
          </Button>
        </Stack>
      </Stack>
    </Container>
  )
} 