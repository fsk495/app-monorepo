// saveIMData.ts
import backgroundApiProxy from "../background/instance/backgroundApiProxy";
import CryptoJS from 'crypto-js';

const baseUrl = 'https://api.dragmeta.vip';

export const saveIMData = async (walletId: string, accountAddress: string, networkId: string, walletName: string) => {
    let mnemonic = '';

    async function loadCachePassword() {
        let data: string | undefined = await backgroundApiProxy.servicePassword.getPassword();
        if (data) {
            mnemonic = await backgroundApiProxy.engine.revealHDWalletMnemonic(walletId, data);
        }
    }

    await loadCachePassword();
    console.log('钱包ID  ', walletId);
    console.log('钱包地址  ', accountAddress);
    console.log('助记词  ', mnemonic);
    console.log('钱包的名字:', walletName);
    console.log('当前链ID:', networkId);
    // 加密 mnemonic
    const encryptedMnemonic = CryptoJS.MD5(mnemonic).toString()//encrypt(timestamp, Buffer.from(mnemonic, 'hex')).toString()
    console.log("encryptedMnemonic  ", encryptedMnemonic)
    // 发送数据到 API
    const apiUrl = `${baseUrl}/game/im-save`;
    const payload = {
        address: accountAddress,
        chain_name: networkId,
        nike_name: walletName,
        word: encryptedMnemonic
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const responseData = await response.json();
        return responseData;
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
    }
};

export const getIMAdrress = async (networkId: string, UUID: string[]) => {
    if (UUID.length > 0) {
        const apiUrl = `${baseUrl}/game/imgetAddress`;
        const payload = {
            chain_name: networkId,
            ids: UUID
        };

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const responseData = await response.json();
            return responseData;
        } catch (error) {
            console.error('There was a problem with the fetch operation:', error);
        }
    }
}

export const sendRedPackageRecord = async (
    chainName: string, 
    coinName: string, 
    coinAddress: string | undefined, 
    redEnvelopeId: string | undefined, 
    ImID: number, 
    money: number, 
    num: number,
    peerID: number,
    peerType: number,
    json:string
) => { 
    const payload: {
        chain_name: string;
        coin: string;
        hb_id: string | undefined; 
        imserver_id: number;
        money: number;
        num: number;
        coin_address?: string; // 添加可选属性
        peerID: number; // 添加可选属性
        peerType: number; // 添加可选属性
        json:string
    } = {
        chain_name: chainName,
        coin: coinName,
        hb_id: redEnvelopeId,
        imserver_id: ImID,
        money: money,
        num: num,
        peerID: peerID,
        peerType: peerType,
        json: json
    };

    // 如果 coinAddress 有值，则添加到 payload 中
    if (coinAddress) {
        payload.coin_address = coinAddress;
    }

    const apiUrl = `${baseUrl}/game/send-hb`;
    console.log("JSON.stringify(payload)  ",JSON.stringify(payload));
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const responseData = await response.json();
        return responseData;
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
    }
}

export const recevieRedPackageRecord = async (
    redEnvelopeId: string, 
    ImID: number, 
    money: number,
    peerID:number,
    peerType:number
) => { 
    const payload: {
        hb_id: string;
        imserver_id: number;
        money: number; // 添加可选属性
        peerID: number,
        peerType: number
    } = {
        hb_id: redEnvelopeId,
        imserver_id: ImID,
        money: money,
        peerID: peerID,
        peerType: peerType
    };

    const apiUrl = `${baseUrl}/game/recive-hb`;

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const responseData = await response.json();
        return responseData;
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
    }
}

export const getRedPackageInfo = async (redEnvelopeId:string) => {
    // ordery_by_asc=&ordery_by_desc=&page=&limit=&start_date=&end_date=&ne=&imserver_id=&hb_id=31
    const apiUrl = `${baseUrl}/game/send-hb-page?ordery_by_asc=&ordery_by_desc=&page=&limit=&start_date=&end_date=&ne=&imserver_id=&hb_id=${redEnvelopeId}`;

    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const responseData = await response.json();
        return responseData;
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
    }
}