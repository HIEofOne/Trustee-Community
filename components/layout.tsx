import React, { Component } from 'react';
import Header from './header';

export default class Layout extends Component {
  render () {
      //@ts-ignore
    const { children } = this.props
    return (
      <div className='layout'>
        <Header />
        {children}
      </div>
    );
  }
}