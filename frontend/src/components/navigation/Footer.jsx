import { Link as RouterLink } from 'react-router-dom'
import {
  Box,
  Container,
  Stack,
  SimpleGrid,
  Text,
  Link,
  VisuallyHidden,
  chakra,
  useColorModeValue,
} from '@chakra-ui/react'
import { FaTwitter, FaLinkedin, FaInstagram } from 'react-icons/fa'

const ListHeader = ({ children }) => {
  return (
    <Text fontWeight={'500'} fontSize={'lg'} mb={2}>
      {children}
    </Text>
  )
}

const SocialButton = ({ children, label, href }) => {
  return (
    <chakra.button
      bg={useColorModeValue('blackAlpha.100', 'whiteAlpha.100')}
      rounded={'full'}
      w={8}
      h={8}
      cursor={'pointer'}
      as={'a'}
      href={href}
      display={'inline-flex'}
      alignItems={'center'}
      justifyContent={'center'}
      transition={'background 0.3s ease'}
      _hover={{
        bg: useColorModeValue('blackAlpha.200', 'whiteAlpha.200'),
      }}
    >
      <VisuallyHidden>{label}</VisuallyHidden>
      {children}
    </chakra.button>
  )
}

const Footer = () => {
  return (
    <Box
      bg={useColorModeValue('gray.50', 'gray.900')}
      color={useColorModeValue('gray.700', 'gray.200')}
    >
      <Container as={Stack} maxW={'6xl'} py={10}>
        <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={8}>
          <Stack align={'flex-start'}>
            <ListHeader>Company</ListHeader>
            <Link as={RouterLink} to={'/#about'}>About</Link>
            <Link as={RouterLink} to={'/#team'}>Team</Link>
            <Link as={RouterLink} to={'/#careers'}>Careers</Link>
            <Link as={RouterLink} to={'/#contact'}>Contact</Link>
          </Stack>

          <Stack align={'flex-start'}>
            <ListHeader>Product</ListHeader>
            <Link as={RouterLink} to={'/#features'}>Features</Link>
            <Link as={RouterLink} to={'/#pricing'}>Pricing</Link>
            <Link as={RouterLink} to={'/#testimonials'}>Testimonials</Link>
            <Link as={RouterLink} to={'/#faq'}>FAQ</Link>
          </Stack>

          <Stack align={'flex-start'}>
            <ListHeader>Support</ListHeader>
            <Link as={RouterLink} to={'/#help'}>Help Center</Link>
            <Link as={RouterLink} to={'/#terms'}>Terms of Service</Link>
            <Link as={RouterLink} to={'/#privacy'}>Privacy Policy</Link>
            <Link as={RouterLink} to={'/#cookies'}>Cookie Settings</Link>
          </Stack>

          <Stack align={'flex-start'}>
            <ListHeader>Follow Us</ListHeader>
            <Stack direction={'row'} spacing={6}>
              <SocialButton label={'Twitter'} href={'#'}>
                <FaTwitter />
              </SocialButton>
              <SocialButton label={'LinkedIn'} href={'#'}>
                <FaLinkedin />
              </SocialButton>
              <SocialButton label={'Instagram'} href={'#'}>
                <FaInstagram />
              </SocialButton>
            </Stack>
          </Stack>
        </SimpleGrid>
      </Container>

      <Box
        borderTopWidth={1}
        borderStyle={'solid'}
        borderColor={useColorModeValue('gray.200', 'gray.700')}
      >
        <Container
          as={Stack}
          maxW={'6xl'}
          py={4}
          direction={{ base: 'column', md: 'row' }}
          spacing={4}
          justify={{ md: 'space-between' }}
          align={{ md: 'center' }}
        >
          <Text>© 2025 CandidateV. All rights reserved</Text>
        </Container>
      </Box>
    </Box>
  )
}

export default Footer 