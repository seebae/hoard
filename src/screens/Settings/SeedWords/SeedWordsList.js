import { connect } from 'react-redux';
import WordList from 'screens/Wallet/Mnemonic/Generate/WordList';

function mapStateToProps (state, ownProps) {
  const fullList = state.wallet.mnemonicPhrase.split(' ');
  const list = fullList.slice(ownProps.start, ownProps.end);
  return {
    list,
    totalLength: fullList.length,
    offset: ownProps.start + 1
  };
}

export default connect(mapStateToProps)(WordList);
