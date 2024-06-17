import nodemailer from 'nodemailer';
import exphbs from 'express-handlebars';
import nodemailerhbs from 'nodemailer-express-handlebars';
import dotenv from 'dotenv';

dotenv.config();

const sendMailToUser = async (email, subject, template, context) => {
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
		to: email,
		subject: subject,
		template: template,
		context: context,
	};

	try {
		await transporter.sendMail(mailOptions);
		console.log(`Email sent successfully to ${email}`);
	} catch (error) {
		console.error(`Error sending email to ${email}:`, error);
		throw error;
	}
};

export { sendMailToUser };
