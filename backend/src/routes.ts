import {FastifyInstance, FastifyReply, FastifyRequest} from "fastify";
import { Match } from "./db/entities/Match.js";
import {User} from "./db/entities/User.js";
import { Message } from "./db/entities/Messages.js";
import {ICreateUsersBody, ICreateMessageBody} from "./types.js";
import { promises as fs } from "fs";


async function DoggrRoutes(app: FastifyInstance, _options = {}) {
	if (!app) {
		throw new Error("Fastify instance has no value during routes construction");
	}
	
	app.get('/hello', async (request: FastifyRequest, reply: FastifyReply) => {
		return 'hello';
	});
	
	app.get("/dbTest", async (request: FastifyRequest, reply: FastifyReply) => {
		return request.em.find(User, {});
	});
	

	
	// Core method for adding generic SEARCH http method
	// app.route<{Body: { email: string}}>({
	// 	method: "SEARCH",
	// 	url: "/users",
	//
	// 	handler: async(req, reply) => {
	// 		const { email } = req.body;
	//
	// 		try {
	// 			const theUser = await req.em.findOne(User, { email });
	// 			console.log(theUser);
	// 			reply.send(theUser);
	// 		} catch (err) {
	// 			console.error(err);
	// 			reply.status(500).send(err);
	// 		}
	// 	}
	// });
	
	// CRUD
	// C
	app.post<{Body: ICreateUsersBody}>("/users", async (req, reply) => {
		const { name, email, petType} = req.body;
		
		try {
			const newUser = await req.em.create(User, {
				name,
				email,
				petType
			});
			
			await req.em.flush();
			
			console.log("Created new user:", newUser);
			return reply.send(newUser);
		} catch (err) {
			console.log("Failed to create new user", err.message);
			return reply.status(500).send({message: err.message});
		}
	});
	
	//READ
	app.search("/users", async (req, reply) => {
		const { email } = req.body;
		
		try {
			const theUser = await req.em.findOne(User, { email });
			console.log(theUser);
			reply.send(theUser);
		} catch (err) {
			console.error(err);
			reply.status(500).send(err);
		}
	});
	
	// UPDATE
	app.put<{Body: ICreateUsersBody}>("/users", async(req, reply) => {
		const { name, email, petType} = req.body;
		
		const userToChange = await req.em.findOne(User, {email});
		userToChange.name = name;
		userToChange.petType = petType;
		
		// Reminder -- this is how we persist our JS object changes to the database itself
		await req.em.flush();
		console.log(userToChange);
		reply.send(userToChange);
		
	});
	
	// DELETE
	app.delete<{ Body: {email}}>("/users", async(req, reply) => {
		const { email } = req.body;
		
		try {
			const theUser = await req.em.findOne(User, { email });
			
			await req.em.remove(theUser).flush();
			console.log(theUser);
			reply.send(theUser);
		} catch (err) {
			console.error(err);
			reply.status(500).send(err);
		}
	});

	// CREATE MATCH ROUTE
	app.post<{Body: { email: string, matchee_email: string }}>("/match", async (req, reply) => {
		const { email, matchee_email } = req.body;

		try {
			// make sure that the matchee exists & get their user account
			const matchee = await req.em.findOne(User, { email: matchee_email });
			// do the same for the matcher/owner
			const owner = await req.em.findOne(User, { email });

			//create a new match between them
			const newMatch = await req.em.create(Match, {
				owner,
				matchee
			});

			//persist it to the database
			await req.em.flush();
			// send the match back to the user
			return reply.send(newMatch);
		} catch (err) {
			console.error(err);
			return reply.status(500).send(err);
		}

	});



















	// Homework 1
	
	// DISPLAY ALL
	app.get("/dbTestMessages", async (request: FastifyRequest, reply: FastifyReply) => {
		return request.em.find(Message, {});
	});
	
	// READ ALL MESSAGES SENT TO ME
	app.search<{ Body: {receiver}}>("/messages", async(req, reply) => {
		const { receiver } = req.body;
		
		try {
			const theMessage = await req.em.find(Message, { receiver });
			
			// await req.em.remove(theMessage).flush();
			reply.send(theMessage);
		} catch (err) {
			console.error(err);
			reply.status(500).send(err);
		}
	});
	

	// READ ALL MESSAGES I'VE SENT TO OTHERS
	app.search<{ Body: {sender}}>("/messages/sent", async(req, reply) => {
		const { sender } = req.body;
		
		try {
			const theMessage = await req.em.find(Message, { sender });
			
			// await req.em.remove(theMessage).flush();
			reply.send(theMessage);
		} catch (err) {
			console.error(err);
			reply.status(500).send(err);
		}
	});
	
	
	
	const badWordsFile = await fs.readFile('/home/d/workspace/doggr_sp23/backend/src/db/badwords.txt', "utf-8");
  	const badWords = badWordsFile.split("\n");
	
	
	const checkForBadWords = (message) => {
		const escapedWords = badWords.map((word) => word.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'));
		const pattern = new RegExp(`\\b(${escapedWords.join('|')})\\b`, 'i');
		return pattern.test(message);
	};
	  
	
	
	// CREATE NEW MESAAGE
	app.post<{ Body: ICreateMessageBody }>("/messages", async (req, reply) => {
		const { sender, receiver, message} = req.body;
		
		try {
			const newMessage = await req.em.create(Message, {
				sender,
				receiver,
				message,
			});
					

			if (checkForBadWords(message)) {
				return reply.status(500).send({ message: 'Your message contains a bad word.' });
			} else {
				const newMessage = await req.em.create(Message, {
					sender,
					receiver,
					message,
				});
				
				await req.em.flush();
				
				console.log("Created new message:", newMessage);
				return reply.send(newMessage);
			}
			
		} catch (err) {
			console.log("Failed to create new message", err.message);
			return reply.status(500).send({message: err.message});
		}
	});

	
	
	
	const checkPassword = (req, reply, done) => {
		const authHeader = req.headers.authorization;
	  
		if (!authHeader || !authHeader.startsWith('Basic ')) {
		  return reply.status(401).send({ error: 'Unauthorized' });
		}
	  
		const encodedCredentials = authHeader.slice('Basic '.length);
		const decodedCredentials = Buffer.from(encodedCredentials, 'base64').toString('ascii');
		const [username, password] = decodedCredentials.split(':');
	  
		if (password !== process.env.PASSWORD) {
		  return reply.status(401).send({ error: 'Unauthorized' });
		}
	  
		done();
	  };
	  
	
	// DELETE
	app.delete<{ Body: {messageId}}>("/messages", { preHandler: checkPassword }, async(req, reply) => {
		const { messageId } = req.body;
		
		try {
			const theMessage = await req.em.findOne(Message, { messageId });
			
			console.log(theMessage);

			//soft delete
			theMessage.deleted_at = new Date();
			await req.em.flush();
			reply.send(theMessage);
			
			// await req.em.remove(theMessage).flush();
			// reply.send(theMessage);
		} catch (err) {
			console.error(err);
			reply.status(500).send(err);
		}
	});
	
	// DELETE ALL FROM SENDER
	app.delete<{ Body: {sender}}>("/messages/all", {preHandler: checkPassword }, async(req, reply) => {
		const { sender } = req.body;
		
		try {
			const theMessages = await req.em.find(Message, { sender });
			
			console.log(theMessages);

			//soft delete
			for (const message of theMessages) {
				message.deleted_at = new Date();
			  }
			await req.em.flush();
			reply.send(theMessages);
			
			// await req.em.remove(theMessages).flush();
			// reply.send(theMessages);
		} catch (err) {
			console.error(err);
			reply.status(500).send(err);
		}
	});
	
	
	// UPDATE
	app.put<{Body: {messageId, message}}>("/messages", async(req, reply) => {
		const { messageId, message} = req.body;
		
		const msgToChange = await req.em.findOne(Message, {messageId});
		msgToChange.message = message;
		
		// Reminder -- this is how we persist our JS object changes to the database itself
		await req.em.flush();
		console.log(msgToChange);
		reply.send(msgToChange);
		
	});
	
}





export default DoggrRoutes;
