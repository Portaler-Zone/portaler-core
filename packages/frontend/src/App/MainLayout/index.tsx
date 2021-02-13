import clsx from 'clsx'
import React, { FC } from 'react'
import { useSelector } from 'react-redux'
import { animated, useSpring } from 'react-spring'

import useGetWidth from '../../common/hooks/useGetWidth'
import mistWalker from '../../common/utils/mistWalker'
import { RootState } from '../../reducers'
import styles from './styles.module.scss'

const MainLayout: FC = ({ children }) => {
  const sideBar = useSelector((state: RootState) => state.sideBar)
  const width = useGetWidth()

  const sideBarWidth = sideBar ? 350 : 68

  const props = useSpring({
    gridTemplateColumns: `${sideBarWidth}px ${width - sideBarWidth}px`,
  })

  return (
    <animated.main
      style={props}
      className={clsx(styles.layout, {
        [styles.hideSidebar]: !mistWalker.showSidebar,
      })}
    >
      {children}
    </animated.main>
  )
}
export default MainLayout
