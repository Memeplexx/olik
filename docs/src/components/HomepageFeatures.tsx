import React from 'react';
import clsx from 'clsx';
import styles from './HomepageFeatures.module.css';

type FeatureItem = {
  title: string;
  image: string;
  description: JSX.Element;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Compact & Lightweight',
    image: '/img/undraw_docusaurus_mountain.svg',
    description: (
      <>
        Olik's 5kb API allows you to traverse, read, and update arbitrarily deep state trees without leaving your component code.
      </>
    ),
  },
  {
    title: 'Typesafe & Explicit',
    image: '/img/undraw_docusaurus_tree.svg',
    description: (
      <>
        Olik works like a light-weight query-builder which it uses to <b>describe your state updates for you</b> with perfect accuracy.
      </>
    ),
  },
  {
    title: 'Feature-rich',
    image: '/img/undraw_docusaurus_react.svg',
    description: (
      <>
        Transactions, nested stores, async support, caching, and optimistic updates are all available.
      </>
    ),
  },
];

function Feature({title, image, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <img className={styles.featureSvg} alt={title} src={image} />
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
