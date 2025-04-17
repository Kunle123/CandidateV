import { Link as RouterLink } from 'react-router-dom'
import { Box, Heading, Text, Button, Flex } from '@chakra-ui/react'

const NotFound = () => {
  return (
    <Flex
      align="center"
      justify="center"
      direction="column"
      minH="70vh"
      gap={5}
      px={4}
      textAlign="center"
    >
      <Heading
        display="inline-block"
        size="4xl"
        bgGradient="linear(to-r, brand.400, brand.600)"
        backgroundClip="text"
      >
        404
      </Heading>
      <Text fontSize="xl" mb={3}>
        Page Not Found
      </Text>
      <Text color={'gray.500'} mb={6}>
        The page you're looking for does not seem to exist
      </Text>

      <Button
        as={RouterLink}
        to="/"
        colorScheme="blue"
        bgGradient="linear(to-r, brand.400, brand.500, brand.600)"
        color="white"
        variant="solid"
      >
        Go to Home
      </Button>
    </Flex>
  )
}

export default NotFound
