#!/usr/bin/env node

import * as commander from 'commander';
import * as chalk from 'chalk';
import { Connection, clusterApiUrl } from '@solana/web3.js';

import { createWallet, handleAirdrop } from './commands';
import { selectWallet } from './helpers';



export const CONNECTION = new Connection(clusterApiUrl("devnet"));

const program = new commander.Command();

program
    .version('1.0.0')
    .description('Solana Wallet Management and Blockchain Statistics')

    // Greet the user and check for existing wallets in the wallets.json when called with no commands
    .action(() => {
        console.log(chalk.bold.green('Welcome to Solana Wallet Manager!'));

        selectWallet()


    });

program
    .command('new')
    .description('Create or manage Solana wallets.')
    .option('-c, --create <wallet_name>', 'Generate a new public-private key pair')
    .action((cmd) => {
        if (cmd.create) {
            createWallet(cmd.create);
        } else {
            console.error('Invalid command. Use --help for usage information.');
        }
    });



program
    .command('airdrop [amountInSOL]')
    .description('Request an airdrop to a managed wallet.')
    .action(async (amount = 1) => {

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

        let selectedWalletObj = await selectWallet();
        await handleAirdrop(selectedWalletObj, parsedAmount);
    });


/*
program
    .command('balance')
    .description('Check wallet funds.')
    .action(() => checkBalance());


program
    .command('transfer <publicKey> <amount>')
    .description('Send SOL to a specified wallet.')
    .action((publicKey, amount) => transfer(publicKey, amount));

program
    .command('statistics')
    .description('Retrieve statistics on the Solana Devnet.')
    .action(() => getStatistics());

*/
program.parse(process.argv);