import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Button,
  Avatar,
  Flex,
  Text,
  Box,
  Icon,
  useColorModeValue,
  HStack,
} from '@chakra-ui/react';
import { 
  FaUser, 
  FaCog, 
  FaFileAlt, 
  FaSignOutAlt, 
  FaChevronDown, 
  FaUserEdit, 
  FaBell, 
  FaUserCog
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

const UserMenu = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // Handle menu item clicks
  const handleMenuClick = (path) => {
    navigate(path);
  };
  
  // Handle logout
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };
  
  // Colors
  const menuBg = useColorModeValue('white', 'gray.800');
  const menuHoverBg = useColorModeValue('gray.100', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  return (
    <Menu placement="bottom-end">
      <MenuButton
        as={Button}
        variant="ghost"
        rounded="full"
        paddingX={2}
        paddingY={1}
        display="flex"
        alignItems="center"
        _hover={{ bg: menuHoverBg }}
      >
        <Flex alignItems="center">
          <Avatar 
            size="sm" 
            name={user?.name || 'User'} 
            src={user?.profileImage} 
            mr={2} 
          />
          <Box display={{ base: 'none', md: 'block' }}>
            <Text fontWeight="medium" fontSize="sm">{user?.name || 'Guest'}</Text>
          </Box>
          <Icon as={FaChevronDown} ml={2} fontSize="xs" />
        </Flex>
      </MenuButton>
      
      <MenuList 
        bg={menuBg} 
        borderColor={borderColor} 
        minWidth="200px"
        shadow="lg"
      >
        <Box px={3} py={2} borderBottomWidth="1px" borderColor={borderColor}>
          <Text fontWeight="medium">{user?.name}</Text>
          <Text fontSize="sm" color="gray.500" mt={1} mb={1} noOfLines={1}>{user?.email}</Text>
        </Box>
        
        <MenuItem 
          icon={<Icon as={FaUser} />} 
          onClick={() => handleMenuClick('/profile')}
          _hover={{ bg: menuHoverBg }}
        >
          My Profile
        </MenuItem>
        
        <MenuItem 
          icon={<Icon as={FaFileAlt} />} 
          onClick={() => handleMenuClick('/cv')}
          _hover={{ bg: menuHoverBg }}
        >
          My CVs
        </MenuItem>
        
        <MenuDivider />
        
        <MenuItem 
          icon={<Icon as={FaUserCog} />} 
          onClick={() => handleMenuClick('/profile/preferences')}
          _hover={{ bg: menuHoverBg }}
        >
          Preferences
        </MenuItem>
        
        <MenuItem 
          icon={<Icon as={FaCog} />} 
          onClick={() => handleMenuClick('/settings')}
          _hover={{ bg: menuHoverBg }}
        >
          Account Settings
        </MenuItem>
        
        <MenuDivider />
        
        <MenuItem 
          icon={<Icon as={FaSignOutAlt} />}
          onClick={handleLogout}
          _hover={{ bg: menuHoverBg }}
        >
          Sign Out
        </MenuItem>
      </MenuList>
    </Menu>
  );
};

export default UserMenu; 