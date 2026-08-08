import { createTheme } from '@mui/material/styles'
import { cq, font } from './theme'

const muiTheme = createTheme({
  typography: {
    fontFamily: font.body,
    h1: { fontFamily: font.display },
    h2: { fontFamily: font.display },
    h3: { fontFamily: font.display },
    button: { fontFamily: font.body, fontWeight: 700 },
  },
  palette: {
    mode: 'dark',
    primary: { main: cq.coral },
    secondary: { main: cq.butter },
    background: { default: cq.deep, paper: cq.panel },
  },
  shape: { borderRadius: 14 },
})

export default muiTheme
