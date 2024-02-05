import * as fs from 'fs';
import * as fsp from 'fs/promises';
import * as readline from 'readline';
import * as chalk from 'chalk';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

import { Wallet } from "./models/classes";
import { WalletJson } from "./models/interfaces";
import { WALLETS_MAP } from './index';


/**
 * Reads the wallets.json if it exists.
 * @returns wallets map -read from the wallets.json and deserialized into Wallet instances-
 */
export function readWallets(): Map<string, Wallet> {
    let walletMap: Map<string, Wallet> = null;

    try {

        // Synchronously check if the file exists
        if (!fs.existsSync('./wallets.json')) {
            // If the file doesn't exist, create an empty one
            fs.writeFileSync('./wallets.json', '{"data": []}', 'utf-8');
            console.log("wallets.json couldn't be found. A new one was created.")
        }

        const walletData = fs.readFileSync('./wallets.json', 'utf8');
        const jsonData: WalletJson[] = JSON.parse(walletData).data;

        // Deserializing the JSON data and creating a Map
        walletMap = new Map(jsonData.map(walletJson => [
            walletJson.walletName,
            new Wallet(
                walletJson.walletName,
                walletJson.publicKey,
                Uint8Array.from(walletJson.secretKey),
                walletJson.balance
            )
        ]));

    } catch (error) {
        // Handle file not found or invalid JSON
        console.log(`Error reading or parsing wallets.json: ${error.message}`);
    }
    return walletMap;
}

export async function writeWallets(): Promise<void> {

    const walletObjArr = Array.from(WALLETS_MAP.values());

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
        await fsp.writeFile("./wallets.json", JSON.stringify(jsonData, null, 4), 'utf8');
        console.log('wallets.json file has been updated successfully.');
    } catch (error) {
        console.error(`Error writing to JSON file: ${error.message}`);
    }
}

export async function updateBalance(walletObj: Wallet): Promise<void> {
    const oldBalance = walletObj.balance;

    try {
        await walletObj.checkBalance();
    } catch (error) {
        console.log(`Your balance on the wallet named '${walletObj.walletName}' has been updated \
from '${oldBalance / LAMPORTS_PER_SOL}' SOL to '${walletObj.balance / LAMPORTS_PER_SOL}' SOL.`);

        WALLETS_MAP.set(walletObj.walletName, walletObj);
        writeWallets();
        return;
    }
    console.log(`Your balance on the wallet named '${walletObj.walletName}' is the same as it's recorded in wallets.json. \
Your balance: ${walletObj.balance / LAMPORTS_PER_SOL} SOL`);
}

export function selectWallet(): Promise<Wallet | null> {

    const wallets: Wallet[] = Array.from(WALLETS_MAP.values());

    if (wallets.length > 0) {
        console.log(chalk.yellow('Detected existing wallets:'));

        // Iterate though the wallets in the wallets.json
        let index: number = 0;
        wallets.forEach(wallet => {
            console.log(`[${++index}] - Wallet Name: ${wallet.walletName}, Public Key: ${wallet.publicKey}`);
        });

        // Let the user choose which wallet to use for this instance 
        // Create a Promise to handle the asynchronous input
        return new Promise((resolve) => {
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout,
            });

            rl.question('Please enter the order number of the wallet you want to interact with: \n', (orderNumber) => {
                const selectedWallet = wallets[parseInt(orderNumber, 10) - 1];

                if (selectedWallet) {
                    console.log(`You selected: Wallet Name: ${selectedWallet.walletName}, Public Key: ${selectedWallet.publicKey}`);
                    resolve(selectedWallet);
                } else {
                    console.log('Invalid order number. Please try again.');
                    resolve(null);
                }

                // Close the readline interface
                rl.close();
            });
        });
    } else {
        console.log(chalk.gray('No existing wallets detected. If you want to create one, check command "new --help".'));
        return Promise.resolve(null);
    }
}

