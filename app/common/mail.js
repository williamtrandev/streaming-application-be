const nodemailer = require('nodemailer');
const exphbs = require('express-handlebars');
const nodemailerhbs = require('nodemailer-express-handlebars');
require('dotenv').config();

exports.sendMailToUser = async (user, subject, template, context) => {
	const transporter = nodemailer.createTransport({
		service: 'Gmail',
		auth: {
			user: process.env.MAIL_USER,
			pass: process.env.MAIL_PASS
		}
	});

	const hbs = exphbs.create({
		extname: '.hbs',
		defaultLayout: false,
	});

	// Template Handlebars cho email body
	transporter.use('compile', nodemailerhbs({
		viewEngine: hbs,
		viewPath: 'app/mails',
		extName: '.hbs',
	}));

	const mailOptions = {
		from: '"Coding Duo" <duostreaming@codingduo.com>',
		to: user.email,
		subject: subject,
		template: template,
		context: context,
	};

	await transporter.sendMail(mailOptions);
};
