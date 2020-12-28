import React from 'react'
import { Link } from 'gatsby'

import Layout from '../components/Layout'
import SEO from '../components/seo'

import MainLogo from '../components/MainLogo'

import WhatIs from '../components/WhatIs'

import styles from './styles.module.scss'

const desc = `
Portaler is a Roads of Avalon mapping tool intended for groups, guilds, and alliances to share ever changing mapping information.
`

const IndexPage = () => (
  <Layout>
    <SEO description={desc} />
    <main className={styles.indexMain}>
      <MainLogo />
      <WhatIs />
    </main>
  </Layout>
)

export default IndexPage