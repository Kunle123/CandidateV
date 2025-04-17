import { Outlet } from 'react-router-dom'
import { Box } from '@chakra-ui/react'
import Header from '../navigation/Header'
import Footer from '../navigation/Footer'

const MainLayout = () => {
  return (
    <Box display="flex" flexDirection="column" minHeight="100vh">
      <Header />
      <Box as="main" flex="1" py={8} px={4}>
        <Outlet />
      </Box>
      <Footer />
    </Box>
  )
}

export default MainLayout 