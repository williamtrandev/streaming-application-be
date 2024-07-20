import dotenv from 'dotenv';
dotenv.config();

const sendMessageToTelegram = (message) => {
	const TELEGRAM_URL = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage?chat_id=${process.env.TELEGRAM_CHAT_ID}&text=${message}`
	fetch(TELEGRAM_URL)
}

export default sendMessageToTelegram;