import { ethers } from "@onekeyhq/engine/src/vaults/impl/evm/sdk/ethers";
import novaiMainABI from "../../assets/json/novaiMainABI.json";
import BigNumber from 'bignumber.js';
import { EIP1559Fee } from '@onekeyhq/engine/src/types/network';


const contractAddressNovai = '0x92F679EBE29E7Fd7Cb17d383B50Bc9cd306164f1';

const contractAddressBNB = '0x28E6AdBeb44585Ee89751256806c855C82Da32ad';

/**
 * 公共参数
 */
const commonParams = {
    timeLength: 86400, // 红包持续时间（24小时）
    gasLimit: 250000, // 默认 gas limit
};

const generateRandom8DigitNumber = () => {
    // 生成一个8位随机数字
    let random8DigitNumber = Math.floor(10000000 + Math.random() * 90000000);
    return random8DigitNumber;
}

const calculateChecksum = (Number: number) => {
    // 计算校验和
    let sum = 0;
    while (Number > 0) {
        sum += Number % 10;
        Number = Math.floor(Number / 10);
    }
    return sum;
}

export const generateUnique8DigitNumber = () => {
    let random8DigitNumber = generateRandom8DigitNumber();
    let checksum = calculateChecksum(random8DigitNumber);
    let lastDigitOfChecksum = checksum % 10;
    let unique8DigitNumber = parseInt(random8DigitNumber.toString() + lastDigitOfChecksum.toString());
    return unique8DigitNumber;
}

/**
 * 发红包
 * @param amount 红包金额
 * @param max_re 最大领取人数
 * @param rpc RPC 地址
 * @param privateKey 私钥
 * @param gas Gas 价格
 */
export const createRedEnvelope = async (password: string, amount: string, max_re: number, rpc: string, privateKey: string, gas: string | EIP1559Fee,networkId:string) => {
    try {
        let contractAddress = contractAddressNovai;
        if(networkId == 'evm--56')
        {
            contractAddress = contractAddressBNB;
        }
        console.log("networkId   ",networkId);
        console.log("contractAddress   ",contractAddress);
        const provider = new ethers.providers.JsonRpcProvider(rpc);
        const signer = new ethers.Wallet(privateKey, provider);
        const contract = new ethers.Contract(contractAddress, novaiMainABI, signer);
        console.log('signer   ',signer);
        // 获取用户余额
        const balance = await signer.getBalance();
        console.log('User balance:', ethers.utils.formatEther(balance));
        // 估算 gasLimit
        const gasLimit = commonParams.gasLimit
        // 计算 gas price
        const gasPrice = new BigNumber(gas as string).times(new BigNumber(10).pow(18));
        console.log("gasPrice   ", gasPrice.toString());

        // 计算总交易成本
        const value = new BigNumber(amount).times(new BigNumber(10).pow(18));
        const gasCost = gasPrice.times(gasLimit);
        const totalCost = gasCost.plus(value);
        console.log('Total transaction cost:', totalCost.toString());
        
        // 检查用户余额是否足够
        if (new BigNumber(ethers.utils.formatEther(balance)).times(new BigNumber(10).pow(18)).lt(totalCost)) {
            return { success: false, error: 'The balance is insufficient.' }
        }
        console.log("ethers.utils.formatBytes32String(password)  ", ethers.utils.formatBytes32String(password))
        // 发送交易调用 createRedEnvelope 方法
        const tx = await contract.createRedEnvelope(
            ethers.utils.formatBytes32String(password),
            0,
            max_re,
            commonParams.timeLength,
            {
                value: ethers.BigNumber.from(value.toFixed()),
                gasPrice: ethers.BigNumber.from(gasPrice.toFixed()),
                gasLimit: gasLimit
            },
        );
        console.log('Transaction sent:  ', tx);

        // 等待交易确认
        const receipt = await tx.wait();
        console.log(`交易成功确认:       `, receipt);

        const redEnvelopeId = ethers.BigNumber.from(receipt.events[0].data.slice(0, 66)).toNumber();
        console.log("2222  ", redEnvelopeId)
        return { success: true, redEnvelopeId: redEnvelopeId.toString(),password: ethers.utils.formatBytes32String(password)};
    } catch (error) {
        console.log("createRedEnvelope error:", error);
        return { success: false, error: '😵 Transaction Failed' };
    }
};

/**
 * 收红包
 * @param redEnvelopeId 红包ID
 * @param password 红包口令
 * @param rpc RPC 地址
 * @param privateKey 私钥
 */
export const getRedEnvelope = async (redEnvelopeId: number, password: string, rpc: string, privateKey: string, gas: string | EIP1559Fee,networkId:string) => {
    try {
        console.log("获取红包 红包ID ", redEnvelopeId);
        console.log("获取红包 原红包口令 ", password);
        console.log("获取红包 rpc 地址  ", rpc);
        console.log("获取红包 privateKey  ", privateKey);
        let contractAddress = contractAddressNovai;
        if(networkId == 'evm--56')
        {
            contractAddress = contractAddressBNB;
        }

        console.log("networkId   ",networkId);
        console.log("contractAddress   ",contractAddress);
        const provider = new ethers.providers.JsonRpcProvider(rpc);
        const signer = new ethers.Wallet(privateKey, provider);
        const contract = new ethers.Contract(contractAddress, novaiMainABI, signer);

        // 计算 gas price
        const gasPrice = new BigNumber(gas as string).times(new BigNumber(10).pow(18));
        console.log("获取红包 gasPrice ", gasPrice);
        let tot = "hongbao123";
        const usePassWord = ethers.utils.solidityKeccak256(['string', 'bytes32', 'address'], [tot, password, signer.address]);
        console.log("使用的password  ", usePassWord);

        // 发送交易调用 getRedEnvelope 方法
        const tx = await contract.getRedEnvelope(redEnvelopeId, usePassWord, {
            gasLimit: commonParams.gasLimit,
            gasPrice: ethers.BigNumber.from(gasPrice.toFixed())
        });
        console.log('交易成功 : 1 ', tx);
        console.log('等待交易确认 ');

        // 等待交易确认
        const receipt = await tx.wait();
        console.log(`交易确认成功:`, receipt);
        console.log(`获取领到的金额`);

        const GetRedEnvelopeEvent = receipt.events.find((event: { event: string; }) => event.event === 'GetRedEnvelope');
        if (GetRedEnvelopeEvent && GetRedEnvelopeEvent.args) {
            console.log("GetRedEnvelopeEvent.args   ", GetRedEnvelopeEvent.args);
            const amountInfo = GetRedEnvelopeEvent.args[1];
            // 检查 amountInfo.hex 是否为 undefined
            if (amountInfo) {
                const amountInWei = ethers.BigNumber.from(amountInfo); // 假设第二个参数是红包金额
                const amountInEther = ethers.utils.formatEther(amountInWei);

                console.log(`红包金额（以太币）:`, amountInEther);
                console.log(`amountInfo:`, amountInfo);
                return { success: true, amount: amountInEther, redEnvelopeId: redEnvelopeId.toString() };
            } else {
                console.error("Invalid amountInfo.hex value");
                return { success: false, amount: '0' };
            }
        } else {
            return { success: false, amount: '0' };
        }
        // return receipt;
    } catch (error) {
        console.log("getRedEnvelope error:", error);
        return;
    }
};

/**
 * 领取过期红包
 * @param redEnvelopeId 红包ID
 * @param rpc RPC 地址
 * @param privateKey 私钥
 * @param gas gas费
 * @returns 
 */
export const ExpiredRedEnvelope = async (redEnvelopeId: number, rpc: string, privateKey: string, gas: string | EIP1559Fee,networkId:string) => {
    console.log(" 领取过期红包    ", redEnvelopeId);
    try {
        let contractAddress = contractAddressNovai;
        if(networkId == 'evm--56')
        {
            contractAddress = contractAddressBNB;
        }
        const provider = new ethers.providers.JsonRpcProvider(rpc);
        const signer = new ethers.Wallet(privateKey, provider);
        const contract = new ethers.Contract(contractAddress, novaiMainABI, signer);
        console.log("redEnvelopeId   ", redEnvelopeId);
        // 计算 gas price
        const gasPrice = new BigNumber(gas as string).times(new BigNumber(10).pow(18));
        // 发送交易调用 withdraw 方法
        const tx = await contract.withdraw(redEnvelopeId, {
            gasLimit: commonParams.gasLimit,
            gasPrice: ethers.BigNumber.from(gasPrice.toFixed())
        });
        console.log('Transaction sent:', tx.hash);

        // // 等待交易确认
        const receipt = await tx.wait();
        console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
        console.log(`Transaction receipt:`, receipt);
        // 提取 Withdraw 事件
        const withdrawEvent = receipt.events.find((event: { event: string; }) => event.event === 'Withdraw');
        console.log("withdrawEvent.args  ",withdrawEvent.args)
        
        if (withdrawEvent && withdrawEvent.args) {
            const qqqqq = withdrawEvent.args[1];
            const amountInWei = withdrawEvent.args[2]; // 假设第二个参数是红包金额
            const amountInEther = ethers.utils.formatEther(amountInWei);

            console.log(`红包金额（以太币）:`, amountInEther);
            console.log(`qqqqq:`, qqqqq);
            return { success: true, amount: amountInEther };
        } else {
            return { success: false, amount: 0 };
        }
    } catch (error) {
        console.log("withdrawRedEnvelope error:", error);
        return;
    }
}

export const getLeftMoney = async (redEnvelopeId: number, rpc: string, privateKey: string,networkId:string) => { 
    console.log("获取剩余金额    ", redEnvelopeId);
    try {
        let contractAddress = contractAddressNovai;
        if(networkId == 'evm--56')
        {
            contractAddress = contractAddressBNB;
        }
        const provider = new ethers.providers.JsonRpcProvider(rpc);
        const signer = new ethers.Wallet(privateKey, provider);
        const contract = new ethers.Contract(contractAddress, novaiMainABI, signer);
        console.log("redEnvelopeId   ", redEnvelopeId);
        
        // 发送交易调用 getLeftMoney 方法
        const result = await contract.getLeftMoney(redEnvelopeId);
        console.log('Transaction result:', result);
        
        // 将返回的 BigNumber 转换为十进制字符串
        const decimalValue = result.toString();
        console.log('Decimal value:', decimalValue);
        
        return decimalValue;
    } catch (error) {
        console.log("getLeftMoney error:", error);
        return;
    }
}