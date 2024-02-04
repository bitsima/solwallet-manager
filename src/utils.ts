import * as chalk from 'chalk';
import * as readline from 'readline';
import * as fs from 'fs/promises';
import {
    Keypair,
    Connection,
    Transaction,
    SystemProgram,
    sendAndConfirmTransaction,
    PublicKey,
} from "@solana/web3.js";

import { CONNECTION } from './index';
import { Wallet } from './models/classes';
import { WalletJson } from './models/interfaces';

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


export function selectWallet() {
    readWallets().then(wallets => {

        if (wallets.length > 0) {
            console.log(chalk.yellow('Detected existing wallets:'));

            // Iterate though the wallets in the wallets.json
            let index: number = 0;
            wallets.forEach(wallet => {
                console.log(`[${++index}] - Wallet Name: ${wallet.walletName}, Public Key: ${wallet.publicKey}`);
            });

            // Let the user choose which wallet to use for this instance 
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout,
            });
            rl.question('Please enter the order number of the wallet you want to interact with: ', (orderNumber) => {

                const selectedWallet = wallets[parseInt(orderNumber, 10) - 1];

                if (selectedWallet) {
                    console.log(`You selected: Wallet Name: ${selectedWallet.walletName}, Public Key: ${selectedWallet.publicKey}, Secret Key: ${selectedWallet.secretKey}`);
                } else {
                    console.log('Invalid order number. Please try again.');
                }

                // Close the readline interface
                rl.close();

                return selectedWallet;
            });
        } else {
            console.log(chalk.gray('No existing wallets detected. If you want to create one or provide it yourself, check command "new".'));
        }
    });


}

/**
 * Allows the user to provide a key pair manually or generates a new key pair if they are not given, 
 * either way, this function saves the new wallet info to the wallets.json.
 * @param walletName the chosen arbitrary name to be given to the new wallet
 * @param publicKey optional argument that allows the user to provide the public key themselves
 */
export async function createWallet(walletName: string, publicKey?: string): Promise<void> {

    let secretKeyUint8Array;

    if (publicKey) {
        // Prompt the user to enter the secret key
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        rl.question('Please enter the secret key as a sequence of bytes (e.g., 255 0 127 ...): ', (byteInput) => {
            rl.close();

            const byteValues = byteInput.split(/\s+/).map(Number);
            secretKeyUint8Array = new Uint8Array(byteValues);
        });
    }

    // The case where the optional parameters are not given
    else if (!publicKey) {
        // New key pair generated
        const keypair = Keypair.generate();

        publicKey = keypair.publicKey.toBase58();
        console.log('Your generated public key is: ', publicKey);

        secretKeyUint8Array = keypair.secretKey;
    }

    const parsedWalletData = await readWallets();
    const newWallet = new Wallet(walletName, publicKey, secretKeyUint8Array);

    parsedWalletData.push(newWallet);

    parsedWalletData.forEach(walletObj => {
        const oldBalance = walletObj.balance;

        try {
            walletObj.checkBalance();
        } catch (error) {
            console.log(`Your balance has been updated from '${oldBalance}' to '${walletObj.balance}'.`)
        }
    });

    // Serializing the data back to JSON
    const jsonData = {
        'data': parsedWalletData.map(wallet => ({
            walletName: wallet.walletName,
            publicKey: wallet.publicKey,
            secretKey: Array.from(wallet.secretKey),
            balance: wallet.balance,
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

/*

export async function handleAirdropCommand(amount: number) {
    await airdrop(amount);
}

export async function handleBalanceCommand() {
    await checkBalance();
}

export async function handleTransferCommand(otherPublicKey: string, amount: number) {
    await transfer(otherPublicKey, amount);
}

export async function handleStatisticsCommand() {
    await getStatistics();
}

*/