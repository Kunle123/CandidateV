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

const Home = () => {
  return (
    <Box>
      {/* Hero Section */}
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
            Job-optimized CVs & Cover Letters <br />
            <Text as={'span'} color={'brand.500'}>
              with AI precision
            </Text>
          </Heading>
          <Text color={'gray.600'} fontSize={{ base: 'lg', md: 'xl' }}>
            <Highlight
              query={['keywords', 'job-specific', 'cover letter']}
              styles={{ px: '2', py: '1', rounded: 'full', bg: 'brand.100' }}
            >
              CandidateV automatically matches your CV to specific job descriptions, reordering bullet points and using the same keywords as the job advert to maximize your interview chances. Generate a perfectly matched cover letter in seconds.
            </Highlight>
          </Text>
          <Stack
            direction={'column'}
            spacing={3}
            align={'center'}
            alignSelf={'center'}
            position={'relative'}
          >
            <ButtonGroup spacing={4}>
              <Button
                as={RouterLink}
                to={'/register'}
                colorScheme={'blue'}
                bg={'brand.500'}
                rounded={'full'}
                px={6}
                _hover={{
                  bg: 'brand.600',
                }}
              >
                Create Free Account
              </Button>
              <Button
                as={RouterLink}
                to={'/login?redirect=/cv/optimize'}
                colorScheme={'blue'}
                bg={'brand.700'}
                rounded={'full'}
                px={6}
                rightIcon={<FaArrowRight />}
                _hover={{
                  bg: 'brand.800',
                }}
              >
                Optimize My CV Now
              </Button>
            </ButtonGroup>
            <Button
              as={RouterLink}
              to={'/login'}
              variant={'link'}
              colorScheme={'blue'}
              size={'sm'}
            >
              Already have an account? Sign in
            </Button>
          </Stack>
        </Stack>
      </Container>

      {/* Features Section */}
      <Box id="features" bg={useColorModeValue('gray.50', 'gray.800')} p={20}>
        <Stack spacing={4} as={Container} maxW={'3xl'} textAlign={'center'} mb={10}>
          <Heading fontSize={'3xl'}>AI-Powered CV & Cover Letter Optimization</Heading>
          <Text color={'gray.600'} fontSize={'xl'}>
            Get more interviews with our intelligent CV matching technology
          </Text>
        </Stack>

        <Container maxW={'6xl'}>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={10}>
            <Feature
              icon={<Icon as={FaSearch} w={10} h={10} />}
              title={'Job-Specific Optimization'}
              text={'Our AI analyzes your CV against job descriptions, reordering sections and matching keywords to increase your interview chances.'}
            />
            <Feature
              icon={<Icon as={FaFileAlt} w={10} h={10} />}
              title={'Custom Cover Letters'}
              text={'Generate tailored cover letters that perfectly complement your CV and highlight your most relevant experience for each job.'}
            />
            <Feature
              icon={<Icon as={FaMagic} w={10} h={10} />}
              title={'Keyword Enhancement'}
              text={'Automatically identify and incorporate critical job keywords, rephrasing your existing skills to match what employers are looking for.'}
            />
          </SimpleGrid>
        </Container>
      </Box>

      {/* How It Works Section */}
      <Box py={16} bg={useColorModeValue('white', 'gray.700')}>
        <Container maxW={'5xl'}>
          <Stack spacing={4} as={Container} maxW={'3xl'} textAlign={'center'} mb={10}>
            <Heading fontSize={'3xl'}>How It Works</Heading>
            <Text color={'gray.600'} fontSize={'xl'}>
              Three simple steps to create the perfect job application
            </Text>
          </Stack>

          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10} pt={5}>
            <Box p={5} shadow={'md'} borderWidth={'1px'} borderRadius={'lg'}>
              <Heading fontSize={'xl'}>1. Upload Your CV</Heading>
              <Text mt={4}>Start with your existing CV or create a new one with our templates.</Text>
            </Box>
            <Box p={5} shadow={'md'} borderWidth={'1px'} borderRadius={'lg'}>
              <Heading fontSize={'xl'}>2. Paste the Job Description</Heading>
              <Text mt={4}>Add the job posting you're interested in and any additional comments you find relevant.</Text>
            </Box>
            <Box p={5} shadow={'md'} borderWidth={'1px'} borderRadius={'lg'}>
              <Heading fontSize={'xl'}>3. Generate & Download</Heading>
              <Text mt={4}>Get your optimized CV and matching cover letter, ready to submit to employers.</Text>
            </Box>
          </SimpleGrid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Container maxW={'3xl'} py={16}>
        <Stack
          as={Box}
          textAlign={'center'}
          spacing={{ base: 8, md: 14 }}
        >
          <Heading
            fontWeight={600}
            fontSize={{ base: '2xl', sm: '3xl', md: '4xl' }}
            lineHeight={'110%'}
          >
            Ready to land more interviews?
          </Heading>
          <Text color={'gray.600'} fontSize={{ base: 'md', md: 'lg' }}>
            Stop sending generic applications. Our AI matches your experience to each job, highlighting exactly what employers are looking for without fabricating information.
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
              to={'/register?redirect=/cv/optimize'}
              colorScheme={'blue'}
              bg={'brand.500'}
              rounded={'full'}
              px={6}
              py={6}
              fontSize={'lg'}
              _hover={{
                bg: 'brand.600',
              }}
            >
              Start Optimizing Your CV
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  )
}

export default Home 