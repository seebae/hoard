import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { View } from 'react-native';
import SVG, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

export default class Input extends Component {
  static propTypes = {
    hasValue: PropTypes.bool,
  };

  render() {
    return (
      <View style={{marginHorizontal: 5, marginVertical: 10}}>
      <SVG
        height="22"
        width="22"
      >
        <Defs>
          <LinearGradient id="grad" y1="0" x1="0" y2="22" x2="0">
            <Stop offset="0" stopColor="rgb(153,47,238)" />
            <Stop offset="1" stopColor="rgb(230,34,131)" />
          </LinearGradient>
        </Defs>
        <Circle
          cx="11"
          cy="11"
          r="10"
          stroke="url(#grad)"
          strokeWidth="1"
          fill={this.props.hasValue ? "url(#grad)" : "transparent"}
        />
      </SVG>
      </View>
    );
  }
}
