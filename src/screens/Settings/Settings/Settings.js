import React from 'react';
import PropTypes from 'prop-types';
import { StyleSheet } from 'react-native';

import { Layout, Body } from 'components/Base';
import Link from 'components/Link';
import T from 'components/Typography';

export default function Settings({ selectedTradingPair }) {
  return (
    <Layout preload={false}>
      <Body scrollable style={styles.content}>
        <Link
          title="Display Currency"
          to="DisplayCurrency"
          arrowOverride={
            <T.Light style={{ color: 'white' }}>{selectedTradingPair}</T.Light>
          }
        />
        <Link
          title="Seed Words"
          to="SeedWords"
        />
      </Body>
    </Layout>
  );
}

Settings.propTypes = {
  selectedTradingPair: PropTypes.string.isRequired,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
});
