import React from 'react'

import { Snackbar } from '@material-ui/core'
import Alert from '@material-ui/lab/Alert'

import useBadCredentials from '../hooks/useBadCredentials'

const Notifications = () => {
  const [badPass, reset] = useBadCredentials()

  return (
    <Snackbar
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      open={badPass}
      onClose={reset}
      autoHideDuration={4200}
    >
      <Alert severity="error">Invalid Login. Please log in again.</Alert>
    </Snackbar>
  )
}

export default Notifications
