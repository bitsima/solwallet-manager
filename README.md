# solwallet-manager
solwallet-manager is a command-line tool developed for Linux systems and tested exclusively on this platform. It is designed to work with Node.js 18 and requires compilation with TypeScript (tsc).

## Installation
1. Ensure you have Node.js 18 installed.
2. Clone this repository.
3. Run npm install to install dependencies.
4. Compile the TypeScript code using tsc.
5. Execute the app with `node out/index.js <commands>`.

## Usage
```
node out/index.js [options] [command]

Options:
  -V, --version                            Output the version number
  -h, --help                               Display help for command

Commands:
  new [options]                            Create or manage Solana wallets.
  airdrop [amountInSOL]                    Request an airdrop to a managed wallet.
  balance                                  Check and update wallet funds.
  transfer <otherPublicKey> <amountInSol>  Send SOL to a specified wallet.

```
## Commands

### 1. 'new'
Create a new pair of keys and save it in the wallets.json (which is generated in the root directory, if it doesn't exist). 
Note that the user needs to provide a name for the wallet to be created. The name is used to easily differentiate wallets from each other and is stored in the wallets.json.
```
Usage: node out/index.js new [options]

Options:
  -c, --create <wallet_name>  Generate a new public-private key pair
  -h, --help                  display help for command
```

### 2. 'airdrop'
Request an airdrop to the selected wallet. The user needs to provide the amount to be requested in SOL. Max SOL to request at a time is 5.
The airdrop will be done on the wallet selected from the wallets.json. For further info on how selecting a wallet from the wallets.json works, see [here](#how-selectWallet-and-wallets.json-work).
```
Usage: node out/index.js airdrop [options] [amountInSOL]

Options:
  -h, --help  display help for command
```

### 3. 'balance'
Checks and updates the wallet funds. After invoking the command, the user is prompted to select the wallet to do the balance check on.
```
Usage: node out/index.js balance [options]

Options:
  -h, --help  display help for command
```

### 4. 'transfer'
Sends SOL to a specified wallet. The user needs to provide the public key of the wallet the transfer will be directed to, along with the amount to be transferred in SOL. **Make sure the sender/feepayer account has enough funds for the fee!**
```
Usage: node out/index.js transfer [options] <otherPublicKey> <amountInSol>

Options:
  -h, --help  display help for command
```

## How selectWallet and wallets.json Work
**selectWallet** prompts the user to select one of the wallets saved in the wallets.json, like the following:
```
Detected existing wallets:
[1] - Wallet Name: foo, Public Key: <public key in Base58>
[2] - Wallet Name: bar, Public Key: <public key in Base58>
Please enter the order number of the wallet you want to interact with: 
```
Selecting a wallet to use for an action is as simple as providing the order number of the wallet. 
If you want to manually enter a key pair to the wallets.json, ensure that the **secretKey** is a valid sequence of bytes and that it matches the expected format for **UInt8Array**s.
Example wallets.json format provided below:
```json
{
    "data": [
        {
            "walletName": "foo",
            "balance": 0,
            "publicKey": "7Y9zzMvwQt8kiZBww21PdZ7cVMkusM5DFUNnXWA7QCKF",
            "secretKey": [35,233,161,191,205,59,237,91,229,223,109,7,58,66,17,29,67,126,131,48,195,150,225,97,56,1,162,46,162,84,212,207,97,33,77,129,124,137,96,161,243,77,78,80,134,77,83,186,244,180,127,177,232,117,240,31,37,173,3,227,190,222,90,134]
        }
    ]
}
```

## TODO

+ add command for displaying some statistics on the solana network
+ add command to track a selected transaction on the solana network
+ generate keypair from seed option
+ generate keypair by mnemonic phrase option
+ delete wallet command
+ logger