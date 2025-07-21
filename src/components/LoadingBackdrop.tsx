import React from 'react'
import { Backdrop, CircularProgress } from '@mui/material'

interface LoadingBackdropProps {
  isOpen: boolean
}

const LoadingBackdrop: React.FC<LoadingBackdropProps> = ({ isOpen }) => {
  return (
    <Backdrop
      sx={{
        color: '#fff',
        zIndex: theme => theme.zIndex.modal + 100,
        flexDirection: 'column',
        display: 'flex'
      }}
      open={isOpen}
    >
      <CircularProgress color='inherit' />
    </Backdrop>
  )
}

export default LoadingBackdrop
