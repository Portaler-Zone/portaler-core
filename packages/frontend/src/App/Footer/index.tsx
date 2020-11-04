import React from 'react'
import { discord, github, twitch } from '../../images'

import styles from './styles.module.scss'

const Footer = () => (
  <footer className={styles.footer}>
    <div className={styles.twitch}>
      <a
        href="https://www.twitch.tv/hypnocode"
        className={styles.link}
        target="_blank"
        rel="noopener noreferrer"
      >
        <img src={twitch} className={styles.twitchLogo} alt="twitch" /> Follow
        Portaler dev on Twitch
      </a>
    </div>
    <div className={styles.footerRight}>
      <div className={styles.github}>
        <a
          href="https://github.com/Portaler-Zone/portaler-core"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img src={github} className={styles.githubLogo} alt="github" />
          GitHub
        </a>
      </div>
      <div className={styles.discord}>
        <a
          href="https://discord.gg/frwgWCm"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img src={discord} className={styles.discordLogo} alt="discord" />
        </a>
      </div>
    </div>
  </footer>
)

export default Footer
