import React from 'react';
import clsx from 'clsx';
import styles from './HomepageFeatures.module.css';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Link from '@docusaurus/Link';


export default function HomepageFeatures(): JSX.Element {
  return (
    <>
    <Link to="/docs/getting_started" style={{display: 'grid', placeContent: 'center', backgroundColor: '#262620'}}>
      <img src={useBaseUrl('/img/recording-with-comments.gif')} width={00} />
    </Link>
    </>
  );
}
