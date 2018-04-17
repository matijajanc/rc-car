import React, { Component } from 'react';
import styles from './styles';

export default ContainerComponent = Component => ({children, ...props}) =>
    <Component style={styles.container} {...props}>
      {children}
    </Component>
