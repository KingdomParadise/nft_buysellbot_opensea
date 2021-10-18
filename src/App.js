import './App.css';
import React from 'react';
import * as Web3API from 'web3'
import { OpenSeaPort, Network } from 'opensea-js'
import { OrderSide } from 'opensea-js/lib/types.js'
import PrivateKeyProvider from "truffle-privatekey-provider"

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      allAccounts: [],
      firstAccount: "",
      firstPrivKey: "",
      contractAddress : "",
      tokenId : "",
      ownerAddress : "",
      own_privKey : "",
      buyerAddress : "",
      buyer_privKey : "",
      rpcUrl : "https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
      sellingAmount: "",
      inputAccounts : ""

    }
    // This binding is necessary to make `this` work in the callback
    this.handleClick = this.handleClick.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleInputClick = this.handleInputClick.bind(this);
    this.setFirstAccount = this.setFirstAccount.bind(this);
    this.downloadJSON = this.downloadJSON.bind(this);
    this.handleTransferClick = this.handleTransferClick.bind(this);

  }

  componentDidMount() {
    this.setState({
      sellingAmount : "0.0001"
    });
  }


  handleClick() {
    const owner_provider = new PrivateKeyProvider(this.state.own_privKey, this.state.rpcUrl)
    const owner_seaport = new OpenSeaPort(owner_provider, {
      networkName: Network.Rinkeby,
    });

    const buyer_provider = new PrivateKeyProvider(this.state.buyer_privKey, this.state.rpcUrl)
    const buyer_seaport = new OpenSeaPort(buyer_provider, {
      networkName: Network.Rinkeby,
    });

    /* selling item*/

    const newListing = owner_seaport.createSellOrder({
      asset: {
        tokenId: this.state.tokenId,
        tokenAddress: this.state.contractAddress,
      },
      accountAddress: this.state.ownerAddress,
      startAmount: this.state.sellingAmount,
      expirationTime: 0
    });


    /* buying item */
    setTimeout(function(){
      if (newListing) {

        buyer_seaport.api.getOrder({
          asset_contract_address: this.state.contractAddress,
          token_id: this.state.tokenId,
          side: OrderSide.Sell
        }).then(function(order) {
          // Important to check if the order is still available as it can have already been fulfilled by
          // another user or cancelled by the creator
          if (order) {
            // This will bring the wallet confirmation popup for the user to confirm the purchase
            const transactions = buyer_seaport.fulfillOrder({ order: order, accountAddress: this.state.buyerAddress });
          } else {
            // Handle when the order does not exist anymore
          }
        }.bind(this));
      }
      else {
        console.log(newListing);
      }
    }.bind(this), 3000);//wait 3 seconds
  }

  handleChange(e) {
    this.setState({ inputAccounts: e.target.value });
  }


  handleInputClick(){
    let all_accounts = []
    for (let i = 0; i < this.state.inputAccounts; i++) {
      const web3 = new Web3API(new Web3API.providers.HttpProvider(this.state.rpcUrl));
      let account = web3.eth.accounts.create();
      all_accounts.push(account);
    }
    this.setState({ allAccounts: [...this.state.allAccounts, ...all_accounts] }, ()=>{
      this.setFirstAccount();
    });
    // this.downloadJSON(all_accounts);
  }

  setFirstAccount(){
    this.setState({firstAccount: this.state.allAccounts[0].address, firstPrivKey: this.state.allAccounts[0].privateKey.substr(2)});
  }

  downloadJSON(all_accounts){
    const fileData = JSON.stringify(all_accounts);
    const blob = new Blob([fileData], {type: "text/plain"});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'filename.json';
    link.href = url;
    link.click();
  }

  // transfer ether to each account.
  async handleTransferClick(){
    let balance_;
    const walletAddress = this.state.firstAccount;
    const web3 = new Web3API(new PrivateKeyProvider(this.state.firstPrivKey, this.state.rpcUrl));
    await web3.eth.getBalance(walletAddress, async(err, balance) => {
      balance_ = await web3.utils.fromWei(balance, "ether");
    });
    let averageBal = parseFloat(balance_) / parseInt(this.state.inputAccounts);
    console.log(this.state.allAccounts[1].address)
    this.state.allAccounts.forEach(account => {
      // web3.eth.sendTransaction({from:walletAddress, to:account.address, value:web3.utils.toWei(averageBal.toString(), "ether")});
      web3.eth.sendTransaction({from:walletAddress, to:account.address, value:web3.utils.toWei("0.00001", "ether")});
    });
    console.log("transfer ether success!");

    // balance = web3.toDecimal(balance);
  }

  render() {
    return (
        <div>
          <button onClick={this.handleClick}>
            START
          </button>
          <div>
            <input type="text" onChange={ this.handleChange } />
            <input
                type="button"
                value="create"
                placeholder="input the accounts number"
                onClick={this.handleInputClick}
            />
          </div>
          <div>
            <input
                className="form-control"
                type="text"
                value={this.state.firstAccount}
            />
            <input
                type="button"
                value="transfer"
                placeholder="input the accounts number"
                onClick={this.handleTransferClick}
            />
          </div>
        </div>

    );
  }
}


export default App;
