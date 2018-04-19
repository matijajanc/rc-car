import React, { Component } from 'react';
import styles from './assets/styles/styles';

export default ContainerComponent = Component => ({children, ...props}) =>
  <Component style={styles.container} {...props}>
    {children}
  </Component>
