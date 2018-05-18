import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  TouchableOpacity,
  StyleSheet,
  View,
  ViewPropTypes,
} from 'react-native';
import T from 'components/Typography';
import LinearGradient from 'react-native-linear-gradient';
import { GradientText } from 'components/GradientText';
import { gradients } from 'styles';
export default class Button extends Component {
  static propTypes = {
    type: PropTypes.oneOf(['base', 'primary', 'secondary', 'text']),
    disabled: PropTypes.bool,
    style: ViewPropTypes.style,
    onPress: PropTypes.func.isRequired,
    children: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.node,
      PropTypes.arrayOf(PropTypes.node),
    ]).isRequired,
  };

  static defaultProps = {
    style: {},
    type: 'base',
  };

  render() {
    const styles =
      stylesForType[this.props.disabled ? 'disabled' : this.props.type];
    const shouldUpperCase = ['primary', 'text', 'secondary'].includes(
      this.props.type
    );

    let buttonContent;

    // Text Buttons
    if (typeof this.props.children === 'string' && this.props.type === 'text') {
      const buttonText = this.props.children;
      buttonContent = (
        <T.ButtonText style={styles.buttonText}>
          {shouldUpperCase ? buttonText.toUpperCase() : buttonText}
        </T.ButtonText>
      );
    }

    // Base Buttons
    else if (
      typeof this.props.children === 'string' &&
      this.props.type === 'base'
    ) {
      const buttonText = this.props.children;
      buttonContent = (
        <GradientText style={styles.buttonText} gradient={gradients.pink}>
          {buttonText.toUpperCase()}
        </GradientText>
      );
    }

    // Primary Buttons
    else if (this.props.type === 'primary') {
      const buttonText = this.props.children;
      buttonContent = (
        <LinearGradient
          start={gradients.horizontal.start}
          end={gradients.horizontal.end}
          colors={gradients.pink}
          style={[styles.buttonContainer, this.props.style]}
        >
          <TouchableOpacity
            disabled={this.props.disabled}
            style={[this.props.style]}
            onPress={this.props.onPress}
          >
            <T.ButtonText style={styles.buttonText}>
              {shouldUpperCase ? buttonText.toUpperCase() : buttonText}
            </T.ButtonText>
          </TouchableOpacity>
        </LinearGradient>
      );
      return buttonContent;
    }

    // Default Buttons
    else {
      buttonContent = this.props.children;
    }

    return (
      <TouchableOpacity
        disabled={this.props.disabled}
        style={[styles.buttonContainer, this.props.style]}
        onPress={this.props.onPress}
      >
        {buttonContent}
      </TouchableOpacity>
    );
  }
}

const stylesForType = {
  text: StyleSheet.create({
    buttonContainer: {
      backgroundColor: 'transparent',
      paddingVertical: 0,
      overflow: 'hidden',
    },
    buttonText: {
      backgroundColor: 'transparent',
      textAlign: 'center',
      color: '#000',
    },
  }),
  primary: StyleSheet.create({
    buttonContainer: {
      // backgroundColor: '#18AC63',
      borderRadius: 100,
      paddingVertical: 20,
      shadowColor: '#000',
      shadowOpacity: 0.5,
      shadowRadius: 4,
      shadowOffset: {
        width: 0,
        height: 1,
      },
    },
    buttonText: {
      backgroundColor: 'transparent',
      textAlign: 'center',
      color: '#FFF',
    },
  }),
  secondary: StyleSheet.create({
    buttonContainer: {
      backgroundColor: '#FFF',
      borderRadius: 100,
      paddingVertical: 20,
      shadowColor: '#000',
      shadowOpacity: 0.5,
      shadowRadius: 4,
      shadowOffset: {
        width: 0,
        height: 1,
      },
    },
    buttonText: {
      backgroundColor: 'transparent',
      textAlign: 'center',
      color: '#000',
    },
  }),
  disabled: StyleSheet.create({
    buttonContainer: {
      backgroundColor: 'transparent',
      borderRadius: 100,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: '#EEE',
      paddingVertical: 20,
    },
    buttonText: {
      backgroundColor: 'transparent',
      textAlign: 'center',
      color: '#EEE',
    },
  }),
  base: StyleSheet.create({
    buttonContainer: {
      backgroundColor: '#fff',
      borderRadius: 100,
      paddingVertical: 20,
      shadowColor: '#000',
      shadowOpacity: 0.5,
      shadowRadius: 4,
      shadowOffset: {
        width: 0,
        height: 1,
      },
    },
    buttonText: {
      textAlign: 'center',
      color: '#223252',
      fontWeight: '700',
    },
  }),
  unstyled: {},
};
