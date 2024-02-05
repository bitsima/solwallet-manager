import * as fs from 'fs/promises';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import * as readline from 'readline';
import chalk = require('chalk');

import { Wallet } from "./models/classes";
import { WalletJson } from "./models/interfaces";









/**
 * Reads the wallets.json if it exists.
 * @returns wallets array -read from the wallets.json and deserialized into Wallet instances-
 */
export async function readWallets(): Promise<Wallet[]> {
    let parsedWalletData: Wallet[] = [];

    try {
        const walletData = await fs.readFile('./wallets.json', 'utf8');
        const jsonData: WalletJson[] = JSON.parse(walletData).data;

        // Deserializing the JSON data
        parsedWalletData = jsonData.map(walletJson => {
            return new Wallet(
                walletJson.walletName,
                walletJson.publicKey,
                Uint8Array.from(walletJson.secretKey),
                walletJson.balance
            );
        });

    } catch (error) {
        // Handle file not found or invalid JSON
        console.log(`Error reading or parsing wallets.json: ${error.message}\nA new wallets.json file will be created.`);
    }
    return parsedWalletData;
}

export async function writeWallets(walletObjArr: Wallet[]): Promise<void> {
    // Serializing the data back to JSON
    const jsonData = {
        'data': walletObjArr.map(wallet => ({
            walletName: wallet.walletName,
            balance: wallet.balance,
            publicKey: wallet.publicKey,
            secretKey: Array.from(wallet.secretKey)
        }))
    };

    // Update wallets.json with the new wallet info
    try {
        await fs.writeFile("./wallets.json", JSON.stringify(jsonData, null, 4), 'utf8');
        console.log('wallets.json file has been updated successfully.');
    } catch (error) {
        console.error(`Error writing to JSON file: ${error.message}`);
    }
}


export async function updateBalances(): Promise<void> {
    let wallets = await readWallets();

    wallets.forEach(walletObj => {
        const oldBalance = walletObj.balance;

        try {
            walletObj.checkBalance();
        } catch (error) {
            console.log(`Your balance on the wallet named '${walletObj.walletName}'\nhas been updated from '${oldBalance / LAMPORTS_PER_SOL}' SOL to '${walletObj.balance / LAMPORTS_PER_SOL}' SOL.`)

        }
    });

    await writeWallets(wallets);
}

export async function selectWallet(): Promise<Wallet> {

    let wallets = await readWallets();

    if (wallets.length > 0) {
        console.log(chalk.yellow('Detected existing wallets:'));

        // Iterate though the wallets in the wallets.json
        let index: number = 0;
        wallets.forEach(wallet => {
            console.log(`[${++index}] - Wallet Name: ${wallet.walletName}, Public Key: ${wallet.publicKey}`);
        });

        return new Promise((resolve, reject) => {
            // Let the user choose which wallet to use for this instance 
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout,
            });

            rl.question('Please enter the order number of the wallet you want to interact with: \n', (orderNumber) => {
                let selectedWallet = wallets[parseInt(orderNumber, 10) - 1];

                if (selectedWallet) {
                    console.log(`You selected: Wallet Name: ${selectedWallet.walletName}, Public Key: ${selectedWallet.publicKey}`);
                    // Close the readline interface
                    rl.close();
                    resolve(selectedWallet);
                } else {
                    console.log('Invalid order number. Please try again.');
                    // Close the readline interface
                    rl.close();
                    reject(new Error('Invalid order number'));
                }
            });
        });
    } else {
        console.log(chalk.gray('No existing wallets detected. If you want to create one or provide it yourself, check command "new".'));
    }
}

