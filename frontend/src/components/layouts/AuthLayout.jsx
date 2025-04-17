import { Outlet, Link as RouterLink } from 'react-router-dom'
import { Box, Flex, Image, Link, Text } from '@chakra-ui/react'

const AuthLayout = () => {
  return (
    <Flex minHeight="100vh" direction={{ base: 'column', md: 'row' }}>
      {/* Left side - Brand/Info */}
      <Flex 
        flex={{ base: '0', md: '0.4' }} 
        bg="brand.600" 
        color="white"
        direction="column"
        align="center"
        justify="center"
        p={8}
        display={{ base: 'none', md: 'flex' }}
      >
        <Link as={RouterLink} to="/" mb={8}>
          <Text fontSize="2xl" fontWeight="bold">CandidateV</Text>
        </Link>
        <Text fontSize="xl" fontWeight="bold" mb={4}>Build Your Professional CV</Text>
        <Text fontSize="md" textAlign="center" mb={6}>
          Create, optimize and manage professional CVs with AI assistance.
        </Text>
      </Flex>
      
      {/* Mobile header */}
      <Box 
        p={4} 
        bg="brand.600" 
        color="white" 
        display={{ base: 'block', md: 'none' }}
      >
        <Link as={RouterLink} to="/">
          <Text fontSize="xl" fontWeight="bold">CandidateV</Text>
        </Link>
      </Box>
      
      {/* Right side - Auth form */}
      <Flex 
        flex={{ base: '1', md: '0.6' }} 
        align="center" 
        justify="center"
        p={8}
      >
        <Box w="100%" maxW="400px">
          <Outlet />
        </Box>
      </Flex>
    </Flex>
  )
}

export default AuthLayout 