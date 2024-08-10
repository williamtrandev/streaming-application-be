import Stream from "../models/Stream.js";
import User from "../models/User.js";
import { getObjectURL, putImageObject } from "../common/s3.js";
import { ObjectId } from 'mongodb';
import { S3_PATH, ROLE_MOD } from "../constants/index.js";

export const generateStream = async (numUsers, numStream) => {
	try {
		const apiImage = "https://picsum.photos/640/360"
		const users = await User.find().limit(numUsers);
		const popularTags = [
			'Gaming', 'Music', 'Talk Show', 'Technology', 'Education',
			'Cooking', 'Fitness', 'Travel', 'News', 'Lifestyle',
			'Art', 'Sports', 'Events', 'DIY', 'Comedy',
			'Podcast', 'ASMR', 'Virtual Reality (VR)', 'Esports', 'Motivation'
		];
		const getRandomTags = (tagsList, min, max) => {
			const numTags = Math.floor(Math.random() * (max - min + 1)) + min;
			const shuffled = tagsList.sort(() => 0.5 - Math.random());
			return shuffled.slice(0, numTags);
		};
		const getImageBase64 = async (imageUrl) => {
			try {
				const response = await fetch(imageUrl);
				if (!response.ok) {
					throw new Error(`Failed to fetch image: ${response.statusText}`);
				}
				const buffer = Buffer.from(await response.arrayBuffer());
				const base64 = buffer.toString('base64');
				const mimeType = response.headers.get('content-type');
				return `data:${mimeType};base64,${base64}`;
			} catch (error) {
				console.error("Error fetching image:", error);
				throw error;
			}
		};
		const streamPromises = Array.from({ length: numStream }, async (_, i) => {
			const randomUser = users[Math.floor(Math.random() * users.length)];
			const base64Image = await getImageBase64(apiImage);
			const title = `Stream Title ${i + 1}`;
			const description = `Description for stream ${i + 1}`;
			const dateStream = new Date(Date.now() + Math.floor(Math.random() * 1000000000));
			const tags = getRandomTags(popularTags, 3, 5);
			const rerun = Math.random() > 0.5;
			const type = base64Image.split(';')[0].split('/')[1];
			const streamId = new ObjectId();
			const imageKey = `${S3_PATH.STUDIO}/${streamId.toString()}.${type}`;


			const base64Data = Buffer.from(base64Image.replace(/^data:image\/\w+;base64,/, ""), 'base64');
			await putImageObject(imageKey, base64Data);

			return {
				_id: streamId,
				user: randomUser._id,
				title,
				description,
				dateStream,
				tags,
				rerun,
				s3: {
					key: imageKey,
					contentType: `image/${type}`
				}
			};
		});

		const streams = await Promise.all(streamPromises);
		const bulkOps = streams.map(stream => ({
			updateOne: {
				filter: { user: stream.user, title: stream.title }, 
				update: {
					$set: {
						user: stream.user,
						title: stream.title,
						description: stream.description,
						dateStream: stream.dateStream,
						tags: stream.tags,
						rerun: stream.rerun,
						"s3.key": stream.s3.key,
						"s3.contentType": stream.s3.contentType,
					},
				},
				upsert: true, 
			},
		}));

		await Stream.bulkWrite(bulkOps);
	} catch (error) {
		console.error("An error occurred while generating:", error);
	}
};
