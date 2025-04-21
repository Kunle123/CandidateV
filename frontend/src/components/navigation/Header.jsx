import { useState } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, 
  Flex, 
  HStack,
  Text,
  IconButton,
  Button,
  useDisclosure,
  useColorModeValue,
  Stack,
  useColorMode,
  Heading,
  Container,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Image,
  Badge,
} from '@chakra-ui/react';
import { HamburgerIcon, CloseIcon, MoonIcon, SunIcon } from '@chakra-ui/icons';
import { FaUser, FaFileAlt, FaCog, FaSignOutAlt, FaChevronDown } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import UserMenu from './UserMenu';

const NavLink = ({ children, to, active }) => {
  const activeBg = useColorModeValue('blue.50', 'blue.900');
  const activeColor = useColorModeValue('blue.700', 'blue.200');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');
  
  return (
    <RouterLink to={to}>
      <Box
        px={4}
        py={2}
        rounded="md"
        fontWeight={active ? "semibold" : "medium"}
        color={active ? activeColor : undefined}
        bg={active ? activeBg : undefined}
        _hover={{
          textDecoration: 'none',
          bg: active ? activeBg : hoverBg,
        }}
      >
        {children}
      </Box>
    </RouterLink>
  );
};

const Header = () => {
  const { user, logout } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { colorMode, toggleColorMode } = useColorMode();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };
  
  // Check if a path is active based on the current location
  const isActivePath = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <Box 
      bg={useColorModeValue('white', 'gray.900')} 
      px={4} 
      boxShadow="sm"
      position="sticky"
      top={0}
      zIndex={10}
    >
      <Container maxW="1200px">
        <Flex h={16} alignItems="center" justifyContent="space-between">
          <IconButton
            size="md"
            icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
            aria-label="Open Menu"
            display={{ md: 'none' }}
            onClick={isOpen ? onClose : onOpen}
          />
          <HStack spacing={8} alignItems="center">
            <Heading as={RouterLink} to="/" size="md" fontWeight="bold" color="blue.500">
              CandidateV
            </Heading>
            {user && (
              <HStack
                as="nav"
                spacing={1}
                display={{ base: 'none', md: 'flex' }}>
                <NavLink to="/" active={isActivePath('/')}>Home</NavLink>
                <NavLink to="/dashboard" active={isActivePath('/dashboard')}>Dashboard</NavLink>
                <NavLink to="/cv" active={isActivePath('/cv')}>CV Builder</NavLink>
                <NavLink to="/api-test" active={isActivePath('/api-test')}>API Status</NavLink>
              </HStack>
            )}
          </HStack>
          <Flex alignItems="center">
            <Button 
              onClick={toggleColorMode} 
              mr={4} 
              size="sm"
              aria-label={colorMode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
            </Button>
            
            {user ? (
              <UserMenu />
            ) : (
              <HStack spacing={2}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/login')}
                >
                  Sign In
                </Button>
                <Button
                  colorScheme="blue"
                  size="sm"
                  onClick={() => navigate('/register')}
                >
                  Sign Up
                </Button>
              </HStack>
            )}
          </Flex>
        </Flex>
      </Container>

      {/* Mobile menu */}
      {isOpen ? (
        <Box pb={4} display={{ md: 'none' }}>
          <Stack as="nav" spacing={2}>
            <NavLink to="/">Home</NavLink>
            {user && (
              <>
                <NavLink to="/dashboard">Dashboard</NavLink>
                <NavLink to="/cv">CV Builder</NavLink>
                <NavLink to="/profile">Profile</NavLink>
                <NavLink to="/settings">Settings</NavLink>
                <Box 
                  as="button" 
                  onClick={handleLogout}
                  px={4}
                  py={2}
                  rounded="md"
                  _hover={{
                    textDecoration: 'none',
                    bg: useColorModeValue('gray.200', 'gray.700'),
                  }}
                >
                  Logout
                </Box>
              </>
            )}
            {!user && (
              <>
                <NavLink to="/login">Sign In</NavLink>
                <NavLink to="/register">Sign Up</NavLink>
              </>
            )}
          </Stack>
        </Box>
      ) : null}
    </Box>
  );
};

export default Header; 