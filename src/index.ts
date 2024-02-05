#!/usr/bin/env node

import * as commander from 'commander';
import * as chalk from 'chalk';
import { Connection } from '@solana/web3.js';

import { createWallet, handleAirdrop, transferSOL } from './commands';
import { readWallets, selectWallet, updateBalance } from './helpers';


// Change this url to change the net the app works on
const CLUSTER_URL = "https://api.testnet.solana.com";


export const CONNECTION = new Connection(CLUSTER_URL, "confirmed");

export const WALLETS_MAP = readWallets();


const program = new commander.Command();

program
    .version('1.0.0')
    .description('Solana Wallet Management and Blockchain Statistics')

    // Greet the user and check for existing wallets in the wallets.json when called with no commands
    .action(() => {
        console.log(chalk.bold.green('Welcome to Solana Wallet Manager!'));
    });

program
    .command('new')
    .description('Create or manage Solana wallets.')
    .option('-c, --create <wallet_name>', 'Generate a new public-private key pair')
    .action((cmd) => {
        if (WALLETS_MAP.has(cmd.create)) {
            console.error('Duplicate wallet names are not allowed. Please provide another name for the new wallet.');
        }
        else if (cmd.create) {
            createWallet(cmd.create);
        } else {
            console.error('Invalid command. Use --help for usage information.');
        }
    });


program
    .command('airdrop [amountInSOL]')
    .description('Request an airdrop to a managed wallet.')
    .action(async (amount = 1) => {

        let selectedWalletObj = await selectWallet();
        if (selectedWalletObj == null) {
            return;
        }

        // Parse the amount to ensure it's a valid number
        let parsedAmount = parseFloat(amount);

        // Check if the parsed amount is NaN or exceeds the maximum allowed
        if (isNaN(parsedAmount) || parsedAmount > 5) {
            console.error('Invalid amount. Setting amount to the maximum allowed (5 SOLs).');
            parsedAmount = 5;  // Set amount to the maximum allowed
        }
        else {
            console.log(`Chosen amount to airdrop is ${parsedAmount} SOL.`)
        }

        await handleAirdrop(selectedWalletObj, parsedAmount);
    });

program
    .command('balance')
    .description('Check and update wallet funds.')
    .action(async () => {
        let selectedWalletObj = await selectWallet();
        if (selectedWalletObj != null) {
            await updateBalance(selectedWalletObj);
        }
    });


program
    .command('transfer <otherPublicKey> <amountInSol>')
    .description('Send SOL to a specified wallet.')
    .action(async (otherPublicKey, amount) => {
        let selectedWalletObj = await selectWallet();
        if (selectedWalletObj != null) {
            await transferSOL(selectedWalletObj, otherPublicKey, amount);
        }
    });

/*
program
    .command('statistics')
    .description('Retrieve statistics on the Solana Devnet.')
    .action(() => getStatistics());

*/
program.parse(process.argv);