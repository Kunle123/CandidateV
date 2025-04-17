import { extendTheme } from '@chakra-ui/react'

const theme = extendTheme({
  colors: {
    brand: {
      50: '#f0f8ff',
      100: '#d0e6ff',
      200: '#a8d4ff',
      300: '#75baff',
      400: '#429fff',
      500: '#1a85ff', // primary brand color
      600: '#0061cc',
      700: '#0048a1',
      800: '#003166',
      900: '#001833',
    },
    accent: {
      500: '#ff7a00', // accent color
    },
  },
  fonts: {
    heading: 'Inter, system-ui, sans-serif',
    body: 'Inter, system-ui, sans-serif',
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: 'medium',
        borderRadius: 'md',
      },
      variants: {
        primary: {
          bg: 'brand.500',
          color: 'white',
          _hover: {
            bg: 'brand.600',
          },
        },
        secondary: {
          bg: 'gray.200',
          color: 'gray.800',
          _hover: {
            bg: 'gray.300',
          },
        },
        accent: {
          bg: 'accent.500',
          color: 'white',
          _hover: {
            bg: 'orange.600',
          },
        },
      },
    },
  },
})

export default theme 