import express from 'express';
import authRouter from './auth.js';
import userRouter from './user.js';
import chatRouter from './chat.js';
import studioRouter from './studio.js';
import searchRouter from './search.js';
import streamRouter from './stream.js';
import historyRouter from './history.js';

const route = (app) => {
	const apiRouter = express.Router();

	apiRouter.use('/auth/', authRouter);
	apiRouter.use('/user/', userRouter);
	apiRouter.use('/chat/', chatRouter);
	apiRouter.use('/studio/', studioRouter);
	apiRouter.use('/search/', searchRouter);
	apiRouter.use('/stream/', streamRouter);
	apiRouter.use('/history/', historyRouter);

	app.use('/api/v1/', apiRouter);

	app.use((req, res, next) => {
		res.status(404).json({
			title: 'Trang không tìm thấy',
			content: '404 - Trang không tồn tại',
			desc: 'Trang bạn đang tìm không tồn tại. Quay về trang chủ'
		});
	});

	// Middleware bắt lỗi 500
	app.use((err, req, res, next) => {
		console.error(err.stack);
		res.status(500).json({
			title: 'Lỗi',
			content: '500 - Lỗi server',
			desc: 'Lỗi server. Quay về trang chủ'
		});
	});
};

export default route;
