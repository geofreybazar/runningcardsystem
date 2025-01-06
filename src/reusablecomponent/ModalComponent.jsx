import Backdrop from '@mui/material/Backdrop';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import Fade from '@mui/material/Fade';


function ModalComponent({ open, handleClose, style, children }) {
  return (
    <div>
        <Modal
        aria-labelledby="transition-modal-title"
        aria-describedby="transition-modal-description"
        open={open}
        onClose={handleClose}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            timeout: 500,
          },
        }}
        >
        <Fade in={open}>
          <Box sx={style}>
            {children}
          </Box>
        </Fade>
      </Modal>
    </div>
  )
}

export default ModalComponent