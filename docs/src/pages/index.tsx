import React from 'react';
import clsx from 'clsx';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './index.module.css';
import useBaseUrl from '@docusaurus/useBaseUrl';

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  return (
    <>
      <header className={styles.header}>
        <div className="container">
          <h1 className={styles.title}>
            <img src={useBaseUrl('/img/Egg-cracked.svg')} width={50} className={styles.logo}></img>
            <div>{siteConfig.title}</div>
          </h1>
          <p className={styles.subtitle}>Ultra explicit · inline · state surgery</p>
          <Link className={styles.start} to="/docs/getting_started">
            <div className={styles.frameworks}>
              <img src={useBaseUrl('./img/React.svg')} height={20} />
              <img src={useBaseUrl('./img/Angular.svg')} height={20} />
              <img src={useBaseUrl('./img/Svelte.svg')} height={20} />
            </div>
            <div className={styles.starttext}>start&nbsp;&gt;</div>
          </Link>
        </div>
      </header>
      <main style={{ display: 'grid', placeContent: 'center', backgroundColor: '#262620' }}>
        <img src={useBaseUrl('/img/recording-with-comments.gif')} width={600} />
      </main>
    </>
  );
}
