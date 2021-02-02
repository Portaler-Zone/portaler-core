import cn from 'clsx'
import React, { MouseEvent, useCallback, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { animated, useSpring } from 'react-spring'

import {
  Button,
  IconButton,
  makeStyles,
  Tab,
  Tabs,
  Theme,
} from '@material-ui/core'
import AddLocationIcon from '@material-ui/icons/AddLocation'
import HideIcon from '@material-ui/icons/FirstPage'
import InfoIcon from '@material-ui/icons/Info'
import SettingsIcon from '@material-ui/icons/Settings'

import useToken from '../common/hooks/useToken'
import { portalerSmall } from '../common/images'
import mistWalker from '../common/utils/mistWalker'
import LoginButton from '../LoginButton'
import MapInfo from '../MapInfo'
import PortalForm from '../PortalForm'
import { RootState } from '../reducers'
import { ConfigActionTypes } from '../reducers/configReducer'
import { SidebarActionTypes } from '../reducers/sideBarReducer'
import UserSettings from '../UserSettings'
import styles from './styles.module.scss'

const useStyles = makeStyles((theme: Theme) => ({
  tabs: {
    borderRight: `1px solid ${theme.palette.divider}`,
  },
  tab: {
    minWidth: 0,
  },
  selected: {
    backgroundColor: `rgba(255, 255, 255, 0.05)`,
  },
}))

const SideBar = () => {
  const token = useToken()
  const dispatch = useDispatch()

  const [tabValue, setTabValue] = useState(!mistWalker.isWalker ? 0 : 1)

  const handleChange = useCallback((_, newValue: number) => {
    setTabValue(newValue)
  }, [])

  const handleSlide = useCallback(() => {
    dispatch({ type: SidebarActionTypes.TOGGLE })
  }, [dispatch])

  const classes = useStyles()

  const sideBar = useSelector((state: RootState) => state.sideBar)

  const props = useSpring({
    opacity: sideBar ? 1 : 0,
    width: sideBar ? 'inherit' : 0,
    paddingLeft: sideBar ? 'inherit' : 0,
    paddingRight: sideBar ? 'inherit' : 0,
    marginLeft: sideBar ? 'inherit' : 0,
    marginRight: sideBar ? 'inherit' : 0,
  })

  const headerProps = useSpring({
    paddingLeft: sideBar ? 'inherit' : 0,
    paddingRight: sideBar ? 'inherit' : 0,
  })

  return (
    <aside className={styles.searchSide}>
      <animated.div style={headerProps} className={styles.header}>
        <animated.div style={props}>
          <img alt="logo" src={portalerSmall} className={styles.logo} />
        </animated.div>
        <div className={cn({ [styles.expand]: !sideBar })}>
          <IconButton onClick={handleSlide} aria-label="hide">
            <HideIcon fontSize="large" className={styles.hideIcon} />
          </IconButton>
        </div>
      </animated.div>
      <div className={styles.content}>
        <animated.div style={props} className={styles.mainContent}>
          {tabValue === 0 && <PortalForm />}
          {tabValue === 1 && <MapInfo />}
          {tabValue === 2 && <UserSettings />}
        </animated.div>
        <div className={styles.nav}>
          <Tabs
            orientation="vertical"
            value={tabValue}
            textColor="secondary"
            indicatorColor="secondary"
            onChange={handleChange}
            aria-label="panel options"
            className={classes.tabs}
          >
            {!mistWalker.isWalker && (
              <Tab
                className={cn(classes.tab, {
                  [classes.selected]: tabValue === 0,
                })}
                icon={<AddLocationIcon />}
                aria-label="Add location"
                title="Add location"
              />
            )}
            <Tab
              className={cn(classes.tab, {
                [classes.selected]: tabValue === 1,
              })}
              icon={<InfoIcon />}
              aria-label="Zone Info"
              title="Zone Info"
            />
            <Tab
              className={cn(classes.tab, {
                [classes.selected]: tabValue === 2,
              })}
              icon={<SettingsIcon />}
              aria-label="Settings"
              title="Settings"
            />
          </Tabs>
        </div>
      </div>
    </aside>
  )
}

export default SideBar
