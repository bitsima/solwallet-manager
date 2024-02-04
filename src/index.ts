#!/usr/bin/env node

import * as commander from 'commander';
import * as chalk from 'chalk';
import { Connection, clusterApiUrl } from "@solana/web3.js";

import { readWallets, createWallet, selectWallet } from './utils';



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
    .option('-e, --existing <wallet_name:public_key>', 'Accept an existing public key and give the wallet a name')
    .action((cmd) => {
        if (cmd.create) {
            createWallet(cmd.create);
        } else if (cmd.existing) {
            const [walletName, publicKey] = cmd.existing.split(':');
            createWallet(walletName, publicKey);

        } else {
            console.error('Invalid command. Use --help for usage information.');
        }
    });

/*

program
    .command('airdrop <amount>')
    .description('Request an airdrop to a managed wallet.')
    .action((amount) => airdrop(amount));

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