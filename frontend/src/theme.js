import { extendTheme } from '@chakra-ui/react';

const colors = {
  brand: {
    50: '#e6f7ff',
    100: '#b3e0ff',
    200: '#80caff',
    300: '#4db3ff',
    400: '#1a9dff',
    500: '#0080ff', // Primary brand color
    600: '#006ee6',
    700: '#005dcc',
    800: '#004bb3',
    900: '#003a99',
  },
  success: {
    500: '#38a169', // Green
  },
  error: {
    500: '#e53e3e', // Red
  },
  warning: {
    500: '#dd6b20', // Orange
  },
  info: {
    500: '#3182ce', // Blue
  },
};

const components = {
  Button: {
    baseStyle: {
      fontWeight: 'semibold',
      borderRadius: 'md',
    },
    variants: {
      solid: (props) => ({
        bg: props.colorScheme === 'brand' ? 'brand.500' : `${props.colorScheme}.500`,
        color: 'white',
        _hover: {
          bg: props.colorScheme === 'brand' ? 'brand.600' : `${props.colorScheme}.600`,
        },
      }),
      outline: (props) => ({
        borderColor: props.colorScheme === 'brand' ? 'brand.500' : `${props.colorScheme}.500`,
      }),
      ghost: (props) => ({
        color: props.colorScheme === 'brand' ? 'brand.500' : `${props.colorScheme}.500`,
      }),
    },
    defaultProps: {
      colorScheme: 'brand',
    },
  },
  Heading: {
    baseStyle: {
      fontWeight: 'bold',
    },
  },
  Card: {
    baseStyle: {
      container: {
        borderRadius: 'lg',
        overflow: 'hidden',
        boxShadow: 'md',
      },
    },
  },
};

const fonts = {
  heading: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  body: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
};

const styles = {
  global: {
    body: {
      bg: 'gray.50',
      color: 'gray.800',
    },
  },
};

const theme = extendTheme({
  colors,
  components,
  fonts,
  styles,
  config: {
    initialColorMode: 'light',
    useSystemColorMode: true,
  },
});

export default theme; 